import DicSectionNavbar from "@/components/layout/DicSectionNavbar";
import Footer from "@/components/layout/Footer";

export default function DicGuidelinesPage() {
  return (
    <>
      <DicSectionNavbar />
      <main className="dic-main">
        <section className="hero-section">
          <div className="hero-16-9">
            <div className="container h-100 d-flex flex-column justify-content-center align-items-center py-4">
              <div className="soft-glass rounded-3xl p-4 mb-4 hero-card w-100">
                <h2 className="hero-title text-center">DIC Guidelines</h2>
                <p className="hero-subtitle text-center">
                  Standard operating procedures and protocols for the Drug Information Center
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container py-5">
          {/* What is DIC */}
          <div className="soft-glass rounded-3xl p-4 mb-4">
            <h3 className="mb-3">What is a Drug Information Center (DIC)?</h3>
            <p className="mb-3">
              A Drug Information Center (DIC) is a specialized service that provides
              evidence-based, up-to-date pharmaceutical information to healthcare
              professionals, patients, and the public. It serves as a central hub for
              answering drug-related queries, evaluating medication therapy, and
              supporting rational drug use.
            </p>
            <div className="row g-3">
              <div className="col-12 col-md-4">
                <div className="soft-card rounded-3xl p-3 mint-gradient h-100">
                  <h5>🎯 Mission</h5>
                  <p className="small mb-0">
                    To provide accurate, unbiased, and timely drug information to improve
                    patient outcomes and promote safe medication practices.
                  </p>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="soft-card rounded-3xl p-3 sky-gradient h-100">
                  <h5>👁️ Vision</h5>
                  <p className="small mb-0">
                    To be the leading drug information resource recognized for excellence
                    in pharmaceutical care and evidence-based practice.
                  </p>
                </div>
              </div>
              <div className="col-12 col-md-4">
                <div className="soft-card rounded-3xl p-3 lavender-gradient h-100">
                  <h5>💪 Objectives</h5>
                  <p className="small mb-0">
                    Enhance medication safety, reduce medication errors, and support
                    clinical decision-making through comprehensive drug information services.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Drug Monographs */}
          <div className="soft-glass rounded-3xl p-4 mb-4">
            <h3 className="mb-3">Drug Monographs</h3>
            <p className="mb-3">
              Drug monographs are comprehensive, evidence-based summaries of individual
              medications. Each monograph includes essential information for safe and
              effective use of the drug.
            </p>
            <div className="soft-card rounded-3xl p-3 mb-3">
              <h5>Typical Monograph Sections:</h5>
              <div className="row g-2 mt-2">
                {[
                  "Generic & Brand Names",
                  "Drug Class & Mechanism",
                  "Indications & Uses",
                  "Dosage & Administration",
                  "Contraindications",
                  "Precautions & Warnings",
                  "Adverse Effects",
                  "Drug Interactions",
                  "Pharmacokinetics",
                  "Pregnancy & Lactation",
                  "Storage & Handling",
                  "Patient Counseling Points",
                ].map((item) => (
                  <div key={item} className="col-12 col-sm-6 col-lg-4">
                    <div className="bg-white rounded-3 p-2 d-flex align-items-center gap-2">
                      <span className="text-success">✓</span>
                      <span className="small">{item}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="soft-card rounded-3xl p-3 sky-gradient">
              <h5>Monograph Quality Standards</h5>
              <ul className="mb-0 mt-2">
                <li>All information must be sourced from peer-reviewed literature</li>
                <li>References must include primary literature and authoritative databases</li>
                <li>Content must be reviewed and updated at least annually</li>
                <li>Evidence levels must be clearly rated (A, B, C)</li>
              </ul>
            </div>
          </div>

          {/* Rx Express */}
          <div className="soft-glass rounded-3xl p-4 mb-4">
            <h3 className="mb-3">Rx Express Guidelines</h3>
            <p className="mb-3">
              Rx Express is the rapid-response service for urgent drug information queries.
              It is designed for time-sensitive clinical decisions where immediate
              information is needed at the point of care.
            </p>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 mint-gradient h-100">
                  <h5>⏱️ Response Times</h5>
                  <ul className="small mt-2 mb-0">
                    <li><strong>Emergency:</strong> Within 1 hour</li>
                    <li><strong>Urgent:</strong> Within 4-6 hours</li>
                    <li><strong>Routine:</strong> Within 24-48 hours</li>
                  </ul>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 sky-gradient h-100">
                  <h5>📋 Eligible Queries</h5>
                  <ul className="small mt-2 mb-0">
                    <li>Acute overdose management</li>
                    <li>Critical drug interactions</li>
                    <li>Pregnancy/lactation safety</li>
                    <li>Therapeutic alternatives</li>
                    <li>Drug identification</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Sources */}
          <div className="soft-glass rounded-3xl p-4 mb-4">
            <h3 className="mb-3">Reference Sources</h3>
            <p className="mb-3">
              The DIC utilizes a hierarchy of reference sources to ensure the highest
              quality of information. Primary sources are preferred over secondary and
              tertiary sources.
            </p>
            <div className="soft-card rounded-3xl p-3">
              <div className="row g-3">
                <div className="col-12 col-md-4">
                  <div className="mint-gradient rounded-3 p-3 h-100">
                    <h6 className="text-success">Primary Sources</h6>
                    <ul className="small mb-0">
                      <li>Original research articles</li>
                      <li>Clinical trial results</li>
                      <li>Published case reports</li>
                      <li>Government advisories (FDA, EMA)</li>
                    </ul>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="sky-gradient rounded-3 p-3 h-100">
                    <h6 className="text-info">Secondary Sources</h6>
                    <ul className="small mb-0">
                      <li>Drug information databases (Lexicomp, Micromedex)</li>
                      <li>Clinical pharmacology reviews</li>
                      <li>Systematic reviews &amp; meta-analyses</li>
                      <li>Practice guidelines</li>
                    </ul>
                  </div>
                </div>
                <div className="col-12 col-md-4">
                  <div className="lavender-gradient rounded-3 p-3 h-100">
                    <h6 className="text-primary">Tertiary Sources</h6>
                    <ul className="small mb-0">
                      <li>Drug handbooks</li>
                      <li>Textbooks of pharmacotherapy</li>
                      <li>Package inserts / prescribing information</li>
                      <li>Formulary compilations</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Types of Cases */}
          <div className="soft-glass rounded-3xl p-4 mb-4">
            <h3 className="mb-3">Types of Cases Handled</h3>
            <div className="row g-3">
              {[
                {
                  title: "Drug Identification",
                  desc: "Identifying unknown tablets, capsules, or medications based on physical characteristics.",
                  color: "mint-gradient",
                },
                {
                  title: "Dosing Queries",
                  desc: "Verifying appropriate doses for specific patient populations (renal, hepatic, pediatric, geriatric).",
                  color: "sky-gradient",
                },
                {
                  title: "Drug Interactions",
                  desc: "Evaluating potential interactions between two or more medications, or with food/herbals.",
                  color: "lavender-gradient",
                },
                {
                  title: "Adverse Drug Reactions",
                  desc: "Assessing causality, mechanism, management, and reporting of adverse reactions.",
                  color: "mint-gradient",
                },
                {
                  title: "Pregnancy & Lactation",
                  desc: "Providing safety data and risk-benefit analysis for medication use during pregnancy and breastfeeding.",
                  color: "sky-gradient",
                },
                {
                  title: "Therapeutic Equivalence",
                  desc: "Evaluating generic substitutions and bioequivalence of drug products.",
                  color: "lavender-gradient",
                },
              ].map((item) => (
                <div key={item.title} className="col-12 col-md-6 col-lg-4">
                  <div className={`soft-card rounded-3xl p-3 ${item.color} h-100`}>
                    <h5>{item.title}</h5>
                    <p className="small mb-0">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Process Flow */}
          <div className="soft-glass rounded-3xl p-4 mb-4">
            <h3 className="mb-3">DIC Process Flow</h3>
            <div className="row g-3">
              {[
                { step: "1", title: "Query Received", desc: "Request is logged with query number, urgency level, and requester details." },
                { step: "2", title: "Literature Search", desc: "Comprehensive search across primary, secondary, and tertiary sources." },
                { step: "3", title: "Information Evaluation", desc: "Evidence is critically appraised for quality, validity, and relevance." },
                { step: "4", title: "Formulate Response", desc: "A clear, concise, evidence-based response is prepared." },
                { step: "5", title: "Peer Review", desc: "A second pharmacist reviews the response for accuracy and completeness." },
                { step: "6", title: "Dispatch & Follow-up", desc: "Response is communicated to the requester with documentation and follow-up." },
              ].map((item) => (
                <div key={item.step} className="col-12 col-md-6 col-lg-4">
                  <div className="soft-card rounded-3xl p-3 h-100">
                    <div className="d-flex align-items-center gap-2 mb-2">
                      <div
                        className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center"
                        style={{ width: "32px", height: "32px", fontSize: "0.85rem", flexShrink: 0 }}
                      >
                        {item.step}
                      </div>
                      <h5 className="mb-0">{item.title}</h5>
                    </div>
                    <p className="small mb-0">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interprofessional Collaboration */}
          <div className="soft-glass rounded-3xl p-4">
            <h3 className="mb-3">Interprofessional Collaboration</h3>
            <p className="mb-3">
              The DIC operates as part of an interprofessional team, collaborating with
              physicians, nurses, and other healthcare providers to optimize medication
              therapy and ensure patient safety.
            </p>
            <div className="row g-3">
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 mint-gradient h-100">
                  <h5>🤝 Collaborative Roles</h5>
                  <ul className="small mt-2 mb-0">
                    <li><strong>Pharmacists:</strong> Lead drug information specialists, clinical pharmacists</li>
                    <li><strong>Physicians:</strong> Provide clinical context and therapeutic goals</li>
                    <li><strong>Nurses:</strong> Report adverse effects and medication administration issues</li>
                    <li><strong>Laboratory:</strong> Support with therapeutic drug monitoring data</li>
                  </ul>
                </div>
              </div>
              <div className="col-12 col-md-6">
                <div className="soft-card rounded-3xl p-3 sky-gradient h-100">
                  <h5>📊 Outcomes Tracked</h5>
                  <ul className="small mt-2 mb-0">
                    <li>Number of queries answered per month</li>
                    <li>Average response time by urgency level</li>
                    <li>Satisfaction ratings from requesters</li>
                    <li>Clinical impact of recommendations</li>
                    <li>Cost savings from therapeutic interventions</li>
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
