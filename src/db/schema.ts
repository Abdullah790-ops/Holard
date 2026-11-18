import { sql } from "drizzle-orm";
import {
  boolean, date, index, integer, jsonb, numeric, pgTable, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

export const ROLES = ["super_admin", "client_admin", "supervisor", "employee", "investor"] as const;
export type Role = (typeof ROLES)[number];
export const WORKER_STATUS = ["active", "leave", "terminated"] as const;
export const DOC_TYPES = ["passport", "emirates_id", "visa", "labour_card"] as const;
export type DocType = (typeof DOC_TYPES)[number];
export const CANDIDATE_STATUS = ["new", "interviewed", "selected", "rejected", "deployed"] as const;
export const ENQUIRY_STATUS = ["new", "in_progress", "done", "approved", "rejected"] as const;

// ── Identity ───────────────────────────────────────────
export const users = pgTable("users", {
  id: id(),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  passwordHash: text("password_hash"),
  role: text("role").$type<Role>().notNull(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  workerId: uuid("worker_id").references(() => workers.id, { onDelete: "set null" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }), // supervisors: limit to one site
  status: text("status").$type<"active" | "disabled">().notNull().default("active"),
  mustChangePassword: boolean("must_change_password").notNull().default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [
  uniqueIndex("users_email_uq").on(sql`lower(${t.email})`),
  uniqueIndex("users_phone_uq").on(t.phone),
]);

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256 of the cookie token
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  ip: text("ip"),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
});

export const otpCodes = pgTable("otp_codes", {
  id: id(),
  phone: text("phone").notNull(),
  codeHash: text("code_hash").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
}, (t) => [index("otp_phone_idx").on(t.phone)]);

export const passwordResets = pgTable("password_resets", {
  id: text("id").primaryKey(), // sha256 of token
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// ── Organisations ──────────────────────────────────────
export const clients = pgTable("clients", {
  id: id(),
  name: text("name").notNull(),
  short: text("short"),
  trn: text("trn"),
  industry: text("industry"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  address: text("address"),
  contractedHeadcount: integer("contracted_headcount").notNull().default(0),
  monthlyRate: numeric("monthly_rate", { precision: 12, scale: 2 }),
  dailyRate: numeric("daily_rate", { precision: 12, scale: 2 }),
  billingBasis: text("billing_basis").$type<"per_day" | "per_month">().notNull().default("per_day"),
  otRate: numeric("ot_rate", { precision: 10, scale: 2 }), // AED per overtime hour billed to client
  paymentTermsDays: integer("payment_terms_days").notNull().default(30),
  status: text("status").$type<"active" | "inactive">().notNull().default("active"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const sites = pgTable("sites", {
  id: id(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  emirate: text("emirate"),
  address: text("address"),
  latitude: numeric("latitude", { precision: 9, scale: 6 }),
  longitude: numeric("longitude", { precision: 9, scale: 6 }),
  checkinMode: text("checkin_mode").$type<"both" | "self" | "supervisor">().notNull().default("both"),
  radiusMeters: integer("radius_meters").notNull().default(300),
  requireSelfie: boolean("require_selfie").notNull().default(false),
  status: text("status").$type<"active" | "inactive">().notNull().default("active"),
  createdAt: createdAt(),
}, (t) => [index("sites_client_idx").on(t.clientId)]);

// ── Workforce ──────────────────────────────────────────
export const workers = pgTable("workers", {
  id: id(),
  dsNumber: integer("ds_number").notNull(),
  fullName: text("full_name").notNull(),
  photoFileId: uuid("photo_file_id"),
  nationality: text("nationality"),
  jobTitle: text("job_title"),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "set null" }),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  phone: text("phone"),
  whatsapp: text("whatsapp"),
  emergencyName: text("emergency_name"),
  emergencyPhone: text("emergency_phone"),
  joiningDate: date("joining_date"),
  basicSalary: numeric("basic_salary", { precision: 12, scale: 2 }),
  overtimeRate: numeric("overtime_rate", { precision: 12, scale: 2 }),
  status: text("status").$type<(typeof WORKER_STATUS)[number]>().notNull().default("active"),
  shiftId: uuid("shift_id"),
  personId: text("person_id"),          // MOHRE person code (14 digits) — used in WPS SIF
  iban: text("iban"),                   // bank account IBAN or salary card number
  routingCode: text("routing_code"),    // WPS agent / bank routing code (9 digits)
  candidateId: uuid("candidate_id"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("workers_ds_uq").on(t.dsNumber),
  index("workers_client_idx").on(t.clientId),
  index("workers_site_idx").on(t.siteId),
  index("workers_status_idx").on(t.status),
  index("workers_name_idx").on(t.fullName),
]);

export const workerDocuments = pgTable("worker_documents", {
  id: id(),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  type: text("type").$type<DocType>().notNull(),
  number: text("number"),
  issueDate: date("issue_date"),
  expiryDate: date("expiry_date"),
  fileId: uuid("file_id"),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("worker_docs_uq").on(t.workerId, t.type),
  index("worker_docs_expiry_idx").on(t.expiryDate),
]);

export const files = pgTable("files", {
  id: id(),
  storageKey: text("storage_key").notNull(),
  filename: text("filename").notNull(),
  mime: text("mime").notNull(),
  size: integer("size").notNull(),
  ownerType: text("owner_type").notNull(), // worker | candidate | enquiry
  ownerId: uuid("owner_id"),
  uploadedBy: uuid("uploaded_by"),
  createdAt: createdAt(),
});

// ── Recruitment & inbound ──────────────────────────────
export const candidates = pgTable("candidates", {
  id: id(),
  reference: text("reference").notNull(),
  fullName: text("full_name").notNull(),
  nationality: text("nationality"),
  age: integer("age"),
  phone: text("phone"),
  location: text("location"),
  jobWanted: text("job_wanted"),
  experienceYears: integer("experience_years"),
  passportFileId: uuid("passport_file_id"),
  cvFileId: uuid("cv_file_id"),
  photoFileId: uuid("photo_file_id"),
  status: text("status").$type<(typeof CANDIDATE_STATUS)[number]>().notNull().default("new"),
  notes: text("notes"),
  workerId: uuid("worker_id"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("candidates_status_idx").on(t.status), index("candidates_created_idx").on(t.createdAt)]);

export const enquiries = pgTable("enquiries", {
  id: id(),
  reference: text("reference").notNull(),
  type: text("type").notNull(), // hire | contact | review | investor | careers
  name: text("name"),
  email: text("email"),
  phone: text("phone"),
  company: text("company"),
  data: jsonb("data").$type<Record<string, string | number>>().notNull(),
  fileIds: jsonb("file_ids").$type<string[]>().notNull().default([]),
  status: text("status").$type<(typeof ENQUIRY_STATUS)[number]>().notNull().default("new"),
  createdAt: createdAt(),
}, (t) => [index("enquiries_type_idx").on(t.type, t.status)]);

export const jobs = pgTable("jobs", {
  id: id(),
  title: text("title").notNull(),
  salary: text("salary"),
  location: text("location"),
  type: text("type").notNull().default("Full-time"),
  description: text("description"),
  isPublished: boolean("is_published").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: createdAt(),
});

export const auditEvents = pgTable("audit_events", {
  id: id(),
  actorId: uuid("actor_id"),
  action: text("action").notNull(),
  resourceType: text("resource_type"),
  resourceId: text("resource_id"),
  meta: jsonb("meta").$type<Record<string, unknown>>(),
  createdAt: createdAt(),
}, (t) => [index("audit_created_idx").on(t.createdAt)]);

// ── Attendance & approvals (Phase 2B) ─────────────────
export const ATTENDANCE_STATUS = ["P", "A", "L", "OFF"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];
export const REQUEST_STATUS = ["pending", "supervisor_approved", "approved", "rejected", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUS)[number];
export const LEAVE_TYPES = ["annual", "sick", "emergency", "unpaid"] as const;

export const shifts = pgTable("shifts", {
  id: id(),
  name: text("name").notNull(),
  startTime: text("start_time").notNull(), // "08:00" Dubai time
  endTime: text("end_time").notNull(),     // "17:00" (may be next day for night shifts)
  standardHours: numeric("standard_hours", { precision: 4, scale: 2 }).notNull().default("8"),
  graceMinutes: integer("grace_minutes").notNull().default(15),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: createdAt(),
});

export const attendance = pgTable("attendance", {
  id: id(),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  date: date("date").notNull(), // Dubai calendar day
  status: text("status").$type<AttendanceStatus>().notNull(),
  siteId: uuid("site_id"),
  shiftId: uuid("shift_id"),
  checkInAt: timestamp("check_in_at", { withTimezone: true }),
  checkOutAt: timestamp("check_out_at", { withTimezone: true }),
  checkInLat: numeric("check_in_lat", { precision: 9, scale: 6 }),
  checkInLng: numeric("check_in_lng", { precision: 9, scale: 6 }),
  checkInAccuracy: integer("check_in_accuracy"),
  distanceMeters: integer("distance_meters"),
  outsideSite: boolean("outside_site").notNull().default(false),
  late: boolean("late").notNull().default(false),
  selfieFileId: uuid("selfie_file_id"),
  workedHours: numeric("worked_hours", { precision: 5, scale: 2 }),
  overtimeHours: numeric("overtime_hours", { precision: 5, scale: 2 }).notNull().default("0"),
  source: text("source").$type<"self" | "supervisor" | "admin" | "leave">().notNull(),
  markedBy: uuid("marked_by"),
  note: text("note"),
  correctedBy: uuid("corrected_by"),
  correctedAt: timestamp("corrected_at", { withTimezone: true }),
  correctionReason: text("correction_reason"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("attendance_worker_date_uq").on(t.workerId, t.date),
  index("attendance_date_idx").on(t.date),
]);

const approvalCols = () => ({
  status: text("status").$type<RequestStatus>().notNull().default("pending"),
  supervisorId: uuid("supervisor_id"),
  supervisorAt: timestamp("supervisor_at", { withTimezone: true }),
  supervisorNote: text("supervisor_note"),
  adminId: uuid("admin_id"),
  adminAt: timestamp("admin_at", { withTimezone: true }),
  adminNote: text("admin_note"),
  createdBy: uuid("created_by"),
  createdAt: createdAt(),
});

export const leaveRequests = pgTable("leave_requests", {
  id: id(),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  type: text("type").$type<(typeof LEAVE_TYPES)[number]>().notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  days: integer("days").notNull(),
  reason: text("reason"),
  attachmentFileId: uuid("attachment_file_id"),
  ...approvalCols(),
}, (t) => [index("leave_worker_idx").on(t.workerId), index("leave_status_idx").on(t.status)]);

export const overtimeRequests = pgTable("overtime_requests", {
  id: id(),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  hours: numeric("hours", { precision: 4, scale: 2 }).notNull(),
  reason: text("reason"),
  ...approvalCols(),
}, (t) => [index("ot_worker_idx").on(t.workerId), index("ot_status_idx").on(t.status)]);

export const advanceRequests = pgTable("advance_requests", {
  id: id(),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  repaymentMonths: integer("repayment_months").notNull().default(1),
  repaidAmount: numeric("repaid_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  reason: text("reason"),
  ...approvalCols(),
}, (t) => [index("adv_worker_idx").on(t.workerId), index("adv_status_idx").on(t.status)]);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: updatedAt(),
});

// ── Payroll & invoicing (Phase 2C) ────────────────────
const money = (name: string) => numeric(name, { precision: 14, scale: 2 }).notNull().default("0");

export const payrollRuns = pgTable("payroll_runs", {
  id: id(),
  month: text("month").notNull(), // YYYY-MM
  clientId: uuid("client_id"),    // null = all workers
  status: text("status").$type<"draft" | "approved" | "paid">().notNull().default("draft"),
  workers: integer("workers").notNull().default(0),
  gross: money("gross"),
  deductions: money("deductions"),
  net: money("net"),
  notes: text("notes"),
  createdBy: uuid("created_by"),
  approvedBy: uuid("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("payroll_month_idx").on(t.month)]);

export const payrollLines = pgTable("payroll_lines", {
  id: id(),
  runId: uuid("run_id").notNull().references(() => payrollRuns.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id").notNull().references(() => workers.id, { onDelete: "restrict" }),
  month: text("month").notNull(),
  // snapshot (so payslips never change after approval)
  dsNumber: integer("ds_number").notNull(),
  fullName: text("full_name").notNull(),
  jobTitle: text("job_title"),
  clientName: text("client_name"),
  siteName: text("site_name"),
  personId: text("person_id"),
  iban: text("iban"),
  routingCode: text("routing_code"),
  // inputs
  basic: money("basic"),
  dayBasis: integer("day_basis").notNull().default(30),
  presentDays: integer("present_days").notNull().default(0),
  absentDays: integer("absent_days").notNull().default(0),
  paidLeaveDays: integer("paid_leave_days").notNull().default(0),
  unpaidLeaveDays: integer("unpaid_leave_days").notNull().default(0),
  offDays: integer("off_days").notNull().default(0),
  unmarkedDays: integer("unmarked_days").notNull().default(0),
  otHours: numeric("ot_hours", { precision: 6, scale: 2 }).notNull().default("0"),
  otHourlyRate: money("ot_hourly_rate"),
  // results
  otPay: money("ot_pay"),
  allowances: money("allowances"),
  absenceDeduction: money("absence_deduction"),
  advanceDeduction: money("advance_deduction"),
  otherDeductions: money("other_deductions"),
  gross: money("gross"),
  net: money("net"),
  note: text("note"),
}, (t) => [
  uniqueIndex("payroll_line_run_worker_uq").on(t.runId, t.workerId),
  index("payroll_line_worker_idx").on(t.workerId, t.month),
]);

export const invoices = pgTable("invoices", {
  id: id(),
  number: integer("number").notNull(),
  clientId: uuid("client_id").notNull().references(() => clients.id, { onDelete: "restrict" }),
  month: text("month").notNull(),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").$type<"draft" | "sent" | "paid" | "void">().notNull().default("draft"),
  clientName: text("client_name").notNull(),
  clientTrn: text("client_trn"),
  clientAddress: text("client_address"),
  subtotal: money("subtotal"),
  vatRate: numeric("vat_rate", { precision: 5, scale: 2 }).notNull().default("5"),
  vatAmount: money("vat_amount"),
  total: money("total"),
  paidAmount: money("paid_amount"),
  notes: text("notes"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("invoice_number_uq").on(t.number), index("invoice_client_idx").on(t.clientId, t.month)]);

export const invoiceLines = pgTable("invoice_lines", {
  id: id(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  kind: text("kind").$type<"labour" | "overtime" | "adjustment">().notNull(),
  siteName: text("site_name"),
  description: text("description").notNull(),
  workers: integer("workers"),
  quantity: numeric("quantity", { precision: 12, scale: 2 }).notNull(), // days / hours / 1
  unit: text("unit").notNull(), // "day" | "hour" | "month" | "item"
  rate: money("rate"),
  amount: money("amount"),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const invoiceWorkers = pgTable("invoice_workers", {
  id: id(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id"),
  dsNumber: integer("ds_number").notNull(),
  fullName: text("full_name").notNull(),
  siteName: text("site_name"),
  days: integer("days").notNull(),
  otHours: numeric("ot_hours", { precision: 6, scale: 2 }).notNull().default("0"),
});

export const invoicePayments = pgTable("invoice_payments", {
  id: id(),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  amount: money("amount"),
  date: date("date").notNull(),
  method: text("method").notNull(), // bank transfer, cheque, cash
  reference: text("reference"),
  createdBy: uuid("created_by"),
  createdAt: createdAt(),
});

// ── Portals (Phase 2D) ─────────────────────────────────
export const REQUEST_TYPES = ["new_workers", "replacement", "complaint", "salary", "accommodation", "documents", "other"] as const;
export type PortalRequestType = (typeof REQUEST_TYPES)[number];

/** Requests & complaints from clients (new workers, replacement, complaint) and employees (help desk). */
export const portalRequests = pgTable("portal_requests", {
  id: id(),
  reference: text("reference").notNull(),
  type: text("type").$type<PortalRequestType>().notNull(),
  clientId: uuid("client_id").references(() => clients.id, { onDelete: "cascade" }),
  workerId: uuid("worker_id").references(() => workers.id, { onDelete: "cascade" }),
  siteId: uuid("site_id"),
  createdBy: uuid("created_by").notNull(),
  subject: text("subject").notNull(),
  details: text("details"),
  quantity: integer("quantity"),
  category: text("category"),
  startDate: date("start_date"),
  status: text("status").$type<"new" | "in_progress" | "resolved" | "closed">().notNull().default("new"),
  reply: text("reply"),
  repliedBy: uuid("replied_by"),
  repliedAt: timestamp("replied_at", { withTimezone: true }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [index("preq_client_idx").on(t.clientId), index("preq_worker_idx").on(t.workerId), index("preq_status_idx").on(t.status)]);

export const AUDIENCES = ["all", "employees", "supervisors", "clients", "investors"] as const;
export const announcements = pgTable("announcements", {
  id: id(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  audience: text("audience").$type<(typeof AUDIENCES)[number]>().notNull().default("all"),
  isPublished: boolean("is_published").notNull().default(true),
  expiresOn: date("expires_on"),
  createdBy: uuid("created_by"),
  createdAt: createdAt(),
});

/** Documents shared with investors. Admin controls visibility per document. */
export const investorDocuments = pgTable("investor_documents", {
  id: id(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  fileId: uuid("file_id").notNull(),
  notes: text("notes"),
  isVisible: boolean("is_visible").notNull().default(false),
  createdBy: uuid("created_by"),
  createdAt: createdAt(),
});

/** Monthly investor update letters. */
export const investorUpdates = pgTable("investor_updates", {
  id: id(),
  month: text("month").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdBy: uuid("created_by"),
  createdAt: createdAt(),
});
