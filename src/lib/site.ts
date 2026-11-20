// ─────────────────────────────────────────────────────────────
// HOLARD — central site configuration & copy.
// Edit contact details, numbers and lists here; every page reads from this file.
// Items marked TODO need real values from Holard before launch.
// ─────────────────────────────────────────────────────────────

import serviceCorrectionCopy from "./service-correction-copy.json";

export const site = {
  name: "HOLARD",
  legalName: "HOLARD HR",
  certifications: [] as { name: string; number: string }[], // TODO: certification numbers to publish (licence number is NOT published)
  director: "Mr. Ibrahim Abdullah",
  url: "https://holard.vercel.app",
  tagline: "Workforce solutions for businesses across the UAE",
  h1: "Manpower and recruitment for UAE logistics, facilities and construction teams.",
  sub: "Find dependable people for essential operations, with recruitment, contract staffing and HR support from one UAE partner.",
  email: "info@holard.com",
  phone: null as string | null, // TODO: office number (not the director's mobile)
  phoneHref: null as string | null,
  whatsappHref: null as string | null, // TODO: approved company WhatsApp link
  address: "Salim Al Mazrouye, Dubai, UAE",
  hours: "Mon – Sat, 9 AM – 6 PM",
  social: {
    linkedin: null as string | null,
    instagram: null as string | null,
    facebook: null as string | null,
    tiktok: null as string | null,
  },
};


export const stats = [
  { value: 2020, prefix: "Since ", suffix: "", label: "Operating in the UAE", raw: true },
  { value: 500, suffix: "+", label: "Active Workers Deployed" },
  { value: 1000, suffix: "+", label: "Vetted Talent Pool" },
  { value: 9, suffix: "+", label: "Enterprise Clients" },
  { value: 98, suffix: "%", label: "Daily Attendance" },
  { value: 48, suffix: "h", label: "Deployment Time" },
  { value: 24, suffix: "/7", label: "Support" },
];

/** "Holard Consulting in numbers" (from the company profile). */
export const profileNumbers = [
  { value: 500, suffix: "+", label: "Workers Deployed" },
  { value: 100, suffix: "%", label: "DED Licensed" },
  { value: 24, suffix: "/7", label: "Support" },
  { value: 48, suffix: " hrs", label: "Replacement" },
];

export const vision = "To become a trusted global partner in manpower supply & facilities management by connecting international talent with UAE producers and industrial customers through efficient, ethical, and future-focused solutions.";
export const mission = "To build a globally respected manpower & facilities management enterprise delivering consistent value through integrity, quality, compliance, and sustainable growth across UAE.";
export const values = [
  { t: "Character", d: "Respect, honesty and integrity in all dealings." },
  { t: "Partnership", d: "Long-term relationships built on mutual trust." },
  { t: "Continuous Improvement", d: "Constantly evolving our processes and offerings." },
  { t: "Commitment", d: "Delivering on every promise, every time." },
];

export const team = [
  { name: "Mr. Ibrahim Abdullah", role: "Director", photo: null as string | null },
  { name: "Mr. Francis Daddy Lamboi", role: "Data Entry Manager", photo: "/images/team/francis-lamboi.jpg" },
  { name: "Mr. Thomas Kakpa", role: "Operations Team", photo: "/images/team/thomas-kakpa.jpg" },
  { name: "Ms. Esther Mutura", role: "Digital Strategist", photo: "/images/team/esther-mutura.jpg" },
  { name: "Mr. Bockarie Sheku", role: "Data Entry Operator", photo: "/images/team/bockarie-sheku.jpg" },
];

export type Client = {
  name: string;
  short: string;
  industry: string;
  supplies: string;
  quote: string;
  role: string;
};

