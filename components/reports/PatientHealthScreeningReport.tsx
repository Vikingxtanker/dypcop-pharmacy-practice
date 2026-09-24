import { CircleUser, FlaskConical, HeartPulse, MessagesSquare } from "lucide-react";
import ReportHeader from "./ReportHeader";
import ReportDemographics from "./ReportDemographics";
import ReportLaboratoryResults from "./ReportLaboratoryResults";
import ReportCounseling from "./ReportCounseling";
import ReportFooter from "./ReportFooter";
import type { PatientHealthScreeningReportData } from "@/lib/reports/patient-report-data";
import type { ReportAssets } from "@/lib/reports/report-assets";

interface PatientHealthScreeningReportProps {
  data: PatientHealthScreeningReportData;
  assets: ReportAssets;
}

export function PatientHealthScreeningReport({ data, assets }: PatientHealthScreeningReportProps) {
  return (
    <article className="rp-sheet">
      <ReportHeader assets={assets} />

      <div className="rp-title-strip">
        <HeartPulse className="rp-title-icon" aria-hidden="true" />
        <span>Health Screening Report</span>
      </div>

      <div className="rp-content">
        <section className="rp-section">
          <h2 className="rp-section-heading">
            <span className="rp-section-icon">
              <CircleUser aria-hidden="true" />
            </span>
            <span>Demographics:</span>
            <span className="rp-heading-line"></span>
          </h2>
          <ReportDemographics patient={data.patient} />
        </section>

        <section className="rp-section">
          <h2 className="rp-section-heading">
            <span className="rp-section-icon">
              <FlaskConical aria-hidden="true" />
            </span>
            <span>Laboratory Test Result:</span>
            <span className="rp-heading-line"></span>
          </h2>
          <ReportLaboratoryResults results={data.laboratoryResults} watermarkSrc={assets.logoSrc} />
        </section>

        <section className="rp-section">
          <h2 className="rp-section-heading">
            <span className="rp-section-icon">
              <MessagesSquare aria-hidden="true" />
            </span>
            <span>Patient Counseling Points:</span>
            <span className="rp-heading-line"></span>
          </h2>
          <ReportCounseling points={data.counselingPoints} />
        </section>
      </div>

      <ReportFooter qrSrc={assets.qrSrc} />
    </article>
  );
}