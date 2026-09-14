import { claudeUsageTable, db } from "@workspace/db";
import { and, eq, gte, lt, sql } from "drizzle-orm";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-5";
const MAX_OUTPUT_TOKENS = 4096;
const REQUESTS_PER_MINUTE = 10;
const REQUESTS_PER_MONTH = 1_000;
const TOKENS_PER_MONTH = 5_000_000;

type ClaudeMessage = {
  role: "user" | "assistant";
  content: string;
};

type ClaudeResponse = {
  content?: Array<{ type: string; text?: string }>;
  error?: { message?: string };
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
};

export class ClaudeRateLimitError extends Error {
  readonly retryAfterSeconds: number;

  constructor(message: string, retryAfterSeconds: number) {
    super(message);
    this.name = "ClaudeRateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

function estimateTokens(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
}

function tokenReservation(input: string): {
  estimatedInputTokens: number;
  reservedInputTokens: number;
} {
  return {
    estimatedInputTokens: estimateTokens(input),
    // A token cannot contain less than one UTF-8 byte. Reserving every input
    // byte plus protocol overhead is intentionally conservative and prevents
    // multilingual or unusual input from being under-counted.
    reservedInputTokens: Buffer.byteLength(input, "utf8") + 1_024,
  };
}

async function reserveUsage(options: {
  workspaceId: number;
  estimatedInputTokens: number;
  reservedInputTokens: number;
}): Promise<number> {
  const reservedTokens = options.reservedInputTokens + MAX_OUTPUT_TOKENS;

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${options.workspaceId})`,
    );

    const periodResult = await tx.execute<{
      now: Date;
      minuteStart: Date;
      monthStart: Date;
      nextMonth: Date;
    }>(sql`
      select
        clock_timestamp() as "now",
        clock_timestamp() - interval '1 minute' as "minuteStart",
        date_trunc('month', clock_timestamp()) as "monthStart",
        date_trunc('month', clock_timestamp()) + interval '1 month' as "nextMonth"
    `);
    const periodRow = periodResult.rows[0];
    const period = {
      now: new Date(periodRow.now),
      minuteStart: new Date(periodRow.minuteStart),
      monthStart: new Date(periodRow.monthStart),
      nextMonth: new Date(periodRow.nextMonth),
    };

    const [minuteUsage] = await tx
      .select({
        requests: sql<number>`count(*)::int`,
        oldestRequest: sql<Date>`min(${claudeUsageTable.createdAt})`,
      })
      .from(claudeUsageTable)
      .where(
        and(
          eq(claudeUsageTable.workspaceId, options.workspaceId),
          gte(claudeUsageTable.createdAt, period.minuteStart),
          lt(claudeUsageTable.createdAt, period.now),
        ),
      );

    if (minuteUsage.requests >= REQUESTS_PER_MINUTE) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(
          (new Date(minuteUsage.oldestRequest).getTime() +
            60_000 -
            period.now.getTime()) /
            1000,
        ),
      );
      throw new ClaudeRateLimitError(
        "Grace is receiving too many requests for this church right now. Please wait a minute and try again.",
        retryAfterSeconds,
      );
    }

    const [monthlyUsage] = await tx
      .select({
        requests: sql<number>`count(*)::int`,
        tokens: sql<number>`coalesce(sum(${claudeUsageTable.reservedTokens}), 0)::int`,
      })
      .from(claudeUsageTable)
      .where(
        and(
          eq(claudeUsageTable.workspaceId, options.workspaceId),
          gte(claudeUsageTable.createdAt, period.monthStart),
          lt(claudeUsageTable.createdAt, period.nextMonth),
        ),
      );

    const retryAfterSeconds = Math.max(
      1,
      Math.ceil(
        (period.nextMonth.getTime() - period.now.getTime()) / 1000,
      ),
    );

    if (monthlyUsage.requests >= REQUESTS_PER_MONTH) {
      throw new ClaudeRateLimitError(
        "This church has reached its monthly Grace request limit. Please try again next month.",
        retryAfterSeconds,
      );
    }
    if (monthlyUsage.tokens + reservedTokens > TOKENS_PER_MONTH) {
      throw new ClaudeRateLimitError(
        "This church has reached its monthly Grace usage limit. Please try again next month.",
        retryAfterSeconds,
      );
    }

    const [usage] = await tx
      .insert(claudeUsageTable)
      .values({
        workspaceId: options.workspaceId,
        estimatedInputTokens: options.estimatedInputTokens,
        reservedTokens,
        createdAt: period.now,
      })
      .returning({ id: claudeUsageTable.id });
    return usage.id;
  });
}

export async function generateClaudeText(options: {
  workspaceId: number;
  system: string;
  messages: ClaudeMessage[];
}): Promise<string> {
  const apiKey = process.env.Grace_GEC_Piolot;
  if (!apiKey) {
    throw new Error("Anthropic API key is not configured");
  }

  const serializedInput = `${options.system}\n${options.messages
    .map((message) => `${message.role}:${message.content}`)
    .join("\n")}`;
  const { estimatedInputTokens, reservedInputTokens } =
    tokenReservation(serializedInput);
  const usageId = await reserveUsage({
    workspaceId: options.workspaceId,
    estimatedInputTokens,
    reservedInputTokens,
  });

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: options.system,
      messages: options.messages,
    }),
    signal: AbortSignal.timeout(45_000),
  });

  const responseBody = await response.text();
  let payload: ClaudeResponse = {};
  try {
    payload = JSON.parse(responseBody) as ClaudeResponse;
  } catch {
    // The status-based error below remains useful when an upstream proxy
    // returns a non-JSON body.
  }
  const inputTokens = payload.usage?.input_tokens;
  const outputTokens = payload.usage?.output_tokens;
  if (
    Number.isInteger(inputTokens) &&
    Number.isInteger(outputTokens) &&
    inputTokens !== undefined &&
    outputTokens !== undefined &&
    inputTokens >= 0 &&
    outputTokens >= 0
  ) {
    await db
      .update(claudeUsageTable)
      .set({
        inputTokens,
        outputTokens,
        reservedTokens: inputTokens + outputTokens,
      })
      .where(eq(claudeUsageTable.id, usageId));
  }

  if (!response.ok) {
    if (response.status === 429) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfterHeader
        ? Math.max(1, Number.parseInt(retryAfterHeader, 10) || 60)
        : 60;
      throw new ClaudeRateLimitError(
        "Claude is temporarily busy. Please wait and try again.",
        retryAfterSeconds,
      );
    }
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