"use client";

import Link from "next/link";
import { useState } from "react";

interface AdrNavbarProps {
  activePage?: string;
}

export default function AdrNavbar({ activePage }: AdrNavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { href: "/", label: "Home" },
    { href: "/adr/decode", label: "Decode (PvPI)" },
    { href: "/adr/training", label: "Training & Education" },
    { href: "/adr/adrform", label: "Register / Requesting" },
    { href: "/adr/about-us", label: "About Us" },
  ];

  return (
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
            {links.map((link) => (
              <li className="nav-item" key={link.href}>
                <Link
                  className={`nav-link fw-semibold${activePage === link.href ? " active" : ""}`}
                  href={link.href}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
