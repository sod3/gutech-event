import { Registration } from "@/components/registration";
import { publicEvent } from "@/lib/event";
import { currentUser } from "@/lib/security";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Suspense } from "react";
import { RegistrationLoading } from "@/components/registration-loading";
export const metadata: Metadata = { title: "Submit your startup" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await currentUser();
  if (user?.role === "participant") redirect("/dashboard");
  return (
    <Suspense fallback={<RegistrationLoading />}>
      <Application />
    </Suspense>
  );
}
async function Application() {
  return <Registration event={await publicEvent()} />;
}
