# BuildFest 2026

A working Next.js App Router application for GUtech Entrepreneurship Society’s innovation hackathon, powered by ArtDera. White visual design, secure team registration, MongoDB persistence, participant and organizer dashboards, judge workspaces, and organizer-verified manual payments.

## Run locally

```powershell
npm install
npm run dev
```

Open the Local URL printed by Next.js (normally `http://localhost:3000`). The provided MongoDB connection is already configured in the ignored `.env.local`. Never commit this file or copy the connection string into browser code. The application uses the separate `buildfest2026` database by default.

For a fresh checkout, copy `.env.example` to `.env.local` and supply `MONGODB_URI`, `MONGODB_DB`, and `APP_URL`.

## Provision the first organizer

```powershell
npm run setup:admin
```

Enter the real organizer’s email, name, and a strong password (at least 12 characters, no more than 72 UTF-8 bytes). The password is masked in the terminal and stored as a bcrypt hash. The command does not create default credentials, does not overwrite existing accounts, and records provisioning in the audit log. Then sign in at `/login?role=admin`.

Organizer accounts can only be provisioned by this trusted CLI. There is no public admin signup or bootstrap endpoint. Judges are provisioned by an authenticated organizer from **Projects & judging**.

## Configure before opening registration

The organizer dashboard at `/admin` contains:

- Official event date, registration deadline, project deadline, and five timeline phase dates. Input and display use Pakistan Standard Time (UTC +05:00).
- Bank transfer, Easypaisa, JazzCash, or other manual transfer instructions. Add the actual receiving account title, number, and instructions; enable the method.
- Official support email and optional WhatsApp number.
- An organizer-approved refund policy.
- Verified prizes and verified public mentor/judge profiles. Unverified items stay off the public site.
- Official organizer and partner logos, stored as MongoDB binary documents.
- The explicit **Enable team registration** switch.

Registration stays closed until the required deadline, payment details, support email, and refund policy are configured. Signups close automatically at the registration deadline. Event dates, prize values, logos, and people are never invented.

## Payment workflow

1. The leader completes the four-step registration form with any valid email. Teams may have 1–3 members.
2. The leader follows an enabled official transfer method, supplies the transaction reference, and optionally uploads a PNG/JPEG/PDF receipt (up to 3 MB).
3. Registration creates the leader’s account, team, unique registration ID, receipt, and audit event in one MongoDB transaction. The fee is always PKR 1,500 for the whole team, and the status is always **Payment Pending**.
4. An organizer checks the receiving account and approves or rejects the payment. Approval and audit recording are transactional and guard against concurrent double processing.
5. Verified teams receive a printable confirmation and can submit projects. Rejected teams can correct their transaction details without creating a new registration.

There is **no integrated payment gateway**, automatic payment-success simulation, or payment-account placeholder in the production event settings. The current workflow is manual verification. If a gateway is added later, use that provider’s server-created payments and signature-verified callbacks; do not change a team’s status based on a client redirect.

Unique MongoDB indexes enforce team names, every participant email, registration IDs, and normalized references scoped to the payment method. A participant cannot register into a second team. An uploaded screenshot is never treated as successful payment.

## Participant & judge features

`/dashboard` shows team members, payment status, announcements, deadlines, a persistent progress checklist, private team invitation links, rules, and a builder’s toolkit. Confirmed leaders can save/edit problem statements, solutions, research, prototype URLs, pitch URLs, private PDF pitch decks, and AI declarations. Final submissions remain editable until the official deadline; published results lock further project changes.

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

Use port `465` for implicit TLS; port `587` uses the provider’s STARTTLS behavior. `SMTP_FROM` must be an address the organizer is authorized to send from. Each team member receives a confirmation after payment verification. Email outbox entries have a unique team/member key and are claimed atomically before dispatch. Missing credentials result in **unconfigured** entries, never a fake “sent” state. Check **Audit & email** to retry failed or queued delivery after configuration.

SMTP does not provide exactly-once delivery guarantees. A process interruption during a send may leave a `sending` job that requires checking the mail provider before manually requeuing it. This intentionally avoids automatic duplicate sends.

## Security & storage

- Server-only MongoDB access; no database URI or organizer secrets enter client bundles.
- Random 256-bit bearer sessions stored only as SHA-256 hashes in MongoDB. HTTP-only, SameSite cookies; Secure cookies in production; seven-day expiry and logout revocation.
- Role checks at every protected data endpoint, independent of page access.
- Zod validation on the server, MongoDB unique indexes and strict collection validators, shared database-backed rate limits, same-origin mutation checks, and size/signature checks for uploads. Database validators enforce team sizes, the PKR 1,500 fee, allowed roles/payment states, file types/sizes, and scorecard shape.
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
npm run test:integration
```

The integration verifier starts the production build on port 3100 and creates a uniquely named `buildfest_verify_*` database. It exercises actual HTTP endpoints and MongoDB transactions: access control, duplicate participants/references, registration, rejection/resubmission, concurrent payment approvals, confirmation emails pending configuration, private file access, submission validation/deadlines, judge assignment and scoring, result publication, CSV export, login rate limits, and logout. It drops only its generated verification database and verifies that production participant counts have not changed.

Run it only after `npm run build`. Set `VERIFY_PORT` if 3100 is occupied. `node --env-file=.env.local scripts/verify-workflow.mjs --preview` keeps the disposable verification site running for visual QA; Ctrl+C removes its test database. The normal development server continues to use the production event database. No test data is inserted there.

## Deploy to Vercel

1. Import this source into your Vercel project using the Next.js framework preset.
2. Set `MONGODB_URI`, `MONGODB_DB`, and the canonical HTTPS `APP_URL` in Vercel’s server environment. Add official SMTP variables when available.
3. Ensure the Atlas network policy allows connections from your deployment and the database user has access to the selected event database.
4. Build/deploy with `npm run build`. Keep the default Node.js runtime; MongoDB is not compatible with an Edge-only deployment.
5. Run `npm run setup:admin` against that same database using your trusted local environment, sign in to the deployed organizer dashboard, and complete the official event configuration.

The repository is ready for a Vercel deployment. A hosting account/project and canonical public URL are still needed to publish it. Never place secrets in `NEXT_PUBLIC_*` variables. The file limit stays below Vercel’s common request-body ceiling by accepting a maximum of 3 MB per upload.

## Project structure

- `src/app`: public routes, protected pages, metadata, and HTTP handlers.
- `src/components`: public experience, registration, and the three workspaces.
- `src/lib`: shared types, database collections/indexes, validation, session security, event data, private file handling, judging locks, and email outbox.
- `scripts/setup-admin.mjs`: trusted organizer provisioning.
- `scripts/verify-workflow.mjs`: isolated integration verification.
