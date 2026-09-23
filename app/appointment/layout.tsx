import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Book Your Appointment | Dr. D.Y. Patil College of Pharmacy",
  description:
    "Book your appointment for the Health Screening Camp at Dr. D.Y. Patil College of Pharmacy, Akurdi.",
  alternates: {
    canonical: "https://dypcoppharmacypractice.in/appointment",
  },
  openGraph: {
    title: "Book Your Appointment | Dr. D.Y. Patil College of Pharmacy",
    description:
      "Book your appointment for the Health Screening Camp at Dr. D.Y. Patil College of Pharmacy, Akurdi.",
    url: "https://dypcoppharmacypractice.in/appointment",
    images: [
      {
        url: "https://dypcoppharmacypractice.in/assets/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Book Your Appointment - Dr. D.Y. Patil College of Pharmacy, Akurdi",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Book Your Appointment | Dr. D.Y. Patil College of Pharmacy",
    description:
      "Book your appointment for the Health Screening Camp at Dr. D.Y. Patil College of Pharmacy, Akurdi.",
    images: ["https://dypcoppharmacypractice.in/assets/og-image.webp"],
  },
};

export default function AppointmentLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}