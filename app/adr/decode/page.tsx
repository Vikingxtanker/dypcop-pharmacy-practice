import AdrSectionNavbar from "@/components/layout/AdrSectionNavbar";
import Footer from "@/components/layout/Footer";
import ContactBar from "@/components/layout/ContactBar";

export default function DecodeAdrPage() {
  return (
    <>
      <AdrSectionNavbar />
      <main className="mt-5 pt-4">
        <section className="py-5 bg-white">
          <div className="container">
            <h2 className="fw-bold text-center mb-4">DECODE: Understanding the ADR Reporting Form</h2>
            <p className="lead text-center mb-5">
              The ADR reporting form is a structured document designed to collect comprehensive information about adverse drug reactions.
              It is divided into several key sections to ensure thorough reporting and follow-up.
            </p>

            <div className="mb-5">
              <h4 className="fw-bold">Reporter Information</h4>
              <p><strong>Purpose:</strong> Captures details of the individual reporting the ADR, ensuring traceability and follow-up.</p>
              <p><strong>Includes:</strong> Name, contact information, professional status (e.g., healthcare professional or patient).</p>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">Patient Information</h4>
              <p><strong>Purpose:</strong> Gathers demographic and clinical data of the patient experiencing the ADR.</p>
              <p><strong>Includes:</strong> Age, sex, weight, medical history, and relevant clinical information.</p>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">Suspected Adverse Drug Reaction</h4>
              <p><strong>Purpose:</strong> Details the adverse event experienced, including its nature and severity.</p>
              <p><strong>Includes:</strong> Description of the reaction, onset date, outcome, seriousness, and causality assessment.</p>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">Suspected Medication Information</h4>
              <p><strong>Purpose:</strong> Identifies the medication believed to be responsible for the ADR.</p>
              <p><strong>Includes:</strong> Drug name, manufacturer, batch number, expiry date, dosage form, strength, route of administration, start and stop dates.</p>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">Concomitant Medication</h4>
              <p><strong>Purpose:</strong> Lists other medications the patient was taking concurrently, which could influence the ADR.</p>
              <p><strong>Includes:</strong> Names and details of other drugs administered.</p>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">Medical History</h4>
              <p><strong>Purpose:</strong> Provides background on the patient&apos;s health status to assess potential contributing factors.</p>
              <p><strong>Includes:</strong> Known allergies, previous ADRs, relevant medical and surgical history.</p>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">Outcome of the ADR</h4>
              <p><strong>Purpose:</strong> Assesses the resolution and impact of the ADR on the patient&apos;s health.</p>
              <p><strong>Includes:</strong> Recovery status, any ongoing effects, and long-term implications.</p>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">Reporter&apos;s Assessment of Causality</h4>
              <p><strong>Purpose:</strong> Determines the likelihood that the suspected medication caused the ADR.</p>
              <p><strong>Includes:</strong> Causality assessment using criteria such as the WHO-UMC system.</p>
            </div>

            <div className="mb-5">
              <h3 className="fw-bold text-center mb-3">Glossary of Common Terms</h3>
              <ul>
                <li><strong>Adverse Drug Reaction (ADR):</strong> An unintended, harmful response to a drug at normal doses used in humans for prophylaxis, diagnosis, or therapy.</li>
                <li><strong>Causality Assessment:</strong> The process of determining the likelihood that a drug caused an ADR. Common methods include the WHO-UMC system.</li>
                <li><strong>Serious ADR:</strong> An adverse reaction that results in death, is life-threatening, requires hospitalization, causes persistent disability, or leads to congenital abnormalities.</li>
                <li><strong>Concomitant Medication:</strong> Other medications the patient is taking alongside the suspected drug, which may interact and contribute to the ADR.</li>
                <li><strong>Outcome:</strong> The result of the ADR, including recovery status and any lasting effects.</li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <ContactBar />
      <Footer />
    </>
  );
}
