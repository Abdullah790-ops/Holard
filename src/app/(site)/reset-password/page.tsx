import type { Metadata } from "next";
import { AuthShell } from "@/components/AuthShell";
import { ResetForm } from "@/components/AuthForms";

export const metadata: Metadata = { title: "Reset Password | HOLARD", robots: { index: false } };

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token = "" } = await searchParams;
  return <AuthShell title="Choose a new password"><ResetForm token={token} /></AuthShell>;
}
