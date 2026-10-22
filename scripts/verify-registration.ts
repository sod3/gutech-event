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
assert.match(link.searchParams.get("text")!, /LEAP 3/);
assert.match(link.searchParams.get("text")!, /completely free/);
assert.doesNotMatch(link.searchParams.get("text")!, /1,500|payment/i);
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
  "shortlisted",
);
assert.equal(
  registrationStatus({
    registrationStatus: "contacted",
    payment: { status: "confirmed" },
  } as Parameters<typeof registrationStatus>[0]),
  "pending",
);
const valid = {
  startupName: "A Startup",
  startupStage: "Idea Only",
  startupDescription:
    "We help students discover useful internships through a curated matching service for local organizations.",
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
const largeTeam = {
  ...valid,
  teamSize: 21,
  members: Array.from({ length: 20 }, (_, i) => ({
    name: `Member ${i}`,
    email: `member${i}@example.com`,
  })),
};
assert.equal(registrationSchema.safeParse(largeTeam).success, true);
const saved = registrationSchema.parse(valid);
assert.equal(saved.whatsapp, "+923001234567");
assert.equal(saved.email, "leader@example.com");
assert.equal(saved.institution, "Test University");
assert.equal("reference" in saved, false);
for (const invalid of [
  { teamSize: 0 },
  { startupStage: "Invalid" },
  { startupName: "" },
  { startupDescription: "Too short" },
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
  "PASS startup fields, idea-only eligibility, 21-member teams, legacy status mapping, WhatsApp formats and deadline boundaries.",
);
