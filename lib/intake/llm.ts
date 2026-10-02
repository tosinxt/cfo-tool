export type Role = "system" | "user" | "assistant";
export type ContentPart =
  | { type: "text"; text: string }
  | { type: "input_audio"; input_audio: { data: string; format: string } };

const MODEL = "anthropic/claude-sonnet-4-5";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function callModel(
  messages: { role: Role; content: string | ContentPart[] }[],
  opts?: { json?: boolean; maxTokens?: number; model?: string }
): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL ?? "https://pitchready.co",
      "X-Title": "Series A HUB",
    },
    body: JSON.stringify({
      model: opts?.model ?? MODEL,
      max_tokens: opts?.maxTokens ?? 1200,
      messages,
      ...(opts?.json ? { response_format: { type: "json_object" } } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== "string" || !text) throw new Error("No text content in OpenRouter response");
  return text;
}

export function extractJsonObject(raw: string): string {
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = stripped.indexOf("{");
  const end = stripped.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) return stripped;
  return stripped.slice(start, end + 1);
}
