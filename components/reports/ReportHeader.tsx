import type { ReportAssets } from "@/lib/reports/report-assets";

export default function ReportHeader({ assets }: { assets: ReportAssets }) {
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
      </div>
    </header>
  );
}