export const clients: Client[] = [
  {
    name: "UAE Logistics Client",
    short: "LC",
    industry: "Warehouse & Logistics",
    supplies: "120 warehouse helpers deployed at a Noon store, UAE",
    quote: "Holard supplied 120 warehouse helpers for our Noon store, attendance 98%, invoicing is clear.",
    role: "Operations Manager",
  },
  {
    name: "Farnek",
    short: "FN",
    industry: "Cleaning & Facilities",
    supplies: "Cleaners, helpers and facility staff",
    quote: "Replacement in 24 hours, very professional team.",
    role: "Facilities Manager",
  },
  {
    name: "EFS",
    short: "EFS",
    industry: "Cleaning & Facilities",
    supplies: "Facility management manpower",
    quote: "Best manpower partner for facilities, compliance is perfect.",
    role: "HR Manager",
  },
  {
    name: "Ceva Logistics",
    short: "CL",
    industry: "Logistics & Warehouse",
    supplies: "Warehouse staff for peak season",
    quote: "Warehouse staff delivered on time for peak season.",
    role: "Warehouse Manager",
  },
  {
    name: "Duserve",
    short: "DS",
    industry: "Cleaning & Facilities",
    supplies: "Cleaners and general helpers",
    quote: "Reliable cleaners and helpers, supervisor is responsive.",
    role: "Site Supervisor",
  },
  {
    name: "World Star",
    short: "WS",
    industry: "Construction & Bulk Manpower",
    supplies: "Bulk manpower for construction sites",
    quote: "Fast deployment, good quality workers.",
    role: "Project Manager",
  },
  {
    name: "IDC Technologies",
    short: "IDC",
    industry: "Technical & Industrial",
    supplies: "Technical staff and helpers",
    quote: "Technical staff and helpers, all documents complete.",
    role: "Operations Lead",
  },
  {
    name: "Marmoom Manpower",
    short: "MM",
    industry: "Bulk Manpower",
    supplies: "Bulk deployment partnership",
    quote: "Trusted partner for bulk deployment.",
    role: "Managing Partner",
  },
  {
    name: "Adecco",
    short: "AD",
    industry: "Logistics & Warehouse",
    supplies: "Large candidate pool collaboration",
    quote: "Professional collaboration, large pool of candidates.",
    role: "Account Manager",
  },
];

export const workerTestimonials = [
  {
    name: "Samuel O.",
    role: "Warehouse Helper · Kenya",
    photo: "/images/face-worker-1.jpg",
    quote: "Holard paid salary on time, visa handled. I sent money home from my first month.",
  },
  {
    name: "Ibrahim K.",
    role: "Driver · Ghana",
    photo: "/images/face-worker-2.jpg",
    quote: "Accommodation and transport were ready when I landed. The supervisor answers any time I call.",
  },
  {
    name: "Joseph M.",
    role: "Cleaner · Uganda",
    photo: "/images/face-worker-3.jpg",
    quote: "Medical, visa and Emirates ID all done by Holard. I just focus on my work.",
  },
];

const serviceIcons: Record<string, string> = {
  "hr-consulting": "ShieldCheck", recruitment: "UserRoundSearch", "manpower-solution": "HardHat",
  "warehouse-logistics-staffing": "Warehouse", "construction-contract-staffing": "HardHat",
  "payroll-hr-outsourcing": "WalletCards", "hospitality-staffing": "Hotel",
  "healthcare-staffing": "Stethoscope", "drivers-transport-staffing": "MapPin",
  "cleaning-facilities-staffing": "Sparkles",
};

export const services = Object.values(serviceCorrectionCopy).map((copy) => {
  return {
    slug: copy.slug,
    title: copy.title,
    short: copy.subtitle,
    image: null as string | null,
    icon: serviceIcons[copy.slug] ?? "BadgeCheck",
    metaTitle: `${copy.title} UAE | HOLARD`,
    metaDescription: `${copy.subtitle} Contact our team to discuss your workforce requirements.`,
    h1: copy.title,
    intro: copy.subtitle,
    items: copy.cards.map((card) => ({ t: card.title, d: card.body })),
  };
}).sort((a, b) => {
  const order = ["hr-consulting", "recruitment", "manpower-solution", "warehouse-logistics-staffing", "construction-contract-staffing", "payroll-hr-outsourcing", "hospitality-staffing", "healthcare-staffing", "drivers-transport-staffing", "cleaning-facilities-staffing"];
  return order.indexOf(a.slug) - order.indexOf(b.slug);
});

export const homeServiceCards = [
  { title: "HR Consulting", short: "Practical HR strategy, audits, policies, and performance systems for your team.", href: "/services/hr-consulting", icon: "ShieldCheck" },
  { title: "Recruitment", short: "Find and assess the right permanent hire for the role and your organisation.", href: "/services/recruitment", icon: "UserRoundSearch" },
  { title: "Manpower Solutions", short: "Plan contract teams for site work, operations, and changing workforce demand.", href: "/services/manpower-solution", icon: "HardHat" },
] as const;

