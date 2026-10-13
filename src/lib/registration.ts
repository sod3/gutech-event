import type { Filter } from "mongodb";
import type { TeamDoc } from "./types";

export const REGISTRATION_STATUSES = [
  "new",
  "contacted",
  "awaiting_confirmation",
  "confirmed",
] as const;
export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];
export const REGISTRATION_LABELS: Record<RegistrationStatus, string> = {
  new: "New Registration",
  contacted: "Contacted",
  awaiting_confirmation: "Awaiting Confirmation",
  confirmed: "Confirmed",
};
export const ORGANIZER_FOLLOW_UP =
  "Our organizing team will contact you on WhatsApp with further details, including registration fee payment instructions.";

// Existing confirmed teams retain access without rewriting their payment history.
export function registrationStatus(
  team: Pick<TeamDoc, "registrationStatus" | "payment">,
): RegistrationStatus {
  return (
    team.registrationStatus ??
    (team.payment.status === "confirmed" ? "confirmed" : "new")
  );
}
export const CONFIRMED_TEAM_FILTER: Filter<TeamDoc> = {
  $or: [
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
  const message = `Assalamualaikum ${team.members[0].name},\n\nThank you for registering Team ${team.name} for BuildFest 2026 at GUtech University!\n\nWe are pleased to receive your registration. The registration fee is PKR 1,500 per team.\n\nWe will share the next steps and payment details with you.\n\nRegards,\nBuildFest 2026 Organizing Team\nGUtech Entrepreneurship Society`;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
