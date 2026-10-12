import { redirect } from "next/navigation";
import { Admin } from "@/components/admin";
import { currentUser } from "@/lib/security";
import { publicEvent } from "@/lib/event";
export const metadata = {
  title: "Organizer dashboard",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login?role=admin");
  if (user.role !== "admin")
    redirect(user.role === "judge" ? "/judge" : "/dashboard");
  return <Admin name={user.name} event={await publicEvent()} />;
}
