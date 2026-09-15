import { Router, type IRouter } from "express";
import { count, desc, eq } from "drizzle-orm";
import {
  churchProfilesTable,
  conversationsTable,
  db,
  messagesTable,
  servicePlansTable,
} from "@workspace/db";
import {
  CreateConversationBody,
  CreateConversationResponse,
  CreateServicePlanBody,
  CreateServicePlanResponse,
  GetChurchProfileResponse,
  GetConversationParams,
  GetConversationResponse,
  GetConversationsResponse,
  GetDashboardResponse,
  GetServicePlanParams,
  GetServicePlanResponse,
  GetServicePlansResponse,
  SendConversationMessageBody,
  SendConversationMessageParams,
  SendConversationMessageResponse,
  UpdateChurchProfileBody,
  UpdateChurchProfileResponse,
} from "@workspace/api-zod";
import {
  ClaudeRateLimitError,
  generateClaudeText,
} from "../lib/claude";

const router: IRouter = Router();

function iso(value: Date): string {
  return value.toISOString();
}

export async function ensureChurchProfile() {
  const [existing] = await db.select().from(churchProfilesTable).limit(1);
  if (existing) return existing;

  const [created] = await db
    .insert(churchProfilesTable)
    .values({
      churchName: "Grace Community Church",
      pastorName: "Pastor Jordan",
      address: "125 Hope Avenue",
      serviceTime: "Sunday at 10:00 AM",
      welcomeNote:
        "We are glad you are here. Whether this is your first Sunday or your fiftieth, you belong.",
    })
    .returning();
  return created;
}

function profileResponse(profile: typeof churchProfilesTable.$inferSelect) {
  return {
    ...profile,
    updatedAt: iso(profile.updatedAt),
  };
}

async function conversationSummary(
  conversation: typeof conversationsTable.$inferSelect,
) {
  const [{ value }] = await db
    .select({ value: count() })
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversation.id));

  return {
    ...conversation,
    createdAt: iso(conversation.createdAt),
    updatedAt: iso(conversation.updatedAt),
    messageCount: value,
  };
}

function serviceSummary(plan: typeof servicePlansTable.$inferSelect) {
  return {
    id: plan.id,
    churchName: plan.churchName,
    serviceDate: plan.serviceDate,
    serviceTime: plan.serviceTime,
    sermonTitle: plan.sermonTitle,
    speaker: plan.speaker,
    createdAt: iso(plan.createdAt),
  };
}

async function assistantReply(options: {
  church: typeof churchProfilesTable.$inferSelect;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  content: string;
}): Promise<string> {
  return generateClaudeText({
    workspaceId: options.church.id,
    system: `You are Grace, the ministry assistant for ${options.church.churchName}.

Church context:
- Pastor: ${options.church.pastorName || "Not provided"}
- Address: ${options.church.address || "Not provided"}
- Regular service: ${options.church.serviceTime || "Not provided"}
- Welcome tone: ${options.church.welcomeNote || "Warm and welcoming"}

Help church staff reduce manual work. Create polished, immediately usable volunteer schedules, announcements, social posts, event plans, emails, service content, and Canva-ready creative briefs. Be warm, capable, concise, and practical. Preserve names, dates, times, locations, and counts exactly as supplied. Never invent missing facts; ask a short clarifying question when essential information is missing. Do not claim to have contacted volunteers, posted content, or completed actions outside this app.`,
    messages: [
      ...options.history,
      { role: "user", content: options.content },
    ],
  });
}

async function createServiceOutputs(data: {
  workspaceId: number;
  churchName: string;
  serviceDate: string;
  serviceTime: string;
  sermonTitle: string;
  speaker?: string | null;
  orderOfService?: string | null;
  announcements?: string | null;
  notes?: string | null;
}): Promise<{
  bulletin: string;
  projection: string;
  announcerSheet: string;
}> {
  const result = await generateClaudeText({
    workspaceId: data.workspaceId,
    system: `You are Grace, an expert church service communications assistant. Create three polished, ready-to-use documents from the supplied service details.

Return ONLY valid JSON with exactly these string fields:
{"bulletin":"...","projection":"...","announcerSheet":"..."}

The bulletin should be welcoming and print-ready. Projection content should use short, readable slide sections. The announcer sheet should be natural to read aloud with clear cues. Preserve all supplied facts exactly. Do not invent events, names, dates, scripture, or logistics. If an optional field is absent, omit that material gracefully.`,
    messages: [
      {
        role: "user",
        content: JSON.stringify({
          churchName: data.churchName,
          serviceDate: data.serviceDate,
          serviceTime: data.serviceTime,
          sermonTitle: data.sermonTitle,
          speaker: data.speaker,
          orderOfService: data.orderOfService,
          announcements: data.announcements,
          notes: data.notes,
        }),
      },
    ],
  });

  const cleaned = result
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
  const parsed = JSON.parse(cleaned) as Partial<{
    bulletin: string;
    projection: string;
    announcerSheet: string;
  }>;

  if (
    typeof parsed.bulletin !== "string" ||
    typeof parsed.projection !== "string" ||
    typeof parsed.announcerSheet !== "string"
  ) {
    throw new Error("Claude returned incomplete service documents");
  }

  return {
    bulletin: parsed.bulletin,
    projection: parsed.projection,
    announcerSheet: parsed.announcerSheet,
  };
}

