# LEAP 3 — GUtech University's Official Startup Pitching Event

Organized by the Entrepreneurship Society. Free applications for startup ideas, prototypes, MVPs, and growing businesses. A working product is optional. There is no project-building period at the event.

## Development

Run `npm install` and `npm run dev`. Configure the server environment using `.env.example` for a fresh checkout. The existing `buildfest2026` database identifier is retained to preserve all accounts and records.

## Startup applications

1. Startup name, stage, description, and required PDF pitch deck.
2. Leader's name, email, WhatsApp, university/organization, and dashboard password; unlimited additional members with names and emails. Solo founders welcome.
3. Review, consent, and submission.

Stages: Idea Only / Prototype / MVP / Existing or Growing Business. Describe the idea, problem, solution, and target customers. Decks must be non-empty PDFs smaller than 3 MB. Account, application, original PDF, consent, and audit event save in one MongoDB transaction. Duplicate retries fingerprint both the details and PDF. Browser drafts exclude passwords, PDFs, and consent checkboxes.

Success: "Your application has been submitted successfully. Our team will review your startup and contact you if shortlisted."

Submit Your Startup → Application Review → Shortlisting → Pitch at LEAP 3.

New applications start Pending with zero fee. Only shortlisted startups are invited to pitch.

## Organizer dashboard

Sign in at `/login?role=admin`. Search/export applications, review startup descriptions and stages, download private PDF decks, inspect complete teams, keep private notes, and set Pending, Shortlisted, or Rejected. Stale edit protection and automatic refresh remain available.

Judge accounts, assignments, scoring, announcements, results, audit logs, and email tools remain available. Judges see assigned shortlisted startups without contact details or organizer notes. The original application deck is preserved if a shortlisted team uploads an updated deck during an optional pitch update window.

Legacy new/contacted/awaiting-confirmation statuses display as Pending. Confirmed registrations retain access as Shortlisted. Existing records need no backfill; historical payments remain intact. Retired payment endpoints return HTTP 410.

## Configuration and security

Configure dates, support contacts, and the registration deadline, then enable registration. Applications close automatically at the deadline. Existing dates and organizer access configuration remain intact. Times use Pakistan Standard Time. Judges display Announcing Soon.

The existing private owner configuration, trusted `npm run setup:admin` provisioning, SMTP outbox, validation, MongoDB policies, private file access, session authentication, rate limiting, and audit records are preserved. No public organizer signup is available. Never expose server secrets in client environment variables.

## Verification

Run `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:registration`, and `npm run test:integration:local`.

The integration verifier uses a disposable local MongoDB replica set. It checks required PDFs, six-member registration, concurrent retries, legacy compatibility, review statuses, file access, judge workflows, results, CSV, authentication, and deadlines. Production records are untouched. Run after building.

`npm run test:integration:local -- --preview` keeps a disposable preview on port 3100. Stop it to clean its isolated database.

## Deployment

The workspace is linked to Vercel project gutech-event at https://gutech-event.vercel.app. Preserve the existing server environment and Node.js runtime. The 3 MB deck limit leaves room below the request body ceiling.
