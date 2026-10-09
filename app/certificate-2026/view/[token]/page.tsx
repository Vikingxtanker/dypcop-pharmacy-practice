import { Metadata } from "next";
import CertificateVerificationView from "@/components/certificates/CertificateVerificationView";
import { resolveRouteParam } from "@/lib/certificates/certificate-params";
import { redeemCertificateToken } from "@/lib/certificates/certificate-token";
import { verifyCertificate2026, type CertificateVerificationResult } from "@/lib/certificates/verify-certificate-2026";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ViewPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const title = "Certificate Verification | D.Y. Patil College of Pharmacy";
  const description = "Official certificate verification for D.Y. Patil College of Pharmacy certificates.";
  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description, type: "website" },
    twitter: { card: "summary", title, description },
  };
}

export default async function CertificateViewPage({ params }: ViewPageProps) {
  const token = await resolveRouteParam(params, "token");
  const payload = redeemCertificateToken(token);

  if (!payload) {
    return <CertificateVerificationView invalidLink result={{ outcome: "not_found", certificateId: null, participantName: null, issuedAt: null, status: null }} />;
  }

  const result: CertificateVerificationResult = await verifyCertificate2026(payload.certificateId);
  return <CertificateVerificationView result={result} />;
}
