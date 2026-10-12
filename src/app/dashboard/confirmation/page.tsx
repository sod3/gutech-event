import { redirect } from "next/navigation";
import { Ticket } from "@/components/ticket";
import { currentUser } from "@/lib/security";
import { collections } from "@/lib/db";
import { publicEvent, safeTeam } from "@/lib/event";
export const metadata = {
  title: "Registration confirmation",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const user = await currentUser();
  if (!user || user.role !== "participant") redirect("/login");
  const team = await (
    await collections()
  ).teams.findOne({
    _id: user.teamId,
    leaderId: user._id,
    "payment.status": "confirmed",
  });
  if (!team) redirect("/dashboard");
  return <Ticket team={safeTeam(team)} event={await publicEvent()} />;
}
