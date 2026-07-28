"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Swal from "sweetalert2";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { user, login, logout } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      Swal.fire("Error", "Please enter both username and password", "error");
      return;
    }
    const result = await login(username.trim(), password);
    if (result.success) {
      setShowLogin(false);
      setUsername("");
      setPassword("");
      Swal.fire({
        icon: "success",
        title: "Login Successful",
        text: `Welcome, ${user?.username || username}!`,
        confirmButtonText: "OK",
      });
    } else {
      Swal.fire("Error", result.error || "Login failed", "error");
    }
  };

  const handleLogout = () => {
    logout();
    Swal.fire({
      icon: "success",
      title: "Logged Out",
      text: "You have successfully logged out.",
      confirmButtonText: "OK",
    });
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top shadow-sm">
        <div className="container-fluid px-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <Link className="navbar-brand d-flex align-items-center" href="/">
              <img
                src="/assets/DYP_LOGO_RED.jpg"
                alt="DYP Logo"
                height="50"
                className="me-2"
              />
            </Link>
            <div className="navbar-brand-text d-none d-md-block">
              <strong>Dr. D.Y Patil Pratishthan&apos;s</strong>
              <br />
              Dr. D.Y Patil College of Pharmacy Akurdi, Pune – 411044
              <br />
              <small className="text-muted">
                Department of Pharmacy Practice (Pharm. D.)
              </small>
            </div>
          </div>
          <button
            className="navbar-toggler ms-2"
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            aria-controls="navbarContent"
            aria-expanded={isOpen}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div
            className={`collapse navbar-collapse justify-content-end mt-2 mt-lg-0 ${isOpen ? "show" : ""}`}
            id="navbarContent"
          >
            <ul className="navbar-nav">
              <li className="nav-item">
                <Link className="nav-link fw-semibold" href="/">Home</Link>
              </li>
              <li className="nav-item dropdown">
                <span className="nav-link fw-semibold dropdown-toggle" role="button" data-bs-toggle="dropdown">
                  Health Screening
                </span>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" href="/health-screening">Overview</Link></li>
                  <li><Link className="dropdown-item" href="/health-screening/services">Services</Link></li>
                  <li><Link className="dropdown-item" href="/health-screening/education">Education</Link></li>
                  <li><Link className="dropdown-item" href="/health-screening/guidelines">Guidelines</Link></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link className="nav-link fw-semibold" href="/adr">AMC</Link>
              </li>
              <li className="nav-item dropdown">
                <span className="nav-link fw-semibold dropdown-toggle" role="button" data-bs-toggle="dropdown">
                  DIC
                </span>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" href="/dic">Overview</Link></li>
                  <li><Link className="dropdown-item" href="/dic/dicform">Request Form</Link></li>
                  <li><Link className="dropdown-item" href="/dic/guidelines">Guidelines</Link></li>
                  <li><Link className="dropdown-item" href="/dic/about-us">About Us</Link></li>
                </ul>
              </li>
              <li className="nav-item">
                <Link className="nav-link fw-semibold" href="/about-us">About Us</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link fw-semibold" href="/appointment">Appointment</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link fw-semibold" href="/dm-appointment">DM Appointment</Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link fw-semibold" href="/pharmdvideo">Videos</Link>
              </li>
              {user ? (
                <>
                  <li className="nav-item dropdown">
                    <span className="nav-link fw-semibold dropdown-toggle" role="button" data-bs-toggle="dropdown">
                      <i className="bi bi-person-circle me-1"></i>{user.username}
                    </span>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li><Link className="dropdown-item" href="/dashboard">Dashboard</Link></li>
                      {(user.role === "admin" || user.role === "registration") && (
                        <li><Link className="dropdown-item" href="/register">Register Patient</Link></li>
                      )}
                      {(user.role === "admin" || user.role === "station") && (
                        <li><Link className="dropdown-item" href="/station">Station</Link></li>
                      )}
                      {(user.role === "admin" || user.role === "documentation") && (
                        <li><Link className="dropdown-item" href="/patient-report">Patient Report</Link></li>
                      )}
                      {user.role === "admin" && (
                        <>
                          <li><hr className="dropdown-divider" /></li>
                          <li><Link className="dropdown-item" href="/admin">Admin Panel</Link></li>
                        </>
                      )}
                      <li><hr className="dropdown-divider" /></li>
                      <li>
                        <button className="dropdown-item text-danger" onClick={handleLogout}>
                          Logout
                        </button>
                      </li>
                    </ul>
                  </li>
                </>
              ) : (
                <li className="nav-item">
                  <button className="nav-link fw-semibold btn btn-link" onClick={() => setShowLogin(true)}>
                    <i className="bi bi-box-arrow-in-right me-1"></i>Login
                  </button>
                </li>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {showLogin && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Login</h5>
                <button type="button" className="btn-close" onClick={() => setShowLogin(false)}></button>
              </div>
              <form onSubmit={handleLogin}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input
                      type="text"
                      className="form-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowLogin(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Login</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
