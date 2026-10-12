import { z } from "zod";
import { collections } from "@/lib/db";
import {
  apiError,
  authorize,
  HttpError,
  json,
  sameOrigin,
} from "@/lib/security";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const admin = await authorize(["admin"]);
    const input = z
      .object({ publish: z.boolean(), approved: z.literal(true) })
      .parse(await request.json());
    const c = await collections();
    const session = c.client.startSession();
    try {
      await session.withTransaction(async () => {
        const config = await c.settings.findOne({ _id: "event" }, { session });
        if (!config) throw new HttpError(409, "Configure the event first.");
        if (
          input.publish &&
          (!config.submissionDeadline ||
            new Date(config.submissionDeadline).getTime() > Date.now())
        )
          throw new HttpError(
            409,
            "Wait until the official submission deadline has passed before publishing results.",
          );
        await c.settings.updateOne(
          { _id: "event" },
          { $inc: { judgingRevision: 1 } },
          { session },
        );
        if (input.publish) {
          const teams = await c.teams
            .find(
              { "payment.status": "confirmed", "submission.final": true },
              { session },
            )
            .toArray();
          if (!teams.length)
            throw new HttpError(
              409,
              "No final submissions are ready for results.",
            );
          const ranked: {
            teamName: string;
            projectTitle: string;
            points: number;
          }[] = [];
          for (const team of teams) {
            const assignments = await c.assignments
              .find({ teamId: team._id }, { session })
              .toArray();
            if (!assignments.length)
              throw new HttpError(
                409,
                `Assign a judge to ${team.name} before publishing results.`,
              );
            const scores = await c.scores
              .find(
                {
                  teamId: team._id,
                  judgeId: { $in: assignments.map((a) => a.judgeId) },
                },
                { session },
              )
              .toArray();
            if (scores.length !== assignments.length)
              throw new HttpError(
                409,
                `All assigned judges must score ${team.name} before results can be published.`,
              );
            ranked.push({
              teamName: team.name,
              projectTitle: team.submission.title,
              points:
                Math.round(
                  (scores.reduce(
                    (s, v) => s + v.scores.reduce((a, b) => a + b, 0),
                    0,
                  ) /
                    scores.length) *
                    100,
                ) / 100,
            });
          }
          ranked.sort(
            (a, b) =>
              b.points - a.points || a.teamName.localeCompare(b.teamName),
          );
          await c.results.deleteMany({}, { session });
          await c.results.insertMany(
            ranked.map((r) => ({
              ...r,
              place: ranked.findIndex((v) => v.points === r.points) + 1,
            })),
            { session },
          );
        }
        await c.settings.updateOne(
          { _id: "event" },
          { $set: { resultsPublished: input.publish } },
          { session },
        );
        await c.audit.insertOne(
          {
            actorId: admin._id,
            action: input.publish ? "results_published" : "results_unpublished",
            createdAt: new Date(),
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return json({
      message: input.publish
        ? "Approved results are now public."
        : "Results are unpublished. Judging is open again.",
    });
  } catch (e) {
    return apiError(e);
  }
}
