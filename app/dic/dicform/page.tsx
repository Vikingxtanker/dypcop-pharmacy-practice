"use client";

import { useState } from "react";
import DicSectionNavbar from "@/components/layout/DicSectionNavbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

export default function DicFormPage() {
  const [formData, setFormData] = useState({
    requesterName: "",
    designation: "",
    deptUnit: "",
    contactNo: "",
    communicationMode: "",
    patientAge: "",
    patientGender: "",
    diagnosis: "",
    currentMedication: "",
    relevantHistory: "",
    specificQuery: "",
    urgencyLevel: "",
    requestDateTime: "",
    sign: "",
    receivedBy: "",
    dicCommMode: "",
    assuredDateTime: "",
    answeredBy: "",
    sources: "",
    remark: "",
    otherCategory: "",
  });

  const [categories, setCategories] = useState<string[]>([]);

  const categoryOptions = [
    { id: "category1", label: "Drug Information", value: "Drug Information" },
    { id: "category2", label: "Adverse Drug Reaction", value: "Adverse Drug Reaction" },
    { id: "category3", label: "Drug Interaction", value: "Drug Interaction" },
    { id: "category4", label: "Dosing Information", value: "Dosing Information" },
    { id: "category5", label: "Therapeutic Equivalence", value: "Therapeutic Equivalence" },
    { id: "category6", label: "Formulary Information", value: "Formulary Information" },
    { id: "category7", label: "IV Compatibility", value: "IV Compatibility" },
    { id: "category8", label: "Patient Education", value: "Patient Education" },
  ];

  const handleCategoryChange = (value: string, checked: boolean) => {
    setCategories((prev) =>
      checked ? [...prev, value] : prev.filter((c) => c !== value)
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClear = () => {
    setFormData({
      requesterName: "", designation: "", deptUnit: "", contactNo: "", communicationMode: "",
      patientAge: "", patientGender: "", diagnosis: "", currentMedication: "", relevantHistory: "",
      specificQuery: "", urgencyLevel: "", requestDateTime: "", sign: "",
      receivedBy: "", dicCommMode: "", assuredDateTime: "", answeredBy: "", sources: "", remark: "", otherCategory: "",
    });
    setCategories([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const contact = formData.contactNo.trim();
    if (contact && !/^\d{10}$/.test(contact)) {
      Swal.fire({ icon: "error", title: "Invalid phone number", text: "Contact number must be 10 digits" });
      return;
    }

    const allCategories = [...categories];
    if (formData.otherCategory.trim()) {
      allCategories.push(formData.otherCategory.trim());
    }

    let namePart = formData.requesterName.trim().replace(/\s+/g, "_").replace(/[^\w\-]/g, "") || "unknown";
    const docId = `${namePart}_${Date.now()}`;

    const { error } = await supabase.from("dicform").insert({
      id: docId,
      requester_name: formData.requesterName.trim(),
      designation: formData.designation.trim(),
      dept_unit: formData.deptUnit.trim(),
      contact_no: contact,
      communication_mode: formData.communicationMode,
      patient_age: formData.patientAge ? Number(formData.patientAge) : null,
      patient_gender: formData.patientGender,
      diagnosis: formData.diagnosis.trim(),
      current_medication: formData.currentMedication.trim(),
      relevant_history: formData.relevantHistory.trim(),
      categories: allCategories,
      specific_query: formData.specificQuery.trim(),
      urgency_level: formData.urgencyLevel,
      request_datetime: formData.requestDateTime || "",
      sign: formData.sign.trim(),
      received_by: formData.receivedBy.trim(),
      dic_comm_mode: formData.dicCommMode.trim(),
      assured_datetime: formData.assuredDateTime || "",
      answered_by: formData.answeredBy.trim(),
      sources: formData.sources.trim(),
      remark: formData.remark.trim(),
      timestamp: new Date().toISOString(),
    });

    if (error) {
      console.error("Error saving DIC form:", error);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to submit form" });
    } else {
      Swal.fire({ icon: "success", title: "Submitted Successfully", text: "DIC request saved to database", confirmButtonColor: "#3085d6" });
      handleClear();
    }
  };

  return (
    <>
      <DicSectionNavbar />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">Drug Information Request Form</h2>
          <form onSubmit={handleSubmit} className="bg-white p-4 shadow rounded">
            <h5 className="mb-3">Requester Details</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Requester Name</label>
                <input type="text" className="form-control" name="requesterName" value={formData.requesterName} onChange={handleChange} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Designation</label>
                <input type="text" className="form-control" name="designation" value={formData.designation} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Department / Unit</label>
                <input type="text" className="form-control" name="deptUnit" value={formData.deptUnit} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Contact No.</label>
                <input type="tel" className="form-control" name="contactNo" value={formData.contactNo} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Communication Mode</label>
                <select className="form-select" name="communicationMode" value={formData.communicationMode} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Phone</option>
                  <option>Email</option>
                  <option>In-person</option>
                  <option>Written</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Request Date &amp; Time</label>
                <input type="datetime-local" className="form-control" name="requestDateTime" value={formData.requestDateTime} onChange={handleChange} />
              </div>
            </div>

            <h5 className="mt-4 mb-3">Patient Details</h5>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Patient Age</label>
                <input type="number" className="form-control" name="patientAge" value={formData.patientAge} onChange={handleChange} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Patient Gender</label>
                <select className="form-select" name="patientGender" value={formData.patientGender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Diagnosis</label>
                <input type="text" className="form-control" name="diagnosis" value={formData.diagnosis} onChange={handleChange} />
              </div>
              <div className="col-md-6">
                <label className="form-label">Current Medication</label>
                <textarea className="form-control" name="currentMedication" rows={2} value={formData.currentMedication} onChange={handleChange}></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label">Relevant History</label>
                <textarea className="form-control" name="relevantHistory" rows={2} value={formData.relevantHistory} onChange={handleChange}></textarea>
              </div>
            </div>

            <h5 className="mt-4 mb-3">Query Category</h5>
            <div className="row g-2">
              {categoryOptions.map((opt) => (
                <div className="col-md-3" key={opt.id}>
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={opt.id}
                      value={opt.value}
                      checked={categories.includes(opt.value)}
                      onChange={(e) => handleCategoryChange(opt.value, e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor={opt.id}>{opt.label}</label>
                  </div>
                </div>
              ))}
              <div className="col-md-4 mt-2">
                <input type="text" className="form-control form-control-sm" name="otherCategory" placeholder="Other (specify)" value={formData.otherCategory} onChange={handleChange} />
              </div>
            </div>

            <div className="mb-3 mt-3">
              <label className="form-label">Specific Query</label>
              <textarea className="form-control" name="specificQuery" rows={3} value={formData.specificQuery} onChange={handleChange} required></textarea>
            </div>

            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Urgency Level</label>
                <select className="form-select" name="urgencyLevel" value={formData.urgencyLevel} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Emergency</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Signature</label>
                <input type="text" className="form-control" name="sign" value={formData.sign} onChange={handleChange} />
              </div>
            </div>

            <h5 className="mt-4 mb-3">DIC Response Section</h5>
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label">Received By</label>
                <input type="text" className="form-control" name="receivedBy" value={formData.receivedBy} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">DIC Communication Mode</label>
                <input type="text" className="form-control" name="dicCommMode" value={formData.dicCommMode} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Assured Date &amp; Time</label>
                <input type="datetime-local" className="form-control" name="assuredDateTime" value={formData.assuredDateTime} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Answered By</label>
                <input type="text" className="form-control" name="answeredBy" value={formData.answeredBy} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Sources</label>
                <input type="text" className="form-control" name="sources" value={formData.sources} onChange={handleChange} />
              </div>
              <div className="col-md-4">
                <label className="form-label">Remarks</label>
                <input type="text" className="form-control" name="remark" value={formData.remark} onChange={handleChange} />
              </div>
            </div>

            <div className="text-center mt-4">
              <button type="button" className="btn btn-secondary me-2" onClick={handleClear}>Clear All</button>
              <button type="submit" className="btn btn-primary px-5">Submit</button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