export const industries = [
  {
    slug: "warehouse-logistics",
    title: "Warehouse & Logistics",
    short: "Helpers, pickers, packers and drivers for fulfilment centres and 3PLs.",
    image: null as string | null,
    clientsLine: "UAE logistics and distribution operators",
    workers: ["Warehouse Helpers", "Pickers & Packers", "Loaders", "Forklift Operators", "Storekeepers", "Drivers"],
    why: [
      "Peak-season scaling: 50–500 workers in 48–72 hours",
      "Supervisor on site, daily attendance shared with you",
      "Replacement within 24 hours",
    ],
    example: {
      client: "UAE logistics client",
      text: "120 warehouse helpers deployed at a Noon store in the UAE, with 98% daily attendance and one clear monthly invoice.",
    },
  },
  {
    slug: "construction-real-estate",
    title: "Construction & Real Estate",
    short: "Labourers, masons, steel fixers and skilled trades for active sites.",
    image: null as string | null,
    clientsLine: "World Star · Marmoom Manpower",
    workers: ["General Labourers", "Masons", "Steel Fixers", "Carpenters", "Scaffolders", "Helpers"],
    why: [
      "Bulk deployment for project ramp-ups",
      "PPE-ready workers with site safety induction",
      "Transport to site arranged",
    ],
    example: {
      client: "World Star",
      text: "Bulk manpower deployed fast for construction projects — good quality workers, ready on day one.",
    },
  },
  {
    slug: "hospitality-hotels",
    title: "Hospitality & Hotels",
    short: "Stewards, room attendants and kitchen helpers for hotels and events.",
    image: null as string | null,
    clientsLine: "Hotels · Resorts · Events",
    workers: ["Room Attendants", "Stewards", "Kitchen Helpers", "Waiters", "Laundry Staff", "Event Crew"],
    why: [
      "Presentable, guest-ready staff",
      "Flexible numbers for seasons and events",
      "Day, night and split shifts covered",
    ],
    example: {
      client: "Hospitality partners",
      text: "Seasonal stewarding and housekeeping teams supplied on short notice for peak occupancy.",
    },
  },
  {
    slug: "oil-gas-industrial",
    title: "Oil & Gas / Industrial",
    short: "Technicians, helpers and skilled trades for plants and industrial sites.",
    image: null as string | null,
    clientsLine: "IDC Technologies",
    workers: ["Technicians", "Electricians", "Welders", "Fitters", "Helpers", "Storekeepers"],
    why: [
      "Every document complete before deployment",
      "Experience verified for technical roles",
      "HSE-aware workforce",
    ],
    example: {
      client: "IDC Technologies",
      text: "Technical staff and helpers supplied with all documents complete before day one.",
    },
  },
  {
    slug: "healthcare",
    title: "Healthcare",
    short: "Workforce planning for clinics, hospitals and healthcare support teams.",
    image: null as string | null,
    clientsLine: "Clinics · hospitals · healthcare groups",
    workers: ["Facilities staff", "Cleaning teams", "Porters", "Reception support", "Stores assistants", "Operations support"],
    why: ["Role and site requirements are discussed before sourcing", "Shift and access needs can be included in the plan", "Responsibilities and service scope are confirmed before start"],
    example: { client: "Workforce planning", text: "We review the facility, shifts, access requirements, and role scope before preparing a staffing plan." },
  },
  {
    slug: "it-technology",
    title: "IT & Technology",
    short: "Recruitment and workforce support for IT operations and technology teams.",
    image: null as string | null,
    clientsLine: "Technology teams · IT operations · service desks",
    workers: ["IT support", "Helpdesk staff", "Data entry", "Device deployment", "Technical coordinators", "Operations assistants"],
    why: ["Role requirements are clarified before sourcing", "Candidate experience is matched against the brief", "Interview and onboarding steps are coordinated with your team"],
    example: { client: "Workforce planning", text: "We align the hiring brief with required skills, work location, schedule, and the team’s selection process." },
  },
] as const;

export const countries = [
  "Kenya",
  "Cameroon",
  "Uganda",
  "Sierra Leone",
  "Chad",
  "India",
  "Nepal",
  "Ghana",
  "Bangladesh",
  "Philippines",
];

export const whyHolard = [
  { t: "Since 2020", d: "Six years of deploying workers across the UAE.", icon: "CalendarCheck" },
  { t: "WPS Compliant", d: "Salaries paid on time through the Wage Protection System.", icon: "BadgeCheck" },
  { t: "Visa Handling", d: "Entry permit, medical, Emirates ID and labour card — done.", icon: "FileCheck2" },
  { t: "Replacement in 24H", d: "If a worker leaves, a replacement is on site within 24 hours.", icon: "RefreshCw" },
  { t: "GPS Attendance", d: "Daily check-in by site, shared with you live.", icon: "MapPin" },
  { t: "One Invoice", d: "One monthly invoice with site-wise breakup and attendance attached.", icon: "Receipt" },
];

