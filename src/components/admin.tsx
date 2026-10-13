"use client";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  Bell,
  Check,
  Clock3,
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
  MessageCircle,
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
import {
  REGISTRATION_LABELS,
  REGISTRATION_STATUSES,
  whatsappContactUrl,
  type RegistrationStatus,
} from "@/lib/registration";
import { Workspace } from "./workspace";
import {
  CRITERIA,
  type EventSettings,
  type PublicEvent,
  type SafeTeam,
} from "@/lib/types";

type AdminTeam = SafeTeam & { internalNotes: string; whatsappConsent: boolean };
type AdminData = {
  teams: AdminTeam[];
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
  const [selected, setSelected] = useState<AdminTeam | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, RegistrationStatus>>(
    {},
  );
  const [reviewBaselines, setReviewBaselines] = useState<
    Record<string, { status: RegistrationStatus; notes: string }>
  >({});
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
    let cancelled = false;
    const refresh = async (initial = false) => {
      try {
        const result = await api<AdminData>("/api/admin");
        if (cancelled) return;
        setData(result);
        if (initial) setSettings(result.settings);
        setSelected((prev) =>
          prev ? result.teams.find((t) => t.id === prev.id) || null : null,
        );
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Unable to load organizer data.",
          );
      }
    };
    void refresh(true);
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") void refresh();
    }, 10000);
    const focus = () => {
      void refresh();
    };
    window.addEventListener("focus", focus);
    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener("focus", focus);
    };
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
  const pending = teams.filter((t) => t.registrationStatus === "new");
  const confirmed = teams.filter((t) => t.registrationStatus === "confirmed");
  const final = confirmed.filter((t) => t.submission.final);
  const visible = teams.filter(
    (t) =>
      (filter === "all" || t.registrationStatus === filter) &&
      `${t.name} ${t.registrationId} ${t.members.map((m) => `${m.name} ${m.email}`).join(" ")} ${t.whatsapp} ${t.department} ${t.internalNotes}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const set = (
    key: keyof EventSettings,
    value: EventSettings[keyof EventSettings],
  ) => setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  const contactButton = (team: AdminTeam) => {
    const href = whatsappContactUrl(team);
    return href ? (
      <a
        className="button button-whatsapp button-small"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Contact on WhatsApp: ${team.name}`}
      >
        <MessageCircle size={15} />
        Contact on WhatsApp
      </a>
    ) : (
      <span className="field-error">
        Invalid WhatsApp number — contact the leader by email.
      </span>
    );
  };
  const registrationReview = (team: AdminTeam) => (
    <div className="workspace-card payment-review-card" key={team.id}>
      <div className="payment-review-heading">
        <div>
          <h3>{team.name}</h3>
          <small>{team.registrationId}</small>
        </div>
        <Status status={team.registrationStatus} />
      </div>
      <dl className="payment-detail-list">
        <div>
          <dt>REGISTERED ON</dt>
          <dd>{formatDate(team.createdAt)}</dd>
        </div>
        <div>
          <dt>WHATSAPP</dt>
          <dd>{team.whatsapp}</dd>
        </div>
        <div>
          <dt>DEPARTMENT</dt>
          <dd>{team.department}</dd>
        </div>
        <div>
          <dt>TOTAL MEMBERS</dt>
          <dd>{team.members.length}</dd>
        </div>
      </dl>
      {contactButton(team)}
      <p className="payment-help">
        WhatsApp contact consent:{" "}
        {team.whatsappConsent
          ? "Provided during registration"
          : "Not recorded for this existing registration"}
        .
      </p>
      <div className="field registration-review-field">
        <label htmlFor={`status-${team.id}`}>Registration status</label>
        <select
          id={`status-${team.id}`}
          value={statuses[team.id] ?? team.registrationStatus}
          disabled={busy}
          onChange={(e) => {
            setReviewBaselines((prev) => ({
              ...prev,
              [team.id]: prev[team.id] ?? {
                status: team.registrationStatus,
                notes: team.internalNotes,
              },
            }));
            setStatuses((prev) => ({
              ...prev,
              [team.id]: e.target.value as RegistrationStatus,
            }));
          }}
        >
          {REGISTRATION_STATUSES.map((status) => (
            <option value={status} key={status}>
              {REGISTRATION_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
      <div className="field registration-review-field">
        <label htmlFor={`notes-${team.id}`}>
          Internal notes · organizers only
        </label>
        <textarea
          id={`notes-${team.id}`}
          value={notes[team.id] ?? team.internalNotes}
          maxLength={4000}
          disabled={busy}
          placeholder="Contact history, next steps, or follow-up notes…"
          onChange={(e) => {
            setReviewBaselines((prev) => ({
              ...prev,
              [team.id]: prev[team.id] ?? {
                status: team.registrationStatus,
                notes: team.internalNotes,
              },
            }));
            setNotes((prev) => ({ ...prev, [team.id]: e.target.value }));
          }}
        />
      </div>
      <LoadingButton
        busy={busy}
        onClick={async () => {
          if (
            await action(
              "/api/admin/registrations",
              {
                teamId: team.id,
                status: statuses[team.id] ?? team.registrationStatus,
                expectedStatus:
                  reviewBaselines[team.id]?.status ?? team.registrationStatus,
                expectedNotes:
                  reviewBaselines[team.id]?.notes ?? team.internalNotes,
                internalNotes: notes[team.id] ?? team.internalNotes,
              },
              "PATCH",
            )
          ) {
            setReviewBaselines((prev) => {
              const next = { ...prev };
              delete next[team.id];
              return next;
            });
            setNotes((prev) => {
              const next = { ...prev };
              delete next[team.id];
              return next;
            });
            setStatuses((prev) => {
              const next = { ...prev };
              delete next[team.id];
              return next;
            });
          }
        }}
      >
        Save registration <Check size={14} />
      </LoadingButton>
      {reviewBaselines[team.id] && (
        <button
          type="button"
          className="button button-quiet"
          disabled={busy}
          onClick={() => {
            setNotes((prev) => {
              const next = { ...prev };
              delete next[team.id];
              return next;
            });
            setStatuses((prev) => {
              const next = { ...prev };
              delete next[team.id];
              return next;
            });
            setReviewBaselines((prev) => {
              const next = { ...prev };
              delete next[team.id];
              return next;
            });
          }}
        >
          Discard changes
        </button>
      )}
    </div>
  );
  const table = (
    <div className="workspace-card">
      <div className="table-toolbar">
        <input
          aria-label="Search teams"
          placeholder="Search teams, emails, IDs, WhatsApp, departments…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          aria-label="Filter registration status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All registrations</option>
          {REGISTRATION_STATUSES.map((status) => (
            <option value={status} key={status}>
              {REGISTRATION_LABELS[status]}
            </option>
          ))}
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
                  <th>WHATSAPP</th>
                  <th>DEPARTMENT</th>
                  <th>SIZE</th>
                  <th>REGISTERED</th>
                  <th>STATUS</th>
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
                    <td>{t.whatsapp}</td>
                    <td>{t.department}</td>
                    <td>{t.members.length}</td>
                    <td>{formatDate(t.createdAt)}</td>
                    <td>
                      <Status status={t.registrationStatus} />
                    </td>
                    <td>
                      <Status status={t.submission.final ? "final" : "draft"} />
                    </td>
                    <td>
                      {contactButton(t)}
                      <button
                        className="registration-view-button"
                        onClick={() => setSelected(t)}
                      >
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
            participant and team name can belong to only one registration. Saved
            registrations refresh automatically.
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
              <small>Manually confirmed by organizers</small>
            </div>
            <div className="stat-card">
              <div>
                <span>AWAITING CONTACT</span>
                <Clock3 size={17} />
              </div>
              <strong>{pending.length}</strong>
              <small>New team registrations</small>
            </div>
            <div className="stat-card">
              <div>
                <span>CONTACTED TEAMS</span>
                <MessageCircle size={17} />
              </div>
              <strong>
                {
                  teams.filter(
                    (t) =>
                      t.registrationStatus === "contacted" ||
                      t.registrationStatus === "awaiting_confirmation",
                  ).length
                }
              </strong>
              <small>Organizer follow-up in progress</small>
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
                  ? "Registration closes automatically at the official deadline. Contact new teams on WhatsApp and keep registration statuses up to date."
                  : "Set official dates and organizer support details. Then enable registration in Event configuration."}
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
          {registrationReview(selected)}
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
                These details help students reach the organizing team. Payment
                instructions are shared directly on WhatsApp.
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
                    {contactButton(t)}
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
                  ? "Official SMTP is configured. Confirmation emails are queued only after organizer confirmation."
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
                Registration updates and organizer changes are recorded here.
              </EmptyState>
            )}
          </div>
        </>
      )}
    </Workspace>
  );
}
