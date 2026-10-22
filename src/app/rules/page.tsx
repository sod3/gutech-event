import { Header, Footer, SectionLabel } from "@/components/ui";
import { formatDate } from "@/lib/dates";
import { publicEvent } from "@/lib/event";
export const metadata = { title: "Application guide" };
export const dynamic = "force-dynamic";
export default async function Page() {
  const event = await publicEvent();
  return (
    <>
      <Header />
      <main id="top" className="container content-page">
        <SectionLabel>YOUR IDEA DESERVES A STAGE</SectionLabel>
        <h1>
          The LEAP 3<br />
          <span className="gradient-text">application guide.</span>
        </h1>
        <p>
          LEAP 3 is GUtech University’s Official Startup Pitching Event,
          organized by the Entrepreneurship Society. Participants present an
          existing startup idea, prototype, MVP, or growing business to a panel
          of judges.
        </p>
        <h2>Who can apply</h2>
        <ul>
          <li>
            A strong startup idea is eligible. You do not need a working
            product, prototype, or MVP.
          </li>
          <li>
            Choose your current stage: Idea Only, Prototype, MVP, or Existing or
            Growing Business.
          </li>
          <li>
            Solo founders and teams are welcome. There is no limit on team
            members. Each participant should belong to one application.
          </li>
          <li>Registration is completely FREE.</li>
        </ul>
        <h2>What to submit</h2>
        <ul>
          <li>
            Your startup name, stage, and a description explaining the idea,
            problem, solution, and target customers.
          </li>
          <li>
            A required PDF pitch deck, smaller than 3 MB, explaining your
            startup for organizer review.
          </li>
          <li>
            Your team leader’s full name, email, WhatsApp number, and university
            or organization.
          </li>
          <li>The full name and email of every additional team member.</li>
        </ul>
        <h2>Selection process</h2>
        <p>
          Submit Your Startup → Application Review → Shortlisting → Pitch at
          LEAP 3
        </p>
        <p>
          Organizers review every submitted startup idea and PDF pitch deck.
          Only shortlisted startups will be invited to pitch. Submitting an
          application does not guarantee a pitching slot. Our team will contact
          your leader if shortlisted; you can also check your status in the
          application dashboard.
        </p>
        <h2>The event format</h2>
        <p>
          Come ready to pitch your existing startup idea or business. No time is
          allocated to build projects during the event. Present your current
          stage honestly, credit sources, respect intellectual property, and
          treat other participants and judges respectfully.
        </p>
        <h2>Opportunities</h2>
        <p>
          Explore Internships, Startup Incubation, PhD Professor Mentorship,
          Startup Growth Support, and Networking. Opportunities depend on
          suitability and partner selection.
        </p>
        <h2>Judges</h2>
        <p>Announcing Soon.</p>
        <h2>Dates & support</h2>
        <p>
          Event date: {formatDate(event.eventDate, true)}.<br />
          Applications close: {formatDate(event.registrationDeadline)}.
          Applications close automatically at this deadline.
        </p>
        <p>
          {event.supportEmail ? (
            <a href={`mailto:${event.supportEmail}`}>{event.supportEmail}</a>
          ) : (
            "Official support details will be published by the Entrepreneurship Society."
          )}
        </p>
      </main>
      <Footer />
    </>
  );
}
