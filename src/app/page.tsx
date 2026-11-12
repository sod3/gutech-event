import { Landing } from "@/components/landing";
import { publicEvent } from "@/lib/event";
export const revalidate = 60;
export default async function Home() {
  return <Landing event={await publicEvent()} />;
}
