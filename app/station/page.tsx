"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { formatIST, istDateKey, istDayRangeUtc } from "@/lib/utils";
import Swal from "sweetalert2";
import {
  COUNSELING_LIMIT_MESSAGE,
  COUNSELING_MAX_CHARS,
  COUNSELING_MAX_LINES,
  counselingStatus,
  enforceCounselingLimit,
} from "@/lib/counseling-limit";

const counselingLimitToast = () =>
  Swal.fire({
    toast: true,
    position: "top-end",
    timer: 3500,
    timerProgressBar: true,
    showConfirmButton: false,
    icon: "warning",
    title: COUNSELING_LIMIT_MESSAGE,
    customClass: { title: "fs-6 fw-normal" },
  });

function AutoVerifyPatientParam({ onLoaded }: { onLoaded: (patientId: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const id = searchParams.get("patientId");
    if (id) onLoaded(id.trim());
  }, [searchParams, onLoaded]);
  return null;
}

function useCounselingField(initialValue = "") {
  const [value, setValue] = useState(initialValue);
  const ref = useRef<HTMLTextAreaElement>(null);
  const pendingCaretRef = useRef<number | null>(null);
  const toastShownRef = useRef(false);
  const valueRef = useRef(initialValue);

  useEffect(() => {
    const el = ref.current;
    const pos = pendingCaretRef.current;
    if (el && pos !== null && document.activeElement === el) {
      el.setSelectionRange(pos, pos);
    }
    pendingCaretRef.current = null;
  });

  const onChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const raw = e.target.value;
    const rawCaret = e.target.selectionStart ?? raw.length;
    const enforced = enforceCounselingLimit(raw, rawCaret);
    const prev = valueRef.current;
    valueRef.current = enforced.value;
    pendingCaretRef.current = enforced.caret;

    if (enforced.value !== prev) {
      setValue(enforced.value);
    } else if (enforced.value !== raw) {
      e.currentTarget.value = enforced.value;
    }

    if (enforced.truncated) {
      if (!toastShownRef.current) {
        toastShownRef.current = true;
        counselingLimitToast();
      }
    } else {
      toastShownRef.current = false;
    }
  }, []);

  const reset = useCallback(() => {
    setValue(initialValue);
    valueRef.current = initialValue;
    pendingCaretRef.current = null;
    toastShownRef.current = false;
  }, [initialValue]);

  return { value, ref, onChange, reset };
}

interface PatientRow {
  id: string;
  name: string;
  age: number | string;
  gender: string;
}

interface TestRecord {
  id: number;
  patient_id: string;
  test_type: string;
  value_numeric: number | null;
  value_text: string | null;
  unit: string | null;
  created_at: string;
}

const TEST_TYPES = [
  { value: "Hemoglobin", unit: "g/dL", placeholder: "Hemoglobin (g/dL)" },
  { value: "RBG", unit: "mg/dL", placeholder: "Random Blood Glucose (mg/dL)" },
  { value: "FBS", unit: "mg/dL", placeholder: "Fasting Blood Sugar (mg/dL)" },
  { value: "PPBS", unit: "mg/dL", placeholder: "Post-Prandial Blood Sugar (mg/dL)" },
  { value: "OGTT", unit: "mg/dL", placeholder: "OGTT (mg/dL)" },
  { value: "HbA1c", unit: "%", placeholder: "HbA1c (%)" },
  { value: "Heart Rate", unit: "/min", placeholder: "Heart Rate (/min)" },
  { value: "Temperature", unit: "°C", placeholder: "Temperature (°C)" },
  { value: "SpO2", unit: "%", placeholder: "SpO₂ (%)" },
  { value: "Target Weight", unit: "kg", placeholder: "Target Weight (kg)" },
  { value: "FEV", unit: "L", placeholder: "FEV (L)" },
  { value: "BP", unit: "mmHg", placeholder: "Systolic/Diastolic (mmHg)" },
  { value: "Counseling", unit: "-", placeholder: "Counseling / Notes" },
];

