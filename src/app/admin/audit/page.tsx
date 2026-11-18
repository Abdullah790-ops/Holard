import { desc, eq } from "drizzle-orm";
import { requireAdmin } from "@/server/auth";
import { getDb, schema } from "@/db";
import { fmtDateTime, PageHeader, Table } from "@/components/admin/ui";

export const metadata = { title: "Audit Log" };

export default async function Audit() {
  await requireAdmin();
  const db = await getDb();
  const rows = await db.select({ e: schema.auditEvents, who: schema.users.name })
    .from(schema.auditEvents).leftJoin(schema.users, eq(schema.auditEvents.actorId, schema.users.id))
    .orderBy(desc(schema.auditEvents.createdAt)).limit(200);
  return (
    <>
      <PageHeader title="Audit Log" sub="Last 200 security-relevant actions: logins, changes, exports and downloads." />
      <Table head={["When (Dubai)", "Who", "Action", "Record", "Details"]}>
        {rows.map(({ e, who }) => (
          <tr key={e.id}>
            <td className="px-4 py-2.5 whitespace-nowrap">{fmtDateTime(e.createdAt)}</td>
            <td className="px-4 py-2.5">{who ?? "—"}</td>
            <td className="px-4 py-2.5 font-mono text-xs">{e.action}</td>
            <td className="px-4 py-2.5 text-xs text-muted">{e.resourceType ?? ""}</td>
            <td className="max-w-md truncate px-4 py-2.5 text-xs text-muted">{e.meta ? JSON.stringify(e.meta) : ""}</td>
          </tr>
        ))}
      </Table>
    </>
  );
}
