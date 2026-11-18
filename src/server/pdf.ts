import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import type { schema } from "@/db";

type Line = typeof schema.payrollLines.$inferSelect;
type Inv = typeof schema.invoices.$inferSelect & {
  lines: (typeof schema.invoiceLines.$inferSelect)[];
  annex: (typeof schema.invoiceWorkers.$inferSelect)[];
  payments: (typeof schema.invoicePayments.$inferSelect)[];
};

const NAVY = rgb(10 / 255, 25 / 255, 49 / 255);
const ORANGE = rgb(1, 107 / 255, 0);
const GREY = rgb(0.42, 0.45, 0.5);
const LINE = rgb(0.9, 0.91, 0.92);
const MIST = rgb(0.957, 0.965, 0.976);
const A4: [number, number] = [595.28, 841.89];

const money = (n: number | string) => Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const monthLabel = (m: string) => new Date(`${m}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
const dateLabel = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
/** pdf-lib standard fonts only cover Latin-1 — strip anything else. */
const safe = (s: string | null | undefined) => (s ?? "").replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[^\x20-\x7E\xA0-\xFF]/g, "");

type Fonts = { reg: PDFFont; bold: PDFFont; logo?: PDFImage };
const logoBytes = () => readFile(path.join(process.cwd(), "public", "brand", "logo-light.png")).catch(() => null);
function text(p: PDFPage, s: string, x: number, y: number, f: PDFFont, size = 9, color = NAVY, align: "left" | "right" = "left") {
  const t = safe(s);
  const w = f.widthOfTextAtSize(t, size);
  p.drawText(t, { x: align === "right" ? x - w : x, y, size, font: f, color });
}
function header(p: PDFPage, fonts: Fonts, title: string, sub: string) {
  const [W, H] = A4;
  p.drawRectangle({ x: 0, y: H - 90, width: W, height: 90, color: NAVY });
  if (fonts.logo) {
    const h = 58, w = (fonts.logo.width / fonts.logo.height) * h;
    p.drawImage(fonts.logo, { x: 36, y: H - 45 - h / 2, width: w, height: h });
  } else {
    p.drawRectangle({ x: 40, y: H - 66, width: 36, height: 36, color: ORANGE });
    text(p, "H", 51, H - 57, fonts.bold, 20, rgb(1, 1, 1));
    text(p, "HOLARD", 86, H - 50, fonts.bold, 18, rgb(1, 1, 1));
  }
  text(p, title, W - 40, H - 48, fonts.bold, 16, rgb(1, 1, 1), "right");
  text(p, sub, W - 40, H - 64, fonts.reg, 9, rgb(0.8, 0.83, 0.88), "right");
}
function footer(p: PDFPage, fonts: Fonts, left: string, pageNo: string) {
  p.drawLine({ start: { x: 40, y: 40 }, end: { x: A4[0] - 40, y: 40 }, thickness: 0.5, color: LINE });
  text(p, left, 40, 28, fonts.reg, 7.5, GREY);
  text(p, pageNo, A4[0] - 40, 28, fonts.reg, 7.5, GREY, "right");
}

// ── Payslips ───────────────────────────────────────────
export async function payslipsPdf(lines: Line[], company: { name: string; address: string }) {
  const doc = await PDFDocument.create();
  doc.setTitle(lines.length === 1 ? `Payslip ${lines[0].month} DS${String(lines[0].dsNumber).padStart(3, "0")}` : `Payslips ${lines[0]?.month ?? ""}`);
  doc.setProducer("HOLARD");
  const lb = await logoBytes();
  const fonts: Fonts = { reg: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold), logo: lb ? await doc.embedPng(lb) : undefined };
  for (const l of lines) {
    const p = doc.addPage(A4);
    const [W, H] = A4;
    header(p, fonts, "PAYSLIP", monthLabel(l.month));
    let y = H - 130;
    const ds = `DS${String(l.dsNumber).padStart(3, "0")}`;
    const info: [string, string][] = [["Employee", l.fullName], ["DS code", ds], ["Job title", l.jobTitle ?? "-"], ["Client / site", [l.clientName, l.siteName].filter(Boolean).join(" · ") || "-"], ["Person ID", l.personId ?? "-"], ["Bank / card", l.iban ? `****${l.iban.replace(/\s/g, "").slice(-4)}` : "-"]];
    info.forEach(([k, v], i) => {
      const x = i % 2 ? W / 2 + 10 : 40;
      const yy = y - Math.floor(i / 2) * 30;
      text(p, k.toUpperCase(), x, yy, fonts.reg, 7, GREY);
      text(p, v, x, yy - 12, fonts.bold, 10);
    });
    y -= 110;
    // attendance strip
    p.drawRectangle({ x: 40, y: y - 34, width: W - 80, height: 44, color: MIST });
    const att: [string, string][] = [["Present", String(l.presentDays)], ["Absent", String(l.absentDays)], ["Paid leave", String(l.paidLeaveDays)], ["Unpaid leave", String(l.unpaidLeaveDays)], ["Off days", String(l.offDays)], ["OT hours", String(Number(l.otHours))]];
    att.forEach(([k, v], i) => {
      const x = 52 + i * ((W - 104) / 6);
      text(p, k, x, y - 4, fonts.reg, 7.5, GREY);
      text(p, v, x, y - 22, fonts.bold, 13);
    });
    y -= 70;
    const col = (W - 80) / 2;
    const row = (x: number, yy: number, k: string, v: string, bold = false) => {
      text(p, k, x, yy, bold ? fonts.bold : fonts.reg, 9.5);
      text(p, v, x + col - 16, yy, bold ? fonts.bold : fonts.reg, 9.5, NAVY, "right");
    };
    text(p, "EARNINGS (AED)", 40, y, fonts.bold, 9, ORANGE);
    text(p, "DEDUCTIONS (AED)", 40 + col + 16, y, fonts.bold, 9, ORANGE);
    y -= 20;
    const earn: [string, string][] = [["Basic salary (earned)", money(l.basic)], [`Overtime ${Number(l.otHours)} h × ${money(l.otHourlyRate)}`, money(l.otPay)], ["Allowances / other", money(l.allowances)]];
    const ded: [string, string][] = [[`Absence (${l.absentDays + l.unpaidLeaveDays} days ÷ ${l.dayBasis})`, money(l.absenceDeduction)], ["Salary advance", money(l.advanceDeduction)], ["Other deductions", money(l.otherDeductions)]];
    earn.forEach(([k, v], i) => row(40, y - i * 18, k, v));
    ded.forEach(([k, v], i) => row(40 + col + 16, y - i * 18, k, v));
    y -= 3 * 18 + 6;
    p.drawLine({ start: { x: 40, y }, end: { x: W - 40, y }, thickness: 0.5, color: LINE });
    y -= 16;
    const totalDed = Number(l.absenceDeduction) + Number(l.advanceDeduction) + Number(l.otherDeductions);
    row(40, y, "Total earnings", money(l.gross), true);
    row(40 + col + 16, y, "Total deductions", money(totalDed), true);
    y -= 44;
    p.drawRectangle({ x: 40, y: y - 14, width: W - 80, height: 44, color: NAVY });
    text(p, "NET SALARY", 56, y + 6, fonts.bold, 11, rgb(1, 1, 1));
    text(p, `AED ${money(l.net)}`, W - 56, y + 3, fonts.bold, 18, rgb(1, 1, 1), "right");
    y -= 50;
    if (l.note) { text(p, `Note: ${l.note}`, 40, y, fonts.reg, 8.5, GREY); y -= 14; }
    text(p, "Salary paid through the UAE Wage Protection System (WPS). This payslip is computer generated and needs no signature.", 40, y, fonts.reg, 7.5, GREY);
    footer(p, fonts, safe(`${company.name}${company.address ? " · " + company.address : ""}`), `${ds} · ${l.month}`);
  }
  return doc.save();
}

// ── Invoice ────────────────────────────────────────────
export async function invoicePdf(inv: Inv, number: string, company: { name: string; trn: string; address: string; bankDetails: string }) {
  const doc = await PDFDocument.create();
  doc.setTitle(`${number} ${inv.clientName}`);
  doc.setProducer("HOLARD");
  const lb = await logoBytes();
  const fonts: Fonts = { reg: await doc.embedFont(StandardFonts.Helvetica), bold: await doc.embedFont(StandardFonts.HelveticaBold), logo: lb ? await doc.embedPng(lb) : undefined };
  const [W, H] = A4;
  const vat = Number(inv.vatRate) > 0;
  const title = vat && company.trn ? "TAX INVOICE" : "INVOICE";
  let p = doc.addPage(A4);
  header(p, fonts, title, number);
  let y = H - 125;
  // from / to
  text(p, "FROM", 40, y, fonts.reg, 7, GREY);
  text(p, "BILL TO", W / 2 + 10, y, fonts.reg, 7, GREY);
  y -= 14;
  text(p, company.name, 40, y, fonts.bold, 11);
  text(p, inv.clientName, W / 2 + 10, y, fonts.bold, 11);
  const fromLines = [company.address, company.trn ? `TRN ${company.trn}` : ""].filter(Boolean);
  const toLines = [inv.clientAddress ?? "", inv.clientTrn ? `TRN ${inv.clientTrn}` : ""].filter(Boolean);
  for (let i = 0; i < Math.max(fromLines.length, toLines.length); i++) {
    y -= 12;
    if (fromLines[i]) text(p, fromLines[i].slice(0, 70), 40, y, fonts.reg, 8.5);
    if (toLines[i]) text(p, toLines[i].slice(0, 70), W / 2 + 10, y, fonts.reg, 8.5);
  }
  y -= 28;
  const meta: [string, string][] = [["Invoice no.", number], ["Issue date", dateLabel(inv.issueDate)], ["Due date", dateLabel(inv.dueDate)], ["Period", `${dateLabel(inv.periodStart)} - ${dateLabel(inv.periodEnd)}`]];
  p.drawRectangle({ x: 40, y: y - 26, width: W - 80, height: 40, color: MIST });
  meta.forEach(([k, v], i) => {
    const x = 52 + i * ((W - 104) / 4);
    text(p, k, x, y + 2, fonts.reg, 7.5, GREY);
    text(p, v, x, y - 14, fonts.bold, 9.5);
  });
  y -= 56;
  // table
  const cols = { desc: 40, qty: 360, rate: 440, amt: W - 40 };
  p.drawRectangle({ x: 40, y: y - 6, width: W - 80, height: 22, color: NAVY });
  text(p, "Description", cols.desc + 8, y + 1, fonts.bold, 8.5, rgb(1, 1, 1));
  text(p, "Qty", cols.qty + 30, y + 1, fonts.bold, 8.5, rgb(1, 1, 1), "right");
  text(p, "Rate (AED)", cols.rate + 30, y + 1, fonts.bold, 8.5, rgb(1, 1, 1), "right");
  text(p, "Amount (AED)", cols.amt - 8, y + 1, fonts.bold, 8.5, rgb(1, 1, 1), "right");
  y -= 24;
  for (const l of inv.lines) {
    if (y < 200) { footer(p, fonts, company.name, number); p = doc.addPage(A4); header(p, fonts, title, number); y = H - 130; }
    const d = safe(l.description);
    const wrap = d.length > 62 ? [d.slice(0, d.lastIndexOf(" ", 62)), d.slice(d.lastIndexOf(" ", 62) + 1)] : [d];
    text(p, wrap[0], cols.desc + 8, y, fonts.reg, 9);
    if (wrap[1]) text(p, wrap[1], cols.desc + 8, y - 11, fonts.reg, 9);
    text(p, `${Number(l.quantity).toLocaleString("en-US")} ${l.unit === "item" ? "" : l.unit + (Number(l.quantity) === 1 ? "" : "s")}`.trim(), cols.qty + 30, y, fonts.reg, 9, NAVY, "right");
    text(p, money(l.rate), cols.rate + 30, y, fonts.reg, 9, NAVY, "right");
    text(p, money(l.amount), cols.amt - 8, y, fonts.bold, 9, NAVY, "right");
    y -= wrap[1] ? 26 : 18;
    p.drawLine({ start: { x: 40, y: y + 8 }, end: { x: W - 40, y: y + 8 }, thickness: 0.4, color: LINE });
  }
  y -= 10;
  const tot = (k: string, v: string, bold = false) => { text(p, k, cols.rate - 40, y, bold ? fonts.bold : fonts.reg, bold ? 11 : 9.5); text(p, v, cols.amt - 8, y, bold ? fonts.bold : fonts.reg, bold ? 11 : 9.5, NAVY, "right"); y -= bold ? 22 : 16; };
  tot("Subtotal", money(inv.subtotal));
  tot(`VAT ${Number(inv.vatRate)}%`, money(inv.vatAmount));
  y -= 10;
  p.drawRectangle({ x: cols.rate - 50, y: y - 8, width: cols.amt - cols.rate + 50, height: 26, color: ORANGE });
  text(p, "TOTAL (AED)", cols.rate - 40, y, fonts.bold, 11, rgb(1, 1, 1));
  text(p, money(inv.total), cols.amt - 8, y, fonts.bold, 12, rgb(1, 1, 1), "right");
  y -= 30;
  if (Number(inv.paidAmount) > 0) { tot("Paid", money(inv.paidAmount)); tot("Balance due", money(Number(inv.total) - Number(inv.paidAmount)), true); }
  y -= 10;
  if (company.bankDetails) {
    text(p, "PAYMENT DETAILS", 40, y, fonts.bold, 8.5, ORANGE); y -= 13;
    for (const ln of company.bankDetails.split(/\r?\n/).slice(0, 6)) { text(p, ln, 40, y, fonts.reg, 8.5); y -= 11; }
    y -= 6;
  }
  if (inv.notes) { text(p, "NOTES", 40, y, fonts.bold, 8.5, ORANGE); y -= 13; for (const ln of inv.notes.split(/\r?\n/).slice(0, 5)) { text(p, ln.slice(0, 110), 40, y, fonts.reg, 8.5); y -= 11; } }
  text(p, `Annex: worker list with DS codes and days present (${inv.annex.length} workers).`, 40, 60, fonts.reg, 8, GREY);
  footer(p, fonts, company.name, number);

  // Annex: DS codes list
  const perPage = 50;
  for (let i = 0; i < inv.annex.length; i += perPage) {
    const ap = doc.addPage(A4);
    header(ap, fonts, "ANNEX - WORKERS", `${number} · ${monthLabel(inv.month)}`);
    let ay = H - 120;
    ap.drawRectangle({ x: 40, y: ay - 6, width: W - 80, height: 20, color: NAVY });
    const ac = [48, 110, 330, W - 120, W - 48];
    ["DS code", "Name", "Site", "Days", "OT h"].forEach((h, k) => text(ap, h, k >= 3 ? ac[k] : ac[k], ay, fonts.bold, 8.5, rgb(1, 1, 1), k >= 3 ? "right" : "left"));
    ay -= 20;
    for (const w of inv.annex.slice(i, i + perPage)) {
      text(ap, `DS${String(w.dsNumber).padStart(3, "0")}`, ac[0], ay, fonts.bold, 8.5);
      text(ap, w.fullName.slice(0, 36), ac[1], ay, fonts.reg, 8.5);
      text(ap, (w.siteName ?? "").slice(0, 30), ac[2], ay, fonts.reg, 8.5);
      text(ap, String(w.days), ac[3], ay, fonts.reg, 8.5, NAVY, "right");
      text(ap, Number(w.otHours) ? String(Number(w.otHours)) : "", ac[4], ay, fonts.reg, 8.5, NAVY, "right");
      ay -= 13.5;
    }
    footer(ap, fonts, company.name, `Annex page ${i / perPage + 1} of ${Math.ceil(inv.annex.length / perPage)}`);
  }
  return doc.save();
}
