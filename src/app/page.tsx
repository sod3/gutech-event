import { Landing } from "@/components/landing";
import { publicEvent } from "@/lib/event";
export const dynamic = "force-dynamic";
export default async function Home() {
  return <Landing event={await publicEvent()} />;
}
