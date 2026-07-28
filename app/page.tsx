import Link from "next/link";
import MainNavbar from "@/components/layout/MainNavbar";
import Footer from "@/components/layout/Footer";
import ScrollDownButton from "@/components/home/ScrollDownButton";
import SwiperGallery from "@/components/home/SwiperGallery";

const galleryImages = [
  { src: "/assets/gallery1.jpg", alt: "Gallery 1" },
  { src: "/assets/gallery2.jpg", alt: "Gallery 2" },
  { src: "/assets/gallery3.jpg", alt: "Gallery 3" },
  { src: "/assets/gallery4.jpg", alt: "Gallery 4" },
  { src: "/assets/gallery5.jpg", alt: "Gallery 5" },
  { src: "/assets/gallery6.jpg", alt: "Gallery 6" },
  { src: "/assets/gallery7.jpg", alt: "Gallery 7" },
  { src: "https://i.postimg.cc/xCsrr94X/IMG-5500.jpg", alt: "Gallery 8" },
  { src: "https://i.postimg.cc/gcT9Nkh5/IMG-5505.jpg", alt: "Gallery 9" },
];

export default function HomePage() {
  return (
    <>
      <MainNavbar />

      {/* A. Hero Section */}
      <section className="hero-two-col text-dark">
        <div className="container-fluid">
          <div className="row align-items-center">
            {/* Left Column */}
            <div className="col-lg-8 col-md-7 hero-left">
              <h1 className="hero-title">
                Welcome to Department
                <br />
                of Pharmacy Practice
              </h1>
              <p className="hero-subtitle">Explore our services</p>
              <div className="hero-buttons">
                <Link href="/appointment" className="btn btn-primary btn-hero">
                  Book Appointment
                </Link>
                <Link href="/health-screening" className="btn btn-primary btn-hero">
                  Health Screening
                </Link>
                <Link href="/adr" className="btn btn-outline-primary btn-hero">
                  AMC
                </Link>
                <Link href="/dic" className="btn btn-outline-primary btn-hero">
                  DIC
                </Link>
              </div>
            </div>

            {/* Right Column */}
            <div className="col-lg-4 col-md-5 hero-right">
              <div className="video-box">
                <iframe
                  width="100%"
                  height="250"
                  src="https://www.youtube.com/embed/z7SS97_mGjw"
                  title="Pharm.D video"
                  allowFullScreen
                ></iframe>
                <p className="video-caption">Explore more about Pharm. D</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* B. ScrollDownButton */}
      <ScrollDownButton />

      {/* C. About Section */}
      <section id="about" className="about-section py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-4">About Pharmacy Practice Department</h2>
          <div className="row mb-4 g-3">
            <div className="col-md-6 d-flex align-items-center">
              <div className="p-3">
                <p className="text-center text-md-start">
                  <strong>Department of Pharmacy Practice</strong>
                  <br />
                  The Department of Pharmacy Practice is an academic and clinical unit within the
                  college, dedicated to advancing patient-centered care through education, research,
                  and service. Its primary mission is to prepare future pharmacists for clinical
                  pharmacy practice—applying pharmacotherapy knowledge directly at the patient&apos;s
                  bedside.
                </p>
                <p className="text-center text-md-start">
                  The department&apos;s faculty comprises licensed clinical pharmacists with specialized
                  training in various clinical areas, including internal medicine, cardiology, critical
                  care, pediatrics, oncology, and infectious diseases. Emphasizing evidence-based
                  practice, the department ensures that students are trained to optimize drug therapy,
                  prevent medication errors, and improve patient outcomes.
                </p>
                <p className="text-center text-md-start">
                  Students receive hands-on training through partnerships with leading healthcare
                  institutions, such as the Lokmanya Group of Hospitals (including all branches: Nigdi,
                  Chinchwad, and S.B. Road, Pune) and Ruby Hall Clinic, Hinjewadi. Their clinical
                  exposure includes hospital-based training, community pharmacy practice, clinical ward
                  rounds, drug information services, and pharmacovigilance.
                </p>
                <p className="text-center text-md-start">
                  Interprofessional collaboration is a cornerstone of the department&apos;s approach,
                  with faculty working closely alongside physicians, nurses, and other healthcare
                  professionals to provide comprehensive patient care.
                </p>
              </div>
            </div>
            <div className="col-md-6">
              <div className="ratio ratio-4x3">
                <img
                  src="/assets/lab1.jpg"
                  className="rounded shadow object-fit-cover"
                  alt="Pharmacy Practice Department Image"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* D. Info Section */}
      <section id="info-section" className="info-section py-5 bg-white">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-6">
              <div className="ratio ratio-4x3">
                <img
                  src="https://i.postimg.cc/RC69rHv9/IMG-5391.jpg"
                  className="img-fluid rounded shadow"
                  alt="Info Image"
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="d-flex flex-column gap-3">
                <div className="info-box">Weekly News</div>
                <div className="info-box">Publications</div>
                <div className="info-box">Guest Sessions</div>
                <div className="info-box">Pharm. D Bulletins</div>
                <div className="info-box">Pharm. D Practice Services</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* E. Gallery Section */}
      <section id="gallery" className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-4">Gallery</h2>
          <SwiperGallery images={galleryImages} />
        </div>
      </section>

      {/* F. Footer */}
      <Footer />
    </>
  );
}
