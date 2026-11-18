import { requireUser } from "@/server/auth";
import { requestsFor } from "@/server/portal";
import { EmployeeHelpForm } from "@/components/portal/PortalForms";
import { RequestList } from "@/components/portal/RequestList";

export const metadata = { title: "Help" };

export default async function Help() {
  const user = await requireUser(["employee"]);
  const items = await requestsFor(user);
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="rounded-3xl bg-white p-5 sm:p-7 lg:col-span-2">
        <h1 className="font-heading text-2xl font-extrabold text-navy">Ask Holard HR</h1>
        <p className="mb-5 mt-1 text-sm text-muted">Complaints, salary questions, accommodation, documents. Only Holard HR sees this.</p>
        <EmployeeHelpForm />
      </section>
      <section className="lg:col-span-3"><h2 className="mb-3 font-heading text-lg font-bold text-navy">My messages</h2><RequestList items={items} /></section>
    </div>
  );
}
