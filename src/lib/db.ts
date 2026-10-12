import "server-only";
import { MongoClient } from "mongodb";
import type { Announcement, AssignmentDoc, AuditDoc, EventSettings, FileDoc, PublicResult, ScoreDoc, SessionDoc, TeamDoc, UserDoc } from "./types";

const globalDb = globalThis as unknown as { mongoPromise?: Promise<MongoClient>; indexesPromise?: Promise<void> };
export async function database() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("DATABASE_UNAVAILABLE");
  if (!globalDb.mongoPromise) globalDb.mongoPromise = new MongoClient(uri, { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 }).connect().catch(e => { globalDb.mongoPromise = undefined; throw e; });
  const client = await globalDb.mongoPromise;
  return { client, db: client.db(process.env.MONGODB_DB || "buildfest2026") };
}
export async function collections() {
  const { db, client } = await database();
  const c = {
    client, db,
    users: db.collection<UserDoc>("users"), teams: db.collection<TeamDoc>("teams"), sessions: db.collection<SessionDoc>("sessions"), files: db.collection<FileDoc>("files"),
    settings: db.collection<EventSettings & { _id: string }>("settings"), announcements: db.collection<Announcement>("announcements"), audit: db.collection<AuditDoc>("audit"),
    scores: db.collection<ScoreDoc>("scores"), assignments: db.collection<AssignmentDoc>("assignments"), results: db.collection<PublicResult & { _id?: unknown }>("results"),
    rateLimits: db.collection<{ key: string; count: number; expiresAt: Date }>("rate_limits"),
    mail: db.collection<{ key: string; to: string; subject: string; text: string; status: "queued" | "sending" | "sent" | "unconfigured" | "failed"; createdAt: Date; error?: string }>("email_outbox"),
  };
  if (!globalDb.indexesPromise) globalDb.indexesPromise = Promise.all([
    c.users.createIndex({ email: 1 }, { unique: true }), c.teams.createIndex({ registrationId: 1 }, { unique: true }),
    c.teams.createIndex({ "members.email": 1 }, { unique: true }), c.teams.createIndex({ nameKey: 1 }, { unique: true }),
    c.teams.createIndex({ "payment.referenceKey": 1 }, { unique: true }), c.teams.createIndex({ inviteToken: 1 }, { unique: true }),
    c.sessions.createIndex({ tokenHash: 1 }, { unique: true }), c.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    c.rateLimits.createIndex({ key: 1 }, { unique: true }), c.rateLimits.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    c.scores.createIndex({ judgeId: 1, teamId: 1 }, { unique: true }), c.assignments.createIndex({ judgeId: 1, teamId: 1 }, { unique: true }),
    c.mail.createIndex({ key: 1 }, { unique: true }), c.audit.createIndex({ createdAt: -1 }),
  ]).then(() => undefined).catch(e => { globalDb.indexesPromise = undefined; throw e; });
  await globalDb.indexesPromise;
  return c;
}
