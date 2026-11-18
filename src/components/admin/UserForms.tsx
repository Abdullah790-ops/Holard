"use client";

import { useState } from "react";
import { ActionForm, In, useFieldError } from "./ActionForm";
import { createUser, resetUserPassword } from "@/server/admin/misc-actions";

const ROLES = [
  { value: "super_admin", label: "Super Admin — full access" },
  { value: "client_admin", label: "Client Admin — sees only their company" },
  { value: "supervisor", label: "Supervisor — a client's site supervisor" },
  { value: "employee", label: "Employee — a worker's own data" },
  { value: "investor", label: "Investor — business numbers only" },
];

function Linked({ role, clients, workers, sites }: { role: string; clients: { id: string; name: string }[]; workers: { id: string; label: string }[]; sites: { id: string; name: string; clientId: string }[] }) {
  const [clientId, setClientId] = useState("");
  const cErr = useFieldError("clientId");
  const wErr = useFieldError("workerId");
  if (role === "client_admin" || role === "supervisor") {
    return (
      <div>
        <label htmlFor="clientId" className="field-label">Client <span className="text-orange">*</span></label>
        <select id="clientId" name="clientId" className="field" value={clientId} onChange={(e) => setClientId(e.target.value)} aria-invalid={cErr ? true : undefined}>
          <option value="">—</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        {cErr && <p className="mt-1 text-sm font-medium text-red-600">{cErr}</p>}
        {role === "supervisor" && (
          <div className="mt-3">
            <label htmlFor="siteId" className="field-label">Limit to one site (optional)</label>
            <select id="siteId" name="siteId" className="field" defaultValue="" key={clientId} disabled={!clientId}>
              <option value="">All sites of this client</option>{sites.filter((s) => s.clientId === clientId).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>
    );
  }
  if (role === "employee") {
    return (
      <div>
        <label htmlFor="workerId" className="field-label">Worker <span className="text-orange">*</span></label>
        <select id="workerId" name="workerId" className="field" defaultValue="" aria-invalid={wErr ? true : undefined}>
          <option value="">—</option>{workers.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
        </select>
        {wErr && <p className="mt-1 text-sm font-medium text-red-600">{wErr}</p>}
      </div>
    );
  }
  return <div className="hidden lg:block" />;
}

export function CreateUserForm({ clients, workers, sites }: { clients: { id: string; name: string }[]; workers: { id: string; label: string }[]; sites: { id: string; name: string; clientId: string }[] }) {
  const [role, setRole] = useState("client_admin");
  return (
    <ActionForm action={createUser} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" submit="Create user">
      <In label="Full name" name="name" required />
      <In label="Email" name="email" type="email" hint="Used for email + password login" />
      <In label="Phone" name="phone" type="tel" placeholder="+971 5X XXX XXXX" hint="Used for phone + OTP login" />
      <div>
        <label htmlFor="role" className="field-label">Role <span className="text-orange">*</span></label>
        <select id="role" name="role" className="field" value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
        </select>
      </div>
      <Linked role={role} clients={clients} workers={workers} sites={sites} />
    </ActionForm>
  );
}

export function ResetPasswordButton({ id }: { id: string }) {
  return (
    <ActionForm action={resetUserPassword} className="flex flex-col items-end gap-2" submit={null}
      extra={<button className="text-sm font-semibold text-navy hover:text-orange">Reset password</button>}>
      <input type="hidden" name="id" value={id} />
    </ActionForm>
  );
}
