"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BrainCircuit,
  Check,
  Clock3,
  LockKeyhole,
  Save,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import { z } from "zod";
import {
  emailSchema,
  teamDetailsSchema,
  registrationSchema,
} from "@/lib/validation";
import { ORGANIZER_FOLLOW_UP } from "@/lib/registration";
import { usePublicEvent } from "./use-public-event";
import { registrationState, type Member, type PublicEvent } from "@/lib/types";
import {
  api,
  FormMessage,
  LoadingButton,
  SectionLabel,
  formatDate,
} from "./ui";

type Draft = {
  teamName: string;
  leaderName: string;
  email: string;
  whatsapp: string;
  institution: string;
  department: string;
  teamSize: number;
  members: Member[];
  requestId: string;
  whatsappConsent: boolean;
  password: string;
  agreement: boolean;
};
const empty: Draft = {
  teamName: "",
  leaderName: "",
  email: "",
  whatsapp: "",
  institution: "",
  department: "",
  teamSize: 1,
  members: [],
  requestId: "",
  whatsappConsent: false,
  password: "",
  agreement: false,
};
const detailSchema = teamDetailsSchema;
const memberSchema = z.object({
  members: z
    .array(
      z.object({
        name: z.string().trim().min(2, "Enter a full name.").max(100),
        email: emailSchema,
      }),
    )
    .max(2),
});
export function Registration({ event: initialEvent }: { event: PublicEvent }) {
  const event = usePublicEvent(initialEvent);
  const router = useRouter();
  const [data, setData] = useState<Draft>(empty);
  const [step, setStep] = useState(0);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const completed = useRef(false);
  const [ready, setReady] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const state = event.available
    ? registrationState(event)
    : {
        open: false,
        reason:
          "Registration is temporarily unavailable. Your draft stays saved on this device. Please try again shortly.",
      };
  useEffect(() => {
    const hydrationTimer = setTimeout(() => {
      let requestId = crypto.randomUUID();
      try {
        const stored = JSON.parse(
          localStorage.getItem("buildfest-registration-draft") || "null",
        );
        if (
          stored &&
          typeof stored.teamName === "string" &&
          Array.isArray(stored.members)
        ) {
          if (
            typeof stored.requestId === "string" &&
            z.string().uuid().safeParse(stored.requestId).success
          )
            requestId = stored.requestId;
          setData({
            ...empty,
            ...Object.fromEntries(
              [
                "teamName",
                "leaderName",
                "email",
                "whatsapp",
                "institution",
                "department",
              ].map((key) => [
                key,
                typeof stored[key] === "string" ? stored[key] : "",
              ]),
            ),
            password: "",
            agreement: false,
            whatsappConsent: false,
            requestId,
            teamSize: [1, 2, 3].includes(stored.teamSize) ? stored.teamSize : 1,
            members: Array.from(
              {
                length:
                  ([1, 2, 3].includes(stored.teamSize) ? stored.teamSize : 1) -
                  1,
              },
              (_, i) => ({
                name:
                  typeof stored.members[i]?.name === "string"
                    ? stored.members[i].name
                    : "",
                email:
                  typeof stored.members[i]?.email === "string"
                    ? stored.members[i].email
                    : "",
              }),
            ),
          });
        } else setData({ ...empty, requestId });
      } catch {
        setData({ ...empty, requestId });
      }
      setReady(true);
    }, 0);
    return () => clearTimeout(hydrationTimer);
  }, []);
  useEffect(() => {
    if (!ready || completed.current) return;
    const timer = setTimeout(() => {
      const { password, agreement, whatsappConsent, ...draft } = data;
      void password;
      void agreement;
      void whatsappConsent;
      try {
        if (completed.current) return;
        localStorage.setItem(
          "buildfest-registration-draft",
          JSON.stringify(draft),
        );
      } catch {}
    }, 350);
    return () => clearTimeout(timer);
  }, [data, ready]);
  const change = (key: keyof Draft, value: Draft[keyof Draft]) => {
    setData((prev) => ({ ...prev, [key]: value }));
    setFields((prev) => ({ ...prev, [key]: "" }));
    setError("");
  };
  const errors = (issues: z.core.$ZodIssue[]) => {
    setFields(
      Object.fromEntries(issues.map((i) => [i.path.join("."), i.message])),
    );
    setError("Please check the highlighted details.");
    requestAnimationFrame(() =>
      formRef.current
        ?.querySelector<HTMLInputElement>("[aria-invalid='true']")
        ?.focus(),
    );
  };
  const advance = () => {
    setError("");
    setFields({});
    if (step === 0) {
      const result = detailSchema.safeParse(data);
      if (!result.success) {
        errors(result.error.issues);
        return;
      }
    }
    if (step === 1) {
      const result = memberSchema.safeParse(data);
      if (!result.success) {
        errors(result.error.issues);
        return;
      }
      const emails = [
        data.email.toLowerCase().trim(),
        ...data.members.map((m) => m.email.toLowerCase().trim()),
      ];
      if (new Set(emails).size !== emails.length) {
        setError("Every participant needs a different email address.");
        return;
      }
    }
    setStep(step + 1);
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting.current) return;
    if (step < 2) {
      advance();
      return;
    }
    if (!ready || !state.open) {
      setError(state.reason || "Please wait while your draft loads.");
      return;
    }
    const parsed = registrationSchema.safeParse(data);
    if (!parsed.success) {
      errors(parsed.error.issues);
      return;
    }
    try {
      const { password, agreement, whatsappConsent, ...draft } = data;
      void password;
      void agreement;
      void whatsappConsent;
      localStorage.setItem(
        "buildfest-registration-draft",
        JSON.stringify(draft),
      );
    } catch {}
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("data", JSON.stringify(parsed.data));
      const result = await api<{ redirect: string }>(
        "/api/register",
        "POST",
        form,
      );
      completed.current = true;
      try {
        localStorage.removeItem("buildfest-registration-draft");
      } catch {}
      router.push(result.redirect);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please try again.");
    } finally {
      if (!completed.current) {
        submitting.current = false;
        setBusy(false);
      }
    }
  };
  const field = (
    key: keyof Draft,
    label: string,
    placeholder: string,
    type = "text",
    full = false,
    hint?: string,
  ) => (
    <div className={`field ${full ? "field-full" : "field-mobile-full"}`}>
      <label htmlFor={key}>{label}</label>
      <input
        id={key}
        name={key}
        value={String(data[key])}
        onChange={(e) => change(key, e.target.value)}
        type={type}
        placeholder={placeholder}
        autoComplete={
          key === "email"
            ? "email"
            : key === "password"
              ? "new-password"
              : key === "leaderName"
                ? "name"
                : key === "whatsapp"
                  ? "tel"
                  : key === "institution"
                    ? "organization"
                    : "off"
        }
        aria-invalid={!!fields[key]}
        aria-describedby={
          fields[key] ? `${key}-error` : hint ? `${key}-hint` : undefined
        }
        required={key === "institution"}
        maxLength={
          key === "password"
            ? 128
            : key === "email"
              ? 254
              : key === "institution"
                ? 160
                : 100
        }
      />
      {fields[key] && (
        <small className="field-error" id={`${key}-error`}>
          {fields[key]}
        </small>
      )}
      {hint && <small id={`${key}-hint`}>{hint}</small>}
    </div>
  );
  return (
    <div className="container registration-layout">
      <aside className="registration-aside">
        <SectionLabel>YOUR FIRST STEP INTO WHAT’S NEXT</SectionLabel>
        <h1>
          Your idea
          <br /> <span className="gradient-text">starts here.</span>
        </h1>
        <p>
          A small team, a big question, and the space to build something that
          matters.
        </p>
        <div className="registration-facts">
          <div>
            <Users size={18} />
            1–3 members per team
          </div>
          <div>
            <BrainCircuit size={18} />
            AI tools welcome
          </div>
          <div>
            <Sparkles size={18} />
            Every department. Every idea.
          </div>
        </div>
        <div className="registration-summary">
          <div>
            <small>ONE TEAM. ONE SIMPLE FEE.</small>
            <strong>PKR 1,500</strong>
          </div>
          <p>
            The fee covers your entire team.
            <br />
            No hidden charges. No per-member fees.
          </p>
        </div>
        <div className="registration-summary registration-schedule">
          <div>
            <small>EVENT DATE</small>
            <Clock3 size={16} color="#9baccc" />
          </div>
          <p>{formatDate(event.eventDate, true)}</p>
          <p>GUtech University, Pakistan</p>
          <p>Registration closes: {formatDate(event.registrationDeadline)}</p>
        </div>
      </aside>
      <form
        ref={formRef}
        className="registration-form"
        noValidate
        onSubmit={submit}
      >
        <div className="form-stepper">
          {["Team", "Members", "Review & Submit"].map((s, i) => (
            <div
              className={`form-step ${i === step ? "is-current" : i < step ? "is-complete" : ""}`}
              key={s}
            >
              <span>{i < step ? <Check size={11} /> : i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <div className="form-body" key={step}>
          <h2 className="form-title">
            {
              [
                "Meet your next big thing.",
                "Great ideas love good company.",
                "Ready for what’s next?",
              ][step]
            }
          </h2>
          <p className="form-subtitle">
            {
              [
                "Tell us a little about the team behind the idea.",
                "You can go solo or build with up to two teammates.",
                "Review your details and we’ll take it from here.",
              ][step]
            }
          </p>
          {step === 0 && (
            <div className="form-grid">
              {field(
                "teamName",
                "Team name",
                "What should we call your team?",
                "text",
                true,
              )}
              {field("leaderName", "Team leader’s full name", "Your full name")}
              {field(
                "email",
                "Email address",
                "you@example.com",
                "email",
                false,
                "Any valid email works. No university email needed.",
              )}
              {field(
                "institution",
                "University / College",
                "Enter your university or college",
                "text",
                true,
              )}
              {field("whatsapp", "WhatsApp number", "+92 3XX XXXXXXX", "tel")}
              {field(
                "department",
                "Department / program",
                "e.g. Business Administration",
              )}
              <div className="field field-full">
                <label id="team-size-label">
                  Team size <span>Including you</span>
                </label>
                <div
                  className="team-size-options"
                  role="group"
                  aria-labelledby="team-size-label"
                >
                  {[1, 2, 3].map((n) => (
                    <button
                      type="button"
                      key={n}
                      className={data.teamSize === n ? "selected" : ""}
                      aria-pressed={data.teamSize === n}
                      onClick={() =>
                        setData((prev) => ({
                          ...prev,
                          teamSize: n,
                          members: Array.from(
                            { length: n - 1 },
                            (_, i) =>
                              prev.members[i] || { name: "", email: "" },
                          ),
                        }))
                      }
                    >
                      <Users size={15} />
                      {n} {n === 1 ? "member" : "members"}
                    </button>
                  ))}
                </div>
              </div>
              {field(
                "password",
                "Create a dashboard password",
                "At least 12 characters",
                "password",
                true,
                "Used to securely sign in to your team dashboard. Passwords are never saved in your local draft.",
              )}
            </div>
          )}
          {step === 1 && (
            <>
              <div className="leader-summary">
                <span className="avatar">
                  {data.leaderName.slice(0, 1).toUpperCase()}
                </span>
                <div>
                  {data.leaderName}
                  <small>{data.email}</small>
                </div>
                <span>TEAM LEADER</span>
              </div>
              {data.teamSize === 1 ? (
                <div className="solo-state">
                  <User size={32} />
                  <h3>One mind. Endless possibilities.</h3>
                  <p>
                    You’re all set to build solo.
                    <br />
                    You can change your team size in the previous step.
                  </p>
                </div>
              ) : (
                data.members.map((member, i) => (
                  <div className="member-card" key={i}>
                    <h4>TEAM MEMBER 0{i + 2}</h4>
                    <div className="form-grid">
                      {(["name", "email"] as const).map((key) => (
                        <div className="field field-mobile-full" key={key}>
                          <label htmlFor={`member-${i}-${key}`}>
                            {key === "name" ? "Full name" : "Email address"}
                          </label>
                          <input
                            id={`member-${i}-${key}`}
                            type={key === "email" ? "email" : "text"}
                            placeholder={
                              key === "name"
                                ? "Your teammate’s full name"
                                : "teammate@example.com"
                            }
                            value={member[key]}
                            maxLength={key === "email" ? 254 : 100}
                            aria-invalid={!!fields[`members.${i}.${key}`]}
                            onChange={(e) => {
                              const members = data.members.map((m, j) =>
                                j === i ? { ...m, [key]: e.target.value } : m,
                              );
                              change("members", members);
                            }}
                          />
                          {fields[`members.${i}.${key}`] && (
                            <small className="field-error">
                              {fields[`members.${i}.${key}`]}
                            </small>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </>
          )}
          {step === 2 && (
            <>
              <div className="review-block">
                <small>YOUR TEAM</small>
                <button
                  type="button"
                  className="text-link review-edit"
                  disabled={busy}
                  onClick={() => setStep(0)}
                >
                  Edit team details
                </button>
                <h3>{data.teamName}</h3>
                <p>University / College: {data.institution}</p>
                <p>
                  {data.department} · {data.teamSize}{" "}
                  {data.teamSize === 1 ? "member" : "members"}
                </p>
              </div>
              <div className="review-block">
                <small>THE PEOPLE BEHIND THE IDEA</small>
                <button
                  type="button"
                  className="text-link review-edit"
                  disabled={busy}
                  onClick={() => setStep(1)}
                >
                  Edit members
                </button>
                <p>
                  {data.leaderName} — {data.email} (Leader)
                </p>
                {data.members.map((m) => (
                  <p key={m.email}>
                    {m.name} — {m.email}
                  </p>
                ))}
              </div>
              <div className="review-block">
                <small>WHATSAPP CONTACT</small>
                <p>{data.whatsapp}</p>
              </div>
              <div className="review-total">
                <span>
                  Total team fee <small>(All {data.teamSize} members)</small>
                </span>
                <strong>PKR 1,500</strong>
              </div>
              <div className="notice">
                <ShieldCheck size={18} />
                <span>{ORGANIZER_FOLLOW_UP}</span>
              </div>
              {!state.open && (
                <div className="notice notice-warning">
                  <Clock3 size={18} />
                  <span>{state.reason}</span>
                </div>
              )}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={data.whatsappConsent}
                  onChange={(e) => change("whatsappConsent", e.target.checked)}
                  aria-invalid={!!fields.whatsappConsent}
                />
                <span>
                  I consent to being contacted by the BuildFest 2026 organizers
                  through WhatsApp about registration, payment instructions, and
                  event details.
                </span>
              </label>
              {fields.whatsappConsent && (
                <small className="field-error">{fields.whatsappConsent}</small>
              )}
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={data.agreement}
                  onChange={(e) => change("agreement", e.target.checked)}
                />
                <span>
                  I have read the{" "}
                  <Link href="/rules" target="_blank">
                    event rules
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" target="_blank">
                    privacy policy
                  </Link>
                  , and I have my teammates’ consent to register.
                </span>
              </label>
            </>
          )}
          <FormMessage error={error} />
          <div className="form-navigation">
            {step > 0 ? (
              <button
                type="button"
                className="button button-quiet"
                disabled={busy}
                onClick={() => {
                  setStep(step - 1);
                  setError("");
                  setFields({});
                }}
              >
                <ArrowLeft size={14} />
                Back
              </button>
            ) : (
              <span className="draft-note">
                <Save size={11} />
                Draft saved on this device
              </span>
            )}
            <LoadingButton
              busy={busy}
              type="submit"
              disabled={!ready || (step === 2 && !state.open)}
            >
              {step === 2 ? "Complete Registration" : "Continue"}
              <ArrowRight size={15} />
            </LoadingButton>
          </div>
        </div>
        <div className="form-bottom">
          <span>
            <LockKeyhole
              size={10}
              style={{ display: "inline", marginRight: 4 }}
            />
            Your details stay private.
          </span>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              try {
                localStorage.removeItem("buildfest-registration-draft");
              } catch {}
              setData({ ...empty, requestId: crypto.randomUUID() });
              setStep(0);
              setError("");
            }}
            style={{ fontSize: 12, color: "var(--foreground)" }}
          >
            Clear saved draft
          </button>
          <Link href="/login">Already registered? Sign in ↗</Link>
        </div>
      </form>
    </div>
  );
}
