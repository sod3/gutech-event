"use client";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2, Download } from "lucide-react";
import { Brand, Status } from "./ui";
import type { SafeTeam } from "@/lib/types";
export function RegistrationSuccess({ team }: { team: SafeTeam }) {
  return (
    <main className="page-background registration-success-page">
      <div className="confirmation-ticket registration-success" role="status">
        <Brand />
        <div className="registration-success-icon">
          <CheckCircle2 size={36} strokeWidth={1.6} />
        </div>
        <div className="ticket-label">APPLICATION RECEIVED · LEAP 3</div>
        <h1>
          Your next leap
          <br />
          <span className="gradient-text">starts here.</span>
        </h1>
        <p>
          Your application has been submitted successfully. Our team will review
          your startup and contact you if shortlisted.
        </p>
        <div className="ticket-id">
          <small>YOUR APPLICATION ID</small>
          <strong>{team.registrationId}</strong>
        </div>
        <h3>{team.name}</h3>
        <p>
          {team.startupStage} · {team.members.length} team{" "}
          {team.members.length === 1 ? "member" : "members"}
        </p>
        <div className="success-status">
          <small>APPLICATION STATUS</small>
          <Status status={team.registrationStatus} />
        </div>
        {team.applicationDeckFileId && (
          <a
            className="text-link"
            href={`/api/files/${team.applicationDeckFileId}`}
          >
            <Download size={14} />
            Download submitted pitch deck
          </a>
        )}
        <p style={{ fontSize: 11, marginTop: 20 }}>
          Submit Your Startup → Application Review → Shortlisting → Pitch at
          LEAP 3<br />
          Only shortlisted startups will be invited to pitch. Registration is
          completely free.
        </p>
        <div className="ticket-actions">
          <Link className="button button-secondary" href="/">
            <ArrowLeft size={14} />
            Back to homepage
          </Link>
          <Link className="button button-primary" href="/dashboard">
            Application dashboard
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}
