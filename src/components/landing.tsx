"use client";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  AudioLines,
  Box,
  BrainCircuit,
  Check,
  ChevronDown,
  Code2,
  Lightbulb,
  MapPin,
  MessageCircle,
  MoveUpRight,
  Orbit,
  Rocket,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import {
  Countdown,
  Footer,
  Header,
  Reveal,
  SectionLabel,
  formatDate,
} from "./ui";
import { CRITERIA, registrationState, type PublicEvent } from "@/lib/types";

function IdeaSculpture() {
  const [stage, setStage] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const stages = [
    { label: "A spark of an idea", icon: Lightbulb },
    { label: "A solution takes shape", icon: Box },
    { label: "Something worth building", icon: Rocket },
  ];
  const Icon = stages[stage].icon;
  return (
    <div
      className="idea-stage"
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        setPosition({
          x: (e.clientX - r.left - r.width / 2) / 28,
          y: (e.clientY - r.top - r.height / 2) / 28,
        });
      }}
      onPointerLeave={() => setPosition({ x: 0, y: 0 })}
      style={
        {
          "--mouse-x": `${position.x}px`,
          "--mouse-y": `${position.y}px`,
        } as CSSProperties
      }
    >
      <div className="stage-grid" />
      <div className="stage-glow" />
      <div className="orbit-line orbit-one" />
      <div className="orbit-line orbit-two" />
      <span className="coordinates coordinate-top">
        IDEA / 001 · IDEAS WITHOUT LIMITS
      </span>
      <span className="coordinates coordinate-bottom">
        HUMAN AMBITION × ARTIFICIAL INTELLIGENCE
      </span>
      <div className="sculpture">
        <div className="sculpture-shadow" />
        <div className="sphere">
          <div className="sphere-inner" />
          <div className="sphere-ring ring-a" />
          <div className="sphere-ring ring-b" />
          <div className="sphere-ring ring-c" />
          <div className="sphere-ring ring-d" />
          <div className="sphere-core">
            <Icon size={48} strokeWidth={1.2} />
          </div>
          <div className="sphere-highlight" />
        </div>
      </div>
      <div className="floating-note note-idea">
        <span className="note-icon">
          <Sparkles size={17} />
        </span>
        <div>
          <small>IT STARTS WITH</small>
          <strong>“What if?”</strong>
        </div>
        <span className="note-spark" />
      </div>
      <div className="floating-note note-product">
        <div className="mini-product">
          <div>
            <span />
            <span />
            <span />
          </div>
          <div className="mini-product-line" />
          <div className="mini-product-chart">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <div>
          <small>YOUR NEXT CHAPTER</small>
          <strong>
            Idea. Built. <MoveUpRight size={14} />
          </strong>
        </div>
        <span className="product-check">
          <Check size={14} />
        </span>
      </div>
      <span className="orbit-particle particle-one" />
      <span className="orbit-particle particle-two" />
      <span className="cross cross-one">+</span>
      <span className="cross cross-two">+</span>
      <button
        className="stage-switch"
        onClick={() => setStage((stage + 1) % 3)}
        aria-label="Explore the next stage of an idea"
      >
        <span className="stage-switch-icon">
          <Icon size={16} />
        </span>
        {stages[stage].label}
        <ArrowRight size={15} />
      </button>
      <span className="stage-index">
        0{stage + 1} <span>/ 03</span>
      </span>
      <div className="hero-badges">
        <span>
          <BrainCircuit size={12} />
          AI-powered innovation
        </span>
        <span>
          <Users size={12} />
          Up to 3 members
        </span>
      </div>
    </div>
  );
}
const benefits = [
  {
    icon: Target,
    title: "Start with a real problem.",
    text: "Look closer at the world around you. Find a challenge that deserves a better answer.",
    tag: "REAL-WORLD IMPACT",
  },
  {
    icon: BrainCircuit,
    title: "Let AI be your co-builder.",
    text: "Bring your curiosity. Use AI, code, or no-code tools to turn your idea into a working prototype.",
    tag: "AI IS ENCOURAGED",
  },
  {
    icon: Users,
    title: "Find your kind of people.",
    text: "Collaborate with ambitious students, connect across departments, and build something together.",
    tag: "1–3 MINDS. ONE MISSION.",
  },
  {
    icon: AudioLines,
    title: "Make your idea heard.",
    text: "Learn to shape a startup concept and pitch its potential to a panel of experienced judges.",
    tag: "BUILD. PITCH. GROW.",
  },
];
const phases = [
  {
    title: "Find your people.",
    subtitle: "Register your team",
    text: "Go solo or bring up to two teammates. PKR 1,500 covers your entire team.",
    icon: Users,
  },
  {
    title: "Ask a better question.",
    subtitle: "Discover a problem",
    text: "Research a real challenge. Talk to the people it affects. Find an opportunity to make things better.",
    icon: Lightbulb,
  },
  {
    title: "Make it real.",
    subtitle: "Build your solution",
    text: "Use AI, no-code tools, design, and code to bring an original MVP or prototype to life.",
    icon: Code2,
  },
  {
    title: "Own the stage.",
    subtitle: "Pitch your innovation",
    text: "Explain the problem, your approach, what makes it unique, and the impact it could have.",
    icon: AudioLines,
  },
  {
    title: "Leave your mark.",
    subtitle: "Win & get recognized",
    text: "The most innovative, practical, and clearly explained solutions rise to the top.",
    icon: Rocket,
  },
];
export function Landing({ event }: { event: PublicEvent }) {
  const [activeCriterion, setActiveCriterion] = useState(0);
  const state = registrationState(event);
  const faqs = [
    [
      "Who can participate?",
      "BuildFest 2026 is open to students from all departments. You don’t need to be a computer science student or an expert coder. Bring curiosity, commitment, and a problem worth solving.",
    ],
    [
      "How much does registration cost?",
      "PKR 1,500 for the entire team, whether you participate alone or with two teammates. There are no hidden charges. Follow the official payment instructions during registration; organizers verify every payment before confirmation.",
    ],
    [
      "Can I join on my own?",
      "Absolutely. Teams can have one, two, or three members, including the team leader. Solo innovators are welcome.",
    ],
    [
      "Are AI and no-code tools allowed?",
      "Yes. AI tools are allowed and encouraged. You must understand your solution, explain how it works, and declare any AI assistance in your project submission.",
    ],
    [
      "Do I need to build a complex website?",
      "No. Your MVP or website prototype is worth 5 out of 100 points. The biggest focus is the problem, impact, originality, and how clearly you explain your idea.",
    ],
    [
      "When and where is the event?",
      `The event takes place at GUtech University, Pakistan. ${event.eventDate ? `The confirmed date is ${formatDate(event.eventDate)}.` : "The official event date and schedule will be announced here once confirmed."}`,
    ],
    [
      "How do refunds and payment support work?",
      event.refundPolicy ||
        "The organizer’s refund policy and payment support details will be published before registration opens. Please review that information before transferring a payment.",
    ],
  ];
  return (
    <>
      <Header />
      <main id="top">
        <section className="hero">
          <div className="container hero-layout">
            <div className="hero-copy">
              <Reveal>
                <div className="event-kicker">
                  <span className="pill-dot" />
                  GUTECH’S INNOVATION CHALLENGE
                  <span className="kicker-year">2026</span>
                </div>
                <h1>
                  THE NEXT
                  <br />
                  BIG IDEA
                  <br />
                  COULD BE
                  <br />
                  <span className="gradient-text">YOURS.</span>
                  <span className="headline-star">✳</span>
                </h1>
                <p className="hero-tagline">
                  One idea. Three minds.
                  <br className="mobile-break" /> Endless possibilities.
                </p>
                <p className="hero-description">
                  Turn real-world problems into extraordinary solutions.
                  <br className="desktop-break" /> Build with AI. Find your
                  people. Pitch what’s next.
                </p>
                <div className="hero-actions">
                  <Link href="/register" className="button button-primary">
                    Register your team <ArrowUpRight size={19} />
                  </Link>
                  <a href="#challenge" className="hero-explore">
                    Explore the challenge <ArrowDown size={16} />
                  </a>
                </div>
                <div className="hero-trust">
                  <ShieldCheck size={16} />
                  <span>
                    <strong>PKR 1,500</strong> per team{" "}
                    <span className="trust-separator">·</span> All departments
                    welcome
                  </span>
                </div>
              </Reveal>
            </div>
            <Reveal className="hero-art" delay={0.15}>
              <IdeaSculpture />
            </Reveal>
          </div>
          <div className="container hero-bottom">
            <div className="hero-location">
              <MapPin size={16} />
              <span>GUtech University, Pakistan</span>
            </div>
            <Countdown deadline={event.registrationDeadline} />
            <a href="#challenge" className="scroll-cue">
              SCROLL TO DISCOVER <ArrowDown size={13} />
            </a>
          </div>
        </section>
        <section className="partners-band">
          <div className="container partners-inner">
            <div className="partner-intro">
              BIG IDEAS.
              <br />
              <strong>BACKED BY GOOD PEOPLE.</strong>
            </div>
            <div className="partner-brand">
              {event.organizerLogoId ? (
                <img
                  src={`/api/files/${event.organizerLogoId}`}
                  alt="Official GUtech Entrepreneurship Society logo"
                />
              ) : (
                <span className="gutech-wordmark">
                  GUtech<span>Entrepreneurship Society</span>
                </span>
              )}
              <small>ORGANIZED BY</small>
            </div>
            <div className="partner-divider" />
            <a
              className="partner-brand"
              href="https://artdera.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              {event.partnerLogoId ? (
                <img
                  src={`/api/files/${event.partnerLogoId}`}
                  alt="Official ArtDera logo"
                />
              ) : (
                <span className="artdera-wordmark">
                  ArtDera
                  <span className="partner-arrow">
                    <ArrowUpRight size={22} />
                  </span>
                </span>
              )}
              <small>POWERED BY</small>
            </a>
            <span className="partner-end">
              <Orbit size={33} strokeWidth={1} />
            </span>
          </div>
        </section>
        <section id="challenge" className="section challenge-section">
          <div className="container">
            <Reveal>
              <SectionLabel number="01">A CALL TO THE CURIOUS</SectionLabel>
              <div className="section-heading-row">
                <h2>
                  Don’t just think
                  <br />
                  about the future.
                  <br />
                  <span className="gradient-text">Build it.</span>
                </h2>
                <div className="section-aside">
                  <span className="small-orbit">
                    <Sparkles size={20} />
                  </span>
                  <p>
                    Your ideas deserve more than
                    <br />a notes app. This is where you
                    <br />
                    give them a life of their own.
                  </p>
                  <a href="#journey" className="text-link">
                    See how it works <ArrowUpRight size={15} />
                  </a>
                </div>
              </div>
            </Reveal>
            <div className="benefit-grid">
              {benefits.map((b, i) => (
                <Reveal
                  className={`benefit benefit-${i}`}
                  delay={i * 0.06}
                  key={b.title}
                >
                  <div className="benefit-top">
                    <span className="benefit-icon">
                      <b.icon size={26} strokeWidth={1.5} />
                    </span>
                    <span className="benefit-number">0{i + 1}</span>
                  </div>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                  <span className="benefit-tag">{b.tag}</span>
                </Reveal>
              ))}
            </div>
            <Reveal>
              <div className="courage-note">
                <span className="courage-mark">“</span>
                <p>
                  You don’t need to be an expert coder.
                  <br />
                  <strong>You need the courage to solve a problem.</strong>
                </p>
                <div className="courage-art">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            </Reveal>
          </div>
        </section>
        <section id="journey" className="section journey-section">
          <div className="container">
            <Reveal>
              <SectionLabel number="02">
                FROM WHAT IF TO WHAT’S NEXT
              </SectionLabel>
              <div className="section-heading-row">
                <h2>
                  Five steps.
                  <br />
                  <span className="soft-text">One big leap.</span>
                </h2>
                <p className="section-intro">
                  Every great thing started somewhere.
                  <br />
                  Here’s where your journey begins.
                </p>
              </div>
            </Reveal>
            <div className="journey-list">
              {phases.map((p, i) => (
                <Reveal className="journey-item" key={p.title}>
                  <div className="journey-number">
                    <span>0{i + 1}</span>
                    <div className="journey-connector" />
                  </div>
                  <div className="journey-title">
                    <small>{p.subtitle}</small>
                    <h3>{p.title}</h3>
                    {event.phaseDates[i] && (
                      <span className="phase-date">
                        {formatDate(event.phaseDates[i])}
                      </span>
                    )}
                  </div>
                  <p>{p.text}</p>
                  <span className="journey-icon">
                    <p.icon size={25} strokeWidth={1.4} />
                  </span>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
        <section id="judging" className="section judging-section">
          <div className="container judging-layout">
            <Reveal className="judging-copy">
              <SectionLabel number="03">GOOD IDEAS GET THEIR DUE</SectionLabel>
              <h2>
                Big on ideas.
                <br />
                <span className="gradient-text">Clear on criteria.</span>
              </h2>
              <p className="section-intro">
                100 points. Six criteria. Zero guesswork.
                <br />
                We’re looking for ideas with purpose,
                <br />
                not the most complicated website.
              </p>
              <div className="score-orbit">
                <svg viewBox="0 0 200 200" aria-hidden="true">
                  <circle
                    cx="100"
                    cy="100"
                    r="87"
                    fill="none"
                    stroke="#e9edf6"
                    strokeWidth="7"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r="87"
                    fill="none"
                    stroke="url(#score-gradient)"
                    strokeWidth="7"
                    strokeDasharray="546"
                    strokeDashoffset="0"
                    strokeLinecap="round"
                    transform="rotate(-90 100 100)"
                  />
                  <defs>
                    <linearGradient id="score-gradient">
                      <stop stopColor="#2667ed" />
                      <stop offset="1" stopColor="#9c73ee" />
                    </linearGradient>
                  </defs>
                </svg>
                <div>
                  <strong>
                    100<span>pts</span>
                  </strong>
                  <small>IDEAS OVER COMPLEXITY</small>
                </div>
                <span className="score-spark">
                  <Sparkles size={21} />
                </span>
              </div>
            </Reveal>
            <Reveal className="judging-panel">
              <div className="judging-panel-heading">
                <span>WHAT THE JUDGES LOOK FOR</span>
                <ScanLine size={17} />
              </div>
              {CRITERIA.map((c, i) => (
                <button
                  key={c.name}
                  className={`criterion ${activeCriterion === i ? "criterion-active" : ""}`}
                  onClick={() => setActiveCriterion(i)}
                  onFocus={() => setActiveCriterion(i)}
                  aria-expanded={activeCriterion === i}
                >
                  <div className="criterion-top">
                    <span className="criterion-num">0{i + 1}</span>
                    <strong>{c.name}</strong>
                    <span className="criterion-points">
                      {c.points}
                      <small>pts</small>
                    </span>
                  </div>
                  <div className="criterion-track">
                    <span style={{ width: `${(c.points / 30) * 100}%` }} />
                  </div>
                  {activeCriterion === i && <p>{c.description}</p>}
                </button>
              ))}
              <div className="judging-footnote">
                <BrainCircuit size={18} />
                <p>
                  AI is your advantage. Understand your product
                  <br />
                  and be transparent about how you used it.
                </p>
              </div>
            </Reveal>
          </div>
        </section>
        {(event.prizes.length > 0 || event.people.length > 0) && (
          <section className="section spotlight-section">
            <div className="container">
              <Reveal>
                <SectionLabel number="04">
                  THE PEOPLE & THE POSSIBILITIES
                </SectionLabel>
                <h2>
                  A little more
                  <br />
                  to look forward to.
                </h2>
              </Reveal>
              <div className="spotlight-grid">
                {event.prizes.map((p) => (
                  <Reveal className="spotlight-card" key={p.id}>
                    <Sparkles size={25} />
                    <small>CONFIRMED AWARD</small>
                    <h3>{p.title}</h3>
                    <p>{p.description}</p>
                  </Reveal>
                ))}
                {event.people.map((p) => (
                  <Reveal className="spotlight-card" key={p.id}>
                    <div className="person-avatar">
                      {p.name
                        .split(" ")
                        .slice(0, 2)
                        .map((n) => n[0])
                        .join("")}
                    </div>
                    <small>{p.kind.toUpperCase()}</small>
                    <h3>{p.name}</h3>
                    <p>{p.title}</p>
                  </Reveal>
                ))}
              </div>
            </div>
          </section>
        )}
        {event.resultsPublished && event.results.length > 0 && (
          <section className="section">
            <div className="container">
              <SectionLabel>THE IDEAS THAT ROSE TO THE TOP</SectionLabel>
              <h2>BuildFest 2026 results.</h2>
              <div className="results-list">
                {event.results.map((r) => (
                  <div key={r.teamName}>
                    <span>#{r.place}</span>
                    <div>
                      <h3>{r.teamName}</h3>
                      <p>{r.projectTitle}</p>
                    </div>
                    <strong>
                      {r.points}
                      <small>/100</small>
                    </strong>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
        <section id="faq" className="section faq-section">
          <div className="container faq-layout">
            <Reveal>
              <SectionLabel number="04">A FEW THINGS TO KNOW</SectionLabel>
              <h2>
                Curious?
                <br />
                <span className="soft-text">Good.</span>
              </h2>
              <p className="section-intro">The answers before the adventure.</p>
              {event.supportEmail ? (
                <a className="text-link" href={`mailto:${event.supportEmail}`}>
                  Ask the organizers <ArrowUpRight size={15} />
                </a>
              ) : (
                <p className="support-pending">
                  Organizer contact details will be
                  <br />
                  published before registration opens.
                </p>
              )}
            </Reveal>
            <Reveal className="faq-list">
              {faqs.map(([q, a], i) => (
                <details key={q} open={i === 0}>
                  <summary>
                    <span>{q}</span>
                    <ChevronDown size={17} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </Reveal>
          </div>
        </section>
        <section className="final-cta">
          <div className="container">
            <Reveal>
              <div className="cta-kicker">
                <span className="pulse-dot" /> A SMALL TEAM. AN EXTRAORDINARY
                START.
              </div>
              <h2>
                The future is
                <br />
                <span className="gradient-text">a team sport.</span>
                <span className="cta-star">✳</span>
              </h2>
              <div className="final-cta-bottom">
                <div>
                  <p>Your next chapter starts with one idea.</p>
                  <span>
                    1–3 members <i /> PKR 1,500 per team <i /> AI encouraged
                  </span>
                </div>
                <Link href="/register" className="button button-primary">
                  Let’s build something <ArrowUpRight size={20} />
                </Link>
              </div>
              <div className="cta-status">
                <span className={`pill-dot ${state.open ? "green-dot" : ""}`} />
                {state.open
                  ? `Register before ${formatDate(event.registrationDeadline)}`
                  : state.reason}
              </div>
            </Reveal>
          </div>
        </section>
        <section className="trust-band">
          <div className="container trust-band-inner">
            <span>
              <ShieldCheck size={19} /> Transparent fees. Verified payments.
            </span>
            <Link href="/privacy">
              Privacy & refund information <ArrowUpRight size={14} />
            </Link>
            <a
              href="https://wa.me/"
              onClick={(e) => {
                e.currentTarget.href = `https://wa.me/?text=${encodeURIComponent(`One idea. Three minds. Endless possibilities. Join me at BuildFest 2026 — GUtech’s innovation challenge. ${window.location.origin}`)}`;
              }}
              target="_blank"
              rel="noopener noreferrer"
            >
              <MessageCircle size={16} /> Bring a friend{" "}
              <ArrowUpRight size={14} />
            </a>
          </div>
        </section>
        {event.confirmedTeams !== null && event.confirmedTeams > 0 && (
          <div className="container real-team-count">
            <Users size={14} />
            {event.confirmedTeams}{" "}
            {event.confirmedTeams === 1 ? "team has" : "teams have"} a verified
            registration. Make your idea the next one.
          </div>
        )}
      </main>
      <Footer />
      <Link href="/register" className="mobile-registration">
        <span>
          PKR 1,500 <small>/ team</small>
        </span>
        <strong>
          Register your team <ArrowUpRight size={17} />
        </strong>
      </Link>
    </>
  );
}
