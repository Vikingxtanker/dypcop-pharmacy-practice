"use client";

import { useState } from "react";
import HssNavbar from "@/components/layout/HssNavbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import emailjs from "@emailjs/browser";
import Swal from "sweetalert2";

const APPOINTMENT_DATE = "2026-09-25";
const APPOINTMENT_DATE_LABEL = "25 September 2026";

const normalizePhone = (value: string): string => {
  let digits = value.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  return digits;
};

const isValidIndianMobile = (value: string): boolean =>
  /^[6-9][0-9]{9}$/.test(normalizePhone(value));

const isValidEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(value.trim());

type FormErrors = {
  phone?: string;
  email?: string;
};

export default function AppointmentPage() {
  const [formData, setFormData] = useState({
    name: "",
    timeslot: "",
    phone: "",
    email: "",
    organization: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const validateField = (name: string, value: string): string => {
    if (name === "phone") {
      if (value.trim() === "") return "Phone Number is required.";
      if (!isValidIndianMobile(value)) return "Please enter a valid 10-digit Indian mobile number.";
      return "";
    }
    if (name === "email") {
      if (value.trim() === "") return "Email is required.";
      if (!isValidEmail(value)) return "Please enter a valid email address.";
      return "";
    }
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === "phone" || name === "email") {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "phone" || name === "email") {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, phone, organization, timeslot } = formData;

    const phoneError = validateField("phone", phone);
    const emailError = validateField("email", email);
    setErrors({ phone: phoneError, email: emailError });

    if (!name.trim()) {
      Swal.fire("Error", "Please enter your full name.", "error");
      return;
    }
    if (!organization.trim()) {
      Swal.fire("Error", "Please enter your organization / college.", "error");
      return;
    }
    if (!timeslot) {
      Swal.fire("Error", "Please select a preferred time slot.", "error");
      return;
    }
    if (phoneError || emailError) {
      Swal.fire("Error", "Please fix the highlighted fields before booking.", "error");
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
      const { error } = await supabase.from("appointments").upsert({
        id: name,
        name: name.trim(),
        email: email.trim(),
        phone: normalizePhone(phone),
        organization,
        appointment_date: APPOINTMENT_DATE,
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
          phone: normalizePhone(phone),
          organization,
          appointment_date: APPOINTMENT_DATE,
          timeslot,
        }
      );

      Swal.fire({
        icon: "success",
        title: "Appointment Booked!",
        text: `Your appointment is scheduled for ${APPOINTMENT_DATE_LABEL}. A confirmation email has been sent.`,
      }).then(() => {
        setFormData({ name: "", timeslot: "", phone: "", email: "", organization: "" });
        setErrors({});
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
      <HssNavbar activePage="appointment" publicOnly />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">Book an Appointment</h2>
          <div className="row justify-content-center">
            <div className="col-md-8">
              <form onSubmit={handleSubmit} noValidate className="bg-white p-4 shadow rounded">
                <div className="mb-3">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                    {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className={`form-control ${errors.email ? "is-invalid" : ""}`}
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                    {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                  </div>
                </div>
                <div className="mb-3 mt-3">
                  <label className="form-label">Organization / College</label>
                  <input type="text" className="form-control" name="organization" value={formData.organization} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Appointment Date</label>
                  <input
                    type="text"
                    className="form-control"
                    value={APPOINTMENT_DATE_LABEL}
                    disabled
                    readOnly
                    aria-readonly
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Preferred Time Slot</label>
                  <select className="form-select" name="timeslot" value={formData.timeslot} onChange={handleChange} required>
                    <option value="">Select Time Slot</option>
                    <option>Morning (10 AM - 12 PM)</option>
                    <option>Afternoon (2 PM - 5 PM)</option>
                  </select>
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