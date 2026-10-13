import { z } from "zod";
import { normalizeWhatsApp } from "./registration";

const clean = (max: number) => z.string().trim().max(max);
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address.")
  .max(254);
export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters.")
  .max(72)
  .refine(
    (v) => new TextEncoder().encode(v).length <= 72,
    "Use a password no longer than 72 bytes.",
  );
const member = z.object({
  name: clean(100).min(2, "Enter a full name."),
  email: emailSchema,
});
export const whatsappSchema = clean(24)
  .refine(
    (value) => normalizeWhatsApp(value) !== null,
    "Enter a valid WhatsApp mobile number, e.g. 03001234567 or +923001234567.",
  )
  .transform((value) => `+${normalizeWhatsApp(value)}`);
export const teamDetailsSchema = z.object({
  teamName: clean(80).min(2, "Give your team a name."),
  leaderName: clean(100).min(2, "Enter your full name."),
  email: emailSchema,
  password: passwordSchema,
  whatsapp: whatsappSchema,
  department: clean(100).min(2, "Enter your department or program."),
  teamSize: z.number().int().min(1).max(3),
});
export const registrationSchema = z
  .object({
    ...teamDetailsSchema.shape,
    members: z.array(member).max(2),
    requestId: z.string().uuid(),
    whatsappConsent: z.literal(true, {
      error: "Please consent to WhatsApp contact from the organizers.",
    }),
    agreement: z.literal(true, {
      error: "Please agree to the event rules and privacy policy.",
    }),
  })
  .superRefine((v, ctx) => {
    if (v.members.length !== v.teamSize - 1)
      ctx.addIssue({
        code: "custom",
        path: ["members"],
        message: "The number of members must match your team size.",
      });
    const emails = [v.email, ...v.members.map((m) => m.email)];
    if (new Set(emails).size !== emails.length)
      ctx.addIssue({
        code: "custom",
        path: ["members"],
        message: "Each participant must have a different email address.",
      });
  });
const optionalUrl = z.union([
  z.literal(""),
  z
    .string()
    .trim()
    .url()
    .max(500)
    .refine((v) => /^https?:\/\//i.test(v), "Use an http or https link."),
]);
export const submissionSchema = z
  .object({
    title: clean(120),
    problem: clean(4000),
    solution: clean(5000),
    research: clean(4000),
    mvpUrl: optionalUrl,
    pitchUrl: optionalUrl,
    aiTools: clean(1000),
    aiDeclaration: z.boolean(),
    final: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.final) {
      for (const key of ["title", "problem", "solution"] as const)
        if (v[key].length < (key === "title" ? 3 : 30))
          ctx.addIssue({
            code: "custom",
            path: [key],
            message: `Complete your ${key} before final submission.`,
          });
      if (!v.aiDeclaration)
        ctx.addIssue({
          code: "custom",
          path: ["aiDeclaration"],
          message: "Confirm your AI assistance declaration.",
        });
    }
  });
const date = z.union([z.literal(""), z.string().datetime({ offset: true })]);
export const settingsSchema = z
  .object({
    registrationOpen: z.boolean(),
    eventDate: date,
    registrationDeadline: date,
    submissionDeadline: date,
    phaseDates: z.array(date).length(5),
    paymentMethods: z
      .array(
        z.object({
          id: clean(80).min(1),
          name: clean(80).min(2),
          accountTitle: clean(120).min(2),
          accountNumber: clean(120).min(3),
          instructions: clean(2000),
          enabled: z.boolean(),
        }),
      )
      .max(8),
    prizes: z
      .array(
        z.object({
          id: clean(80).min(1),
          title: clean(100).min(2),
          description: clean(1000),
          verified: z.boolean(),
        }),
      )
      .max(12),
    people: z
      .array(
        z.object({
          id: clean(80).min(1),
          name: clean(100).min(2),
          title: clean(200),
          kind: z.enum(["judge", "mentor"]),
          verified: z.boolean(),
        }),
      )
      .max(30),
    supportEmail: z.union([z.literal(""), emailSchema]),
    supportWhatsApp: clean(24),
    refundPolicy: clean(4000),
  })
  .superRefine((v, ctx) => {
    if (
      v.registrationDeadline &&
      v.submissionDeadline &&
      new Date(v.submissionDeadline) <= new Date(v.registrationDeadline)
    )
      ctx.addIssue({
        code: "custom",
        path: ["submissionDeadline"],
        message: "Submission deadline must be after registration closes.",
      });
    if (
      new Set(v.paymentMethods.map((m) => m.id)).size !==
      v.paymentMethods.length
    )
      ctx.addIssue({
        code: "custom",
        path: ["paymentMethods"],
        message: "Payment method identifiers must be unique.",
      });
    if (v.registrationOpen && !v.registrationDeadline)
      ctx.addIssue({
        code: "custom",
        path: ["registrationOpen"],
        message: "Set a registration deadline before opening registration.",
      });
  });
