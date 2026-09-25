"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import { computeBmi, parseOptionalMeasurement } from "@/lib/patient-review";
import { calculateAgeFromDob } from "@/lib/age";
import { formatIST, istDateKey } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

const HONORIFICS = ["mr", "mrs", "ms", "miss", "dr", "prof", "master", "md", "er", "engr", "smt", "smti", "shri", "kumari", "sir", "col", "maj", "capt", "lt", "lord", "lady", "fr", "rev", "sister", "baba"];
const HONORIFIC_RE = new RegExp(`^(?:${HONORIFICS.join("|")})\\.?\\s+`, "i");

const stripNamePrefix = (value: string) => {
  let out = value;
  let prev: string | null = null;
  while (out !== prev) {
    prev = out;
    out = out.replace(/^\s+/, "").replace(HONORIFIC_RE, "");
  }
  return out;
};

interface ReviewPatientRow {
  id: string;
  name: string;
  dob?: string | null;
  age?: number | string | null;
  gender?: string | null;
  phone?: string | null;
  height?: number | null;
  weight?: number | null;
  bmi?: number | null;
  past_medical?: string | null;
  past_medication?: string | null;
  created_at?: string | null;
}

interface ReviewMeasurementRecord {
  value_numeric: number | null;
  created_at: string;
}

interface ReviewMeasurementHistory {
  height: ReviewMeasurementRecord[];
  weight: ReviewMeasurementRecord[];
  bmi: ReviewMeasurementRecord[];
}

const EMPTY_MEASUREMENT_HISTORY: ReviewMeasurementHistory = {
  height: [],
  weight: [],
  bmi: [],
};

