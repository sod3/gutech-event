import "server-only";
import { unstable_cache } from "next/cache";
import { collections, database } from "./db";
import { PUBLIC_EVENT_TAG } from "./public-event-cache";
import { CONFIRMED_TEAM_FILTER, registrationStatus } from "./registration";
import {
  DEFAULT_SETTINGS,
  type Announcement,
  type EventSettings,
  type PublicEvent,
  type PublicResult,
  type SafeTeam,
  type TeamDoc,
} from "./types";
export async function getSettings(): Promise<EventSettings> {
  const doc = await (await collections()).settings.findOne({ _id: "event" });
  return eventSettings(doc);
}
function eventSettings(doc: EventSettings | null): EventSettings {
  if (!doc) return { ...DEFAULT_SETTINGS };
  // Pick fields explicitly so database-only fields never cross the boundary.
  return {
    registrationOpen: doc.registrationOpen,
    eventDate: doc.eventDate,
    registrationDeadline: doc.registrationDeadline,
    submissionDeadline: doc.submissionDeadline,
    phaseDates: doc.phaseDates,
    paymentMethods: doc.paymentMethods,
    prizes: doc.prizes,
    people: doc.people,
    supportEmail: doc.supportEmail,
    supportWhatsApp: doc.supportWhatsApp,
    refundPolicy: doc.refundPolicy,
    resultsPublished: doc.resultsPublished,
    organizerLogoId: doc.organizerLogoId,
    partnerLogoId: doc.partnerLogoId,
  };
}
// Keep the existing router configuration; this explicit data cache does not
// require enabling Cache Components across authenticated pages and API routes.
const cachedPublicEvent = unstable_cache(
  async (): Promise<PublicEvent> => {
    // Public reads must not wait for account indexes and schema setup. Those
    // remain enforced by collections() on the authenticated/write paths.
    const { db } = await database();
    const [doc, confirmedTeams, announcements] = await Promise.all([
      db.collection<EventSettings & { _id: string }>("settings")
        .findOne({ _id: "event" }),
      db.collection<TeamDoc>("teams").countDocuments(CONFIRMED_TEAM_FILTER),
      db.collection<Announcement>("announcements")
        .find()
        .sort({ createdAt: -1 })
        .limit(20)
        .toArray(),
    ]);
    const settings = eventSettings(doc);
    const results = settings.resultsPublished
      ? await db.collection<PublicResult>("results")
          .find({}, { projection: { _id: 0 } })
          .sort({ place: 1 })
          .toArray()
      : [];
    return {
      ...settings,
      paymentMethods: [],
      people: settings.people.filter((p) => p.verified),
      prizes: settings.prizes.filter((p) => p.verified),
      confirmedTeams,
      available: true,
      announcements: announcements.map((a) => ({
        id: a._id.toString(),
        title: a.title,
        message: a.message,
        date: a.createdAt.toISOString(),
      })),
      results,
    };
  },
  ["leap-public-event-v1", process.env.MONGODB_DB || "buildfest2026"],
  { revalidate: 15, tags: [PUBLIC_EVENT_TAG] },
);
export async function publicEvent(): Promise<PublicEvent> {
  try {
    return await cachedPublicEvent();
  } catch {
    // A connection failure is never stored as a successful cache entry.
    return {
      ...DEFAULT_SETTINGS,
      available: false,
      confirmedTeams: null,
      announcements: [],
      results: [],
    };
  }
}
export function safeTeam(team: TeamDoc, includeInvite = false): SafeTeam {
  return {
    id: team._id.toString(),
    registrationId: team.registrationId,
    name: team.name,
    members: team.members,
    whatsapp: team.whatsapp,
    institution: team.institution,
    department: team.department,
    registrationStatus: registrationStatus(team),
    startupStage: team.startupStage,
    startupDescription: team.startupDescription,
    applicationDeckFileId: team.applicationDeckFileId,
    payment: {
      status: team.payment.status,
      methodId: team.payment.methodId,
      reference: team.payment.reference,
      amount: team.payment.amount,
      receiptId: team.payment.receiptId?.toString(),
      note: team.payment.note,
      submittedAt: team.payment.submittedAt.toISOString(),
      reviewedAt: team.payment.reviewedAt?.toISOString(),
    },
    submission: {
      ...team.submission,
      updatedAt:
        team.submission.updatedAt instanceof Date
          ? team.submission.updatedAt.toISOString()
          : team.submission.updatedAt,
    },
    checklist: team.checklist,
    inviteToken: includeInvite ? team.inviteToken : "",
    createdAt: team.createdAt.toISOString(),
  };
}
