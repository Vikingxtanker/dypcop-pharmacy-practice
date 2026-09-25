import type { PatientHealthScreeningReportDemographics } from "@/lib/reports/patient-report-data";

interface ReportDemographicsProps {
  patient: PatientHealthScreeningReportDemographics;
}

const DASH = "\u2014";

export default function ReportDemographics({ patient }: ReportDemographicsProps) {
  const fields: { label: string; value?: string; span?: boolean }[] = [
    { label: "Patient Name:", value: patient.name || undefined },
    { label: "Age:", value: patient.age !== undefined && patient.age !== "" ? `${patient.age} years` : undefined },
    { label: "Phone:", value: patient.phone || undefined },
    { label: "Gender:", value: patient.gender || undefined },
    { label: "Patient ID:", value: patient.patientId || undefined },
    { label: "BMI:", value: patient.bmi ? `${patient.bmi} kg/m\u00b2` : undefined },
    { label: "Temperature:", value: patient.temperature || undefined },
    { label: "SpO\u2082:", value: patient.spo2 || undefined },
    { label: "Date:", value: patient.date || undefined },
    { label: "Address:", value: patient.address || undefined, span: true },
  ];

  return (
    <div className="rp-demo-box">
      <div className="rp-demo-grid">
        {fields.map((field) => (
          <div key={field.label} className={`rp-demo-field${field.span ? " rp-demo-span" : ""}`}>
            <div className="rp-demo-label">{field.label}</div>
            <div className="rp-demo-value">{field.value || <span className="rp-dash">{DASH}</span>}</div>
          </div>
        ))}
      </div>
    </div>
  );
}