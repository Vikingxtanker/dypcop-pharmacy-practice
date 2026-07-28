import MainNavbar from "@/components/layout/MainNavbar";
import Footer from "@/components/layout/Footer";

const facultyMembers = [
  {
    image: "/assets/rameshsir.jpg",
    name: "Dr. Ramesh G. Katedeshmukh",
    designation: "Professor",
    qualification: "M. Pharm Ph.D",
    specialization: "Pharmaceutics",
    experience: "Teaching 15+ years, Industrial 28 years",
  },
  {
    image: "/assets/bapusoyadav.jpg",
    name: "Dr. Bapuso Yadav",
    designation: "Professor",
    qualification: "M. Pharm Ph.D",
    specialization: "Pharmacognosy",
    experience: "39+ years",
  },
  {
    image: "/assets/rshinde.jpg",
    name: "Dr. Ramdas D. Shinde",
    designation: "Assistant Professor and Head of Department (Pharm. D)",
    qualification: "Pharm.D",
    specialization: "Pharm. D",
    experience: "8+ years",
  },
  {
    image: "/assets/sanketkadam.JPG",
    name: "Dr. Sanket N. Kadam",
    designation: "Assistant Professor",
    qualification: "Pharm.D",
    specialization: "Pharm. D",
    experience: "3+ years",
  },
  {
    image: "/assets/aishwaryamam.jpg",
    name: "Dr. Aishwarya S. Unchegaonkar",
    designation: "Assistant Professor",
    qualification: "M. Pharm",
    specialization: "Pharm. D",
    experience: "4+ years",
  },
  {
    image: "/assets/nikitaparge.JPG",
    name: "Dr. Nikita A. Parage",
    designation: "Assistant Professor",
    qualification: "Pharm.D",
    specialization: "Pharm. D",
    experience: "2+ years",
  },
  {
    image: "/assets/abhayshinde.jpg",
    name: "Dr. Abhay R. Shinde",
    designation: "Assistant Professor",
    qualification: "Pharm.D",
    specialization: "Pharm. D",
    experience: "1+ years",
  },
  {
    image: "/assets/rutujahipparkar.jpg",
    name: "Dr. Rutuja R. Hipparkar",
    designation: "Assistant Professor",
    qualification: "Pharm.D",
    specialization: "Pharm. D",
    experience: "1.5+ year as a junior clinical record executive at TCMS, Narhe, Pune",
  },
];

const students = [
  {
    image: "/assets/gauravgaikwad.png",
    name: "Mr. Gaurav J Gaikwad",
    qualification: "5th Year Pharm. D",
    designation: "Student Co-ordinator, Health Screening Services",
  },
  {
    image: "/assets/kumkum.png",
    name: "Ms. Kumkum S Bhenwal",
    qualification: "5th Year Pharm. D",
    designation: "Student Co-ordinator, Health Screening Services",
  },
  {
    image: "/assets/shrikant.png",
    name: "Mr. Shrikant Naik",
    qualification: "5th Year Pharm. D",
    designation: "Student Co-ordinator, ADR Reporting Centre",
  },
  {
    image: "/assets/shreyasi.png",
    name: "Ms. Shreyashi Deshmukh",
    qualification: "5th Year Pharm. D",
    designation: "Student Co-ordinator, ADR Reporting Centre",
  },
  {
    image: "/assets/bhumika.png",
    name: "Ms. Bhumika Sonar",
    qualification: "5th Year Pharm. D",
    designation: "Student Co-ordinator, Drug Information Centre",
  },
  {
    image: "/assets/vaishnavi.png",
    name: "Ms. Vaishnavi Vadar",
    qualification: "5th Year Pharm. D",
    designation: "Student Co-ordinator, Drug Information Centre",
  },
];

