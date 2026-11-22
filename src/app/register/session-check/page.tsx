import { Registration } from "@/components/registration";
import { RegistrationLoading } from "@/components/registration-loading";
import { publicEvent } from "@/lib/event";
import { currentUser } from "@/lib/security";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Submit your startup",
  robots: { index: false, follow: false },
};

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
