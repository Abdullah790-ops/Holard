import { requireUser } from "@/server/auth";
import { getSetting, isMonth, todayDubai, workerMonth } from "@/server/attendance";
import { MonthCalendar } from "@/components/attendance/MonthCalendar";

export const metadata = { title: "My Attendance" };

export default async function MyAttendance({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireUser(["employee"]);
  if (!user.workerId) return null;
  const { month: m } = await searchParams;
  const today = todayDubai();
  const month = isMonth(m) && m <= today.slice(0, 7) ? m : today.slice(0, 7);
  const [days, att] = await Promise.all([workerMonth(user.workerId, month), getSetting("attendance")]);
  return (
    <div className="rounded-3xl bg-white p-5 sm:p-8">
      <h1 className="mb-5 font-heading text-2xl font-extrabold text-navy">My attendance</h1>
      <MonthCalendar month={month} days={days} today={today} weeklyOff={att.weeklyOff} hrefFor={(mm) => `/portal/attendance?month=${mm}`} />
      <p className="mt-5 text-sm text-muted">Something wrong? Tell your supervisor — corrections are made by Holard and recorded.</p>
    </div>
  );
}
