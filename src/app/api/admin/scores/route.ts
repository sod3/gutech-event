import { z } from "zod";
import { collections } from "@/lib/db";
import { lockOpenEvent } from "@/lib/judging";
import {
  apiError,
  authorize,
  HttpError,
  id,
  json,
  sameOrigin,
} from "@/lib/security";
import { CRITERIA } from "@/lib/types";
export async function PUT(request: Request) {
  try {
    sameOrigin(request);
    const admin = await authorize(["admin"]);
    const input = z
      .object({
        teamId: z.string(),
        judgeId: z.string(),
        scores: z.array(z.number().int().min(0)).length(6),
        feedback: z
          .string()
          .trim()
          .min(5, "Add a note for this audited score correction.")
          .max(3000),
      })
      .parse(await request.json());
    input.scores.forEach((score, i) => {
      if (score > CRITERIA[i].points)
        throw new HttpError(
          400,
          `Maximum ${CRITERIA[i].points} points for ${CRITERIA[i].name}.`,
        );
    });
    const c = await collections();
    const teamId = id(input.teamId),
      judgeId = id(input.judgeId);
    const session = c.client.startSession();
    try {
      await session.withTransaction(async () => {
        await lockOpenEvent(session);
        if (
          !(await c.assignments.findOne({ teamId, judgeId }, { session })) ||
          !(await c.teams.findOne(
            {
              _id: teamId,
              "submission.final": true,
              "payment.status": "confirmed",
            },
            { session },
          ))
        )
          throw new HttpError(
            409,
            "A confirmed final submission and valid judge assignment are required.",
          );
        const previous = await c.scores.findOne(
          { teamId, judgeId },
          { session },
        );
        await c.scores.updateOne(
          { teamId, judgeId },
          {
            $set: {
              scores: input.scores,
              feedback: input.feedback,
              updatedAt: new Date(),
            },
          },
          { upsert: true, session },
        );
        await c.audit.insertOne(
          {
            actorId: admin._id,
            teamId,
            action: "score_corrected",
            before: previous?.scores.join(","),
            after: input.scores.join(","),
            note: input.feedback,
            createdAt: new Date(),
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return json({ message: "Score correction saved and audited." });
  } catch (e) {
    return apiError(e);
  }
}
