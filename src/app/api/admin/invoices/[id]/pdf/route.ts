import { NextResponse } from "next/server";
import { apiUser } from "@/server/auth";
import { getInvoice, invoiceSettings, invNo } from "@/server/invoicing";
import { invoicePdf } from "@/server/pdf";
import { audit } from "@/server/audit";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (user?.role !== "super_admin") return new NextResponse("Forbidden", { status: 403 });
  const inv = await getInvoice((await params).id);
  if (!inv) return new NextResponse("Not found", { status: 404 });
  const cfg = await invoiceSettings();
  const number = invNo(inv.number);
  const pdf = await invoicePdf(inv, inv.status === "draft" ? `${number} (DRAFT)` : number, { name: cfg.companyName, trn: cfg.companyTrn, address: cfg.companyAddress, bankDetails: cfg.bankDetails });
  await audit(user.id, "invoice.pdf", "invoice", inv.id);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${number}-${inv.clientName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf"`, "Cache-Control": "private, no-store" } });
}
