CREATE TABLE "advance_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"repayment_months" integer DEFAULT 1 NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"supervisor_id" uuid,
	"supervisor_at" timestamp with time zone,
	"supervisor_note" text,
	"admin_id" uuid,
	"admin_at" timestamp with time zone,
	"admin_note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"date" date NOT NULL,
	"status" text NOT NULL,
	"site_id" uuid,
	"shift_id" uuid,
	"check_in_at" timestamp with time zone,
	"check_out_at" timestamp with time zone,
	"check_in_lat" numeric(9, 6),
	"check_in_lng" numeric(9, 6),
	"check_in_accuracy" integer,
	"distance_meters" integer,
	"outside_site" boolean DEFAULT false NOT NULL,
	"late" boolean DEFAULT false NOT NULL,
	"selfie_file_id" uuid,
	"worked_hours" numeric(5, 2),
	"overtime_hours" numeric(5, 2) DEFAULT '0' NOT NULL,
	"source" text NOT NULL,
	"marked_by" uuid,
	"note" text,
	"corrected_by" uuid,
	"corrected_at" timestamp with time zone,
	"correction_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leave_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"type" text NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"days" integer NOT NULL,
	"reason" text,
	"attachment_file_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"supervisor_id" uuid,
	"supervisor_at" timestamp with time zone,
	"supervisor_note" text,
	"admin_id" uuid,
	"admin_at" timestamp with time zone,
	"admin_note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "overtime_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_id" uuid NOT NULL,
	"date" date NOT NULL,
	"hours" numeric(4, 2) NOT NULL,
	"reason" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"supervisor_id" uuid,
	"supervisor_at" timestamp with time zone,
	"supervisor_note" text,
	"admin_id" uuid,
	"admin_at" timestamp with time zone,
	"admin_note" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"standard_hours" numeric(4, 2) DEFAULT '8' NOT NULL,
	"grace_minutes" integer DEFAULT 15 NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "checkin_mode" text DEFAULT 'both' NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "radius_meters" integer DEFAULT 300 NOT NULL;--> statement-breakpoint
ALTER TABLE "sites" ADD COLUMN "require_selfie" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "site_id" uuid;--> statement-breakpoint
ALTER TABLE "workers" ADD COLUMN "shift_id" uuid;--> statement-breakpoint
ALTER TABLE "advance_requests" ADD CONSTRAINT "advance_requests_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leave_requests" ADD CONSTRAINT "leave_requests_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "overtime_requests" ADD CONSTRAINT "overtime_requests_worker_id_workers_id_fk" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "adv_worker_idx" ON "advance_requests" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "adv_status_idx" ON "advance_requests" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "attendance_worker_date_uq" ON "attendance" USING btree ("worker_id","date");--> statement-breakpoint
CREATE INDEX "attendance_date_idx" ON "attendance" USING btree ("date");--> statement-breakpoint
CREATE INDEX "leave_worker_idx" ON "leave_requests" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "leave_status_idx" ON "leave_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "ot_worker_idx" ON "overtime_requests" USING btree ("worker_id");--> statement-breakpoint
CREATE INDEX "ot_status_idx" ON "overtime_requests" USING btree ("status");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_site_id_sites_id_fk" FOREIGN KEY ("site_id") REFERENCES "public"."sites"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
INSERT INTO "shifts" ("name", "start_time", "end_time", "standard_hours", "grace_minutes", "is_default") VALUES ('Day', '08:00', '17:00', '8', 15, true), ('Night', '20:00', '05:00', '8', 15, false);
--> statement-breakpoint
INSERT INTO "settings" ("key", "value") VALUES ('attendance', '{"weeklyOff":"Friday","checkoutReminderHours":12}'), ('leave', '{"annualDays":30}'), ('overtime', '{"normalMultiplier":1.25,"nightMultiplier":1.5}') ON CONFLICT DO NOTHING;
