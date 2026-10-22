import { Header, Footer, SectionLabel } from "@/components/ui";
import { publicEvent } from "@/lib/event";
export const metadata = { title: "Privacy policy" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const event = await publicEvent();
  return (
    <>
      <Header />
      <main id="top" className="container content-page">
        <SectionLabel>YOUR STARTUP. YOUR INFORMATION.</SectionLabel>
        <h1>
          Your information.
          <br />
          <span className="gradient-text">Handled with care.</span>
        </h1>
        <h2>What we collect</h2>
        <p>
          We collect your startup name, stage, description, and PDF pitch deck;
          team members’ names and emails; the leader’s WhatsApp number and
          university or organization; and your consent to contact. The leader’s
          password is stored as a one-way hash.
        </p>
        <h2>Why we use it</h2>
        <p>
          The Entrepreneurship Society uses this information to review startup
          applications, shortlist teams, contact leaders about selection and
          event details, and organize pitching and judging at LEAP 3.
          Registration is completely free.
        </p>
        <h2>Who can access it</h2>
        <p>
          Team leaders can access their own application and files. Authorized
          organizers can review applications, download pitch decks, and keep
          private review notes. Assigned judges can access shortlisted startup
          submissions and pitch decks, without participant contact details or
          organizer notes. Published results may include startup names, pitch
          titles, rankings, and scores.
        </p>
        <h2>Private storage & local drafts</h2>
        <p>
          Applications and pitch decks are stored privately in the existing
          MongoDB database. Files require an authorized account to download. The
          form saves a draft of your details in this browser; passwords, consent
          checkboxes, and PDF files are excluded. Use “Clear saved draft” on a
          shared device. Sign-in uses a secure HTTP-only session cookie.
        </p>
        <h2>Contact, corrections & deletion requests</h2>
        <p>
          {event.supportEmail ? (
            <>
              Contact the organizer at{" "}
              <a href={`mailto:${event.supportEmail}`}>{event.supportEmail}</a>{" "}
              for account access, corrections, or deletion requests.
            </>
          ) : (
            "Official organizer support details will be published here by the Entrepreneurship Society."
          )}
        </p>
        {event.supportWhatsApp && (
          <p>
            WhatsApp:{" "}
            <a
              href={`https://wa.me/${event.supportWhatsApp.replace(/\D/g, "")}`}
            >
              {event.supportWhatsApp}
            </a>
          </p>
        )}
      </main>
      <Footer />
    </>
  );
}
