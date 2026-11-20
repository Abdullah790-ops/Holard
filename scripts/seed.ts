/**
 * HOLARD seed script.
 *   npm run seed          → default job posts (only if none exist)
 *   npm run seed:demo     → + DEMO clients, sites and ~505 demo workers (all marked is_demo)
 *   npm run demo:clear    → delete every demo client/site/worker
 * Create the owner account in the browser at /setup (first run).
 */
import { eq, inArray, count } from "drizzle-orm";
import { getDb, schema } from "../src/db/index";

const args = new Set(process.argv.slice(2));

const JOBS = [
  { title: "Warehouse Helper", salary: "AED 1,500 – 1,800", location: "Dubai", sortOrder: 1 },
  { title: "Cleaner", salary: "AED 1,300 – 1,600", location: "Sharjah / Dubai", sortOrder: 2 },
  { title: "Driver (Light Vehicle)", salary: "AED 2,500", location: "Dubai", sortOrder: 3 },
  { title: "General Helper", salary: "AED 1,200 – 1,500", location: "Abu Dhabi", sortOrder: 4 },
  { title: "Technician (MEP)", salary: "AED 2,200 – 3,000", location: "Dubai", sortOrder: 5 },
];

// Demo headcounts from the brief for sample client records.
const CLIENTS = [
  { name: "Logistics Client", short: "LC", industry: "Warehouse & Logistics", contracted: 120, assigned: 120, job: "Warehouse Helper", sites: [["Noon Warehouse", "Dubai", "Dubai South"]] },
  { name: "Farnek", short: "FN", industry: "Cleaning & Facilities", contracted: 90, assigned: 85, job: "Cleaner", sites: [["Jebel Ali", "Dubai", "JAFZA South"], ["Business Bay Towers", "Dubai", "Business Bay"]] },
  { name: "EFS", short: "EFS", industry: "Cleaning & Facilities", contracted: 62, assigned: 60, job: "Cleaner", sites: [["Khalifa City", "Abu Dhabi", "Khalifa City A"]] },
  { name: "Ceva Logistics", short: "CL", industry: "Warehouse & Logistics", contracted: 45, assigned: 45, job: "Warehouse Helper", sites: [["Ceva Jebel Ali DC", "Dubai", "Jebel Ali"]] },
  { name: "Duserve", short: "DS", industry: "Cleaning & Facilities", contracted: 40, assigned: 40, job: "Cleaner", sites: [["Al Shamkha", "Abu Dhabi", "Al Shamkha"]] },
  { name: "World Star", short: "WS", industry: "Construction & Real Estate", contracted: 50, assigned: 48, job: "Labourer", sites: [["Al Jaddaf Project", "Dubai", "Al Jaddaf"]] },
  { name: "IDC Technologies", short: "IDC", industry: "Oil & Gas / Industrial", contracted: 25, assigned: 25, job: "Technician", sites: [["Mussafah Plant", "Abu Dhabi", "Mussafah"]] },
  { name: "Marmoom Manpower", short: "MM", industry: "Bulk Manpower", contracted: 35, assigned: 32, job: "General Helper", sites: [["Sharjah Industrial", "Sharjah", "Industrial Area 13"]] },
  { name: "Adecco", short: "AD", industry: "Warehouse & Logistics", contracted: 40, assigned: 40, job: "Warehouse Helper", sites: [["DIP Warehouse", "Dubai", "Dubai Investment Park"]] },
] as const;

