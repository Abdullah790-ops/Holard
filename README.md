# HOLARD — Website (Phase 1)

"Architect A Workforce That Powers UAE Empire"

Next.js 15 + TypeScript + Tailwind CSS 4. Poppins headings and Inter body text are self-hosted, so the site makes no Google Fonts calls.

## Run

```bash
npm install
npm run seed:demo  # optional: 9 demo clients, 505 demo workers, last + this month's attendance (npm run demo:clear removes them)
npm run dev        # http://localhost:3000
```

Then open http://localhost:3000/login. The first time, it sends you to **/setup** to create the owner (Super Admin) account.

## Phase 2A: Back Office (`/admin`)
- **Login**: email + password, or phone + 6-digit OTP. In development the OTP is shown on screen; WhatsApp/SMS delivery arrives in 2E. Forgot password, a forced change of temporary passwords, 7-day sessions, and rate-limited attempts.
- **Roles**: Super Admin → `/admin`. Client Admin, Supervisor, Employee and Investor → `/portal` (full portals in 2D). Every page and action checks the role on the server.
- **Dashboard**: active / on leave / in pool, headcount by client vs contracted, by site, document alerts (expired / 7 / 15 / 30 days), pending items, quick actions.
- **Workers**: profile, auto DS code (DS001…), client & site, salary, OT rate, status, and 4 documents (passport, Emirates ID, visa, labour card) with file upload and expiry. Search and filters by client, site, nationality, job, status and expiry. Export to Excel.
- **Bulk import**: Excel template; every row is checked before anything is saved; up to 2,000 rows per file.
- **Clients & Sites**: TRN, contracted headcount, rates, contacts, sites with emirate and GPS point.
- **Candidates**: website applications with passport, CV and photo; statuses New → Interviewed → Selected → Rejected / Deployed; **Move to Worker** in one click.
- **Jobs**: add or edit jobs; they appear live on /candidates.
- **Inbox**: hire requests, messages, investor access requests, reviews (approve → shown on /testimonials), office job applications.
- **Users & Access**: create logins for each role, linked to a client or worker, with a one-time temporary password; disable or reset.
- **Audit log**: logins, changes, exports and file downloads.

## Phase 2B: Attendance + Leave
- **Worker check-in** (`/portal`, made for phones): GPS check-in and check-out with an optional selfie. A check-in further from the site than the allowed distance is still saved but flagged "outside site"; late is flagged using shift start + grace minutes. Night shifts can check out the next morning.
- **Per-site rules** (Clients → site → Check-in settings): workers + supervisor / workers only / supervisor only, site GPS point, allowed distance, selfie required.
- **Supervisor** (`/portal`): today's numbers per site, **bulk marking** (P / A / L / Off + OT hours for 50+ workers at once, "mark unmarked as present"), and step-1 approvals. Supervisors see only their client (and optionally one site) and can mark today plus the 2 previous days.
- **Admin daily attendance** (`/admin/attendance`): present / absent / leave / not marked / late / outside site, search, **manual correction** with a required reason (audited), and "set not-marked to absent".
- **Monthly sheet** (`/admin/attendance/sheet`): workers × days 1–31 with P / A / L / Off, overtime and totals, filtered by client or site, with an **Excel download** for client billing.
- **Leave, overtime, advance**: worker → supervisor → admin. Final approval of leave writes L days, but never over a day actually worked. Approved overtime is added to that day. Advances are deducted in payroll (2C). Leave balance follows UAE law: nothing before 6 months, 2 days per month up to 1 year, then 30 days a year (configurable).
- **Settings** (`/admin/settings`): shifts (day / night / custom, normal hours, late grace), weekly day off, annual leave days, overtime multipliers (1.25 / 1.5 per UAE law, used in 2C).

