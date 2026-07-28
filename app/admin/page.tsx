"use client";

import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";

export default function AdminPage() {
  return (
    <>
      <HssNavbar activePage="dashboard" />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">Admin Panel</h2>
          <div className="row g-4">
            <div className="col-md-4">
              <div className="card text-center shadow-sm h-100">
                <div className="card-body">
                  <i className="bi bi-calendar-check display-4 text-primary"></i>
                  <h5 className="card-title mt-3">Appointments</h5>
                  <p className="card-text">Manage all appointment requests.</p>
                  <a href="/admin/appointments" className="btn btn-outline-primary">View</a>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center shadow-sm h-100">
                <div className="card-body">
                  <i className="bi bi-people display-4 text-success"></i>
                  <h5 className="card-title mt-3">Users</h5>
                  <p className="card-text">Manage registered users.</p>
                  <a href="/admin/users" className="btn btn-outline-success">View</a>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card text-center shadow-sm h-100">
                <div className="card-body">
                  <i className="bi bi-gear display-4 text-secondary"></i>
                  <h5 className="card-title mt-3">Settings</h5>
                  <p className="card-text">Configure system settings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
