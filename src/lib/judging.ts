import "server-only";
import type { ClientSession } from "mongodb";
import { collections } from "./db";
import { HttpError } from "./security";
// All scoring, assignment, submission, and publication transactions write this
// document. MongoDB retries conflicts, so publication cannot race a score edit.
export async function lockOpenEvent(
  session: ClientSession,
  checkSubmissionDeadline = false,
) {
  const c = await collections();
  if (checkSubmissionDeadline) {
    const settings = await c.settings.findOne({ _id: "event" }, { session });
    if (
      !settings?.submissionDeadline ||
      new Date(settings.submissionDeadline).getTime() <= Date.now()
    )
      throw new HttpError(
        409,
        "The submission deadline has passed or submissions are not yet open.",
      );
  }
  const result = await c.settings.updateOne(
    { _id: "event", resultsPublished: { $ne: true } },
    { $inc: { judgingRevision: 1 } },
    { session },
  );
  if (!result.matchedCount)
    throw new HttpError(
      409,
      "Results are published or the event is not configured. Changes are locked.",
    );
}
