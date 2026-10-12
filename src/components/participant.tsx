"use client";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Lightbulb,
  Link2,
  MessageCircle,
  Rocket,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { type PublicEvent, type SafeTeam, type Submission } from "@/lib/types";
import {
  api,
  Countdown,
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
  const [team, setTeam] = useState(initialTeam);
  const [tab, setTab] = useState("overview");
  const [submission, setSubmission] = useState<Submission>(
    initialTeam.submission,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [invite, setInvite] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [methodId, setMethodId] = useState(event.paymentMethods[0]?.id || "");
  const [receipt, setReceipt] = useState<File | null>(null);
  const confirmed = team.payment.status === "confirmed";
  const submissionOpen =
    confirmed &&
    !event.resultsPublished &&
    !!event.submissionDeadline &&
    new Date(event.submissionDeadline).getTime() > Date.now();
  useEffect(() => {
    setInvite(`${window.location.origin}/invite/${initialTeam.inviteToken}`);
  }, [initialTeam.inviteToken]);
  const changeTab = (s: string) => {
    setTab(s);
    setError("");
    setMessage("");
  };
  const save = async (final: boolean) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await api<{ team: SafeTeam; message: string }>(
        "/api/team",
        "PATCH",
        { submission: { ...submission, final } },
      );
      setTeam(result.team);
      setSubmission(result.team.submission);
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const checklist = async (key: string) => {
    const next = team.checklist.includes(key)
      ? team.checklist.filter((v) => v !== key)
      : [...team.checklist, key];
    try {
      const result = await api<{ team: SafeTeam }>("/api/team", "PATCH", {
        checklist: next,
      });
      setTeam(result.team);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    }
  };
  const uploadDeck = async (file: File) => {
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("purpose", "deck");
      const result = await api<{ fileId: string; message: string }>(
        "/api/files",
        "POST",
        body,
      );
      setSubmission((prev) => ({ ...prev, deckFileId: result.fileId }));
      setTeam((prev) => ({
        ...prev,
        submission: { ...prev.submission, deckFileId: result.fileId },
      }));
      setMessage(result.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  };
  const resubmitPayment = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("data", JSON.stringify({ methodId, reference: paymentRef }));
      if (receipt) form.append("receipt", receipt);
      const r = await api<{ message: string }>(
        "/api/team/payment",
        "POST",
        form,
      );
      const refreshed = await api<{ team: SafeTeam }>("/api/team");
      setTeam(refreshed.team);
      setMessage(r.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  };
  const field = (
    key: keyof Submission,
    label: string,
    hint: string,
    multiline = false,
  ) => (
    <div className={`field ${multiline ? "field-full" : ""}`}>
      <label htmlFor={`submission-${key}`}>{label}</label>
      {multiline ? (
        <textarea
          id={`submission-${key}`}
          value={String(submission[key] || "")}
          onChange={(e) =>
            setSubmission((prev) => ({ ...prev, [key]: e.target.value }))
          }
          placeholder={hint}
          disabled={!submissionOpen}
          maxLength={key === "solution" ? 5000 : 4000}
        />
      ) : (
        <input
          id={`submission-${key}`}
          value={String(submission[key] || "")}
          onChange={(e) =>
            setSubmission((prev) => ({ ...prev, [key]: e.target.value }))
          }
          placeholder={hint}
          disabled={!submissionOpen}
          type={key.endsWith("Url") ? "url" : "text"}
          maxLength={key === "title" ? 120 : 500}
        />
      )}
    </div>
  );
  return (
    <Workspace
      title="PARTICIPANT WORKSPACE"
      name={team.members[0].name}
      tabs={[
        { id: "overview", title: "Overview", icon: LayoutDashboard },
        { id: "project", title: "Your project", icon: Lightbulb },
        { id: "team", title: "Team & registration", icon: Users },
        { id: "resources", title: "Builder’s toolkit", icon: BookOpen },
      ]}
      active={tab}
      onTab={changeTab}
    >
      <div className="workspace-heading">
        <div>
          <h1>
            {
              {
                overview: `Let’s build, ${team.members[0].name.split(" ")[0]}.`,
                project: "Your next big idea.",
                team: "Good company. Big possibilities.",
                resources: "A little help for the journey.",
              }[tab]
            }
          </h1>
          <p>
            {team.name} <span style={{ margin: "0 5px" }}>·</span>{" "}
            {team.registrationId}
          </p>
        </div>
        <Status status={team.payment.status} />
      </div>
      {tab === "overview" && (
        <>
          <div className="welcome-card">
            <div>
              <small>
                {confirmed
                  ? "WELCOME TO THE FUTURE, INNOVATOR!"
                  : "YOUR REGISTRATION IS IN REVIEW"}
              </small>
              <h2>
                {confirmed
                  ? "Your team is officially part of BuildFest 2026."
                  : "One step closer to what’s next."}
              </h2>
              <p>
                {confirmed
                  ? "Your payment is verified. Explore the toolkit, validate your problem, and start building your idea."
                  : "Your team details are saved. An organizer will verify your payment before confirming your place. You don’t need to register again."}
              </p>
              {confirmed && (
                <Link
                  href="/dashboard/confirmation"
                  className="text-link"
                  style={{ marginTop: 17, fontSize: 12 }}
                >
                  View registration confirmation <ArrowUpRight size={13} />
                </Link>
              )}
            </div>
            {confirmed ? <Rocket /> : <Clock3 />}
          </div>
          <div className="dashboard-grid">
            <div className="workspace-card">
              <div className="card-header">
                <h2>Registration & payment</h2>
                <ShieldCheck size={16} />
              </div>
              <dl className="payment-detail-list">
                <div>
                  <dt>STATUS</dt>
                  <dd>
                    <Status status={team.payment.status} />
                  </dd>
                </div>
                <div>
                  <dt>TEAM FEE</dt>
                  <dd>PKR {team.payment.amount.toLocaleString()}</dd>
                </div>
                <div>
                  <dt>TRANSACTION REFERENCE</dt>
                  <dd>{team.payment.reference}</dd>
                </div>
                <div>
                  <dt>REGISTRATION ID</dt>
                  <dd>{team.registrationId}</dd>
                </div>
              </dl>
              <div className="payment-help">
                {team.payment.note && <p>{team.payment.note}</p>}
                {confirmed
                  ? "Your payment has been verified by the organizer."
                  : "Only an authorized organizer can verify your payment."}
                {team.payment.receiptId && (
                  <p>
                    <a href={`/api/files/${team.payment.receiptId}`}>
                      Download your receipt ↗
                    </a>
                  </p>
                )}
              </div>
              {team.payment.status === "rejected" && (
                <button
                  className="text-link"
                  style={{ marginTop: 15, fontSize: 12 }}
                  onClick={() => changeTab("team")}
                >
                  Resolve payment details <ArrowRight size={12} />
                </button>
              )}
            </div>
            <div className="workspace-card deadline-card">
              <div className="card-header">
                <h2>Next milestone</h2>
                <Clock3 size={16} />
              </div>
              <p style={{ marginTop: 0 }}>PROJECT SUBMISSION DEADLINE</p>
              <Countdown
                deadline={event.submissionDeadline}
                compact
                purpose="submission"
              />
              <p>
                {event.submissionDeadline
                  ? formatDate(event.submissionDeadline)
                  : "The official submission schedule is being finalized."}
              </p>
              <button
                className="text-link"
                style={{ marginTop: 18, fontSize: 12 }}
                onClick={() => changeTab("project")}
              >
                Open your project <ArrowRight size={13} />
              </button>
            </div>
            <div className="workspace-card">
              <div className="card-header">
                <h2>Your building blocks</h2>
                <ClipboardList size={16} />
              </div>
              <div className="progress-summary">
                <span>A little progress goes a long way.</span>
                <span>{team.checklist.length} / 4</span>
              </div>
              <div className="progress-track">
                <span
                  style={{ width: `${(team.checklist.length / 4) * 100}%` }}
                />
              </div>
              {[
                ["problem", "Define a problem worth solving"],
                ["research", "Validate it with research or interviews"],
                ["prototype", "Build a prototype that shows your idea"],
                ["pitch", "Prepare your pitch and final submission"],
              ].map(([key, label]) => (
                <label className="checklist-item" key={key}>
                  <input
                    type="checkbox"
                    checked={team.checklist.includes(key)}
                    onChange={() => checklist(key)}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
            <div className="workspace-card">
              <div className="card-header">
                <h2>From the organizers</h2>
                <Bell size={16} />
              </div>
              {event.announcements.length ? (
                event.announcements.slice(0, 4).map((a) => (
                  <div className="announcement-item" key={a.id}>
                    <h3>{a.title}</h3>
                    <small>{formatDate(a.date)}</small>
                    <p>{a.message}</p>
                  </div>
                ))
              ) : (
                <EmptyState icon={<Bell size={19} />} title="Watch this space.">
                  Official event updates and announcements will appear here.
                </EmptyState>
              )}
            </div>
          </div>
        </>
      )}
      {tab === "project" && (
        <>
          <div className="notice">
            <BrainCircuit size={18} />
            <span>
              Your prototype is 5 points out of 100. Focus on the problem, the
              impact, and the idea. Be clear about your AI assistance.
            </span>
          </div>
          {!submissionOpen && (
            <div className="notice notice-warning" style={{ marginTop: 15 }}>
              <Clock3 size={18} />
              <span>
                {!confirmed
                  ? "Project submissions unlock after your payment is verified."
                  : !event.submissionDeadline
                    ? "Project submissions will open when the official submission deadline is announced."
                    : "The submission deadline has passed. Your last saved project is preserved."}
              </span>
            </div>
          )}
          <div className="workspace-card submission-form">
            <div className="card-header">
              <h2>The idea, in your words.</h2>
              <Status status={team.submission.final ? "final" : "draft"} />
            </div>
            <div className="form-grid">
              <div className="field field-full">
                <label htmlFor="project-title">Project / idea name</label>
                <input
                  id="project-title"
                  value={submission.title}
                  placeholder="Give your idea a name"
                  maxLength={120}
                  disabled={!submissionOpen}
                  onChange={(e) =>
                    setSubmission((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              {field(
                "problem",
                "The problem statement",
                "Who faces this problem? What happens today? Why does it matter?",
                true,
              )}
              {field(
                "solution",
                "Your solution & what makes it unique",
                "Explain your approach, how it works, and the difference it could make.",
                true,
              )}
              {field(
                "research",
                "Research & problem validation",
                "What did you learn from interviews, observations, or research? Include sources.",
                true,
              )}
              {field(
                "mvpUrl",
                "MVP / prototype URL",
                "https://your-prototype.com",
              )}
              {field(
                "pitchUrl",
                "Pitch deck / presentation URL",
                "https://your-presentation-link.com",
              )}
              <div className="field field-full">
                <label htmlFor="pitch-upload">
                  Or upload your pitch deck <span>PDF · up to 3 MB</span>
                </label>
                <input
                  id="pitch-upload"
                  className="file-input"
                  type="file"
                  accept="application/pdf"
                  disabled={!submissionOpen || busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadDeck(file);
                  }}
                />
                {submission.deckFileId && (
                  <a
                    className="text-link"
                    style={{ fontSize: 12 }}
                    href={`/api/files/${submission.deckFileId}`}
                  >
                    Download saved pitch deck <Download size={12} />
                  </a>
                )}
              </div>
              {field(
                "aiTools",
                "AI assistance declaration",
                "List the AI tools you used, where you used them, and what you did yourself. Write “None” if you didn’t use AI.",
                true,
              )}
            </div>
            <label className="check-label">
              <input
                type="checkbox"
                checked={submission.aiDeclaration}
                disabled={!submissionOpen}
                onChange={(e) =>
                  setSubmission((prev) => ({
                    ...prev,
                    aiDeclaration: e.target.checked,
                  }))
                }
              />
              <span>
                I understand this product and have accurately declared AI
                assistance, credited sources, and checked the information in my
                submission.
              </span>
            </label>
            <div className="submission-actions">
              <span>
                {submission.updatedAt
                  ? `Last saved: ${formatDate(String(submission.updatedAt))}`
                  : "Save a draft whenever you’re ready."}
              </span>
              <div>
                <LoadingButton
                  className="button button-secondary"
                  busy={busy}
                  disabled={!submissionOpen}
                  onClick={() => save(false)}
                >
                  Save draft
                </LoadingButton>
                <LoadingButton
                  busy={busy}
                  disabled={!submissionOpen}
                  onClick={() => save(true)}
                >
                  {team.submission.final
                    ? "Update final submission"
                    : "Final submission"}
                  <CheckCircle2 size={14} />
                </LoadingButton>
              </div>
            </div>
            <p className="payment-help">
              You can continue editing and updating your final submission until
              the official deadline.
            </p>
          </div>
        </>
      )}
      {tab === "team" && (
        <>
          <div className="dashboard-grid" style={{ marginTop: 0 }}>
            <div className="workspace-card">
              <div className="card-header">
                <h2>{team.name}</h2>
                <span>{team.members.length} / 3 MEMBERS</span>
              </div>
              {team.members.map((m, i) => (
                <div className="team-member" key={m.email}>
                  <span className="avatar">
                    {m.name
                      .split(" ")
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join("")}
                  </span>
                  <div>
                    <h3>{m.name}</h3>
                    <p>{m.email}</p>
                  </div>
                  <small>{i === 0 ? "LEADER" : "MEMBER"}</small>
                </div>
              ))}
              <p className="payment-help">
                {team.department} · WhatsApp: {team.whatsapp}
              </p>
            </div>
            <div className="workspace-card">
              <div className="card-header">
                <h2>Share the adventure.</h2>
                <Link2 size={16} />
              </div>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--foreground)",
                  lineHeight: 1.9,
                }}
              >
                Share your team’s private invitation link with your teammates.
                This link shows only your team name and status.
              </p>
              <div className="link-box">
                <input
                  readOnly
                  aria-label="Team invitation link"
                  value={invite}
                />
                <button
                  aria-label="Copy invitation link"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(invite);
                      setMessage("Team invitation link copied.");
                    } catch {
                      setError("Copy the link from the field above.");
                    }
                  }}
                >
                  <Copy size={14} color="#91a7cb" />
                </button>
              </div>
              <a
                className="text-link"
                style={{ fontSize: 12, marginTop: 18 }}
                href={`https://wa.me/?text=${encodeURIComponent(`We’re building something at BuildFest 2026. Here’s our team ${team.name}: ${invite}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={14} />
                Share on WhatsApp <ArrowUpRight size={12} />
              </a>
            </div>
            <div className="workspace-card span-two">
              <div className="card-header">
                <h2>Registration details</h2>
                <Status status={team.payment.status} />
              </div>
              <dl className="payment-detail-list">
                <div>
                  <dt>REGISTRATION ID</dt>
                  <dd>{team.registrationId}</dd>
                </div>
                <div>
                  <dt>TEAM FEE</dt>
                  <dd>PKR 1,500 · entire team</dd>
                </div>
                <div>
                  <dt>PAYMENT REFERENCE</dt>
                  <dd>{team.payment.reference}</dd>
                </div>
                <div>
                  <dt>REGISTERED ON</dt>
                  <dd>{formatDate(team.createdAt)}</dd>
                </div>
              </dl>
              {confirmed && (
                <Link
                  className="text-link"
                  style={{ fontSize: 12, marginTop: 23 }}
                  href="/dashboard/confirmation"
                >
                  View / print confirmation <Download size={13} />
                </Link>
              )}
              {team.payment.status === "rejected" && (
                <form onSubmit={resubmitPayment} style={{ marginTop: 24 }}>
                  <div className="notice notice-warning">
                    <CreditCard size={17} />
                    <span>{team.payment.note}</span>
                  </div>
                  <div className="form-grid" style={{ marginTop: 22 }}>
                    <div className="field">
                      <label htmlFor="retry-method">
                        Official payment method
                      </label>
                      <select
                        id="retry-method"
                        value={methodId}
                        onChange={(e) => setMethodId(e.target.value)}
                        required
                      >
                        {event.paymentMethods.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label htmlFor="retry-reference">
                        Transaction / reference ID
                      </label>
                      <input
                        id="retry-reference"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        minLength={3}
                        maxLength={100}
                        required
                      />
                    </div>
                    <div className="field field-full">
                      <label htmlFor="retry-receipt">
                        New receipt <span>Optional · up to 3 MB</span>
                      </label>
                      <input
                        id="retry-receipt"
                        className="file-input"
                        type="file"
                        accept="image/png,image/jpeg,application/pdf"
                        onChange={(e) =>
                          setReceipt(e.target.files?.[0] || null)
                        }
                      />
                    </div>
                  </div>
                  <LoadingButton
                    busy={busy}
                    type="submit"
                    style={{ marginTop: 20 }}
                    disabled={!event.paymentMethods.length}
                  >
                    Resubmit for verification <ArrowRight size={14} />
                  </LoadingButton>
                </form>
              )}
            </div>
          </div>
        </>
      )}
      {tab === "resources" && (
        <>
          <div className="resources-grid">
            {[
              {
                icon: BrainCircuit,
                title: "Think with AI.",
                text: "Use ChatGPT to explore ideas, ask better questions, and stress-test your solution. Verify claims with real sources and declare your assistance.",
                link: "https://chatgpt.com",
                cta: "Open ChatGPT",
              },
              {
                icon: FileText,
                title: "Make your idea visible.",
                text: "Use Figma to map your product flow, sketch screens, and make a prototype that explains the experience.",
                link: "https://www.figma.com",
                cta: "Explore Figma",
              },
              {
                icon: Rocket,
                title: "Get to a working MVP.",
                text: "Use v0 to explore an application prototype. Understand the generated code and check that your core features work.",
                link: "https://v0.app",
                cta: "Explore v0",
              },
              {
                icon: Users,
                title: "Talk to real people.",
                text: "Interview people who experience your problem. Ask about their current behavior, what frustrates them, and how they solve it today. Record evidence, not assumptions.",
                link: "",
                cta: "",
              },
              {
                icon: Lightbulb,
                title: "Pitch with a clear story.",
                text: "Start with the problem. Introduce your solution. Show what is unique, share validation, explain the opportunity, and demonstrate the prototype.",
                link: "",
                cta: "",
              },
              {
                icon: ShieldCheck,
                title: "Keep the ground rules close.",
                text: "Review the team rules, deadlines, judging criteria, and AI declaration requirements before your final submission.",
                link: "/rules",
                cta: "Read event rules",
              },
            ].map((r) => (
              <div className="resource-card" key={r.title}>
                <r.icon size={24} />
                <h3>{r.title}</h3>
                <p>{r.text}</p>
                {r.link && (
                  <a
                    className="text-link"
                    href={r.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {r.cta}
                    <ExternalLink size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
          <p className="payment-help">
            Tools are optional and independent of the event. Check each
            provider’s terms and fees. You can use other tools, code from
            scratch, or build with no-code.
          </p>
        </>
      )}
      <FormMessage error={error} message={message} />
    </Workspace>
  );
}
