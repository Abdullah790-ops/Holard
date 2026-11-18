import { requireAdmin } from "@/server/auth";
import { filterOptions } from "@/server/admin/workers";
import { PageHeader } from "@/components/admin/ui";
import { WorkerForm } from "@/components/admin/WorkerForm";
import { listShifts } from "@/server/attendance";

export const metadata = { title: "Add Worker" };

export default async function NewWorker({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  const sp = await searchParams;
  const [opts, shifts] = await Promise.all([filterOptions(), listShifts()]);
  return (
    <>
      <PageHeader title="Add worker" sub="A DS code is assigned automatically." back={{ href: "/admin/workers", label: "Workers" }} />
      <WorkerForm shifts={shifts} clients={opts.clients} sites={opts.sites} defaults={{ clientId: sp.client }} />
    </>
  );
}
