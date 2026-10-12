import bcrypt from "bcryptjs";
import { z } from "zod";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/db";
import {
  apiError,
  authorize,
  HttpError,
  id,
  json,
  sameOrigin,
} from "@/lib/security";
import { emailSchema, passwordSchema } from "@/lib/validation";
import { lockOpenEvent } from "@/lib/judging";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const admin = await authorize(["admin"]);
    const c = await collections();
    const input = z
      .object({
        name: z.string().trim().min(2).max(100),
        email: emailSchema,
        password: passwordSchema,
      })
      .parse(await request.json());
    await c.users.insertOne({
      _id: new ObjectId(),
      name: input.name,
      email: input.email,
      passwordHash: await bcrypt.hash(input.password, 12),
      role: "judge",
      disabled: false,
      createdAt: new Date(),
    });
    await c.audit.insertOne({
      actorId: admin._id,
      action: "judge_account_created",
      note: input.email,
      createdAt: new Date(),
    });
    return json(
      {
        message:
          "Judge account created. Share these credentials privately with the assigned judge.",
      },
      201,
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const admin = await authorize(["admin"]);
    const c = await collections();
    const input = z
      .object({
        judgeId: z.string(),
        teamId: z.string(),
        assigned: z.boolean(),
      })
      .parse(await request.json());
    const judgeId = id(input.judgeId);
    const teamId = id(input.teamId);
    if (
      !(await c.users.findOne({
        _id: judgeId,
        role: "judge",
        disabled: false,
      })) ||
      !(await c.teams.findOne({ _id: teamId, "payment.status": "confirmed" }))
    )
      throw new HttpError(400, "Assign an active judge to a confirmed team.");
    const session = c.client.startSession();
    try {
      await session.withTransaction(async () => {
        await lockOpenEvent(session);
        if (input.assigned)
          await c.assignments.updateOne(
            { judgeId, teamId },
            { $setOnInsert: { judgeId, teamId } },
            { upsert: true, session },
          );
        else await c.assignments.deleteOne({ judgeId, teamId }, { session });
        await c.audit.insertOne(
          {
            actorId: admin._id,
            teamId,
            action: input.assigned ? "judge_assigned" : "judge_unassigned",
            createdAt: new Date(),
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return json({ message: "Judge assignment saved." });
  } catch (e) {
    return apiError(e);
  }
}
