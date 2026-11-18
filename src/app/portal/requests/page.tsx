import { requireUser } from "@/server/auth";
import { leaveBalance, todayDubai } from "@/server/attendance";
import { listApprovals } from "@/server/approvals";
import { RequestForms } from "@/components/attendance/RequestForms";
import { ApprovalList } from "@/components/attendance/ApprovalList";

export const metadata = { title: "My Requests" };

export default async function MyRequests({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const user = await requireUser(["employee"]);
  if (!user.workerId) return null;
  const { type } = await searchParams;
  const [bal, items] = await Promise.all([leaveBalance(user.workerId), listApprovals(user, { limit: 30 })]);
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="rounded-3xl bg-white p-5 sm:p-7 lg:col-span-2">
        <h1 className="font-heading text-2xl font-extrabold text-navy">New request</h1>
        <p className="mb-5 mt-1 text-sm text-muted">Annual leave left: <strong className="text-navy">{bal.balance} days</strong>{bal.pendingAnnual ? ` (${bal.pendingAnnual} pending)` : ""}. Requests go to your supervisor, then Holard.</p>
        <RequestForms today={todayDubai()} initial={type} />
      </section>
      <section className="lg:col-span-3">
        <h2 className="mb-3 font-heading text-lg font-bold text-navy">My requests</h2>
        <ApprovalList items={items} mode="worker" />
      </section>
    </div>
  );
}