const NAMES: Record<string, [string[], string[]]> = {
  Kenya: [["James", "Peter", "Samuel", "Joseph", "David", "Brian", "Kevin", "Dennis"], ["Mwangi", "Otieno", "Kamau", "Wanjiru", "Kiprop", "Ochieng", "Njoroge", "Mutua"]],
  Uganda: [["Moses", "Isaac", "Ronald", "Patrick", "Godfrey"], ["Okello", "Ssempala", "Mugisha", "Nsubuga", "Byaruhanga"]],
  Ghana: [["Kwame", "Kofi", "Yaw", "Kwabena", "Ibrahim"], ["Mensah", "Owusu", "Boateng", "Asante", "Osei"]],
  Cameroon: [["Emmanuel", "Paul", "Rodrigue", "Herve"], ["Nkem", "Fotso", "Tchinda", "Mbarga"]],
  "Sierra Leone": [["Mohamed", "Abu", "Alhaji", "Sorie"], ["Kamara", "Sesay", "Conteh", "Bangura"]],
  India: [["Rahul", "Suresh", "Anil", "Vijay", "Manoj", "Ramesh"], ["Kumar", "Nair", "Singh", "Yadav", "Pillai", "Reddy"]],
  Nepal: [["Ram", "Bikash", "Suman", "Dipak", "Prakash"], ["Thapa", "Gurung", "Rai", "Tamang", "Shrestha"]],
  Bangladesh: [["Rahim", "Karim", "Habib", "Jamal", "Shakil"], ["Hossain", "Rahman", "Islam", "Uddin", "Ahmed"]],
  Philippines: [["Mark", "John", "Jerome", "Ramon", "Christian"], ["Santos", "Reyes", "Cruz", "Bautista", "Garcia"]],
};
const NATS = Object.keys(NAMES);
const GPS: Record<string, [number, number]> = {"Noon Warehouse": [24.896, 55.161], "Jebel Ali": [24.9857, 55.091], "Business Bay Towers": [25.185, 55.265], "Khalifa City": [24.418, 54.578], "Ceva Jebel Ali DC": [24.97, 55.06], "Al Shamkha": [24.392, 54.71], "Al Jaddaf Project": [25.216, 55.333], "Mussafah Plant": [24.35, 54.495], "Sharjah Industrial": [25.311, 55.425], "DIP Warehouse": [24.981, 55.178]};

let seed = 42;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];
const day = (offset: number) => { const d = new Date(); d.setDate(d.getDate() + offset); return d.toISOString().slice(0, 10); };

async function main() {
  const db = await getDb();

  if (args.has("--clear-demo")) {
    const demo = await db.select({ id: schema.clients.id }).from(schema.clients).where(eq(schema.clients.isDemo, true));
    await db.delete(schema.workers).where(eq(schema.workers.isDemo, true));
    if (demo.length) await db.delete(schema.clients).where(inArray(schema.clients.id, demo.map((d) => d.id)));
    console.log(`✓ Removed demo data (${demo.length} clients and their workers).`);
    return;
  }

  const [{ n: jobCount }] = await db.select({ n: count() }).from(schema.jobs);
  if (jobCount === 0) { await db.insert(schema.jobs).values(JOBS); console.log(`✓ Added ${JOBS.length} job posts.`); }

  if (args.has("--demo")) {
    const [{ n: existing }] = await db.select({ n: count() }).from(schema.workers);
    if (existing > 0) { console.log("• Workers already exist — demo data not added. Run `npm run demo:clear` first if you want to reload it."); return; }
    let ds = 1;
    const docTypes = ["passport", "emirates_id", "visa", "labour_card"] as const;
    const makeWorker = (clientId: string | null, siteId: string | null, job: string, status: "active" | "leave") => {
      const nat = pick(NATS);
      const [first, last] = NAMES[nat];
      return { dsNumber: ds++, fullName: `${pick(first)} ${pick(last)}`, nationality: nat, jobTitle: job, clientId, siteId, status, isDemo: true,
        phone: `+97150${String(1000000 + Math.floor(rnd() * 8999999))}`, joiningDate: day(-Math.floor(rnd() * 1500) - 30),
        basicSalary: (1300 + Math.floor(rnd() * 8) * 100).toFixed(2), overtimeRate: null,
        ...(ds % 97 === 0 ? {} : { personId: String(10000000000000 + Math.floor(rnd() * 89999999999999)), iban: `AE${String(Math.floor(rnd() * 90) + 10)}0${String(Math.floor(rnd() * 1e9)).padStart(9, "0")}${String(Math.floor(rnd() * 1e9)).padStart(9, "0")}`.slice(0, 23), routingCode: "808610001" }) };
    };
    const insertWorkers = async (rows: ReturnType<typeof makeWorker>[]) => {
      const created = await db.insert(schema.workers).values(rows).returning({ id: schema.workers.id });
      const docs = created.flatMap((w) => docTypes.map((type) => {
        const r = rnd();
        const offset = r < 0.01 ? -Math.floor(rnd() * 20) - 1 : r < 0.05 ? Math.floor(rnd() * 30) : 31 + Math.floor(rnd() * 700);
        return { workerId: w.id, type, number: type === "emirates_id" ? `784-19${80 + Math.floor(rnd() * 20)}-${String(Math.floor(rnd() * 9999999)).padStart(7, "0")}-${Math.floor(rnd() * 9)}` : `${type.slice(0, 2).toUpperCase()}${Math.floor(rnd() * 9_000_000 + 1_000_000)}`, expiryDate: day(type === "passport" ? offset + 1500 : offset) };
      }));
      for (let i = 0; i < docs.length; i += 500) await db.insert(schema.workerDocuments).values(docs.slice(i, i + 500));
    };
    let leaveLeft = 5;
    for (const c of CLIENTS) {
      const [client] = await db.insert(schema.clients).values({ name: c.name, short: c.short, industry: c.industry, contractedHeadcount: c.contracted, monthlyRate: "3500.00", dailyRate: "135.00", otRate: "15.00", trn: `1003${String(Math.floor(rnd() * 1e11)).padStart(11, "0")}`, address: `${c.sites[0][2]}, ${c.sites[0][1]}, UAE`, isDemo: true }).returning({ id: schema.clients.id });
      const siteIds: string[] = [];
      for (const [name, emirate, address] of c.sites) {
        const gps = GPS[name];
        const [s] = await db.insert(schema.sites).values({ clientId: client.id, name, emirate, address, latitude: gps?.[0].toString(), longitude: gps?.[1].toString() }).returning({ id: schema.sites.id });
        siteIds.push(s.id);
      }
      const rows = Array.from({ length: c.assigned }, (_, i) => makeWorker(client.id, siteIds[i % siteIds.length], i % 15 === 14 ? "Supervisor" : c.job, leaveLeft > 0 && i === 3 ? (leaveLeft--, "leave") : "active"));
      await insertWorkers(rows);
      console.log(`  ${c.name}: ${c.assigned}/${c.contracted} workers`);
    }
    await insertWorkers(Array.from({ length: 10 }, () => makeWorker(null, null, pick(["Warehouse Helper", "Cleaner", "Driver", "General Helper"]), "active")));
    console.log(`✓ Demo data added: ${CLIENTS.length} clients, ${ds - 1} workers (all marked as demo).`);
    await seedAttendance(db);
    await seedPortals(db);
  }
}

