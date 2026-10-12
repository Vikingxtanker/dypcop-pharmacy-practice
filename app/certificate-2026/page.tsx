import type { Metadata } from "next";
import Certificate2026Client from "./Certificate2026Client";

const PAGE_URL = "https://dypcoppharmacypractice.in/certificate-2026";
const OG_IMAGE_URL = "https://dypcoppharmacypractice.in/assets/certificate-2026-og.webp";
const OG_IMAGE_ALT = "Health Camp Certificate 2026 — download your participation certificate";
const TITLE = "Health Camp Certificate 2026 | Dr. D. Y. Patil College of Pharmacy";
const DESCRIPTION =
  "Find, verify, and download your participation certificate for the Health Check-up Camp 2026 organized by the Department of Pharmacy Practice, Dr. D. Y. Patil College of Pharmacy, Akurdi, Pune.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: PAGE_URL,
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    siteName: "Dr. D. Y. Patil College of Pharmacy",
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1734,
        height: 907,
        alt: OG_IMAGE_ALT,
        type: "image/webp",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: OG_IMAGE_URL,
        alt: OG_IMAGE_ALT,
      },
    ],
  },
};

export default function Certificate2026Page() {
  return <Certificate2026Client />;
}
