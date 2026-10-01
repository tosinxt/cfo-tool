import JSZip from "jszip";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // Vercel function bodies cap at ~4.5MB
export const MAX_TEXT_CHARS = 100_000;

export type UploadKind = "pdf" | "pptx" | "csv" | "md";

const EXT_TO_KIND: Record<string, UploadKind> = {
  pdf: "pdf",
  pptx: "pptx",
  csv: "csv",
  md: "md",
  markdown: "md",
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

export async function extractUploadText(kind: UploadKind, buf: Buffer): Promise<string> {
  let text: string;
  switch (kind) {
    case "pdf":
      text = await parsePdf(buf);
      break;
    case "pptx":
      text = await parsePptx(buf);
      break;
    case "csv":
    case "md":
      text = buf.toString("utf8");
      break;
  }
  return text.replace(/\u0000/g, "").trim().slice(0, MAX_TEXT_CHARS);
}
