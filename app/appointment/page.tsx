"use client";

import { useState } from "react";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";

export default function AppointmentPage() {
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    timeslot: "",
    phone: "",
    email: "",
    organization: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, organization, timeslot } = formData;

    if (!name || !email || !phone || !organization || !timeslot) {
      Swal.fire("Error", "Please fill in all fields", "error");
      return;
    }

    setLoading(true);
    Swal.fire({
      title: "Please wait...",
      text: "We are booking your appointment.",
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const appointmentDate = "25/09/2025";
      const { error } = await supabase.from("appointments").upsert({
        id: name,
        name,
        email,
        phone,
        organization,
        appointment_date: appointmentDate,
        timeslot,
        timestamp: new Date().toISOString(),
      });

      if (error) throw error;

      await emailjs.send(
        "service_fvowxi8",
        "template_n6j8enq",
        {
          to_name: name,
          to_email: email,
          phone,
          organization,
          appointment_date: appointmentDate,
          timeslot,
        }
      );

      Swal.fire({
        icon: "success",
        title: "Appointment Booked!",
        text: "Your appointment is scheduled for 25 September 2025. A confirmation email has been sent.",
      }).then(() => {
        setFormData({ name: "", date: "", timeslot: "", phone: "", email: "", organization: "", message: "" });
      });
    } catch (error) {
      console.error("Error submitting appointment:", error);
      Swal.fire("Error", "Something went wrong. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <HssNavbar activePage="appointment" />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">Book an Appointment</h2>
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
                  <input type="text" className="form-control" name="organization" value={formData.organization} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Preferred Time Slot</label>
                  <select className="form-select" name="timeslot" value={formData.timeslot} onChange={handleChange} required>
                    <option value="">Select Time Slot</option>
                    <option>Morning (10 AM - 12 PM)</option>
                    <option>Afternoon (2 PM - 5 PM)</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Additional Message</label>
                  <textarea className="form-control" name="message" rows={3} value={formData.message} onChange={handleChange}></textarea>
                </div>
                <div className="text-center">
                  <button type="submit" className="btn btn-primary px-5" disabled={loading}>
                    {loading ? "Booking..." : "Book Appointment"}
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