router.get("/dashboard", async (_req, res): Promise<void> => {
  const profile = await ensureChurchProfile();
  const [conversationTotal] = await db
    .select({ value: count() })
    .from(conversationsTable);
  const [servicePlanTotal] = await db
    .select({ value: count() })
    .from(servicePlansTable);
  const [nextPlan] = await db
    .select()
    .from(servicePlansTable)
    .orderBy(desc(servicePlansTable.serviceDate))
    .limit(1);
  const recentRows = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.updatedAt))
    .limit(3);
  const recentConversations = await Promise.all(
    recentRows.map(conversationSummary),
  );

  res.json(
    GetDashboardResponse.parse({
      church: profile.churchName,
      conversationCount: conversationTotal.value,
      servicePlanCount: servicePlanTotal.value,
      nextService: nextPlan
        ? `${nextPlan.serviceDate} at ${nextPlan.serviceTime}`
        : null,
      recentConversations,
    }),
  );
});

router.get("/church-profile", async (_req, res): Promise<void> => {
  const profile = await ensureChurchProfile();
  res.json(GetChurchProfileResponse.parse(profileResponse(profile)));
});

router.patch("/church-profile", async (req, res): Promise<void> => {
  const parsed = UpdateChurchProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const profile = await ensureChurchProfile();
  const [updated] = await db
    .update(churchProfilesTable)
    .set(parsed.data)
    .where(eq(churchProfilesTable.id, profile.id))
    .returning();

  res.json(UpdateChurchProfileResponse.parse(profileResponse(updated)));
});

router.get("/conversations", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(conversationsTable)
    .orderBy(desc(conversationsTable.updatedAt));
  const summaries = await Promise.all(rows.map(conversationSummary));
  res.json(GetConversationsResponse.parse(summaries));
});

router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [created] = await db
    .insert(conversationsTable)
    .values(parsed.data)
    .returning();
  res
    .status(201)
    .json(CreateConversationResponse.parse(await conversationSummary(created)));
});

router.get("/conversations/:conversationId", async (req, res): Promise<void> => {
  const params = GetConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.conversationId));
  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversation.id))
    .orderBy(messagesTable.createdAt);
  const summary = await conversationSummary(conversation);
  res.json(
    GetConversationResponse.parse({
      ...summary,
      messages: messages.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: iso(message.createdAt),
      })),
    }),
  );
});

router.post(
  "/conversations/:conversationId",
  async (req, res): Promise<void> => {
    const params = SendConversationMessageParams.safeParse(req.params);
    const body = SendConversationMessageBody.safeParse(req.body);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }

    const [conversation] = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.id, params.data.conversationId));
    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const profile = await ensureChurchProfile();
    const previousMessages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, conversation.id))
      .orderBy(messagesTable.createdAt);
    let response: string;
    try {
      response = await assistantReply({
        church: profile,
        history: previousMessages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        content: body.data.content,
      });
    } catch (error) {
      if (error instanceof ClaudeRateLimitError) {
        res.set("Retry-After", String(error.retryAfterSeconds));
        res.status(429).json({ error: error.message });
        return;
      }
      req.log.error({ err: error }, "Claude chat generation failed");
      res.status(502).json({
        error:
          "Grace could not generate a response right now. Please try again.",
      });
      return;
    }
    const [userMessage] = await db
      .insert(messagesTable)
      .values({
        conversationId: conversation.id,
        role: "user",
        content: body.data.content,
      })
      .returning();
    const [assistantMessage] = await db
      .insert(messagesTable)
      .values({
        conversationId: conversation.id,
        role: "assistant",
        content: response,
      })
      .returning();
    await db
      .update(conversationsTable)
      .set({ preview: body.data.content, updatedAt: new Date() })
      .where(eq(conversationsTable.id, conversation.id));

    res.json(
      SendConversationMessageResponse.parse({
        userMessage: {
          ...userMessage,
          createdAt: iso(userMessage.createdAt),
        },
        assistantMessage: {
          ...assistantMessage,
          createdAt: iso(assistantMessage.createdAt),
        },
      }),
    );
  },
);

router.get("/service-plans", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(servicePlansTable)
    .orderBy(desc(servicePlansTable.serviceDate));
  res.json(GetServicePlansResponse.parse(rows.map(serviceSummary)));
});

router.post("/service-plans", async (req, res): Promise<void> => {
  const parsed = CreateServicePlanBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let outputs: Awaited<ReturnType<typeof createServiceOutputs>>;
  try {
    const profile = await ensureChurchProfile();
    outputs = await createServiceOutputs({
      workspaceId: profile.id,
      ...parsed.data,
    });
  } catch (error) {
    if (error instanceof ClaudeRateLimitError) {
      res.set("Retry-After", String(error.retryAfterSeconds));
      res.status(429).json({ error: error.message });
      return;
    }
    req.log.error({ err: error }, "Claude service generation failed");
    res.status(502).json({
      error:
        "Grace could not prepare the service documents right now. Please try again.",
    });
    return;
  }
  const [created] = await db
    .insert(servicePlansTable)
    .values({ ...parsed.data, ...outputs })
    .returning();
  res.status(201).json(
    CreateServicePlanResponse.parse({
      ...serviceSummary(created),
      ...outputs,
    }),
  );
});

router.get("/service-plans/:servicePlanId", async (req, res): Promise<void> => {
  const params = GetServicePlanParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [plan] = await db
    .select()
    .from(servicePlansTable)
    .where(eq(servicePlansTable.id, params.data.servicePlanId));
  if (!plan) {
    res.status(404).json({ error: "Service plan not found" });
    return;
  }

  res.json(
    GetServicePlanResponse.parse({
      ...serviceSummary(plan),
      bulletin: plan.bulletin,
      projection: plan.projection,
      announcerSheet: plan.announcerSheet,
    }),
  );
});

export default router;