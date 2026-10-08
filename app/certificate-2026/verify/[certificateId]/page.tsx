export default function CertificateVerifyPage({
  params,
}: {
  params: { certificateId: string };
}) {
  return (
    <main className="flex-fill mt-5 pt-5">
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 text-center">
            <h2 className="fw-bold mb-4">Certificate Verification</h2>
            <div className="bg-white p-4 shadow rounded">
              <h5 className="mb-3">Certificate ID: {params.certificateId}</h5>
              <p className="text-muted mb-0">Verification system coming soon.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}