"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import Cloudscape from "@/components/forgeui/cloudscape";

interface Props {
  engagementId: string;
  token: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY = (id: string) => `intake_chat_${id}`;

const OPENER = "Hi! I'm going to ask you a few questions to put together your pitch deck — should only take a few minutes. Let's start: what's your company called, and what's the one-liner pitch?";

// Statuses where the engagement itself is invalid/finished — no amount of
// retrying will fix it, so we end the conversation instead of leaving the
// founder typing into a dead chat.
const TERMINAL_STATUSES = new Set([403, 404, 409]);
const REQUEST_TIMEOUT_MS = 45_000;

async function fetchJson(url: string, body: unknown): Promise<{ status: number; data: unknown }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } finally {
    clearTimeout(timeout);
  }
}

export default function IntakeChat({ engagementId, token }: Props) {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return [{ role: "assistant", content: OPENER }];
    try {
      const saved = localStorage.getItem(STORAGE_KEY(engagementId));
      if (saved) {
        const parsed = JSON.parse(saved) as { messages: ChatMessage[] };
        if (parsed.messages?.length) return parsed.messages;
      }
    } catch { /* ignore */ }
    return [{ role: "assistant", content: OPENER }];
  });
  const [collected, setCollected] = useState<Record<string, unknown>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY(engagementId));
      if (saved) return (JSON.parse(saved) as { collected: Record<string, unknown> }).collected ?? {};
    } catch { /* ignore */ }
    return {};
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY(engagementId), JSON.stringify({ messages, collected }));
    } catch { /* ignore */ }
  }, [messages, collected, engagementId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    if (!sending && !done && !fatalError) inputRef.current?.focus();
  }, [sending, done, fatalError]);

  // Posts the given history to /api/intake/chat and applies the result.
  // `retryText` is set when re-attempting a previously-failed send, so a
  // renewed failure can offer Retry again without re-appending the user
  // bubble (it's already in `history`/`messages`).
  async function postTurn(history: ChatMessage[], retryText?: string) {
    setSending(true);
    setError(null);

    try {
      const { status, data } = await fetchJson("/api/intake/chat", {
        engagementId,
        token,
        history,
        collected,
      });

      if (status < 200 || status >= 300) {
        const msg = (data as { error?: string })?.error ?? "Something went wrong";
        if (TERMINAL_STATUSES.has(status)) {
          setFatalError(msg);
          try { localStorage.removeItem(STORAGE_KEY(engagementId)); } catch { /* ignore */ }
          return;
        }
        setLastFailedText(retryText ?? history[history.length - 1]?.content ?? null);
        setError(msg);
        return;
      }

      const turn = data as {
        message: string;
        collected: Record<string, unknown>;
        done: boolean;
        finalData?: Record<string, unknown>;
      };
      setCollected(turn.collected);
      setMessages((m) => [...m, { role: "assistant", content: turn.message }]);
      if (turn.done && turn.finalData) {
        setDone(true);
        await submitFinal(turn.finalData);
      }
    } catch (err) {
      setLastFailedText(retryText ?? history[history.length - 1]?.content ?? null);
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "That took too long to respond. Please try again."
          : "Something went wrong. Try again."
      );
    } finally {
      setSending(false);
    }
  }

  function send(userText: string) {
    const nextHistory = [...messages, { role: "user" as const, content: userText }];
    setMessages(nextHistory);
    setInput("");
    void postTurn(nextHistory);
  }

  async function submitFinal(finalData: Record<string, unknown>) {
    setSubmitting(true);
    setError(null);
    try {
      const { status, data } = await fetchJson("/api/intake/submit", {
        engagementId,
        token,
        ...finalData,
      });

      if (status < 200 || status >= 300) {
        const msg = (data as { error?: string })?.error ?? "We couldn't quite finish submitting — mind clarifying a detail?";
        if (TERMINAL_STATUSES.has(status)) {
          setFatalError(msg);
          try { localStorage.removeItem(STORAGE_KEY(engagementId)); } catch { /* ignore */ }
          return;
        }
        throw new Error(msg);
      }

      localStorage.removeItem(STORAGE_KEY(engagementId));
      router.push(`/deck/${engagementId}?token=${encodeURIComponent(token)}`);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "That took too long. Please try again."
          : err instanceof Error
            ? err.message
            : "Something went wrong"
      );
      setDone(false);
      setSubmitting(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending || done || fatalError) return;
    send(text);
  }

  function handleRetry() {
    if (!lastFailedText || sending) return;
    // The failed attempt's user bubble is already in `messages` — re-post
    // the same history without re-appending it.
    const text = lastFailedText;
    setLastFailedText(null);
    void postTurn(messages, text);
  }

  return (
    <main className="relative flex min-h-screen flex-col items-center px-4 py-10" style={{ fontFamily: "var(--font-af)" }}>
      <Cloudscape
        colorBottom="#a8c8e8"
        colorMid="#d4e8d4"
        colorTop="#e8e4f0"
        speed={1.2}
        height="100dvh"
        className="pointer-events-none"
        style={{ position: "fixed", inset: 0, zIndex: -1, width: "100vw", height: "100dvh" }}
      />

      <div className="mb-6">
        <span
          className="text-[16px] font-[400] leading-none tracking-[-0.32px]"
          style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}
        >
          Series A <span style={{ color: "var(--color-hudson-blue)" }}>HUB</span>
        </span>
      </div>

      <a
        href={`/intake/${engagementId}/form?token=${encodeURIComponent(token)}`}
        className="mb-4 text-[12px] underline underline-offset-2"
        style={{ color: "var(--color-steel)", textDecorationColor: "var(--color-sage)" }}
      >
        Prefer a written form instead?
      </a>

      <div
        className="relative flex w-full max-w-[560px] flex-1 flex-col rounded-[16px]"
        style={{
          background: "rgba(255,255,255,0.85)",
          border: "1px solid rgba(0,0,0,0.08)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
          minHeight: "70vh",
          maxHeight: "80vh",
        }}
      >
        {fatalError ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-full"
              style={{ background: "var(--color-linen)", border: "1px solid var(--color-sage)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-iron)" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
              </svg>
            </div>
            <p className="text-[14px] leading-[1.6]" style={{ color: "var(--color-steel)" }}>
              {fatalError}
            </p>
            <a
              href="mailto:support@pitchready.co"
              className="text-[14px] font-[500] underline underline-offset-4"
              style={{ color: "var(--color-iron)", textDecorationColor: "var(--color-sage)" }}
            >
              Contact support →
            </a>
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-6"
            aria-live="polite"
          >
            {messages.map((m, i) => (
              <ChatBubble key={i} role={m.role} content={m.content} />
            ))}
            {sending && <TypingBubble />}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2" role="alert"
              >
                <p className="text-[12px]" style={{ color: "#dc2626" }}>⚠ {error}</p>
                {lastFailedText && (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="text-[12px] font-[500] underline underline-offset-2"
                    style={{ color: "var(--color-hudson-blue)" }}
                  >
                    Retry
                  </button>
                )}
              </motion.div>
            )}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-end gap-2 border-t px-4 py-3"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder={fatalError ? "This interview has ended." : done ? "Submitting your answers…" : "Type your answer…"}
            disabled={sending || done || submitting || !!fatalError}
            rows={1}
            style={{
              flex: 1, resize: "none", maxHeight: "120px",
              fontFamily: "var(--font-af)", fontSize: "15px", color: "var(--color-ink)",
              background: "rgba(255,255,255,0.92)", border: "1px solid #b8bdb8",
              borderRadius: "10px", padding: "10px 14px", outline: "none",
              opacity: fatalError ? 0.6 : 1,
            }}
          />
          <button
            type="submit"
            disabled={sending || done || submitting || !!fatalError || !input.trim()}
            style={{
              flexShrink: 0, height: "40px", padding: "0 16px", borderRadius: "10px",
              background: "var(--color-ink)", color: "white", border: "none",
              fontFamily: "var(--font-af)", fontSize: "14px", fontWeight: 500,
              cursor: sending || done || submitting || !!fatalError || !input.trim() ? "not-allowed" : "pointer",
              opacity: sending || done || submitting || !!fatalError || !input.trim() ? 0.5 : 1,
            }}
          >
            {submitting ? "Submitting…" : "Send"}
          </button>
        </form>
      </div>
    </main>
  );
}

function ChatBubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}
    >
      <div
        style={{
          maxWidth: "82%",
          padding: "10px 14px",
          borderRadius: "14px",
          fontSize: "14px",
          lineHeight: 1.55,
          fontFamily: "var(--font-af)",
          whiteSpace: "pre-wrap",
          background: isUser ? "var(--color-hudson-blue)" : "rgba(0,0,0,0.05)",
          color: isUser ? "white" : "var(--color-ink)",
          borderBottomRightRadius: isUser ? "4px" : "14px",
          borderBottomLeftRadius: isUser ? "14px" : "4px",
        }}
      >
        {content}
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div
        style={{
          display: "flex", gap: "4px", alignItems: "center",
          padding: "12px 16px", borderRadius: "14px", borderBottomLeftRadius: "4px",
          background: "rgba(0,0,0,0.05)",
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#9a9f9a" }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}
