"use client";

import { useState, useCallback } from "react";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import { formatIST } from "@/lib/utils";
import Swal from "sweetalert2";

const TIME_SLOTS = ["Morning (10 AM - 12 PM)", "Afternoon (2 PM - 5 PM)"];
const STATUS_OPTIONS = ["Pending", "Confirmed", "Cancelled"];
const BASE_FIELDS = "id,name,phone,email,organization,appointment_date,timeslot,timestamp";
const FULL_FIELDS = `${BASE_FIELDS},status`;

interface Appointment {
  id: string;
  name: string;
  phone: string;
  email: string;
  organization: string;
  appointment_date: string;
  timeslot: string;
  timestamp: string | null;
  status: string;
}

type PendingAction = { id: string; action: "edit" | "delete" } | null;

const esc = (value: string): string =>
  value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const statusBadge = (status: string) => {
  const variant =
    status === "Confirmed" ? "success" : status === "Cancelled" ? "danger" : "warning";
  return <span className={`badge text-bg-${variant}`}>{status}</span>;
};

export default function AdminAppointmentsPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterSlot, setFilterSlot] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusAvailable, setStatusAvailable] = useState(true);
  const [pending, setPending] = useState<PendingAction>(null);

  const ADMIN_PASSWORD = "admin123";

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true);
      loadAppointments();
    } else {
      Swal.fire("Error", "Incorrect password.", "error");
    }
  };

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: Appointment[] | null = null;
      let queryError: { message: string } | null = null;

      const result = await supabase
        .from("appointments")
        .select(FULL_FIELDS)
        .order("timestamp", { ascending: false });

      if (result.error && /status.*does not exist/.test(result.error.message)) {
        setStatusAvailable(false);
        const fallback = await supabase
          .from("appointments")
          .select(BASE_FIELDS)
          .order("timestamp", { ascending: false });
        data = (fallback.data ?? []) as Appointment[] | null;
        queryError = fallback.error;
      } else {
        setStatusAvailable(true);
        data = (result.data ?? []) as Appointment[] | null;
        queryError = result.error;
      }

      if (queryError) throw queryError;

      const rows = (data ?? []).map((r) => ({ ...r, status: r.status || "Pending" }));
      setAppointments(rows as Appointment[]);
    } catch (err) {
      console.error("Failed to load appointments:", err);
      setAppointments([]);
      setError("Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  const filtered = appointments.filter((a) => {
    if (filterSlot && a.timeslot !== filterSlot) return false;
    if (filterDate && a.appointment_date !== filterDate) return false;
    return true;
  });

  const handleDelete = async (id: string) => {
    if (pending) return;
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Appointment?",
      text: "This cannot be undone!",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });
    if (!result.isConfirmed) return;

    setPending({ id, action: "delete" });
    try {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
      await loadAppointments();
      Swal.fire("Deleted!", "Appointment has been removed.", "success");
    } catch (err) {
      console.error("Failed to delete appointment:", err);
      Swal.fire("Error", "Unable to delete the appointment. Please try again.", "error");
    } finally {
      setPending(null);
    }
  };

  const handleEdit = async (id: string) => {
    if (pending) return;
    const { data } = await supabase.from("appointments").select("*").eq("id", id).single();
    if (!data) { Swal.fire("Error", "Not found.", "error"); return; }
    const a = data as Appointment;

    const statusHtml = statusAvailable
      ? `
        <label class="swal2-input-label" for="swalStatus">Status</label>
        <select id="swalStatus" class="swal2-input">
          ${STATUS_OPTIONS.map(
            (s) => `<option ${a.status === s ? "selected" : ""}>${s}</option>`
          ).join("")}
        </select>`
      : "";

    const { value: formValues, isDismissed } = await Swal.fire({
      title: "Edit Appointment",
      html: `
        <input id="swalName" class="swal2-input" placeholder="Name" value="${esc(a.name)}">
        <input id="swalPhone" class="swal2-input" placeholder="Phone" value="${esc(a.phone)}">
        <input id="swalEmail" class="swal2-input" placeholder="Email" value="${esc(a.email)}">
        <input id="swalOrg" class="swal2-input" placeholder="Organization" value="${esc(a.organization)}">
        <input id="swalDate" class="swal2-input" placeholder="YYYY-MM-DD" value="${esc(a.appointment_date)}">
        <select id="swalSlot" class="swal2-input">
          ${TIME_SLOTS.map(
            (s) => `<option ${a.timeslot === s ? "selected" : ""}>${s}</option>`
          ).join("")}
        </select>
        ${statusHtml}
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        const name = (document.getElementById("swalName") as HTMLInputElement).value.trim();
        const phone = (document.getElementById("swalPhone") as HTMLInputElement).value.trim();
        const email = (document.getElementById("swalEmail") as HTMLInputElement).value.trim();
        const organization = (document.getElementById("swalOrg") as HTMLInputElement).value.trim();
        const appointment_date = (document.getElementById("swalDate") as HTMLInputElement).value.trim();
        const timeslot = (document.getElementById("swalSlot") as HTMLSelectElement).value;
        const status = statusAvailable
          ? (document.getElementById("swalStatus") as HTMLSelectElement).value
          : a.status;
        if (!name || !email || !organization || !timeslot) {
          Swal.showValidationMessage("Please fill in Name, Email, Organization and Time Slot.");
          return false;
        }
        return { name, phone, email, organization, appointment_date, timeslot, status };
      },
    });

    if (isDismissed || !formValues) return;

    setPending({ id, action: "edit" });
    try {
      const updates: Record<string, string> = {
        name: formValues.name,
        phone: formValues.phone,
        email: formValues.email,
        organization: formValues.organization,
        appointment_date: formValues.appointment_date,
        timeslot: formValues.timeslot,
      };
      if (statusAvailable) updates.status = formValues.status;

      const { error } = await supabase.from("appointments").update(updates).eq("id", id);
      if (error) throw error;
      await loadAppointments();
      Swal.fire("Updated!", "Appointment has been updated.", "success");
    } catch (err) {
      console.error("Failed to update appointment:", err);
      Swal.fire("Error", "Unable to update the appointment. Please try again.", "error");
    } finally {
      setPending(null);
    }
  };

  if (!loggedIn) {
    return (
      <>
        <HssNavbar activePage="dashboard" />
        <main className="flex-fill mt-5 pt-5">
          <div className="container py-5">
            <div className="row justify-content-center">
              <div className="col-md-4">
                <div className="bg-white p-4 shadow rounded">
                  <h4 className="text-center mb-3">Admin Login</h4>
                  <input type="password" className="form-control mb-3" placeholder="Enter admin password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
                  <button className="btn btn-primary w-100" onClick={handleLogin}>Login</button>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <HssNavbar activePage="dashboard" />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">Manage Health Camp Appointments</h2>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">Filter by Date</label>
              <input type="date" className="form-control" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Filter by Slot</label>
              <select className="form-select" value={filterSlot} onChange={(e) => setFilterSlot(e.target.value)}>
                <option value="">All Slots</option>
                {TIME_SLOTS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {!statusAvailable && (
            <div className="alert alert-warning">
              Status tracking is unavailable until the appointment status migration is applied.
            </div>
          )}
          <div className="bg-white p-4 shadow rounded">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Organization</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, r) => (
                    <tr key={r} className="placeholder-glow">
                      {Array.from({ length: 9 }).map((__, c) => (
                        <td key={c}><span className={`placeholder col-${c % 2 === 0 ? 10 : 7}`}></span></td>
                      ))}
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted py-4">
                      <p className="mb-2">{error}</p>
                      <button className="btn btn-outline-primary btn-sm" onClick={loadAppointments}>Retry</button>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-muted py-4">No appointments found.</td></tr>
                ) : (
                  filtered.map((a) => {
                    const rowPending = pending?.id === a.id;
                    return (
                      <tr key={a.id}>
                        <td>{a.name}</td>
                        <td>{a.phone}</td>
                        <td>{a.email}</td>
                        <td>{a.organization}</td>
                        <td>{a.appointment_date}</td>
                        <td>{a.timeslot}</td>
                        <td>{statusBadge(a.status)}</td>
                        <td>{formatIST(a.timestamp)}</td>
                        <td>
                          {rowPending ? (
                            <span className="text-muted">
                              <span className="spinner-border spinner-border-sm me-1"></span>
                              {pending?.action === "edit" ? "Updating..." : "Deleting..."}
                            </span>
                          ) : (
                            <>
                              <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(a.id)}>
                                <i className="bi bi-pencil-square"></i>
                              </button>
                              <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>
                                <i className="bi bi-trash"></i>
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}