import AdrSectionNavbar from "@/components/layout/AdrSectionNavbar";
import Footer from "@/components/layout/Footer";
import ContactBar from "@/components/layout/ContactBar";
import Link from "next/link";

export default function AdrPage() {
  return (
    <>
      <AdrSectionNavbar />
      <main className="mt-5 pt-4">
        <section className="bg-light py-5 text-center">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-6">
                <img src="/assets/doctors.png" alt="Doctors" className="img-fluid mb-3 mb-md-0" />
              </div>
              <div className="col-md-6">
                <h2 className="fw-bold">Ensuring Safer Medicines for All</h2>
                <Link href="/adr/adrform" className="btn btn-primary btn-lg mt-3">Report an ADR</Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-5 bg-light">
          <div className="container">
            <h2 className="text-center mb-4">How to Report ADR</h2>
            <div className="row justify-content-center align-items-center text-center">
              <div className="col-md-3">
                <h3>1</h3>
                <i className="bi bi-file-earmark-text display-4 text-primary"></i>
                <p>Complete reporting form</p>
              </div>
              <div className="col-md-1 d-none d-md-block">
                <i className="bi bi-arrow-right-circle fs-1 text-secondary"></i>
              </div>
              <div className="col-md-3">
                <h3>2</h3>
                <i className="bi bi-envelope display-4 text-primary"></i>
                <p>Submit the form online</p>
              </div>
              <div className="col-md-1 d-none d-md-block">
                <i className="bi bi-arrow-right-circle fs-1 text-secondary"></i>
              </div>
              <div className="col-md-3">
                <h3>3</h3>
                <i className="bi bi-person-check display-4 text-primary"></i>
                <p>Follow up if necessary</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-5 bg-light">
          <div className="container">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h3 className="fw-bold">Why Report ADR?</h3>
                <p className="mt-3">Reporting adverse drug reactions is vital for patient safety and helps improve the effectiveness of medicines.</p>
              </div>
              <div className="col-md-4 text-center">
                <img src="/assets/book.png" alt="Book" className="img-fluid" />
              </div>
            </div>
          </div>
        </section>

        <section className="py-5">
          <div className="container">
            <div className="row g-4 text-center">
              <div className="col-md-3">
                <div className="p-3 border rounded h-100">
                  <i className="bi bi-hospital display-5 text-primary"></i>
                  <h6 className="fw-bold mt-3">ADR MONITORING CENTRES</h6>
                  <p>Available on: <a href="https://www.ipc.gov.in" target="_blank" rel="noopener noreferrer">www.ipc.gov.in</a></p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 border rounded h-100">
                  <i className="bi bi-file-earmark-text display-5 text-primary"></i>
                  <h6 className="fw-bold mt-3">ADR REPORTING FORM</h6>
                  <p>Available on: <a href="https://www.ipc.gov.in" target="_blank" rel="noopener noreferrer">www.ipc.gov.in</a></p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 border rounded h-100">
                  <i className="bi bi-phone display-5 text-primary"></i>
                  <h6 className="fw-bold mt-3">ADR PVPI MOBILE APPLICATION</h6>
                  <p>Available on: Google Play Store</p>
                </div>
              </div>
              <div className="col-md-3">
                <div className="p-3 border rounded h-100">
                  <i className="bi bi-telephone display-5 text-primary"></i>
                  <h6 className="fw-bold mt-3">HELPLINE</h6>
                  <p>Call Free: 1800 22 4557<br />Mon-Fri, 9:00 AM - 9:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-5">
          <div className="container">
            <div className="row text-center mb-4">
              <div className="col-md-6 mb-4">
                <div className="p-4 border rounded shadow-sm h-100">
                  <i className="bi bi-journal-text display-3 text-primary mb-3"></i>
                  <h4>ADR of the Week</h4>
                  <p>Stay updated with the latest reported ADR cases.</p>
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <div className="p-4 border rounded shadow-sm h-100">
                  <i className="bi bi-person-workspace display-3 text-success mb-3"></i>
                  <h4>Pharmacovigilance Desk</h4>
                  <p>Your trusted source for drug safety monitoring and guidance.</p>
                </div>
              </div>
            </div>
            <div className="text-center">
              <h4 className="mb-3">News Bulletin</h4>
              <div className="p-3 border rounded shadow-sm d-inline-block" style={{cursor: "pointer"}} data-bs-toggle="modal" data-bs-target="#newsBulletinModal">
                <img src="/assets/news1.jpg" alt="News Bulletin" className="img-fluid rounded mb-2" style={{maxWidth: "500px"}} />
                <p className="fw-bold">News Bulletin</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="modal fade" id="newsBulletinModal" tabIndex={-1} aria-labelledby="newsBulletinModalLabel" aria-hidden="true">
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="newsBulletinModalLabel">News Bulletin</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <img src="/assets/news1.jpg" alt="News 1" className="img-fluid rounded shadow-sm" />
                </div>
                <div className="col-md-6">
                  <img src="/assets/news2.jpg" alt="News 2" className="img-fluid rounded shadow-sm" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContactBar />
      <Footer />
    </>
  );
}
