import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { MongoClient, ObjectId } from "mongodb";
import bcrypt from "bcryptjs";

if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is required.");
const suffix = randomBytes(8).toString("hex");
const testDbName = `buildfest_verify_${suffix}`;
const prodDbName = process.env.MONGODB_DB || "buildfest2026";
assert.notEqual(testDbName, prodDbName);
const port = Number(process.env.VERIFY_PORT || 3100),
  base = `http://localhost:${port}`;
const client = new MongoClient(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 8000,
});
await client.connect();
const db = client.db(testDbName);
await db
  .collection("teams")
  .createIndex({ "payment.referenceKey": 1 }, { unique: true });
const prodBefore = await client
  .db(prodDbName)
  .collection("teams")
  .countDocuments();
const password = `Verification-${suffix}`;
const adminEmail = `admin-${suffix}@example.test`;
const adminId = new ObjectId();
await db.collection("users").insertOne({
  _id: adminId,
  email: adminEmail,
  name: "Verification Organizer",
  passwordHash: await bcrypt.hash(password, 12),
  role: "admin",
  disabled: false,
  createdAt: new Date(),
});
const legacyId = new ObjectId();
const legacyPayment = {
  status: "confirmed",
  amount: 1500,
  methodId: "legacy-bank",
  reference: "LEGACY-REFERENCE",
  referenceKey: "legacy-bank:legacyreference",
  note: "Historical payment verified",
  submittedAt: new Date(),
  reviewedAt: new Date(),
};
await db.collection("teams").insertOne({
  _id: legacyId,
  registrationId: "BF26-LEGACY",
  name: "Legacy Team",
  nameKey: "legacy team",
  leaderId: adminId,
  members: [{ name: "Legacy Leader", email: `legacy-${suffix}@example.test` }],
  whatsapp: "+923001234567",
  department: "Legacy program",
  payment: legacyPayment,
  submission: {
    title: "",
    problem: "",
    solution: "",
    research: "",
    mvpUrl: "",
    pitchUrl: "",
    aiTools: "",
    aiDeclaration: false,
    final: false,
  },
  checklist: [],
  inviteToken: randomBytes(32).toString("base64url"),
  createdAt: new Date(),
});
const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", String(port)],
  {
    cwd: process.cwd(),
    env: {
      ...process.env,
      MONGODB_DB: testDbName,
      APP_URL: base,
      SMTP_HOST: "",
      SMTP_USER: "",
      SMTP_PASSWORD: "",
      SMTP_FROM: "",
    },
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let serverLog = "";
server.stdout.on("data", (b) => (serverLog += b.toString()));
server.stderr.on("data", (b) => (serverLog += b.toString()));
let checks = 0,
  ip = 1;
function makeClient() {
  let cookie = "";
  const testIp = `203.0.113.${ip++}`;
  return async (path, method = "GET", body, options = {}) => {
    const headers = {
      origin: base,
      "x-forwarded-for": testIp,
      ...options.headers,
    };
    if (cookie) headers.cookie = cookie;
    let payload;
    if (body instanceof FormData) payload = body;
    else if (body !== undefined) {
      payload = JSON.stringify(body);
      headers["content-type"] = "application/json";
    }
    const response = await fetch(`${base}${path}`, {
      method,
      headers,
      body: payload,
      redirect: "manual",
    });
    const setCookie = response.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    const type = response.headers.get("content-type") || "";
    const data = type.includes("application/json")
      ? await response.json()
      : await response.text();
    return { status: response.status, data, headers: response.headers };
  };
}
const guest = makeClient(),
  admin = makeClient(),
  leader = makeClient(),
  other = makeClient(),
  judge = makeClient();
function check(label, value) {
  assert.ok(value, label);
  checks++;
  console.log(`PASS ${label}`);
}
function form(data, receipt) {
  const f = new FormData();
  f.set("data", JSON.stringify(data));
  if (receipt) f.set("receipt", receipt, "receipt.png");
  return f;
}
const registration = {
  teamName: "Verification Team One",
  leaderName: "Test Leader",
  email: `leader-${suffix}@example.test`,
  password,
  whatsapp: "+92 300 0000000",
  department: "Verification program",
  teamSize: 3,
  members: [
    { name: "Test Member Two", email: `member2-${suffix}@example.test` },
    { name: "Test Member Three", email: `member3-${suffix}@example.test` },
  ],
  requestId: randomUUID(),
  whatsappConsent: true,
  agreement: true,
};
const future = new Date(Date.now() + 86400_000).toISOString(),
  later = new Date(Date.now() + 172800_000).toISOString();
const settings = {
  registrationOpen: true,
  eventDate: later,
  registrationDeadline: future,
  submissionDeadline: later,
  phaseDates: ["", "", "", "", ""],
  paymentMethods: [],
  prizes: [],
  people: [],
  supportEmail: "verification@example.test",
  supportWhatsApp: "",
  refundPolicy: "Test-only refund policy. No actual transaction.",
};
async function cleanup() {
  server.kill();
  if (testDbName.startsWith("buildfest_verify_") && testDbName !== prodDbName) {
    await db.dropDatabase();
    console.log(`Cleaned isolated verification database ${testDbName}.`);
  }
  check(
    process.env.VERIFY_LOCAL_DATABASE
      ? "unrelated local database remains unchanged"
      : "production participant records unchanged",
    (await client.db(prodDbName).collection("teams").countDocuments()) ===
      prodBefore,
  );
  await client.close();
}
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Verification server stopped: ${serverLog}`);
    try {
      const r = await guest("/api/event");
      if (r.status === 200) {
        ready = true;
        break;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  if (!ready)
    throw new Error(`Verification server failed to start: ${serverLog}`);
  check(
    "unauthenticated organizer access denied",
    (await guest("/api/admin")).status === 401,
  );
  check(
    "cross-origin mutation denied",
    (
      await guest(
        "/api/auth/login",
        "POST",
        { email: adminEmail, password },
        { headers: { origin: "https://untrusted.example" } },
      )
    ).status === 403,
  );
  check(
    "unconfigured registration stays closed",
    (await guest("/api/register", "POST", form(registration))).status === 409,
  );
  check(
    "organizer can sign in",
    (await admin("/api/auth/login", "POST", { email: adminEmail, password }))
      .status === 200,
  );
  check(
    "incomplete opening configuration rejected",
    (
      await admin("/api/admin/settings", "PUT", {
        ...settings,
        registrationDeadline: "",
      })
    ).status === 400,
  );
  check(
    "official event settings persist",
    (await admin("/api/admin/settings", "PUT", settings)).status === 200,
  );
  const legacy = (await admin("/api/admin")).data.teams.find(
    (t) => t.id === legacyId.toString(),
  );
  check(
    "existing paid teams retain confirmed access",
    legacy.registrationStatus === "confirmed",
  );
  check(
    "historical payment details survive schema/index migration",
    (await db.collection("teams").findOne({ _id: legacyId })).payment
      .referenceKey === legacyPayment.referenceKey,
  );
  await db.collection("teams").deleteOne({ _id: legacyId });
  const submissions = await Promise.all([
    leader("/api/register", "POST", form(registration)),
    makeClient()("/api/register", "POST", form(registration)),
  ]);
  check(
    "registration accepts non-university emails without payment",
    submissions.some((r) => r.status === 201) &&
      submissions.every((r) => r.status === 201 || r.status === 200),
  );
  check(
    "concurrent first submissions save exactly once",
    submissions.filter((r) => r.status === 201).length === 1 &&
      (await db.collection("teams").countDocuments()) === 1 &&
      (await db
        .collection("audit")
        .countDocuments({ action: "registration_submitted" })) === 1,
  );
  let team = (await leader("/api/team")).data.team;
  check(
    "new registration awaits organizer contact without recording payment",
    team.registrationStatus === "new" &&
      team.payment.status === "pending" &&
      !team.payment.reference &&
      !team.payment.receiptId,
  );
  check("three participants persist", team.members.length === 3);
  check(
    "success page reads persisted registration",
    (await leader("/register/success")).status === 200 &&
      (await leader("/register/success")).data.includes(team.registrationId),
  );
  check(
    "guest cannot access success data",
    (await guest("/register/success")).status === 307,
  );
  check(
    "admin immediately sees full registration",
    (await admin("/api/admin")).data.teams.some(
      (t) =>
        t.registrationId === team.registrationId &&
        t.members.length === 3 &&
        t.whatsapp === "+923000000000" &&
        t.registrationStatus === "new" &&
        t.whatsappConsent,
    ),
  );
  check(
    "saved registration survives a new login",
    (
      await leader("/api/auth/login", "POST", {
        email: registration.email,
        password,
      })
    ).status === 200 &&
      (await leader("/api/team")).data.team.registrationId ===
        team.registrationId,
  );
  check(
    "WhatsApp consent enforced",
    (
      await makeClient()(
        "/api/register",
        "POST",
        form({
          ...registration,
          requestId: randomUUID(),
          whatsappConsent: false,
        }),
      )
    ).status === 400,
  );
  check(
    "member count must match team size",
    (
      await makeClient()(
        "/api/register",
        "POST",
        form({ ...registration, requestId: randomUUID(), teamSize: 2 }),
      )
    ).status === 400,
  );
  check(
    "malformed WhatsApp number rejected",
    (
      await makeClient()(
        "/api/register",
        "POST",
        form({
          ...registration,
          requestId: randomUUID(),
          whatsapp: "1234567890",
        }),
      )
    ).status === 400,
  );
  check(
    "team leader cannot update registration status",
    (
      await leader("/api/admin/registrations", "PATCH", {
        teamId: team.id,
        status: "confirmed",
        expectedStatus: "new",
        expectedNotes: "",
        internalNotes: "",
      })
    ).status === 403,
  );
  const publicBefore = JSON.stringify((await guest("/api/event")).data);
  check(
    "public event contains no team contact details",
    !publicBefore.includes(registration.email) &&
      !publicBefore.includes(registration.whatsapp) &&
      !publicBefore.includes("member2-"),
  );

  check(
    "passwords never appear in participant response",
    !JSON.stringify(team).includes(password),
  );
  check(
    "pending registration cannot view confirmed ticket",
    (await leader("/dashboard/confirmation")).status === 307,
  );
  const submission = {
    title: "Verification Product",
    problem:
      "A test problem statement long enough to validate the final submission workflow.",
    solution:
      "A test solution that explains a practical approach for the isolated verification workflow.",
    research: "Verification evidence only.",
    mvpUrl: "https://example.com/prototype",
    pitchUrl: "https://example.com/pitch",
    aiTools: "None. Automated verification data.",
    aiDeclaration: true,
    final: false,
  };
  check(
    "pending team cannot submit a project",
    (await leader("/api/team", "PATCH", { submission })).status === 403,
  );
  check(
    "registration retry returns the saved record",
    (await makeClient()("/api/register", "POST", form(registration))).status ===
      200 && (await db.collection("teams").countDocuments()) === 1,
  );
  check(
    "duplicate member email prevented",
    (
      await makeClient()(
        "/api/register",
        "POST",
        form({
          ...registration,
          teamName: "Duplicate member verification",
          requestId: randomUUID(),
          email: `new-${suffix}@example.test`,
        }),
      )
    ).status === 409,
  );
  check(
    "duplicate team name rejected",
    (
      await makeClient()(
        "/api/register",
        "POST",
        form({
          ...registration,
          requestId: randomUUID(),
          email: `name-${suffix}@example.test`,
          members: [],
          teamSize: 1,
        }),
      )
    ).status === 409,
  );
  check(
    "idempotency key cannot expose a registration",
    (
      await makeClient()(
        "/api/register",
        "POST",
        form({ ...registration, password: "different-secure-password" }),
      )
    ).status === 409,
  );
  check(
    "concurrent repeated submissions create one team",
    (
      await Promise.all([
        makeClient()("/api/register", "POST", form(registration)),
        makeClient()("/api/register", "POST", form(registration)),
      ])
    ).every((r) => r.status === 200) &&
      (await db.collection("teams").countDocuments()) === 1,
  );
  check(
    "more than three participants rejected",
    (
      await makeClient()(
        "/api/register",
        "POST",
        form({ ...registration, teamSize: 4 }),
      )
    ).status === 400,
  );
  check(
    "admin marks a team contacted and saves internal notes",
    (
      await admin("/api/admin/registrations", "PATCH", {
        teamId: team.id,
        status: "contacted",
        expectedStatus: "new",
        expectedNotes: "",
        internalNotes: "WhatsApp follow-up started.",
      })
    ).status === 200,
  );
  check(
    "internal notes persist in admin only",
    (await admin("/api/admin")).data.teams.find((t) => t.id === team.id)
      .internalNotes === "WhatsApp follow-up started." &&
      !("internalNotes" in (await leader("/api/team")).data.team),
  );
  check(
    "stale organizer edits cannot overwrite notes",
    (
      await admin("/api/admin/registrations", "PATCH", {
        teamId: team.id,
        status: "new",
        expectedStatus: "new",
        expectedNotes: "",
        internalNotes: "stale",
      })
    ).status === 409,
  );
  check(
    "admin sets awaiting confirmation",
    (
      await admin("/api/admin/registrations", "PATCH", {
        teamId: team.id,
        status: "awaiting_confirmation",
        expectedStatus: "contacted",
        expectedNotes: "WhatsApp follow-up started.",
        internalNotes: "Shared next steps.",
      })
    ).status === 200,
  );
  const review = {
    teamId: team.id,
    status: "confirmed",
    expectedStatus: "awaiting_confirmation",
    expectedNotes: "Shared next steps.",
    internalNotes: "Organizer approved registration.",
  };
  const reviews = await Promise.all([
    admin("/api/admin/registrations", "PATCH", review),
    admin("/api/admin/registrations", "PATCH", review),
  ]);
  check(
    "concurrent manual confirmation happens once",
    reviews.filter((r) => r.status === 200).length === 1 &&
      reviews.filter((r) => r.status === 409).length === 1,
  );
  team = (await leader("/api/team")).data.team;
  check(
    "manual confirmation never marks a team paid",
    team.registrationStatus === "confirmed" &&
      team.payment.status === "pending",
  );
  check(
    "one confirmation audit record",
    (await db.collection("audit").countDocuments({
      action: "registration_updated",
      after: "confirmed",
    })) === 1,
  );
  check(
    "emails queued once for all three members",
    (await db.collection("email_outbox").countDocuments()) === 3,
  );
  check(
    "missing SMTP is honestly unconfigured",
    (await db
      .collection("email_outbox")
      .countDocuments({ status: "unconfigured" })) === 3,
  );
  const second = {
    ...registration,
    teamName: "Verification Team Two",
    email: `other-${suffix}@example.test`,
    members: [],
    teamSize: 1,
    requestId: randomUUID(),
    whatsapp: "03001234567",
  };
  check(
    "second independent team can register",
    (await other("/api/register", "POST", form(second))).status === 201,
  );
  check(
    "two payment-free registrations persist",
    (await db.collection("teams").countDocuments()) === 2,
  );
  check(
    "Pakistani local number normalizes internationally",
    (await other("/api/team")).data.team.whatsapp === "+923001234567",
  );
  check(
    "obsolete payment upload endpoint removed",
    [410].includes(
      (await leader("/api/team/payment", "POST", form({ reference: "OLD" })))
        .status,
    ),
  );
  check(
    "obsolete payment review endpoint removed",
    [410].includes((await admin("/api/admin/payments", "POST", {})).status),
  );
  check(
    "confirmed team can save a project draft",
    (await leader("/api/team", "PATCH", { submission })).status === 200,
  );
  check(
    "final submission requires AI declaration",
    (
      await leader("/api/team", "PATCH", {
        submission: { ...submission, final: true, aiDeclaration: false },
      })
    ).status === 400,
  );
  const invalidDeck = new FormData();
  invalidDeck.append("purpose", "deck");
  invalidDeck.append(
    "file",
    new Blob(["<svg></svg>"], { type: "application/pdf" }),
    "fake.pdf",
  );
  check(
    "spoofed file type rejected",
    (await leader("/api/files", "POST", invalidDeck)).status === 400,
  );
  const deck = new FormData();
  deck.append("purpose", "deck");
  deck.append(
    "file",
    new Blob(["%PDF-1.4\n1 0 obj<</Type/Catalog>>endobj\n%%EOF"], {
      type: "application/pdf",
    }),
    "verification.pdf",
  );
  const uploaded = await leader("/api/files", "POST", deck);
  check(
    "pitch deck stored privately in MongoDB",
    uploaded.status === 200 &&
      (await db.collection("files").countDocuments({ purpose: "deck" })) === 1,
  );
  const deckId = uploaded.data.fileId;
  check(
    "final submission persists",
    (
      await leader("/api/team", "PATCH", {
        submission: { ...submission, final: true },
      })
    ).status === 200,
  );
  check(
    "confirmed ticket renders",
    (await leader("/dashboard/confirmation")).status === 200,
  );
  const judgeEmail = `judge-${suffix}@example.test`;
  check(
    "organizer can create a secure judge account",
    (
      await admin("/api/admin/judges", "POST", {
        name: "Verification Judge",
        email: judgeEmail,
        password,
      })
    ).status === 201,
  );
  check(
    "judge can sign in",
    (await judge("/api/auth/login", "POST", { email: judgeEmail, password }))
      .status === 200,
  );
  const judgeId = (
    await db.collection("users").findOne({ email: judgeEmail })
  )._id.toString();
  check(
    "unassigned judges see no project records",
    (await judge("/api/judge")).data.teams.length === 0,
  );
  check(
    "judge cannot access organizer API",
    (await judge("/api/admin")).status === 403,
  );
  check(
    "judge cannot score unassigned team",
    (
      await judge("/api/judge", "POST", {
        teamId: team.id,
        scores: [30, 25, 20, 10, 10, 5],
        feedback: "Test.",
      })
    ).status === 403,
  );
  check(
    "organizer assigns a judge",
    (
      await admin("/api/admin/judges", "PUT", {
        judgeId,
        teamId: team.id,
        assigned: true,
      })
    ).status === 200,
  );
  const judgeView = (await judge("/api/judge")).data;
  check(
    "assigned judge can view only project data",
    judgeView.teams.length === 1 &&
      !JSON.stringify(judgeView).includes(registration.email),
  );
  check(
    "private pitch deck denied to visitors",
    (await guest(`/api/files/${deckId}`)).status === 401,
  );
  check(
    "private pitch deck denied to other teams",
    (await other(`/api/files/${deckId}`)).status === 403,
  );
  check(
    "assigned judge can download pitch deck",
    (await judge(`/api/files/${deckId}`)).status === 200,
  );
  check(
    "score maximums validated server-side",
    (
      await judge("/api/judge", "POST", {
        teamId: team.id,
        scores: [31, 25, 20, 10, 10, 5],
        feedback: "Test.",
      })
    ).status === 400,
  );
  check(
    "results cannot publish before deadline",
    (
      await admin("/api/admin/results", "POST", {
        publish: true,
        approved: true,
      })
    ).status === 409,
  );
  check(
    "judge scorecard persists",
    (
      await judge("/api/judge", "POST", {
        teamId: team.id,
        scores: [28, 24, 19, 9, 9, 5],
        feedback: "Verified scoring workflow.",
      })
    ).status === 200,
  );
  check(
    "organizer score correction is audited",
    (
      await admin("/api/admin/scores", "PUT", {
        teamId: team.id,
        judgeId,
        scores: [29, 24, 19, 9, 9, 5],
        feedback: "Reviewed evidence in the verification workflow.",
      })
    ).status === 200,
  );
  const closed = {
    ...settings,
    registrationDeadline: new Date(Date.now() - 7200000).toISOString(),
    submissionDeadline: new Date(Date.now() - 3600000).toISOString(),
  };
  check(
    "organizer can configure elapsed deadlines",
    (await admin("/api/admin/settings", "PUT", closed)).status === 200,
  );
  check(
    "registration automatically closes at deadline",
    (
      await makeClient()(
        "/api/register",
        "POST",
        form({
          ...second,
          teamName: "After deadline",
          email: `late-${suffix}@example.test`,
        }),
      )
    ).status === 409,
  );
  check(
    "project edits close at deadline",
    (await leader("/api/team", "PATCH", { submission })).status === 409,
  );
  check(
    "organizer can publish approved scored results",
    (
      await admin("/api/admin/results", "POST", {
        publish: true,
        approved: true,
      })
    ).status === 200,
  );
  const publicData = (await guest("/api/event")).data;
  check(
    "published scores use exact rubric totals",
    publicData.results.length === 1 &&
      publicData.results[0].points === 95 &&
      publicData.results[0].place === 1,
  );
  check(
    "public team statistics count manually confirmed teams only",
    publicData.confirmedTeams === 1,
  );
  check(
    "published results lock scoring",
    (
      await judge("/api/judge", "POST", {
        teamId: team.id,
        scores: [30, 25, 20, 10, 10, 5],
        feedback: "Test.",
      })
    ).status === 409,
  );
  check(
    "published results lock assignments",
    (
      await admin("/api/admin/judges", "PUT", {
        teamId: team.id,
        judgeId,
        assigned: false,
      })
    ).status === 409,
  );
  const announcement = await admin("/api/admin/announcements", "POST", {
    title: "Verification announcement",
    message: "A test update in the isolated verification database.",
  });
  check(
    "announcements publish and persist",
    announcement.status === 200 &&
      (await guest("/api/event")).data.announcements.length === 1,
  );
  const csv = await admin("/api/admin/export");
  check(
    "CSV export includes real persisted verification teams",
    csv.status === 200 &&
      csv.data.includes(team.registrationId) &&
      csv.data.includes("Registration status") &&
      csv.data.includes("Organizer approved registration.") &&
      csv.data.includes(registration.members[0].email),
  );
  check(
    "CSV denied to guests",
    (await makeClient()("/api/admin/export")).status === 401,
  );
  check(
    "CSV denied to participants",
    (await leader("/api/admin/export")).status === 403,
  );
  const doc = await db
    .collection("users")
    .findOne({ email: registration.email });
  check(
    "password is stored as a bcrypt hash",
    doc.passwordHash !== password &&
      (await bcrypt.compare(password, doc.passwordHash)),
  );
  check(
    "participant cannot change official event settings",
    (await leader("/api/admin/settings", "PUT", settings)).status === 403,
  );
  check(
    "logout revokes the server session",
    (await other("/api/auth/logout", "POST")).status === 200 &&
      (await other("/api/team")).status === 401,
  );
  const rateClient = makeClient();
  let rate;
  for (let i = 0; i < 12; i++)
    rate = await rateClient("/api/auth/login", "POST", {
      email: `rate-${suffix}@example.test`,
      password: "incorrect-password",
    });
  check("login attempts are rate limited", rate.status === 429);
  for (const path of [
    "/",
    "/register",
    "/login",
    "/rules",
    "/privacy",
    "/opengraph-image",
    "/robots.txt",
    "/sitemap.xml",
  ]) {
    check(`${path} renders successfully`, (await guest(path)).status === 200);
  }
  console.log(`Verification complete: ${checks} checks passed.`);
  if (process.argv.includes("--preview")) {
    console.log(
      `VERIFICATION_PREVIEW ${JSON.stringify({ url: base, email: adminEmail, password, leaderEmail: registration.email, judgeEmail })}`,
    );
    console.log(
      "Disposable preview ready. Ctrl+C cleans only its isolated database.",
    );
    await new Promise((resolve) => {
      process.once("SIGINT", resolve);
      process.once("SIGTERM", resolve);
    });
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await cleanup();
}
