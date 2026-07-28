"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import Swal from "sweetalert2";

export default function MainNavbar() {
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
      Swal.fire({ icon: "success", title: "Login Successful", text: `Welcome, ${username}!`, confirmButtonText: "OK" });
    } else {
      Swal.fire("Error", result.error || "Login failed", "error");
    }
  };

  const handleLogout = () => {
    logout();
    Swal.fire({ icon: "success", title: "Logged Out", text: "You have successfully logged out.", confirmButtonText: "OK" });
  };

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-light bg-light fixed-top shadow-sm">
        <div className="container-fluid px-3 d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center">
            <Link className="navbar-brand d-flex align-items-center" href="/">
              <img src="/assets/DYP_LOGO_RED.jpg" alt="DYP Logo" height="50" className="me-2" />
            </Link>
            <div className="navbar-brand-text d-none d-md-block">
              <strong>Dr. D.Y Patil Pratishthan&apos;s</strong><br />
              Dr. D.Y Patil College of Pharmacy Akurdi, Pune – 411044<br />
              <small className="text-muted">Department of Pharmacy Practice (Pharm. D.)</small>
            </div>
          </div>
          <button className="navbar-toggler ms-2" type="button" onClick={() => setIsOpen(!isOpen)} aria-controls="navbarContent" aria-expanded={isOpen} aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className={`collapse navbar-collapse justify-content-end mt-2 mt-lg-0 ${isOpen ? "show" : ""}`} id="navbarContent">
            <ul className="navbar-nav">
              <li className="nav-item"><Link className="nav-link fw-semibold" href="/">Home</Link></li>
              <li className="nav-item"><Link className="nav-link fw-semibold" href="/health-screening">Health Screening</Link></li>
              <li className="nav-item"><Link className="nav-link fw-semibold" href="/adr">ADR</Link></li>
              <li className="nav-item"><Link className="nav-link fw-semibold" href="/dic">DIC</Link></li>
              <li className="nav-item"><Link className="nav-link fw-semibold" href="/about-us">About Us</Link></li>
            </ul>
          </div>
        </div>
      </nav>
    </>
  );
}
