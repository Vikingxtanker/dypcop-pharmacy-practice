import DicSectionNavbar from "@/components/layout/DicSectionNavbar";
import Footer from "@/components/layout/Footer";

export default function DicAboutUsPage() {
  return (
    <>
      <DicSectionNavbar />
      <main className="dic-main">
        <section className="hero-section">
          <div className="hero-16-9">
            <div className="container h-100 d-flex flex-column justify-content-center align-items-center py-4">
              <div className="soft-glass rounded-3xl p-4 mb-4 hero-card w-100">
                <h2 className="hero-title text-center">About Us</h2>
                <p className="hero-subtitle text-center">
                  Learn about the Drug Information Center and our commitment to pharmaceutical excellence
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-5">
          {/* About the DIC */}
          <div className="soft-glass rounded-3xl p-4 mb-4">
            <h3 className="mb-3">About the Drug Information Center</h3>
            <p className="mb-3">
              The Drug Information Center (DIC) at DYP COP Pharmacy Practice is a
              dedicated facility established to provide reliable, evidence-based drug
              information to healthcare professionals, students, and patients. Our center
              serves as a vital resource for optimizing medication therapy and promoting
              rational drug use.
            </p>
            <p className="mb-3">
              Staffed by trained clinical pharmacists and pharmacy students under
              supervision, the DIC handles a wide range of drug information queries,
              from simple factual questions to complex clinical evaluations. Our team
              utilizes a comprehensive array of primary, secondary, and tertiary
              reference sources to ensure the highest quality of information.
            </p>
            <div className="row g-3 mt-4">
              <div className="col-12 col-md-4">
                <div className="soft-card rounded-3xl p-3 mint-gradient h-100 text-center">
                  <div className="display-4 mb-2">🎓</div>
                  <h5>Education</h5>
                  <p className="small mb-0">
                    Training pharmacy students in drug information retrieval, evaluation,
                    and communication skills.
                  </p>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="soft-card rounded-3xl p-3 sky-gradient h-100 text-center">
                  <div className="display-4 mb-2">🔬</div>
                  <h5>Research</h5>
                  <p className="small mb-0">
                    Conducting research on medication use patterns, adverse drug reactions,
                    and drug information services.
                  </p>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="soft-card rounded-3xl p-3 lavender-gradient h-100 text-center">
                  <div className="display-4 mb-2">💊</div>
                  <h5>Clinical Service</h5>
                  <p className="small mb-0">
                    Providing direct drug information support to clinicians and patients
                    at the point of care.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Drug Monographs - Paracetamol Example */}
          <div className="soft-glass rounded-3xl p-4 mb-4">
            <h3 className="mb-3">Drug Monographs: Paracetamol Example</h3>
            <p className="mb-3">
              Our drug monographs provide comprehensive, evidence-based information about
              individual medications. Below is an example demonstrating the structure and
              depth of information available through our monograph database.
            </p>
            <div className="soft-card rounded-3xl p-3 mint-gradient mb-3">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <h4>Paracetamol (Acetaminophen)</h4>
                  <p className="small text-muted mb-0">Brand: Crocin, Dolo, Calpol | Class: Analgesic, Antipyretic</p>
                </div>
                <span className="badge bg-success">Updated 2024</span>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 h-100">
                  <h5 className="text-success">Mechanism of Action</h5>
                  <p className="small mb-0">
                    Paracetamol inhibits prostaglandin synthesis centrally in the CNS,
                    elevating the pain threshold and acting on the heat-regulating center
                    in the hypothalamus to reduce fever. Unlike NSAIDs, it has minimal
                    peripheral anti-inflammatory activity.
                  </p>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 h-100">
                  <h5 className="text-info">Dosage &amp; Administration</h5>
                  <p className="small mb-0">
                    <strong>Adults:</strong> 500 mg - 1 g every 4-6 hours (max 4 g/day)<br />
                    <strong>Children:</strong> 10-15 mg/kg every 4-6 hours (max 75 mg/kg/day)<br />
                    <strong>Renal impairment:</strong> Reduce dose or extend interval
                  </p>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 h-100">
                  <h5 className="text-danger">Adverse Effects</h5>
                  <p className="small mb-0">
                    Generally well-tolerated at therapeutic doses. Rare effects include
                    nausea, allergic reactions, and skin rash. Hepatotoxicity occurs
                    with overdose (&gt;10 g in adults) due to accumulation of toxic
                    metabolite NAPQI.
                  </p>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 h-100">
                  <h5 className="text-warning">Key Counseling Points</h5>
                  <p className="small mb-0">
                    Do not exceed recommended dose. Avoid with alcohol use. Check other
                    medications for hidden paracetamol content. Seek immediate medical
                    help if overdose suspected — N-acetylcysteine is the antidote.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RX Express - FDA Example */}
          <div className="soft-glass rounded-3xl p-4 mb-4">
            <h3 className="mb-3">RX Express: Rapid Drug Information</h3>
            <p className="mb-3">
              RX Express provides fast, reliable drug information for time-sensitive
              clinical decisions. Our service integrates data from authoritative global
              regulatory sources including the FDA, EMA, and CDSCO.
            </p>
            <div className="soft-card rounded-3xl p-3 sky-gradient mb-3">
              <h5>Example: FDA Safety Alert Integration</h5>
              <p className="small mb-2">
                When the FDA issues a safety communication or drug safety bulletin, our
                RX Express system flags it for immediate review and dissemination to
                relevant stakeholders.
              </p>
            </div>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 mint-gradient h-100">
                  <h5>🇺🇸 FDA Integration</h5>
                  <ul className="small mb-0 mt-2">
                    <li>FDA Drug Safety Communications</li>
                    <li>New Drug Approvals (NDA/BLA)</li>
                    <li>MedWatch Safety Alerts</li>
                    <li>Drug Recalls &amp; Withdrawals</li>
                    <li>Updated Prescribing Information</li>
                  </ul>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 lavender-gradient h-100">
                  <h5>⚡ Quick Lookup Features</h5>
                  <ul className="small mb-0 mt-2">
                    <li>Generic and brand name search</li>
                    <li>Therapeutic class browsing</li>
                    <li>Drug interaction checker</li>
                    <li>Pediatric/geriatric dosing calculator</li>
                    <li>Renal dose adjustment guide</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="soft-card rounded-3xl p-3 mt-3">
              <h5>How RX Express Works</h5>
              <div className="row g-2 mt-2">
                {[
                  { step: "1", text: "Query is received via web form or direct contact" },
                  { step: "2", text: "System cross-references FDA, EMA, and other databases" },
                  { step: "3", text: "Relevant safety alerts and monograph data are retrieved" },
                  { step: "4", text: "Response is compiled and reviewed by a clinical pharmacist" },
                  { step: "5", text: "Information is delivered within the specified turnaround time" },
                ].map((item) => (
                  <div key={item.step} className="col-12">
                    <div className="d-flex align-items-center gap-2">
                      <div
                        className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: "28px", height: "28px", fontSize: "0.8rem" }}
                      >
                        {item.step}
                      </div>
                      <span className="small">{item.text}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Our Team */}
          <div className="soft-glass rounded-3xl p-4">
            <h3 className="mb-3">Our Team &amp; Contact</h3>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 mint-gradient h-100">
                  <h5>👥 Team Structure</h5>
                  <ul className="small mb-0 mt-2">
                    <li><strong>DIC Coordinator:</strong> Faculty pharmacist overseeing all operations</li>
                    <li><strong>Clinical Pharmacists:</strong> Experienced pharmacists handling complex queries</li>
                    <li><strong>Pharmacy Residents:</strong> Post-graduates receiving specialized training</li>
                    <li><strong>Pharmacy Students:</strong> Final-year students gaining practical experience</li>
                  </ul>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 sky-gradient h-100">
                  <h5>📬 Contact Us</h5>
                  <ul className="small mb-0 mt-2">
                    <li><strong>Email:</strong> dic@dypcop.edu.in</li>
                    <li><strong>Phone:</strong> +91-XXX-XXXXXXX</li>
                    <li><strong>Hours:</strong> Monday - Saturday, 9:00 AM - 5:00 PM</li>
                    <li><strong>Location:</strong> DYP COP Pharmacy Practice, Block A</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
