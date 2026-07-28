"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

export default function RegisterPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    bmi: "",
    phone: "",
    address: "",
    tobacco: "",
    smoking: "",
    alcohol: "",
    married: "",
    allergy: "",
    allergyDetails: "",
    pastMedical: "",
    pastMedication: "",
  });

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "registration")) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You must be logged in with Admin or Registration role to access this page.",
        confirmButtonText: "OK",
      }).then(() => router.push("/health-screening"));
    } else {
      setAuthorized(true);
    }
  }, [user, router]);

  useEffect(() => {
    if (formData.dob) {
      const d = new Date(formData.dob);
      const now = new Date();
      let yrs = now.getFullYear() - d.getFullYear();
      const m = now.getMonth() - d.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < d.getDate())) yrs--;
      setFormData((prev) => ({ ...prev, age: yrs >= 0 ? String(yrs) : "" }));
    }
  }, [formData.dob]);

  useEffect(() => {
    const h = parseFloat(formData.height);
    const w = parseFloat(formData.weight);
    if (h > 0 && w > 0) {
      const bmi = w / ((h / 100) ** 2);
      setFormData((prev) => ({ ...prev, bmi: bmi.toFixed(1) }));
    } else {
      setFormData((prev) => ({ ...prev, bmi: "" }));
    }
  }, [formData.height, formData.weight]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleClear = () => {
    setFormData({
      name: "", dob: "", age: "", gender: "", height: "", weight: "", bmi: "",
      phone: "", address: "", tobacco: "", smoking: "", alcohol: "", married: "",
      allergy: "", allergyDetails: "", pastMedical: "", pastMedication: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, dob, age, gender, height, weight, bmi, phone, address, tobacco, smoking, alcohol, married, allergy, allergyDetails, pastMedical, pastMedication } = formData;

    if (!/^\d{10}$/.test(phone)) {
      Swal.fire({ icon: "error", title: "Invalid Phone", text: "Phone number must be 10 digits" });
      return;
    }

    const patientId = name.toLowerCase().replace(/\s+/g, "").slice(0, 3) + Math.floor(100 + Math.random() * 900);

    const payload = {
      id: patientId,
      name,
      dob,
      age: age ? parseInt(age) : null,
      gender,
      phone,
      address,
      height: height ? parseFloat(height) : null,
      weight: weight ? parseFloat(weight) : null,
      bmi: bmi ? parseFloat(bmi) : null,
      tobacco,
      smoking,
      alcohol,
      married,
      allergy,
      allergy_details: allergyDetails,
      past_medical: pastMedical,
      past_medication: pastMedication,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from("patients").insert(payload);

      if (error) throw error;

      await Swal.fire({
        icon: "success",
        title: "Registered successfully!",
        text: `Patient ID: ${patientId}`,
        confirmButtonColor: "#3085d6",
      });

      handleClear();
    } catch (err) {
      console.error("Error:", err);
      Swal.fire({
        icon: "error",
        title: "Submission Failed",
        text: "An error occurred while submitting data. Please try again.",
      });
    }
  };

  if (!authorized) return null;

  return (
    <>
      <HssNavbar activePage="register" />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">Patient Registration</h2>
          <form onSubmit={handleSubmit} className="bg-white p-4 shadow rounded">
            <h5 className="mb-3">Personal Information</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Date of Birth</label>
                <input type="date" className="form-control" name="dob" value={formData.dob} onChange={handleChange} required />
              </div>
              <div className="col-md-3">
                <label className="form-label">Age</label>
                <input type="text" className="form-control" value={formData.age} readOnly />
              </div>
              <div className="col-md-4">
                <label className="form-label">Gender</label>
                <select className="form-select" name="gender" value={formData.gender} onChange={handleChange} required>
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Height (cm)</label>
                <input type="number" className="form-control" name="height" value={formData.height} onChange={handleChange} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Weight (kg)</label>
                <input type="number" className="form-control" name="weight" value={formData.weight} onChange={handleChange} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">BMI</label>
                <input type="text" className="form-control" value={formData.bmi} readOnly />
              </div>
              <div className="col-md-4">
                <label className="form-label">Phone</label>
                <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange} required />
              </div>
              <div className="col-md-4">
                <label className="form-label">Address</label>
                <input type="text" className="form-control" name="address" value={formData.address} onChange={handleChange} />
              </div>
            </div>

            <h5 className="mt-4 mb-3">Lifestyle &amp; Medical History</h5>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Tobacco</label>
                <select className="form-select" name="tobacco" value={formData.tobacco} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Smoking</label>
                <select className="form-select" name="smoking" value={formData.smoking} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Alcohol</label>
                <select className="form-select" name="alcohol" value={formData.alcohol} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Married</label>
                <select className="form-select" name="married" value={formData.married} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Known Allergies</label>
                <select className="form-select" name="allergy" value={formData.allergy} onChange={handleChange}>
                  <option value="">Select</option>
                  <option>Yes</option>
                  <option>No</option>
                </select>
              </div>
              {formData.allergy === "Yes" && (
                <div className="col-md-8">
                  <label className="form-label">Allergy Details</label>
                  <input type="text" className="form-control" name="allergyDetails" value={formData.allergyDetails} onChange={handleChange} />
                </div>
              )}
              <div className="col-md-6">
                <label className="form-label">Past Medical History</label>
                <textarea className="form-control" name="pastMedical" rows={2} value={formData.pastMedical} onChange={handleChange}></textarea>
              </div>
              <div className="col-md-6">
                <label className="form-label">Past Medication History</label>
                <textarea className="form-control" name="pastMedication" rows={2} value={formData.pastMedication} onChange={handleChange}></textarea>
              </div>
            </div>

            <div className="text-center mt-4">
              <button type="button" className="btn btn-secondary me-2" onClick={handleClear}>Clear All</button>
              <button type="submit" className="btn btn-primary px-5">Register Patient</button>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
