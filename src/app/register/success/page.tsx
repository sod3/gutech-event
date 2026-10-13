import { redirect } from "next/navigation";
import { collections } from "@/lib/db";
import { currentUser } from "@/lib/security";
import { safeTeam } from "@/lib/event";
import { RegistrationSuccess } from "@/components/registration-success";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Registration received",
  robots: { index: false, follow: false },
};

export default async function Page() {
  const user = await currentUser();
  if (!user || user.role !== "participant") redirect("/login");
  const team = await (
    await collections()
  ).teams.findOne({ _id: user.teamId, leaderId: user._id });
  if (!team) redirect("/register");
  return <RegistrationSuccess team={safeTeam(team)} />;
}
