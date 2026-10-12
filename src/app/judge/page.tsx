import { redirect } from "next/navigation";
import { currentUser } from "@/lib/security";
import { Judge } from "@/components/judge";
export const metadata = {
  title: "Judge workspace",
  robots: { index: false, follow: false },
};
export default async function Page() {
  const user = await currentUser();
  if (!user) redirect("/login?role=admin");
  if (user.role !== "judge")
    redirect(user.role === "admin" ? "/admin" : "/dashboard");
  return <Judge name={user.name} />;
}
