import type { Metadata } from "next";
import Script from "next/script";
import { AuthProvider } from "@/lib/auth-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dept. of Pharmacy Practice, Dr. D.Y. Patil College of Pharmacy, Akurdi (Pharm.D)",
  description:
    "Department of Pharmacy Practice (Pharm.D) — Dr. D.Y. Patil College of Pharmacy, Akurdi, Pune. Health screening, health camp, ADR reporting, DIC and Pharm.D training.",
  keywords:
    "Pharm.D, Pharmacy Practice, Dr. D.Y. Patil College of Pharmacy, DYP Pharma Akurdi, Akurdi Pune, health camp, pharmacovigilance, ADR reporting",
  openGraph: {
    type: "website",
    title: "Department of Pharmacy Practice, Dr. D.Y. Patil College of Pharmacy, Akurdi (Pharm.D)",
    description:
      "Health camps, ADR & DIC services, and Pharm.D training at DYP College of Pharmacy, Akurdi, Pune.",
    url: "https://dypcoppharmacypractice.in/",
    images: ["https://dypcoppharmacypractice.in/assets/DYP_LOGO_RED.jpg"],
    siteName: "Dr. D. Y. Patil College of Pharmacy, Department of Pharmacy Practice",
  },
  robots: "index, follow",
  alternates: {
    canonical: "https://dypcoppharmacypractice.in/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Bootstrap 5 CSS */}
        <link
          href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
          rel="stylesheet"
        />
        {/* Bootstrap Icons */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.10.5/font/bootstrap-icons.css"
        />
        {/* Ionicons */}
        <script
          type="module"
          src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.esm.js"
        ></script>
        <script
           noModule
          src="https://unpkg.com/ionicons@5.5.2/dist/ionicons/ionicons.js"
        ></script>
        {/* Favicon */}
        <link rel="icon" type="image/png" href="/assets/DYP_LOGO_RED.jpg" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "CollegeOrUniversity",
              name: "Department of Pharmacy Practice, Dr. D.Y. Patil College of Pharmacy, Akurdi",
              url: "https://dypcoppharmacypractice.in/",
              logo: "https://dypcoppharmacypractice.in/assets/DYP_LOGO_RED.jpg",
              sameAs: [
                "https://www.instagram.com/pharmacypractice_dypcop/",
                "https://youtube.com/@departmentofpharmacypracticeph",
                "https://www.dyppharmaakurdi.ac.in/",
              ],
              address: {
                "@type": "PostalAddress",
                streetAddress: "Akurdi, Pune",
                addressLocality: "Pune",
                postalCode: "411044",
                addressCountry: "IN",
              },
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "administrative",
                  email: "helathscreeningservicesdypcop@gmail.com",
                  areaServed: "IN",
                },
              ],
            }),
          }}
        />
      </head>
      <body className="d-flex flex-column min-vh-100">
        <AuthProvider>
          {children}
        </AuthProvider>

        {/* Bootstrap JS */}
        <Script
          src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
