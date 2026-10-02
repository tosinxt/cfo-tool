"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { AlertCircle, ArrowUp, Check, LoaderCircle, Mic, Paperclip, Pause, Play, Type } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThinkingOrb, type OrbState } from "thinking-orbs";
import { QUESTIONS_BY_ID } from "@/lib/intake/bank";
import { formatDuration, useVoiceRecorder, type Recording } from "./useVoiceRecorder";
import { IconButton, RecordingBar } from "./VoiceControls";

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

interface VoiceNote extends Recording {
  /** Object URL for playback. Only valid this session, so never persisted. */
  url?: string;
  transcribing?: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  /** For a voice note, its transcript — that's what the interviewer reads. */
  content: string;
  voice?: VoiceNote;
  /** Labels of the fields this assistant turn saved, shown as a chip under it. */
  saved?: string[];
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
/** Labels of fields whose value is new or changed between two `collected` snapshots. */
function savedLabels(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return Object.entries(after)
    .filter(([id, v]) => v !== "" && v != null && JSON.stringify(v) !== JSON.stringify(before[id]))
    .map(([id]) => fieldLabel(id))
    .filter((label): label is string => !!label);
}

function fieldLabel(id: string): string | undefined {
  const q = QUESTIONS_BY_ID[id];
  return q?.promptLabel ?? q?.label;
}

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
        // Drop a voice note whose transcription was interrupted by a reload.
        const restored = parsed.messages?.filter((m) => m.content);
        if (restored?.length) return restored;
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
  const [transcribing, setTranscribing] = useState(false);
  // Index of the assistant message currently being revealed word by word.
  const [revealIdx, setRevealIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const persisted = messages.map((m) =>
        m.voice ? { ...m, voice: { durationSec: m.voice.durationSec, peaks: m.voice.peaks } } : m
      );
      localStorage.setItem(STORAGE_KEY(engagementId), JSON.stringify({ messages: persisted, collected, progress }));
    } catch { /* ignore */ }
  }, [messages, collected, progress, engagementId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, uploading, revealIdx]);

  function scrollToBottom() {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }

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
        history: history.map(({ role, content }) => ({ role, content })),
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
      const saved = savedLabels(collected, turn.collected);
      setCollected(turn.collected);
      if (turn.progress) setProgress(turn.progress);
      setMessages([...history, { role: "assistant", content: turn.message, ...(saved.length ? { saved } : {}) }]);
      setRevealIdx(history.length);
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
      const saved = fresh.map(([id]) => fieldLabel(id)).filter((l): l is string => !!l);
      setMessages((m) => [...m, { role: "assistant", content: note, ...(saved.length ? { saved } : {}) }]);
      setRevealIdx(messages.length);
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

  // A voice note is a chat turn: show it straight away, transcribe it, then
  // send the transcript to the interviewer like a typed answer.
  async function sendVoice(file: File, rec: Recording) {
    const base = messages;
    const voice: VoiceNote = { ...rec, url: URL.createObjectURL(file) };
    setMessages([...base, { role: "user", content: "", voice: { ...voice, transcribing: true } }]);
    setTranscribing(true);
    setError(null);

    try {
      const body = new FormData();
      body.append("engagementId", engagementId);
      body.append("token", token);
      body.append("file", file);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000);
      let res: Response;
      try {
        res = await fetch("/api/intake/transcribe", { method: "POST", body, signal: controller.signal });
      } finally {
        clearTimeout(timeout);
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string; text?: string };

      if (!res.ok || !data.text) {
        if (TERMINAL_STATUSES.has(res.status)) {
          setFatalError(data.error ?? "Something went wrong");
          return;
        }
        throw new Error(data.error ?? "We couldn't transcribe that voice note. Please try again.");
      }

      const nextHistory = [...base, { role: "user" as const, content: data.text, voice }];
      setMessages(nextHistory);
      void postTurn(nextHistory);
    } catch (err) {
      setMessages(base);
      URL.revokeObjectURL(voice.url!);
      setError(
        err instanceof Error && err.name !== "AbortError"
          ? err.message
          : "That took too long. Please try a shorter voice note."
      );
    } finally {
      setTranscribing(false);
    }
  }

  const recorder = useVoiceRecorder((file, rec) => void sendVoice(file, rec), setError);

  const busy = sending || transcribing || done || submitting || !!fatalError;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;
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

  const isWelcome = messages.length === 1 && messages[0].role === "assistant";
  const lastAssistantIdx = messages.map((m) => m.role).lastIndexOf("assistant");
  const pct = done ? 100 : progress ? Math.round((progress.covered / progress.total) * 100) : 0;

  return (
    <main
      className="flex h-dvh flex-col"
      style={{ fontFamily: "var(--font-af)", background: "var(--color-linen)" }}
    >
      <header className="relative flex h-14 flex-shrink-0 items-center justify-between gap-4 px-4 sm:px-6">
        <span
          className="text-[16px] font-[400] leading-none tracking-[-0.32px]"
          style={{ fontFamily: "var(--font-ppmondwest)", fontFeatureSettings: '"liga" 0', color: "var(--color-ink)" }}
        >
          Series A <span style={{ color: "var(--color-hudson-blue)" }}>HUB</span>
        </span>
        <div className="flex items-center gap-4 text-[12px]" style={{ color: "var(--color-steel)" }}>
          {!fatalError && (
            <span className="tabular-nums">
              {done ? "All topics covered" : progress ? `${progress.covered} of ${progress.total} topics` : "Interview"}
            </span>
          )}
          <a
            href={`/intake/${engagementId}/form?token=${encodeURIComponent(token)}`}
            className="rounded-sm underline underline-offset-2 hover:text-[var(--color-ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-hudson-deep)]"
            style={{ textDecorationColor: "var(--color-mist)" }}
          >
            Written form
          </a>
        </div>
        {!fatalError && (
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={pct}
            aria-label="Interview progress"
            className="absolute inset-x-0 bottom-0 h-[2px]"
            style={{ background: "rgba(0,0,0,0.06)" }}
          >
            <motion.div
              className="h-full"
              style={{ background: "var(--color-hudson-deep)" }}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        )}
      </header>

      {fatalError ? (
        <div className="mx-auto flex max-w-[480px] flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "var(--color-paper)", border: "1px solid var(--color-sage)" }}
          >
            <AlertCircle size={20} color="var(--color-iron)" aria-hidden />
          </div>
          <p className="text-[15px] leading-[1.6]" style={{ color: "var(--color-steel)" }}>
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
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isWelcome ? (
            <Welcome
              opener={messages[0].content}
              resuming={messages[0].content === RESUME_OPENER}
              disabled={busy || uploading}
              onUpload={() => fileInputRef.current?.click()}
              onRecord={() => void recorder.start()}
              onType={() => inputRef.current?.focus()}
            />
          ) : (
            <div className="mx-auto flex w-full max-w-[720px] flex-col gap-6 px-4 pb-6 pt-8 sm:px-6" aria-live="polite">
              {messages.map((m, i) =>
                m.role === "assistant" ? (
                  <AssistantMessage
                    key={i}
                    content={m.content}
                    saved={m.saved}
                    active={i === lastAssistantIdx && !sending && !uploading}
                    reveal={i === revealIdx}
                    onRevealStep={scrollToBottom}
                    onRevealed={() => setRevealIdx(null)}
                  />
                ) : m.voice ? (
                  <VoiceBubble key={i} voice={m.voice} transcript={m.content} />
                ) : (
                  <UserMessage key={i} content={m.content} />
                )
              )}
              {(sending || uploading) && (
                <Thinking
                  label={uploading ? "Reading your document" : "Thinking"}
                  state={uploading ? "searching" : "solving"}
                />
              )}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 pl-10"
                  role="alert"
                >
                  <AlertCircle size={14} color="#b91c1c" aria-hidden />
                  <p className="text-[13px]" style={{ color: "#b91c1c" }}>{error}</p>
                  {lastFailedText && (
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="cursor-pointer text-[13px] font-[500] underline underline-offset-2"
                      style={{ color: "var(--color-hudson-deep)" }}
                    >
                      Retry
                    </button>
                  )}
                </motion.div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex-shrink-0 px-4 pb-4 sm:px-6" style={{ paddingBottom: "max(16px, env(safe-area-inset-bottom))" }}>
        <form
          onSubmit={handleSubmit}
          className="mx-auto w-full max-w-[720px] rounded-[24px] p-2 transition-shadow duration-150 focus-within:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          style={{ background: "var(--color-paper)", border: "1px solid var(--color-mist)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.pptx,.csv,.md,.markdown,.mp3,.m4a,.wav,.aac,.ogg,.flac"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
          {recorder.recording ? (
            <div className="flex items-center gap-2">
              <RecordingBar
                seconds={recorder.seconds}
                levels={recorder.levels}
                onCancel={recorder.cancel}
                onSend={recorder.stop}
              />
            </div>
          ) : (
            <>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={
                  fatalError ? "This interview has ended." : done ? "Submitting your answers…" : "Type your answer…"
                }
                aria-label="Your answer"
                disabled={busy}
                rows={1}
                className="block w-full resize-none bg-transparent px-3 pt-2 outline-none placeholder:text-[var(--color-steel)] disabled:opacity-60"
                style={{ fontSize: "16px", lineHeight: "24px", color: "var(--color-ink)", maxHeight: "200px" }}
              />
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <IconButton
                    label={uploading ? "Reading your document…" : "Attach a pitch deck, financials, or notes"}
                    title="Attach a pitch deck, financials, or notes (PDF, PowerPoint, CSV, Markdown — up to 4 MB) and we'll pre-fill what we can"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || busy}
                  >
                    {uploading ? <LoaderCircle size={20} className="animate-spin" /> : <Paperclip size={20} />}
                  </IconButton>
                  <IconButton label="Record a voice note" onClick={() => void recorder.start()} disabled={busy || uploading}>
                    <Mic size={20} />
                  </IconButton>
                </div>
                <IconButton
                  label={submitting ? "Submitting…" : "Send"}
                  type="submit"
                  disabled={busy || !input.trim()}
                  primary
                >
                  {submitting ? <LoaderCircle size={20} className="animate-spin" /> : <ArrowUp size={20} />}
                </IconButton>
              </div>
            </>
          )}
        </form>
        <p className="mx-auto mt-2 max-w-[720px] text-center text-[12px]" style={{ color: "var(--color-steel)" }}>
          Answers save as you go. Reviewed by a CFO.
        </p>
      </div>
    </main>
  );
}

/** The interviewer's orb — stands in for an avatar beside its messages. */
function Orb({ state = "breathing", size = 20, paused = false }: { state?: OrbState; size?: 20 | 64; paused?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <span aria-hidden className="flex flex-shrink-0 items-center justify-center" style={{ width: size, height: size }}>
      <ThinkingOrb state={state} size={size} paused={paused || !!reduceMotion} />
    </span>
  );
}

const REVEAL_MS_PER_WORD = 28;
const REVEAL_MAX_MS = 1600;

function AssistantMessage({
  content,
  saved,
  active,
  reveal,
  onRevealStep,
  onRevealed,
}: {
  content: string;
  saved?: string[];
  /** Only the latest reply's orb animates, so a long chat isn't full of moving orbs. */
  active: boolean;
  reveal: boolean;
  onRevealStep: () => void;
  onRevealed: () => void;
}) {
  // The reply arrives whole; it is revealed word by word so it reads like it's being written.
  const words = content.split(/(\s+)/);
  const [shown, setShown] = useState(reveal ? 0 : words.length);
  const revealing = shown < words.length;

  useEffect(() => {
    if (!reveal) return;
    // Long replies reveal several words per tick so the whole thing stays under REVEAL_MAX_MS.
    const ticks = Math.min(words.length, Math.floor(REVEAL_MAX_MS / REVEAL_MS_PER_WORD));
    const step = Math.ceil(words.length / ticks);
    const id = setInterval(() => {
      setShown((n) => {
        const next = Math.min(words.length, n + step);
        if (next >= words.length) clearInterval(id);
        return next;
      });
      onRevealStep();
    }, REVEAL_MS_PER_WORD);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reveal]);

  useEffect(() => {
    if (reveal && !revealing) onRevealed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealing]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex gap-3"
    >
      <div className="pt-[3px]">
        <Orb paused={!active} />
      </div>
      <div className="min-w-0 flex-1">
        {/* Screen readers get the full reply at once instead of every word. */}
        <span className="sr-only">{content}</span>
        <p
          aria-hidden
          className="text-[16px] leading-[1.65]"
          style={{ color: "var(--color-ink)", whiteSpace: "pre-wrap" }}
        >
          {words.slice(0, shown).join("")}
        </p>
        {saved && saved.length > 0 && !revealing && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-full px-3 py-1 text-[12px]"
            style={{ background: "var(--color-paper)", border: "1px solid var(--color-sage)", color: "var(--color-steel)" }}
          >
            <Check size={13} color="var(--color-hudson-deep)" strokeWidth={2.5} aria-hidden />
            <span className="font-[500]" style={{ color: "var(--color-iron)" }}>Saved</span>
            <span className="truncate">
              {saved.slice(0, 3).join(" · ")}
              {saved.length > 3 ? ` · +${saved.length - 3} more` : ""}
            </span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex justify-end"
    >
      <div
        className="max-w-[80%] rounded-[20px] px-4 py-2.5 text-[16px] leading-[1.6]"
        style={{ background: "rgba(0,0,0,0.055)", color: "var(--color-ink)", whiteSpace: "pre-wrap" }}
      >
        {content}
      </div>
    </motion.div>
  );
}

function Thinking({ label, state }: { label: string; state: OrbState }) {
  return (
    <div className="flex items-center gap-3" role="status">
      <Orb state={state} />
      <span className="gic-shimmer-text text-[15px] font-[500]">{label}</span>
    </div>
  );
}

function Welcome({
  opener,
  resuming,
  disabled,
  onUpload,
  onRecord,
  onType,
}: {
  opener: string;
  resuming: boolean;
  disabled: boolean;
  onUpload: () => void;
  onRecord: () => void;
  onType: () => void;
}) {
  const options = [
    { label: "Upload my pitch deck", icon: <Paperclip size={16} aria-hidden />, onClick: onUpload },
    { label: "Record a voice note", icon: <Mic size={16} aria-hidden />, onClick: onRecord },
    { label: "Just start typing", icon: <Type size={16} aria-hidden />, onClick: onType },
  ];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mx-auto flex min-h-full w-full max-w-[640px] flex-col justify-center px-6 py-10"
    >
      <div className="mb-6">
        <Orb size={64} />
      </div>
      <h1
        className="text-[30px] leading-[1.12] sm:text-[40px]"
        style={{
          fontFamily: "var(--font-ppmondwest)",
          fontFeatureSettings: '"liga" 0',
          letterSpacing: "-0.02em",
          color: "var(--color-ink)",
        }}
      >
        {resuming ? "Welcome back. Let's finish your story." : "Let's build your Series A story."}
      </h1>
      <p className="mt-4 text-[16px] leading-[1.65]" style={{ color: "var(--color-iron)", maxWidth: "56ch" }}>
        {opener}
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.label}
            type="button"
            onClick={o.onClick}
            disabled={disabled}
            className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full px-4 text-[14px] font-[500] transition-colors duration-150 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-hudson-deep)] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ border: "1px solid var(--color-mist)", color: "var(--color-iron)", background: "rgba(255,255,255,0.6)" }}
          >
            {o.icon}
            {o.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function VoiceBubble({ voice, transcript }: { voice: VoiceNote; transcript: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) audio.pause();
    else void audio.play();
  }

  const played = Math.round(progress * voice.peaks.length);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      style={{ display: "flex", justifyContent: "flex-end" }}
    >
      <div
        style={{
          width: "min(80%, 340px)",
          padding: "10px 14px 12px",
          borderRadius: "20px",
          background: "rgba(0,0,0,0.055)",
          color: "var(--color-ink)",
          fontFamily: "var(--font-af)",
        }}
      >
        <div className="flex items-center gap-2.5">
          {voice.url ? (
            <>
              {/* Recorded WebM often reports no duration, so the recorder's own timing is used instead. */}
              <audio
                ref={audioRef}
                src={voice.url}
                preload="metadata"
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => {
                  setPlaying(false);
                  setProgress(0);
                }}
                onTimeUpdate={(e) => setProgress(Math.min(1, e.currentTarget.currentTime / voice.durationSec))}
              />
              <button
                type="button"
                onClick={toggle}
                aria-label={playing ? "Pause voice note" : "Play voice note"}
                className="flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full text-white transition-transform duration-150 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-hudson-deep)]"
                style={{ background: "var(--color-ink)" }}
              >
                {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </button>
            </>
          ) : (
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-black/10" aria-hidden>
              <Mic size={16} />
            </span>
          )}
          <div aria-hidden className="flex h-7 min-w-0 flex-1 items-center gap-[2px] overflow-hidden">
            {voice.peaks.map((level, i) => (
              <span
                key={i}
                className="min-w-0 flex-1 rounded-full"
                style={{
                  height: `${Math.max(3, level * 26)}px`,
                  background: "var(--color-ink)",
                  opacity: i < played ? 0.9 : 0.3,
                }}
              />
            ))}
          </div>
          <span className="flex-shrink-0 text-[12px] tabular-nums" style={{ color: "var(--color-steel)" }}>
            {formatDuration(voice.durationSec)}
          </span>
        </div>
        {voice.transcribing ? (
          <p className="mt-2 flex items-center gap-1.5 text-[13px]" style={{ color: "var(--color-steel)" }}>
            <LoaderCircle size={12} className="animate-spin" aria-hidden />
            Transcribing…
          </p>
        ) : (
          transcript && (
            <p
              className="mt-2 pt-2 text-[15px] leading-[1.6]"
              style={{ borderTop: "1px solid rgba(0,0,0,0.08)", whiteSpace: "pre-wrap" }}
            >
              {transcript}
            </p>
          )
        )}
      </div>
    </motion.div>
  );
}
