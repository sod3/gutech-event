import { z } from "zod";
import { collections } from "@/lib/db";
import {
  apiError,
  authorize,
  HttpError,
  id,
  json,
  rateLimit,
  sameOrigin,
} from "@/lib/security";
import { registrationStatus, REGISTRATION_STATUSES } from "@/lib/registration";
import { lockOpenEvent } from "@/lib/judging";
import { queueConfirmation } from "@/lib/mail";
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const admin = await authorize(["admin"]);
    await rateLimit(
      request,
      "registration-review",
      60,
      15,
      admin._id.toString(),
    );
    const input = z
      .object({
        teamId: z.string(),
        status: z.enum(REGISTRATION_STATUSES),
        expectedStatus: z.enum(REGISTRATION_STATUSES),
        expectedNotes: z.string().max(4000),
        internalNotes: z.string().trim().max(4000),
      })
      .parse(await request.json());
    const c = await collections();
    const teamId = id(input.teamId);
    const session = c.client.startSession();
    try {
      await session.withTransaction(async () => {
        const team = await c.teams.findOne({ _id: teamId }, { session });
        if (!team) throw new HttpError(404, "Registration not found.");
        const before = registrationStatus(team);
        if (
          before !== input.expectedStatus ||
          (team.internalNotes || "") !== input.expectedNotes
        )
          throw new HttpError(
            409,
            "This registration was updated by another organizer. Refresh the details before saving.",
          );
        if (
          before === input.status &&
          (team.internalNotes || "") === input.internalNotes
        )
          return;
        if ((before === "shortlisted") !== (input.status === "shortlisted"))
          await lockOpenEvent(session);
        await c.teams.updateOne(
          { _id: teamId },
          {
            $set: {
              registrationStatus: input.status,
              internalNotes: input.internalNotes,
            },
          },
          { session },
        );
        await c.audit.insertOne(
          {
            actorId: admin._id,
            teamId,
            action: "registration_updated",
            before,
            after: input.status,
            note: input.internalNotes,
            createdAt: new Date(),
          },
          { session },
        );
        if (before !== "shortlisted" && input.status === "shortlisted")
          await queueConfirmation(team, session);
      });
    } finally {
      await session.endSession();
    }
    return json({ message: "Registration status and internal notes saved." });
  } catch (error) {
    return apiError(error);
  }
}