export default function StationPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  const [patientId, setPatientId] = useState("");
  const [currentPatient, setCurrentPatient] = useState<PatientRow | null>(null);
  const [testHistory, setTestHistory] = useState<TestRecord[]>([]);
  const [stationSelect, setStationSelect] = useState("");

  const [pendingAutoId, setPendingAutoId] = useState<string | null>(null);
  const autoVerifyHandledRef = useRef(false);

  const [testValue, setTestValue] = useState("");
  const [testValueSys, setTestValueSys] = useState("");
  const [testValueDia, setTestValueDia] = useState("");

  const { value: counselingValue, ref: counselingRef, onChange: onCounselingChange, reset: resetCounseling } = useCounselingField();
  const { value: summaryCounselingValue, ref: summaryCounselingRef, onChange: onSummaryCounselingChange, reset: resetSummaryCounseling } = useCounselingField();

  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState({
    hemoglobin: "", rbg: "", fbs: "", ppbs: "", ogtt: "", hba1c: "",
    heartRate: "", temperature: "", spo2: "", targetWeight: "", fev: "",
    bpSys: "", bpDia: "", counseling: "",
  });

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "station")) {
      Swal.fire({ icon: "error", title: "Access Denied", text: "You must be logged in with Admin or Station role.", confirmButtonText: "OK" })
        .then(() => router.push("/health-screening"));
    } else {
      setAuthorized(true);
    }
  }, [user, router]);

  const loadTestHistory = useCallback(async () => {
    if (!currentPatient) return;
    try {
      const { data, error } = await supabase
        .from("patient_tests")
        .select("*")
        .eq("patient_id", currentPatient.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTestHistory((data as TestRecord[]) || []);
    } catch (err) {
      console.error("Error loading test history:", err);
      setTestHistory([]);
    }
  }, [currentPatient]);

  useEffect(() => {
    if (currentPatient) loadTestHistory();
  }, [currentPatient, loadTestHistory]);

  const verifyPatientId = useCallback(async (idToVerify: string) => {
    const trimmed = idToVerify.trim();
    if (!trimmed) return;

    try {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name, age, gender")
        .eq("id", trimmed)
        .single();

      if (error || !data) {
        Swal.fire("Invalid ID", "No patient found with this ID.", "error");
        return;
      }
      setCurrentPatient(data as PatientRow);
      Swal.fire("Patient Verified", "Patient ID is valid.", "success");
    } catch (err) {
      console.error("Verification error:", err);
      Swal.fire("Error", "Something went wrong verifying the patient.", "error");
    }
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    await verifyPatientId(patientId);
  };

  const handleAutoPatientId = useCallback((id: string) => {
    setPendingAutoId((prev) => prev ?? id);
  }, []);

  useEffect(() => {
    if (authorized && pendingAutoId && !autoVerifyHandledRef.current) {
      autoVerifyHandledRef.current = true;
      setPatientId(pendingAutoId);
      verifyPatientId(pendingAutoId);
    }
  }, [authorized, pendingAutoId, verifyPatientId]);

  const saveTest = async (payload: Record<string, unknown>, showMsg = true): Promise<boolean> => {
    try {
      const { error } = await supabase.from("patient_tests").insert(payload);
      if (error) throw error;
      if (showMsg) Swal.fire("Saved", "Test entry saved successfully", "success");
      return true;
    } catch (err) {
      console.error("Save error:", err);
      if (showMsg) Swal.fire("Error", "Failed to save test entry.", "error");
      return false;
    }
  };

  const normalizeTestType = (t: string) => (t === "Systolic" || t === "Diastolic" || t === "BP" ? "BP" : t);

  const testDisplayName = (t: string) => (t === "BP" ? "Blood Pressure (BP)" : t);

  const getTodayExistingTypes = async (): Promise<Set<string> | null> => {
    if (!currentPatient) return new Set<string>();
    const todayKey = istDateKey(new Date().toISOString());
    if (!todayKey) return new Set<string>();
    const { start, end } = istDayRangeUtc(todayKey);
    try {
      const { data, error } = await supabase
        .from("patient_tests")
        .select("test_type")
        .eq("patient_id", currentPatient.id)
        .gte("created_at", start)
        .lt("created_at", end);
      if (error) throw error;
      return new Set((data as { test_type: string }[] ?? []).map((r) => normalizeTestType(r.test_type)));
    } catch (err) {
      console.error("Error checking today's records:", err);
      return null;
    }
  };

  const assertNoDuplicateToday = async (requestedTypes: string[]): Promise<boolean> => {
    const existing = await getTodayExistingTypes();
    if (existing === null) {
      Swal.fire("Error", "Could not verify today's records. Please try again.", "error");
      return false;
    }
    const blocked = Array.from(new Set(requestedTypes.map(normalizeTestType))).filter((t) => existing.has(t));
    if (blocked.length > 0) {
      Swal.fire(
        "Duplicate Entry",
        `${blocked.map(testDisplayName).join(", ")} already recorded for this patient today. Only one result per test per day is allowed.`,
        "warning"
      );
      return false;
    }
    return true;
  };

  const handleSingleTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return Swal.fire("No Patient", "Verify a patient first", "info");

    const payloads: Record<string, unknown>[] = [];

    if (stationSelect === "BP") {
      if (!testValueSys || !testValueDia) return Swal.fire("Incomplete", "Enter both systolic & diastolic", "warning");
      payloads.push({ patient_id: currentPatient.id, test_type: "Systolic", value_numeric: parseFloat(testValueSys), unit: "mmHg" });
      payloads.push({ patient_id: currentPatient.id, test_type: "Diastolic", value_numeric: parseFloat(testValueDia), unit: "mmHg" });
      payloads.push({ patient_id: currentPatient.id, test_type: "BP", value_text: `${testValueSys}/${testValueDia}`, unit: "mmHg" });
    } else if (stationSelect === "Counseling") {
      if (!counselingValue.trim()) return Swal.fire("Empty", "Please enter notes", "warning");
      payloads.push({ patient_id: currentPatient.id, test_type: "Counseling", value_text: counselingValue.trim(), unit: "-" });
    } else {
      if (!testValue || isNaN(parseFloat(testValue))) return Swal.fire("Invalid", "Enter a valid numeric value", "warning");
      const config = TEST_TYPES.find((t) => t.value === stationSelect);
      payloads.push({ patient_id: currentPatient.id, test_type: stationSelect, value_numeric: parseFloat(testValue), unit: config?.unit || "-" });
    }

    let allOk = true;

    const allowed = await assertNoDuplicateToday(payloads.map((p) => p.test_type as string));
    if (!allowed) return;

    for (const p of payloads) {
      const ok = await saveTest(p, false);
      if (!ok) { allOk = false; break; }
    }

    if (allOk) {
      Swal.fire("Saved", `${stationSelect} saved successfully`, "success");
      setTestValue("");
      setTestValueSys("");
      setTestValueDia("");
      resetCounseling();
      setStationSelect("");
      await loadTestHistory();
    } else {
      Swal.fire("Error", "Failed to save some test entries.", "error");
    }
  };

  const handleDailySummary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPatient) return Swal.fire("No Patient", "Verify a patient first", "info");

    const getVal = (key: string) => summary[key as keyof typeof summary];

    const testsToSave: Record<string, unknown>[] = [];
    const addTest = (type: string, val: string, unit: string) => {
      if (val && !isNaN(parseFloat(val))) testsToSave.push({ patient_id: currentPatient.id, test_type: type, value_numeric: parseFloat(val), unit });
    };

    addTest("Hemoglobin", getVal("hemoglobin"), "g/dL");
    addTest("RBG", getVal("rbg"), "mg/dL");
    addTest("FBS", getVal("fbs"), "mg/dL");
    addTest("PPBS", getVal("ppbs"), "mg/dL");
    addTest("OGTT", getVal("ogtt"), "mg/dL");
    addTest("HbA1c", getVal("hba1c"), "%");
    addTest("Heart Rate", getVal("heartRate"), "/min");
    addTest("Temperature", getVal("temperature"), "°C");
    addTest("SpO2", getVal("spo2"), "%");
    addTest("Target Weight", getVal("targetWeight"), "kg");
    addTest("FEV", getVal("fev"), "L");

    const sys = getVal("bpSys");
    const dia = getVal("bpDia");
    if (sys && dia && !isNaN(parseFloat(sys)) && !isNaN(parseFloat(dia))) {
      testsToSave.push({ patient_id: currentPatient.id, test_type: "Systolic", value_numeric: parseFloat(sys), unit: "mmHg" });
      testsToSave.push({ patient_id: currentPatient.id, test_type: "Diastolic", value_numeric: parseFloat(dia), unit: "mmHg" });
      testsToSave.push({ patient_id: currentPatient.id, test_type: "BP", value_text: `${sys}/${dia}`, unit: "mmHg" });
    }

    const counseling = summaryCounselingValue;
    if (counseling.trim()) {
      testsToSave.push({ patient_id: currentPatient.id, test_type: "Counseling", value_text: counseling.trim(), unit: "-" });
    }

    if (testsToSave.length === 0) {
      Swal.fire("No Data", "Please enter at least one test value.", "info");
      return;
    }

    let allOk = true;

    const allowed = await assertNoDuplicateToday(testsToSave.map((t) => t.test_type as string));
    if (!allowed) return;

    for (const t of testsToSave) {
      const ok = await saveTest(t, false);
      if (!ok) { allOk = false; break; }
    }

    if (allOk) {
      Swal.fire("Success", "All tests saved successfully!", "success");
      setSummary({ hemoglobin: "", rbg: "", fbs: "", ppbs: "", ogtt: "", hba1c: "", heartRate: "", temperature: "", spo2: "", targetWeight: "", fev: "", bpSys: "", bpDia: "", counseling: "" });
      resetSummaryCounseling();
      setShowSummary(false);
      await loadTestHistory();
    } else {
      Swal.fire("Error", "Failed to save daily summary.", "error");
    }
  };

  const handleDeleteRecord = async (recordId: number) => {
    const res = await Swal.fire({
      title: "Delete record?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete",
    });
    if (!res.isConfirmed) return;

    try {
      const { error } = await supabase.from("patient_tests").delete().eq("id", recordId);
      if (error) throw error;
      Swal.fire("Deleted", "Record removed.", "success");
      await loadTestHistory();
    } catch (err) {
      console.error("Delete error:", err);
      Swal.fire("Error", "Failed to delete record.", "error");
    }
  };

  const handleEditRecord = async (recordId: number) => {
    try {
      const { data, error } = await supabase.from("patient_tests").select("*").eq("id", recordId).single();
      if (error || !data) { Swal.fire("Not found", "Record no longer exists.", "info"); await loadTestHistory(); return; }
      const rec = data as TestRecord;

      let html = "";
      let preConfirm: (() => Record<string, unknown> | undefined) | null = null;

      if (rec.test_type === "BP") {
        const parts = (rec.value_text || "").split("/");
        html = `<div class="text-start"><label>Systolic (mmHg)</label><input type="number" id="editSys" class="swal2-input" value="${parts[0]?.trim() || ""}"><label>Diastolic (mmHg)</label><input type="number" id="editDia" class="swal2-input" value="${parts[1]?.trim() || ""}"></div>`;
        preConfirm = () => {
          const s = (document.getElementById("editSys") as HTMLInputElement)?.value;
          const d = (document.getElementById("editDia") as HTMLInputElement)?.value;
          if (!s || !d) { Swal.showValidationMessage("Please enter both systolic and diastolic."); return; }
          return { value_text: `${s}/${d}`, unit: "mmHg" };
        };
      } else if (rec.test_type === "Counseling") {
        html = `<textarea id="editText" class="swal2-textarea">${rec.value_text || ""}</textarea>`;
        preConfirm = () => {
          const t = (document.getElementById("editText") as HTMLTextAreaElement)?.value.trim();
          if (!t) { Swal.showValidationMessage("Please enter notes."); return; }
          const enforced = enforceCounselingLimit(t);
          if (enforced.truncated || enforced.value !== t) {
            Swal.showValidationMessage(COUNSELING_LIMIT_MESSAGE);
            return;
          }
          return { value_text: t, unit: "-" };
        };
      } else {
        html = `<label>Value</label><input type="number" id="editNumeric" class="swal2-input" value="${rec.value_numeric ?? ""}"><label>Unit</label><input type="text" id="editUnit" class="swal2-input" value="${rec.unit || "-"}">`;
        preConfirm = () => {
          const v = (document.getElementById("editNumeric") as HTMLInputElement)?.value;
          const u = (document.getElementById("editUnit") as HTMLInputElement)?.value.trim();
          if (!v || isNaN(parseFloat(v))) { Swal.showValidationMessage("Please enter valid value."); return; }
          return { value_numeric: parseFloat(v), unit: u || "-" };
        };
      }

      const result = await Swal.fire({
        title: `Edit ${rec.test_type}`,
        html,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Save Changes",
        preConfirm: preConfirm || (() => ({})),
      });

      if (!result.isConfirmed || !result.value) return;

      const patchPayload = result.value;
      if (!patchPayload.value_numeric) delete patchPayload.value_numeric;
      if (!patchPayload.value_text) delete patchPayload.value_text;

      const { error: patchError } = await supabase.from("patient_tests").update(patchPayload).eq("id", recordId);
      if (patchError) throw patchError;
      Swal.fire("Updated", "Record updated successfully.", "success");
      await loadTestHistory();
    } catch (err) {
      console.error("Edit error:", err);
      Swal.fire("Error", "Failed to update record.", "error");
    }
  };

  const handleSummaryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setSummary({ ...summary, [e.target.name]: e.target.value });
  };

  const handleStationChange = (value: string) => {
    setStationSelect(value);
    setTestValue("");
    setTestValueSys("");
    setTestValueDia("");
    resetCounseling();
  };

  const handleClear = () => {
    Swal.fire({
      title: "Change Patient?",
      text: "Unsaved data will be lost.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, change",
    }).then((result) => {
      if (result.isConfirmed) {
        setCurrentPatient(null);
        setPatientId("");
        setTestHistory([]);
        setStationSelect("");
        setShowSummary(false);
        resetCounseling();
        resetSummaryCounseling();
      }
    });
  };

  if (!authorized) return null;

  const currentTestConfig = TEST_TYPES.find((t) => t.value === stationSelect);

  return (
    <>
      <HssNavbar activePage="station" />
      <Suspense fallback={null}>
        <AutoVerifyPatientParam onLoaded={handleAutoPatientId} />
      </Suspense>
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="mb-4">Health Screening Test - Station Hub</h2>

          {!currentPatient ? (
            <form onSubmit={handleVerify} className="bg-white p-4 shadow rounded" style={{ maxWidth: 600, margin: "0 auto" }}>
              <h5 className="mb-3">Verify Patient ID</h5>
              <div className="mb-3">
                <label className="form-label">Enter Patient ID:</label>
                <input type="text" className="form-control" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
              </div>
              <button type="submit" className="btn btn-primary">Verify</button>
            </form>
          ) : (
            <div>
              <div className="bg-white p-4 shadow rounded mb-4">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h5><strong>Name:</strong> {currentPatient.name}</h5>
                    <p className="mb-0">Age: {currentPatient.age} | Gender: {currentPatient.gender} | ID: {currentPatient.id}</p>
                  </div>
                  <button className="btn btn-secondary" onClick={handleClear}>Change Patient</button>
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-bold">Select Test Type:</label>
                <select className="form-select" value={stationSelect} onChange={(e) => handleStationChange(e.target.value)}>
                  <option value="">-- Choose Test --</option>
                  {TEST_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.value === "BP" ? "Blood Pressure" : t.value === "Counseling" ? "Patient Counseling" : t.placeholder}</option>
                  ))}
                </select>
              </div>

              {stationSelect && (
                <div className="bg-white p-4 shadow rounded mb-4">
                  <h4>{stationSelect} Test Entry</h4>
                  <form onSubmit={handleSingleTestSubmit}>
                    {stationSelect === "BP" ? (
                      <div className="row g-2">
                        <div className="col-6">
                          <label className="form-label">Systolic (mmHg)</label>
                          <input className="form-control" type="number" min="0" value={testValueSys} onChange={(e) => setTestValueSys(e.target.value)} />
                        </div>
                        <div className="col-6">
                          <label className="form-label">Diastolic (mmHg)</label>
                          <input className="form-control" type="number" min="0" value={testValueDia} onChange={(e) => setTestValueDia(e.target.value)} />
                        </div>
                      </div>
                    ) : stationSelect === "Counseling" ? (
                      <div>
                        <label className="form-label">Notes</label>
                        <textarea className="form-control" rows={3} value={counselingValue} onChange={onCounselingChange} ref={counselingRef} placeholder={currentTestConfig?.placeholder}></textarea>
                        <div className="d-flex justify-content-between">
                          <span className="form-text">Maximum {COUNSELING_MAX_LINES} lines × {COUNSELING_MAX_CHARS} characters per line</span>
                          <span className="form-text">
                            {counselingStatus(counselingValue).lineCount}/{COUNSELING_MAX_LINES} lines · {counselingStatus(counselingValue).currentChars}/{COUNSELING_MAX_CHARS}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="form-label">Value ({currentTestConfig?.unit})</label>
                        <input className="form-control" type="number" step="any" value={testValue} onChange={(e) => setTestValue(e.target.value)} />
                      </div>
                    )}
                    <button type="submit" className="btn btn-success mt-2">Save Test Entry</button>
                  </form>
                </div>
              )}

              <div className="mb-4">
                <button className="btn btn-outline-primary mb-2" type="button" onClick={() => setShowSummary(!showSummary)}>
                  {showSummary ? "− Hide Daily Summary Form" : "+ Show Daily Summary Form"}
                </button>
                {showSummary && (
                  <div className="card card-body shadow-sm">
                    <h4>Daily Summary Form</h4>
                    <form onSubmit={handleDailySummary} className="mt-3">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Hemoglobin (g/dL)</label>
                          <input type="number" step="0.1" className="form-control" name="hemoglobin" value={summary.hemoglobin} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Random Blood Glucose (mg/dL)</label>
                          <input type="number" className="form-control" name="rbg" value={summary.rbg} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Fasting Blood Sugar (mg/dL)</label>
                          <input type="number" className="form-control" name="fbs" value={summary.fbs} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Post-Prandial Blood Sugar (mg/dL)</label>
                          <input type="number" className="form-control" name="ppbs" value={summary.ppbs} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">OGTT (mg/dL)</label>
                          <input type="number" className="form-control" name="ogtt" value={summary.ogtt} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">HbA1c (%)</label>
                          <input type="number" step="0.1" className="form-control" name="hba1c" value={summary.hba1c} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Heart Rate (/min)</label>
                          <input type="number" className="form-control" name="heartRate" value={summary.heartRate} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Body Temperature (°C)</label>
                          <input type="number" step="0.1" className="form-control" name="temperature" value={summary.temperature} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">SpO₂ (%)</label>
                          <input type="number" className="form-control" name="spo2" value={summary.spo2} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">Target Weight (kg)</label>
                          <input type="number" step="0.1" className="form-control" name="targetWeight" value={summary.targetWeight} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label">FEV (Liters)</label>
                          <input type="number" step="0.01" className="form-control" name="fev" value={summary.fev} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Systolic (mmHg)</label>
                          <input type="number" className="form-control" name="bpSys" value={summary.bpSys} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-md-3">
                          <label className="form-label">Diastolic (mmHg)</label>
                          <input type="number" className="form-control" name="bpDia" value={summary.bpDia} onChange={handleSummaryChange} />
                        </div>
                        <div className="col-12">
                          <label className="form-label">Counseling Notes</label>
                          <textarea className="form-control" rows={3} name="counseling" value={summaryCounselingValue} onChange={onSummaryCounselingChange} ref={summaryCounselingRef}></textarea>
                          <div className="d-flex justify-content-between">
                            <span className="form-text">Maximum {COUNSELING_MAX_LINES} lines × {COUNSELING_MAX_CHARS} characters per line</span>
                            <span className="form-text">
                              {counselingStatus(summaryCounselingValue).lineCount}/{COUNSELING_MAX_LINES} lines · {counselingStatus(summaryCounselingValue).currentChars}/{COUNSELING_MAX_CHARS}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button type="submit" className="btn btn-success mt-3">Save Daily Summary</button>
                    </form>
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h5>Previous Test Records</h5>
                <div className="table-responsive">
                  <table className="table table-bordered table-sm align-middle">
                    <thead className="table-light">
                      <tr>
                        <th>Date &amp; Time</th>
                        <th>Test Type</th>
                        <th>Result</th>
                        <th>Unit</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testHistory.length === 0 ? (
                        <tr><td colSpan={5} className="text-center text-muted">No test records found</td></tr>
                      ) : (
                        testHistory.map((t) => (
                          <tr key={t.id}>
                            <td>{formatIST(t.created_at)}</td>
                            <td>{t.test_type}</td>
                            <td>{t.value_numeric ?? t.value_text ?? "-"}</td>
                            <td>{t.unit || "-"}</td>
                            <td className="text-nowrap">
                              <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleEditRecord(t.id)}>Edit</button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteRecord(t.id)}>Delete</button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