export const howItWorks = [
  { t: "Tell Us Your Need", d: "Role, number of workers, site and start date." },
  { t: "Shortlist in 48H", d: "We present screened candidates from our pool." },
  { t: "Deploy", d: "Workers arrive on site with visa, PPE and transport." },
  { t: "Review and Pay", d: "Review attendance and receive one clear monthly invoice." },
];

export const homeFaqs = [
  {
    q: "How fast can you deploy workers?",
    a: "We share a shortlist within 48 hours. For our ready pool, we can deploy 50–500 workers within 48–72 hours depending on role and site.",
  },
  {
    q: "What is included in the monthly rate?",
    a: "Visa, salary, accommodation, transport, medical insurance, uniform and replacement. You pay one rate per worker per month.",
  },
  {
    q: "What happens if a worker leaves or is absent?",
    a: "We replace any worker within 24 hours. Absent days are not invoiced.",
  },
  {
    q: "Which emirates do you cover?",
    a: "We deploy across the UAE — Dubai, Sharjah, Abu Dhabi, Ajman and the Northern Emirates.",
  },
];

export const faqGroups = [
  {
    group: "For Clients",
    items: [
      ...homeFaqs,
      { q: "What is the minimum number of workers?", a: "We supply from 1 worker up to 500+. Rates are better for larger and longer contracts." },
      { q: "Do you supply workers for short-term projects?", a: "Yes. We support daily, weekly, monthly and long-term contracts." },
      { q: "How is attendance tracked?", a: "Workers check in daily by site. Supervisors can mark bulk attendance, and you get a monthly sheet with every invoice." },
      { q: "How does invoicing work?", a: "You receive one invoice per month with a site-wise breakup, the list of DS codes and the attendance sheet attached." },
      { q: "Are your workers WPS compliant?", a: "Yes. All salaries are paid through the UAE Wage Protection System." },
      { q: "Do you provide supervisors on site?", a: "Yes. For larger teams we assign a dedicated supervisor who manages attendance and is your single point of contact." },
      { q: "Do your workers come with PPE and uniforms?", a: "Yes. Workers arrive in Holard uniform with standard PPE. Site-specific PPE can be arranged on request." },
      { q: "Can I interview candidates before deployment?", a: "Yes. For recruitment and long-term roles we arrange interviews from the shortlist." },
    ],
  },
  {
    group: "For Workers & Candidates",
    items: [
      { q: "Do I pay any fee to apply?", a: "No. Holard never charges candidates a recruitment fee. If anyone asks you for money in our name, report it to us." },
      { q: "Which countries do you recruit from?", a: "Kenya, Cameroon, Uganda, Sierra Leone, Chad, India, Nepal, Ghana, Bangladesh and the Philippines." },
      { q: "Will Holard provide my visa?", a: "Yes. Selected candidates receive their employment visa, medical and Emirates ID through Holard." },
      { q: "Is accommodation and transport provided?", a: "For most roles, yes — accommodation and transport to site are provided." },
      { q: "When is salary paid?", a: "Monthly, on time, through WPS into your bank account or salary card." },
      { q: "How do I check my application status?", a: "Our recruitment team will call you. You can also email us any time." },
      { q: "Can I apply if I am already in the UAE?", a: "Yes. Select your current location in the application form." },
    ],
  },
  {
    group: "For Investors",
    items: [
      { q: "How does Holard make money?", a: "Clients pay a monthly rate per deployed worker. The margin covers salary, visa, housing, transport and operations." },
      { q: "Is the revenue recurring?", a: "Yes. Most clients run monthly contracts with the same workforce over many months." },
      { q: "How do I get investor access?", a: "Submit the Request Investor Access form. Our team verifies every request before granting a login." },
      { q: "What will I see in the investor portal?", a: "Business numbers only — monthly revenue, active workers, active clients and invoice status. Never worker personal data." },
      { q: "Are the figures audited?", a: "Approved figures show their source and last-updated date. Ask our team for the latest financial summary." },
      { q: "What are the growth targets?", a: "Our vision is 2,000 active workers by 2027." },
    ],
  },
];

