import { collections } from "@/lib/db";
import { apiError, authorize, json, sameOrigin } from "@/lib/security";
import { settingsSchema } from "@/lib/validation";
export async function PUT(request: Request) {
  try {
    sameOrigin(request); const admin = await authorize(["admin"]); const input = settingsSchema.parse(await request.json()); const c = await collections();
    await c.settings.updateOne({ _id: "event" }, { $set: input, $setOnInsert: { resultsPublished: false } }, { upsert: true });
    await c.audit.insertOne({ actorId: admin._id, action: "event_settings_updated", createdAt: new Date() });
    return json({ message: "Event configuration saved." });
  } catch (e) { return apiError(e); }
}
