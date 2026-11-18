import { notFound } from "next/navigation";
import { requireAdmin } from "@/server/auth";
import { filterOptions, getWorker } from "@/server/admin/workers";
import { dsCode, PageHeader } from "@/components/admin/ui";
import { WorkerForm } from "@/components/admin/WorkerForm";
import { listShifts } from "@/server/attendance";

export const metadata = { title: "Edit Worker" };

export default async function EditWorker({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [w, opts, shifts] = await Promise.all([getWorker(id), filterOptions(), listShifts()]);
  if (!w) notFound();
  return (
    <>
      <PageHeader title={`Edit ${w.fullName}`} sub={dsCode(w.dsNumber)} back={{ href: `/admin/workers/${id}`, label: "Back to profile" }} />
      <WorkerForm shifts={shifts} worker={w} clients={opts.clients} sites={opts.sites} />
    </>
  );
}
