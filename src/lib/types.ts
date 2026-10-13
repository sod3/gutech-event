import type { ObjectId, Binary } from "mongodb";
import type { RegistrationStatus } from "./registration";

export type Role = "participant" | "admin" | "judge";
export type PaymentStatus = "pending" | "confirmed" | "rejected";
export type Member = { name: string; email: string };
export type PaymentMethod = {
  id: string;
  name: string;
  accountTitle: string;
  accountNumber: string;
  instructions: string;
  enabled: boolean;
};
export type Person = {
  id: string;
  name: string;
  title: string;
  kind: "judge" | "mentor";
  verified: boolean;
};
export type Prize = {
  id: string;
  title: string;
  description: string;
  verified: boolean;
};
export type EventSettings = {
  registrationOpen: boolean;
  eventDate: string;
  registrationDeadline: string;
  submissionDeadline: string;
  phaseDates: string[];
  paymentMethods: PaymentMethod[];
  prizes: Prize[];
  people: Person[];
  supportEmail: string;
  supportWhatsApp: string;
  refundPolicy: string;
  resultsPublished: boolean;
  organizerLogoId?: string;
  partnerLogoId?: string;
};
export type UserDoc = {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  role: Role;
  teamId?: ObjectId;
  disabled: boolean;
  createdAt: Date;
};
export type Submission = {
  title: string;
  problem: string;
  solution: string;
  research: string;
  mvpUrl: string;
  pitchUrl: string;
  deckFileId?: string;
  aiTools: string;
  aiDeclaration: boolean;
  final: boolean;
  updatedAt?: Date | string;
};
export type TeamDoc = {
  _id: ObjectId;
  registrationId: string;
  name: string;
  nameKey: string;
  leaderId: ObjectId;
  members: Member[];
  whatsapp: string;
  department: string;
  registrationStatus?: RegistrationStatus;
  internalNotes?: string;
  whatsappConsent?: boolean;
  whatsappConsentAt?: Date;
  registrationKey?: string;
  registrationFingerprint?: string;
  payment: {
    status: PaymentStatus;
    methodId?: string;
    reference?: string;
    referenceKey?: string;
    amount: number;
    receiptId?: ObjectId;
    note: string;
    submittedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: ObjectId;
  };
  submission: Submission;
  checklist: string[];
  inviteToken: string;
  createdAt: Date;
};
export type SafeTeam = {
  id: string;
  registrationId: string;
  name: string;
  members: Member[];
  whatsapp: string;
  department: string;
  registrationStatus: RegistrationStatus;
  payment: {
    status: PaymentStatus;
    methodId?: string;
    reference?: string;
    amount: number;
    receiptId?: string;
    note: string;
    submittedAt: string;
    reviewedAt?: string;
  };
  submission: Submission;
  checklist: string[];
  inviteToken: string;
  createdAt: string;
};
export type SessionDoc = {
  _id: ObjectId;
  tokenHash: string;
  userId: ObjectId;
  expiresAt: Date;
  createdAt: Date;
};
export type FileDoc = {
  _id: ObjectId;
  teamId?: ObjectId;
  purpose: "receipt" | "deck" | "logo";
  name: string;
  type: string;
  data: Binary;
  size: number;
  createdAt: Date;
};
export type Announcement = {
  _id: ObjectId;
  title: string;
  message: string;
  createdAt: Date;
};
export type AuditDoc = {
  _id?: ObjectId;
  actorId: ObjectId;
  action: string;
  teamId?: ObjectId;
  before?: string;
  after?: string;
  note?: string;
  createdAt: Date;
};
export type ScoreDoc = {
  _id?: ObjectId;
  judgeId: ObjectId;
  teamId: ObjectId;
  scores: number[];
  feedback: string;
  updatedAt: Date;
};
export type AssignmentDoc = {
  _id?: ObjectId;
  judgeId: ObjectId;
  teamId: ObjectId;
};
export type PublicResult = {
  teamName: string;
  projectTitle: string;
  points: number;
  place: number;
};
export type PublicEvent = EventSettings & {
  confirmedTeams: number | null;
  available: boolean;
  announcements: { id: string; title: string; message: string; date: string }[];
  results: PublicResult[];
};

export const EMPTY_SUBMISSION: Submission = {
  title: "",
  problem: "",
  solution: "",
  research: "",
  mvpUrl: "",
  pitchUrl: "",
  aiTools: "",
  aiDeclaration: false,
  final: false,
};
export const DEFAULT_SETTINGS: EventSettings = {
  registrationOpen: false,
  eventDate: "",
  registrationDeadline: "",
  submissionDeadline: "",
  phaseDates: ["", "", "", "", ""],
  paymentMethods: [],
  prizes: [],
  people: [],
  supportEmail: "",
  supportWhatsApp: "",
  refundPolicy: "",
  resultsPublished: false,
};
export const FEE = 1500;
export const CRITERIA = [
  {
    name: "Problem & real-world impact",
    points: 30,
    description:
      "A meaningful problem. A clear understanding of who it affects. A solution that makes a difference.",
  },
  {
    name: "Uniqueness & innovation",
    points: 25,
    description:
      "An original approach or a thoughtful improvement that stands apart from existing solutions.",
  },
  {
    name: "Explaining & pitching the solution",
    points: 20,
    description:
      "Communicate the problem, your solution, and its value with clarity and conviction.",
  },
  {
    name: "Feasibility & market potential",
    points: 10,
    description:
      "A practical path to execution and a credible opportunity to reach real users.",
  },
  {
    name: "Research & problem validation",
    points: 10,
    description:
      "Evidence from real people, research, or interviews that supports the need for your idea.",
  },
  {
    name: "MVP / website prototype",
    points: 5,
    description:
      "A prototype that demonstrates the core idea. Complexity is not a requirement.",
  },
] as const;
export function registrationState(settings: EventSettings) {
  if (!settings.registrationOpen)
    return {
      open: false,
      reason:
        "Registration is opening soon. Official dates will be announced here.",
    };
  if (!settings.registrationDeadline)
    return {
      open: false,
      reason:
        "The registration deadline is being finalized. Please check back soon.",
    };
  if (new Date(settings.registrationDeadline).getTime() <= Date.now())
    return {
      open: false,
      reason:
        "Registration has closed. Thank you for your interest in BuildFest 2026.",
    };
  return { open: true, reason: "Registration is open" };
}
