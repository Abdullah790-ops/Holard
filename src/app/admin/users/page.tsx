import { asc, eq, sql } from "drizzle-orm";
import { requireAdmin, ROLE_LABEL } from "@/server/auth";
import { getDb, schema } from "@/db";
import { userAction } from "@/server/admin/misc-actions";
import { Badge, Card, dsCode, fmtDateTime, PageHeader, Table } from "@/components/admin/ui";
import { CreateUserForm, ResetPasswordButton } from "@/components/admin/UserForms";

export const metadata = { title: "Users & Access" };

export default async function Users() {
  const me = await requireAdmin();
  const db = await getDb();
  const { users, clients, workers } = schema;
  const [rows, cl, wk, st] = await Promise.all([
    db.select({ u: users, clientName: clients.name, ds: workers.dsNumber, workerName: workers.fullName })
      .from(users).leftJoin(clients, eq(users.clientId, clients.id)).leftJoin(workers, eq(users.workerId, workers.id))
      .orderBy(sql`${users.status} = 'disabled'`, asc(users.role), asc(users.name)),
    db.select({ id: clients.id, name: clients.name }).from(clients).where(eq(clients.status, "active")).orderBy(asc(clients.name)),
    db.select({ id: workers.id, ds: workers.dsNumber, name: workers.fullName }).from(workers)
      .where(sql`${workers.status} <> 'terminated' and not exists (select 1 from ${users} u where u.worker_id = ${workers.id})`)
      .orderBy(asc(workers.dsNumber)).limit(5000),
    db.select({ id: schema.sites.id, name: schema.sites.name, clientId: schema.sites.clientId }).from(schema.sites).where(eq(schema.sites.status, "active")).orderBy(asc(schema.sites.name)),
  ]);
  return (
    <>
      <PageHeader title="Users & Access" sub="Each person gets their own login. Clients only see their own company; workers only see their own data." />
      <Card title="Create a login" className="mb-6">
        <CreateUserForm sites={st} clients={cl} workers={wk.map((w) => ({ id: w.id, label: `${dsCode(w.ds)} — ${w.name}` }))} />
      </Card>
      <Table head={["Name", "Login", "Role", "Linked to", "Last login", "Status", ""]} minWidth={900}>
        {rows.map(({ u, clientName, ds, workerName }) => (
          <tr key={u.id} className={u.status === "disabled" ? "opacity-60" : ""}>
            <td className="px-4 py-3 font-semibold text-navy">{u.name}{u.id === me.id && <span className="ml-2 text-xs text-muted">(you)</span>}</td>
            <td className="px-4 py-3 text-sm">{u.email}<p className="text-muted">{u.phone}</p></td>
            <td className="px-4 py-3">{ROLE_LABEL[u.role]}</td>
            <td className="px-4 py-3 text-sm">{clientName ?? (ds ? `${dsCode(ds)} — ${workerName}` : "—")}</td>
            <td className="px-4 py-3 text-sm whitespace-nowrap">{u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : u.mustChangePassword ? <span className="text-muted">Not yet</span> : "—"}</td>
            <td className="px-4 py-3"><Badge status={u.status} /></td>
            <td className="px-4 py-3">
              <div className="flex items-center justify-end gap-4">
                <ResetPasswordButton id={u.id} />
                {u.id !== me.id && (
                  <form action={userAction}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="op" value={u.status === "active" ? "disable" : "enable"} />
                    <button className={`text-sm font-semibold ${u.status === "active" ? "text-red-600" : "text-emerald-700"} hover:underline`}>{u.status === "active" ? "Disable" : "Enable"}</button>
                  </form>
                )}
              </div>
            </td>
          </tr>
        ))}
      </Table>
    </>
  );
}
