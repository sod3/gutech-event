import { collections } from "@/lib/db";
import { apiError, authorize, HttpError, id } from "@/lib/security";
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const fileId = id((await context.params).id); const c = await collections();
    const file = await c.files.findOne({ _id: fileId }); if (!file) throw new HttpError(404, "File not found.");
    if (file.purpose !== "logo") {
      const user = await authorize();
      if (user.role === "participant" && !user.teamId?.equals(file.teamId!)) throw new HttpError(403, "This file belongs to another team.");
      if (user.role === "judge" && (file.purpose !== "deck" || !await c.assignments.findOne({ judgeId: user._id, teamId: file.teamId }))) throw new HttpError(403, "This project is not assigned to you.");
    }
    return new Response(new Uint8Array(file.data.buffer), { headers: { "Content-Type": file.type, "Content-Disposition": `${file.purpose === "logo" ? "inline" : "attachment"}; filename="${file.name}"`, "Cache-Control": file.purpose === "logo" ? "public, max-age=3600" : "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "sandbox; default-src 'none'" } });
  } catch (e) { return apiError(e); }
}
