import { requireAdmin } from "@/server/auth";
import { Card, PageHeader } from "@/components/admin/ui";
import { ClientForm } from "@/components/admin/ClientForm";

export const metadata = { title: "Add Client" };

export default async function NewClient() {
  await requireAdmin();
  return (
    <>
      <PageHeader title="Add client" back={{ href: "/admin/clients", label: "Clients & Sites" }} />
      <Card><ClientForm /></Card>
    </>
  );
}
