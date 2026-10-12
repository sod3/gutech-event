import { publicEvent } from "@/lib/event";
import { json } from "@/lib/security";
export const dynamic = "force-dynamic";
export async function GET() {
  return json(await publicEvent());
}
