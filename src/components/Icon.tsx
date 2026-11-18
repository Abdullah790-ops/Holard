import {
  BadgeCheck, CalendarCheck, FileCheck2, RefreshCw, MapPin, Receipt, ShieldCheck, Users, HardHat,
  Warehouse, Sparkles, Building2, Hotel, Factory, Store, type LucideIcon,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  BadgeCheck, CalendarCheck, FileCheck2, RefreshCw, MapPin, Receipt, ShieldCheck, Users, HardHat,
  Warehouse, Sparkles, Building2, Hotel, Factory, Store,
};

export function Icon({ name, className }: { name: string; className?: string }) {
  const C = map[name] ?? BadgeCheck;
  return <C className={className} aria-hidden />;
}
