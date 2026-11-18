import { requireUser } from "@/server/auth";
import { MarkScreen } from "@/components/attendance/MarkScreen";

export const metadata = { title: "Mark Attendance" };

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requireUser(["supervisor"]);
  return <MarkScreen sp={await searchParams} />;
}
