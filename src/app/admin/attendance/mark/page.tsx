import { requireAdmin } from "@/server/auth";
import { MarkScreen } from "@/components/attendance/MarkScreen";

export const metadata = { title: "Mark Attendance" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireAdmin();
  return <MarkScreen sp={await searchParams} />;
}
