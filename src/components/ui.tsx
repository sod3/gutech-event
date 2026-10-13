"use client";
import Link from "next/link";
import {
  REGISTRATION_LABELS,
  type RegistrationStatus,
} from "@/lib/registration";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  Command,
  LoaderCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

export function Brand({ small = false }: { small?: boolean }) {
  return (
    <Link
      className={`brand ${small ? "brand-small" : ""}`}
      href="/"
      aria-label="BuildFest home"
    >
      <span className="brand-symbol">
        <Command size={23} strokeWidth={2.5} />
      </span>
      <span>
        buildfest<span className="brand-year">26</span>
      </span>
    </Link>
  );
}
export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Brand />
        <nav
          className={open ? "site-nav is-open" : "site-nav"}
          aria-label="Main navigation"
        >
          <Link href="/#challenge" onClick={() => setOpen(false)}>
            The challenge
          </Link>
          <Link href="/#journey" onClick={() => setOpen(false)}>
            How it works
          </Link>
          <Link href="/#judging" onClick={() => setOpen(false)}>
            Judging
          </Link>
          <Link href="/#faq" onClick={() => setOpen(false)}>
            FAQs
          </Link>
          <Link href="/login" className="mobile-sign-in">
            Team sign in <ArrowUpRight size={14} />
          </Link>
        </nav>
        <div className="header-actions">
          <Link href="/login" className="header-login">
            Sign in <ArrowUpRight size={13} />
          </Link>
          <Link href="/register" className="button button-primary button-small">
            Register your team <ArrowUpRight size={16} />
          </Link>
          <button
            className="menu-toggle icon-button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close navigation" : "Open navigation"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Brand />
            <p>A space for the ideas that won’t leave you alone.</p>
          </div>
          <div className="footer-links">
            <Link href="/rules">Event rules</Link>
            <Link href="/privacy">Privacy & refunds</Link>
            <Link href="/login?role=admin">
              Organizer access <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 BuildFest · GUtech Entrepreneurship Society</span>
          <span>
            Powered by{" "}
            <a
              href="https://artdera.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              ArtDera <ArrowUpRight size={12} />
            </a>
          </span>
          <a href="#top">
            Back to top <ArrowDown size={12} className="rotate-180" />
          </a>
        </div>
      </div>
    </footer>
  );
}
export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 1, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
export function SectionLabel({
  children,
  number,
}: {
  children: ReactNode;
  number?: string;
}) {
  return (
    <div className="section-label">
      {number && <span>{number}</span>}
      <span className="label-line" />
      {children}
    </div>
  );
}
export function Status({
  status,
}: {
  status: RegistrationStatus | "pending" | "rejected" | "draft" | "final";
}) {
  return (
    <span className={`status status-${status}`}>
      <span />
      {
        {
          ...REGISTRATION_LABELS,
          pending: "Awaiting Organizer Contact",
          confirmed: "Confirmed",
          rejected: "Action needed",
          draft: "Draft",
          final: "Final submitted",
        }[status]
      }
    </span>
  );
}
export function LoadingButton({
  busy,
  children,
  className = "button button-primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean }) {
  return (
    <button {...props} className={className} disabled={busy || props.disabled}>
      {busy ? <LoaderCircle className="spin" size={17} /> : null}
      {children}
    </button>
  );
}
export function FormMessage({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      className={`form-message ${error ? "form-error" : "form-success"}`}
    >
      {!error && <Check size={17} />}
      <span>{error || message}</span>
    </div>
  );
}
export function EmptyState({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export async function api<T = Record<string, unknown>>(
  url: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  const response = await fetch(url, {
    method,
    cache: "no-store",
    ...(body instanceof FormData
      ? { body }
      : body
        ? {
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }
        : {}),
  });
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("The connection was interrupted. Please try again.");
  }
  if (!response.ok)
    throw new Error(data.error || "Something went wrong. Please try again.");
  return data as T;
}
export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      className="logout-button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        try {
          await api("/api/auth/logout", "POST");
          router.push("/login");
          router.refresh();
        } catch {
          setBusy(false);
        }
      }}
    >
      <LogOut size={16} /> Sign out
    </button>
  );
}
export function Countdown({
  deadline,
  compact = false,
  purpose = "registration",
}: {
  deadline: string;
  compact?: boolean;
  purpose?: "registration" | "submission";
}) {
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!deadline) return;
    const tick = () =>
      setRemaining(Math.max(0, new Date(deadline).getTime() - Date.now()));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadline]);
  if (!deadline)
    return (
      <span className="date-pending">
        <span className="pulse-dot" /> Official dates coming soon
      </span>
    );
  if (remaining === null)
    return (
      <span className="date-pending">
        {purpose === "submission"
          ? "Submission deadline announced"
          : "Registration deadline announced"}
      </span>
    );
  if (!remaining)
    return (
      <span className="date-pending">
        {purpose === "submission"
          ? "Project submissions are closed"
          : "Registration has closed"}
      </span>
    );
  const values = [
    Math.floor(remaining / 86400000),
    Math.floor(remaining / 3600000) % 24,
    Math.floor(remaining / 60000) % 60,
    Math.floor(remaining / 1000) % 60,
  ];
  return (
    <div className={compact ? "countdown compact" : "countdown"}>
      {values.map((v, i) => (
        <div key={i}>
          <strong>{String(v).padStart(2, "0")}</strong>
          <span>{["days", "hours", "mins", "secs"][i]}</span>
        </div>
      ))}
    </div>
  );
}
export function formatDate(date: string) {
  return date
    ? new Intl.DateTimeFormat("en-PK", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Karachi",
      }).format(new Date(date)) + " PKT"
    : "To be announced";
}
export function ArrowLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link className="text-link" href={href}>
      {children}
      <ArrowRight size={16} />
    </Link>
  );
}
