import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BareAuthShell } from "@/components/AuthShell";
import { SetupForm } from "@/components/SetupForm";
import { needsSetup } from "@/server/setup-actions";

export const metadata: Metadata = { title: "Setup | HOLARD", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Setup() {
  if (!(await needsSetup())) redirect("/login");
  return (
    <BareAuthShell title="Set up Holard Back Office" sub="Create the owner (Super Admin) account. This page locks itself after the first account is created.">
      <SetupForm needToken={process.env.NODE_ENV === "production"} />
    </BareAuthShell>
  );
}
