"use client";

import Link from "next/link";
import HealthScreeningNavbar from "@/components/layout/HealthScreeningNavbar";
import Footer from "@/components/layout/Footer";
import SwiperGallery from "@/components/home/SwiperGallery";
import ScrollDownButton from "@/components/home/ScrollDownButton";

const healthCheckupImages = [
  { src: "/assets/hst1.jpg", alt: "Health Check-up Camp 2025 - 1" },
  { src: "/assets/hst2.jpg", alt: "Health Check-up Camp 2025 - 2" },
  { src: "/assets/hst3.jpg", alt: "Health Check-up Camp 2025 - 3" },
  { src: "/assets/hst4.jpg", alt: "Health Check-up Camp 2025 - 4" },
  { src: "/assets/hst5.jpg", alt: "Health Check-up Camp 2025 - 5" },
  { src: "/assets/hst6.jpg", alt: "Health Check-up Camp 2025 - 6" },
  { src: "/assets/hst7.jpg", alt: "Health Check-up Camp 2025 - 7" },
  { src: "/assets/hst8.jpg", alt: "Health Check-up Camp 2025 - 8" },
];

const diabetesDayImages = [
  { src: "/assets/dm1.jpg", alt: "World Diabetes Day 2025 - 1" },
  { src: "/assets/dm2.jpg", alt: "World Diabetes Day 2025 - 2" },
  { src: "/assets/dm3.jpg", alt: "World Diabetes Day 2025 - 3" },
  { src: "/assets/dm4.jpg", alt: "World Diabetes Day 2025 - 4" },
  { src: "/assets/dm5.jpg", alt: "World Diabetes Day 2025 - 5" },
  { src: "/assets/dm6.jpg", alt: "World Diabetes Day 2025 - 6" },
  { src: "/assets/dm7.jpg", alt: "World Diabetes Day 2025 - 7" },
  { src: "/assets/dm8.jpg", alt: "World Diabetes Day 2025 - 8" },
];

export default function HealthScreeningPage() {
  return (
    <>
      <HealthScreeningNavbar />

      {/* Hero Section */}
      <section className="hst-hero-section text-white d-flex align-items-center" style={{ minHeight: "100vh" }}>
        <div className="container text-center">
          <h1 className="display-4 fw-bold mb-4">Welcome to Health Screening Services</h1>
          <p className="lead mb-4">
            Department of Pharmacy Practice, D.Y. Patil College of Pharmacy, Akurdi, Pune
          </p>
          <div className="d-flex justify-content-center gap-3 flex-wrap mb-4">
            <Link href="/register" className="btn btn-primary btn-lg px-4">
              Register
            </Link>
            <Link href="/station" className="btn btn-success btn-lg px-4">
              Station
            </Link>
            <Link href="/patient-report" className="btn btn-warning btn-lg px-4">
              Patient Report
            </Link>
          </div>
          <ScrollDownButton />
        </div>
      </section>

      {/* Info Boxes Section */}
      <section id="about" className="py-5 bg-light">
        <div className="container">
          <div className="row g-4">
            <div className="col-md-4">
              <Link href="/health-screening/services" className="text-decoration-none">
                <div className="card h-100 shadow-sm border-0 hover-shadow">
                  <div className="card-body text-center p-4">
                    <h5 className="card-title fw-bold">Services Provided</h5>
                    <p className="card-text text-muted">
                      Explore all 13 health screening tests and services offered.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-4">
              <Link href="/health-screening/education" className="text-decoration-none">
                <div className="card h-100 shadow-sm border-0 hover-shadow">
                  <div className="card-body text-center p-4">
                    <h5 className="card-title fw-bold">Education &amp; Training</h5>
                    <p className="card-text text-muted">
                      Learn about training modules, staff roles, and workflows.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-4">
              <Link href="/health-screening/guidelines" className="text-decoration-none">
                <div className="card h-100 shadow-sm border-0 hover-shadow">
                  <div className="card-body text-center p-4">
                    <h5 className="card-title fw-bold">Guidelines</h5>
                    <p className="card-text text-muted">
                      Standard guidelines and protocols for each screening test.
                    </p>
                  </div>
                </div>
              </Link>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0 hover-shadow">
                <div className="card-body text-center p-4">
                  <h5 className="card-title fw-bold">Newsletter</h5>
                  <p className="card-text text-muted">
                    Stay updated with our latest newsletters and publications.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card h-100 shadow-sm border-0 hover-shadow">
                <div className="card-body text-center p-4">
                  <h5 className="card-title fw-bold">Awareness Tab</h5>
                  <p className="card-text text-muted">
                    Health awareness campaigns and community outreach programs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Gallery: Health Check-up Camp 2025 */}
      <section className="py-5 bg-light">
        <div className="container">
          <h2 className="text-center mb-4">Health Check-up Camp 2025</h2>
          <SwiperGallery images={healthCheckupImages} id="health-camp" />
        </div>
      </section>

      {/* Gallery: World Diabetes Day 2025 */}
      <section className="py-5">
        <div className="container">
          <h2 className="text-center mb-4">World Diabetes Day 2025</h2>
          <SwiperGallery images={diabetesDayImages} id="diabetes-day" />
        </div>
      </section>

      <Footer />
    </>
  );
}
