"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  CheckCircle2,
  Clock3,
  CreditCard,
  Download,
  FileText,
  LayoutDashboard,
  Mail,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  Trophy,
  UserCheck,
  Users,
  Wallet,
  X,
} from "lucide-react";
import {
  api,
  EmptyState,
  FormMessage,
  LoadingButton,
  Status,
  formatDate,
} from "./ui";
import { Workspace } from "./workspace";
import {
  CRITERIA,
  type EventSettings,
  type PublicEvent,
  type SafeTeam,
} from "@/lib/types";

type AdminData = {
  teams: SafeTeam[];
  settings: EventSettings;
  judges: { id: string; name: string; email: string }[];
  scores: {
    teamId: string;
    judgeId: string;
    scores: number[];
    feedback: string;
  }[];
  assignments: { teamId: string; judgeId: string }[];
  audit: {
    id: string;
    action: string;
    before?: string;
    after?: string;
    note?: string;
    teamId?: string;
    date: string;
  }[];
  mail: { configured: boolean; statuses: { _id: string; count: number }[] };
};
const localDate = (iso: string) =>
  iso
    ? new Date(new Date(iso).getTime() + 5 * 3600_000)
        .toISOString()
        .slice(0, 16)
    : "";
const utcDate = (local: string) =>
  local ? new Date(local + ":00+05:00").toISOString() : "";

