import { Metadata } from "next";
import CertificateVerificationView from "@/components/certificates/CertificateVerificationView";
import { resolveRouteParam } from "@/lib/certificates/certificate-params";
import { verifyCertificate2026 } from "@/lib/certificates/verify-certificate-2026";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://dypcoppharmacypractice.in";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CertificateIdPageProps = {
  params: Promise<{ certificateId: string }>;
};

export async function generateMetadata({ params }: CertificateIdPageProps): Promise<Metadata> {
  const certificateId = await resolveRouteParam(params, "certificateId");
  const title = "Certificate Verification | D.Y. Patil College of Pharmacy";
  const description = "Official certificate verification for D.Y. Patil College of Pharmacy certificates.";

  return {
    title,
    description,
    robots: {
      index: false,
      follow: false,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/verify/${encodeURIComponent(certificateId)}`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function CertificateVerifyPage({ params }: CertificateIdPageProps) {
  const certificateId = await resolveRouteParam(params, "certificateId");
  const result = await verifyCertificate2026(certificateId);
  return <CertificateVerificationView result={result} />;
}