const REVIEW_MEASUREMENT_TYPES = ["Height", "Weight", "BMI"];

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

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

  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode] = useState<"idle" | "searching" | "results" | "none">("idle");
  const [searchResults, setSearchResults] = useState<ReviewPatientRow[]>([]);
  const [reviewPatient, setReviewPatient] = useState<ReviewPatientRow | null>(null);
  const [reviewHistory, setReviewHistory] = useState<ReviewMeasurementHistory>(EMPTY_MEASUREMENT_HISTORY);
  const [reviewLoadingHistory, setReviewLoadingHistory] = useState(false);
  const [reviewSaving, setReviewSaving] = useState(false);

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
      const yrs = calculateAgeFromDob(formData.dob);
      setFormData((prev) => ({ ...prev, age: yrs !== null ? String(yrs) : "" }));
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
    const field = e.target.name;
    const value = field === "name" ? stripNamePrefix(e.target.value) : e.target.value;
    setFormData({ ...formData, [field]: value });
  };

  const handleClear = () => {
    setFormData({
      name: "", dob: "", age: "", gender: "", height: "", weight: "", bmi: "",
      phone: "", address: "", tobacco: "", smoking: "", alcohol: "", married: "",
      allergy: "", allergyDetails: "", pastMedical: "", pastMedication: "",
    });
  };

  const loadMeasurementHistory = async (patientId: string) => {
    try {
      const { data, error } = await supabase
        .from("patient_tests")
        .select("test_type, value_numeric, created_at")
        .eq("patient_id", patientId)
        .in("test_type", REVIEW_MEASUREMENT_TYPES)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const buckets: ReviewMeasurementHistory = { height: [], weight: [], bmi: [] };
      for (const r of (data as { test_type: string; value_numeric: number | null; created_at: string }[]) || []) {
        if (r.test_type === "Height") buckets.height.push({ value_numeric: r.value_numeric, created_at: r.created_at });
        else if (r.test_type === "Weight") buckets.weight.push({ value_numeric: r.value_numeric, created_at: r.created_at });
        else if (r.test_type === "BMI") buckets.bmi.push({ value_numeric: r.value_numeric, created_at: r.created_at });
      }
      setReviewHistory(buckets);
    } catch (err) {
      console.error("Error loading measurement history:", err);
      setReviewHistory(EMPTY_MEASUREMENT_HISTORY);
    }
  };

  const previousRecord = (rows: ReviewMeasurementRecord[]): ReviewMeasurementRecord | null => {
    if (rows.length === 0) return null;
    const today = istDateKey(new Date());
    for (const row of rows) {
      const key = istDateKey(row.created_at);
      if (key && key !== today) return row;
    }
    return null;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchMode("searching");
    setSearchResults([]);
    try {
      let query = supabase
        .from("patients")
        .select("id,name,dob,gender,phone,height,weight,bmi,past_medical,past_medication,created_at")
        .limit(10);
      if (/^\d{10}$/.test(q)) query = query.eq("phone", q);
      else query = query.ilike("id", `%${q}%`);
      const { data, error } = await query;
      if (error) throw error;
      const rows = (data as ReviewPatientRow[]) || [];
      setSearchResults(rows);
      setSearchMode(rows.length > 0 ? "results" : "none");
    } catch (err) {
      console.error("Search error:", err);
      Swal.fire("Error", "Search failed. Please try again.", "error");
      setSearchMode("idle");
    }
  };

  const openReview = async (row: ReviewPatientRow) => {
    setReviewPatient(row);
    setSearchMode("idle");
    setSearchQuery("");
    setFormData((prev) => ({
      ...prev,
      height: row.height != null ? String(row.height) : "",
      weight: row.weight != null ? String(row.weight) : "",
      bmi: row.bmi != null ? String(row.bmi) : "",
      pastMedical: row.past_medical || "",
      pastMedication: row.past_medication || "",
    }));
    setReviewLoadingHistory(true);
    await loadMeasurementHistory(row.id);
    setReviewLoadingHistory(false);
  };

  const handleCancelReview = () => {
    setReviewPatient(null);
    setReviewHistory(EMPTY_MEASUREMENT_HISTORY);
    setSearchMode("idle");
    setSearchQuery("");
    setSearchResults([]);
    handleClear();
  };

  const handleSaveReview = async () => {
    if (!reviewPatient) return;
    if (reviewSaving) return;

    if (formData.height.trim()) {
      const parsed = parseOptionalMeasurement(formData.height, "height");
      if (parsed.error) {
        Swal.fire("Invalid Height", parsed.error, "error");
        return;
      }
    }
    if (formData.weight.trim()) {
      const parsed = parseOptionalMeasurement(formData.weight, "weight");
      if (parsed.error) {
        Swal.fire("Invalid Weight", parsed.error, "error");
        return;
      }
    }

    setReviewSaving(true);
    try {
      const res = await fetch("/api/patient-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: reviewPatient.id,
          heightCm: formData.height,
          weightKg: formData.weight,
          pastMedical: formData.pastMedical,
          pastMedication: formData.pastMedication,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        Swal.fire({
          icon: "error",
          title: "Save Failed",
          text: (payload?.error as string) || "Failed to save the review. No changes were recorded. Please try again.",
        });
        return;
      }

      await Swal.fire({
        icon: "success",
        title: "Saved",
        html: `<p>Patient information updated successfully.</p><p><strong>Patient ID:</strong> <code>${escapeHtml(reviewPatient.id)}</code></p>`,
        confirmButtonText: "Search another patient",
      });
      handleCancelReview();
    } catch (err) {
      console.error("Review save error:", err);
      Swal.fire("Error", "Network error. No changes were saved. Please try again.", "error");
    } finally {
      setReviewSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, dob, gender, height, weight, bmi, phone, address, tobacco, smoking, alcohol, married, allergy, allergyDetails, pastMedical, pastMedication } = formData;

    if (!/^\d{10}$/.test(phone)) {
      Swal.fire({ icon: "error", title: "Invalid Phone", text: "Phone number must be 10 digits" });
      return;
    }

    const trimmedName = name.trim();
    if (!trimmedName || /^(?:mrs?|ms|miss|dr|prof|master|md|er|engr|smt|smti|shri|kumari|sir|col|maj|capt|lt|lord|lady|fr|rev|sister|baba)\.?\s+/.test(trimmedName) || /^(?:mrs?|ms|miss|dr|prof|master|md|er|engr|smt|smti|shri|kumari|sir|col|maj|capt|lt|lord|lady|fr|rev|sister|baba)\.?$/i.test(trimmedName)) {
      Swal.fire({ icon: "error", title: "Invalid Name", text: "Please enter the patient's actual name without prefixes (Mr., Mrs., Miss, Dr., etc.)" });
      return;
    }

    const patientId = trimmedName.toLowerCase().replace(/\s+/g, "").slice(0, 3) + Math.floor(100 + Math.random() * 900);

    const payload = {
      id: patientId,
      name: trimmedName,
      dob,
      // Compatibility cache only — populated from DOB. DOB is the source of truth
      // for age; nothing downstream trusts `patients.age`.
      age: dob ? calculateAgeFromDob(dob) : null,
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

  const prevHeight = previousRecord(reviewHistory.height);
  const prevWeight = previousRecord(reviewHistory.weight);
  const prevBmi = previousRecord(reviewHistory.bmi);

  let reviewBmiDisplay = "—";
  if (reviewPatient) {
    const h = parseOptionalMeasurement(formData.height, "height");
    const w = parseOptionalMeasurement(formData.weight, "weight");
    if (!h.error && !w.error && h.value !== null && w.value !== null) {
      const reviewBmi = computeBmi(h.value, w.value);
      if (reviewBmi !== null) reviewBmiDisplay = `${reviewBmi} kg/m²`;
    }
  }

  return (
    <>
      <HssNavbar activePage="register" />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">Patient Registration</h2>

          <div className="bg-white p-4 shadow rounded mb-4" style={{ maxWidth: 720, margin: "0 auto" }}>
            <h5 className="mb-2">Returning Patient?</h5>
            <p className="text-muted small mb-3">
              Look up an existing patient by Patient ID or 10-digit phone number to review and update their
              information before they proceed to testing.
            </p>
            <form onSubmit={handleSearch} className="d-flex gap-2">
              <input
                type="text"
                className="form-control"
                placeholder="Patient ID or Phone"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn btn-outline-primary text-nowrap" disabled={searchMode === "searching"}>
                {searchMode === "searching" ? "Searching..." : "Search"}
              </button>
            </form>

            {searchMode === "none" && (
              <div className="alert alert-info mt-3 mb-0">
                No existing patient found for this ID / phone. Use the new-patient registration form below.
              </div>
            )}

            {searchMode === "results" && searchResults.length > 0 && (
              <div className="mt-3">
                <p className="fw-semibold mb-2">
                  {searchResults.length} match{searchResults.length === 1 ? "" : "es"} found. Select a patient to review:
                </p>
                <div className="list-group">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                      onClick={() => openReview(p)}
                    >
                      <span>
                        <strong>{p.name}</strong>
                        <span className="text-muted small"> ({calculateAgeFromDob(p.dob) ?? "?"} · {p.gender ?? "?"})</span>
                        <div className="small text-muted">
                          ID: {p.id}
                          {p.phone ? ` · ${p.phone}` : ""}
                        </div>
                      </span>
                      <span className="badge bg-primary rounded-pill">Review</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {reviewPatient ? (
            <div className="bg-white p-4 shadow rounded" style={{ maxWidth: 820, margin: "0 auto" }}>
              <div className="mb-3">
                <h4 className="mb-1">Patient Information Review</h4>
                <span className="badge bg-success text-uppercase">Returning Patient</span>
              </div>
              <div className="mb-3">
                <h5 className="mb-0">{reviewPatient.name}</h5>
                <div className="text-muted">
                  Patient ID: {reviewPatient.id} · {calculateAgeFromDob(reviewPatient.dob) ?? "?"} yrs · {reviewPatient.gender ?? "?"}
                  {reviewPatient.phone ? ` · ${reviewPatient.phone}` : ""}
                </div>
              </div>

              <div className="border rounded p-3 mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-1">
                  <h5 className="mb-0">Today&apos;s Measurements</h5>
                  <span className="text-muted small">BMI auto-calculated from height &amp; weight</span>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Height (cm)</label>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.1"
                        min="50"
                        max="300"
                        className="form-control"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        placeholder="—"
                      />
                      <span className="input-group-text">cm</span>
                    </div>
                    {prevHeight && (
                      <div className="small text-muted mt-1">
                        Previous: {prevHeight.value_numeric} cm · {formatIST(prevHeight.created_at)}
                      </div>
                    )}
                    {!prevHeight && !reviewLoadingHistory && (
                      <div className="small text-muted mt-1">No previous height record</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Weight (kg)</label>
                    <div className="input-group">
                      <input
                        type="number"
                        step="0.1"
                        min="1"
                        max="500"
                        className="form-control"
                        name="weight"
                        value={formData.weight}
                        onChange={handleChange}
                        placeholder="—"
                      />
                      <span className="input-group-text">kg</span>
                    </div>
                    {prevWeight && (
                      <div className="small text-muted mt-1">
                        Previous: {prevWeight.value_numeric} kg · {formatIST(prevWeight.created_at)}
                      </div>
                    )}
                    {!prevWeight && !reviewLoadingHistory && (
                      <div className="small text-muted mt-1">No previous weight record</div>
                    )}
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">BMI (kg/m²)</label>
                    <input type="text" className="form-control" value={reviewBmiDisplay} readOnly />
                    <div className="small form-text">Auto-calculated</div>
                    {prevBmi ? (
                      <div className="small text-muted mt-1">
                        Previous: {prevBmi.value_numeric} kg/m² · {formatIST(prevBmi.created_at)}
                      </div>
                    ) : (
                      !reviewLoadingHistory && <div className="small text-muted mt-1">No previous BMI record</div>
                    )}
                  </div>
                </div>
                {reviewLoadingHistory && <div className="small text-muted mt-2">Loading previous measurements...</div>}
              </div>

              <div className="border rounded p-3 mb-4">
                <h5 className="mb-2">Past Medical History</h5>
                <textarea
                  className="form-control"
                  rows={3}
                  name="pastMedical"
                  value={formData.pastMedical}
                  onChange={handleChange}
                  placeholder="Describe existing medical history (e.g., Diabetes mellitus, Hypertension)..."
                ></textarea>
                <div className="form-text">Review and update the patient&apos;s current medical history. Leave unchanged if nothing has changed.</div>
              </div>

              <div className="border rounded p-3 mb-4">
                <h5 className="mb-2">Past / Current Medication History</h5>
                <textarea
                  className="form-control"
                  rows={3}
                  name="pastMedication"
                  value={formData.pastMedication}
                  onChange={handleChange}
                  placeholder="List current medications, if any..."
                ></textarea>
                <div className="form-text">Review and update current medications. Leave unchanged if nothing has changed.</div>
              </div>

              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <span className="text-muted small">Saved measurements carry the registration date &amp; time.</span>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={handleCancelReview}>
                    Cancel
                  </button>
                  <button type="button" className="btn btn-success" onClick={handleSaveReview} disabled={reviewSaving}>
                    {reviewSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="bg-white p-4 shadow rounded">
                <h5 className="mb-3">Personal Information</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Full Name</label>
                <input type="text" className="form-control" name="name" placeholder="Enter full name (no prefixes like Mr., Mrs., Dr.)" value={formData.name} onChange={handleChange} required />
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
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
