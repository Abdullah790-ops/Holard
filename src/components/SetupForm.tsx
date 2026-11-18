"use client";

import { ActionForm, In } from "./admin/ActionForm";
import { setupOwner } from "@/server/setup-actions";

export function SetupForm({ needToken }: { needToken: boolean }) {
  return (
    <ActionForm action={setupOwner} className="grid gap-5" submit="Create owner account">
      <In label="Your full name" name="name" required />
      <In label="Email" name="email" type="email" required />
      <In label="Password" name="password" type="password" required hint="At least 10 characters, letters and numbers" />
      <In label="Confirm password" name="confirm" type="password" required />
      {needToken && <In label="Setup token" name="token" required hint="From the server's SETUP_TOKEN setting" />}
    </ActionForm>
  );
}
