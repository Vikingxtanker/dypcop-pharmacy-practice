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
import styles from "./certificate-2026.module.css";

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
  const [downloading, setDownloading] = useState(false);
  const [generatedName, setGeneratedName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pdfBytesRef = useRef<Uint8Array | null>(null);
  const verifiedNameRef = useRef("");
  const certificateIdRef = useRef<string>("");
  const trackedCertificateIdRef = useRef<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);

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

  const liveMessage = useMemo(() => {
    if (certReady) return "Certificate is ready. You can download it.";
    if (selectedParticipant) {
      return `${selectedParticipant.displayName} selected. Choose Verify and Generate to continue.`;
    }
    if (loadState === "loading") return "Loading participants.";
    if (loadState === "error") return "Unable to load participants.";
    if (!inputValue.trim()) return "";
    if (results.length === 0) return "No participants found.";
    return `${results.length} participant${results.length === 1 ? "" : "s"} found.`;
  }, [certReady, selectedParticipant, loadState, inputValue, results.length]);

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

  // When a certificate becomes ready, move attention to the result so the
  // download action is immediately discoverable, without scrolling below it.
  useEffect(() => {
    if (!certReady) return;
    const heading = resultHeadingRef.current;
    const section = resultRef.current;
    if (!section) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading?.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth", block: "start" });
  }, [certReady]);

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
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      await pdfPage.render({ canvas: canvas as HTMLCanvasElement, viewport }).promise;
      setCertReady(true);
      setGeneratedName(verifiedName);
      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Certificate ready",
        showConfirmButton: false,
        timer: 2200,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Could not generate certificate.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Ask the server to record this certificate as downloaded. Kept fire-safe:
  // returns false (and logs) instead of throwing so a tracking failure cannot
  // break the download experience. Skips the request once this exact
  // certificate has already been recorded.
  const trackDownload = async (certificateId: string): Promise<boolean> => {
    if (!certificateId) return false;
    if (trackedCertificateIdRef.current === certificateId) return true;
    try {
      const res = await fetch("/api/certificate-2026/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ certificateId }),
      });
      if (!res.ok) return false;
      trackedCertificateIdRef.current = certificateId;
      return true;
    } catch (error) {
      console.error("certificate-2026 download tracking failed", error);
      return false;
    }
  };

  // Open a larger, focused view of the generated certificate. Reuses the
  // existing SweetAlert2 dialog (already the project's dialog convention)
  // rather than adding a new dependency; the image is the already-rendered
  // preview canvas, so no second PDF is generated.
  const openLarger = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    Swal.fire({
      imageUrl: canvas.toDataURL("image/png"),
      imageAlt: "Health Camp Certificate 2026",
      title: "Certificate preview",
      width: "min(1100px, 92vw)",
      confirmButtonText: "Close",
      confirmButtonColor: "#14532d",
    });
  };

  const handleDownload = async () => {
    if (!pdfBytesRef.current) {
      Swal.fire("Error", "No certificate generated yet.", "warning");
      return;
    }
    if (downloading) return;
    setDownloading(true);
    try {
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

      // The browser download above has been initiated. Record the download
      // server-side; a tracking failure must never block or hide the file the
      // user already received.
      const tracked = await trackDownload(certificateIdRef.current);
      if (tracked) {
        Swal.fire({
          toast: true,
          position: "top-end",
          icon: "success",
          title: "Download started",
          text: "Check your downloads for the PDF.",
          showConfirmButton: false,
          timer: 2600,
          timerProgressBar: true,
        });
      } else {
        Swal.fire({
          icon: "warning",
          title: "Downloaded, but not recorded",
          text: "Your certificate was downloaded, but we couldn't record the download.",
          confirmButtonColor: "#f39c12",
        });
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <MainNavbar />
      <main className={`flex-fill ${styles.page}`}>
        <div className="container">
          <header className={styles.header}>
            <h1 className={styles.title}>Health Camp Certificate 2026</h1>
            <p className={styles.subtitle}>Find your participation certificate and download the original PDF for printing or sharing.</p>
          </header>

          <section className={styles.searchSection} aria-labelledby="hc26-search-title">
            <div className={styles.card}>
              <h2 id="hc26-search-title" className={styles.srOnly}>
                Find your certificate
              </h2>
              <form
                className={styles.form}
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleVerify();
                }}
              >
                <label htmlFor="hc26-participant-search" className={styles.label}>
                  Enter your registered name or phone number
                </label>
                <div ref={dropdownRef} className={styles.searchWrap}>
                  <i className={`bi bi-search ${styles.searchIcon}`} aria-hidden="true" />
                  <input
                    id="hc26-participant-search"
                    ref={inputRef}
                    type="text"
                    role="combobox"
                    aria-expanded={showDropdown && inputValue.trim().length > 0}
                    aria-controls="hc26-participant-listbox"
                    aria-autocomplete="list"
                    aria-activedescendant={highlightedIndex >= 0 ? `hc26-participant-option-${highlightedIndex}` : undefined}
                    className={styles.input}
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => {
                      if (!selectedParticipant && inputValue.trim() && (results.length > 0 || loadState === "loading")) setShowDropdown(true);
                    }}
                    placeholder="Search by name or phone"
                    autoComplete="off"
                  />
                  {inputValue && (
                    <button type="button" aria-label="Clear search" className={styles.clear} onClick={handleClear}>
                      <i className="bi bi-x-lg" aria-hidden="true" />
                    </button>
                  )}
                  {showDropdown && inputValue.trim() && (
                    <div
                      id="hc26-participant-listbox"
                      role="listbox"
                      aria-label="Participant search results"
                      className={styles.dropdown}
                    >
                      {loadState === "loading" && <div className={styles.status}>Searching...</div>}
                      {loadState === "error" && (
                        <div className={`${styles.status} ${styles.statusError}`}>
                          Unable to load participants.
                          <button
                            type="button"
                            className={styles.retry}
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
                            id={`hc26-participant-option-${idx}`}
                            role="option"
                            aria-selected={idx === highlightedIndex}
                            className={`${styles.option} ${idx === highlightedIndex ? styles.optionActive : ""}`}
                            onClick={() => handleSelectParticipant(row)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                          >
                            <span className={styles.optionName}>{dn}</span>
                            {row.phone && <span className={styles.optionMeta}>{row.phone}</span>}
                          </button>
                        );
                      })}
                      {loadState === "ready" && results.length === 0 && (
                        <div className={styles.status}>No participants found</div>
                      )}
                    </div>
                  )}
                </div>

                <button type="submit" className={styles.primaryBtn} disabled={loading}>
                  {loading ? (
                    <>
                      <span className={styles.spinner} aria-hidden="true" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-patch-check" aria-hidden="true" />
                      Verify &amp; Generate
                    </>
                  )}
                </button>
              </form>
              <p className={styles.srOnly} role="status" aria-live="polite">
                {liveMessage}
              </p>
            </div>
          </section>

          <section
            ref={resultRef}
            className={styles.result}
            style={{ display: certReady ? undefined : "none" }}
            aria-labelledby="hc26-result-title"
          >
            <div className={styles.resultHead}>
              <span className={styles.successIcon} aria-hidden="true">
                <i className="bi bi-check-circle-fill" />
              </span>
              <div>
                <h2 id="hc26-result-title" ref={resultHeadingRef} tabIndex={-1} className={styles.resultTitle}>
                  Your certificate is ready
                </h2>
                <p className={styles.resultLead}>Download the original PDF for printing or sharing.</p>
              </div>
            </div>

            <div className={styles.resultGrid}>
              <div className={styles.previewCol}>
                <div className={styles.previewFrame}>
                  <canvas ref={canvasRef} className={styles.canvas} />
                </div>
                <button type="button" className={styles.viewLarger} onClick={openLarger}>
                  <i className="bi bi-arrows-fullscreen" aria-hidden="true" />
                  <span>View certificate larger</span>
                </button>
              </div>

              <aside className={styles.actionPanel} aria-label="Certificate details and download">
                <div className={styles.panelCard}>
                  <span className={styles.panelBadge}>
                    <i className="bi bi-check-circle-fill" aria-hidden="true" /> Ready
                  </span>
                  <p className={styles.panelLabel}>Certificate for</p>
                  <p className={styles.panelName}>{generatedName || selectedParticipant?.displayName || "Participant"}</p>
                  <button
                    type="button"
                    className={styles.downloadBtn}
                    onClick={handleDownload}
                    disabled={downloading}
                  >
                    {downloading ? (
                      <>
                        <span className={styles.spinner} aria-hidden="true" />
                        Preparing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-download" aria-hidden="true" />
                        Download Certificate (PDF)
                      </>
                    )}
                  </button>
                  <p className={styles.hint}>Downloading the PDF preserves the original certificate quality and layout.</p>
                </div>
              </aside>
            </div>
          </section>
        </div>

        {certReady && !showDropdown && (
          <div className={styles.mobileBar} role="region" aria-label="Certificate download">
            <button
              type="button"
              className={styles.mobileBarBtn}
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <span className={styles.spinner} aria-hidden="true" />
                  Preparing...
                </>
              ) : (
                <>
                  <i className="bi bi-download" aria-hidden="true" />
                  Download Certificate
                </>
              )}
            </button>
          </div>
        )}
      </main>
      {certReady && <div className={styles.barSpacer} aria-hidden="true" />}
      <Footer />
    </>
  );
}
