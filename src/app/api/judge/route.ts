import { z } from "zod";
import { collections } from "@/lib/db";
import { getSettings } from "@/lib/event";
import { apiError, authorize, HttpError, id, json, sameOrigin } from "@/lib/security";
import { CRITERIA } from "@/lib/types";
export async function GET() {
  try {
    const judge = await authorize(["judge"]); const c = await collections(); const assignments = await c.assignments.find({ judgeId: judge._id }).toArray();
    const [teams, scores] = await Promise.all([c.teams.find({ _id: { $in: assignments.map(a => a.teamId) }, "payment.status": "confirmed" }).toArray(), c.scores.find({ judgeId: judge._id }).toArray()]);
    return json({ teams: teams.map(t => ({ id: t._id.toString(), name: t.name, registrationId: t.registrationId, submission: t.submission })), scores: scores.map(s => ({ teamId: s.teamId.toString(), scores: s.scores, feedback: s.feedback })), resultsPublished: (await getSettings()).resultsPublished });
  } catch (e) { return apiError(e); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request); const judge = await authorize(["judge"]); const c = await collections();
    const input = z.object({ teamId: z.string(), scores: z.array(z.number().int().min(0)).length(6), feedback: z.string().trim().max(3000) }).parse(await request.json());
    input.scores.forEach((score, i) => { if (score > CRITERIA[i].points) throw new HttpError(400, `The maximum score for ${CRITERIA[i].name} is ${CRITERIA[i].points}.`); });
    const teamId = id(input.teamId);
    if (!await c.assignments.findOne({ judgeId: judge._id, teamId })) throw new HttpError(403, "This team is not assigned to you.");
    if (!await c.teams.findOne({ _id: teamId, "payment.status": "confirmed", "submission.final": true })) throw new HttpError(409, "The team's final project submission is required before scoring.");
    if ((await getSettings()).resultsPublished) throw new HttpError(409, "Results are published. Scoring is locked.");
    await c.scores.updateOne({ judgeId: judge._id, teamId }, { $set: { scores: input.scores, feedback: input.feedback, updatedAt: new Date() } }, { upsert: true });
    await c.audit.insertOne({ actorId: judge._id, teamId, action: "judge_score_saved", after: String(input.scores.reduce((a,b) => a+b,0)), createdAt: new Date() });
    return json({ message: "Scores saved." });
  } catch (e) { return apiError(e); }
}
