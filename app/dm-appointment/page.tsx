"use client";

import { useState } from "react";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";

export default function DmAppointmentPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    organization: "",
    timeslot: "",
    fasting: false,
  });
  const [loading, setLoading] = useState(false);

  const handleFastingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFormData((prev) => ({
      ...prev,
      fasting: checked,
      timeslot: checked ? "Morning (09:00 AM - 11:00 AM)" : "",
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, timeslot, fasting } = formData;

    if (!name || !email || !phone || !timeslot) {
      Swal.fire("Error", "Please fill all required fields.", "error");
      return;
    }

    setLoading(true);
    Swal.fire({
      title: "Please wait...",
      text: "Booking your appointment.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const appointmentDate = "14/11/2025";
      const { error } = await supabase.from("dm_appointments").upsert({
        id: name,
        name,
        email,
        phone,
        organization: formData.organization,
        appointment_date: appointmentDate,
        timeslot,
        fasting,
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;

      await emailjs.send(
        "service_fvowxi8",
        "template_dra21lu",
        {
          to_name: name,
          to_email: email,
          appointment_date: appointmentDate,
          timeslot,
          fasting_text: fasting
            ? "Come fasting (no food/drink except water) at 9 AM and return after 2 hours for post-prandial test."
            : "No fasting required.",
        }
      );

      Swal.fire({
        icon: "success",
        title: "Appointment Booked!",
        html: `
          <p>World Diabetes Day – 14 Nov 2025</p>
          <p><strong>Slot:</strong> ${timeslot}</p>
          ${fasting ? "<p>Please arrive fasting at 9 AM and return at 11 AM.</p>" : ""}
        `,
      }).then(() => {
        setFormData({ name: "", phone: "", email: "", organization: "", timeslot: "", fasting: false });
      });
    } catch (err) {
      console.error("Error saving appointment:", err);
      Swal.fire("Error", "Something went wrong. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HssNavbar activePage="dm-appointment" />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">DM Appointment – World Diabetes Day</h2>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <form onSubmit={handleSubmit} className="bg-white p-4 shadow rounded">
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-control" name="phone" value={formData.phone} onChange={handleChange} required />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input type="email" className="form-control" name="email" value={formData.email} onChange={handleChange} required />
                  </div>
                </div>
                <div className="mb-3 mt-3">
                  <label className="form-label">Organization / College</label>
                  <input type="text" className="form-control" name="organization" value={formData.organization} onChange={handleChange} />
                </div>
                <div className="mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="fastingCheckbox" checked={formData.fasting} onChange={handleFastingChange} />
                    <label className="form-check-label" htmlFor="fastingCheckbox">
                      I want Fasting Blood Sugar test (9 AM slot only)
                    </label>
                  </div>
                  {formData.fasting && (
                    <div className="alert alert-info mt-2">
                      Please arrive fasting (no food/drink except water) at 9 AM. Return after 2 hours for post-prandial test.
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label">Preferred Time Slot</label>
                  <select className="form-select" name="timeslot" value={formData.timeslot} onChange={handleChange} required disabled={formData.fasting}>
                    <option value="">Select Time Slot</option>
                    <option>Morning (09:00 AM - 11:00 AM)</option>
                    <option>Afternoon (12:30 PM - 3:30 PM)</option>
                  </select>
                </div>
                <div className="text-center">
                  <button type="submit" className="btn btn-primary px-5" disabled={loading}>
                    {loading ? "Booking..." : "Book DM Appointment"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
