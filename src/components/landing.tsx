"use client";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Check,
  ChevronDown,
  FileText,
  GraduationCap,
  Lightbulb,
  MoveUpRight,
  Network,
  Rocket,
  Sprout,
} from "lucide-react";
import { Footer, Header, Reveal, SectionLabel, formatDate } from "./ui";
import { usePublicEvent } from "./use-public-event";
import { registrationState, type PublicEvent } from "@/lib/types";
const opportunities = [
  {
    icon: BriefcaseBusiness,
    name: "Internships",
    text: "Put your potential in front of people looking for ambitious talent.",
    number: "01",
  },
  {
    icon: Sprout,
    name: "Startup Incubation",
    text: "Explore pathways to turn a promising idea into a sustainable venture.",
    number: "02",
  },
  {
    icon: GraduationCap,
    name: "PhD Professor Mentorship",
    text: "Find expert perspectives to challenge your thinking and guide your next step.",
    number: "03",
  },
  {
    icon: Rocket,
    name: "Startup Growth Support",
    text: "Discover guidance and connections to help your startup move forward.",
    number: "04",
  },
  {
    icon: Network,
    name: "Networking",
    text: "Meet fellow founders, mentors, and a community that thinks bigger.",
    number: "05",
  },
];
const steps = [
  {
    name: "Submit Your Startup",
    text: "Tell us about your startup, introduce your team, and upload your PDF pitch deck.",
  },
  {
    name: "Application Review",
    text: "Our organizers review every startup idea and its pitch deck.",
  },
  {
    name: "Shortlisting",
    text: "Selected startups are contacted with an invitation and pitching details.",
  },
  {
    name: "Pitch at LEAP 3",
    text: "Present your startup to a panel of judges and connect with new opportunities.",
  },
];
export function Landing({ event: initialEvent }: { event: PublicEvent }) {
  const event = usePublicEvent(initialEvent);
  const state = registrationState(event);
  const faqs = [
    [
      "Do I need a working product?",
      "No. A strong startup idea is eligible. Apply at the Idea Only, Prototype, MVP, or Existing or Growing Business stage. Your PDF pitch deck should explain your idea, the problem, your solution, and your target customers.",
    ],
    [
      "Will we build something during the event?",
      "No. LEAP 3 is a Startup Pitching Event. Participants present their existing idea, prototype, MVP, or growing business to judges. There is no project-building period during the event.",
    ],
    [
      "Is registration really free?",
      "Yes. Registration is completely FREE. Submit your team details and PDF pitch deck through the application form.",
    ],
    [
      "Does applying guarantee a pitching slot?",
      "No. Organizers review all startup ideas and PDF pitch decks. Only shortlisted startups will be invited to pitch at LEAP 3. Our team will contact your team leader if shortlisted.",
    ],
    [
      "How many members can our team have?",
      "There is no team-member limit. Solo founders are welcome, and you can add as many members as you need in the application form. Include each member’s full name and email.",
    ],
    [
      "What should the PDF pitch deck include?",
      "Explain your startup idea, the problem, your solution, and your target customers. Include your current stage and team; add validation, traction, or product visuals if available. A working product is not required. Upload a PDF smaller than 3 MB.",
    ],
    [
      "Who are the judges?",
      "Announcing Soon. The official judging panel will be shared by the Entrepreneurship Society.",
    ],
  ];
  return (
    <>
      <Header />
      <main id="top" className="leap-site">
        <section className="leap-hero container">
          <div className="leap-hero-copy">
            <div className="leap-eyebrow">
              <span /> GUtech University’s Official Startup Pitching Event
            </div>
            <h1>
              Pitch Your
              <br />
              Startup.
              <br />
              <span>
                Unlock
                <br className="leap-mobile-break" /> Opportunities.
              </span>
            </h1>
            <p>
              Your idea deserves a room full of possibility. Present your
              startup to a panel of judges and take the next leap with a
              community of founders and mentors.
            </p>
            <div className="leap-hero-actions">
              <Link className="button button-primary" href="/register">
                Submit your startup <ArrowUpRight size={18} />
              </Link>
              <a className="leap-simple-link" href="#journey">
                How it works <ArrowRight size={15} />
              </a>
            </div>
            <div className="leap-hero-note">
              <span>
                <Check size={14} /> Completely free
              </span>
              <span>
                <Check size={14} /> Ideas welcome
              </span>
              <span>
                <Check size={14} /> Every stage
              </span>
            </div>
          </div>
          <div
            className="leap-visual"
            aria-label="LEAP 3. A stage for your next big idea."
          >
            <div className="leap-visual-top">
              <span>THE NEXT CHAPTER STARTS HERE</span>
              <MoveUpRight size={24} />
            </div>
            <div className="leap-orbits">
              <i />
              <i />
              <i />
            </div>
            <div className="leap-sculpture">
              <div className="leap-block leap-block-one" />
              <div className="leap-block leap-block-two" />
              <div className="leap-block leap-block-three" />
              <MoveUpRight className="leap-rise" strokeWidth={1.1} />
            </div>
            <div className="leap-visual-title">
              LEAP<span>3</span>
              <small>BIG IDEAS. REAL OPPORTUNITIES.</small>
            </div>
            <div className="leap-floating-card">
              <span>
                <Lightbulb size={19} />
              </span>
              <div>
                <strong>It starts with an idea.</strong>
                <small>A working product is optional.</small>
              </div>
              <ArrowUpRight size={17} />
            </div>
            <div className="leap-visual-bottom">
              <span>GUtech University</span>
              <span>EDITION 03</span>
            </div>
          </div>
        </section>
        <div className="leap-info-strip">
          <div className="container">
            <div>
              <span>THE EVENT</span>
              <strong>LEAP 3 · Startup Pitching Event</strong>
            </div>
            <div>
              <span>ORGANIZED BY</span>
              <strong>Entrepreneurship Society</strong>
            </div>
            <div>
              <span>EVENT DATE</span>
              <strong>{formatDate(event.eventDate, true)}</strong>
            </div>
            <div>
              <span>REGISTRATION</span>
              <strong className="leap-free">
                Completely FREE <ArrowUpRight size={16} />
              </strong>
            </div>
          </div>
        </div>
        <section id="about" className="container leap-section leap-about">
          <Reveal>
            <SectionLabel number="01">YOUR STARTUP. YOUR STAGE.</SectionLabel>
            <h2>
              Big things begin
              <br />
              with a <span>bold idea.</span>
            </h2>
          </Reveal>
          <Reveal className="leap-about-copy">
            <p>
              LEAP 3 is GUtech University’s Official Startup Pitching Event,
              organized by the Entrepreneurship Society. Bring the startup you
              believe in and present it to a panel of judges.
            </p>
            <p>
              From your first idea to your next growth milestone, there’s a
              place for your ambition.{" "}
              <strong>You don’t need a working product to apply.</strong>
            </p>
            <div className="leap-stage-tags">
              {[
                "Idea Only",
                "Prototype",
                "MVP",
                "Existing or Growing Business",
              ].map((s) => (
                <span key={s}>
                  <Check size={13} />
                  {s}
                </span>
              ))}
            </div>
            <div className="leap-format-note">
              <FileText size={21} />
              <p>
                <strong>Come ready to pitch.</strong> Apply with your team
                details and a PDF pitch deck. There is no project-building
                period during the event; shortlisted teams present their
                existing startup idea or business.
              </p>
            </div>
          </Reveal>
        </section>
        <section id="opportunities" className="leap-opportunities">
          <div className="container">
            <Reveal className="leap-section-heading">
              <div>
                <SectionLabel number="02">BEYOND THE PITCH</SectionLabel>
                <h2>
                  One pitch.
                  <br />
                  <span>New possibilities.</span>
                </h2>
              </div>
              <p>
                More than a moment on stage. A chance to connect with people and
                pathways that can shape what comes next.
              </p>
            </Reveal>
            <div className="leap-opportunity-grid">
              {opportunities.map((o) => (
                <Reveal className="leap-opportunity" key={o.name}>
                  <div>
                    <o.icon size={25} strokeWidth={1.5} />
                    <span>{o.number}</span>
                  </div>
                  <h3>{o.name}</h3>
                  <p>{o.text}</p>
                  <ArrowUpRight size={19} />
                </Reveal>
              ))}
            </div>
            <p className="leap-opportunity-note">
              Opportunities depend on startup fit and partner selection;
              participation does not guarantee a placement or offer.
            </p>
          </div>
        </section>
        <section id="journey" className="container leap-section">
          <Reveal className="leap-section-heading">
            <div>
              <SectionLabel number="03">THE ROAD TO THE STAGE</SectionLabel>
              <h2>
                Your next leap,
                <br />
                <span>in four steps.</span>
              </h2>
            </div>
            <p>
              Every application gets a review. Shortlisted startups get the
              invitation to pitch.
            </p>
          </Reveal>
          <div className="leap-steps">
            {steps.map((s, i) => (
              <Reveal className="leap-step" key={s.name}>
                <div>
                  <span>0{i + 1}</span>
                  {i < 3 && <ArrowRight size={20} />}
                </div>
                <h3>{s.name}</h3>
                <p>{s.text}</p>
              </Reveal>
            ))}
          </div>
          <div className="leap-journey-note">
            <Check size={18} />
            <span>
              Submit Your Startup → Application Review → Shortlisting → Pitch at
              LEAP 3
            </span>
          </div>
        </section>
        <section id="judging" className="container leap-judges">
          <Reveal>
            <SectionLabel number="04">MEET THE PANEL</SectionLabel>
            <h2>
              Fresh perspectives.
              <br />
              <span>Experienced voices.</span>
            </h2>
            <p>A panel ready to hear your vision and explore its potential.</p>
          </Reveal>
          <Reveal className="leap-judge-announcement">
            <div className="leap-judge-avatars">
              <span />
              <span />
              <span />
            </div>
            <span className="leap-eyebrow">THE LEAP 3 JUDGES</span>
            <h3>Announcing Soon</h3>
            <p>Watch this space for the official panel.</p>
          </Reveal>
        </section>
        <section id="faq" className="container leap-section leap-faq">
          <Reveal>
            <SectionLabel number="05">A LITTLE MORE CLARITY</SectionLabel>
            <h2>
              Good questions.
              <br />
              <span>Clear answers.</span>
            </h2>
            <p>Everything you need before you take the leap.</p>
          </Reveal>
          <div>
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <ChevronDown size={17} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="container leap-final">
          <div>
            <span className="leap-eyebrow">
              YOUR IDEA COULD BE WHAT’S NEXT.
            </span>
            <h2>
              Ready to take
              <br />
              the leap<span>?</span>
            </h2>
            <p>
              A strong idea. Your team. A PDF pitch deck.
              <br />
              That’s all you need to apply.
            </p>
            <Link href="/register" className="button">
              Apply for free <ArrowUpRight size={18} />
            </Link>
            <small>
              {state.open
                ? `Applications close ${formatDate(event.registrationDeadline)}`
                : state.reason}
            </small>
          </div>
          <span className="leap-final-arrow" aria-hidden="true">
            ↗
          </span>
        </section>
        {event.announcements.length > 0 && (
          <section className="container leap-section">
            <SectionLabel>FROM THE ORGANIZERS</SectionLabel>
            {event.announcements.map((a) => (
              <article className="workspace-card" key={a.id}>
                <h3>{a.title}</h3>
                <p>{a.message}</p>
              </article>
            ))}
          </section>
        )}
        {event.resultsPublished && event.results.length > 0 && (
          <section className="container leap-section">
            <SectionLabel>LEAP 3 RESULTS</SectionLabel>
            {event.results.map((r) => (
              <div className="workspace-card" key={r.teamName}>
                <h3>
                  #{r.place} · {r.teamName}
                </h3>
                <p>
                  {r.projectTitle} · {r.points} points
                </p>
              </div>
            ))}
          </section>
        )}
      </main>
      <Footer />
    </>
  );
}
