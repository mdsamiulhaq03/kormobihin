import { AppError } from "@/lib/errors";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_TIMEOUT_MS = 20_000;

export type ChatMessage = { role: "system" | "user"; content: string };

export type GroqConfig = {
  apiKey: string;
  model: string;
  timeoutMs?: number;
};

/** A user-safe AI failure with the HTTP status our API should return. */
export class AiServiceError extends AppError {
  constructor(status: number, message: string) {
    super(status, message);
    this.name = "AiServiceError";
  }
}

function errorForStatus(status: number, retryAfter: string | null): AiServiceError {
  if (status === 429) {
    const wait = retryAfter ? ` Try again in about ${retryAfter} seconds.` : " Try again shortly.";
    return new AiServiceError(429, `The AI service is busy right now.${wait}`);
  }
  if (status === 401 || status === 403) {
    return new AiServiceError(
      503,
      "The AI service is not configured correctly. Contact the admin.",
    );
  }
  return new AiServiceError(503, "The AI service is unavailable right now. Please retry.");
}

/**
 * Calls Groq's OpenAI-compatible chat API in JSON mode and returns the parsed JSON.
 * temperature 0 keeps scores as repeatable as possible. Every failure becomes an
 * AiServiceError with a message that is safe to show the user.
 */
export async function callGroqJson(messages: ChatMessage[], config: GroqConfig): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        response_format: { type: "json_object" },
        messages,
      }),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiServiceError(504, "The AI took too long to respond. Please retry.");
    }
    throw new AiServiceError(503, "Couldn't reach the AI service. Please retry.");
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    console.error(`Groq request failed with status ${response.status}`);
    throw errorForStatus(response.status, response.headers.get("retry-after"));
  }

  try {
    const body = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const content = body.choices?.[0]?.message?.content;
    if (!content) throw new Error("empty content");
    return JSON.parse(content);
  } catch {
    throw new AiServiceError(502, "The AI returned an unreadable answer. Please retry.");
  }
}
