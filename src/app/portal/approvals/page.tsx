import Link from "next/link";
import { requireUser } from "@/server/auth";
import { listApprovals } from "@/server/approvals";
import { ApprovalList } from "@/components/attendance/ApprovalList";

export const metadata = { title: "Approvals" };

export default async function SupervisorApprovals({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const user = await requireUser(["supervisor"]);
  const { view } = await searchParams;
  const open = view !== "all";
  const items = await listApprovals(user, { open });
  return (
    <>
      <div className="mb-5 flex items-end justify-between gap-3">
        <div><h1 className="font-heading text-2xl font-extrabold text-navy">Approvals</h1><p className="text-sm text-muted">Your approval sends the request to Holard admin for the final decision.</p></div>
        <Link href={open ? "?view=all" : "?"} className="text-sm font-semibold text-orange">{open ? "History" : "Waiting only"}</Link>
      </div>
      <ApprovalList items={items} mode="supervisor" />
    </>
  );
}
