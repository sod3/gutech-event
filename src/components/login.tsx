"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { api, FormMessage, LoadingButton, SectionLabel } from "./ui";
export function Login({
  organizer = false,
  supportEmail = "",
}: {
  organizer?: boolean;
  supportEmail?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await api<{ redirect: string }>("/api/auth/login", "POST", {
        email,
        password,
      });
      router.push(r.redirect);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-layout">
      <div className="login-art">
        <SectionLabel>YOUR IDEAS HAVE A HOME HERE</SectionLabel>
        <h1>
          Pick up
          <br />
          where your
          <br />
          <span className="gradient-text">idea left off.</span>
        </h1>
        <p>
          Your team. Your progress. Your next big thing.
          <br />
          Everything you need, in one place.
        </p>
        <Sparkles />
      </div>
      <div className="login-main">
        <form onSubmit={submit} className="login-form">
          <h2>{organizer ? "Organizer sign in." : "Welcome back, builder."}</h2>
          <p>
            {organizer
              ? "Secure access for event organizers and judges."
              : "Sign in with your team leader’s email and password."}
          </p>
          <div className="field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={254}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your dashboard password"
              autoComplete="current-password"
              maxLength={128}
              required
            />
          </div>
          <FormMessage error={error} />
          <LoadingButton type="submit" busy={busy}>
            Sign in <ArrowRight size={16} />
          </LoadingButton>
          {!organizer && (
            <div className="login-register">
              New here? <Link href="/register">Register your team ↗</Link>
            </div>
          )}
          <div className="login-note">
            <ShieldCheck
              size={13}
              style={{ display: "inline", marginRight: 5 }}
            />
            Only the team leader has dashboard access. Need help accessing your
            account?{" "}
            {supportEmail ? (
              <a href={`mailto:${supportEmail}`} style={{ color: "#7896c6" }}>
                Contact the organizer.
              </a>
            ) : (
              "Organizer support details will be announced before registration opens."
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
