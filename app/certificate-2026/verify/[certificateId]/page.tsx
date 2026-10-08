import { redirect } from "next/navigation";

export default function Page({
  params,
}: {
  params: { certificateId: string };
}) {
  redirect(`/verify/${params.certificateId}`);
}

