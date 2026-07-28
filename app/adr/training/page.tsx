import AdrSectionNavbar from "@/components/layout/AdrSectionNavbar";
import Footer from "@/components/layout/Footer";
import ContactBar from "@/components/layout/ContactBar";

export default function TrainingEducationPage() {
  return (
    <>
      <AdrSectionNavbar />
      <main className="mt-5 pt-4">
        <section className="py-5 bg-white">
          <div className="container">
            <h2 className="fw-bold text-center mb-4">Training &amp; Education</h2>
            <p className="lead text-center mb-5">
              Welcome to the Training and Education section, designed to equip you with the knowledge and skills
              necessary for effective ADR (Adverse Drug Reaction) reporting.
            </p>

            <div className="mb-5">
              <h4 className="fw-bold">How Does PvPI Work?</h4>
              <p>
                The Pharmacovigilance Programme of India (PvPI) is the Government of India&apos;s flagship drug safety monitoring programme.
                It collects, collates, and analyses drug-related adverse events, sending recommendations to the
                Central Drugs Standard Control Organisation (CDSCO) for appropriate regulatory actions.
              </p>
              <ul>
                <li><strong>Adverse Drug Reaction (ADR) Monitoring Centres (AMCs):</strong> Over 600 centres across India report ADRs.</li>
                <li><strong>National Coordination Centre (NCC):</strong> Located at the Indian Pharmacopoeia Commission (IPC), Ghaziabad.</li>
                <li><strong>VigiFlow Software:</strong> Used for submitting Individual Case Safety Reports (ICSRs) to the NCC.</li>
                <li><strong>Signal Review Panel (SRP):</strong> Assesses identified safety signals and recommends actions.</li>
              </ul>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">Steps to Fill the ADR Reporting Form</h4>
              <ol>
                <li><strong>Download the Form:</strong> Access the official ADR reporting form from the PvPI website.</li>
                <li><strong>Fill in Reporter Information:</strong> Provide details of the reporter.</li>
                <li><strong>Enter Patient Information:</strong> Include demographic and clinical data.</li>
                <li><strong>Describe the ADR:</strong> Detail onset, severity, and outcome.</li>
                <li><strong>List Suspected Medications:</strong> Provide drug details.</li>
                <li><strong>Include Concomitant Medications:</strong> List concurrent drugs.</li>
                <li><strong>Provide Medical History:</strong> Include relevant health background.</li>
                <li><strong>Assess Outcome:</strong> Indicate resolution status.</li>
                <li><strong>Submit the Form:</strong> Send the completed form to an ADR Monitoring Centre.</li>
              </ol>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">PvPI History and Overview</h4>
              <p>
                The PvPI was formally launched on <strong>July 14, 2010</strong>, by the Ministry of Health and Family Welfare, Government of India.
                Initially coordinated by AIIMS, New Delhi, the National Coordination Centre was shifted to the
                Indian Pharmacopoeia Commission (IPC), Ghaziabad in 2011.
              </p>
              <p><strong>Mission:</strong> Safeguard the health of the Indian population by ensuring the benefits of medicines outweigh the risks.</p>
              <p><strong>Vision:</strong> Improve patient safety and welfare by monitoring the safety of medicines and reducing risks.</p>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">UMC Centre: Role and Responsibilities</h4>
              <p>
                The Uppsala Monitoring Centre (UMC) in Sweden is a World Health Organization (WHO) Collaborating Centre
                for International Drug Monitoring. It provides scientific support to countries, including India, in pharmacovigilance activities.
              </p>
              <ul>
                <li><strong>Data Analysis:</strong> Assessing ADR reports to identify safety signals.</li>
                <li><strong>Database Management:</strong> Maintaining VigiBase, the global ADR database.</li>
                <li><strong>Training and Support:</strong> Providing training to national centres on pharmacovigilance practices.</li>
                <li><strong>Research and Development:</strong> Conducting research to improve ADR reporting and analysis methodologies.</li>
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
