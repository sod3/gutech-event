import { registrationStatus } from "@/lib/registration";
import { collections } from "@/lib/db";
import { getSettings } from "@/lib/event";
import { prepareFile } from "@/lib/files";
import {
  apiError,
  authorize,
  HttpError,
  json,
  rateLimit,
  sameOrigin,
} from "@/lib/security";
import { lockOpenEvent } from "@/lib/judging";
import { DEFAULT_SETTINGS } from "@/lib/types";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const user = await authorize(["participant", "admin"]);
    await rateLimit(request, "upload", 20, 60, user._id.toString());
    const c = await collections();
    const form = await request.formData();
    const upload = form.get("file");
    if (!(upload instanceof File))
      throw new HttpError(400, "Choose a file to upload.");
    const purpose = String(form.get("purpose"));
    if (purpose === "logo" && user.role === "admin") {
      const target = String(form.get("target"));
      if (!["organizerLogoId", "partnerLogoId"].includes(target))
        throw new HttpError(400, "Choose an event partner.");
      const file = await prepareFile(upload, "logo");
      const session = c.client.startSession();
      try {
        await session.withTransaction(async () => {
          await c.files.insertOne(file, { session });
          await c.settings.updateOne(
            { _id: "event" },
            {
              $set: { [target]: file._id.toString() },
              $setOnInsert: { ...DEFAULT_SETTINGS },
            },
            { upsert: true, session },
          );
          await c.audit.insertOne(
            {
              actorId: user._id,
              action: "official_logo_uploaded",
              note: target,
              createdAt: new Date(),
            },
            { session },
          );
        });
      } finally {
        await session.endSession();
      }
      return json({
        fileId: file._id.toString(),
        message: "Official logo uploaded.",
      });
    }
    if (purpose !== "deck" || user.role !== "participant")
      throw new HttpError(403, "You don't have access to this upload.");
    const team = await c.teams.findOne({
      _id: user.teamId,
      leaderId: user._id,
    });
    const settings = await getSettings();
    if (!team || registrationStatus(team) !== "shortlisted")
      throw new HttpError(
        403,
        "Shortlisting is required before updating your pitch deck.",
      );
    if (
      !settings.submissionDeadline ||
      new Date(settings.submissionDeadline).getTime() <= Date.now()
    )
      throw new HttpError(409, "Pitch deck updates are currently closed.");
    const file = await prepareFile(upload, "deck", team._id);
    const session = c.client.startSession();
    try {
      await session.withTransaction(async () => {
        await lockOpenEvent(session, true);
        const latest = await c.teams.findOne({ _id: team._id }, { session });
        if (!latest || registrationStatus(latest) !== "shortlisted")
          throw new HttpError(
            403,
            "Shortlisting is required before updating your pitch deck.",
          );
        await c.files.insertOne(file, { session });
        await c.teams.updateOne(
          { _id: team._id },
          {
            $set: {
              "submission.deckFileId": file._id.toString(),
              "submission.updatedAt": new Date(),
            },
          },
          { session },
        );
      });
    } finally {
      await session.endSession();
    }
    return json({ fileId: file._id.toString(), message: "Pitch deck saved." });
  } catch (e) {
    return apiError(e);
  }
}