export default function AboutUsPage() {
  return (
    <>
      <MainNavbar />

      {/* About Pharm.D Section */}
      <section className="py-5 mt-5">
        <div className="container">
          <h2 className="text-center mb-4">About the Pharm.D Program</h2>
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="bg-white p-4 rounded shadow-sm">
                <p>
                  The <strong>Doctor of Pharmacy (Pharm.D)</strong> is a six-year professional
                  doctoral program in pharmacy designed to prepare students for advanced clinical
                  roles in healthcare. It integrates five years of academic study with a one-year
                  full-time internship/residency in hospitals, where students gain hands-on
                  experience in patient care, drug therapy management, and clinical decision-making.
                </p>

                <p>
                  It is the{" "}
                  <strong>
                    first direct patient-care oriented pharmacy program in India
                  </strong>{" "}
                  recognized by the Pharmacy Council of India (PCI), providing direct clinical
                  exposure and preparing students to function as clinical pharmacists – a globally
                  recognized role.
                </p>

                <p>
                  The course focuses on{" "}
                  <strong>
                    evidence-based medicine, pharmacovigilance, and therapeutic optimization
                  </strong>
                  .
                </p>

                <h4 className="mt-4">Eligibility Criteria</h4>
                <ul>
                  <li>
                    <strong>For Pharm.D (Regular – 6 Years):</strong>
                    <ul>
                      <li>
                        Pass in 10+2 examination with Physics and Chemistry as compulsory subjects
                        along with Mathematics or Biology.
                      </li>
                      <li>Or pass in D.Pharm course from an institution approved by PCI.</li>
                      <li>
                        Minimum age: 17 years completed on or before 31st December of the year of
                        admission.
                      </li>
                    </ul>
                  </li>
                  <li className="mt-2">
                    <strong>For Pharm.D (Post Baccalaureate – 3 Years):</strong>
                    <ul>
                      <li>
                        A pass in B.Pharm from an institution approved by PCI, getting lateral entry
                        into the 4th year of the Pharm.D program.
                      </li>
                    </ul>
                  </li>
                </ul>

                <h4 className="mt-4">Admission Process</h4>
                <ul>
                  <li>Admission is strictly based on merit and as per PCI &amp; University guidelines.</li>
                  <li>
                    Candidates must clear entrance exams like <strong>GPAT, NIPER</strong> and register
                    through the Central Admission Process (CAP) of DTE / University portal.
                  </li>
                </ul>

                <h4 className="mt-4">Career Prospects</h4>
                <p>
                  Pharm.D graduates have diverse and rewarding career opportunities in India and
                  abroad:
                </p>
                <ol>
                  <li>
                    <strong>Clinical &amp; Healthcare Sector:</strong> Clinical Pharmacist in
                    hospitals, Patient counseling and medication therapy management, Therapeutic Drug
                    Monitoring (TDM) &amp; Pharmacovigilance, Clinical Research Associate.
                  </li>
                  <li>
                    <strong>Academia &amp; Research:</strong> Research in drug development,
                    pharmacology, pharmacoeconomics, Faculty positions in pharmacy colleges.
                  </li>
                  <li>
                    <strong>Pharma &amp; Corporate Sector:</strong> Drug Safety Officer /
                    Pharmacovigilance Associate, Medical Writing &amp; Regulatory Affairs,
                    Pharmacoeconomics &amp; Health Outcomes Research.
                  </li>
                  <li>
                    <strong>Global Opportunities:</strong> Licensing exams (
                    <strong>NAPLEX – USA, PEBC – Canada, DHA/MOH/HAAD – UAE, KAPS – Australia</strong>
                    ). Pharm.D graduates are in demand in countries with advanced clinical pharmacy
                    practice models.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Faculty Profile Section */}
      <main className="container py-5">
        <h2 className="text-center mb-5">Faculty Profile - Pharmacy Practice</h2>

        {facultyMembers.map((faculty, idx) => (
          <div className="row g-4 mb-5" key={idx}>
            <div className="col-md-4">
              <div className="faculty-image-wrapper">
                <img
                  src={faculty.image}
                  alt="Faculty Photo"
                  className="img-fluid rounded shadow"
                />
              </div>
            </div>
            <div className="col-md-8 d-flex align-items-center">
              <div>
                <h4 className="fw-bold">{faculty.name}</h4>
                <p>
                  <strong>Designation:</strong> {faculty.designation}
                </p>
                <p>
                  <strong>Qualification:</strong> {faculty.qualification}
                </p>
                <p>
                  <strong>Area of Specialization:</strong> {faculty.specialization}
                </p>
                <p>
                  <strong>Experience:</strong> {faculty.experience}
                </p>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Student Profile Section */}
      <section className="container py-5">
        <h2 className="text-center mb-5">Student Profile - Pharmacy Practice</h2>

        {students.map((student, idx) => (
          <div className="row g-4 mb-5" key={idx}>
            <div className="col-md-4">
              <div className="faculty-image-wrapper">
                <img
                  src={student.image}
                  alt={student.name}
                  className="img-fluid rounded shadow"
                />
              </div>
            </div>
            <div className="col-md-8 d-flex align-items-center">
              <div>
                <h4 className="fw-bold">{student.name}</h4>
                <p>
                  <strong>Qualification:</strong> {student.qualification}
                </p>
                <p>
                  <strong>Designation:</strong> {student.designation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <Footer />
    </>
  );
}
