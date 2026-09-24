"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { istDateKey, istDayRangeUtc, formatScreeningDate, formatScreeningDateShort } from "@/lib/utils";
import { downloadHealthScreeningReportPdf } from "@/lib/reports/report-pdf-download";
import Swal from "sweetalert2";

interface PatientRow {
  id: string;
  name: string;
  age: number | string;
  gender: string;
  phone?: string;
  mobile?: string;
  address?: string;
  bmi?: number | string;
  systolic?: number;
  diastolic?: number;
  counseling_points?: string;
  counseling?: string;
}

interface TestRecord {
  test_type: string;
  value_numeric: number | null;
  value_text: string | null;
  unit: string | null;
  created_at: string;
}

interface ScreeningSession {
  dateKey: string;
  testCount: number;
  label: string;
}

const STATION_PAIRED_TYPES = new Set(["Systolic", "Diastolic"]);

const normalizeTestType = (t: string) => (STATION_PAIRED_TYPES.has(t) ? "BP" : t);

const buildSessions = (rows: { created_at: string; test_type: string }[]): ScreeningSession[] => {
  const map = new Map<string, Set<string>>();
  rows.forEach((r) => {
    const key = istDateKey(r.created_at);
    if (!key) return;
    if (!map.has(key)) map.set(key, new Set());
    map.get(key)!.add(normalizeTestType(r.test_type));
  });
  return Array.from(map.entries())
    .map(([dateKey, types]) => ({ dateKey, testCount: types.size, label: formatScreeningDateShort(dateKey) }))
    .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
};

