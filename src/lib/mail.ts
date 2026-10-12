import "server-only";
import nodemailer from "nodemailer";
import { collections } from "./db";
import type { TeamDoc } from "./types";
import type { ClientSession } from "mongodb";

export function mailConfigured() { return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD && process.env.SMTP_FROM); }
export async function sendPendingMail() {
  if (!mailConfigured()) return { sent: 0, configured: false };
  const c = await collections();
  const transport = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT || 587), secure: process.env.SMTP_PORT === "465", auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }, connectionTimeout: 8000, socketTimeout: 10000 });
  const pending = await c.mail.find({ status: { $in: ["queued", "unconfigured", "failed"] } }).limit(50).toArray();
  let sent = 0;
  for (const item of pending) {
    // Claim the job atomically to prevent concurrent dispatch from sending twice.
    const claim = await c.mail.updateOne({ _id: item._id, status: item.status }, { $set: { status: "sending", error: "" } });
    if (!claim.modifiedCount) continue;
    try {
      await transport.sendMail({ from: process.env.SMTP_FROM, to: item.to, subject: item.subject, text: item.text, messageId: `<${item.key}@buildfest.local>` });
      await c.mail.updateOne({ _id: item._id }, { $set: { status: "sent", error: "" } }); sent++;
    } catch { await c.mail.updateOne({ _id: item._id }, { $set: { status: "failed", error: "Email delivery failed. Check the official SMTP settings." } }); }
  }
  return { sent, configured: true };
}
export async function queueConfirmation(team: TeamDoc, session?: ClientSession) {
  const c = await collections();
  for (const member of team.members) {
    const key = `confirmed:${team._id}:${member.email}`;
    await c.mail.updateOne({ key }, { $setOnInsert: { key, to: member.email, subject: `You're in! BuildFest 2026 · ${team.registrationId}`, text: `WELCOME TO THE FUTURE, INNOVATOR!\n\nYour team ${team.name} is officially part of BuildFest 2026.\nRegistration ID: ${team.registrationId}\nTeam registration paid: PKR 1,500\n\nYour team leader can access the dashboard at ${process.env.APP_URL || "the official BuildFest website"}/dashboard.\n\nOne Idea. Three Minds. Endless Possibilities.`, status: mailConfigured() ? "queued" : "unconfigured", createdAt: new Date() } }, { upsert: true, session });
  }
}
