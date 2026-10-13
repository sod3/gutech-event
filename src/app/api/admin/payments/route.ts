import { json } from "@/lib/security";

// Existing bookmarks cannot change historical payment records.
export async function POST() {
  return json(
    {
      error:
        "Payment reviews have been retired. Manage registration status in the organizer dashboard.",
    },
    410,
  );
}
