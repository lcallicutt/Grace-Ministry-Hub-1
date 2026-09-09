const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";

type ClaudeMessage = {
  role: "user" | "assistant";
  content: string;
};

type ClaudeResponse = {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
};

export async function generateClaudeText(options: {
  system: string;
  messages: ClaudeMessage[];
}): Promise<string> {
  const apiKey = process.env.Grace_Pilot_GEC;
  if (!apiKey) {
    throw new Error("Anthropic API key is not configured");
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: options.system,
      messages: options.messages,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  const payload = (await response.json()) as ClaudeResponse;
  if (!response.ok) {
    throw new Error(
      payload.error?.message ?? `Anthropic request failed (${response.status})`,
    );
  }

  const text = payload.content
    ?.filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Anthropic returned an empty response");
  }

  return text;
}