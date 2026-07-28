"use client";

import { useState, useEffect } from "react";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import { formatIST } from "@/lib/utils";
import Swal from "sweetalert2";

interface DmAppointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  organization: string;
  appointment_date: string;
  timeslot: string;
  fasting: boolean;
  timestamp: string | null;
}

export default function AdminDmAppointmentsPage() {
  const [password, setPassword] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [appointments, setAppointments] = useState<DmAppointment[]>([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterSlot, setFilterSlot] = useState("");

  const ADMIN_PASSWORD = "admin123";

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setLoggedIn(true);
    } else {
      Swal.fire("Error", "Incorrect password.", "error");
    }
  };

  const loadAppointments = async () => {
    const { data, error } = await supabase
      .from("dm_appointments")
      .select("*")
      .order("timestamp", { ascending: false });

    if (!error && data) {
      setAppointments(data as DmAppointment[]);
    }
  };

  useEffect(() => {
    if (!loggedIn) return;
    loadAppointments();
  }, [loggedIn]);

  const filtered = appointments.filter((a) => {
    if (filterSlot && a.timeslot !== filterSlot) return false;
    if (filterDate && a.appointment_date) {
      const [y, m, d] = filterDate.split("-");
      if (a.appointment_date !== `${d}/${m}/${y}`) return false;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    const result = await Swal.fire({
      icon: "warning",
      title: "Delete Appointment?",
      text: "This cannot be undone!",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
    });
    if (result.isConfirmed) {
      await supabase.from("dm_appointments").delete().eq("id", id);
      Swal.fire("Deleted!", "Appointment removed.", "success");
      loadAppointments();
    }
  };

  const handleEdit = async (id: string) => {
    const { data } = await supabase.from("dm_appointments").select("*").eq("id", id).single();
    if (!data) { Swal.fire("Error", "Not found.", "error"); return; }
    const a = data as DmAppointment;

    const { value: formValues } = await Swal.fire({
      title: "Edit DM Appointment",
      html: `
        <input id="swalName" class="swal2-input" placeholder="Name" value="${a.name || ""}">
        <input id="swalEmail" class="swal2-input" placeholder="Email" value="${a.email || ""}">
        <input id="swalPhone" class="swal2-input" placeholder="Phone" value="${a.phone || ""}">
        <input id="swalOrg" class="swal2-input" placeholder="Organization" value="${a.organization || ""}">
        <input id="swalDate" class="swal2-input" placeholder="DD/MM/YYYY" value="${a.appointment_date || ""}">
        <select id="swalSlot" class="swal2-input">
          <option ${(a.timeslot || "").includes("09:00") ? "selected" : ""}>Morning (09:00 AM - 11:00 AM)</option>
          <option ${(a.timeslot || "").includes("12:30") ? "selected" : ""}>Afternoon (12:30 PM - 3:30 PM)</option>
        </select>
        <div style="text-align:left; padding: 6px 0;">
          <label style="display:flex; gap:8px; align-items:center;">
            <input id="swalFasting" type="checkbox" ${a.fasting ? "checked" : ""}> Fasting
          </label>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => ({
        name: (document.getElementById("swalName") as HTMLInputElement).value.trim(),
        email: (document.getElementById("swalEmail") as HTMLInputElement).value.trim(),
        phone: (document.getElementById("swalPhone") as HTMLInputElement).value.trim(),
        organization: (document.getElementById("swalOrg") as HTMLInputElement).value.trim(),
        appointment_date: (document.getElementById("swalDate") as HTMLInputElement).value.trim(),
        timeslot: (document.getElementById("swalSlot") as HTMLSelectElement).value,
        fasting: (document.getElementById("swalFasting") as HTMLInputElement).checked,
      }),
    });

    if (formValues) {
      await supabase.from("dm_appointments").update({
        name: formValues.name, email: formValues.email, phone: formValues.phone,
        organization: formValues.organization, appointment_date: formValues.appointment_date,
        timeslot: formValues.timeslot, fasting: formValues.fasting,
      }).eq("id", id);
      Swal.fire("Updated!", "Appointment edited.", "success");
      loadAppointments();
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
          <h2 className="text-center fw-bold mb-4">Manage DM Appointments</h2>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label">Filter by Date</label>
              <input type="date" className="form-control" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} />
            </div>
            <div className="col-md-4">
              <label className="form-label">Filter by Slot</label>
              <select className="form-select" value={filterSlot} onChange={(e) => setFilterSlot(e.target.value)}>
                <option value="">All Slots</option>
                <option>Morning (09:00 AM - 11:00 AM)</option>
                <option>Afternoon (12:30 PM - 3:30 PM)</option>
              </select>
            </div>
          </div>
          <div className="bg-white p-4 shadow rounded">
            <table className="table table-bordered table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Organization</th>
                  <th>Date</th>
                  <th>Slot</th>
                  <th>Fasting</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center text-muted">No DM appointments found.</td></tr>
                ) : (
                  filtered.map((a) => (
                    <tr key={a.id}>
                      <td>{a.name}</td>
                      <td>{a.email}</td>
                      <td>{a.phone}</td>
                      <td>{a.organization}</td>
                      <td>{a.appointment_date}</td>
                      <td>{a.timeslot}</td>
                      <td>{a.fasting ? "Yes" : "No"}</td>
                      <td>{formatIST(a.timestamp)}</td>
                      <td>
                        <button className="btn btn-sm btn-warning me-2" onClick={() => handleEdit(a.id)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(a.id)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))
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
