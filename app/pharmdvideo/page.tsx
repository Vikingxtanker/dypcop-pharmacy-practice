import MainNavbar from "@/components/layout/MainNavbar";
import Footer from "@/components/layout/Footer";

export default function PharmdVideoPage() {
  return (
    <>
      <MainNavbar />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">Pharm.D Videos</h2>
          <div className="row g-4">
            <div className="col-md-6">
              <div className="ratio ratio-16x9 shadow rounded">
                <iframe
                  src="https://www.youtube.com/embed/example1"
                  title="Pharm.D Video 1"
                  allowFullScreen
                ></iframe>
              </div>
              <h5 className="mt-2 text-center">Introduction to Pharm.D</h5>
            </div>
            <div className="col-md-6">
              <div className="ratio ratio-16x9 shadow rounded">
                <iframe
                  src="https://www.youtube.com/embed/example2"
                  title="Pharm.D Video 2"
                  allowFullScreen
                ></iframe>
              </div>
              <h5 className="mt-2 text-center">Career Opportunities</h5>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
