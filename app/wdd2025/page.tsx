"use client";

import { useState, useRef } from "react";
import MainNavbar from "@/components/layout/MainNavbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

export default function Wdd2025Page() {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [certReady, setCertReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfBytesRef = useRef<Uint8Array | null>(null);
  const verifiedNameRef = useRef("");

  const logDownload = async (name: string) => {
    try {
      const { error } = await supabase.from("wdd_logger").insert({ name: name || "N/A" });
      return !error;
    } catch (err) {
      console.error("Failed to log:", err);
      return false;
    }
  };

  const handleVerify = async () => {
    if (!inputValue.trim()) {
      Swal.fire("Input Required", "Please enter your registered name or phone number.", "warning");
      return;
    }

    setLoading(true);
    Swal.fire({ title: "Verifying...", text: "Please wait...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const { data, error } = await supabase.from("wdd_participants_2025").select("name, phone, prefix");
      if (error) throw error;

      const inputLower = inputValue.toLowerCase().trim();
      let pName = "";
      let pPrefix = "";
      let matched = false;

      for (const row of data || []) {
        const dbName = row.name?.toLowerCase().trim();
        const dbPhone = row.phone?.trim();
        if (dbName === inputLower || dbPhone === inputValue.trim()) {
          pName = row.name ?? "";
          pPrefix = row.prefix ?? "";
          matched = true;
          break;
        }
      }

      if (!matched) {
        Swal.fire("Not Found", "No participant found.", "error");
        setLoading(false);
        return;
      }

      const verifiedName = `${pPrefix} ${pName}`.trim();
      verifiedNameRef.current = verifiedName;

      const [pdfLibModule, pdfjsLibModule] = await Promise.all([
        import("pdf-lib"),
        import("pdfjs-dist"),
      ]);

      const { PDFDocument, rgb } = pdfLibModule;
      const pdfjsLib = pdfjsLibModule;

      const res = await fetch("/assets/wdd2025_certificate_template.pdf");
      if (!res.ok) throw new Error("Template not found");
      const templateBytes = await res.arrayBuffer();

      const pdfDoc = await PDFDocument.load(templateBytes);
      const fontBytes = await fetch("/assets/fonts/AlexBrush-Regular.ttf").then((r) => r.arrayBuffer());
      const customFont = await pdfDoc.embedFont(fontBytes);

      const page = pdfDoc.getPages()[0];
      const pageWidth = page.getWidth();
      const fontSize = 36;
      const textWidth = customFont.widthOfTextAtSize(verifiedName, fontSize);
      const x = (pageWidth - textWidth) / 2;
      const y = 300;

      page.drawText(verifiedName, { x, y, size: fontSize, font: customFont, color: rgb(0, 0, 0) });

      const generatedPdfBytes = await pdfDoc.save();
      pdfBytesRef.current = generatedPdfBytes;

      const pdf = await pdfjsLib.getDocument({ data: generatedPdfBytes }).promise;
      const pdfPage = await pdf.getPage(1);
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const baseViewport = pdfPage.getViewport({ scale: 1 });
      const cssWidth = Math.min(window.innerWidth * 0.9, 1000);
      const scale = cssWidth / baseViewport.width;
      const viewport = pdfPage.getViewport({ scale: scale * dpr });

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.width = `${viewport.width / dpr}px`;
      canvas.style.height = `${viewport.height / dpr}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      await pdfPage.render({ canvas: canvas as HTMLCanvasElement, viewport }).promise;

      setCertReady(true);
      Swal.fire("Success!", "World Diabetes Day 2025 certificate generated!", "success");
    } catch (err) {
      console.error("Error:", err);
      Swal.fire("Error", "Could not generate certificate.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfBytesRef.current) {
      Swal.fire("Error", "No certificate generated yet.", "warning");
      return;
    }

    const blob = new Blob([new Uint8Array(pdfBytesRef.current)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (verifiedNameRef.current || "Participant").replace(/\s+/g, "_");
    a.href = url;
    a.download = `WDD2025_Certificate_${safeName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    const logged = await logDownload(verifiedNameRef.current);

    if (logged) {
      Swal.fire({ icon: "success", title: "Certificate downloaded!", text: "Please check your downloads.", confirmButtonColor: "#0077c8" });
    } else {
      Swal.fire({ icon: "warning", title: "Downloaded — but logging failed", text: "Certificate downloaded, but we couldn't record the download.", confirmButtonColor: "#f39c12" });
    }
  };

  return (
    <>
      <MainNavbar />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">World Drug Day 2025</h2>
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="bg-white p-4 shadow rounded text-center">
                <h3 className="mb-3">June 26 – International Day Against Drug Abuse</h3>
                <p className="lead">Theme: &quot;The Evidence is Clear: Invest in Prevention.&quot;</p>
                <hr />
                <label className="form-label fw-bold">Enter your registered name or phone number</label>
                <input type="text" className="form-control mb-3" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Name or Phone" />
                <button className="btn btn-primary px-4" onClick={handleVerify} disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Generate"}
                </button>
              </div>
            </div>
          </div>

          {certReady && (
            <div className="text-center mt-4">
              <canvas ref={canvasRef} className="shadow rounded mb-3" style={{ maxWidth: "100%" }} />
              <br />
              <button className="btn btn-success px-4" onClick={handleDownload}>
                <i className="bi bi-download me-2"></i>Download Certificate
              </button>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
