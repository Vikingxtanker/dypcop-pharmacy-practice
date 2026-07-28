"use client";
import { useState } from "react";
import DicSectionNavbar from "@/components/layout/DicSectionNavbar";
import Footer from "@/components/layout/Footer";

export default function DicPage() {
  const [activeTab, setActiveTab] = useState("drug-request-form");

  return (
    <>
      <DicSectionNavbar />
      <main className="dic-main">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-16-9">
            <div className="container h-100 d-flex flex-column justify-content-center align-items-center py-4">
              <div className="soft-glass rounded-3xl p-4 mb-4 hero-card w-100">
                <h2 className="hero-title text-center">WELCOME TO DRUG INFORMATION CENTER</h2>
                <p className="hero-subtitle text-center">Your trusted source for comprehensive pharmaceutical information</p>
                <div className="d-flex flex-column flex-md-row gap-3 justify-content-center align-items-center mt-4">
                  <div className="flex-fill position-relative">
                    <input type="text" placeholder="Search medications, interactions, dosages..." className="form-control gentle-input hero-search-input" />
                    <div className="search-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                    </div>
                  </div>
                  <button className="btn soft-button">Search</button>
                </div>
              </div>
              {/* Circular Tabs */}
              <div className="d-flex justify-content-center mt-3">
                <div className="circular-tabs d-flex flex-wrap justify-content-center gap-3 p-3 soft-glass rounded-3xl">
                  {[
                    { id: "drug-request-form", emoji: "📋", label: "Request Form" },
                    { id: "rx-express", emoji: "⚡", label: "RX Express" },
                    { id: "patient-counselling", emoji: "👨‍⚕️", label: "Counselling" },
                    { id: "drug-monograph", emoji: "📚", label: "Monograph" },
                    { id: "latest-news", emoji: "📰", label: "Latest News" },
                  ].map((tab) => (
                    <div key={tab.id} className="text-center">
                      <button
                        onClick={() => setActiveTab(tab.id)}
                        className={`circular-tab ${activeTab === tab.id ? "active" : ""}`}
                      >
                        <span className="emoji">{tab.emoji}</span>
                        <div className="circular-label">{tab.label}</div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Content */}
        <section className="container py-5">
          <div className="soft-glass rounded-3xl p-4 tab-wrapper">
            {/* Drug Request Form Tab */}
            <div className={`tab-content ${activeTab === "drug-request-form" ? "active" : ""}`}>
              <div className="container-lg">
                <h3 className="text-center mb-4">📋 Drug Information Request Form</h3>
                <div className="row g-4">
                  <div className="col-12 col-lg-6">
                    <div className="soft-card rounded-3xl p-3 mint-gradient h-100">
                      <h4 className="mb-3">Request Information</h4>
                      <div className="mb-3">
                        <label className="form-label">Drug Name</label>
                        <input type="text" className="form-control gentle-input" placeholder="Enter drug name..." />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Information Type</label>
                        <select className="form-select gentle-input">
                          <option>Select information type...</option>
                          <option>Dosage &amp; Administration</option>
                          <option>Side Effects &amp; Contraindications</option>
                          <option>Drug Interactions</option>
                          <option>Pharmacokinetics</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Priority Level</label>
                        <select className="form-select gentle-input">
                          <option>Routine (24-48 hours)</option>
                          <option>Urgent (4-6 hours)</option>
                          <option>Emergency (1 hour)</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Additional Details</label>
                        <textarea className="form-control gentle-input" rows={4} placeholder="Provide specific details..."></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-lg-6">
                    <div className="soft-card rounded-3xl p-3 sky-gradient h-100">
                      <h4 className="mb-3">Requester Information</h4>
                      <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <input type="text" className="form-control gentle-input" placeholder="Your full name..." />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Professional Title</label>
                        <select className="form-select gentle-input">
                          <option>Select your role...</option>
                          <option>Pharmacist</option>
                          <option>Physician</option>
                          <option>Nurse</option>
                          <option>Medical Student</option>
                          <option>Pharmacy Student</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Institution/Hospital</label>
                        <input type="text" className="form-control gentle-input" placeholder="Your workplace..." />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Contact Email</label>
                        <input type="email" className="form-control gentle-input" placeholder="your.email@example.com" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-4">
                  <button className="btn soft-button px-4 py-2">Submit Request</button>
                </div>
              </div>
            </div>

            {/* RX Express Tab */}
            <div className={`tab-content ${activeTab === "rx-express" ? "active" : ""}`}>
              <div className="text-center mb-4">
                <h3>⚡ RX Express - Quick Drug Lookup</h3>
                <p className="text-muted">Fast access to essential drug information</p>
              </div>
              <div className="row g-4 mb-4">
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="soft-card rounded-3xl p-3 mint-gradient h-100 text-center">
                    <div className="display-4 mb-3">💊</div>
                    <h5>Quick Dosage</h5>
                    <p className="small text-muted">Instant access to standard dosing information</p>
                    <button className="btn w-100 btn-light mt-3">Access Now →</button>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="soft-card rounded-3xl p-3 sky-gradient h-100 text-center">
                    <div className="display-4 mb-3">⚠️</div>
                    <h5>Safety Alerts</h5>
                    <p className="small text-muted">Critical safety information and warnings</p>
                    <button className="btn w-100 btn-light mt-3">Check Alerts →</button>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="soft-card rounded-3xl p-3 lavender-gradient h-100 text-center">
                    <div className="display-4 mb-3">🔄</div>
                    <h5>Interactions</h5>
                    <p className="small text-muted">Rapid drug interaction screening</p>
                    <button className="btn w-100 btn-light mt-3">Screen Now →</button>
                  </div>
                </div>
              </div>
              <div className="soft-card rounded-3xl p-3">
                <div className="d-flex gap-3 mb-3">
                  <input type="text" className="form-control gentle-input" placeholder="Enter drug name for instant lookup..." />
                  <button className="btn soft-button">⚡ Express</button>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button className="btn btn-outline-success">Aspirin</button>
                  <button className="btn btn-outline-info">Metformin</button>
                  <button className="btn btn-outline-primary">Lisinopril</button>
                  <button className="btn btn-outline-warning">Atorvastatin</button>
                </div>
              </div>
            </div>

            {/* Patient Counselling Tab */}
            <div className={`tab-content ${activeTab === "patient-counselling" ? "active" : ""}`}>
              <div className="text-center mb-4">
                <h3>👨‍⚕️ Patient Counselling Resources</h3>
                <p className="text-muted">Comprehensive tools for effective patient education</p>
              </div>
              <div className="row g-4">
                <div className="col-12 col-lg-6">
                  <div className="soft-card rounded-3xl p-3 mint-gradient h-100">
                    <h5>📋 Counselling Checklist Generator</h5>
                    <div className="mt-3">
                      <div className="mb-3">
                        <label className="form-label">Medication</label>
                        <input type="text" className="form-control gentle-input" placeholder="Enter medication name..." />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Patient Age Group</label>
                        <select className="form-select gentle-input">
                          <option>Adult (18-65)</option>
                          <option>Pediatric (0-17)</option>
                          <option>Geriatric (65+)</option>
                        </select>
                      </div>
                      <button className="btn btn-success w-100">📋 Generate Checklist</button>
                    </div>
                  </div>
                </div>
                <div className="col-12 col-lg-6">
                  <div className="soft-card rounded-3xl p-3 sky-gradient h-100">
                    <h5>📚 Patient Education Materials</h5>
                    <div className="mt-3">
                      {["Medication Adherence Guide", "Side Effects Monitoring", "Drug Storage Guidelines", "Interaction Prevention"].map((item) => (
                        <div key={item} className="bg-white rounded-3 p-2 mb-2 d-flex justify-content-between align-items-center">
                          <span>{item}</span>
                          <button className="btn btn-link">Download PDF</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Drug Monograph Tab */}
            <div className={`tab-content ${activeTab === "drug-monograph" ? "active" : ""}`}>
              <div className="text-center mb-4">
                <h3>📚 Drug Monograph Database</h3>
                <p className="text-muted">Comprehensive pharmaceutical monographs and clinical data</p>
              </div>
              <div className="soft-card rounded-3xl p-3 mb-4">
                <div className="d-flex flex-column flex-md-row gap-3">
                  <input type="text" className="form-control gentle-input" placeholder="Search drug monographs..." />
                  <select className="form-select gentle-input">
                    <option>All Categories</option>
                    <option>Cardiovascular</option>
                    <option>Antibiotics</option>
                    <option>CNS Agents</option>
                  </select>
                  <button className="btn soft-button">🔍 Search</button>
                </div>
              </div>
              <div className="row g-3">
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="soft-card rounded-3xl p-3 mint-gradient h-100">
                    <div className="d-flex justify-content-between mb-2">
                      <h5>Aspirin</h5>
                      <span className="badge bg-success">Updated</span>
                    </div>
                    <p className="small text-muted">Acetylsalicylic acid - Antiplatelet agent</p>
                    <button className="btn btn-outline-success w-100">View Monograph →</button>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="soft-card rounded-3xl p-3 sky-gradient h-100">
                    <div className="d-flex justify-content-between mb-2">
                      <h5>Metformin</h5>
                      <span className="badge bg-info text-dark">Popular</span>
                    </div>
                    <p className="small text-muted">Biguanide antidiabetic agent</p>
                    <button className="btn btn-outline-info w-100">View Monograph →</button>
                  </div>
                </div>
                <div className="col-12 col-md-6 col-lg-4">
                  <div className="soft-card rounded-3xl p-3 lavender-gradient h-100">
                    <div className="d-flex justify-content-between mb-2">
                      <h5>Lisinopril</h5>
                      <span className="badge bg-secondary">New</span>
                    </div>
                    <p className="small text-muted">ACE inhibitor for hypertension</p>
                    <button className="btn btn-outline-secondary w-100">View Monograph →</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Latest News Tab */}
            <div className={`tab-content ${activeTab === "latest-news" ? "active" : ""}`}>
              <div className="text-center mb-4">
                <h3>📰 Latest Pharmaceutical News</h3>
                <p className="text-muted">Stay updated with the latest developments</p>
              </div>
              <div className="row g-4">
                <div className="col-lg-8">
                  <div className="soft-card rounded-3xl p-3 mb-3">
                    <div className="d-flex gap-3">
                      <div className="bg-danger text-white rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{width:"50px",height:"50px",fontSize:"1.5rem"}}>🚨</div>
                      <div>
                        <span className="badge bg-danger">BREAKING</span>
                        <h5 className="mt-1">FDA Approves New Alzheimer&apos;s Treatment</h5>
                        <p className="small text-muted">Revolutionary drug shows significant cognitive improvement in clinical trials.</p>
                      </div>
                    </div>
                  </div>
                  <div className="soft-card rounded-3xl p-3 mb-3">
                    <div className="d-flex gap-3">
                      <div className="bg-info text-white rounded-3 d-flex align-items-center justify-content-center flex-shrink-0" style={{width:"50px",height:"50px",fontSize:"1.5rem"}}>💊</div>
                      <div>
                        <span className="badge bg-info text-dark">RESEARCH</span>
                        <h5 className="mt-1">Breakthrough in Cancer Immunotherapy</h5>
                        <p className="small text-muted">New combination therapy shows 85% response rate in advanced melanoma patients.</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-lg-4">
                  <div className="soft-card rounded-3xl p-3 mb-3 mint-gradient">
                    <h6>🔥 Trending Topics</h6>
                    <div className="mt-2 small">
                      <div className="d-flex justify-content-between"><span>#PersonalizedMedicine</span><span className="text-success">+24%</span></div>
                      <div className="d-flex justify-content-between"><span>#AIInPharma</span><span className="text-success">+18%</span></div>
                      <div className="d-flex justify-content-between"><span>#DrugSafety</span><span className="text-success">+15%</span></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
