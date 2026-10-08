"use client";

import { useState, useRef, useEffect } from "react";
import MainNavbar from "@/components/layout/MainNavbar";
import Footer from "@/components/layout/Footer";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import QRCode from "qrcode";
import { buildCertificateVerifyUrl } from "@/lib/certificates/certificate-2026";

const PARTICIPANTS_TABLE = "participants2026";
const CERTIFICATE_TEMPLATE_URL = "/assets/healthcamp_certificate_2026.pdf";
const FONT_URL = "/assets/fonts/AlexBrush-Regular.ttf";
const PDFJS_WORKER_URL = "/assets/pdf.worker.min.mjs";
const NAME_FONT_SIZE = 36;
const NAME_TEXT_COLOR_RGB = { r: 0, g: 0, b: 0 };
const NAME_Y = 283;
const CERT_ID_TEXT_SIZE = 10;
const CERT_ID_OFFSET_TOP = 40;
const CERT_ID_OFFSET_RIGHT = 60;
const QR_SIZE = 100;
const QR_OFFSET_TOP = 55;
const QR_OFFSET_RIGHT = 60;
const VERIFY_TEXT_SIZE = 9;
const VERIFY_OFFSET_TOP = 160;
const VERIFY_OFFSET_RIGHT = 60;

interface ParticipantRow {
  id: string;
  name: string;
  phone: string | null;
  prefix: string | null;
}

interface SelectedParticipant {
  id: string;
  name: string;
  phone: string | null;
  prefix: string | null;
  displayName: string;
}

export default function Certificate2026Page() {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<SelectedParticipant | null>(null);
  const [results, setResults] = useState<ParticipantRow[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [certReady, setCertReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfBytesRef = useRef<Uint8Array | null>(null);
  const verifiedNameRef = useRef("");
  const certificateIdRef = useRef<string>("");
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const skipSearchRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const latestQueryRef = useRef("");

  const buildDisplayName = (row: ParticipantRow) => `${row.prefix ? row.prefix + " " : ""}${row.name}`.trim();

  const handleClear = () => {
    skipSearchRef.current = false;
    setInputValue("");
    setSearchQuery("");
    setSelectedParticipant(null);
    setResults([]);
    setSearching(false);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setSearchError(null);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const trimmed = value.trim();
    setInputValue(value);
    setSearchQuery(value);
    setSelectedParticipant(null);
    setSearchError(null);
    setHighlightedIndex(-1);
    if (trimmed.length === 0) {
      setResults([]);
      setSearching(false);
      setShowDropdown(false);
    } else {
      setSearching(true);
      setShowDropdown(true);
    }
  };

  const handleSelectParticipant = (row: ParticipantRow) => {
    const displayName = buildDisplayName(row);
    skipSearchRef.current = true;
    setSelectedParticipant({ id: row.id, name: row.name, phone: row.phone, prefix: row.prefix, displayName });
    setInputValue(displayName);
    setSearchQuery(displayName);
    setResults([]);
    setSearching(false);
    setShowDropdown(false);
    setHighlightedIndex(-1);
    setSearchError(null);
  };

  useEffect(() => {
    const trimmed = searchQuery.trim();
    latestQueryRef.current = trimmed;
    if (skipSearchRef.current) {
      skipSearchRef.current = false;
      return;
    }
    if (trimmed.length === 0) return;
    const controller = new AbortController();
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const query = trimmed;
        // PostgREST or= values: quote and escape so , " \ in user input stay literal
        const escaped = query.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const { data, error } = await supabase
          .from(PARTICIPANTS_TABLE)
          .select("id, name, phone, prefix")
          .or(`name.ilike."%${escaped}%",phone.ilike."%${escaped}%"`)
          .limit(10)
          .abortSignal(controller.signal);
        if (controller.signal.aborted) return;
        if (error) throw error;
        const rows = (data as ParticipantRow[]) || [];
        if (latestQueryRef.current === query) {
          setResults(rows);
          setHighlightedIndex(-1);
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError" || controller.signal.aborted) return;
        console.error(err);
        setSearchError("Unable to search participants. Please try again.");
        setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 275);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      controller.abort();
    };
  }, [searchQuery]);

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
    if (!showDropdown && results.length === 0 && !searching) return;
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

      // Overlay Certificate ID + QR + verification text in top-right
      if (certificateId) {
        const qrDataUrl = await QRCode.toDataURL(buildCertificateVerifyUrl(certificateId), {
          width: QR_SIZE * 2, // higher res
          margin: 2,
          errorCorrectionLevel: "M",
          color: { dark: "#000000ff", light: "#ffffffff" },
        });
        const qrBytes = await fetch(qrDataUrl).then((r) => r.arrayBuffer());
        const qrImage = await pdfDoc.embedPng(qrBytes);
        page.drawImage(qrImage, {
          x: pageWidth - QR_OFFSET_RIGHT - qrImage.width,
          y: pageHeight - QR_OFFSET_TOP - qrImage.height,
          width: qrImage.width,
          height: qrImage.height,
        });

        // Certificate ID text
        const certIdText = `Certificate ID: ${certificateId}`;
        const certIdFont = customFont;
        const certIdSize = CERT_ID_TEXT_SIZE;
        const certIdWidth = certIdFont.widthOfTextAtSize(certIdText, certIdSize);
        page.drawText(certIdText, {
          x: pageWidth - CERT_ID_OFFSET_RIGHT - certIdWidth,
          y: pageHeight - CERT_ID_OFFSET_TOP,
          size: certIdSize,
          font: certIdFont,
          color: rgb(0, 0, 0),
        });

        // Verification text
        const verifyText = "Scan QR code to verify";
        const verifySize = VERIFY_TEXT_SIZE;
        const verifyWidth = certIdFont.widthOfTextAtSize(verifyText, verifySize);
        page.drawText(verifyText, {
          x: pageWidth - VERIFY_OFFSET_RIGHT - verifyWidth,
          y: pageHeight - VERIFY_OFFSET_TOP,
          size: verifySize,
          font: certIdFont,
          color: rgb(0, 0, 0),
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
                      if (searchQuery.trim() && results.length > 0) setShowDropdown(true);
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
                  {showDropdown && (searchQuery.trim() || searching || searchError) && (
                    <div
                      className="position-absolute top-100 start-0 end-0 bg-white border rounded shadow-sm mt-1"
                      style={{ maxHeight: "280px", overflowY: "auto", zIndex: 1050 }}
                    >
                      {searching && (
                        <div className="p-3 text-center small text-muted">Searching...</div>
                      )}
                      {!searching && searchError && results.length === 0 && (
                        <div className="p-3 text-center small text-danger">{searchError}</div>
                      )}
                      {!searching && !searchError && results.map((row, idx) => {
                        const dn = buildDisplayName(row);
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
                      {!searching && !searchError && results.length === 0 && searchQuery.trim() && (
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
