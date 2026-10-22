"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  FileText,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { registrationSchema } from "@/lib/validation";
import { STARTUP_STAGES } from "@/lib/registration";
import { registrationState, type PublicEvent } from "@/lib/types";
import { api, Brand, FormMessage, LoadingButton, formatDate } from "./ui";
import { usePublicEvent } from "./use-public-event";
type Draft = {
  startupName: string;
  startupStage: string;
  startupDescription: string;
  leaderName: string;
  email: string;
  whatsapp: string;
  institution: string;
  password: string;
  members: { name: string; email: string }[];
  requestId: string;
  whatsappConsent: boolean;
  agreement: boolean;
};
const empty: Draft = {
  startupName: "",
  startupStage: "",
  startupDescription: "",
  leaderName: "",
  email: "",
  whatsapp: "",
  institution: "",
  password: "",
  members: [],
  requestId: "",
  whatsappConsent: false,
  agreement: false,
};
const draftKey = "leap3-application-draft";
export function Registration({ event: initialEvent }: { event: PublicEvent }) {
  const event = usePublicEvent(initialEvent),
    state = registrationState(event),
    router = useRouter();
  const [data, setData] = useState<Draft>(empty),
    [step, setStep] = useState(0),
    [deck, setDeck] = useState<File | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [ready, setReady] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const locked = useRef(false),
    completed = useRef(false),
    formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const next = { ...empty, requestId: crypto.randomUUID() };
      try {
        const stored = JSON.parse(localStorage.getItem(draftKey) || "null");
        if (stored && typeof stored === "object") {
          for (const key of [
            "startupName",
            "startupStage",
            "startupDescription",
            "leaderName",
            "email",
            "whatsapp",
            "institution",
          ] as const)
            if (typeof stored[key] === "string") next[key] = stored[key];
          if (Array.isArray(stored.members))
            next.members = stored.members.filter(
              (m: { name?: unknown; email?: unknown }) =>
                typeof m?.name === "string" && typeof m?.email === "string",
            );
          if (
            typeof stored.requestId === "string" &&
            /^[0-9a-f-]{36}$/i.test(stored.requestId)
          )
            next.requestId = stored.requestId;
        }
      } catch {}
      setData(next);
      setReady(true);
    }, 0);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!ready || completed.current) return;
    const t = setTimeout(() => {
      const { password, agreement, whatsappConsent, ...draft } = data;
      void password;
      void agreement;
      void whatsappConsent;
      try {
        if (!completed.current)
          localStorage.setItem(draftKey, JSON.stringify(draft));
      } catch {}
    }, 350);
    return () => clearTimeout(t);
  }, [data, ready]);
  const change = (key: keyof Draft, value: Draft[keyof Draft]) => {
    setData((p) => ({ ...p, [key]: value }));
    setError("");
    setFields((p) => ({ ...p, [key]: "" }));
  };
  const validate = (all = false) => {
    const result = registrationSchema.safeParse({
      ...data,
      ...(!all ? { whatsappConsent: true, agreement: true } : {}),
      teamSize: data.members.length + 1,
    });
    if (!result.success) {
      const issues = result.error.issues.filter(
        (i) =>
          all ||
          (step === 0
            ? ["startupName", "startupStage", "startupDescription"]
            : step === 1
              ? [
                  "leaderName",
                  "email",
                  "password",
                  "whatsapp",
                  "institution",
                  "members",
                ]
              : []
          ).includes(String(i.path[0])),
      );
      if (issues.length) {
        setFields(
          Object.fromEntries(issues.map((i) => [i.path.join("."), i.message])),
        );
        setError("Please check the highlighted details.");
        requestAnimationFrame(() =>
          formRef.current
            ?.querySelector<HTMLElement>("[aria-invalid='true']")
            ?.focus(),
        );
        return false;
      }
    }
    if ((step === 0 || all) && !deck) {
      setFields((p) => ({
        ...p,
        deck: "Upload your PDF pitch deck to apply.",
      }));
      setError("A PDF pitch deck is required for review.");
      return false;
    }
    return true;
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (locked.current) return;
    setError("");
    setFields({});
    if (step < 2) {
      if (validate()) {
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }
    if (!validate(true) || !deck) return;
    if (!state.open) {
      setError(state.reason);
      return;
    }
    locked.current = true;
    setBusy(true);
    try {
      const body = new FormData();
      body.set(
        "data",
        JSON.stringify({ ...data, teamSize: data.members.length + 1 }),
      );
      body.set("deck", deck);
      const r = await api<{ redirect: string }>("/api/register", "POST", body);
      completed.current = true;
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      router.push(r.redirect);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to submit. Please try again.",
      );
    } finally {
      setBusy(false);
      locked.current = false;
    }
  };
  const field = (
    key:
      | "startupName"
      | "leaderName"
      | "email"
      | "whatsapp"
      | "institution"
      | "password",
    label: string,
    placeholder: string,
    type = "text",
  ) => (
    <div className="field">
      <label htmlFor={key}>
        {label} <span>*</span>
      </label>
      <input
        id={key}
        type={type}
        value={data[key]}
        placeholder={placeholder}
        autoComplete={
          key === "password"
            ? "new-password"
            : key === "email"
              ? "email"
              : key === "leaderName"
                ? "name"
                : key === "whatsapp"
                  ? "tel"
                  : key === "institution"
                    ? "organization"
                    : "off"
        }
        maxLength={
          key === "password"
            ? 72
            : key === "startupName"
              ? 80
              : key === "email"
                ? 254
                : key === "institution"
                  ? 160
                  : key === "whatsapp"
                    ? 24
                    : 100
        }
        required
        aria-invalid={!!fields[key]}
        aria-describedby={fields[key] ? `${key}-error` : undefined}
        onChange={(e) => change(key, e.target.value)}
      />
      {fields[key] && (
        <small className="field-error" id={`${key}-error`}>
          {fields[key]}
        </small>
      )}
    </div>
  );
  return (
    <main className="leap-registration">
      <aside className="leap-registration-aside">
        <Brand />
        <div>
          <span className="leap-eyebrow">LEAP 3 · STARTUP APPLICATION</span>
          <h1>
            Your next chapter
            <br />
            starts with
            <br />
            <span>one pitch.</span>
          </h1>
          <p>
            GUtech University’s Official Startup Pitching Event, organized by
            the Entrepreneurship Society.
          </p>
          <ul>
            <li>
              <Check size={17} /> Registration is completely FREE
            </li>
            <li>
              <Check size={17} /> A strong idea is enough to apply
            </li>
            <li>
              <Check size={17} /> No limit on team members
            </li>
            <li>
              <Check size={17} /> PDF pitch deck required
            </li>
          </ul>
          <div className="leap-registration-note">
            <ShieldCheck size={21} />
            <p>
              Every application is reviewed. Only shortlisted startups are
              invited to pitch. No project-building time is provided during the
              event.
            </p>
          </div>
        </div>
        <Link href="/" className="text-link">
          <ArrowLeft size={14} />
          Back to event
        </Link>
      </aside>
      <section className="leap-registration-main">
        <div className="leap-registration-top">
          <span>ALREADY APPLIED?</span>
          <Link href="/login">
            Sign in <ArrowUpRight size={14} />
          </Link>
        </div>
        <div className="leap-form-wrap">
          <ol className="leap-form-steps">
            {["Your startup", "Your team", "Review & submit"].map((s, i) => (
              <li key={s} className={step >= i ? "active" : ""}>
                <span>{step > i ? <Check size={14} /> : i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <div className="leap-form-heading">
            <span>STEP 0{step + 1} / 03</span>
            <h2>
              {
                [
                  "Tell us about your startup.",
                  "Meet the people behind it.",
                  "Ready for your next leap?",
                ][step]
              }
            </h2>
            <p>
              {
                [
                  "Idea, prototype, MVP, or growing business — every stage is welcome.",
                  "Start with the team leader. Add as many teammates as you need.",
                  "Check your application before sending it to the organizers.",
                ][step]
              }
            </p>
          </div>
          {!state.open && (
            <div className="notice notice-warning">
              <p>
                {event.available
                  ? state.reason
                  : "We’re having trouble connecting. Your draft stays in this browser. Please try again shortly."}
              </p>
            </div>
          )}
          <form ref={formRef} onSubmit={submit} noValidate>
            {step === 0 && (
              <>
                <div className="form-grid">
                  {field("startupName", "Startup Name", "Your startup’s name")}
                  <div className="field">
                    <label htmlFor="startupStage">
                      Startup Stage <span>*</span>
                    </label>
                    <select
                      id="startupStage"
                      required
                      value={data.startupStage}
                      aria-invalid={!!fields.startupStage}
                      onChange={(e) => change("startupStage", e.target.value)}
                    >
                      <option value="">Select your current stage</option>
                      {STARTUP_STAGES.map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                    {fields.startupStage && (
                      <small className="field-error">
                        {fields.startupStage}
                      </small>
                    )}
                  </div>
                  <div className="field field-full">
                    <label htmlFor="startupDescription">
                      Startup Description <span>*</span>
                    </label>
                    <textarea
                      id="startupDescription"
                      required
                      rows={6}
                      maxLength={5000}
                      value={data.startupDescription}
                      aria-invalid={!!fields.startupDescription}
                      placeholder="Explain your startup idea, the problem you’re solving, your solution, and your target customers."
                      onChange={(e) =>
                        change("startupDescription", e.target.value)
                      }
                    />
                    <small>
                      {fields.startupDescription ? (
                        <span className="field-error">
                          {fields.startupDescription}
                        </span>
                      ) : (
                        "Be clear about the idea and who it helps. A working product is not required."
                      )}
                    </small>
                  </div>
                </div>
                <div className="field leap-deck-field">
                  <label htmlFor="deck">
                    Startup Pitch Deck <span>* · PDF, up to 3 MB</span>
                  </label>
                  <div className={`leap-upload ${deck ? "has-file" : ""}`}>
                    <Upload size={26} />
                    <strong>
                      {deck ? deck.name : "Choose your PDF pitch deck"}
                    </strong>
                    <span>
                      {deck
                        ? `${(deck.size / 1000000).toFixed(2)} MB · Click to replace`
                        : "Organizers will review this deck to shortlist startups."}
                    </span>
                    <input
                      id="deck"
                      required
                      type="file"
                      accept=".pdf,application/pdf"
                      aria-label="Startup Pitch Deck PDF Upload"
                      aria-invalid={!!fields.deck}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        if (
                          !/\.pdf$/i.test(f.name) ||
                        (f.type && f.type !== "application/pdf") ||
                          f.size > 3000000 ||
                          !f.size
                        ) {
                          setDeck(null);
                          setFields((p) => ({
                            ...p,
                            deck: "Choose a non-empty PDF smaller than 3 MB.",
                          }));
                          e.target.value = "";
                          return;
                        }
                        setDeck(f);
                        setFields((p) => ({ ...p, deck: "" }));
                        setError("");
                      }}
                    />
                  </div>
                  {fields.deck && (
                    <small className="field-error">{fields.deck}</small>
                  )}
                  <small>
                    Include your idea, problem, solution, target customers, and
                    team. Files are stored privately. Reselect the PDF if you
                    return to a saved draft.
                  </small>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <h3 className="leap-form-subtitle">Team leader details</h3>
                <div className="form-grid">
                  {field("leaderName", "Full name", "Team leader’s full name")}
                  {field("email", "Email address", "you@example.com", "email")}
                  {field(
                    "whatsapp",
                    "WhatsApp number",
                    "03001234567 or +923001234567",
                    "tel",
                  )}
                  {field(
                    "institution",
                    "University / organization",
                    "Your university or organization",
                  )}
                  {field(
                    "password",
                    "Dashboard password",
                    "At least 12 characters",
                    "password",
                  )}
                </div>
                <p className="leap-form-help">
                  Use this email and password to check your application status
                  later.
                </p>
                <div className="leap-members-heading">
                  <h3>
                    Team members <span>({data.members.length} additional)</span>
                  </h3>
                  <span>No member limit · solo founders welcome</span>
                </div>
                {data.members.map((m, i) => (
                  <div className="leap-member-row" key={i}>
                    <div className="field">
                      <label htmlFor={`member-name-${i}`}>
                        Member {i + 1} · full name *
                      </label>
                      <input
                        id={`member-name-${i}`}
                        value={m.name}
                        maxLength={100}
                        aria-invalid={!!fields[`members.${i}.name`]}
                        onChange={(e) =>
                          change(
                            "members",
                            data.members.map((v, j) =>
                              j === i ? { ...v, name: e.target.value } : v,
                            ),
                          )
                        }
                      />
                      {fields[`members.${i}.name`] && (
                        <small className="field-error">
                          {fields[`members.${i}.name`]}
                        </small>
                      )}
                    </div>
                    <div className="field">
                      <label htmlFor={`member-email-${i}`}>
                        Email address *
                      </label>
                      <input
                        id={`member-email-${i}`}
                        type="email"
                        value={m.email}
                        maxLength={254}
                        aria-invalid={!!fields[`members.${i}.email`]}
                        onChange={(e) =>
                          change(
                            "members",
                            data.members.map((v, j) =>
                              j === i ? { ...v, email: e.target.value } : v,
                            ),
                          )
                        }
                      />
                      {fields[`members.${i}.email`] && (
                        <small className="field-error">
                          {fields[`members.${i}.email`]}
                        </small>
                      )}
                    </div>
                    <button
                      type="button"
                      className="icon-button"
                      aria-label={`Remove member ${i + 1}`}
                      onClick={() =>
                        change(
                          "members",
                          data.members.filter((_, j) => i !== j),
                        )
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {fields.members && (
                  <p className="field-error">{fields.members}</p>
                )}
                <button
                  type="button"
                  className="button button-secondary button-small"
                  onClick={() =>
                    change("members", [
                      ...data.members,
                      { name: "", email: "" },
                    ])
                  }
                >
                  <Plus size={16} />
                  Add team member
                </button>
              </>
            )}
            {step === 2 && (
              <>
                <div className="leap-review">
                  <div>
                    <h3>{data.startupName}</h3>
                    <span className="leap-review-stage">
                      {data.startupStage}
                    </span>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setStep(0)}
                    >
                      Edit startup
                    </button>
                  </div>
                  <p className="leap-description">{data.startupDescription}</p>
                  <p>
                    <FileText size={17} />
                    {deck?.name || "PDF required — return to step 1"}
                  </p>
                  <hr />
                  <div>
                    <h3>Team leader</h3>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => setStep(1)}
                    >
                      Edit team
                    </button>
                  </div>
                  <p>
                    {data.leaderName}
                    <br />
                    {data.email} · {data.whatsapp}
                    <br />
                    {data.institution}
                  </p>
                  {data.members.length > 0 && (
                    <>
                      <h3>Team members</h3>
                      {data.members.map((m, i) => (
                        <p key={i}>
                          {m.name} · {m.email}
                        </p>
                      ))}
                    </>
                  )}
                  <div className="leap-free-review">
                    <span>Registration</span>
                    <strong>Completely FREE</strong>
                  </div>
                </div>
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={data.whatsappConsent}
                    onChange={(e) =>
                      change("whatsappConsent", e.target.checked)
                    }
                  />
                  <span>
                    I consent to the LEAP 3 organizers contacting me on WhatsApp
                    about my application and shortlisting.
                  </span>
                </label>
                {fields.whatsappConsent && (
                  <p className="field-error">{fields.whatsappConsent}</p>
                )}
                <label className="check-label">
                  <input
                    type="checkbox"
                    checked={data.agreement}
                    onChange={(e) => change("agreement", e.target.checked)}
                  />
                  <span>
                    I agree to the{" "}
                    <Link href="/rules" target="_blank">
                      application guidelines
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" target="_blank">
                      privacy policy
                    </Link>
                    . I understand that only shortlisted startups will be
                    invited to pitch.
                  </span>
                </label>
                {fields.agreement && (
                  <p className="field-error">{fields.agreement}</p>
                )}
              </>
            )}
            <FormMessage error={error} />
            <div className="leap-form-actions">
              {step > 0 ? (
                <button
                  type="button"
                  className="button button-secondary"
                  disabled={busy}
                  onClick={() => {
                    setStep(step - 1);
                    setError("");
                  }}
                >
                  <ArrowLeft size={15} />
                  Back
                </button>
              ) : (
                <span />
              )}
              <LoadingButton
                type="submit"
                busy={busy}
                disabled={!ready || (step === 2 && !state.open)}
              >
                {step === 2 ? "Submit your startup" : "Continue"}
                <ArrowRight size={16} />
              </LoadingButton>
            </div>
          </form>
          <div className="leap-draft-note">
            <span>
              Details are saved in this browser. Passwords and PDFs are
              excluded.
            </span>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem(draftKey);
                } catch {}
                setData({ ...empty, requestId: crypto.randomUUID() });
                setDeck(null);
                setStep(0);
                setFields({});
                setError("");
              }}
            >
              Clear saved draft
            </button>
          </div>
          {event.registrationDeadline && (
            <p className="leap-form-help">
              Applications close {formatDate(event.registrationDeadline)}.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}
