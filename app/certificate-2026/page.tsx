"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import MainNavbar from "@/components/layout/MainNavbar";
import Footer from "@/components/layout/Footer";
import { getParticipants2026 } from "@/lib/certificates/participants-2026-client";
import {
  buildParticipantDisplayName,
  filterParticipants2026,
  type Participant2026,
} from "@/lib/certificates/participants-2026-search";
import Swal from "sweetalert2";
import QRCode from "qrcode";
import {
  CERTIFICATE_2026_LAYOUT,
  CERTIFICATE_2026_SCAN_CAPTION_TEXT,
  resolveAlignedX,
  validateCertificate2026Layout,
} from "@/lib/certificates/certificate-2026-layout";

const CERTIFICATE_TEMPLATE_URL = "/assets/healthcamp_certificate_2026.pdf";
const FONT_URL = "/assets/fonts/AlexBrush-Regular.ttf";
const PDFJS_WORKER_URL = "/assets/pdf.worker.min.mjs";
const NAME_FONT_SIZE = 36;
const NAME_TEXT_COLOR_RGB = { r: 0, g: 0, b: 0 };
const NAME_Y = 283;

interface SelectedParticipant {
  id: string;
  name: string;
  phone: string | null;
  prefix: string | null;
  displayName: string;
}

export default function Certificate2026Page() {
  const [inputValue, setInputValue] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<SelectedParticipant | null>(null);
  const [participants, setParticipants] = useState<Participant2026[]>([]);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [reloadToken, setReloadToken] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [certReady, setCertReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfBytesRef = useRef<Uint8Array | null>(null);
  const verifiedNameRef = useRef("");
  const certificateIdRef = useRef<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => filterParticipants2026(participants, inputValue),
    [participants, inputValue],
  );

  const loadParticipants = useCallback(() => {
    let cancelled = false;
    getParticipants2026()
      .then((rows) => {
        if (cancelled) return;
        setParticipants(rows);
        setLoadState("ready");
      })
      .catch((error) => {
        if (cancelled) return;
        console.error(error);
        setLoadState("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => loadParticipants(), [loadParticipants, reloadToken]);

  const handleClear = () => {
    setInputValue("");
    setSelectedParticipant(null);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedParticipant(null);
    setHighlightedIndex(-1);
    setShowDropdown(value.trim().length > 0);
  };

  const handleSelectParticipant = (row: Participant2026) => {
    const displayName = buildParticipantDisplayName(row);
    setSelectedParticipant({ id: row.id, name: row.name, phone: row.phone, prefix: row.prefix, displayName });
    setInputValue(displayName);
    setShowDropdown(false);
    setHighlightedIndex(-1);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown && results.length === 0 && loadState !== "loading") return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      if (!showDropdown) setShowDropdown(true);
      if (e.key === "ArrowDown") {
        const next = highlightedIndex + 1;
        setHighlightedIndex(next < results.length ? next : 0);
      } else {
        const prev = highlightedIndex - 1;
        setHighlightedIndex(prev >= 0 ? prev : results.length - 1);
      }
      return;
    }
    if (e.key === "Enter") {
      if (highlightedIndex >= 0 && highlightedIndex < results.length) {
        e.preventDefault();
        handleSelectParticipant(results[highlightedIndex]);
      }
      return;
    }
    if (e.key === "Escape") {
      setShowDropdown(false);
      setHighlightedIndex(-1);
      return;
    }
  };

  const handleVerify = async () => {
    if (!selectedParticipant) {
      Swal.fire("Input Required", "Please search and select a registered participant.", "warning");
      return;
    }
    setLoading(true);
    Swal.fire({ title: "Verifying...", text: "Please wait...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
    try {
      const pName = selectedParticipant.name ?? "";
      const pPrefix = selectedParticipant.prefix ?? "";
      const verifiedName = `${pPrefix} ${pName}`.trim();
      verifiedNameRef.current = verifiedName;

      // Issue/get certificate from server (server validates participant, generates secure ID)
      const certRes = await fetch("/api/certificate-2026", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId: selectedParticipant.id }),
      });
      if (!certRes.ok) {
        const err = await certRes.json().catch(() => ({}));
        throw new Error(err.error || "Failed to issue certificate");
      }
      const certData = await certRes.json();
      const certificateId = certData?.certificate?.certificate_id || "";
      const verifyUrl = typeof certData?.verifyUrl === "string" ? certData.verifyUrl : "";
      certificateIdRef.current = certificateId;

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
      const pageHeight = page.getHeight();
      const fontSize = NAME_FONT_SIZE;
      const textWidth = customFont.widthOfTextAtSize(verifiedName, fontSize);
      const x = (pageWidth - textWidth) / 2;
      const y = NAME_Y;
      page.drawText(verifiedName, { x, y, size: fontSize, font: customFont, color: rgb(NAME_TEXT_COLOR_RGB.r, NAME_TEXT_COLOR_RGB.g, NAME_TEXT_COLOR_RGB.b) });

      // Overlay Certificate ID + QR + verification text in top-right.
      // All positions/sizes for these three elements come from the central
      // configuration in lib/certificates/certificate-2026-layout.ts.
      if (certificateId && verifyUrl) {
        const layout = CERTIFICATE_2026_LAYOUT;
        validateCertificate2026Layout(layout, { width: pageWidth, height: pageHeight });

        const { qr, scanCaption, certificateId: certIdLayout } = layout;

        const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
          width: Math.round(qr.size * 3), // higher res for smaller display
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#000000ff", light: "#ffffffff" },
        });
        const qrBytes = await fetch(qrDataUrl).then((r) => r.arrayBuffer());
        const qrImage = await pdfDoc.embedPng(qrBytes);
        page.drawImage(qrImage, {
          x: qr.x,
          y: qr.y,
          width: qr.size,
          height: qr.size,
        });

        // Standard font for verification text; participant name keeps its own font
        const captionFont = await pdfDoc.embedFont(scanCaption.fontFamily);
        const captionWidth = captionFont.widthOfTextAtSize(CERTIFICATE_2026_SCAN_CAPTION_TEXT, scanCaption.fontSize);
        page.drawText(CERTIFICATE_2026_SCAN_CAPTION_TEXT, {
          x: resolveAlignedX(scanCaption.x, captionWidth, scanCaption.alignment),
          y: scanCaption.y,
          size: scanCaption.fontSize,
          font: captionFont,
          color: rgb(scanCaption.color.r, scanCaption.color.g, scanCaption.color.b),
        });

        // Certificate ID text (label + dynamic id)
        const certIdText = `${certIdLayout.label} ${certificateId}`;
        const certIdFont = await pdfDoc.embedFont(certIdLayout.fontFamily);
        const certIdWidth = certIdFont.widthOfTextAtSize(certIdText, certIdLayout.fontSize);
        page.drawText(certIdText, {
          x: resolveAlignedX(certIdLayout.x, certIdWidth, certIdLayout.alignment),
          y: certIdLayout.y,
          size: certIdLayout.fontSize,
          font: certIdFont,
          color: rgb(certIdLayout.color.r, certIdLayout.color.g, certIdLayout.color.b),
        });
      }

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
              <div className="bg-white p-4 shadow rounded text-center position-relative">
                <label className="form-label">Enter your registered name or phone number</label>
                <div ref={dropdownRef} className="position-relative">
                  <input
                    ref={inputRef}
                    type="text"
                    className="form-control"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (!selectedParticipant && inputValue.trim() && (results.length > 0 || loadState === "loading")) setShowDropdown(true);
                    }}
                    placeholder="Search participant..."
                    autoComplete="off"
                    style={inputValue ? { paddingRight: "2.25rem" } : undefined}
                  />
                  {inputValue && (
                    <button
                      type="button"
                      aria-label="Clear search"
                      className="btn btn-link position-absolute top-50 end-0 translate-middle-y border-0 text-secondary p-0 me-2"
                      style={{ lineHeight: 1, textDecoration: "none" }}
                      onClick={handleClear}
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  )}
                  {showDropdown && inputValue.trim() && (
                    <div
                      className="position-absolute top-100 start-0 end-0 bg-white border rounded shadow-sm mt-1"
                      style={{ maxHeight: "280px", overflowY: "auto", zIndex: 1050 }}
                    >
                      {loadState === "loading" && (
                        <div className="p-3 text-center small text-muted">Searching...</div>
                      )}
                      {loadState === "error" && (
                        <div className="p-3 text-center small text-danger">
                          Unable to load participants.
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 ms-1 align-baseline"
                            onClick={() => {
                              setLoadState("loading");
                              setReloadToken((token) => token + 1);
                            }}
                          >
                            Retry
                          </button>
                        </div>
                      )}
                      {loadState === "ready" && results.map((row, idx) => {
                        const dn = buildParticipantDisplayName(row);
                        return (
                          <button
                            type="button"
                            key={row.id}
                            className={`w-100 text-start border-0 bg-transparent px-3 py-2 d-flex flex-column ${idx === highlightedIndex ? "bg-light" : ""}`}
                            onClick={() => handleSelectParticipant(row)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                          >
                            <span className="fw-semibold">{dn}</span>
                            {row.phone && <span className="small text-muted">{row.phone}</span>}
                          </button>
                        );
                      })}
                      {loadState === "ready" && results.length === 0 && (
                        <div className="p-3 text-center small text-muted">No participants found</div>
                      )}
                    </div>
                  )}
                </div>
                <button className="btn btn-primary px-4 mt-3" onClick={handleVerify} disabled={loading}>
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
