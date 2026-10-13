import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";
import { collections } from "@/lib/db";
import { getSettings } from "@/lib/event";
import {
  apiError,
  hash,
  HttpError,
  json,
  newSession,
  randomToken,
  rateLimit,
  sameOrigin,
} from "@/lib/security";
import {
  EMPTY_SUBMISSION,
  FEE,
  registrationState,
  type TeamDoc,
} from "@/lib/types";
import { registrationStatus } from "@/lib/registration";
import { registrationSchema } from "@/lib/validation";
export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const form = await request.formData();
    const input = registrationSchema.parse(
      JSON.parse(String(form.get("data") || "{}")),
    );
    const c = await collections();
    await rateLimit(request, "register", 10, 15);
    const { password, ...details } = input;
    const fingerprint = hash(JSON.stringify(details));
    const complete = async (team: TeamDoc, status: number) => {
      const leader = await c.users.findOne({
        _id: team.leaderId,
        disabled: false,
      });
      if (
        team.registrationFingerprint !== fingerprint ||
        !leader ||
        !(await bcrypt.compare(password, leader.passwordHash))
      )
        throw new HttpError(
          409,
          "This registration attempt is already saved. Sign in to your team dashboard.",
        );
      await newSession(team.leaderId);
      return json(
        {
          registrationId: team.registrationId,
          status: registrationStatus(team),
          redirect: "/register/success",
        },
        status,
      );
    };
    // A retry after a lost response or refresh recovers the committed record.
    const previous = await c.teams.findOne({
      registrationKey: input.requestId,
    });
    if (previous) return await complete(previous, 200);
    const state = registrationState(await getSettings());
    if (!state.open) throw new HttpError(409, state.reason);
    const now = new Date();
    const teamId = new ObjectId(),
      userId = new ObjectId();
    const passwordHash = await bcrypt.hash(password, 12);
    const team: TeamDoc = {
      _id: teamId,
      registrationId: `BF26-${randomBytes(5).toString("hex").toUpperCase()}`,
      name: input.teamName,
      nameKey: input.teamName.toLowerCase().replace(/\s+/g, " "),
      leaderId: userId,
      members: [
        { name: input.leaderName, email: input.email },
        ...input.members,
      ],
      whatsapp: input.whatsapp,
      department: input.department,
      registrationStatus: "new",
      internalNotes: "",
      whatsappConsent: true,
      whatsappConsentAt: now,
      registrationKey: input.requestId,
      registrationFingerprint: fingerprint,
      // Preserve the existing payment history shape without recording a payment.
      payment: { status: "pending", amount: FEE, note: "", submittedAt: now },
      submission: { ...EMPTY_SUBMISSION },
      checklist: [],
      inviteToken: randomToken(),
      createdAt: now,
    };
    const session = c.client.startSession();
    try {
      await session.withTransaction(async () => {
        await c.users.insertOne(
          {
            _id: userId,
            email: input.email,
            name: input.leaderName,
            passwordHash,
            role: "participant",
            teamId,
            disabled: false,
            createdAt: now,
          },
          { session },
        );
        await c.teams.insertOne(team, { session });
        await c.audit.insertOne(
          {
            actorId: userId,
            teamId,
            action: "registration_submitted",
            after: "new",
            createdAt: now,
          },
          { session },
        );
      });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        const saved = await c.teams.findOne({
          registrationKey: input.requestId,
        });
        if (saved) return await complete(saved, 200);
      }
      throw error;
    } finally {
      await session.endSession();
    }
    return await complete(team, 201);
  } catch (error) {
    if (error instanceof SyntaxError)
      return json({ error: "Check your registration details." }, 400);
    return apiError(error);
  }
}
