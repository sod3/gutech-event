"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Bell,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Users,
} from "lucide-react";
import { ORGANIZER_FOLLOW_UP } from "@/lib/registration";
import { type PublicEvent, type SafeTeam, type Submission } from "@/lib/types";
import {
  api,
  EmptyState,
  FormMessage,
  LoadingButton,
  Status,
  formatDate,
} from "./ui";
import { Workspace } from "./workspace";
export function Participant({
  initialTeam,
  event,
}: {
  initialTeam: SafeTeam;
  event: PublicEvent;
}) {
  const [team, setTeam] = useState(initialTeam),
    [tab, setTab] = useState("overview"),
    [submission, setSubmission] = useState<Submission>(initialTeam.submission),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const [now, setNow] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    const initial = setTimeout(() => setNow(Date.now()), 0);
    const refresh = async () => {
      try {
        const r = await api<{ team: SafeTeam }>("/api/team");
        setTeam(r.team);
      } catch {}
    };
    const refreshTimer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10000);
    window.addEventListener("focus", refresh);
    return () => {
      clearInterval(timer);
      clearTimeout(initial);
      clearInterval(refreshTimer);
      window.removeEventListener("focus", refresh);
    };
  }, []);
  const shortlisted = team.registrationStatus === "shortlisted";
  const editable =
    shortlisted &&
    !event.resultsPublished &&
    !!event.submissionDeadline &&
    new Date(event.submissionDeadline).getTime() > now &&
    now > 0;
  const save = async () => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await api<{ team: SafeTeam; message: string }>(
        "/api/team",
        "PATCH",
        { submission: { ...submission, final: true } },
      );
      setTeam(r.team);
      setSubmission(r.team.submission);
      setMessage(r.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save.");
    } finally {
      setBusy(false);
    }
  };
  const upload = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("purpose", "deck");
      const r = await api<{ fileId: string; message: string }>(
        "/api/files",
        "POST",
        body,
      );
      setSubmission((p) => ({ ...p, deckFileId: r.fileId }));
      setMessage(r.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to upload.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Workspace
      title="STARTUP WORKSPACE"
      name={team.members[0].name}
      tabs={[
        { id: "overview", title: "Overview", icon: LayoutDashboard },
        { id: "application", title: "Your application", icon: Lightbulb },
        { id: "team", title: "Your team", icon: Users },
        { id: "pitch", title: "Pitch details", icon: FileText },
        { id: "resources", title: "Pitch preparation", icon: BookOpen },
      ]}
      active={tab}
      onTab={(s) => {
        setTab(s);
        setError("");
        setMessage("");
      }}
    >
      <div className="workspace-heading">
        <div>
          <h1>
            {
              {
                overview: `Your next chapter, ${team.members[0].name.split(" ")[0]}.`,
                application: "Your startup application.",
                team: "The people behind the idea.",
                pitch: "Your pitch, in your words.",
                resources: "Make your idea heard.",
              }[tab]
            }
          </h1>
          <p>LEAP 3 · GUtech University’s Official Startup Pitching Event</p>
        </div>
        <Status status={team.registrationStatus} />
      </div>
      <FormMessage error={error} message={message} />
      {tab === "overview" && (
        <>
          <div className="welcome-card">
            <div>
              <small>
                {shortlisted
                  ? "YOU’RE INVITED TO PITCH"
                  : team.registrationStatus === "rejected"
                    ? "APPLICATION REVIEWED"
                    : "APPLICATION SUBMITTED"}
              </small>
              <h2>
                {shortlisted
                  ? "Your startup is shortlisted!"
                  : team.registrationStatus === "rejected"
                    ? "Thank you for sharing your vision."
                    : "Your idea is in good hands."}
              </h2>
              <p>
                {shortlisted
                  ? "Our organizers have selected your startup to pitch at LEAP 3. Watch for your invitation details from the Entrepreneurship Society."
                  : team.registrationStatus === "rejected"
                    ? "Your startup was not shortlisted for this edition. Your submitted application is preserved here for your reference."
                    : "Your application has been submitted successfully. Our team will review your startup and contact you if shortlisted."}
              </p>
              {shortlisted && (
                <Link className="text-link" href="/dashboard/confirmation">
                  View pitching confirmation <ArrowUpRight size={14} />
                </Link>
              )}
            </div>
            <Lightbulb />
          </div>
          <div className="dashboard-grid">
            <div className="workspace-card">
              <div className="card-header">
                <h2>Application at a glance</h2>
                <FileText size={17} />
              </div>
              <dl className="payment-detail-list">
                <div>
                  <dt>STARTUP</dt>
                  <dd>{team.name}</dd>
                </div>
                <div>
                  <dt>STAGE</dt>
                  <dd>
                    {team.startupStage || "Not recorded (existing application)"}
                  </dd>
                </div>
                <div>
                  <dt>APPLICATION ID</dt>
                  <dd>{team.registrationId}</dd>
                </div>
                <div>
                  <dt>REGISTRATION</dt>
                  <dd>Completely FREE</dd>
                </div>
                <div>
                  <dt>SUBMITTED ON</dt>
                  <dd>{formatDate(team.createdAt)}</dd>
                </div>
              </dl>
              <p className="payment-help">{ORGANIZER_FOLLOW_UP}</p>
            </div>
            <div className="workspace-card">
              <div className="card-header">
                <h2>From application to stage</h2>
                <CheckCircle2 size={17} />
              </div>
              {[
                "Submit Your Startup",
                "Application Review",
                "Shortlisting",
                "Pitch at LEAP 3",
              ].map((s, i) => (
                <div className="team-member" key={s}>
                  <span className="avatar">0{i + 1}</span>
                  <h3>{s}</h3>
                </div>
              ))}
              <p className="payment-help">
                A strong idea is eligible. No working product is required, and
                there is no project-building period during the event.
              </p>
            </div>
            <div className="workspace-card span-two">
              <div className="card-header">
                <h2>Organizer announcements</h2>
                <Bell size={17} />
              </div>
              {event.announcements.length ? (
                event.announcements.map((a) => (
                  <article key={a.id}>
                    <h3>{a.title}</h3>
                    <p className="payment-help">{a.message}</p>
                  </article>
                ))
              ) : (
                <EmptyState
                  icon={<Bell size={18} />}
                  title="Updates will appear here."
                >
                  Watch for news from the Entrepreneurship Society.
                </EmptyState>
              )}
            </div>
          </div>
        </>
      )}
      {tab === "application" && (
        <div className="workspace-card leap-application-card">
          <div className="card-header">
            <h2>{team.name}</h2>
            <Status status={team.registrationStatus} />
          </div>
          <h3>Startup stage</h3>
          <p className="payment-help">
            {team.startupStage || "Not recorded for this existing registration"}
          </p>
          <h3>Idea, problem, solution & target customers</h3>
          <p className="leap-application-summary">
            {team.startupDescription ||
              team.submission.solution ||
              "No startup description saved for this existing registration."}
          </p>
          {team.applicationDeckFileId || team.submission.deckFileId ? (
            <a
              className="button button-secondary"
              href={`/api/files/${team.applicationDeckFileId || team.submission.deckFileId}`}
            >
              <Download size={16} />
              Download application pitch deck
            </a>
          ) : (
            <p className="payment-help">
              This existing registration has no application deck. Contact the
              organizers for guidance.
            </p>
          )}
          <p className="payment-help">
            Your original application and PDF are kept for organizer review.
            Only shortlisted startups will be invited to pitch.
          </p>
        </div>
      )}
      {tab === "team" && (
        <div className="workspace-card">
          <div className="card-header">
            <h2>{team.name}</h2>
            <span>{team.members.length} MEMBERS</span>
          </div>
          {team.members.map((m, i) => (
            <div className="team-member" key={m.email}>
              <span className="avatar">{m.name[0]}</span>
              <div>
                <h3>{m.name}</h3>
                <p>{m.email}</p>
              </div>
              <small>{i === 0 ? "TEAM LEADER" : "MEMBER"}</small>
            </div>
          ))}
          <p className="payment-help">
            Share your private invitation with teammates: {" "}
            <Link className="text-link" href={`/invite/${team.inviteToken}`}>
              View team invitation <ArrowUpRight size={13} />
            </Link>
          </p>
          <dl className="payment-detail-list">
            <div>
              <dt>UNIVERSITY / ORGANIZATION</dt>
              <dd>{team.institution || "Not recorded"}</dd>
            </div>
            <div>
              <dt>LEADER WHATSAPP</dt>
              <dd>{team.whatsapp}</dd>
            </div>
          </dl>
        </div>
      )}
      {tab === "pitch" && (
        <>
          <div className="notice">
            <FileText size={18} />
            <span>
              These optional details supplement your original application. A
              prototype or MVP link is optional; idea-only startups are
              eligible.
            </span>
          </div>
          {!editable && (
            <p className="payment-help">
              {!shortlisted
                ? "Pitch updates are available to shortlisted startups when organizers open an update window."
                : "Pitch updates are currently closed. Your saved application and pitch deck are preserved."}
            </p>
          )}
          <div className="workspace-card submission-form">
            <div className="form-grid">
              {(
                [
                  { key: "title", label: "Startup / pitch title" },
                  { key: "problem", label: "Problem & target customers" },
                  { key: "solution", label: "Your solution" },
                  { key: "research", label: "Research or traction · optional" },
                  { key: "mvpUrl", label: "Prototype / MVP link · optional" },
                  { key: "pitchUrl", label: "Presentation link · optional" },
                ] as const
              ).map((f) => (
                <div
                  className={`field ${["problem", "solution", "research"].includes(f.key) ? "field-full" : ""}`}
                  key={f.key}
                >
                  <label htmlFor={`pitch-${f.key}`}>{f.label}</label>
                  {["problem", "solution", "research"].includes(f.key) ? (
                    <textarea
                      id={`pitch-${f.key}`}
                      value={submission[f.key]}
                      maxLength={f.key === "solution" ? 5000 : 4000}
                      disabled={!editable}
                      onChange={(e) =>
                        setSubmission((p) => ({
                          ...p,
                          [f.key]: e.target.value,
                        }))
                      }
                    />
                  ) : (
                    <input
                      id={`pitch-${f.key}`}
                      value={submission[f.key]}
                      type={f.key.endsWith("Url") ? "url" : "text"}
                      maxLength={f.key === "title" ? 120 : 500}
                      disabled={!editable}
                      onChange={(e) =>
                        setSubmission((p) => ({
                          ...p,
                          [f.key]: e.target.value,
                        }))
                      }
                    />
                  )}
                </div>
              ))}
              <div className="field field-full">
                <label htmlFor="updated-deck">
                  Updated pitch deck · PDF, up to 3 MB
                </label>
                <input
                  id="updated-deck"
                  type="file"
                  accept=".pdf,application/pdf"
                  disabled={!editable || busy}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void upload(f);
                  }}
                />
                {submission.deckFileId && (
                  <a
                    className="text-link"
                    href={`/api/files/${submission.deckFileId}`}
                  >
                    Download current deck <Download size={13} />
                  </a>
                )}
              </div>
            </div>
            <LoadingButton busy={busy} disabled={!editable} onClick={save}>
              Save pitch details <CheckCircle2 size={14} />
            </LoadingButton>
            {event.submissionDeadline && (
              <p className="payment-help">
                Optional pitch updates close{" "}
                {formatDate(event.submissionDeadline)}. Your original
                application deck is preserved.
              </p>
            )}
          </div>
        </>
      )}
      {tab === "resources" && (
        <div className="resources-grid">
          {[
            {
              title: "Start with the problem.",
              text: "Explain who faces the problem, how they handle it today, and why a better solution matters.",
            },
            {
              title: "Make the solution clear.",
              text: "Show what your startup offers and what makes the approach valuable. A clear idea can be enough; a working product is optional.",
            },
            {
              title: "Know your customers.",
              text: "Describe your target customers, their needs, and how you plan to reach them. Share research or traction if available.",
            },
            {
              title: "Tell your team’s story.",
              text: "Introduce the people behind the startup and the next milestone you want to reach. Be honest about your current stage.",
            },
            {
              title: "Prepare before the event.",
              text: "Shortlisted teams present an existing startup idea, prototype, MVP, or business. There is no time allocated to build projects during LEAP 3.",
            },
            {
              title: "Explore the opportunities.",
              text: "Connect with internships, startup incubation, PhD professor mentorship, startup growth support, and networking opportunities.",
            },
          ].map((r) => (
            <div className="resource-card" key={r.title}>
              <Lightbulb size={22} />
              <h3>{r.title}</h3>
              <p>{r.text}</p>
            </div>
          ))}
        </div>
      )}
    </Workspace>
  );
}
