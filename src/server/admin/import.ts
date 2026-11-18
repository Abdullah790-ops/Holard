import "server-only";
import path from "node:path";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import ExcelJS from "exceljs";
import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { WORKER_STATUS } from "@/db/schema";

export const IMPORT_COLUMNS = [
  { key: "fullName", header: "Full Name", required: true },
  { key: "nationality", header: "Nationality" },
  { key: "jobTitle", header: "Job Title" },
  { key: "client", header: "Client" },
  { key: "site", header: "Site" },
  { key: "phone", header: "Phone" },
  { key: "whatsapp", header: "WhatsApp" },
  { key: "emergencyName", header: "Emergency Contact" },
  { key: "emergencyPhone", header: "Emergency Phone" },
  { key: "joiningDate", header: "Joining Date", date: true },
  { key: "basicSalary", header: "Basic Salary", num: true },
  { key: "overtimeRate", header: "Overtime Rate", num: true },
  { key: "status", header: "Status" },
  { key: "personId", header: "Person ID" },
  { key: "iban", header: "IBAN" },
  { key: "routingCode", header: "Routing Code" },
  { key: "passportNo", header: "Passport No" },
  { key: "passportExpiry", header: "Passport Expiry", date: true },
  { key: "emiratesIdNo", header: "Emirates ID No" },
  { key: "emiratesIdExpiry", header: "Emirates ID Expiry", date: true },
  { key: "visaNo", header: "Visa No" },
  { key: "visaExpiry", header: "Visa Expiry", date: true },
  { key: "labourCardNo", header: "Labour Card No" },
  { key: "labourCardExpiry", header: "Labour Card Expiry", date: true },
] as const;

type Key = (typeof IMPORT_COLUMNS)[number]["key"];
export type ImportRow = Partial<Record<Key, string>> & { clientId?: string | null; siteId?: string | null; row: number };
export type ImportReport = { token?: string; total: number; valid: number; errors: { row: number; message: string }[]; preview: ImportRow[]; unknownHeaders: string[] };

const DIR = path.join(process.cwd(), "data", "imports");
const MAX_ROWS = 2000;
const norm = (s: string) => s.toLowerCase().replace(/\*/g, "").replace(/[^a-z0-9]/g, "");
const ALIASES: Record<string, Key> = { molpersonid: "personId", personcode: "personId", labourcardpersonid: "personId", accountno: "iban", agentid: "routingCode", routingno: "routingCode", name: "fullName", workername: "fullName", fullname: "fullName", mobile: "phone", phoneno: "phone", job: "jobTitle", designation: "jobTitle", position: "jobTitle", salary: "basicSalary", basic: "basicSalary", otrate: "overtimeRate", doj: "joiningDate", joiningdate: "joiningDate", passport: "passportNo", eid: "emiratesIdNo", emiratesid: "emiratesIdNo", visaexpirydate: "visaExpiry" };

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") {
    if ("text" in v && typeof v.text === "string") return v.text;
    if ("result" in v) return cellText(v.result as ExcelJS.CellValue);
    if ("richText" in v) return v.richText.map((t) => t.text).join("");
    if ("hyperlink" in v) return String((v as { text?: string }).text ?? "");
    return "";
  }
  return String(v).trim();
}

function parseDate(s: string): string | null {
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const m = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(s); // DD/MM/YYYY (UAE format)
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  if (/^\d{5}$/.test(s)) { // Excel serial
    const d = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86400_000);
    return d.toISOString().slice(0, 10);
  }
  return "invalid";
}

