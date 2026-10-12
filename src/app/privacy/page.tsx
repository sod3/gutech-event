import { Header, Footer, SectionLabel } from "@/components/ui";
import { publicEvent } from "@/lib/event";
export const metadata = { title: "Privacy & refunds" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const event = await publicEvent();
  return (
    <>
      <Header />
      <main id="top" className="container content-page">
        <SectionLabel>TRUST IS PART OF THE BUILD</SectionLabel>
        <h1>
          Your information.
          <br />
          <span className="gradient-text">Handled with care.</span>
        </h1>
        <h2>What we collect</h2>
        <p>
          We collect team and participant names, email addresses, the leader’s
          WhatsApp number, department, team size, payment reference, optional
          payment receipt, and competition submissions. The leader’s password is
          stored as a one-way hash.
        </p>
        <h2>Why we use it</h2>
        <p>
          Organizers use these details to manage registration, verify payments,
          provide event updates, review submissions, and judge the competition.
          Confirmation emails are sent to registered team members when the
          organizer’s email service is configured.
        </p>
        <h2>Who can access it</h2>
        <p>
          The team leader can access their own team. Authorized organizers can
          access registrations and receipts. Assigned judges can access project
          submissions and pitch decks; they do not receive payment receipts or
          personal contact information. Published results include team names,
          project titles, rankings, and scores.
        </p>
        <h2>Files & your local draft</h2>
        <p>
          Uploaded receipts and pitch decks are stored privately in MongoDB and
          require appropriate authorization to download. The registration form
          saves a draft of team details in this browser’s local storage, so you
          can continue later. Your password is excluded. Use “Clear saved draft”
          on the form if you are using a shared device. Signing in uses a
          secure, HTTP-only session cookie.
        </p>
        <h2>Refund policy</h2>
        <p style={{ whiteSpace: "pre-wrap" }}>
          {event.refundPolicy ||
            "The official refund policy is awaiting organizer confirmation. Registration remains closed until this policy and official payment support details are available. Do not send payment to any unlisted account."}
        </p>
        <h2>Support, corrections & deletion requests</h2>
        <p>
          {event.supportEmail ? (
            <>
              Contact the organizer at{" "}
              <a href={`mailto:${event.supportEmail}`}>{event.supportEmail}</a>{" "}
              for payment support, account access, corrections, or deletion
              requests.
            </>
          ) : (
            "Official organizer contact details are being finalized and will be published before registration opens."
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
        <h2>No hidden fees</h2>
        <p>
          The complete registration fee is PKR 1,500 per team. Payment uploads
          and project submissions do not create any additional website charges.
        </p>
      </main>
      <Footer />
    </>
  );
}
