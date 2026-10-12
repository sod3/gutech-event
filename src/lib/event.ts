import "server-only";
import { collections } from "./db";
import { DEFAULT_SETTINGS, type EventSettings, type PublicEvent, type SafeTeam, type TeamDoc } from "./types";

export async function getSettings(): Promise<EventSettings> {
  const doc = await (await collections()).settings.findOne({ _id: "event" });
  if (!doc) return { ...DEFAULT_SETTINGS };
  // Pick fields explicitly so database-only fields never cross the boundary.
  return { registrationOpen: doc.registrationOpen, eventDate: doc.eventDate, registrationDeadline: doc.registrationDeadline, submissionDeadline: doc.submissionDeadline, phaseDates: doc.phaseDates, paymentMethods: doc.paymentMethods, prizes: doc.prizes, people: doc.people, supportEmail: doc.supportEmail, supportWhatsApp: doc.supportWhatsApp, refundPolicy: doc.refundPolicy, resultsPublished: doc.resultsPublished, organizerLogoId: doc.organizerLogoId, partnerLogoId: doc.partnerLogoId };
}
export async function publicEvent(): Promise<PublicEvent> {
  try {
    const c = await collections();
    const settings = await getSettings();
    const [confirmedTeams, announcements, results] = await Promise.all([
      c.teams.countDocuments({ "payment.status": "confirmed" }), c.announcements.find().sort({ createdAt: -1 }).limit(20).toArray(),
      settings.resultsPublished ? c.results.find({}, { projection: { _id: 0 } }).sort({ place: 1 }).toArray() : Promise.resolve([]),
    ]);
    return { ...settings, paymentMethods: settings.paymentMethods.filter(m => m.enabled), people: settings.people.filter(p => p.verified), prizes: settings.prizes.filter(p => p.verified), confirmedTeams, available: true, announcements: announcements.map(a => ({ id: a._id.toString(), title: a.title, message: a.message, date: a.createdAt.toISOString() })), results };
  } catch {
    return { ...DEFAULT_SETTINGS, available: false, confirmedTeams: null, announcements: [], results: [] };
  }
}
export function safeTeam(team: TeamDoc, includeInvite = false): SafeTeam {
  return { id: team._id.toString(), registrationId: team.registrationId, name: team.name, members: team.members, whatsapp: team.whatsapp, department: team.department,
    payment: { status: team.payment.status, methodId: team.payment.methodId, reference: team.payment.reference, amount: team.payment.amount, receiptId: team.payment.receiptId?.toString(), note: team.payment.note, submittedAt: team.payment.submittedAt.toISOString(), reviewedAt: team.payment.reviewedAt?.toISOString() },
    submission: { ...team.submission, updatedAt: team.submission.updatedAt instanceof Date ? team.submission.updatedAt.toISOString() : team.submission.updatedAt }, checklist: team.checklist, inviteToken: includeInvite ? team.inviteToken : "", createdAt: team.createdAt.toISOString() };
}
