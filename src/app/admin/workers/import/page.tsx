import { requireAdmin } from "@/server/auth";
import { PageHeader } from "@/components/admin/ui";
import { ImportForm } from "@/components/admin/ImportForm";

export const metadata = { title: "Bulk Import" };

export default async function ImportPage() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Bulk import workers" sub="Upload up to 2,000 workers at once from Excel." back={{ href: "/admin/workers", label: "Workers" }} />
      <ImportForm />
    </>
  );
}
