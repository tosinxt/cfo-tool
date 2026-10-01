"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import Cloudscape from "@/components/forgeui/cloudscape";

interface Props {
  engagementId: string;
  token: string;
  /**
   * Answers already saved server-side (from the written form, or an earlier
   * session on another device). Folded into `collected` so the interviewer
   * doesn't re-ask what the founder has already answered.
   */
  serverAnswers?: Record<string, unknown>;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface Progress {
  covered: number;
  total: number;
}

const STORAGE_KEY = (id: string) => `intake_chat_${id}`;

const OPENER = "Hi! I'm going to ask you a few questions to put together your pitch deck — should only take a few minutes. Let's start: what's your company called, and what's the one-liner pitch?";

const RESUME_OPENER = "Hi! I can see you already answered some of this on the written form — I've carried those answers over, so I'll only ask about what's missing. Ready to pick up where you left off?";


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

export default function IntakeChat({ engagementId, token, serverAnswers }: Props) {
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
    const hasFormDraft = Object.keys(serverAnswers ?? {}).length > 0;
    return [{ role: "assistant", content: hasFormDraft ? RESUME_OPENER : OPENER }];
  });
  // Chat's own extraction wins over the form draft: it is the fresher signal
  // once the founder is actually talking to the interviewer.
  const [collected, setCollected] = useState<Record<string, unknown>>(() => {
    if (typeof window === "undefined") return {};
    let chat: Record<string, unknown> = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY(engagementId));
      if (saved) chat = (JSON.parse(saved) as { collected: Record<string, unknown> }).collected ?? {};
    } catch { /* ignore */ }
    return { ...(serverAnswers ?? {}), ...chat };
  });
  const [progress, setProgress] = useState<Progress | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY(engagementId));
      if (saved) return (JSON.parse(saved) as { progress?: Progress }).progress ?? null;
    } catch { /* ignore */ }
    return null;
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [lastFailedText, setLastFailedText] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY(engagementId), JSON.stringify({ messages, collected, progress }));
    } catch { /* ignore */ }
  }, [messages, collected, progress, engagementId]);

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
        progress?: Progress;
      };
      setCollected(turn.collected);
      if (turn.progress) setProgress(turn.progress);
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
      // The chat cannot reliably judge how sure a founder is, so every answer
      // it gathered is submitted as an estimate. The founder confirms or
      // downgrades each one on the confirmation step.
      const confidence: Record<string, "estimate"> = {};
      for (const id of Object.keys(finalData)) confidence[id] = "estimate";

      const branch = finalData.industry_branch;
      const { status, data } = await fetchJson("/api/intake/submit", {
        engagementId,
        token,
        business_type: "b2b",
        industry_branch: branch,
        answers: finalData,
        confidence,
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
      // The deck isn't ready at submit time — land on the confirmation page;
      // the client gets an email with the deck link when it's delivered.
      router.push(`/intake/${engagementId}/confirmed?token=${encodeURIComponent(token)}`);
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

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("engagementId", engagementId);
      body.append("token", token);
      body.append("file", file);
      const branch = collected.industry_branch;
      if (typeof branch === "string") body.append("branch", branch);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000);
      let res: Response;
      try {
        res = await fetch("/api/intake/upload", { method: "POST", body, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        fields?: Record<string, unknown>;
      };

      if (!res.ok) {
        if (TERMINAL_STATUSES.has(res.status)) {
          setFatalError(data.error ?? "Something went wrong");
          return;
        }
        setError(data.error ?? "We couldn't process that file.");
        return;
      }

      // Answers the founder already gave in chat win over the document's.
      const fresh = Object.entries(data.fields ?? {}).filter(([id]) => !(id in collected));
      setCollected((c) => ({ ...Object.fromEntries(fresh), ...c }));
      const note =
        fresh.length > 0
          ? `I read ${file.name} and pulled ${fresh.length} answer${fresh.length === 1 ? "" : "s"} from it, so I'll only ask about what's still missing. Correct me if anything I picked up looks off.`
          : `I read ${file.name}, but didn't find anything new to add. Let's keep going.`;
      setMessages((m) => [...m, { role: "assistant", content: note }]);
    } catch (err) {
      setError(
        err instanceof Error && err.name === "AbortError"
          ? "That took too long. Please try a smaller file."
          : "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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
        Prefer a written form instead? Your answers carry over.
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
        {!fatalError && (
          <div className="border-b px-5 pb-3 pt-4" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
            <div className="mb-2 flex items-baseline justify-between gap-3">
              <span
                className="text-[11px] font-[500] uppercase tracking-[0.06em]"
                style={{ color: "var(--color-steel)" }}
              >
                {done ? "All topics covered" : "Interview progress"}
              </span>
              {progress && !done && (
                <span className="text-[11px] tabular-nums" style={{ color: "var(--color-steel)" }}>
                  {progress.covered} of {progress.total} topics
                </span>
              )}
            </div>
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress?.total ?? 100}
              aria-valuenow={done ? (progress?.total ?? 100) : (progress?.covered ?? 0)}
              aria-label="Interview progress"
              style={{ height: "4px", borderRadius: "99px", background: "rgba(0,0,0,0.07)", overflow: "hidden" }}
            >
              <motion.div
                style={{ height: "100%", borderRadius: "99px", background: "var(--color-hudson-blue)" }}
                initial={false}
                animate={{ width: done ? "100%" : `${progress ? Math.round((progress.covered / progress.total) * 100) : 0}%` }}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              />
            </div>
          </div>
        )}

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
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.csv,.md,.markdown"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || sending || done || submitting || !!fatalError}
            title="Upload a pitch deck, financials, or notes (PDF, PowerPoint, CSV, Markdown — up to 4 MB) and we'll pre-fill what we can"
            aria-label="Upload a document"
            style={{
              flexShrink: 0, height: "40px", padding: "0 12px", borderRadius: "10px",
              background: "transparent", color: "var(--color-ink)", border: "1px solid #b8bdb8",
              fontFamily: "var(--font-af)", fontSize: "13px",
              cursor: uploading || sending || done || submitting || !!fatalError ? "not-allowed" : "pointer",
              opacity: uploading || sending || done || submitting || !!fatalError ? 0.5 : 1,
            }}
          >
            {uploading ? "Reading…" : "Upload"}
          </button>
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
