import { Router, type IRouter } from "express";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import {
  db,
  volunteerHoursTable,
  volunteerSignupsTable,
  volunteerSlotsTable,
  volunteersTable,
} from "@workspace/db";
import {
  CreateVolunteerBody,
  CreateVolunteerResponse,
  GetVolunteerParams,
  GetVolunteerResponse,
  GetVolunteersResponse,
  ImportVolunteersBody,
  ImportVolunteersResponse,
  UpdateVolunteerBody,
  UpdateVolunteerParams,
  UpdateVolunteerResponse,
} from "@workspace/api-zod";
import { ensureChurchProfile } from "./ministry";

const router: IRouter = Router();

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function volunteerResponse(volunteer: typeof volunteersTable.$inferSelect) {
  return {
    ...volunteer,
    createdAt: volunteer.createdAt.toISOString(),
    updatedAt: volunteer.updatedAt.toISOString(),
  };
}

function validateStudent(data: {
  isStudent: boolean;
  guardianName?: string | null;
  guardianPhone?: string | null;
}): string | null {
  if (data.isStudent && (!clean(data.guardianName) || !clean(data.guardianPhone))) {
    return "Guardian name and phone are required for student volunteers.";
  }
  return null;
}

router.get("/volunteers", async (_req, res): Promise<void> => {
  const church = await ensureChurchProfile();
  const rows = await db
    .select()
    .from(volunteersTable)
    .where(eq(volunteersTable.churchId, church.id))
    .orderBy(asc(volunteersTable.lastName), asc(volunteersTable.firstName));
  res.json(GetVolunteersResponse.parse(rows.map(volunteerResponse)));
});

router.post("/volunteers", async (req, res): Promise<void> => {
  const parsed = CreateVolunteerBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const studentError = validateStudent(parsed.data);
  if (studentError) {
    res.status(400).json({ error: studentError });
    return;
  }
  const church = await ensureChurchProfile();
  const [created] = await db
    .insert(volunteersTable)
    .values({
      ...parsed.data,
      churchId: church.id,
      email: clean(parsed.data.email),
      phone: clean(parsed.data.phone),
      team: clean(parsed.data.team),
      schoolName: parsed.data.isStudent ? clean(parsed.data.schoolName) : null,
      guardianName: parsed.data.isStudent ? clean(parsed.data.guardianName) : null,
      guardianPhone: parsed.data.isStudent ? clean(parsed.data.guardianPhone) : null,
      guardianEmail: parsed.data.isStudent ? clean(parsed.data.guardianEmail) : null,
      notes: clean(parsed.data.notes),
    })
    .returning();
  res.status(201).json(CreateVolunteerResponse.parse(volunteerResponse(created)));
});

router.post("/volunteers/import", async (req, res): Promise<void> => {
  const parsed = ImportVolunteersBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const church = await ensureChurchProfile();
  const inserted = await db
    .insert(volunteersTable)
    .values(
      parsed.data.volunteers.map((row) => ({
        churchId: church.id,
        firstName: row.firstName.trim(),
        lastName: row.lastName.trim(),
        email: clean(row.email),
        phone: clean(row.phone),
        team: clean(row.team),
        status: "active" as const,
        isStudent: false,
      })),
    )
    .returning({ id: volunteersTable.id });
  res.status(201).json(ImportVolunteersResponse.parse({ imported: inserted.length }));
});

router.get("/volunteers/:volunteerId", async (req, res): Promise<void> => {
  const params = GetVolunteerParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const church = await ensureChurchProfile();
  const [volunteer] = await db
    .select()
    .from(volunteersTable)
    .where(
      and(
        eq(volunteersTable.id, params.data.volunteerId),
        eq(volunteersTable.churchId, church.id),
      ),
    )
    .limit(1);
  if (!volunteer) {
    res.status(404).json({ error: "Volunteer not found." });
    return;
  }
  const today = new Date().toISOString().slice(0, 10);
  const upcomingSignups = await db
    .select({
      id: volunteerSignupsTable.id,
      slotTitle: volunteerSlotsTable.title,
      date: volunteerSlotsTable.date,
      startTime: volunteerSlotsTable.startTime,
      status: volunteerSignupsTable.status,
    })
    .from(volunteerSignupsTable)
    .innerJoin(
      volunteerSlotsTable,
      and(
        eq(volunteerSignupsTable.slotId, volunteerSlotsTable.id),
        eq(volunteerSlotsTable.churchId, church.id),
      ),
    )
    .where(
      and(
        eq(volunteerSignupsTable.churchId, church.id),
        eq(volunteerSignupsTable.volunteerId, volunteer.id),
        gte(volunteerSlotsTable.date, today),
      ),
    )
    .orderBy(asc(volunteerSlotsTable.date));
  const [hours] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${volunteerHoursTable.hours}), 0)`,
    })
    .from(volunteerHoursTable)
    .where(
      and(
        eq(volunteerHoursTable.churchId, church.id),
        eq(volunteerHoursTable.volunteerId, volunteer.id),
        eq(volunteerHoursTable.approved, true),
      ),
    );
  res.json(
    GetVolunteerResponse.parse({
      ...volunteerResponse(volunteer),
      upcomingSignups,
      totalApprovedHours: Number(hours?.total ?? 0),
    }),
  );
});

router.patch("/volunteers/:volunteerId", async (req, res): Promise<void> => {
  const params = UpdateVolunteerParams.safeParse(req.params);
  const parsed = UpdateVolunteerBody.safeParse(req.body);
  if (!params.success || !parsed.success) {
    res.status(400).json({ error: "Invalid volunteer details." });
    return;
  }
  const studentError = validateStudent(parsed.data);
  if (studentError) {
    res.status(400).json({ error: studentError });
    return;
  }
  const church = await ensureChurchProfile();
  const [updated] = await db
    .update(volunteersTable)
    .set({
      ...parsed.data,
      email: clean(parsed.data.email),
      phone: clean(parsed.data.phone),
      team: clean(parsed.data.team),
      schoolName: parsed.data.isStudent ? clean(parsed.data.schoolName) : null,
      guardianName: parsed.data.isStudent ? clean(parsed.data.guardianName) : null,
      guardianPhone: parsed.data.isStudent ? clean(parsed.data.guardianPhone) : null,
      guardianEmail: parsed.data.isStudent ? clean(parsed.data.guardianEmail) : null,
      notes: clean(parsed.data.notes),
    })
    .where(
      and(
        eq(volunteersTable.id, params.data.volunteerId),
        eq(volunteersTable.churchId, church.id),
      ),
    )
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Volunteer not found." });
    return;
  }
  res.json(UpdateVolunteerResponse.parse(volunteerResponse(updated)));
});

export default router;