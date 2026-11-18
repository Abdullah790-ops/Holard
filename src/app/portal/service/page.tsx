import { requireUser } from "@/server/auth";
import { todayDubai } from "@/server/attendance";
import { clientOverview, clientScope, requestsFor } from "@/server/portal";
import { ClientRequestForm } from "@/components/portal/PortalForms";
import { RequestList } from "@/components/portal/RequestList";

export const metadata = { title: "Requests" };

export default async function Service() {
  const user = await requireUser(["client_admin"]);
  const { sites } = await clientOverview(clientScope(user));
  const items = await requestsFor(user);
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <section className="rounded-3xl bg-white p-5 sm:p-7 lg:col-span-2">
        <h1 className="font-heading text-2xl font-extrabold text-navy">New request</h1>
        <p className="mb-5 mt-1 text-sm text-muted">Holard is notified straight away.</p>
        <ClientRequestForm sites={sites.map((s) => ({ id: s.id, name: s.name }))} today={todayDubai()} />
      </section>
      <section className="lg:col-span-3"><h2 className="mb-3 font-heading text-lg font-bold text-navy">Your requests</h2><RequestList items={items} /></section>
    </div>
  );
}