export const jobs = [
  { title: "Warehouse Helper", salary: "AED 1,500 – 1,800", location: "Dubai", type: "Full-time" },
  { title: "Cleaner", salary: "AED 1,300 – 1,600", location: "Sharjah / Dubai", type: "Full-time" },
  { title: "Driver (Light Vehicle)", salary: "AED 2,500", location: "Dubai", type: "Full-time" },
  { title: "General Helper", salary: "AED 1,200 – 1,500", location: "Abu Dhabi", type: "Full-time" },
  { title: "Technician (MEP)", salary: "AED 2,200 – 3,000", location: "Dubai", type: "Full-time" },
];
// TODO: only Driver AED 2,500 was supplied in the brief — confirm the other salary ranges.

export const timeline = [
  { year: "2020", t: "Founded", d: "Started in the UAE with 8 workers." },
  { year: "2021", t: "First 50 Workers", d: "Grew a reliable pool through referrals." },
  { year: "2023", t: "First Enterprise Client", d: "Signed our first enterprise contract." },
  { year: "2025", t: "300 Workers", d: "Scaled across warehouse, facilities and construction." },
  { year: "2026", t: "500 Workers + 9 Clients", d: "Trusted by enterprise brands across the UAE." },
];

export const blogPosts = [
  {
    slug: "how-to-hire-helpers-in-uae",
    title: "How to Hire Helpers in the UAE: A 2026 Guide for Employers",
    excerpt: "Visa, cost, contracts and timelines — everything you need before hiring warehouse or general helpers.",
    image: "/images/blog-hire-helpers.jpg",
    date: "2026-10-20",
    body: [
      "Hiring helpers in the UAE comes down to three choices: sponsor them yourself, use a recruitment agency, or use a manpower supply company that keeps the workers on its own visa.",
      "Sponsoring workers yourself gives you control but means handling quota, entry permits, medicals, Emirates ID, labour cards, accommodation and WPS payroll in-house.",
      "A manpower supply company such as HOLARD charges one rate per worker per month. Visa, salary, housing, transport and replacement are included, so you can scale up for peak season and back down without long commitments.",
      "Before you hire, define the role, the number of workers, the site, shift pattern and start date. With that, a good supplier can share a shortlist within 48 hours.",
    ],
  },
  {
    slug: "uae-labour-law-update",
    title: "UAE Labour Law Update: What Employers Must Know",
    excerpt: "Key points on contracts, leave, gratuity and working hours for UAE employers.",
    image: "/images/blog-labour-law.jpg",
    date: "2026-09-15",
    body: [
      "UAE Federal Labour Law sets the rules for contracts, working hours, leave, end-of-service gratuity and termination for private-sector employees.",
      "All contracts are now fixed-term. Employers must issue a written contract registered with the Ministry of Human Resources and Emiratisation (MOHRE).",
      "Gratuity is calculated on basic salary and length of service. Getting it wrong can lead to disputes and fines, so many employers outsource the calculation.",
      "This article is general information, not legal advice. Contact our HR consulting team for advice on your situation.",
    ],
  },
  {
    slug: "wps-explained",
    title: "WPS Explained: Paying Workers the Right Way",
    excerpt: "What the Wage Protection System is, how SIF files work and how to stay compliant.",
    image: "/images/blog-wps.jpg",
    date: "2026-08-02",
    body: [
      "The Wage Protection System (WPS) is the UAE's electronic salary transfer system. It lets authorities confirm that workers are paid in full and on time.",
      "Each month, employers submit a Salary Information File (SIF) through an approved bank or exchange house.",
      "Late or missing WPS payments can block new work permits, so many companies outsource payroll to a partner who runs WPS every month.",
    ],
  },
];

export const nav = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  {
    label: "Services",
    href: "/services",
    children: services.map((s) => ({ label: s.title, href: `/services/${s.slug}`, desc: s.short })),
  },
  {
    label: "Industries",
    href: "/industries",
    children: industries.map((s) => ({ label: s.title, href: `/industries/${s.slug}`, desc: s.short })),
  },
  { label: "Our Clients", href: "/clients" },
  { label: "For Candidates", href: "/candidates" },
  { label: "Testimonials", href: "/testimonials" },
  {
    label: "Portals",
    href: "/investors",
    children: [
      { label: "Investor Portal", href: "/investors", desc: "Invest in the workforce behind UAE's empire." },
      { label: "Employee Portal", href: "/employee-portal", desc: "Payslips, attendance, leave and documents." },
      { label: "Client Portal", href: "/login", desc: "Live attendance, invoices and requests." },
    ],
  },
  { label: "Contact", href: "/contact" },
];
