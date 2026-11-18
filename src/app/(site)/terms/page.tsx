import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
export const metadata: Metadata = { title: "Terms & Conditions | HOLARD", description: "Terms for using the HOLARD website and services." };
export default function Page() {
  return (
    <LegalPage title="Terms & Conditions">
      <h2>1. Use of this website</h2><p>This website provides information about Holard&apos;s services. By using it you agree to these terms.</p>
      <h2>2. Services</h2><p>Manpower supply, recruitment and HR consulting are provided under a separate written agreement with each client. That agreement prevails over this page.</p>
      <h2>3. Candidates</h2><p>Holard never charges candidates a recruitment fee. Submitting an application does not guarantee employment.</p>
      <h2>4. Accuracy</h2><p>We work to keep information accurate, but figures and availability may change without notice.</p>
      <h2>5. Governing law</h2><p>These terms are governed by the laws of the United Arab Emirates.</p>
    </LegalPage>
  );
}
