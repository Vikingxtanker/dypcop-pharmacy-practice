"use client";

import { useState, useRef } from "react";
import MainNavbar from "@/components/layout/MainNavbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";

const PARTICIPANTS_TABLE = "participants2026";
const CERTIFICATE_TEMPLATE_URL = "/assets/healthcamp_certificate_2026.pdf";
const FONT_URL = "/assets/fonts/AlexBrush-Regular.ttf";
const PDFJS_WORKER_URL = "/assets/pdf.worker.min.mjs";
const NAME_FONT_SIZE = 36;
const NAME_TEXT_COLOR_RGB = { r: 0, g: 0, b: 0 };
const NAME_Y = 283;

export default function Certificate2026Page() {
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [certReady, setCertReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfBytesRef = useRef<Uint8Array | null>(null);
  const verifiedNameRef = useRef("");

  const handleVerify = async () => {
    if (!inputValue.trim()) {
      Swal.fire("Input Required", "Please enter your registered name or phone number.", "warning");
      return;
    }

    setLoading(true);
    Swal.fire({ title: "Verifying...", text: "Please wait...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const { data, error } = await supabase.from(PARTICIPANTS_TABLE).select("name, phone, prefix");
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
        Swal.fire("Not Found", "No participant found with this name or phone number.", "error");
        setLoading(false);
        return;
      }

      const verifiedName = `${pPrefix} ${pName}`.trim();
      verifiedNameRef.current = verifiedName;

      const [pdfLibModule, pdfjsLibModule, fontkitModule] = await Promise.all([
        import("pdf-lib"),
        import("pdfjs-dist"),
        import("@pdf-lib/fontkit"),
      ]);

      const { PDFDocument, rgb } = pdfLibModule;
      const pdfjsLib = pdfjsLibModule;
      const fontkit = fontkitModule.default ?? fontkitModule;
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_URL;

      const res = await fetch(CERTIFICATE_TEMPLATE_URL);
      if (!res.ok) throw new Error("Certificate template not found");
      const templateBytes = await res.arrayBuffer();

      const pdfDoc = await PDFDocument.load(templateBytes);
      pdfDoc.registerFontkit(fontkit);

      const fontBytes = await fetch(FONT_URL).then((r) => r.arrayBuffer());
      const customFont = await pdfDoc.embedFont(fontBytes);

      const page = pdfDoc.getPages()[0];
      const pageWidth = page.getWidth();
      const fontSize = NAME_FONT_SIZE;
      const textWidth = customFont.widthOfTextAtSize(verifiedName, fontSize);
      const x = (pageWidth - textWidth) / 2;
      const y = NAME_Y;

      page.drawText(verifiedName, { x, y, size: fontSize, font: customFont, color: rgb(NAME_TEXT_COLOR_RGB.r, NAME_TEXT_COLOR_RGB.g, NAME_TEXT_COLOR_RGB.b) });

const generatedPdfBytes = await pdfDoc.save();
      pdfBytesRef.current = generatedPdfBytes.slice();

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
      Swal.fire("Success!", "Certificate generated successfully!", "success");
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not generate certificate.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!pdfBytesRef.current) {
      Swal.fire("Error", "No certificate generated yet.", "warning");
      return;
    }

    const blob = new Blob([new Uint8Array(pdfBytesRef.current)], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = verifiedNameRef.current.replace(/\s+/g, "_") || "Participant";
    a.href = url;
    a.download = `HealthCamp2026_Certificate_${safeName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    Swal.fire({ icon: "success", title: "Certificate Downloaded!", text: "Please check your downloads.", confirmButtonColor: "#0077c8" });
  };

  return (
    <>
      <MainNavbar />
      <main className="flex-fill mt-5 pt-5">
        <div className="container py-5">
          <h2 className="text-center fw-bold mb-4">Health Camp Certificate 2026</h2>
          <div className="row justify-content-center">
            <div className="col-md-6">
              <div className="bg-white p-4 shadow rounded text-center">
                <label className="form-label">Enter your registered name or phone number</label>
                <input type="text" className="form-control mb-3" value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder="Name or Phone" />
                <button className="btn btn-primary px-4" onClick={handleVerify} disabled={loading}>
                  {loading ? "Verifying..." : "Verify & Generate"}
                </button>
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <canvas ref={canvasRef} className="shadow rounded mb-3" style={{ maxWidth: "100%", display: certReady ? "block" : "none" }} />
            {certReady && (
              <>
                <br />
                <button className="btn btn-success px-4" onClick={handleDownload}>
                  <i className="bi bi-download me-2"></i>Download Certificate
                </button>
              </>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