## Phase 2C: Payroll + Invoicing
- **Payroll** (`/admin/payroll`): pick a month (all workers or one client). Salaries are calculated from attendance:
  earned basic + overtime + allowances − absence (absent + unpaid-leave days × basic ÷ 30, or ÷ 26 if set) − advance instalments − other deductions.
  - Overtime = approved OT hours × the worker's own OT rate, or by UAE law basic ÷ 30 ÷ shift hours × 1.25.
  - Joining mid-month is pro-rated. Unmarked days are flagged, not deducted.
  - A draft can be recalculated and adjusted per worker (allowance, deduction, note). **Approve & lock** freezes the figures, records advance repayments and publishes payslips to workers. A worker can never be in two payrolls for the same month.
- **WPS SIF file**: EDR lines + SCR trailer, named `<establishment ID><YYMMDDHHMMSS>.SIF`. It needs the employer establishment ID and routing code (Settings), plus each worker's person ID, IBAN/card and routing code. Missing items are listed before approval. *Check the exact template with your WPS bank or exchange house before first use.*
- **Payslips**: PDF per worker (portal → Payslips), plus all payslips in one PDF for the admin. Payroll Excel export.
- **Gratuity** (`/admin/payroll/gratuity`): UAE law (21 days' basic per year for the first 5 years, then 30; nothing under 1 year; capped at 2 years' basic). Calculator, per-worker figure and total company liability.
- **Invoices** (`/admin/invoices`): created from attendance per client and month. For each site: days present × daily rate (or monthly rate, pro-rated) + overtime hours × client OT rate, then VAT 5%.
  - Numbered HOL-INV-001… The PDF includes an annex listing every worker's DS code and days, and the attendance sheet is available in Excel.
  - Flow: Draft (refresh from attendance, add discounts or extra lines, notes) → Mark as sent (locked) → record payments → Partial / Paid. Overdue is automatic after the due date. Void is allowed if nothing has been paid.
  - One invoice per client per month.
- **Dashboard → Money**: invoiced this month, paid, outstanding, overdue.
- Sending invoices or payslips by email or WhatsApp is manual (download the PDF) until Phase 2E.

Database: PostgreSQL via Drizzle ORM (`src/db/schema.ts`, migrations in `drizzle/`). Files: private, served only through `/api/files/:id` after a permission check.

## Where things live

| What | File |
|---|---|
| Phone, WhatsApp, email, address, socials, all numbers, clients, testimonials, jobs, FAQs, blog posts | `src/lib/site.ts` |
| Form fields (Hire, Apply, Contact, Review, Investor, Careers) | `src/lib/forms.ts` |
| Website form API → database (Candidates / Inbox) | `src/app/api/submit/route.ts` |
| Colours, fonts, buttons | `src/app/globals.css` |
| Photos and hero video | `public/images/`, `public/video/hero.mp4` |

## Pages
Home, About, Services (+3), Industries (+6), Our Clients, For Candidates, Testimonials, Investor Portal, Employee Portal, Contact, FAQ (25), Blog (+3), Careers, Privacy, Terms, Replacement Policy, Refund Policy, Login, 404, sitemap.xml, robots.txt.

## Before launch: needs real info (search `TODO`)
- Real phone, WhatsApp number, office address, social links, and the trade-licence name.
- Salary ranges for the jobs (only "Driver AED 2,500" was given).
- Pricing: the helper rate AED 3,500/month comes from the brief; AED 135/day is that rate ÷ 26 days. Other roles show "On request".
- Leadership names and photos, office photo and certificates. These are left empty on purpose.
- Written permission to use each client's name and testimonial. Worker testimonials (names and photos) are samples.
- Case study details beyond the brief, such as the challenge/solution wording.
- Google Reviews widget (needs a Place ID), plus the Company Profile and Pitch Deck PDFs.
- Legal pages are drafts that need UAE legal review.

## Media
Photos are from Unsplash and the hero video is Mixkit #23224. Both are free for commercial use.

## Next phases
2D Client / Employee / Investor portals · 2E WhatsApp, email, hosting and go-live.
