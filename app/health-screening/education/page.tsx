import HealthScreeningNavbar from "@/components/layout/HealthScreeningNavbar";
import Footer from "@/components/layout/Footer";

const roles = [
  { role: "Team Leader", service: "Overall coordination, patient flow management, quality assurance" },
  { role: "Station In-charge", service: "Supervises assigned station, ensures correct procedure and documentation" },
  { role: "Phlebotomist", service: "Blood sample collection using safe pricking technique" },
  { role: "BP Monitor", service: "Blood pressure measurement using calibrated sphygmomanometer" },
  { role: "Anthropometry Staff", service: "Height, weight, waist, hip measurements" },
  { role: "Spirometry Technician", service: "Lung function testing and equipment calibration" },
  { role: "Data Entry Operator", service: "Recording patient data into digital records accurately" },
  { role: "Counsellor", service: "Patient education, lifestyle counselling, report interpretation" },
];

const trainingModules = [
  { module: "Phlebotomy & Blood Collection", duration: "2 hours", content: "Pricking technique, sterilization, sharps disposal, patient comfort" },
  { module: "Blood Pressure Measurement", duration: "1.5 hours", content: "Cuff sizing, positioning, Korotkoff sounds, documentation" },
  { module: "Anthropometric Measurements", duration: "1 hour", content: "Height, weight, waist-hip measurement technique, BMI calculation" },
  { module: "Spirometry Testing", duration: "2 hours", content: "Equipment calibration, patient coaching, FEV1/FVC interpretation" },
  { module: "Blood Sugar Testing (RBS)", duration: "1 hour", content: "Glucometer use, strip handling, capillary blood sampling" },
  { module: "Blood Grouping", duration: "1.5 hours", content: "Slide method, anti-sera handling, result interpretation" },
  { module: "Data Entry & Documentation", duration: "1 hour", content: "Patient registration, report entry, digital record management" },
  { module: "Patient Counselling", duration: "1.5 hours", content: "Lifestyle advice, follow-up instructions, report explanation" },
];

const majorTests = [
  { test: "Haemoglobin (Hb)", method: "Sahli's Haemometer / Digital Haemoglobinometer", sample: "Capillary blood", time: "5 minutes" },
  { test: "RBC Count", method: "RBC Pipette + Neubauer Chamber", sample: "Capillary blood", time: "10 minutes" },
  { test: "WBC Count", method: "WBC Pipette + Neubauer Chamber", sample: "Capillary blood", time: "10 minutes" },
  { test: "Blood Pressure", method: "Mercury / Digital Sphygmomanometer", sample: "Non-invasive", time: "3 minutes" },
  { test: "Pulse Rate", method: "Palpation / Pulse Oximeter", sample: "Non-invasive", time: "1 minute" },
  { test: "Respiratory Rate", method: "Observation / Auscultation", sample: "Non-invasive", time: "2 minutes" },
  { test: "Spirometry", method: "Peak Flow Meter / Spirometer", sample: "Non-invasive", time: "10 minutes" },
  { test: "Random Blood Sugar", method: "Glucometer (Capillary)", sample: "Capillary blood", time: "3 minutes" },
  { test: "Blood Grouping", method: "Slide Agglutination Method", sample: "Capillary blood", time: "5 minutes" },
  { test: "BMI", method: "Height & Weight measurement", sample: "Non-invasive", time: "3 minutes" },
  { test: "Waist-Hip Ratio", method: "Flexible measuring tape", sample: "Non-invasive", time: "3 minutes" },
];

const workflowSteps = [
  { step: 1, title: "Registration", description: "Patient details collected – name, age, gender, contact information, medical history." },
  { step: 2, title: "Station Allocation", description: "Patient is directed to appropriate screening stations based on the tests planned." },
  { step: 3, title: "Blood Collection", description: "Capillary blood collected via finger pricking for Hb, RBC, WBC, RBS, and blood grouping." },
  { step: 4, title: "Vital Signs", description: "Blood pressure, pulse rate, and respiratory rate measured using calibrated instruments." },
  { step: 5, title: "Anthropometry", description: "Height, weight, waist circumference, and hip circumference measured." },
  { step: 6, title: "Spirometry", description: "Lung function tests performed following standard spirometry guidelines." },
  { step: 7, title: "Data Entry", description: "All results recorded in patient records – both physical and digital formats." },
  { step: 8, title: "Counselling", description: "Patient receives counselling on results, lifestyle modifications, and follow-up advice." },
  { step: 9, title: "Report Generation", description: "Final compiled report prepared and provided to the patient." },
];

