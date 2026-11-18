import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
export const metadata: Metadata = { title: "Refund Policy | HOLARD", description: "HOLARD refund and credit note policy." };
export default function Page() {
  return (
    <LegalPage title="Refund Policy">
      <h2>1. Invoices</h2><p>Invoices are based on approved attendance. If an invoice includes days a worker was not on site, we issue a credit note against the next invoice.</p>
      <h2>2. Disputes</h2><p>Raise any invoice dispute within 7 days of receipt. We review against the attendance sheet and respond within 5 working days.</p>
      <h2>3. Refunds</h2><p>Where a credit cannot be applied, approved refunds are paid by bank transfer within 14 working days.</p>
      <h2>4. Candidates</h2><p>Holard does not charge candidates any fee, so no candidate refunds apply. Report anyone asking for money in our name.</p>
    </LegalPage>
  );
}
