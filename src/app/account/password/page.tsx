import type { Metadata } from "next";
import { BareAuthShell } from "@/components/AuthShell";
import { ChangePasswordForm } from "@/components/AuthForms";
import { requireUser } from "@/server/auth";

export const metadata: Metadata = { title: "Set Your Password | HOLARD", robots: { index: false } };

export default async function Page() {
  const user = await requireUser(undefined, { allowTempPassword: true });
  return (
    <BareAuthShell title={`Welcome, ${user.name.split(" ")[0]}`} sub={user.mustChangePassword ? "For security, please replace your temporary password." : "Change your password."}>
      <ChangePasswordForm needCurrent={!user.mustChangePassword} />
    </BareAuthShell>
  );
}
