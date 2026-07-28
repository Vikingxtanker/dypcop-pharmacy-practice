"use client";

import { useState } from "react";
import AdrSectionNavbar from "@/components/layout/AdrSectionNavbar";
import Footer from "@/components/layout/Footer";

export default function AdrFormPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("ADR Report submitted successfully!");
  };

  return (
    <>
      <AdrSectionNavbar />
      <main className="flex-fill mt-5 pt-5">
        <div className="container">
          <h2 className="text-center mb-4">Simplified ADR Reporting Form</h2>
          <form onSubmit={handleSubmit} className="bg-white p-4 shadow rounded">
            <div className="mb-3">
              <label className="form-label">Institution Name</label>
              <input type="text" className="form-control" placeholder="Enter Institution Name" />
            </div>
            <div className="mb-3">
              <label className="form-label">Course Year</label>
              <input type="text" className="form-control" placeholder="e.g., 5th Year PharmD" />
            </div>
            <div className="mb-3">
              <label className="form-label">Date</label>
              <input type="date" className="form-control" />
            </div>

            <h5 className="mt-4">1. Patient Information</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Age</label>
                <input type="number" className="form-control" />
              </div>
              <div className="col-md-4">
                <label className="form-label">Gender</label>
                <select className="form-select">
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Weight (kg)</label>
                <input type="number" className="form-control" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Contact Number (optional)</label>
                <input type="tel" className="form-control" placeholder="10-digit number" />
              </div>
            </div>

            <h5 className="mt-4">2. Suspected ADR Details</h5>
            <div className="mb-3">
              <label className="form-label">Description of Reaction</label>
              <textarea className="form-control" rows={3} placeholder="Describe the reaction"></textarea>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Date of Onset</label>
                <input type="date" className="form-control" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Date of Recovery</label>
                <input type="date" className="form-control" />
              </div>
            </div>
            <div className="mt-3">
              <label className="form-label">Outcome</label>
              <select className="form-select">
                <option>Recovered</option>
                <option>Recovering</option>
                <option>Not Recovered</option>
                <option>Fatal</option>
                <option>Unknown</option>
              </select>
            </div>
            <div className="mt-3">
              <label className="form-label">Seriousness</label><br />
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="seriousness" value="Yes" />
                <label className="form-check-label">Yes</label>
              </div>
              <div className="form-check form-check-inline">
                <input className="form-check-input" type="radio" name="seriousness" value="No" />
                <label className="form-check-label">No</label>
              </div>
              <input type="text" className="form-control mt-2" placeholder="If Yes, specify (e.g., hospitalization)" />
            </div>

            <h5 className="mt-4">3. Suspected Medication Information</h5>
            <div className="mb-3">
              <label className="form-label">Drug Name (Brand/Generic)</label>
              <input type="text" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">Manufacturer</label>
              <input type="text" className="form-control" />
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Batch Number</label>
                <input type="text" className="form-control" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Expiry Date</label>
                <input type="date" className="form-control" />
              </div>
            </div>
            <div className="mb-3">
              <label className="form-label">Indication (Reason for Use)</label>
              <input type="text" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">Dosage Form &amp; Strength</label>
              <input type="text" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">Route of Administration</label>
              <select className="form-select">
                <option>Oral</option>
                <option>IV</option>
                <option>IM</option>
                <option>Other</option>
              </select>
            </div>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-control" />
              </div>
              <div className="col-md-6">
                <label className="form-label">Stop Date</label>
                <input type="date" className="form-control" />
              </div>
            </div>

            <h5 className="mt-4">4. Concomitant Medications</h5>
            <textarea className="form-control" rows={2} placeholder="List of other medications (optional)"></textarea>

            <h5 className="mt-4">5. Patient Medical History</h5>
            <textarea className="form-control mb-2" rows={2} placeholder="Known Allergies (optional)"></textarea>
            <textarea className="form-control mb-2" rows={2} placeholder="Previous ADRs (optional)"></textarea>
            <textarea className="form-control" rows={2} placeholder="Relevant Medical/Surgical History (optional)"></textarea>

            <h5 className="mt-4">6. Reporter Details</h5>
            <div className="mb-3">
              <label className="form-label">Name</label>
              <input type="text" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">Qualification</label>
              <input type="text" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">Institution</label>
              <input type="text" className="form-control" />
            </div>
            <div className="mb-3">
              <label className="form-label">Contact Information</label>
              <input type="text" className="form-control" />
            </div>

            <div className="text-center mt-4">
              <button type="submit" className="btn btn-primary px-5">Submit</button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
