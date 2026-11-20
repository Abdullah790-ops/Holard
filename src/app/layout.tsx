import type { Metadata, Viewport } from "next";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/poppins/800.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "./globals.css";
import { site } from "@/lib/site";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "HOLARD | Manpower Supply & Recruitment UAE — Workers in 48 Hours", template: "%s" },
  description:
    "Manpower supply, recruitment and HR support for logistics, facilities and construction employers across the UAE. Contact HOLARD to plan your workforce needs.",
  openGraph: { type: "website", siteName: "HOLARD Consulting", images: ["/brand/og.jpg"] },
};

export const viewport: Viewport = { themeColor: "#0A1931" };

const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "EmploymentAgency",
  name: "HOLARD",
  url: site.url,
  email: site.email,
  slogan: site.tagline,
  foundingDate: "2020",
  areaServed: "AE",
  address: { "@type": "PostalAddress", addressCountry: "AE", addressLocality: "Dubai", streetAddress: "Salim Al Mazrouye" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <GoogleAnalytics />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </body>
    </html>
  );
}
