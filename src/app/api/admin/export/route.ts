import { collections } from "@/lib/db";
import { apiError, authorize } from "@/lib/security";
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
        "Team",
        "Leader",
        "Email",
        "WhatsApp",
        "Department",
        "Size",
        "Members",
        "Payment status",
        "Amount PKR",
        "Reference",
        "Project",
        "Final submission",
        "Created",
      ],
      ...teams.map((t) => [
        t.registrationId,
        t.name,
        t.members[0].name,
        t.members[0].email,
        t.whatsapp,
        t.department,
        t.members.length,
        t.members.map((m) => `${m.name} <${m.email}>`).join("; "),
        t.payment.status,
        t.payment.amount,
        t.payment.reference,
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
          "Content-Disposition":
            "attachment; filename=buildfest-registrations.csv",
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (e) {
    return apiError(e);
  }
}
