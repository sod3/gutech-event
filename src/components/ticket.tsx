"use client";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Printer, Sparkles } from "lucide-react";
import { Brand, formatDate } from "./ui";
import { type SafeTeam, type PublicEvent } from "@/lib/types";
export function Ticket({
  team,
  event,
}: {
  team: SafeTeam;
  event: PublicEvent;
}) {
  return (
    <main
      className="page-background"
      style={{ padding: "1px 0 40px", minHeight: "100vh" }}
    >
      <div className="confirmation-ticket">
        <Brand />
        <div className="ticket-label">
          <CheckCircle2
            size={12}
            style={{ display: "inline", marginRight: 6 }}
          />
          PAYMENT VERIFIED · REGISTRATION CONFIRMED
        </div>
        <h1>
          Welcome to the future,
          <br />
          <span className="gradient-text">innovator!</span>{" "}
          <Sparkles size={26} style={{ display: "inline" }} />
        </h1>
        <p>
          Your team is officially part of BuildFest 2026.
          <br />
          One Idea. Three Minds. Endless Possibilities.
        </p>
        <div className="ticket-id">
          <small>YOUR UNIQUE REGISTRATION ID</small>
          <strong>{team.registrationId}</strong>
        </div>
        <h3 style={{ color: "#718bae", fontSize: 21, fontWeight: 550 }}>
          {team.name}
        </h3>
        <p>{team.members.map((m) => m.name).join(" · ")}</p>
        <div className="ticket-bottom">
          <span>
            LOCATION<strong>GUtech University, Pakistan</strong>
          </span>
          <span>
            TEAM REGISTRATION<strong>PKR 1,500 · verified</strong>
          </span>
        </div>
        <p>Event date: {formatDate(event.eventDate)}</p>
        <p style={{ fontSize: 10 }}>
          Organized by GUtech Entrepreneurship Society
          <br />
          Powered by ArtDera
        </p>
        <div className="ticket-actions">
          <button
            className="button button-primary"
            onClick={() => window.print()}
          >
            <Printer size={15} />
            Print / save as PDF
          </button>
          <Link className="button button-secondary" href="/dashboard">
            <ArrowLeft size={14} />
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