export default function PatientReportPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [sessions, setSessions] = useState<ScreeningSession[]>([]);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, { value: string; raw: TestRecord }>>({});
  const [loading, setLoading] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "documentation" && user.role !== "station")) {
      Swal.fire({ icon: "error", title: "Access Denied", text: "You must be logged in with Admin or Documentation role.", confirmButtonText: "OK" })
        .then(() => router.push("/health-screening"));
    } else {
      setAuthorized(true);
    }
  }, [user, router]);

  const populateLatestTests = (testRecords: TestRecord[], patientRow: PatientRow) => {
    const latest: Record<string, { value: string; raw: TestRecord }> = {};

    const find = (type: string) => testRecords.find((t) => t.test_type === type);

    const hr = find("Heart Rate");
    if (hr) latest.pulseRate = { value: String(hr.value_numeric ?? hr.value_text ?? "N/A"), raw: hr };

    const tmp = find("Temperature");
    if (tmp) latest.temp = { value: String(tmp.value_numeric ?? tmp.value_text ?? "N/A"), raw: tmp };

    const sp = find("SpO2");
    if (sp) latest.spo2 = { value: String(sp.value_numeric ?? sp.value_text ?? "N/A"), raw: sp };

    const h = find("Hemoglobin");
    if (h) latest.hemoglobin = { value: String(h.value_numeric ?? h.value_text ?? "N/A"), raw: h };

    const rbg = find("RBG");
    if (rbg) {
      const v = String(rbg.value_numeric ?? rbg.value_text ?? "N/A");
      latest.rbg = { value: v, raw: rbg };
      latest.rbs = { value: v, raw: rbg };
    }

    const f = find("FBS");
    if (f) latest.fbs = { value: String(f.value_numeric ?? f.value_text ?? "N/A"), raw: f };

    const pp = find("PPBS");
    if (pp) latest.ppbs = { value: String(pp.value_numeric ?? pp.value_text ?? "N/A"), raw: pp };

    const fevRec = find("FEV");
    if (fevRec) latest.fev = { value: String(fevRec.value_numeric ?? fevRec.value_text ?? "N/A"), raw: fevRec };

    const counsel = find("Counseling");
    if (counsel) {
      latest.counselingPoints = { value: String(counsel.value_text ?? counsel.value_numeric ?? "N/A"), raw: counsel };
    } else if (patientRow?.counseling_points || patientRow?.counseling) {
      latest.counselingPoints = { value: patientRow.counseling_points || patientRow.counseling || "N/A", raw: {} as TestRecord };
    }

    const syst = find("Systolic");
    const diast = find("Diastolic");
    if (syst && diast) {
      const sVal = syst.value_numeric ?? syst.value_text;
      const dVal = diast.value_numeric ?? diast.value_text;
      latest.bp = { value: `${sVal ?? "N/A"}/${dVal ?? "N/A"}`, raw: syst };
    } else {
      const bpRec = find("BP");
      if (bpRec) {
        latest.bp = { value: String(bpRec.value_text ?? bpRec.value_numeric ?? "N/A"), raw: bpRec };
      } else if (patientRow?.systolic && patientRow?.diastolic) {
        latest.bp = { value: `${patientRow.systolic}/${patientRow.diastolic}`, raw: {} as TestRecord };
      }
    }

    return latest;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId.trim()) return;

    setLoading(true);
    setError(null);
    setPatient(null);
    setSessions([]);
    setSelectedDateKey(null);
    setTests({});

    try {
      const { data: patientData, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", patientId.trim())
        .single();

      if (patientError || !patientData) {
        Swal.fire("Invalid ID", "No patient found with this ID", "error");
        return;
      }

      const p = patientData as PatientRow;
      setPatient(p);

      try {
        const { data: dateData, error: dateError } = await supabase
          .from("patient_tests")
          .select("test_type, created_at")
          .eq("patient_id", p.id);

        if (dateError) throw dateError;
        setSessions(buildSessions((dateData as { created_at: string; test_type: string }[]) || []));
      } catch {
        setError("Could not load screening records. Please try again.");
      }
    } catch (err) {
      console.error("Error fetching patient:", err);
      Swal.fire("Error", "Could not fetch patient data", "error");
    } finally {
      setLoading(false);
    }
  };

  const loadSessionReport = async (dateKey: string) => {
    if (!patient) return;
    setLoadingReport(true);
    setError(null);
    try {
      const { start, end } = istDayRangeUtc(dateKey);
      const { data: testData, error: testError } = await supabase
        .from("patient_tests")
        .select("*")
        .eq("patient_id", patient.id)
        .gte("created_at", start)
        .lt("created_at", end)
        .order("created_at", { ascending: false });

      if (testError) throw testError;

      const records = (testData as TestRecord[]) || [];
      const latest = populateLatestTests(records, patient);
      setTests(latest);
      setSelectedDateKey(dateKey);
      return latest;
    } catch (err) {
      console.error("Error loading report:", err);
      setError("Could not load the report for this screening date. Please try again.");
      return null;
    } finally {
      setLoadingReport(false);
    }
  };

  const handlePrint = async (dateKey: string) => {
    if (!patient || preparing) return;
    setPreparing(true);
    setError(null);
    try {
      await downloadHealthScreeningReportPdf({ patientId: patient.id, dateKey });
    } catch (err) {
      console.error("Error downloading report:", err);
      Swal.fire("Error", err instanceof Error ? err.message : "Could not download the report. Please try again.", "error");
    } finally {
      setPreparing(false);
    }
  };

  if (!authorized) return null;

  return (
    <>
      <HssNavbar activePage="patient-report" />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5" style={{ maxWidth: 900 }}>
          <h2 className="mb-4">Patient Report</h2>

          <form onSubmit={handleVerify} className="mb-4">
            <div className="mb-3">
              <label className="form-label">Enter Patient ID:</label>
              <input type="text" className="form-control" value={patientId} onChange={(e) => setPatientId(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Loading..." : "Fetch Report"}
            </button>
          </form>

          {patient && (
            <div className="bg-white p-4 shadow rounded mb-4">
              <h3>Patient Details</h3>
              <p><strong>Name:</strong> {patient.name}</p>
              <p><strong>Age:</strong> {patient.age}</p>
              <p><strong>Gender:</strong> {patient.gender}</p>
              <p><strong>Phone:</strong> {patient.phone || patient.mobile || "N/A"}</p>
              <p><strong>Address:</strong> {patient.address || "N/A"}</p>
              <p><strong>Patient ID:</strong> {patient.id}</p>
            </div>
          )}

          {loading && <p className="text-muted text-center">Loading screening records...</p>}

          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {patient && !loading && !error && sessions.length === 0 && (
            <div className="alert alert-info" role="alert">
              No health screening reports available for this patient.
            </div>
          )}

          {patient && sessions.length > 0 && (
            <div className="bg-white p-4 shadow rounded mb-4">
              <h3 className="mb-3">Screening Reports</h3>
              <div className="table-responsive">
                <table className="table table-bordered table-hover align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Sr. No.</th>
                      <th>Screening Date</th>
                      <th>Tests</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s, idx) => (
                      <tr key={s.dateKey} className={selectedDateKey === s.dateKey ? "table-primary" : ""}>
                        <td>{idx + 1}</td>
                        <td>{s.label}</td>
                        <td>{s.testCount} tests</td>
                        <td className="text-nowrap">
                          <button className="btn btn-sm btn-outline-primary me-1" onClick={() => loadSessionReport(s.dateKey)}>
                            View Report
                          </button>
                          <button
                            className="btn btn-sm btn-outline-success rp-print-btn"
                            onClick={() => handlePrint(s.dateKey)}
                            disabled={preparing}
                            aria-busy={preparing}
                            aria-label={preparing ? "Preparing report, please wait" : "Print report"}
                          >
                            {preparing ? (
                              <>
                                <Loader2 className="rp-print-spinner" aria-hidden="true" />
                                Preparing Report...
                              </>
                            ) : (
                              "Print"
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {loadingReport && <p className="text-muted text-center">Loading report...</p>}

              {selectedDateKey && !loadingReport && (
                <div className="border-top mt-3 pt-3">
                  <h4>Health Screening Report</h4>
                  <p><strong>Screening Date:</strong> {formatScreeningDate(selectedDateKey)}</p>

                  <p><strong>BMI:</strong> {patient.bmi ?? "N/A"}</p>
                  <p><strong>Pulse Rate:</strong> {tests.pulseRate?.value || "N/A"}</p>
                  <p><strong>Body Temperature:</strong> {tests.temp?.value || "N/A"}</p>
                  <p><strong>SpO₂:</strong> {tests.spo2?.value || "N/A"}</p>
                  <p><strong>FBS:</strong> {tests.fbs?.value || "N/A"}</p>
                  <p><strong>RBS:</strong> {tests.rbs?.value || tests.rbg?.value || "N/A"}</p>
                  <p><strong>PPBS:</strong> {tests.ppbs?.value || "N/A"}</p>
                  <p><strong>Hemoglobin:</strong> {tests.hemoglobin?.value || "N/A"}</p>
                  <p><strong>Random Blood Glucose:</strong> {tests.rbg?.value || "N/A"}</p>
                  <p><strong>FEV1:</strong> {tests.fev?.value || "N/A"}</p>
                  <p><strong>Blood Pressure:</strong> {tests.bp?.value || "N/A"}</p>
                  <p><strong>Patient Counseling:</strong> {tests.counselingPoints?.value || "N/A"}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}