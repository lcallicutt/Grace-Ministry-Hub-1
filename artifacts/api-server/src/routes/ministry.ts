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

const router: IRouter = Router();

function iso(value: Date): string {
  return value.toISOString();
}

async function ensureChurchProfile() {
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

function assistantReply(content: string, churchName: string): string {
  const normalized = content.toLowerCase();

  if (normalized.includes("greeter") || normalized.includes("volunteer")) {
    return `Here is a ready-to-use volunteer plan for ${churchName}:\n\nMAIN ENTRANCE\n• Lead greeter: Assign one experienced volunteer\n• Welcome team: Assign two volunteers\n\nSIDE ENTRANCE\n• Greeter: Assign one volunteer\n\nWELCOME DESK\n• Host: Assign one volunteer\n\nNEXT STEP\nSend each person a confirmation with arrival time, dress expectations, and who to contact if plans change. You can paste the names here and I will turn this into individual messages.`;
  }

  if (normalized.includes("social") || normalized.includes("canva")) {
    return `CANVA-READY CREATIVE BRIEF\n\nChurch: ${churchName}\nFormat: 1080 × 1080 social post\nHeadline: You are welcome here\nSupporting copy: Join us this Sunday for worship, encouragement, and community.\nVisual direction: Warm gathering, natural light, genuine people, generous space for the service time.\nCall to action: Plan your visit\n\nCAPTION\nThere is a place for you this Sunday. Join us for worship and a message of hope. We would love to welcome you.`;
  }

  if (normalized.includes("announcement")) {
    return `Here are three versions for ${churchName}:\n\nBULLETIN\nJoin us for our upcoming church event. Everyone is welcome, and no registration is required unless noted.\n\nSTAGE ANNOUNCEMENT\nWe would love for you to be part of what is happening next at our church. Check the bulletin for details and invite someone to join you.\n\nSOCIAL CAPTION\nSomething meaningful is coming up at ${churchName}. Save the date, bring a friend, and join us.`;
  }

  if (normalized.includes("event")) {
    return `EVENT PLANNING STARTER\n\n1. Confirm the purpose, date, time, location, and ministry owner.\n2. Assign hospitality, setup, check-in, program, and cleanup leads.\n3. Draft one clear invitation for the bulletin, stage, email, and social channels.\n4. Set volunteer confirmation and final headcount deadlines.\n5. Prepare a day-of run sheet with arrival times and contact details.\n\nShare the event details and I will fill this in for ${churchName}.`;
  }

  return `I can help ${churchName} turn that into something ready to use. Tell me the audience, date or deadline, and the desired output—volunteer plan, announcement, social caption, event checklist, email, or Canva-ready brief—and I will draft it.`;
}

function createServiceOutputs(data: {
  churchName: string;
  serviceDate: string;
  serviceTime: string;
  sermonTitle: string;
  speaker?: string | null;
  orderOfService?: string | null;
  announcements?: string | null;
  notes?: string | null;
}) {
  const speaker = data.speaker?.trim() || "Speaker to be announced";
  const order =
    data.orderOfService?.trim() ||
    "Welcome\nWorship\nPrayer\nMessage\nClosing";
  const announcements =
    data.announcements?.trim() || "No additional announcements this week.";

  return {
    bulletin: `${data.churchName}\nWEEKLY SERVICE BULLETIN\n${data.serviceDate} • ${data.serviceTime}\n\nTODAY'S MESSAGE\n${data.sermonTitle}\n${speaker}\n\nORDER OF SERVICE\n${order}\n\nTHIS WEEK\n${announcements}\n\nWe are grateful you joined us today.`,
    projection: `WELCOME TO ${data.churchName.toUpperCase()}\n${data.serviceDate} • ${data.serviceTime}\n\nTODAY'S MESSAGE\n${data.sermonTitle}\n${speaker}\n\nANNOUNCEMENTS\n${announcements}\n\nTHANK YOU FOR WORSHIPING WITH US`,
    announcerSheet: `ANNOUNCER SHEET\n${data.churchName} • ${data.serviceDate}\n\nOPENING\nGood ${data.serviceTime.toLowerCase().includes("am") ? "morning" : "day"}, church family. Welcome to ${data.churchName}. We are glad you are here.\n\nMESSAGE\nToday's message is “${data.sermonTitle},” presented by ${speaker}.\n\nANNOUNCEMENTS\n${announcements}\n\nADDITIONAL NOTES\n${data.notes?.trim() || "No additional notes."}\n\nCLOSING\nThank you for being with us. Have a grace-filled week.`,
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
    const response = assistantReply(body.data.content, profile.churchName);
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

  const outputs = createServiceOutputs(parsed.data);
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