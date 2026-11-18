import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { site } from "@/lib/site";
export const metadata: Metadata = { title: "Privacy Policy | HOLARD", description: "How HOLARD collects, uses and protects personal data." };
export default function Page() {
  return (
    <LegalPage title="Privacy Policy">
      <h2>1. Who we are</h2><p>{site.legalName} (&quot;Holard&quot;) provides manpower supply, recruitment and HR consulting in the United Arab Emirates.</p>
      <h2>2. What we collect</h2><ul><li>Client enquiries: name, company, contact details and workforce requirements.</li><li>Job applications: name, nationality, age, contact details, location, experience, passport, CV and photo.</li><li>Investor requests: name, contact details and investment interest.</li></ul>
      <h2>3. Why we use it</h2><p>Only to respond to your request, assess job applications, deliver our services and meet legal obligations under UAE law.</p>
      <h2>4. Who can see it</h2><p>Access is limited to authorised Holard staff by role. Clients never see other clients&apos; data; workers only see their own records; investors see business figures only — never worker personal documents.</p>
      <h2>5. How long we keep it</h2><p>We keep data only as long as needed for the purpose collected or as required by law, then securely delete it.</p>
      <h2>6. Your rights</h2><p>You can ask to access, correct or delete your data by emailing <a href={`mailto:${site.email}`}>{site.email}</a>.</p>
      <h2>7. Security</h2><p>We use encryption in transit, role-based access control and audit logging to protect your information.</p>
    </LegalPage>
  );
}