/** Demo attendance for the current month (Dubai time) + a few pending requests. */
async function seedAttendance(db: Awaited<ReturnType<typeof getDb>>) {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Dubai" });
  const prev = new Date(`${today.slice(0, 7)}-01T00:00:00Z`); prev.setUTCMonth(prev.getUTCMonth() - 1);
  const months = [prev.toISOString().slice(0, 7), today.slice(0, 7)];
  const ws = await db.select({ id: schema.workers.id, siteId: schema.workers.siteId, status: schema.workers.status }).from(schema.workers)
    .where(eq(schema.workers.isDemo, true));
  const assigned = ws.filter((w) => w.siteId);
  const rows: (typeof schema.attendance.$inferInsert)[] = [];
  for (const month of months) for (let d = 1; d <= 31; d++) {
    const date = `${month}-${String(d).padStart(2, "0")}`;
    if (date > today) break;
    if (Number.isNaN(Date.parse(date)) || new Date(`${date}T00:00:00Z`).getUTCMonth() !== Number(month.slice(5, 7)) - 1) break;
    const isToday = date === today;
    const isFriday = new Date(`${date}T00:00:00Z`).getUTCDay() === 5;
    let absentToday = 0;
    assigned.forEach((w, i) => {
      if (w.status === "leave") { rows.push({ workerId: w.id, date, status: "L", siteId: w.siteId, source: "leave", note: "annual leave" }); return; }
      if (isFriday) { rows.push({ workerId: w.id, date, status: "OFF", siteId: w.siteId, source: "supervisor" }); return; }
      if (isToday && i % 33 === 7) return; // a few not marked yet today
      const absent = isToday ? absentToday < 10 && i % 47 === 3 && ++absentToday > 0 : rnd() < 0.02;
      if (absent) { rows.push({ workerId: w.id, date, status: "A", siteId: w.siteId, source: "supervisor" }); return; }
      const self = i % 3 === 0;
      const late = rnd() < 0.04;
      const inAt = new Date(`${date}T0${late ? 8 : 7}:${String(late ? 20 + Math.floor(rnd() * 35) : Math.floor(rnd() * 50)).padStart(2, "0")}:00+04:00`);
      const outAt = isToday ? null : new Date(inAt.getTime() + (9 + rnd() * 1.5) * 3_600_000);
      rows.push({
        workerId: w.id, date, status: "P", siteId: w.siteId, source: self ? "self" : "supervisor",
        checkInAt: self ? inAt : null, checkOutAt: self ? outAt : null, late: self && late,
        workedHours: self && outAt ? ((outAt.getTime() - inAt.getTime()) / 3_600_000).toFixed(2) : null,
        overtimeHours: !isToday && rnd() < 0.08 ? String(1 + Math.floor(rnd() * 3)) : "0",
      });
    });
  }
  for (let i = 0; i < rows.length; i += 1000) await db.insert(schema.attendance).values(rows.slice(i, i + 1000));
  const plus = (n: number) => { const x = new Date(`${today}T00:00:00Z`); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
  await db.insert(schema.leaveRequests).values([
    { workerId: assigned[11].id, type: "annual", startDate: plus(10), endDate: plus(24), days: 15, reason: "Going home for family visit" },
    { workerId: assigned[40].id, type: "sick", startDate: today, endDate: plus(1), days: 2, reason: "Fever, clinic visit", status: "supervisor_approved" },
    { workerId: assigned[95].id, type: "emergency", startDate: plus(2), endDate: plus(6), days: 5, reason: "Family emergency" },
  ]);
  await db.insert(schema.overtimeRequests).values([
    { workerId: assigned[5].id, date: plus(-1), hours: "3", reason: "Truck unloading after shift" },
    { workerId: assigned[130].id, date: plus(-2), hours: "2", reason: "Deep cleaning lobby", status: "supervisor_approved" },
  ]);
  await db.insert(schema.advanceRequests).values([{ workerId: assigned[60].id, amount: "800", repaymentMonths: 2, reason: "School fees for my children" }]);
  await db.insert(schema.advanceRequests).values([{ workerId: assigned[20].id, amount: "1200", repaymentMonths: 3, reason: "Rent deposit", status: "approved", adminAt: new Date(`${months[0]}-05T08:00:00Z`) }]);
  console.log(`✓ Demo attendance: ${rows.length.toLocaleString()} records for ${months.join(" and ")}, plus 6 pending requests and 1 approved advance.`);
}

/** Demo announcements, an investor update and sample requests (all clearly demo). */
async function seedPortals(db: Awaited<ReturnType<typeof getDb>>) {
  const [farnek] = await db.select({ id: schema.clients.id }).from(schema.clients).where(eq(schema.clients.name, "Farnek"));
  const [w] = await db.select({ id: schema.workers.id }).from(schema.workers).where(eq(schema.workers.dsNumber, 125));
  await db.insert(schema.announcements).values([
    { title: "Salary for October is processed", body: "October salaries have been sent through WPS. Check your payslip under Payslips.", audience: "employees" },
    { title: "Ramadan working hours (demo)", body: "Working hours will be reduced by 2 hours per day during Ramadan, in line with UAE law.", audience: "all" },
    { title: "Peak-season capacity", body: "Holard can deploy additional warehouse teams for year-end peak. Use Requests to book early.", audience: "clients" },
  ]);
  const prev = new Date(); prev.setUTCDate(1); prev.setUTCMonth(prev.getUTCMonth() - 1);
  await db.insert(schema.investorUpdates).values({ month: prev.toISOString().slice(0, 7), title: "Monthly update (DEMO)", body: "This is a demo investor letter.\n\nHighlights: steady attendance across all sites, new peak-season requests from warehouse clients, and payroll processed on time through WPS.\n\nReplace this with the real monthly update before inviting investors.", isPublished: true, publishedAt: new Date() });
  if (farnek && w) {
    await db.insert(schema.portalRequests).values([
      { reference: "REQ-DEMO1", type: "new_workers", clientId: farnek.id, createdBy: w.id, subject: "10 × Cleaner", details: "Night shift, Business Bay towers, from next week.", quantity: 10, category: "Cleaner" },
      { reference: "REQ-DEMO2", type: "accommodation", workerId: w.id, createdBy: w.id, subject: "AC not working in room", details: "The air conditioner in room 14 is broken since Monday." },
    ]);
  }
  console.log("✓ Demo portal content: 3 announcements, 1 investor update, 2 requests.");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
