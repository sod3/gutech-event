# BuildFest 2026

A working Next.js App Router application for GUtech Entrepreneurship Society’s innovation hackathon, powered by ArtDera. White visual design, secure team registration, MongoDB persistence, participant and organizer dashboards, judge workspaces, and fast three-step registration and organizer WhatsApp follow-up.

## Run locally

```powershell
npm install
npm run dev
```

Open the Local URL printed by Next.js (normally `http://localhost:3000`). The provided MongoDB connection is already configured in the ignored `.env.local`. Never commit this file or copy the connection string into browser code. The application uses the separate `buildfest2026` database by default.

For a fresh checkout, copy `.env.example` to `.env.local` and supply `MONGODB_URI`, `MONGODB_DB`, and `APP_URL`.

## Private owner admin credentials

Set `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` together in the server environment to restrict all organizer login and session access to one owner. The hash must be bcrypt with cost 12. Store it as `bcrypt:<base64url-encoded bcrypt hash>` so Next.js environment expansion preserves its dollar signs. The plaintext `ADMIN_PASSWORD` is kept only in the ignored `.env.local` file for the owner to retrieve; the application never uses or sends it to the browser. Vercel stores the email and hash as sensitive server-only environment variables. Never use `NEXT_PUBLIC_` for these values.

The owner's first successful sign-in provisions the admin record in the existing database. A changed environment hash rotates the owner credentials and revokes old owner sessions. Other database admin accounts and their existing sessions are denied by the owner restriction. Existing participant and judge accounts continue to work; an email belonging to one of those accounts is never automatically promoted. A partial owner configuration fails closed. This setup requires a working database connection.

## Provision the first organizer

```powershell
npm run setup:admin
```

Enter the real organizer’s email, name, and a strong password (at least 12 characters, no more than 72 UTF-8 bytes). The password is masked in the terminal and stored as a bcrypt hash. The command does not create default credentials, does not overwrite existing accounts, and records provisioning in the audit log. Then sign in at `/login?role=admin`.

Without an environment-configured owner, organizer accounts can be provisioned by this trusted CLI. When the owner restriction is configured, only the configured owner can access the organizer dashboard. There is no public admin signup or bootstrap endpoint. Judges are provisioned by an authenticated organizer from **Projects & judging**.

## Configure before opening registration

The organizer dashboard at `/admin` contains:

- Official event date, registration deadline, project deadline, and five timeline phase dates. Input and display use Pakistan Standard Time (UTC +05:00).
- Official support email and optional WhatsApp number.
- An organizer-approved refund policy.
- Verified prizes and verified public mentor/judge profiles. Unverified items stay off the public site.
- Official organizer and partner logos, stored as MongoDB binary documents.
- The explicit **Enable team registration** switch.

Registration opens when the organizer enables it and configures an official registration deadline. Payment settings, support email, and a refund policy are not prerequisites for submission. Signups close automatically at the registration deadline. Event dates, prize values, logos, and people are never invented.

The confirmed event date is **30 October 2026**. Registration closes automatically on **30 October 2026 at 11:59 PM PKT**. The website, countdown, registration form, rules, team dashboard, and confirmation ticket read the shared event settings. These dates are also the defaults for a fresh checkout; existing database settings must be updated separately.

## Registration workflow

1. **Team:** team name, leader name, any valid email, WhatsApp number, university/college, department, size (1–3 including the leader), and a dashboard password.
2. **Members:** dynamically collect names and emails for up to two additional members.
3. **Review & Submit:** edit details, consent to WhatsApp contact, accept event rules, and select **Complete Registration →**.

The account, team, registration ID, consent timestamp, and audit event are saved in one MongoDB transaction. Registration status starts as **New Registration**. `/register/success` reads the saved team through its authenticated leader session, including after a refresh. No payment reference, receipt, or payment method is required. The displayed fee remains **PKR 1,500 per team**. Organizers contact leaders on WhatsApp to share next steps and fee instructions.

University/college is required for new registrations and appears in organizer listings, search, team details, and CSV exports. Existing registrations remain valid without this field and are not asked to supply it.

The admin dashboard lists full registrations, registration dates, members, university/college, department, international WhatsApp number, and status. It refreshes saved registrations every ten seconds and on window focus. Search/filter registrations, export CSV, add private internal notes, and manually select **New Registration**, **Contacted**, **Awaiting Confirmation**, or **Confirmed**. The green **Contact on WhatsApp** link opens the requested personalized message; the organizer chooses when to send it. Internal notes are excluded from participant and judge responses.

A persisted request ID and transactional unique indexes prevent repeated clicks and response-loss retries from creating duplicate accounts or teams. Names and all participant emails remain unique. Pakistan mobile formats normalize to `+923xxxxxxxxx`; other countries require an international prefix. Existing records, authentication, payment history, and project data remain intact. Previously confirmed teams retain access. Manual registration confirmation does not mark a team paid. The obsolete payment-review and payment-resubmission endpoints are retired with HTTP 410 and cannot change stored payment records.

## Participant & judge features

`/dashboard` shows team members, registration status, announcements, deadlines, a persistent progress checklist, private team invitation links, rules, and a builder’s toolkit. Confirmed leaders can save/edit problem statements, solutions, research, prototype URLs, pitch URLs, private PDF pitch decks, and AI declarations. Final submissions remain editable until the official deadline; published results lock further project changes.

