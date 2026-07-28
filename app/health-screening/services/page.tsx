import HealthScreeningNavbar from "@/components/layout/HealthScreeningNavbar";
import Footer from "@/components/layout/Footer";

const services = [
  { id: 1, name: "Haemoglobin (Hb)", description: "Measures the amount of haemoglobin in the blood to screen for anaemia and polycythemia.", normalRange: "Male: 13.5 – 17.5 g/dL\nFemale: 12.0 – 16.0 g/dL" },
  { id: 2, name: "Red Blood Cell Count (RBC)", description: "Counts the total number of red blood cells per unit volume of blood.", normalRange: "Male: 4.5 – 5.5 million/µL\nFemale: 3.8 – 4.8 million/µL" },
  { id: 3, name: "White Blood Cell Count (WBC)", description: "Measures the total number of white blood cells to detect infection, inflammation, or immune disorders.", normalRange: "4,000 – 11,000 cells/µL" },
  { id: 4, name: "Blood Pressure (BP)", description: "Measures the force of blood against artery walls to screen for hypertension and hypotension.", normalRange: "Systolic: < 120 mmHg\nDiastolic: < 80 mmHg" },
  { id: 5, name: "Pulse Rate (PR)", description: "Measures the number of heartbeats per minute to assess cardiovascular health.", normalRange: "60 – 100 beats/min" },
  { id: 6, name: "Respiratory Rate (RR)", description: "Counts the number of breaths per minute to evaluate respiratory function.", normalRange: "12 – 20 breaths/min" },
  { id: 7, name: "Spirometry", description: "Measures lung function by assessing the volume and flow of air inhaled and exhaled.", normalRange: "FEV1: ≥ 80% predicted\nFVC: ≥ 80% predicted" },
  { id: 8, name: "Height", description: "Measures the standing height of an individual for anthropometric assessment.", normalRange: "Varies by age and gender" },
  { id: 9, name: "Weight", description: "Measures body mass to assess nutritional status and screen for obesity or underweight.", normalRange: "Varies by height and age" },
  { id: 10, name: "Body Mass Index (BMI)", description: "Calculated from height and weight to classify weight status.", normalRange: "18.5 – 24.9 kg/m² (Normal)" },
  { id: 11, name: "Waist-Hip Ratio (W-H Ratio)", description: "Ratio of waist circumference to hip circumference to assess central obesity risk.", normalRange: "Male: < 0.90\nFemale: < 0.85" },
  { id: 12, name: "Random Blood Sugar (RBS)", description: "Measures blood glucose at any time of day to screen for diabetes and pre-diabetes.", normalRange: "70 – 140 mg/dL (Normal)" },
  { id: 13, name: "Blood Group", description: "Determines ABO and Rh blood group type for transfusion compatibility and medical records.", normalRange: "A+, A−, B+, B−, AB+, AB−, O+, O−" },
];

export default function HealthScreeningServicesPage() {
  return (
    <>
      <HealthScreeningNavbar />

      <section className="py-5 mt-5">
        <div className="container">
          <h1 className="text-center mb-4">Health Screening Tests – Services Provided</h1>
          <p className="text-center text-muted mb-5">
            The Department of Pharmacy Practice provides 13 health screening services as part of community health assessment and patient care.
          </p>

          {/* Services Description */}
          <div className="row g-4 mb-5">
            {services.map((service) => (
              <div className="col-md-6 col-lg-4" key={service.id}>
                <div className="card h-100 shadow-sm border-0">
                  <div className="card-body">
                    <h5 className="card-title fw-bold text-primary">
                      {service.id}. {service.name}
                    </h5>
                    <p className="card-text">{service.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Normal Values Table */}
          <h2 className="text-center mb-4">Normal Reference Values</h2>
          <div className="table-responsive">
            <table className="table table-bordered table-hover table-striped">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: "5%" }}>#</th>
                  <th style={{ width: "25%" }}>Test / Parameter</th>
                  <th style={{ width: "35%" }}>Description</th>
                  <th style={{ width: "35%" }}>Normal Values</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id}>
                    <td>{service.id}</td>
                    <td className="fw-semibold">{service.name}</td>
                    <td>{service.description}</td>
                    <td>
                      <pre className="mb-0" style={{ fontFamily: "inherit", whiteSpace: "pre-wrap" }}>
                        {service.normalRange}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
