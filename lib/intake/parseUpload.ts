import JSZip from "jszip";
import { callModel } from "./llm";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel function bodies cap at ~4.5MB
export const MAX_TEXT_CHARS = 100_000;

// Gemini takes audio input through OpenRouter; Claude (the default model) doesn't.
const TRANSCRIBE_MODEL = "google/gemini-2.5-flash";

export type UploadKind = "pdf" | "pptx" | "csv" | "md" | "audio";

const EXT_TO_KIND: Record<string, UploadKind> = {
  pdf: "pdf",
  pptx: "pptx",
  csv: "csv",
  md: "md",
  markdown: "md",
  mp3: "audio",
  m4a: "audio",
  wav: "audio",
  aac: "audio",
  ogg: "audio",
  flac: "audio",
  webm: "audio", // Chrome's in-browser recordings; not in OpenRouter's documented list but Gemini accepts it
};

export function kindFromFilename(name: string): UploadKind | null {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  return EXT_TO_KIND[ext] ?? null;
}

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&amp;/g, "&");
}

async function parsePdf(buf: Buffer): Promise<string> {
  if (buf.subarray(0, 4).toString("latin1") !== "%PDF") throw new Error("Not a valid PDF file.");
  const { extractText, getDocumentProxy } = await import("unpdf");
  const pdf = await getDocumentProxy(new Uint8Array(buf));
  const { text } = await extractText(pdf, { mergePages: true });
  return text;
}

async function parsePptx(buf: Buffer): Promise<string> {
  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(buf);
  } catch {
    throw new Error("Not a valid PowerPoint (.pptx) file.");
  }

  const slides = Object.keys(zip.files)
    .map((path) => ({ path, n: Number(/^ppt\/slides\/slide(\d+)\.xml$/.exec(path)?.[1]) }))
    .filter((s) => Number.isFinite(s.n))
    .sort((a, b) => a.n - b.n)
    .slice(0, 200);
  if (slides.length === 0) throw new Error("No slides found in this PowerPoint file.");

  const out: string[] = [];
  for (const { path, n } of slides) {
    const xml = await zip.files[path].async("string");
    const paragraphs = xml
      .split(/<\/a:p>/)
      .map((p) =>
        Array.from(p.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g), (m) => decodeXmlEntities(m[1])).join("")
      )
      .filter((p) => p.trim());
    out.push(`--- Slide ${n} ---\n${paragraphs.join("\n")}`);
  }
  return out.join("\n\n");
}

async function transcribeAudio(buf: Buffer, format: string): Promise<string> {
  try {
    return await callModel(
      [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Transcribe this voice note verbatim. Return only the transcript text, with no commentary. If there is no speech, return nothing.",
            },
            { type: "input_audio", input_audio: { data: buf.toString("base64"), format } },
          ],
        },
      ],
      { model: TRANSCRIBE_MODEL, maxTokens: 8000 }
    );
  } catch (err) {
    console.error("[intake/upload] transcription failed", err);
    throw new Error("We couldn't transcribe that voice note. Please try again, or try an MP3 or M4A file.");
  }
}

export async function extractUploadText(
  kind: UploadKind,
  buf: Buffer,
  filename: string
): Promise<string> {
  let text: string;
  switch (kind) {
    case "pdf":
      text = await parsePdf(buf);
      break;
    case "pptx":
      text = await parsePptx(buf);
      break;
    case "audio":
      text = await transcribeAudio(buf, filename.split(".").pop()!.toLowerCase());
      break;
    case "csv":
    case "md":
      text = buf.toString("utf8");
      break;
  }
  return text.replace(/\u0000/g, "").trim().slice(0, MAX_TEXT_CHARS);
}