export default function HealthScreeningEducationPage() {
  return (
    <>
      <HealthScreeningNavbar />

      <section className="py-5 mt-5">
        <div className="container">
          <h1 className="text-center mb-4">Education &amp; Training for Health Screening Tests</h1>
          <p className="text-center text-muted mb-5">
            Comprehensive training modules, role definitions, and workflows for conducting health screening camps efficiently.
          </p>

          {/* Roles and Services */}
          <div className="mb-5">
            <h2 className="mb-4">Role / Services</h2>
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Role</th>
                    <th>Service / Responsibility</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td className="fw-semibold">{item.role}</td>
                      <td>{item.service}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Training Modules for Staff */}
          <div className="mb-5">
            <h2 className="mb-4">Training / Staff Modules</h2>
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Module</th>
                    <th>Duration</th>
                    <th>Content</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingModules.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td className="fw-semibold">{item.module}</td>
                      <td>{item.duration}</td>
                      <td>{item.content}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Major Tests */}
          <div className="mb-5">
            <h2 className="mb-4">Major Tests Conducted</h2>
            <div className="table-responsive">
              <table className="table table-bordered table-hover">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Test</th>
                    <th>Method</th>
                    <th>Sample Type</th>
                    <th>Time per Patient</th>
                  </tr>
                </thead>
                <tbody>
                  {majorTests.map((item, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td className="fw-semibold">{item.test}</td>
                      <td>{item.method}</td>
                      <td>{item.sample}</td>
                      <td>{item.time}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workflow */}
          <div className="mb-5">
            <h2 className="mb-4">Workflow of Health Screening Camp</h2>
            <div className="row g-3">
              {workflowSteps.map((item) => (
                <div className="col-md-6 col-lg-4" key={item.step}>
                  <div className="card h-100 shadow-sm border-0">
                    <div className="card-body">
                      <span className="badge bg-primary mb-2">Step {item.step}</span>
                      <h5 className="card-title fw-bold">{item.title}</h5>
                      <p className="card-text">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Importance of Health Screening */}
          <div className="mb-5">
            <h2 className="mb-4">Importance of Health Screening</h2>
            <div className="bg-white p-4 rounded shadow-sm">
              <ul className="list-group list-group-flush">
                <li className="list-group-item">
                  <strong>Early Detection:</strong> Identifies diseases and risk factors before symptoms appear.
                </li>
                <li className="list-group-item">
                  <strong>Preventive Care:</strong> Enables timely interventions and lifestyle modifications.
                </li>
                <li className="list-group-item">
                  <strong>Community Health:</strong> Provides baseline health data for community health assessments.
                </li>
                <li className="list-group-item">
                  <strong>Cost-Effective:</strong> Reduces long-term healthcare costs by preventing disease progression.
                </li>
                <li className="list-group-item">
                  <strong>Patient Education:</strong> Increases health awareness and empowers individuals to take charge of their well-being.
                </li>
                <li className="list-group-item">
                  <strong>Pharmacist Role:</strong> Positions clinical pharmacists as integral members of the healthcare team.
                </li>
              </ul>
            </div>
          </div>

          {/* Reliability of Tests */}
          <div className="mb-5">
            <h2 className="mb-4">Reliability of Tests</h2>
            <div className="bg-white p-4 rounded shadow-sm">
              <p>
                All screening tests are conducted using calibrated, standardised instruments. The reliability of test results depends on:
              </p>
              <ul>
                <li>Proper calibration of equipment before each camp session.</li>
                <li>Adherence to standard operating procedures (SOPs) for each test.</li>
                <li>Training and competency verification of all staff members.</li>
                <li>Use of quality control samples at regular intervals during testing.</li>
                <li>Proper sample collection, handling, and storage techniques.</li>
                <li>Accurate data entry and cross-verification of results.</li>
              </ul>
            </div>
          </div>

          {/* Quality Control */}
          <div className="mb-5">
            <h2 className="mb-4">Quality Control</h2>
            <div className="bg-white p-4 rounded shadow-sm">
              <p>
                Quality control measures are implemented at every stage of the health screening process to ensure accuracy and consistency:
              </p>
              <ul>
                <li>
                  <strong>Pre-analytical:</strong> Proper patient identification, correct sample collection technique, labelled samples, and timely processing.
                </li>
                <li>
                  <strong>Analytical:</strong> Use of calibrated instruments, running known control samples, repeating abnormal results, and following manufacturer instructions.
                </li>
                <li>
                  <strong>Post-analytical:</strong> Accurate result recording, double data entry verification, proper report formatting, and secure storage.
                </li>
                <li>
                  <strong>Equipment Maintenance:</strong> Regular servicing, calibration logs, and immediate replacement of faulty equipment.
                </li>
                <li>
                  <strong>Staff Competency:</strong> Periodic training refreshers, skill assessments, and proficiency testing.
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
