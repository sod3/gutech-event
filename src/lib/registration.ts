import type { Filter } from "mongodb";
import type { TeamDoc } from "./types";
export const REGISTRATION_STATUSES = [
  "pending",
  "shortlisted",
  "rejected",
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];
export const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
};
export const STARTUP_STAGES = [
  "Idea Only",
  "Prototype",
  "MVP",
  "Existing or Growing Business",
] as const;
export type StartupStage = (typeof STARTUP_STAGES)[number];
export const ORGANIZER_FOLLOW_UP =
  "Our team will review your startup and PDF pitch deck and contact you if shortlisted. Registration is completely free.";
// Existing confirmed teams retain access without rewriting their payment history.
export function registrationStatus(
  team: Pick<TeamDoc, "registrationStatus" | "payment">,
): RegistrationStatus {
  const status = team.registrationStatus;
  if (status === "shortlisted" || status === "confirmed") return "shortlisted";
  if (status === "rejected") return "rejected";
  if (status) return "pending";
  return team.payment.status === "confirmed" ? "shortlisted" : "pending";
}
export const CONFIRMED_TEAM_FILTER: Filter<TeamDoc> = {
  $or: [
    { registrationStatus: "shortlisted" },
    { registrationStatus: "confirmed" },
    { registrationStatus: { $exists: false }, "payment.status": "confirmed" },
  ],
};
export function normalizeWhatsApp(value: string): string | null {
  const raw = value.trim();
  if (!/^\+?[\d\s()-]+$/.test(raw)) return null;
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("00")) digits = digits.slice(2);
  // Pakistan local mobile numbers: 03xx... or 3xx...
  if (/^03\d{9}$/.test(digits)) digits = `92${digits.slice(1)}`;
  else if (/^3\d{9}$/.test(digits)) digits = `92${digits}`;
  if (!/^[1-9]\d{7,14}$/.test(digits)) return null;
  if (digits.startsWith("92") && !/^923\d{9}$/.test(digits)) return null;
  if (!raw.startsWith("+") && !raw.startsWith("00") && !digits.startsWith("92"))
    return null;
  return digits;
}
export function whatsappContactUrl(team: {
  name: string;
  whatsapp: string;
  members: { name: string }[];
}): string | null {
  const number = normalizeWhatsApp(team.whatsapp);
  if (!number) return null;
  const message = `Assalamualaikum ${team.members[0].name},\n\nThank you for applying with ${team.name} to LEAP 3, GUtech University's Official Startup Pitching Event.\n\nRegistration is completely free. Our team reviews every startup and PDF pitch deck and will contact shortlisted teams with pitching details.\n\nRegards,\nLEAP 3 Organizing Team\nEntrepreneurship Society`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
