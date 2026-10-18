import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  normalizeWhatsApp,
  registrationStatus,
  whatsappContactUrl,
} from "../src/lib/registration";
import { registrationSchema } from "../src/lib/validation";
import { DEFAULT_SETTINGS, registrationState } from "../src/lib/types";
import { formatDate } from "../src/lib/dates";

for (const number of [
  "03001234567",
  "3001234567",
  "+92 300 1234567",
  "0092-300-1234567",
  "923001234567",
]) {
  assert.equal(normalizeWhatsApp(number), "923001234567");
}
assert.equal(normalizeWhatsApp("+44 7700 900123"), "447700900123");
for (const number of [
  "1234567890",
  "+92 0300 1234567",
  "0300ABC4567",
  "+00012345678",
  "+92300",
  "+1234567890123456",
]) {
  assert.equal(normalizeWhatsApp(number), null);
}
const link = new URL(
  whatsappContactUrl({
    name: "A & B",
    whatsapp: "03001234567",
    members: [{ name: "Test Leader" }],
  })!,
);
assert.equal(link.origin, "https://wa.me");
assert.equal(link.pathname, "/923001234567");
assert.equal(
  link.searchParams.get("text"),
  "Assalamualaikum Test Leader,\n\nThank you for registering Team A & B for BuildFest 2026 at GUtech University!\n\nWe are pleased to receive your registration. The registration fee is PKR 1,500 per team.\n\nWe will share the next steps and payment details with you.\n\nRegards,\nBuildFest 2026 Organizing Team\nGUtech Entrepreneurship Society",
);
assert.equal(
  whatsappContactUrl({
    name: "Legacy",
    whatsapp: "bad-number",
    members: [{ name: "Leader" }],
  }),
  null,
);
assert.equal(
  registrationStatus({ payment: { status: "confirmed" } } as Parameters<
    typeof registrationStatus
  >[0]),
  "confirmed",
);
assert.equal(
  registrationStatus({
    registrationStatus: "contacted",
    payment: { status: "confirmed" },
  } as Parameters<typeof registrationStatus>[0]),
  "contacted",
);
const valid = {
  teamName: "A Team",
  leaderName: "Test Leader",
  email: "LEADER@EXAMPLE.COM",
  password: "safe-test-password",
  whatsapp: "03001234567",
  institution: "  Test University  ",
  department: "Business",
  teamSize: 1,
  members: [],
  requestId: randomUUID(),
  whatsappConsent: true,
  agreement: true,
};
const saved = registrationSchema.parse(valid);
assert.equal(saved.whatsapp, "+923001234567");
assert.equal(saved.email, "leader@example.com");
assert.equal(saved.institution, "Test University");
assert.equal("reference" in saved, false);
for (const invalid of [
  { teamSize: 0 },
  { teamSize: 4 },
  { whatsappConsent: false },
  { email: "bad" },
  { password: "short" },
  { institution: undefined },
  { institution: "" },
  { institution: "   " },
  { institution: "A" },
  { institution: "A".repeat(161) },
  { teamSize: 2 },
  { members: [{ name: "Second", email: valid.email }] },
]) {
  assert.equal(
    registrationSchema.safeParse({ ...valid, ...invalid }).success,
    false,
  );
}
assert.equal(
  registrationState({
    ...DEFAULT_SETTINGS,
    registrationOpen: true,
    registrationDeadline: new Date(Date.now() + 86400000).toISOString(),
  }).open,
  true,
);
const schedule = { ...DEFAULT_SETTINGS, registrationOpen: true };
const deadline = new Date(schedule.registrationDeadline).getTime();
const originalNow = Date.now;
try {
  for (const [now, expectedOpen] of [
    [new Date("2026-10-22T23:59:59+05:00").getTime(), true],
    [new Date("2026-10-30T00:00:00+05:00").getTime(), true],
    [deadline - 1, true],
    [deadline, false],
    [new Date("2026-10-31T00:00:00+05:00").getTime(), false],
  ] as const) {
    Date.now = () => now;
    assert.equal(registrationState(schedule).open, expectedOpen);
  }
} finally {
  Date.now = originalNow;
}
assert.match(formatDate(schedule.eventDate, true), /30.*Oct.*2026/);
assert.doesNotMatch(formatDate(schedule.eventDate, true), /AM|PM|PKT|:/i);
assert.match(
  formatDate(schedule.registrationDeadline),
  /30.*Oct.*2026.*11:59.*pm.*PKT/i,
);
console.log(
  "PASS registration validation with required university/college, legacy statuses, international WhatsApp formats, exact prefilled message, and 30 October deadline boundaries in Pakistan time.",
);
