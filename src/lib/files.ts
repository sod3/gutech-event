import "server-only";
import { Binary, ObjectId } from "mongodb";
import type { FileDoc } from "./types";
import { HttpError } from "./security";

export async function prepareFile(
  file: File,
  purpose: FileDoc["purpose"],
  teamId?: ObjectId,
): Promise<FileDoc> {
  if (!file.size || file.size > 3_000_000)
    throw new HttpError(400, "Choose a file smaller than 3 MB.");
  const data = Buffer.from(await file.arrayBuffer());
  const png = data
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg = data[0] === 255 && data[1] === 216 && data[2] === 255;
  const pdf = data.subarray(0, 5).toString() === "%PDF-";
  if (
    (purpose === "deck" && !pdf) ||
    (purpose === "logo" && !png && !jpeg) ||
    (!png && !jpeg && !pdf)
  )
    throw new HttpError(
      400,
      purpose === "deck"
        ? "Pitch decks must be PDF files."
        : "Choose a PNG, JPEG, or PDF file.",
    );
  return {
    _id: new ObjectId(),
    teamId,
    purpose,
    name: file.name.replace(/[^\w. -]/g, "_").slice(0, 100),
    type: png ? "image/png" : jpeg ? "image/jpeg" : "application/pdf",
    data: new Binary(data),
    size: file.size,
    createdAt: new Date(),
  };
}
