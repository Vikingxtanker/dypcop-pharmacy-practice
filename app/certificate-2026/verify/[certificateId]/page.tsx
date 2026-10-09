import { redirect } from "next/navigation";
import { resolveRouteParam } from "@/lib/certificates/certificate-params";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CertificateIdRedirectPageProps = {
  params: Promise<{ certificateId: string }>;
};

export default async function Page({ params }: CertificateIdRedirectPageProps) {
  const certificateId = await resolveRouteParam(params, "certificateId");
  redirect(`/verify/${encodeURIComponent(certificateId)}`);
}