`/dashboard/confirmation` is accessible only to a confirmed team leader. Use **Print / save as PDF** to download the confirmation through the browser.

`/judge` shows only the projects assigned to that judge. Judges cannot access participant contact details or payment receipts. Scores are validated against the exact 30/25/20/10/10/5 rubric. Organizers can make audited score corrections, assign/unassign judges, and approve results. Results can be published only after the submission deadline and when every final project has complete scores from all assigned judges. A tied score receives the same rank. Publication locks scoring and assignment changes until results are unpublished.

## Email delivery

Supply official SMTP configuration in the server environment:

```text
SMTP_HOST
SMTP_PORT=587
SMTP_USER
SMTP_PASSWORD
SMTP_FROM
```

Use port `465` for implicit TLS; port `587` uses the provider’s STARTTLS behavior. `SMTP_FROM` must be an address the organizer is authorized to send from. Each team member receives a confirmation after an organizer manually confirms registration. Email outbox entries have a unique team/member key and are claimed atomically before dispatch. Missing credentials result in **unconfigured** entries, never a fake “sent” state. Check **Audit & email** to retry failed or queued delivery after configuration.

SMTP does not provide exactly-once delivery guarantees. A process interruption during a send may leave a `sending` job that requires checking the mail provider before manually requeuing it. This intentionally avoids automatic duplicate sends.

## Security & storage

- Server-only MongoDB access; no database URI or organizer secrets enter client bundles.
- Random 256-bit bearer sessions stored only as SHA-256 hashes in MongoDB. HTTP-only, SameSite cookies; Secure cookies in production; seven-day expiry and logout revocation.
- Role checks at every protected data endpoint, independent of page access.
- Zod validation on the server, MongoDB unique indexes and strict collection validators, shared database-backed rate limits, same-origin mutation checks, and size/signature checks for uploads. Database validators enforce team sizes, the PKR 1,500 fee, allowed roles/registration states and legacy payment states, file types/sizes, and scorecard shape.
- Receipts and decks are MongoDB binary records, not public object-storage URLs. Access is scoped to the team leader, authorized organizer, or assigned judge (decks only). Downloads use attachment and no-store headers. Official logos are the only publicly served uploaded files.
- CSV output escapes spreadsheet-formula prefixes.
- Security headers, reduced-motion support, accessible labels, visible focus states, server-rendered content, optimized fonts, SEO metadata, generated Open Graph artwork, robots rules, and sitemap.
- No production participant seed records, fabricated payment success, testimonials, or countdown dates.

Use a dedicated Atlas database user restricted to the event database and an appropriate Atlas network allowlist for the deployment. Keep Atlas administration privileges separate from the application’s runtime credential. Database backups and organization-specific retention/access policies should be managed by the event owner.

Code-defined visual assets (the icon, generated Open Graph card, and CSS sculpture) ship with the application; all user-uploaded media and durable application records live in MongoDB.

## Verification

```powershell
npm run typecheck
npm run build
npm run test:registration
npm run test:integration:local
```

`npm run test:integration:local` uses an installed MongoDB server in an isolated local replica set; set `MONGOD_PATH` if it is not discovered automatically. It never connects to production Atlas. `npm run test:integration` uses the connection in `.env.local` and requires access to create a disposable test database.

The integration verifier starts the production build on port 3100 and creates a uniquely named `buildfest_verify_*` database. It exercises actual HTTP endpoints and MongoDB transactions: access control, duplicate participants/team names, concurrent registration retries, WhatsApp validation/consent, all four admin statuses, private notes, legacy record compatibility, concurrent confirmation, confirmation emails pending configuration, private file access, submission validation/deadlines, judge assignment and scoring, result publication, CSV export, login rate limits, and logout. It drops only its generated verification database and verifies that production participant counts have not changed.

Run it only after `npm run build`. Set `VERIFY_PORT` if 3100 is occupied. `node --env-file=.env.local scripts/verify-workflow.mjs --preview` keeps the disposable verification site running for visual QA; Ctrl+C removes its test database. The normal development server continues to use the production event database. No test data is inserted there.

## Deploy to Vercel

1. Import this source into your Vercel project using the Next.js framework preset.
2. Set `MONGODB_URI`, `MONGODB_DB`, and the canonical HTTPS `APP_URL` in Vercel’s server environment. Add official SMTP variables when available.
3. Ensure the Atlas network policy allows connections from your deployment and the database user has access to the selected event database.
4. Build/deploy with `npm run build`. Keep the default Node.js runtime; MongoDB is not compatible with an Edge-only deployment.
5. Run `npm run setup:admin` against that same database using your trusted local environment, sign in to the deployed organizer dashboard, and complete the official event configuration.

The repository is ready for a Vercel deployment. The existing Vercel project is `gutech-event`, with canonical URL `https://gutech-event.vercel.app`. Configure its server environment before deploying. Never place secrets in `NEXT_PUBLIC_*` variables. The file limit stays below Vercel’s common request-body ceiling by accepting a maximum of 3 MB per upload.

## Project structure

- `src/app`: public routes, protected pages, metadata, and HTTP handlers.
- `src/components`: public experience, registration, and the three workspaces.
- `src/lib`: shared types, database collections/indexes, validation, session security, event data, private file handling, judging locks, and email outbox.
- `scripts/setup-admin.mjs`: trusted organizer provisioning.
- `scripts/verify-workflow.mjs`: isolated integration verification.