export async function validateImport(file: File): Promise<ImportReport> {
  if (file.size > 5 * 1024 * 1024) throw Object.assign(new Error("File must be under 5 MB."), { name: "FileError" });
  const buf = Buffer.from(await file.arrayBuffer());
  if (!buf.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]))) throw Object.assign(new Error("Upload an Excel .xlsx file (use the template)."), { name: "FileError" });
  const wb = new ExcelJS.Workbook();
  try { await wb.xlsx.load(buf as unknown as ArrayBuffer); } catch { throw Object.assign(new Error("Could not read this Excel file."), { name: "FileError" }); }
  const ws = wb.worksheets[0];
  if (!ws) throw Object.assign(new Error("The file has no sheets."), { name: "FileError" });

  // Map headers
  const colKey: Record<number, Key> = {};
  const unknownHeaders: string[] = [];
  ws.getRow(1).eachCell((c, col) => {
    const h = norm(cellText(c.value));
    const match = IMPORT_COLUMNS.find((x) => norm(x.header) === h)?.key ?? ALIASES[h];
    if (match) colKey[col] = match; else if (h) unknownHeaders.push(cellText(c.value));
  });
  if (!Object.values(colKey).includes("fullName")) throw Object.assign(new Error('Missing "Full Name" column. Please use the template.'), { name: "FileError" });

  const db = await getDb();
  const clients = await db.select({ id: schema.clients.id, name: schema.clients.name }).from(schema.clients);
  const sites = await db.select({ id: schema.sites.id, name: schema.sites.name, clientId: schema.sites.clientId }).from(schema.sites);
  const clientByName = new Map(clients.map((c) => [c.name.toLowerCase().trim(), c.id]));

  const rows: ImportRow[] = [];
  const errors: { row: number; message: string }[] = [];
  let total = 0;
  ws.eachRow({ includeEmpty: false }, (r, n) => {
    if (n === 1) return;
    const row: ImportRow = { row: n };
    r.eachCell((c, col) => { const k = colKey[col]; if (k) row[k] = cellText(c.value).slice(0, 200); });
    if (!Object.values(row).some((v, i) => i > 0 && v)) return;
    total++;
    if (total > MAX_ROWS) return;
    const errs: string[] = [];
    if (!row.fullName) errs.push("Full Name is required");
    for (const c of IMPORT_COLUMNS) {
      const v = row[c.key];
      if (!v) continue;
      if ("date" in c && c.date) { const d = parseDate(v); if (d === "invalid") errs.push(`${c.header} "${v}" is not a date`); else row[c.key] = d ?? undefined; }
      if ("num" in c && c.num && !Number.isFinite(Number(v.replace(/,/g, "")))) errs.push(`${c.header} must be a number`);
    }
    if (row.status) {
      const s = row.status.toLowerCase().replace("on leave", "leave");
      if (!WORKER_STATUS.includes(s as "active")) errs.push(`Status "${row.status}" must be active, leave or terminated`); else row.status = s;
    }
    if (row.client) {
      row.clientId = clientByName.get(row.client.toLowerCase().trim()) ?? null;
      if (!row.clientId) errs.push(`Client "${row.client}" not found — create it in Clients & Sites first`);
    }
    if (row.site) {
      const s = sites.find((x) => x.name.toLowerCase().trim() === row.site!.toLowerCase().trim() && (!row.clientId || x.clientId === row.clientId));
      if (!s) errs.push(`Site "${row.site}" not found${row.client ? ` for ${row.client}` : ""}`);
      else { row.siteId = s.id; row.clientId ??= s.clientId; }
    }
    if (errs.length) errors.push({ row: n, message: errs.join("; ") }); else rows.push(row);
  });
  if (total > MAX_ROWS) errors.unshift({ row: 0, message: `Only the first ${MAX_ROWS} rows can be imported at once. Split the file.` });

  let token: string | undefined;
  if (rows.length && !errors.length) {
    token = crypto.randomUUID();
    await mkdir(DIR, { recursive: true });
    await writeFile(path.join(DIR, `${token}.json`), JSON.stringify(rows));
  }
  return { token, total, valid: rows.length, errors: errors.slice(0, 200), preview: rows.slice(0, 8), unknownHeaders };
}

export async function commitImport(token: string) {
  if (!/^[0-9a-f-]{36}$/.test(token)) throw new Error("Invalid import token");
  const p = path.join(DIR, `${token}.json`);
  const rows = JSON.parse(await readFile(p, "utf8")) as ImportRow[];
  const db = await getDb();
  const num = (s?: string) => (s ? Number(s.replace(/,/g, "")).toFixed(2) : null);
  const created = await db.transaction(async (tx) => {
    const res = await tx.execute(sql`select coalesce(max(ds_number), 0)::int as m from workers`);
    const m = (res.rows as { m: number }[])[0].m;
    let next = Number(m) + 1;
    let n = 0;
    for (const r of rows) {
      const [w] = await tx.insert(schema.workers).values({
        dsNumber: next++, fullName: r.fullName!, nationality: r.nationality || null, jobTitle: r.jobTitle || null,
        clientId: r.clientId ?? null, siteId: r.siteId ?? null, phone: r.phone || null, whatsapp: r.whatsapp || null,
        emergencyName: r.emergencyName || null, emergencyPhone: r.emergencyPhone || null, joiningDate: r.joiningDate || null,
        basicSalary: num(r.basicSalary), overtimeRate: num(r.overtimeRate), status: (r.status as "active") || "active",
        personId: r.personId?.replace(/\D/g, "") || null, iban: r.iban?.replace(/\s/g, "").toUpperCase() || null, routingCode: r.routingCode?.replace(/\D/g, "") || null,
      }).returning({ id: schema.workers.id });
      const docs = ([["passport", r.passportNo, r.passportExpiry], ["emirates_id", r.emiratesIdNo, r.emiratesIdExpiry], ["visa", r.visaNo, r.visaExpiry], ["labour_card", r.labourCardNo, r.labourCardExpiry]] as const)
        .filter(([, no, exp]) => no || exp)
        .map(([type, no, exp]) => ({ workerId: w.id, type, number: no || null, expiryDate: exp || null }));
      if (docs.length) await tx.insert(schema.workerDocuments).values(docs);
      n++;
    }
    return n;
  });
  await unlink(p).catch(() => {});
  return created;
}
