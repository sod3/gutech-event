import { collections } from "@/lib/db";
import { getSettings, safeTeam } from "@/lib/event";
import { mailConfigured } from "@/lib/mail";
import { apiError, authorize, json } from "@/lib/security";
export async function GET() {
  try {
    await authorize(["admin"]);
    const c = await collections();
    const [teams, settings, judges, scores, assignments, audit, mail] =
      await Promise.all([
        c.teams.find().sort({ createdAt: -1 }).toArray(),
        getSettings(),
        c.users
          .find(
            { role: "judge", disabled: false },
            { projection: { passwordHash: 0 } },
          )
          .toArray(),
        c.scores.find().toArray(),
        c.assignments.find().toArray(),
        c.audit.find().sort({ createdAt: -1 }).limit(100).toArray(),
        c.mail
          .aggregate<{ _id: string; count: number }>([
            { $group: { _id: "$status", count: { $sum: 1 } } },
          ])
          .toArray(),
      ]);
    return json({
      teams: teams.map((t) => safeTeam(t)),
      settings,
      judges: judges.map((j) => ({
        id: j._id.toString(),
        name: j.name,
        email: j.email,
      })),
      scores: scores.map((s) => ({
        teamId: s.teamId.toString(),
        judgeId: s.judgeId.toString(),
        scores: s.scores,
        feedback: s.feedback,
      })),
      assignments: assignments.map((a) => ({
        teamId: a.teamId.toString(),
        judgeId: a.judgeId.toString(),
      })),
      audit: audit.map((a) => ({
        id: a._id?.toString(),
        action: a.action,
        before: a.before,
        after: a.after,
        note: a.note,
        teamId: a.teamId?.toString(),
        date: a.createdAt.toISOString(),
      })),
      mail: { configured: mailConfigured(), statuses: mail },
    });
  } catch (e) {
    return apiError(e);
  }
}
