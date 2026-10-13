import { registrationStatus } from "@/lib/registration";
import { z } from "zod";
import { collections } from "@/lib/db";
import { getSettings, safeTeam } from "@/lib/event";
import {
  apiError,
  authorize,
  HttpError,
  json,
  rateLimit,
  sameOrigin,
} from "@/lib/security";
import { submissionSchema } from "@/lib/validation";
import { lockOpenEvent } from "@/lib/judging";
export async function GET() {
  try {
    const user = await authorize(["participant"]);
    const c = await collections();
    const team = await c.teams.findOne({
      _id: user.teamId,
      leaderId: user._id,
    });
    if (!team) throw new HttpError(404, "Team not found.");
    return json({ team: safeTeam(team, true) });
  } catch (e) {
    return apiError(e);
  }
}
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const user = await authorize(["participant"]);
    await rateLimit(request, "team-save", 60, 15, user._id.toString());
    const input = z
      .object({
        submission: submissionSchema.optional(),
        checklist: z
          .array(z.enum(["problem", "research", "prototype", "pitch"]))
          .max(4)
          .optional(),
      })
      .parse(await request.json());
    const c = await collections();
    const settings = await getSettings();
    const team = await c.teams.findOne({
      _id: user.teamId,
      leaderId: user._id,
    });
    if (!team) throw new HttpError(404, "Team not found.");
    if (input.submission) {
      const submission = input.submission;
      if (registrationStatus(team) !== "confirmed")
        throw new HttpError(
          403,
          "Your registration must be confirmed by an organizer before you can submit a project.",
        );
      if (!settings.submissionDeadline)
        throw new HttpError(
          409,
          "Project submissions open after the official deadline is announced.",
        );
      if (new Date(settings.submissionDeadline).getTime() <= Date.now())
        throw new HttpError(
          409,
          "The submission deadline has passed. Your last saved project is preserved.",
        );
      const session = c.client.startSession();
      try {
        await session.withTransaction(async () => {
          await lockOpenEvent(session, true);
          const latest = await c.teams.findOne({ _id: team._id }, { session });
          if (!latest || registrationStatus(latest) !== "confirmed")
            throw new HttpError(
              403,
              "Your registration must be confirmed by an organizer before you can submit a project.",
            );
          await c.teams.updateOne(
            { _id: team._id },
            {
              $set: {
                submission: {
                  ...submission,
                  deckFileId: latest?.submission.deckFileId,
                  updatedAt: new Date(),
                },
              },
            },
            { session },
          );
        });
      } finally {
        await session.endSession();
      }
    }
    if (input.checklist)
      await c.teams.updateOne(
        { _id: team._id },
        { $set: { checklist: [...new Set(input.checklist)] } },
      );
    const updated = await c.teams.findOne({ _id: team._id });
    return json({
      team: safeTeam(updated!, true),
      message: input.submission?.final
        ? "Final submission saved. You can edit it until the deadline."
        : "Your changes are saved.",
    });
  } catch (e) {
    return apiError(e);
  }
}
