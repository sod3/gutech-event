import { registrationStatus } from "@/lib/registration";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header, Footer, SectionLabel, Status } from "@/components/ui";
import { collections } from "@/lib/db";
export const metadata = {
  title: "Your team invitation",
  robots: { index: false, follow: false },
};
export default async function Page({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[A-Za-z\d_-]{43}$/.test(token)) notFound();
  const team = await (
    await collections()
  ).teams.findOne(
    { inviteToken: token },
    { projection: { name: 1, registrationStatus: 1, "payment.status": 1 } },
  );
  if (!team) notFound();
  return (
    <>
      <Header />
      <main id="top" className="container content-page">
        <SectionLabel>GOOD IDEAS TRAVEL TOGETHER</SectionLabel>
        <h1>
          You’re with
          <br />
          <span className="gradient-text">{team.name}.</span>
        </h1>
        <Status status={registrationStatus(team)} />
        <p style={{ marginTop: 23 }}>
          Your team leader has shared this LEAP 3 invitation with you. Connect
          with them for your team’s registered lineup and project plans.
        </p>
        <p style={{ marginTop: 15 }}>
          This private invitation shows your team’s name and registration
          status. Your team leader has access to the dashboard and manages your
          project submissions.
        </p>
        <Link
          className="button button-primary"
          style={{ marginTop: 25 }}
          href="/"
        >
          Explore the challenge ↗
        </Link>
      </main>
      <Footer />
    </>
  );
}
