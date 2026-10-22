import { collections } from "@/lib/db";
import { apiError, authorize } from "@/lib/security";
import { registrationStatus, REGISTRATION_LABELS } from "@/lib/registration";
function cell(value: unknown) {
  const s = String(value ?? "");
  return `"${(/^[=+\-@\t\r]/.test(s) ? "'" : "") + s.replace(/"/g, '""')}"`;
}
export async function GET() {
  try {
    await authorize(["admin"]);
    const teams = await (
      await collections()
    ).teams
      .find()
      .sort({ createdAt: -1 })
      .toArray();
    const rows = [
      [
        "Registration ID",
        "Startup",
        "Startup stage",
        "Startup description",
        "Application pitch deck",
        "Leader",
        "Email",
        "WhatsApp",
        "University / Organization",
        "Department",
        "Size",
        "Members",
        "Registration status",
        "Internal notes",
        "WhatsApp contact consent",
        "Project",
        "Final submission",
        "Created",
      ],
      ...teams.map((t) => [
        t.registrationId,
        t.name,
        t.startupStage || "",
        t.startupDescription || "",
        t.applicationDeckFileId || t.submission.deckFileId || "",
        t.members[0].name,
        t.members[0].email,
        t.whatsapp,
        t.institution || "",
        t.department,
        t.members.length,
        t.members.map((m) => `${m.name} <${m.email}>`).join("; "),
        REGISTRATION_LABELS[registrationStatus(t)],
        t.internalNotes || "",
        t.whatsappConsent ? "Yes" : "Not recorded (legacy registration)",
        t.submission.title,
        t.submission.final,
        t.createdAt.toISOString(),
      ]),
    ];
    return new Response(
      "\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n"),
      {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=leap3-applications.csv",
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (e) {
    return apiError(e);
  }
}
