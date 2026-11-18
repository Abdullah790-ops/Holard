import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { ForgotForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Forgot Password | HOLARD", robots: { index: false } };

export default function Page() {
  return <AuthShell title="Forgot password" sub="We'll send a reset link to your email."><ForgotForm /></AuthShell>;
}
