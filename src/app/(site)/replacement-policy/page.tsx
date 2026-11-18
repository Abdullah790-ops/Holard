import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
export const metadata: Metadata = { title: "Replacement Policy | HOLARD", description: "HOLARD worker replacement policy — replacement within 24 hours." };
export default function Page() {
  return (
    <LegalPage title="Replacement Policy">
      <h2>1. Our promise</h2><p>If a deployed worker resigns, absconds, is unfit for the role or is requested to be replaced by the client, Holard will provide a replacement within 24 hours, subject to role availability.</p>
      <h2>2. How to request</h2><ul><li>Contact your account manager or site supervisor.</li><li>Or raise a replacement request in the Client Portal.</li></ul>
      <h2>3. Billing</h2><p>Days without a worker on site are not invoiced.</p>
      <h2>4. Specialised roles</h2><p>For technical or specialised roles, replacement timelines are agreed in your contract.</p>
    </LegalPage>
  );
}
