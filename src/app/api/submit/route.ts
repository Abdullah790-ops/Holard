import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { forms } from "@/lib/forms";
import { getDb, schema } from "@/db";
import { FileError, saveFile } from "@/server/storage";
import { rateLimited } from "@/server/ratelimit";
import { clientIp } from "@/server/ip";

// Public website forms → database. Applications become Candidates; everything else lands in the admin Inbox.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+\d][\d\s()-]{6,19}$/;
const PREFIX: Record<string, string> = { consultation: "CON", hire: "HIR", apply: "APP", contact: "MSG", review: "REV", investor: "INV", careers: "CAR" };

// The largest form (job application) has 3 files of up to 5 MB each.
const MAX_BODY = 17 * 1024 * 1024;

export async function POST(req: Request) {
  const ip = clientIp(req.headers);
  if (rateLimited(`submit:${ip}`, 10, 10 * 60_000)) return NextResponse.json({ error: "Too many submissions. Please try again later." }, { status: 429 });
  // Refuse huge bodies BEFORE reading them into memory (a 2 GB upload would otherwise crash the server).
  const len = Number(req.headers.get("content-length") ?? NaN);
  if (!Number.isFinite(len) || len > MAX_BODY) return NextResponse.json({ error: "Upload too large. Each file must be under 5 MB." }, { status: 413 });
  if (!(req.headers.get("content-type") ?? "").startsWith("multipart/form-data")) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  let fd: FormData;
  try { fd = await req.formData(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }

  const type = String(fd.get("_type") ?? "");
  const def = Object.hasOwn(forms, type) ? forms[type] : undefined;
  if (!def) return NextResponse.json({ error: "Unknown form." }, { status: 400 });
  const reference = `${PREFIX[type]}-${Date.now().toString(36).toUpperCase()}`;
  if (String(fd.get("website") ?? "")) return NextResponse.json({ reference }); // honeypot: pretend success

  const errors: Record<string, string> = {};
  const data: Record<string, string | number> = {};
  const files: { field: string; file: File }[] = [];
  for (const f of def.fields) {
    const v = fd.get(f.name);
    if (f.type === "file") {
      const file = v instanceof File && v.size > 0 ? v : null;
      if (!file) { if (f.required) errors[f.name] = "Please upload this file."; continue; }
      if (file.size > 5 * 1024 * 1024) { errors[f.name] = "File must be under 5 MB."; continue; }
      files.push({ field: f.name, file });
      continue;
    }
    const s = typeof v === "string" ? v.trim().slice(0, 4000) : "";
    if (!s) { if (f.required) errors[f.name] = "This field is required."; continue; }
    if (f.type === "email" && !EMAIL.test(s)) errors[f.name] = "Enter a valid email.";
    if (f.type === "date") {
      const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
      if (!/^\d{4}-\d{2}-\d{2}$/.test(s) || Number.isNaN(Date.parse(s))) errors[f.name] = "Choose a valid date.";
      else if (s < today) errors[f.name] = "Choose today or a future date.";
    }
    if (f.type === "tel" && !PHONE.test(s)) errors[f.name] = "Enter a valid phone number.";
    if (f.type === "number" || f.type === "rating") {
      const n = Number(s);
      const [min, max] = f.type === "rating" ? [1, 5] : [f.min ?? -Infinity, f.max ?? Infinity];
      if (!Number.isFinite(n) || n < min || n > max) errors[f.name] = `Enter a number between ${min} and ${max}.`;
      else data[f.name] = n;
      continue;
    }
    if (f.type === "select" && f.options && !f.dynamic && !f.options.includes(s)) errors[f.name] = "Please choose an option.";
    data[f.name] = s;
  }
  if (Object.keys(errors).length) return NextResponse.json({ error: "Please fix the highlighted fields.", errors }, { status: 422 });

  const fileIds: Record<string, string> = {};
  try {
    for (const { field, file } of files) fileIds[field] = await saveFile(file, { ownerType: type === "apply" ? "candidate" : "enquiry" });
  } catch (e) {
    if (e instanceof FileError) return NextResponse.json({ error: e.message, errors: { [files[Object.keys(fileIds).length]?.field ?? "file"]: e.message } }, { status: 422 });
    throw e;
  }

  const db = await getDb();
  if (type === "apply") {
    const [c] = await db.insert(schema.candidates).values({
      reference, fullName: String(data.name), nationality: String(data.nationality ?? "") || null, age: Number(data.age) || null,
      phone: String(data.phone ?? "") || null, location: String(data.location ?? "") || null, jobWanted: String(data.job ?? "") || null,
      experienceYears: data.experience !== undefined ? Number(data.experience) : null,
      passportFileId: fileIds.passport ?? null, cvFileId: fileIds.cv ?? null, photoFileId: fileIds.photo ?? null,
    }).returning({ id: schema.candidates.id });
    for (const fid of Object.values(fileIds)) await db.update(schema.files).set({ ownerId: c.id }).where(eq(schema.files.id, fid));
  } else {
    const [e] = await db.insert(schema.enquiries).values({
      reference, type, data,
      name: String(data.name ?? "") || null, email: String(data.email ?? "") || null,
      phone: String(data.phone ?? "") || null, company: String(data.company ?? "") || null,
      fileIds: Object.values(fileIds),
    }).returning({ id: schema.enquiries.id });
    for (const fid of Object.values(fileIds)) await db.update(schema.files).set({ ownerId: e.id }).where(eq(schema.files.id, fid));
  }
  // Phase 2E: email notification to Holard + auto-reply to the sender.
  return NextResponse.json({ reference });
}
