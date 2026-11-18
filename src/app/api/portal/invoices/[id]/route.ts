import { NextResponse } from "next/server";
import { apiUser } from "@/server/auth";
import { getInvoice, invoiceSettings, invNo } from "@/server/invoicing";
import { invoicePdf } from "@/server/pdf";
import { audit } from "@/server/audit";

/** Client portal: a client admin may download only their own company's issued invoices. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await apiUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new NextResponse("Not found", { status: 404 });
  const inv = await getInvoice(id);
  const allowed = inv && (user.role === "super_admin" || (user.role === "client_admin" && !!user.clientId && inv.clientId === user.clientId && inv.status !== "draft" && inv.status !== "void"));
  if (!inv || !allowed) return new NextResponse("Not found", { status: 404 });
  const cfg = await invoiceSettings();
  const number = invNo(inv.number);
  const pdf = await invoicePdf(inv, number, { name: cfg.companyName, trn: cfg.companyTrn, address: cfg.companyAddress, bankDetails: cfg.bankDetails });
  await audit(user.id, "portal.invoice_pdf", "invoice", inv.id);
  return new NextResponse(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${number}.pdf"`, "Cache-Control": "private, no-store" } });
}
