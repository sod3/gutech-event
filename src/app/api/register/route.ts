import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { randomBytes } from "node:crypto";
import { collections } from "@/lib/db";
import { getSettings } from "@/lib/event";
import { prepareFile } from "@/lib/files";
import {
  apiError,
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
import { registrationSchema } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    await rateLimit(request, "register", 5, 60);
    const settings = await getSettings();
    const state = registrationState(settings);
    if (!state.open) throw new HttpError(409, state.reason);
    const form = await request.formData();
    const input = registrationSchema.parse(
      JSON.parse(String(form.get("data") || "{}")),
    );
    const method = settings.paymentMethods.find(
      (m) => m.id === input.methodId && m.enabled,
    );
    if (!method) throw new HttpError(400, "Select an official payment method.");
    const c = await collections();
    const now = new Date();
    const teamId = new ObjectId();
    const userId = new ObjectId();
    const receipt = form.get("receipt");
    const file =
      receipt instanceof File && receipt.size
        ? await prepareFile(receipt, "receipt", teamId)
        : undefined;
    const passwordHash = await bcrypt.hash(input.password, 12);
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
      payment: {
        status: "pending",
        methodId: method.id,
        reference: input.reference,
        referenceKey: `${method.id}:${input.reference.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
        amount: FEE,
        receiptId: file?._id,
        note: "",
        submittedAt: now,
      },
      submission: { ...EMPTY_SUBMISSION },
      checklist: [],
      inviteToken: randomToken(),
      createdAt: now,
    };
    const session = c.client.startSession();
    try {
      await session.withTransaction(async () => {
        // Unique indexes make all member emails and payment references race-safe.
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
        if (file) await c.files.insertOne(file, { session });
        await c.audit.insertOne(
          {
            actorId: userId,
            teamId,
            action: "registration_submitted",
            after: "pending",
            createdAt: now,
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    await newSession(userId);
    return json(
      {
        registrationId: team.registrationId,
        status: "pending",
        redirect: "/dashboard?registered=1",
      },
      201,
    );
  } catch (e) {
    if (e instanceof SyntaxError)
      return json({ error: "Check your registration details." }, 400);
    return apiError(e);
  }
}
