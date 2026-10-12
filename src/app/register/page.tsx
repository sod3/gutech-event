import { Registration } from "@/components/registration";
import { Header, Footer } from "@/components/ui";
import { publicEvent } from "@/lib/event";
import { currentUser } from "@/lib/security";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Register your team" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const user = await currentUser();
  if (user?.role === "participant") redirect("/dashboard");
  return (
    <>
      <Header />
      <main id="top" className="page-background">
        <Registration event={await publicEvent()} />
      </main>
      <Footer />
    </>
  );
}
