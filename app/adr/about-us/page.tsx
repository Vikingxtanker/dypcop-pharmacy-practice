import AdrSectionNavbar from "@/components/layout/AdrSectionNavbar";
import Footer from "@/components/layout/Footer";
import ContactBar from "@/components/layout/ContactBar";

export default function AdrAboutUsPage() {
  return (
    <>
      <AdrSectionNavbar />
      <main className="mt-5 pt-4">
        <section className="py-5 bg-white">
          <div className="container">
            <h2 className="fw-bold text-center mb-4">About Us</h2>
            <p className="lead text-center mb-5">
              Welcome to the ADR Reporting Portal of Dr D Y Patil College of Pharmacy&apos;s Pharmacy Practice Lab.
              In alignment with the Pharmacovigilance Programme of India (PvPI), our department is dedicated
              to fostering a culture of drug safety and vigilance among future pharmacists.
            </p>

            <div className="mb-5">
              <h4 className="fw-bold">What Is the ADR Reporting Department?</h4>
              <p className="mt-2">
                Our ADR Reporting Department serves as a pivotal component in monitoring and evaluating the safety
                of pharmaceutical products. We provide a structured platform for students and healthcare
                professionals to report adverse drug reactions, contributing to a comprehensive national
                pharmacovigilance system.
              </p>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">Why Is ADR Reporting Necessary?</h4>
              <p className="mt-2">
                Adverse drug reactions (ADRs) are unintended, harmful responses to medications that can compromise
                patient safety. By systematically collecting and analyzing ADR data, we aim to:
              </p>
              <ul>
                <li>Identify and assess new safety signals.</li>
                <li>Evaluate the benefit-risk profile of marketed medications.</li>
                <li>Support regulatory agencies in informed decision-making.</li>
                <li>Enhance public health through informed pharmacovigilance practices.</li>
              </ul>
              <p>
                This proactive approach ensures that the benefits of medications outweigh their risks,
                safeguarding the health of the Indian population.
              </p>
            </div>

            <div className="mb-5">
              <h4 className="fw-bold">Our Aims and Objectives</h4>
              <p className="mt-2">Guided by the objectives of the Pharmacovigilance Programme of India, our department strives to:</p>
              <ul>
                <li><strong>Monitor ADRs:</strong> Detect and report adverse drug reactions within the Indian population.</li>
                <li><strong>Promote Safe Medication Use:</strong> Encourage the safe and rational use of medicines through education and awareness.</li>
                <li><strong>Generate Evidence-Based Information:</strong> Provide data that supports the safety and efficacy of pharmaceutical products.</li>
                <li><strong>Support Regulatory Decisions:</strong> Aid regulatory bodies in making informed decisions regarding drug safety.</li>
                <li><strong>Foster a Reporting Culture:</strong> Develop a culture of ADR reporting among healthcare professionals and students.</li>
              </ul>
              <p>
                Through these endeavors, we aim to contribute to the global efforts in ensuring the safety and efficacy of medicines.
              </p>
            </div>
          </div>
        </section>
      </main>
      <ContactBar />
      <Footer />
    </>
  );
}
