"use client";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CheckCircle2 } from "lucide-react";
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
        <div className="ticket-label">REGISTRATION RECEIVED</div>
        <h1>
          You&apos;re One Step Closer to{" "}
          <span className="gradient-text">
            Building Something Extraordinary!
          </span>{" "}
          🚀
        </h1>
        <p>
          Your team registration has been received successfully! Our organizing
          team will contact your team leader on WhatsApp shortly with further
          details.
        </p>
        <div className="ticket-id">
          <small>YOUR REGISTRATION ID</small>
          <strong>{team.registrationId}</strong>
        </div>
        <h3>{team.name}</h3>
        <div className="success-members">
          {team.members.map((member, index) => (
            <p key={member.email}>
              {member.name}
              <small>{index === 0 ? "Team leader" : "Team member"}</small>
            </p>
          ))}
        </div>
        <div className="success-status">
          <small>STATUS</small>
          {team.registrationStatus === "new" ? (
            <span className="status status-new">
              <span />
              Awaiting Organizer Contact
            </span>
          ) : (
            <Status status={team.registrationStatus} />
          )}
        </div>
        <div className="ticket-actions">
          <Link className="button button-primary" href="/">
            <ArrowLeft size={14} />
            Back to Homepage
          </Link>
          <Link className="button button-secondary" href="/dashboard">
            Team dashboard
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </main>
  );
}
