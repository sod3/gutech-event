import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";

export const PUBLIC_EVENT_TAG = "leap-public-event";

// Only public presentation data is cached. Registration and authorization keep
// reading the database directly. Organizer changes expire both data and HTML.
export function revalidatePublicEvent() {
  revalidateTag(PUBLIC_EVENT_TAG, { expire: 0 });
  for (const path of ["/", "/rules", "/privacy"])
    revalidatePath(path);
}
