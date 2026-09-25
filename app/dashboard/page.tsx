"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { formatIST } from "@/lib/utils";
import Swal from "sweetalert2";

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  phone: string;
  created_at: string;
}

interface PatientTest {
  patient_id: string;
  test_type: string;
  value_numeric: number | null;
  value_text: string | null;
  created_at: string;
}

interface PatientRow {
  srNo: number;
  id: string;
  name: string;
  age: number | string;
  gender: string;
  phone: string;
  hb: number | string;
  rbg: number | string;
  fbs: number | string;
  ppbs: number | string;
  hba1c: number | string;
  fev: number | string;
  bp: string;
  lastUpdated: string;
}

const formatDate = formatIST;

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [dateFilter, setDateFilter] = useState("all");
  const [testFilter, setTestFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(20);
  const [page, setPage] = useState(1);
  const [allRows, setAllRows] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "registration")) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: "You must be logged in as admin or registration to access this page.",
      }).then(() => router.push("/health-screening"));
    }
  }, [user, router]);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    setPage(1);
    try {
      const { data: patientsList, error: patientsError } = await supabase
        .from("patients")
        .select("id, name, age, gender, phone, created_at")
        .order("created_at", { ascending: false });

      if (patientsError) throw patientsError;

      const list = (patientsList as Patient[]) || [];
      const now = new Date();

      const patientIds = list.map((p) => p.id);

      const testResults = await Promise.all(
        patientIds.map((id) =>
          supabase
            .from("patient_tests")
            .select("patient_id, test_type, value_numeric, value_text, created_at")
            .eq("patient_id", id)
            .order("created_at", { ascending: false })
            .limit(20)
            .then((r) => ({ id, tests: (r.data as PatientTest[]) || [] }))
        )
      );

      const testMap = new Map(testResults.map((r) => [r.id, r.tests]));

      const rows: PatientRow[] = [];
      let srNo = 1;

      for (const p of list) {
        const tests = testMap.get(p.id) || [];

        const filteredTests = tests.filter((t) => {
          const date = new Date(t.created_at);
          if (dateFilter === "today") return date.toDateString() === now.toDateString();
          if (dateFilter === "7days") return date >= new Date(now.getTime() - 7 * 86400000);
          if (dateFilter === "30days") return date >= new Date(now.getTime() - 30 * 86400000);
          return true;
        });

        const latestByType: Record<string, PatientTest> = {};
        filteredTests.forEach((t) => {
          if (!latestByType[t.test_type]) latestByType[t.test_type] = t;
        });

        if (testFilter !== "all" && !latestByType[testFilter]) continue;

        rows.push({
          srNo,
          id: p.id,
          name: p.name || "",
          age: p.age || "",
          gender: p.gender || "",
          phone: p.phone || "",
          hb: latestByType["Hemoglobin"]?.value_numeric ?? "",
          rbg: latestByType["RBG"]?.value_numeric ?? "",
          fbs: latestByType["FBS"]?.value_numeric ?? "",
          ppbs: latestByType["PPBS"]?.value_numeric ?? "",
          hba1c: latestByType["HbA1c"]?.value_numeric ?? "",
          fev: latestByType["FEV"]?.value_numeric ?? "",
          bp: latestByType["BP"]?.value_text ?? "",
          lastUpdated: filteredTests.length ? formatDate(filteredTests[0].created_at) : "—",
        });

        srNo++;
      }

      setAllRows(rows);
    } catch (err) {
      console.error("Error loading:", err);
      Swal.fire("Error", "Failed to load patient data.", "error");
    } finally {
      setLoading(false);
    }
  }, [dateFilter, testFilter]);

  useEffect(() => {
    if (user?.role === "admin" || user?.role === "registration") loadPatients();
  }, [user, loadPatients]);

  const handleSort = (colIndex: number) => {
    if (sortCol === colIndex) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(colIndex);
      setSortAsc(true);
    }
  };

  const sortedPatients = [...allRows].sort((a, b) => {
    if (sortCol === null) return 0;
    const keys: (keyof PatientRow)[] = [
      "srNo", "id", "name", "age", "gender", "phone",
      "hb", "rbg", "fbs", "ppbs", "hba1c", "fev", "bp", "lastUpdated",
    ];
    const key = keys[sortCol];
    const aVal = String(a[key]);
    const bVal = String(b[key]);
    return sortAsc
      ? aVal.localeCompare(bVal, undefined, { numeric: true })
      : bVal.localeCompare(aVal, undefined, { numeric: true });
  });

  const searchLower = search.toLowerCase().trim();
  const filteredPatients = searchLower
    ? sortedPatients.filter(
        (r) =>
          r.name.toLowerCase().includes(searchLower) ||
          r.phone.includes(searchLower) ||
          r.id.toLowerCase().includes(searchLower)
      )
    : sortedPatients;

  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIdx = (safePage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredPatients.length);
  const pageRows = filteredPatients.slice(startIdx, endIdx);

  const headers = [
    "Sr. No.", "Patient ID", "Name", "Age", "Gender", "Phone",
    "Hemoglobin", "RBG", "FBS", "PPBS", "HbA1c", "FEV", "BP (Sys/Dia)", "Last Updated",
  ];

  const downloadCsv = () => {
    if (!allRows.length) {
      Swal.fire("No Data", "No records to download.", "info");
      return;
    }
    let csv = headers.join(",") + "\n";
    allRows.forEach((row) => {
      const keys: (keyof PatientRow)[] = [
        "srNo", "id", "name", "age", "gender", "phone",
        "hb", "rbg", "fbs", "ppbs", "hba1c", "fev", "bp", "lastUpdated",
      ];
      csv += keys.map((k) => `"${row[k]}"`).join(",") + "\n";
    });
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "patient_dashboard.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const arrow = (colIndex: number) => {
    if (sortCol !== colIndex) return "";
    return sortAsc ? " ▲" : " ▼";
  };

  const renderPagination = () => {
    if (filteredPatients.length === 0) return null;

    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push("...");
      for (
        let i = Math.max(2, safePage - 1);
        i <= Math.min(totalPages - 1, safePage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (safePage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }

    return (
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3 mb-4">
        <span className="text-muted">
          Showing {startIdx + 1}–{endIdx} of {filteredPatients.length}
        </span>

        <nav>
          <ul className="pagination mb-0">
            <li className={`page-item ${safePage <= 1 ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage(safePage - 1)}>
                &lsaquo;
              </button>
            </li>
            {pages.map((p, i) =>
              p === "..." ? (
                <li key={`dots-${i}`} className="page-item disabled">
                  <span className="page-link">…</span>
                </li>
              ) : (
                <li key={p} className={`page-item ${p === safePage ? "active" : ""}`}>
                  <button className="page-link" onClick={() => setPage(p)}>
                    {p}
                  </button>
                </li>
              )
            )}
            <li className={`page-item ${safePage >= totalPages ? "disabled" : ""}`}>
              <button className="page-link" onClick={() => setPage(safePage + 1)}>
                &rsaquo;
              </button>
            </li>
          </ul>
        </nav>
      </div>
    );
  };

  if (!user || (user.role !== "admin" && user.role !== "registration")) return null;

  return (
    <>
      <HssNavbar activePage="dashboard" />
      <main className="container" style={{ marginTop: "100px" }}>
        <h2 className="mb-4 text-center">Patient Database</h2>

        <div className="row mb-3">
          <div className="col-md-3">
            <label className="form-label fw-semibold">Search</label>
            <input
              type="text"
              className="form-control"
              placeholder="Name, Phone, or Patient ID"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Filter by Date</label>
            <select
              className="form-select"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            >
              <option value="all">All Records</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Filter by Test Type</label>
            <select
              className="form-select"
              value={testFilter}
              onChange={(e) => setTestFilter(e.target.value)}
            >
              <option value="all">All Tests</option>
              <option value="Hemoglobin">Hemoglobin</option>
              <option value="RBG">RBG</option>
              <option value="FBS">FBS</option>
              <option value="PPBS">PPBS</option>
              <option value="HbA1c">HbA1c</option>
              <option value="FEV">FEV</option>
              <option value="BP">Blood Pressure</option>
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label fw-semibold">Show per page</label>
            <select
              className="form-select"
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="col-md-3 d-flex align-items-end">
            <button className="btn btn-primary w-100" onClick={downloadCsv}>
              Download CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2 text-muted">Loading patient data...</p>
          </div>
        ) : (
          <>
            {renderPagination()}

            <div className="table-responsive">
              <table className="table table-striped table-bordered" id="patientsTable">
                <thead className="table-dark">
                  <tr>
                    {headers.map((h, i) => (
                      <th
                        key={h}
                        style={{ cursor: "pointer" }}
                        onClick={() => handleSort(i)}
                      >
                        {h}
                        <span className="text-secondary" style={{ fontSize: "0.8rem" }}>
                          {arrow(i)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr key={row.id}>
                      <td>{startIdx + pageRows.indexOf(row) + 1}</td>
                      <td>{row.id}</td>
                      <td>{row.name}</td>
                      <td>{row.age}</td>
                      <td>{row.gender}</td>
                      <td>{row.phone}</td>
                      <td>{row.hb}</td>
                      <td>{row.rbg}</td>
                      <td>{row.fbs}</td>
                      <td>{row.ppbs}</td>
                      <td>{row.hba1c}</td>
                      <td>{row.fev}</td>
                      <td>{row.bp}</td>
                      <td>{row.lastUpdated}</td>
                    </tr>
                  ))}
                  {pageRows.length === 0 && (
                    <tr>
                      <td colSpan={14} className="text-center text-muted py-4">
                        No patient records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {renderPagination()}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
