import { z } from "zod";
import { collections } from "@/lib/db";
import { getSettings } from "@/lib/event";
import { prepareFile } from "@/lib/files";
import {
  apiError,
  authorize,
  HttpError,
  json,
  rateLimit,
  sameOrigin,
} from "@/lib/security";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await authorize(["participant"]);
    await rateLimit(request, "payment-retry", 5, 60, user._id.toString());
    const c = await collections();
    const team = await c.teams.findOne({
      _id: user.teamId,
      leaderId: user._id,
    });
    if (!team || team.payment.status !== "rejected")
      throw new HttpError(
        409,
        "Only rejected payments can be resubmitted. Pending payments are already in review.",
      );
    const settings = await getSettings();
    const form = await request.formData();
    const input = z
      .object({
        methodId: z.string().max(80),
        reference: z.string().trim().min(3).max(100),
      })
      .parse(JSON.parse(String(form.get("data") || "{}")));
    if (
      !settings.paymentMethods.some((m) => m.id === input.methodId && m.enabled)
    )
      throw new HttpError(400, "Select an official payment method.");
    const receipt = form.get("receipt");
    const file =
      receipt instanceof File && receipt.size
        ? await prepareFile(receipt, "receipt", team._id)
        : undefined;
    const session = c.client.startSession();
    try {
      await session.withTransaction(async () => {
        const result = await c.teams.updateOne(
          { _id: team._id, "payment.status": "rejected" },
          {
            $set: {
              "payment.status": "pending",
              "payment.methodId": input.methodId,
              "payment.reference": input.reference,
              "payment.referenceKey": `${input.methodId}:${input.reference.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
              "payment.note": "",
              "payment.submittedAt": new Date(),
              ...(file ? { "payment.receiptId": file._id } : {}),
            },
            $unset: { "payment.reviewedAt": "", "payment.reviewedBy": "" },
          },
          { session },
        );
        if (!result.modifiedCount)
          throw new HttpError(
            409,
            "This payment has already been resubmitted.",
          );
        if (file) await c.files.insertOne(file, { session });
        await c.audit.insertOne(
          {
            actorId: user._id,
            teamId: team._id,
            action: "payment_resubmitted",
            before: "rejected",
            after: "pending",
            createdAt: new Date(),
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return json({ message: "Payment resubmitted for organizer review." });
  } catch (e) {
    return apiError(e);
  }
}
