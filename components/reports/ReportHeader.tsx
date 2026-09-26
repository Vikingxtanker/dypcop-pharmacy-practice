import type { ReportAssets } from "@/lib/reports/report-assets";

export default function ReportHeader({
  assets,
  qrSrc,
}: {
  assets: ReportAssets;
  qrSrc: string | null;
}) {
  return (
    <header className="rp-header">
      <div className="rp-header-grid">
        <div className="rp-logo-panel">
          <img className="rp-logo" src={assets.logoSrc} alt="Dr. D. Y. Patil College of Pharmacy logo" />
        </div>

        <div className="rp-institution">
          <div className="rp-college-name">
            Dr. D. Y. Patil College of Pharmacy Akurdi, Pune - 411044.
          </div>

          <div className="rp-address">
            D.Y. Patil Educational Complex, Sector, Pradhikaran,
            <br />
            Nigdi, Pune, Maharashtra 412044.
          </div>

          <div className="rp-separator"></div>

          <div className="rp-department">Department of Pharmacy Practice (Pharm.D)</div>
        </div>

        {/* Same signed report URL as before, just moved from the footer to the
            header. No label: the code itself is the indicator, and the alt text
            carries the meaning for assistive technology. */}
        {qrSrc && (
          <div className="rp-header-qr">
            <img src={qrSrc} alt="QR code to view this report online" />
          </div>
        )}
      </div>
    </header>
  );
}
