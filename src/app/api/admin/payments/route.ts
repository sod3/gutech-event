import { z } from "zod";
import { after } from "next/server";
import { collections } from "@/lib/db";
import { queueConfirmation, sendPendingMail } from "@/lib/mail";
import { apiError, authorize, HttpError, id, json, sameOrigin } from "@/lib/security";
export async function POST(request: Request) {
  try {
    sameOrigin(request); const admin = await authorize(["admin"]);
    const input = z.object({ teamId: z.string(), status: z.enum(["confirmed", "rejected"]), note: z.string().trim().max(1000) }).parse(await request.json());
    if (input.status === "rejected" && input.note.length < 5) throw new HttpError(400, "Explain why the payment was rejected so the team can resolve it.");
    const c = await collections(); const teamId = id(input.teamId); const session = c.client.startSession();
    try { await session.withTransaction(async () => {
      const team = await c.teams.findOne({ _id: teamId }, { session });
      if (!team) throw new HttpError(404, "Team not found.");
      if (team.payment.status !== "pending") throw new HttpError(409, "This payment has already been reviewed.");
      const result = await c.teams.updateOne({ _id: teamId, "payment.status": "pending" }, { $set: { "payment.status": input.status, "payment.note": input.note, "payment.reviewedAt": new Date(), "payment.reviewedBy": admin._id } }, { session });
      if (!result.modifiedCount) throw new HttpError(409, "This payment has already been reviewed.");
      await c.audit.insertOne({ actorId: admin._id, teamId, action: "payment_reviewed", before: "pending", after: input.status, note: input.note, createdAt: new Date() }, { session });
      if (input.status === "confirmed") await queueConfirmation(team, session);
    }); } finally { await session.endSession(); }
    if (input.status === "confirmed") after(async () => { await sendPendingMail(); });
    return json({ message: input.status === "confirmed" ? "Payment verified. The team is confirmed." : "Payment rejected. The team can resubmit from their dashboard." });
  } catch (e) { return apiError(e); }
}
