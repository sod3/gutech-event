import { z } from "zod";
import { ObjectId } from "mongodb";
import { collections } from "@/lib/db";
import { apiError, authorize, id, json, sameOrigin } from "@/lib/security";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const admin = await authorize(["admin"]);
    const input = z
      .object({
        title: z.string().trim().min(3).max(150),
        message: z.string().trim().min(5).max(3000),
      })
      .parse(await request.json());
    const c = await collections();
    await c.announcements.insertOne({
      _id: new ObjectId(),
      ...input,
      createdAt: new Date(),
    });
    await c.audit.insertOne({
      actorId: admin._id,
      action: "announcement_published",
      note: input.title,
      createdAt: new Date(),
    });
    return json({ message: "Announcement published." });
  } catch (e) {
    return apiError(e);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const admin = await authorize(["admin"]);
    const input = z.object({ id: z.string() }).parse(await request.json());
    const c = await collections();
    await c.announcements.deleteOne({ _id: id(input.id) });
    await c.audit.insertOne({
      actorId: admin._id,
      action: "announcement_deleted",
      createdAt: new Date(),
    });
    return json({ message: "Announcement removed." });
  } catch (e) {
    return apiError(e);
  }
}
