"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdrSectionNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
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
            <li className="nav-item"><Link className="nav-link fw-semibold" href="/adr/decode">Decode (PvPI)</Link></li>
            <li className="nav-item"><Link className="nav-link fw-semibold" href="/adr/training">Training &amp; Education</Link></li>
            <li className="nav-item"><Link className="nav-link fw-semibold" href="/adr/adrform">Register / Requesting</Link></li>
            <li className="nav-item"><Link className="nav-link fw-semibold" href="/adr/about-us">About Us</Link></li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
