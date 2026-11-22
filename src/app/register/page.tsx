import { Registration } from "@/components/registration";
import { publicEvent } from "@/lib/event";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Submit your startup" };
export const revalidate = 15;
// Requests carrying a session cookie go through the uncached server guard in
// /register/session-check via proxy.ts. The public form can be served by CDN.
export default async function Page() {
  return <Registration event={await publicEvent()} />;
}
