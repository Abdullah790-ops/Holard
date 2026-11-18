// Shared form definitions — used by the client form UI and the server-side validator.
import { countries, industries, jobs } from "./site";

export type Field = {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "select" | "textarea" | "file" | "rating" | "date";
  required?: boolean;
  options?: string[];
  placeholder?: string;
  accept?: string;
  full?: boolean;
  dynamic?: boolean; // options supplied at runtime (e.g. live jobs)
  min?: number;
  max?: number;
};

const nationalities = [...countries, "Pakistan", "Sri Lanka", "Nigeria", "Other"];

export const forms: Record<string, { title: string; fields: Field[]; success: string; button: string }> = {
  consultation: {
    title: "Book a Consultation",
    button: "Request Consultation",
    success: "Thank you! We have received your request and will call you back to confirm the time.",
    fields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "company", label: "Company", type: "text" },
      { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "+971 5X XXX XXXX" },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "topic", label: "What would you like to discuss?", type: "select", required: true, full: true, options: ["Hiring workers (manpower supply)", "Recruitment", "HR consulting", "Investing in Holard", "Other"] },
      { name: "preferredDate", label: "Preferred date", type: "date", required: true },
      { name: "preferredTime", label: "Preferred time", type: "select", required: true, options: ["Morning (9 AM – 12 PM)", "Afternoon (12 – 3 PM)", "Late afternoon (3 – 6 PM)"] },
      { name: "meeting", label: "How should we meet?", type: "select", required: true, full: true, options: ["Phone call", "Video call", "At our office", "At your site"] },
      { name: "message", label: "Anything we should know?", type: "textarea", full: true },
    ],
  },
  hire: {
    title: "Hire Workers",
    button: "Request Workers",
    success: "Thank you! Our team will call you within 2 working hours with availability and a quote.",
    fields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "company", label: "Company", type: "text", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "+971 5X XXX XXXX" },
      { name: "email", label: "Work Email", type: "email", required: true },
      { name: "category", label: "Workers Needed", type: "select", required: true, options: ["Warehouse Helpers", "Cleaners", "Drivers", "Construction Labour", "Technicians", "Hospitality Staff", "Office Staff", "Other"] },
      { name: "quantity", label: "Number of Workers", type: "number", required: true, min: 1, max: 5000 },
      { name: "industry", label: "Industry", type: "select", options: industries.map((i) => i.title) },
      { name: "location", label: "Site Location / Emirate", type: "text", placeholder: "e.g. Jebel Ali, Dubai" },
      { name: "message", label: "Start date & details", type: "textarea", full: true },
    ],
  },
  apply: {
    title: "Apply For a Job",
    button: "Submit Application",
    success: "Thank you for applying! Our recruitment team will call you. Holard never charges candidates any fee.",
    fields: [
      { name: "name", label: "Full Name (as in passport)", type: "text", required: true },
      { name: "nationality", label: "Nationality", type: "select", required: true, options: nationalities },
      { name: "age", label: "Age", type: "number", required: true, min: 18, max: 60 },
      { name: "phone", label: "Phone", type: "tel", required: true, placeholder: "With country code" },
      { name: "location", label: "Current Location", type: "select", required: true, options: ["In UAE", "In home country", "Other GCC country"] },
      { name: "job", label: "Job Wanted", type: "select", required: true, dynamic: true, options: [...jobs.map((j) => j.title), "Other"] },
      { name: "experience", label: "Experience (years)", type: "number", required: true, min: 0, max: 40 },
      { name: "passport", label: "Passport (PDF / image)", type: "file", accept: ".pdf,.jpg,.jpeg,.png", required: true },
      { name: "cv", label: "CV (PDF / Word)", type: "file", accept: ".pdf,.doc,.docx" },
      { name: "photo", label: "Photo", type: "file", accept: ".jpg,.jpeg,.png" },
    ],
  },
  contact: {
    title: "Send Us a Message",
    button: "Send Message",
    success: "Thank you! We reply within one working day.",
    fields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "company", label: "Company", type: "text" },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "tel" },
      { name: "iam", label: "I Am", type: "select", required: true, options: ["Client", "Job Seeker", "Investor"], full: true },
      { name: "message", label: "Message", type: "textarea", required: true, full: true },
    ],
  },
  review: {
    title: "Leave a Review",
    button: "Submit Review",
    success: "Thank you! Your review will appear after our team approves it.",
    fields: [
      { name: "name", label: "Your Name", type: "text", required: true },
      { name: "company", label: "Company", type: "text" },
      { name: "rating", label: "Rating", type: "rating", required: true, full: true },
      { name: "message", label: "Your Review", type: "textarea", required: true, full: true },
    ],
  },
  investor: {
    title: "Request Investor Access",
    button: "Request Access",
    success: "Thank you! Our investor relations team will verify your request and send login details once approved.",
    fields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "interest", label: "Investment Interest", type: "select", required: true, options: ["Under AED 250K", "AED 250K – 1M", "AED 1M – 5M", "Above AED 5M", "Strategic partnership"] },
      { name: "message", label: "Anything we should know?", type: "textarea", full: true },
    ],
  },
  careers: {
    title: "Join the Holard Office Team",
    button: "Send Application",
    success: "Thank you! Our HR team will review your CV and contact you if there's a match.",
    fields: [
      { name: "name", label: "Full Name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "phone", label: "Phone", type: "tel", required: true },
      { name: "role", label: "Role", type: "select", required: true, options: ["Recruitment Coordinator", "Operations Supervisor", "HR & Payroll Executive", "Business Development Manager", "Other"] },
      { name: "cv", label: "CV (PDF / Word)", type: "file", accept: ".pdf,.doc,.docx", required: true },
      { name: "message", label: "Cover note", type: "textarea", full: true },
    ],
  },
};