export function Admin({ name, event }: { name: string; event: PublicEvent }) {
  const [tab, setTab] = useState("overview");
  const [data, setData] = useState<AdminData | null>(null);
  const [settings, setSettings] = useState<EventSettings | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<SafeTeam | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [verified, setVerified] = useState<Record<string, boolean>>({});
  const [announcements, setAnnouncements] = useState(event.announcements);
  const [announcement, setAnnouncement] = useState({ title: "", message: "" });
  const [judge, setJudge] = useState({ name: "", email: "", password: "" });
  const [approved, setApproved] = useState(false);
  const [scoreEdit, setScoreEdit] = useState<{
    teamId: string;
    judgeId: string;
    scores: number[];
    feedback: string;
  } | null>(null);
  const load = async () => {
    setError("");
    try {
      const r = await api<AdminData>("/api/admin");
      setData(r);
      setSettings(r.settings);
      setSelected((prev) =>
        prev ? r.teams.find((t) => t.id === prev.id) || null : null,
      );
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to load organizer data.",
      );
    }
  };
  useEffect(() => {
    api<AdminData>("/api/admin")
      .then((r) => {
        setData(r);
        setSettings(r.settings);
      })
      .catch((e) =>
        setError(
          e instanceof Error ? e.message : "Unable to load organizer data.",
        ),
      );
  }, []);
  const action = async (
    url: string,
    body: unknown,
    method = "POST",
    reload = true,
  ) => {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await api<{ message?: string }>(url, method, body);
      setMessage(r.message || "Saved.");
      if (reload) await load();
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };
  const teams = data?.teams || [];
  const pending = teams.filter((t) => t.payment.status === "pending");
  const confirmed = teams.filter((t) => t.payment.status === "confirmed");
  const final = confirmed.filter((t) => t.submission.final);
  const visible = teams.filter(
    (t) =>
      (filter === "all" || t.payment.status === filter) &&
      `${t.name} ${t.registrationId} ${t.members.map((m) => `${m.name} ${m.email}`).join(" ")} ${t.payment.reference}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const set = (
    key: keyof EventSettings,
    value: EventSettings[keyof EventSettings],
  ) => setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  const paymentReview = (team: SafeTeam) => (
    <div className="workspace-card payment-review-card" key={team.id}>
      <div className="payment-review-heading">
        <div>
          <h3>{team.name}</h3>
          <small>
            {team.registrationId} · {team.members[0].email}
          </small>
        </div>
        <Status status={team.payment.status} />
      </div>
      <dl className="payment-detail-list">
        <div>
          <dt>AMOUNT</dt>
          <dd>PKR {team.payment.amount.toLocaleString()}</dd>
        </div>
        <div>
          <dt>PAYMENT METHOD</dt>
          <dd>
            {settings?.paymentMethods.find(
              (m) => m.id === team.payment.methodId,
            )?.name || team.payment.methodId}
          </dd>
        </div>
        <div>
          <dt>REFERENCE</dt>
          <dd>{team.payment.reference}</dd>
        </div>
        <div>
          <dt>SUBMITTED</dt>
          <dd>{formatDate(team.payment.submittedAt)}</dd>
        </div>
      </dl>
      {team.payment.receiptId ? (
        <a
          className="text-link"
          style={{ fontSize: 12 }}
          href={`/api/files/${team.payment.receiptId}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Download private receipt <Download size={13} />
        </a>
      ) : (
        <p style={{ fontSize: 12, color: "var(--foreground)" }}>
          No receipt attached. Verify the transaction in the receiving account.
        </p>
      )}
      {team.payment.status === "pending" && (
        <>
          <label className="check-label">
            <input
              type="checkbox"
              checked={!!verified[team.id]}
              onChange={(e) =>
                setVerified((prev) => ({
                  ...prev,
                  [team.id]: e.target.checked,
                }))
              }
            />
            <span>
              I have verified this PKR 1,500 transaction in the official
              receiving account.
            </span>
          </label>
          <div className="payment-review-actions">
            <input
              aria-label={`Review note for ${team.name}`}
              placeholder="Review note (required when rejecting)"
              value={notes[team.id] || ""}
              maxLength={1000}
              onChange={(e) =>
                setNotes((prev) => ({ ...prev, [team.id]: e.target.value }))
              }
            />
            <LoadingButton
              busy={busy}
              disabled={!verified[team.id]}
              className="button button-primary"
              onClick={() =>
                action("/api/admin/payments", {
                  teamId: team.id,
                  status: "confirmed",
                  note:
                    notes[team.id] ||
                    "Payment verified in the official receiving account.",
                })
              }
            >
              <Check size={13} />
              Verify
            </LoadingButton>
            <LoadingButton
              busy={busy}
              className="button button-danger"
              onClick={() =>
                action("/api/admin/payments", {
                  teamId: team.id,
                  status: "rejected",
                  note: notes[team.id] || "",
                })
              }
            >
              Reject
            </LoadingButton>
          </div>
        </>
      )}
      {team.payment.note && (
        <p className="payment-help">Review note: {team.payment.note}</p>
      )}
    </div>
  );
  const table = (
    <div className="workspace-card">
      <div className="table-toolbar">
        <input
          aria-label="Search teams"
          placeholder="Search teams, emails, IDs, references…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter registration status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All registrations</option>
          <option value="pending">Payment pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      {teams.length ? (
        <>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TEAM</th>
                  <th>TEAM LEADER</th>
                  <th>SIZE</th>
                  <th>PAYMENT</th>
                  <th>PROJECT</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong>
                      <small>{t.registrationId}</small>
                    </td>
                    <td>
                      {t.members[0].name}
                      <small>{t.members[0].email}</small>
                    </td>
                    <td>{t.members.length}</td>
                    <td>
                      <Status status={t.payment.status} />
                    </td>
                    <td>
                      <Status status={t.submission.final ? "final" : "draft"} />
                    </td>
                    <td>
                      <button onClick={() => setSelected(t)}>
                        View <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="table-footer">
            Showing {visible.length} of {teams.length} registrations. Each
            participant, team name, and payment reference can belong to only one
            registration.
          </p>
        </>
      ) : (
        <EmptyState
          icon={<Users size={20} />}
          title="Your first team is on the way."
        >
          Real registrations will appear here once registration opens.
        </EmptyState>
      )}
    </div>
  );
  const configField = (
    key:
      | "eventDate"
      | "registrationDeadline"
      | "submissionDeadline"
      | "supportEmail"
      | "supportWhatsApp",
    label: string,
    type = "text",
  ) => (
    <div className="field">
      <label htmlFor={`setting-${key}`}>{label}</label>
      <input
        id={`setting-${key}`}
        type={type}
        value={
          type === "datetime-local" ? localDate(settings![key]) : settings![key]
        }
        onChange={(e) =>
          set(
            key,
            type === "datetime-local"
              ? utcDate(e.target.value)
              : e.target.value,
          )
        }
        maxLength={254}
      />
    </div>
  );
  return (
    <Workspace
      title="ORGANIZER WORKSPACE"
      name={name}
      active={tab}
      onTab={(s) => {
        setTab(s);
        setError("");
        setMessage("");
        setSelected(null);
      }}
      tabs={[
        { id: "overview", title: "Event overview", icon: LayoutDashboard },
        { id: "registrations", title: "Registrations", icon: Users },
        {
          id: "payments",
          title: "Payment reviews",
          icon: CreditCard,
          count: pending.length,
        },
        { id: "projects", title: "Projects & judging", icon: FileText },
        { id: "settings", title: "Event configuration", icon: Settings2 },
        { id: "announcements", title: "Announcements", icon: Bell },
        { id: "audit", title: "Audit & email", icon: ShieldCheck },
      ]}
    >
      <div className="workspace-heading">
        <div>
          <h1>
            {
              {
                overview: "A big idea. Under control.",
                registrations: "Meet your innovators.",
                payments: "Every payment, verified.",
                projects: "The ideas taking shape.",
                settings: "Make it official.",
                announcements: "Keep everyone in the loop.",
                audit: "A clear record of every step.",
              }[tab]
            }
          </h1>
          <p>GUtech Entrepreneurship Society · BuildFest 2026</p>
        </div>
        <div style={{ display: "flex", gap: 9 }}>
          <button
            className="icon-button"
            aria-label="Refresh organizer data"
            onClick={load}
            disabled={busy}
          >
            <RefreshCw size={15} className={busy ? "spin" : ""} />
          </button>
          <a
            className="button button-secondary button-small"
            href="/api/admin/export"
          >
            <Download size={13} />
            Export CSV
          </a>
        </div>
      </div>
      <FormMessage error={error} message={message} />
      {!data && (
        <EmptyState
          icon={<Clock3 size={20} />}
          title={busy ? "Loading your event…" : "Unable to load event data."}
        >
          Your organizer workspace is connecting to the event records.
        </EmptyState>
      )}
      {data && tab === "overview" && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div>
                <span>REGISTERED TEAMS</span>
                <Users size={17} />
              </div>
              <strong>{teams.length}</strong>
              <small>
                {teams.reduce((s, t) => s + t.members.length, 0)} registered
                participants
              </small>
            </div>
            <div className="stat-card">
              <div>
                <span>CONFIRMED TEAMS</span>
                <UserCheck size={17} />
              </div>
              <strong>{confirmed.length}</strong>
              <small>Payment verified by organizers</small>
            </div>
            <div className="stat-card">
              <div>
                <span>AWAITING REVIEW</span>
                <Clock3 size={17} />
              </div>
              <strong>{pending.length}</strong>
              <small>Manual payment verification</small>
            </div>
            <div className="stat-card">
              <div>
                <span>VERIFIED REVENUE</span>
                <Wallet size={17} />
              </div>
              <strong>
                <span style={{ fontSize: 12, letterSpacing: 0 }}>PKR </span>
                {confirmed
                  .reduce((s, t) => s + t.payment.amount, 0)
                  .toLocaleString()}
              </strong>
              <small>Only verified team payments</small>
            </div>
          </div>
          <div className="welcome-card" style={{ marginBottom: 24 }}>
            <div>
              <small>OFFICIAL EVENT CONFIGURATION</small>
              <h2>
                {settings?.registrationOpen
                  ? "Registration is enabled."
                  : "Your event is getting ready."}
              </h2>
              <p>
                {settings?.registrationOpen
                  ? "Registration closes automatically at the official deadline. Keep payment reviews and announcements up to date."
                  : "Set official dates, payment instructions, support details, and a refund policy. Then enable registration in Event configuration."}
              </p>
              <button
                className="text-link"
                style={{ fontSize: 12, marginTop: 15 }}
                onClick={() => setTab("settings")}
              >
                Manage event configuration <ArrowUpRight size={12} />
              </button>
            </div>
            <Sparkles />
          </div>
          {table}
        </>
      )}
      {data && tab === "registrations" && table}
      {data && tab === "payments" && (
        <>
          <div className="notice">
            <ShieldCheck size={17} />
            <span>
              Check the payment reference against your bank, Easypaisa, or
              JazzCash account before verifying. A receipt alone is not proof of
              funds received.
            </span>
          </div>
          {pending.length ? (
            pending.map(paymentReview)
          ) : (
            <div className="workspace-card" style={{ marginTop: 20 }}>
              <EmptyState
                icon={<CheckCircle2 size={21} />}
                title="All caught up."
              >
                There are no pending payments to review.
              </EmptyState>
            </div>
          )}
        </>
      )}
      {selected && (
        <div className="workspace-card" style={{ marginTop: 22 }}>
          <div className="card-header">
            <h2>{selected.name} · team details</h2>
            <button
              className="icon-button"
              aria-label="Close team details"
              onClick={() => setSelected(null)}
            >
              <X size={15} />
            </button>
          </div>
          {selected.members.map((m, i) => (
            <div className="team-member" key={m.email}>
              <span className="avatar">{m.name[0]}</span>
              <div>
                <h3>{m.name}</h3>
                <p>{m.email}</p>
              </div>
              <small>{i === 0 ? "LEADER" : "MEMBER"}</small>
            </div>
          ))}
          <p className="payment-help">
            {selected.department} · WhatsApp {selected.whatsapp}
          </p>
          {paymentReview(selected)}
          <div className="project-preview">
            <h3>{selected.submission.title || "Project not submitted yet"}</h3>
            {selected.submission.problem && (
              <>
                <h3>Problem</h3>
                <p>{selected.submission.problem}</p>
                <h3>Solution</h3>
                <p>{selected.submission.solution}</p>
                <h3>Research & validation</h3>
                <p>{selected.submission.research}</p>
                <h3>AI declaration</h3>
                <p>{selected.submission.aiTools || "No declaration saved"}</p>
              </>
            )}
            {selected.submission.mvpUrl && (
              <a
                className="text-link"
                href={selected.submission.mvpUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Prototype <ArrowUpRight size={12} />
              </a>
            )}
            {selected.submission.pitchUrl && (
              <a
                className="text-link"
                href={selected.submission.pitchUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Pitch link <ArrowUpRight size={12} />
              </a>
            )}
            {selected.submission.deckFileId && (
              <a
                className="text-link"
                href={`/api/files/${selected.submission.deckFileId}`}
              >
                Pitch deck <Download size={12} />
              </a>
            )}
          </div>
        </div>
      )}
      {data && tab === "settings" && settings && (
        <>
          <div className="settings-grid">
            <div className="workspace-card">
              <h2>Dates & deadlines</h2>
              <p>
                All dates are entered in Pakistan Standard Time (UTC +05:00).
              </p>
              {configField("eventDate", "Event date & time", "datetime-local")}
              {configField(
                "registrationDeadline",
                "Registration closing deadline",
                "datetime-local",
              )}
              {configField(
                "submissionDeadline",
                "Project submission deadline",
                "datetime-local",
              )}
              <h3 style={{ marginTop: 25 }}>Timeline phase dates · optional</h3>
              {[
                "Register your team",
                "Discover a problem",
                "Build your solution",
                "Pitch your innovation",
                "Win & get recognized",
              ].map((label, i) => (
                <div className="field" key={i}>
                  <label htmlFor={`phase-${i}`}>
                    0{i + 1} · {label}
                  </label>
                  <input
                    id={`phase-${i}`}
                    type="datetime-local"
                    value={localDate(settings.phaseDates[i])}
                    onChange={(e) =>
                      set(
                        "phaseDates",
                        settings.phaseDates.map((d, j) =>
                          i === j ? utcDate(e.target.value) : d,
                        ),
                      )
                    }
                  />
                </div>
              ))}
            </div>
            <div className="workspace-card">
              <h2>Official support & policy</h2>
              <p>
                Support and refund information must be available before
                registration opens.
              </p>
              {configField("supportEmail", "Official support email", "email")}
              {configField("supportWhatsApp", "Official WhatsApp number")}
              <div className="field">
                <label htmlFor="refund-policy">Official refund policy</label>
                <textarea
                  id="refund-policy"
                  value={settings.refundPolicy}
                  maxLength={4000}
                  placeholder="Enter the organizer-approved refund terms."
                  onChange={(e) => set("refundPolicy", e.target.value)}
                />
              </div>
              <h3 style={{ marginTop: 27 }}>Official partner logos</h3>
              <p
                style={{
                  fontSize: 12,
                  color: "var(--foreground)",
                  lineHeight: 1.8,
                }}
              >
                Upload organizer-approved PNG or JPEG logos. They are stored in
                MongoDB. Text attribution is used until official logos are
                supplied.
              </p>
              {["organizerLogoId", "partnerLogoId"].map((key, i) => (
                <div className="field" key={key}>
                  <label htmlFor={`logo-${i}`}>
                    {i === 0 ? "GUtech Entrepreneurship Society" : "ArtDera"}
                  </label>
                  <input
                    id={`logo-${i}`}
                    className="file-input"
                    type="file"
                    accept="image/png,image/jpeg"
                    disabled={busy}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setBusy(true);
                      setError("");
                      try {
                        const form = new FormData();
                        form.append("file", file);
                        form.append("purpose", "logo");
                        form.append("target", key);
                        const r = await api<{ message: string }>(
                          "/api/files",
                          "POST",
                          form,
                        );
                        setMessage(r.message);
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : "Upload failed.",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="workspace-card span-two">
              <h2>Official payment methods</h2>
              <p>
                Manual transfer workflow · PKR 1,500 per team. Only enabled
                methods appear publicly. No payment gateway is connected.
              </p>
              {settings.paymentMethods.map((m, i) => (
                <div className="settings-method" key={m.id}>
                  <div>
                    <span>METHOD 0{i + 1}</span>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${m.name || "payment method"}`}
                      onClick={() =>
                        set(
                          "paymentMethods",
                          settings.paymentMethods.filter((_, j) => i !== j),
                        )
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="form-grid" style={{ marginTop: 16 }}>
                    {(
                      [
                        "name",
                        "accountTitle",
                        "accountNumber",
                        "instructions",
                      ] as const
                    ).map((key) => (
                      <div
                        className={`field ${key === "instructions" ? "field-full" : ""}`}
                        key={key}
                      >
                        <label htmlFor={`method-${i}-${key}`}>
                          {
                            {
                              name: "Method name (e.g. Bank transfer)",
                              accountTitle: "Official account title",
                              accountNumber: "Account / IBAN / mobile number",
                              instructions: "Transfer instructions",
                            }[key]
                          }
                        </label>
                        <input
                          id={`method-${i}-${key}`}
                          value={m[key]}
                          maxLength={key === "instructions" ? 2000 : 120}
                          onChange={(e) =>
                            set(
                              "paymentMethods",
                              settings.paymentMethods.map((p, j) =>
                                j === i ? { ...p, [key]: e.target.value } : p,
                              ),
                            )
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={(e) =>
                        set(
                          "paymentMethods",
                          settings.paymentMethods.map((p, j) =>
                            j === i ? { ...p, enabled: e.target.checked } : p,
                          ),
                        )
                      }
                    />
                    Enable this official payment method
                  </label>
                </div>
              ))}
              <button
                className="setting-add"
                onClick={() =>
                  set("paymentMethods", [
                    ...settings.paymentMethods,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      accountTitle: "",
                      accountNumber: "",
                      instructions: "",
                      enabled: false,
                    },
                  ])
                }
              >
                <Plus size={13} />
                Add payment method
              </button>
            </div>
            <div className="workspace-card">
              <h2>Verified prizes & awards</h2>
              <p>
                Only awards marked verified are shown on the public website.
              </p>
              {settings.prizes.map((p, i) => (
                <div className="settings-prize" key={p.id}>
                  <div>
                    <span>AWARD 0{i + 1}</span>
                    <button
                      className="icon-button"
                      aria-label="Remove award"
                      onClick={() =>
                        set(
                          "prizes",
                          settings.prizes.filter((_, j) => j !== i),
                        )
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="field">
                    <label htmlFor={`prize-${i}`}>Prize / award title</label>
                    <input
                      id={`prize-${i}`}
                      value={p.title}
                      maxLength={100}
                      onChange={(e) =>
                        set(
                          "prizes",
                          settings.prizes.map((v, j) =>
                            j === i ? { ...v, title: e.target.value } : v,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`prize-description-${i}`}>
                      Confirmed description & value
                    </label>
                    <textarea
                      id={`prize-description-${i}`}
                      value={p.description}
                      maxLength={1000}
                      onChange={(e) =>
                        set(
                          "prizes",
                          settings.prizes.map((v, j) =>
                            j === i ? { ...v, description: e.target.value } : v,
                          ),
                        )
                      }
                    />
                  </div>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={p.verified}
                      onChange={(e) =>
                        set(
                          "prizes",
                          settings.prizes.map((v, j) =>
                            j === i ? { ...v, verified: e.target.checked } : v,
                          ),
                        )
                      }
                    />
                    Verified by the organizer
                  </label>
                </div>
              ))}
              <button
                className="setting-add"
                onClick={() =>
                  set("prizes", [
                    ...settings.prizes,
                    {
                      id: crypto.randomUUID(),
                      title: "",
                      description: "",
                      verified: false,
                    },
                  ])
                }
              >
                <Plus size={13} />
                Add confirmed prize
              </button>
            </div>
            <div className="workspace-card">
              <h2>Mentors & judges</h2>
              <p>
                Public profiles appear only when organizer verification is
                checked.
              </p>
              {settings.people.map((p, i) => (
                <div className="settings-person" key={p.id}>
                  <div>
                    <span>PROFILE 0{i + 1}</span>
                    <button
                      className="icon-button"
                      aria-label="Remove profile"
                      onClick={() =>
                        set(
                          "people",
                          settings.people.filter((_, j) => j !== i),
                        )
                      }
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="field">
                    <label htmlFor={`person-name-${i}`}>Full name</label>
                    <input
                      id={`person-name-${i}`}
                      value={p.name}
                      maxLength={100}
                      onChange={(e) =>
                        set(
                          "people",
                          settings.people.map((v, j) =>
                            j === i ? { ...v, name: e.target.value } : v,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`person-title-${i}`}>
                      Title / organization
                    </label>
                    <input
                      id={`person-title-${i}`}
                      value={p.title}
                      maxLength={200}
                      onChange={(e) =>
                        set(
                          "people",
                          settings.people.map((v, j) =>
                            j === i ? { ...v, title: e.target.value } : v,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="field">
                    <label htmlFor={`person-kind-${i}`}>Role</label>
                    <select
                      id={`person-kind-${i}`}
                      value={p.kind}
                      onChange={(e) =>
                        set(
                          "people",
                          settings.people.map((v, j) =>
                            j === i
                              ? {
                                  ...v,
                                  kind: e.target.value as "mentor" | "judge",
                                }
                              : v,
                          ),
                        )
                      }
                    >
                      <option value="mentor">Mentor</option>
                      <option value="judge">Judge</option>
                    </select>
                  </div>
                  <label className="check-label">
                    <input
                      type="checkbox"
                      checked={p.verified}
                      onChange={(e) =>
                        set(
                          "people",
                          settings.people.map((v, j) =>
                            j === i ? { ...v, verified: e.target.checked } : v,
                          ),
                        )
                      }
                    />
                    Verified by the organizer
                  </label>
                </div>
              ))}
              <button
                className="setting-add"
                onClick={() =>
                  set("people", [
                    ...settings.people,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      title: "",
                      kind: "mentor",
                      verified: false,
                    },
                  ])
                }
              >
                <Plus size={13} />
                Add profile
              </button>
            </div>
          </div>
          <div className="settings-actions">
            <label className="check-label">
              <input
                type="checkbox"
                checked={settings.registrationOpen}
                onChange={(e) => set("registrationOpen", e.target.checked)}
              />
              Enable team registration
            </label>
            <span>Save official details before opening signups.</span>
            <LoadingButton
              busy={busy}
              onClick={() => action("/api/admin/settings", settings, "PUT")}
            >
              Save configuration <Check size={14} />
            </LoadingButton>
          </div>
        </>
      )}
      {data && tab === "announcements" && (
        <div className="dashboard-grid" style={{ marginTop: 0 }}>
          <form
            className="workspace-card"
            onSubmit={async (e: FormEvent) => {
              e.preventDefault();
              if (await action("/api/admin/announcements", announcement)) {
                setAnnouncement({ title: "", message: "" });
                const r = await api<PublicEvent>("/api/event");
                setAnnouncements(r.announcements);
              }
            }}
          >
            <div className="card-header">
              <h2>Publish an update</h2>
              <Bell size={16} />
            </div>
            <div className="field">
              <label htmlFor="announcement-title">Title</label>
              <input
                id="announcement-title"
                value={announcement.title}
                minLength={3}
                maxLength={150}
                required
                onChange={(e) =>
                  setAnnouncement((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
              />
            </div>
            <div className="field" style={{ marginTop: 19 }}>
              <label htmlFor="announcement-message">Message</label>
              <textarea
                id="announcement-message"
                value={announcement.message}
                minLength={5}
                maxLength={3000}
                required
                onChange={(e) =>
                  setAnnouncement((prev) => ({
                    ...prev,
                    message: e.target.value,
                  }))
                }
              />
            </div>
            <LoadingButton busy={busy} type="submit" style={{ marginTop: 20 }}>
              Publish announcement <ArrowUpRight size={14} />
            </LoadingButton>
          </form>
          <div className="workspace-card">
            <div className="card-header">
              <h2>Published announcements</h2>
              <span>{announcements.length} UPDATES</span>
            </div>
            {announcements.length ? (
              announcements.map((a) => (
                <div className="announcement-item" key={a.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <h3>{a.title}</h3>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${a.title}`}
                      onClick={async () => {
                        if (
                          await action(
                            "/api/admin/announcements",
                            { id: a.id },
                            "DELETE",
                          )
                        )
                          setAnnouncements((prev) =>
                            prev.filter((v) => v.id !== a.id),
                          );
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <small>{formatDate(a.date)}</small>
                  <p>{a.message}</p>
                </div>
              ))
            ) : (
              <EmptyState icon={<Bell size={19} />} title="The mic is yours.">
                Publish official updates for participants and visitors.
              </EmptyState>
            )}
          </div>
        </div>
      )}
      {data && tab === "projects" && (
        <>
          <div
            className="stats-grid"
            style={{ gridTemplateColumns: "repeat(3,1fr)" }}
          >
            <div className="stat-card">
              <div>
                FINAL PROJECTS
                <FileText size={16} />
              </div>
              <strong>{final.length}</strong>
              <small>Confirmed teams with final submissions</small>
            </div>
            <div className="stat-card">
              <div>
                ACTIVE JUDGES
                <UserCheck size={16} />
              </div>
              <strong>{data.judges.length}</strong>
              <small>Secure judge accounts</small>
            </div>
            <div className="stat-card">
              <div>
                SCORECARDS
                <Trophy size={16} />
              </div>
              <strong>{data.scores.length}</strong>
              <small>100-point judging rubric</small>
            </div>
          </div>
          <div className="workspace-card">
            <div className="card-header">
              <h2>Projects & judge assignments</h2>
              <span>{confirmed.length} CONFIRMED TEAMS</span>
            </div>
            {confirmed.length ? (
              confirmed.map((t) => (
                <div className="judge-assignment" key={t.id}>
                  <div>
                    <h3>
                      {t.name} {t.submission.title && `· ${t.submission.title}`}
                    </h3>
                    <p>
                      {t.submission.final
                        ? "FINAL SUBMISSION"
                        : "DRAFT / NOT SUBMITTED"}{" "}
                      · {t.registrationId}
                    </p>
                    <button
                      className="text-link"
                      style={{ fontSize: 12, marginTop: 8 }}
                      onClick={() => setSelected(t)}
                    >
                      View project <ArrowUpRight size={10} />
                    </button>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        marginTop: 8,
                        flexWrap: "wrap",
                      }}
                    >
                      {data.assignments
                        .filter((a) => a.teamId === t.id)
                        .map((a) => {
                          const j = data.judges.find((j) => j.id === a.judgeId);
                          const score = data.scores.find(
                            (s) => s.teamId === t.id && s.judgeId === a.judgeId,
                          );
                          return (
                            <button
                              key={a.judgeId}
                              style={{
                                fontSize: 12,
                                color: "var(--foreground)",
                                border: "1px solid #e3ebf7",
                                borderRadius: 4,
                                padding: "4px 6px",
                              }}
                              onClick={() =>
                                setScoreEdit(
                                  score || {
                                    teamId: t.id,
                                    judgeId: a.judgeId,
                                    scores: [0, 0, 0, 0, 0, 0],
                                    feedback: "",
                                  },
                                )
                              }
                            >
                              {j?.name} ·{" "}
                              {score
                                ? `${score.scores.reduce((a, b) => a + b, 0)}/100`
                                : "Awaiting score"}{" "}
                              ↗
                            </button>
                          );
                        })}
                    </div>
                  </div>
                  <select
                    aria-label={`Assign judge to ${t.name}`}
                    value=""
                    disabled={busy || settings?.resultsPublished}
                    onChange={(e) => {
                      if (e.target.value)
                        action(
                          "/api/admin/judges",
                          {
                            teamId: t.id,
                            judgeId: e.target.value,
                            assigned: true,
                          },
                          "PUT",
                        );
                    }}
                  >
                    <option value="">Assign a judge…</option>
                    {data.judges
                      .filter(
                        (j) =>
                          !data.assignments.some(
                            (a) => a.teamId === t.id && a.judgeId === j.id,
                          ),
                      )
                      .map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name}
                        </option>
                      ))}
                  </select>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<FileText size={21} />}
                title="The ideas are on their way."
              >
                Confirmed teams and their projects will appear here.
              </EmptyState>
            )}
          </div>
          {scoreEdit && (
            <div className="workspace-card" style={{ marginTop: 22 }}>
              <div className="card-header">
                <h2>
                  Scorecard ·{" "}
                  {teams.find((t) => t.id === scoreEdit.teamId)?.name} ·{" "}
                  {data.judges.find((j) => j.id === scoreEdit.judgeId)?.name}
                </h2>
                <button
                  className="icon-button"
                  aria-label="Close scorecard"
                  onClick={() => setScoreEdit(null)}
                >
                  <X size={14} />
                </button>
              </div>
              {CRITERIA.map((c, i) => (
                <div className="score-input" key={c.name}>
                  <label htmlFor={`admin-score-${i}`}>{c.name}</label>
                  <div>
                    <input
                      id={`admin-score-${i}`}
                      type="number"
                      min={0}
                      max={c.points}
                      value={scoreEdit.scores[i]}
                      disabled={settings?.resultsPublished}
                      onChange={(e) =>
                        setScoreEdit((prev) =>
                          prev
                            ? {
                                ...prev,
                                scores: prev.scores.map((v, j) =>
                                  j === i ? Number(e.target.value) : v,
                                ),
                              }
                            : prev,
                        )
                      }
                    />
                    <span>/ {c.points}</span>
                  </div>
                </div>
              ))}
              <div className="field" style={{ marginTop: 20 }}>
                <label htmlFor="score-feedback">
                  Feedback / correction note
                </label>
                <textarea
                  id="score-feedback"
                  value={scoreEdit.feedback}
                  onChange={(e) =>
                    setScoreEdit((prev) =>
                      prev ? { ...prev, feedback: e.target.value } : prev,
                    )
                  }
                  maxLength={3000}
                  disabled={settings?.resultsPublished}
                />
              </div>
              <div className="payment-review-actions">
                <LoadingButton
                  busy={busy}
                  disabled={settings?.resultsPublished}
                  onClick={() => action("/api/admin/scores", scoreEdit, "PUT")}
                >
                  Save audited correction
                </LoadingButton>
                <LoadingButton
                  busy={busy}
                  disabled={settings?.resultsPublished}
                  className="button button-secondary"
                  onClick={async () => {
                    if (
                      await action(
                        "/api/admin/judges",
                        {
                          teamId: scoreEdit.teamId,
                          judgeId: scoreEdit.judgeId,
                          assigned: false,
                        },
                        "PUT",
                      )
                    )
                      setScoreEdit(null);
                  }}
                >
                  Remove assignment
                </LoadingButton>
              </div>
            </div>
          )}
          <div className="dashboard-grid">
            <form
              className="workspace-card"
              onSubmit={async (e: FormEvent) => {
                e.preventDefault();
                if (await action("/api/admin/judges", judge)) {
                  setJudge({ name: "", email: "", password: "" });
                }
              }}
            >
              <div className="card-header">
                <h2>Create a judge account</h2>
                <ShieldCheck size={16} />
              </div>
              {(["name", "email", "password"] as const).map((key) => (
                <div className="field" key={key} style={{ marginTop: 16 }}>
                  <label htmlFor={`judge-${key}`}>
                    {key === "name"
                      ? "Full name"
                      : key === "email"
                        ? "Email address"
                        : "Temporary password · 12+ characters"}
                  </label>
                  <input
                    id={`judge-${key}`}
                    type={key === "name" ? "text" : key}
                    value={judge[key]}
                    required
                    minLength={key === "password" ? 12 : 2}
                    maxLength={key === "email" ? 254 : 128}
                    autoComplete={key === "password" ? "new-password" : "off"}
                    onChange={(e) =>
                      setJudge((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <LoadingButton busy={busy} style={{ marginTop: 21 }}>
                Create judge account <Plus size={14} />
              </LoadingButton>
              <p className="payment-help">
                Share credentials privately. Judge accounts see only their
                assigned projects.
              </p>
            </form>
            <div className="workspace-card">
              <div className="card-header">
                <h2>Publish approved results</h2>
                <Trophy size={16} />
              </div>
              <p
                style={{
                  fontSize: 12,
                  lineHeight: 1.9,
                  color: "var(--foreground)",
                }}
              >
                Results use the average total from all assigned judges. Every
                final project must have at least one judge and all assigned
                scorecards complete. Equal scores share the same rank.
              </p>
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={approved}
                  onChange={(e) => setApproved(e.target.checked)}
                />
                I have reviewed the scoring and approve{" "}
                {settings?.resultsPublished ? "unpublishing" : "publishing"}{" "}
                these results.
              </label>
              <LoadingButton
                busy={busy}
                disabled={!approved}
                style={{ marginTop: 20 }}
                onClick={() =>
                  action("/api/admin/results", {
                    publish: !settings?.resultsPublished,
                    approved: true,
                  })
                }
              >
                {settings?.resultsPublished
                  ? "Unpublish results"
                  : "Publish approved results"}
                <ArrowUpRight size={14} />
              </LoadingButton>
              <p className="payment-help">
                Published results lock judge scoring and assignments until
                results are unpublished.
              </p>
            </div>
          </div>
        </>
      )}
      {data && tab === "audit" && (
        <>
          <div className="workspace-card">
            <div className="card-header">
              <h2>Confirmation email delivery</h2>
              <Mail size={16} />
            </div>
            <div className="notice">
              <Mail size={17} />
              <span>
                {data.mail.configured
                  ? "Official SMTP is configured. Confirmation emails are queued only after payment verification."
                  : "Email delivery is awaiting official SMTP credentials. Confirmations are queued and clearly marked unconfigured; no emails are claimed as sent."}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 24,
                marginTop: 22,
                flexWrap: "wrap",
              }}
            >
              {data.mail.statuses.map((s) => (
                <span
                  key={s._id}
                  style={{ fontSize: 12, color: "var(--foreground)" }}
                >
                  {s._id}: <strong>{s.count}</strong>
                </span>
              ))}
            </div>
            <LoadingButton
              className="button button-secondary"
              busy={busy}
              disabled={!data.mail.configured}
              style={{ marginTop: 23 }}
              onClick={async () => {
                setBusy(true);
                try {
                  const r = await api<{ sent: number }>(
                    "/api/admin/email",
                    "POST",
                  );
                  setMessage(`${r.sent} confirmation emails sent.`);
                  await load();
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Email dispatch failed.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              Retry pending delivery <RefreshCw size={13} />
            </LoadingButton>
          </div>
          <div className="workspace-card" style={{ marginTop: 20 }}>
            <div className="card-header">
              <h2>Audit trail</h2>
              <span>LATEST 100 EVENTS</span>
            </div>
            {data.audit.length ? (
              data.audit.map((a) => (
                <div className="audit-item" key={a.id}>
                  <div>
                    <strong>{a.action.replaceAll("_", " ")}</strong>
                    <p>
                      {a.before && `${a.before} → `}
                      {a.after}
                      {a.note && ` · ${a.note}`}
                      {a.teamId &&
                        ` · ${teams.find((t) => t.id === a.teamId)?.registrationId || a.teamId}`}
                    </p>
                  </div>
                  <span>{formatDate(a.date)}</span>
                </div>
              ))
            ) : (
              <EmptyState
                icon={<ShieldCheck size={19} />}
                title="A clean start."
              >
                Payment reviews and organizer changes are recorded here.
              </EmptyState>
            )}
          </div>
        </>
      )}
    </Workspace>
  );
}
