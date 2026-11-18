CREATE TABLE "invoice_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"site_name" text,
	"description" text NOT NULL,
	"workers" integer,
	"quantity" numeric(12, 2) NOT NULL,
	"unit" text NOT NULL,
	"rate" numeric(14, 2) DEFAULT '0' NOT NULL,
	"amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"date" date NOT NULL,
	"method" text NOT NULL,
	"reference" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_workers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"worker_id" uuid,
	"ds_number" integer NOT NULL,
	"full_name" text NOT NULL,
	"site_name" text,
	"days" integer NOT NULL,
	"ot_hours" numeric(6, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" integer NOT NULL,
	"client_id" uuid NOT NULL,
	"month" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"client_name" text NOT NULL,
	"client_trn" text,
	"client_address" text,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"vat_rate" numeric(5, 2) DEFAULT '5' NOT NULL,
	"vat_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"paid_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"sent_at" timestamp with time zone,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payroll_lines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"worker_id" uuid NOT NULL,
	"month" text NOT NULL,
	"ds_number" integer NOT NULL,
	"full_name" text NOT NULL,
	"job_title" text,
	"client_name" text,
	"site_name" text,
	"person_id" text,
	"iban" text,
	"routing_code" text,
	"basic" numeric(14, 2) DEFAULT '0' NOT NULL,
	"day_basis" integer DEFAULT 30 NOT NULL,
	"present_days" integer DEFAULT 0 NOT NULL,
	"absent_days" integer DEFAULT 0 NOT NULL,
	"paid_leave_days" integer DEFAULT 0 NOT NULL,
	"unpaid_leave_days" integer DEFAULT 0 NOT NULL,
	"off_days" integer DEFAULT 0 NOT NULL,
	"unmarked_days" integer DEFAULT 0 NOT NULL,
	"ot_hours" numeric(6, 2) DEFAULT '0' NOT NULL,
	"ot_hourly_rate" numeric(14, 2) DEFAULT '0' NOT NULL,
	"ot_pay" numeric(14, 2) DEFAULT '0' NOT NULL,
	"allowances" numeric(14, 2) DEFAULT '0' NOT NULL,
	"absence_deduction" numeric(14, 2) DEFAULT '0' NOT NULL,
	"advance_deduction" numeric(14, 2) DEFAULT '0' NOT NULL,
	"other_deductions" numeric(14, 2) DEFAULT '0' NOT NULL,
	"gross" numeric(14, 2) DEFAULT '0' NOT NULL,
	"net" numeric(14, 2) DEFAULT '0' NOT NULL,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "payroll_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"month" text NOT NULL,
	"client_id" uuid,
	"status" text DEFAULT 'draft' NOT NULL,
	"workers" integer DEFAULT 0 NOT NULL,
	"gross" numeric(14, 2) DEFAULT '0' NOT NULL,
	"deductions" numeric(14, 2) DEFAULT '0' NOT NULL,
	"net" numeric(14, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_by" uuid,
	"approved_by" uuid,
	"approved_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "advance_requests" ADD COLUMN "repaid_amount" numeric(10, 2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "billing_basis" text DEFAULT 'per_day' NOT NULL;--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "ot_rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "clients" ADD COLUMN "payment_terms_days" integer DEFAULT 30 NOT NULL;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "person_id" text;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "iban" text;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "routing_code" text;--> statement-breakpoint
ALTER TABLE "invoice_lines" ADD CONSTRAINT "invoice_lines_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_payments" ADD CONSTRAINT "invoice_payments_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_workers" ADD CONSTRAINT "invoice_workers_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_run_id_payroll_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."payroll_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payroll_lines" ADD CONSTRAINT "payroll_lines_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "invoice_number_uq" ON "invoices" USING btree ("number");--> statement-breakpoint
CREATE INDEX "invoice_client_idx" ON "invoices" USING btree ("client_id","month");--> statement-breakpoint
CREATE UNIQUE INDEX "payroll_line_run_worker_uq" ON "payroll_lines" USING btree ("run_id","worker_id");--> statement-breakpoint
CREATE INDEX "payroll_line_worker_idx" ON "payroll_lines" USING btree ("worker_id","month");--> statement-breakpoint
CREATE INDEX "payroll_month_idx" ON "payroll_runs" USING btree ("month");--> statement-breakpoint
INSERT INTO "settings" ("key", "value") VALUES ('payroll', '{"dayBasis":30,"establishmentId":"","employerRoutingCode":""}'), ('invoice', '{"vatRate":5,"paymentTermsDays":30,"companyName":"HOLARD","companyTrn":"","companyAddress":"","bankDetails":""}') ON CONFLICT DO NOTHING;
