"use client";

import { useState, useMemo } from "react";
import { Loader2 } from "lucide-react";
import {
  downloadHealthScreeningReportPdf,
  downloadReportPdfByToken,
  type ReportPdfTarget,
} from "@/lib/reports/report-pdf-download";

interface ReportViewerProps {
  children: React.ReactNode;
  title?: string;
  dev?: boolean;
  onPrint?: () => Promise<void> | void;
  downloadToken?: string;
  downloadTarget?: ReportPdfTarget;
}

const GUIDES_COUNT = 6;

export default function ReportViewer({
  children,
  title,
  dev,
  onPrint,
  downloadToken,
  downloadTarget,
}: ReportViewerProps) {
  const [debug, setDebug] = useState(false);
  const [guides, setGuides] = useState(false);
  const [busy, setBusy] = useState(false);

  const handlePrint = async () => {
    if (busy) return;
    const action =
      onPrint ||
      (downloadToken
        ? () => downloadReportPdfByToken(downloadToken)
        : downloadTarget
          ? () => downloadHealthScreeningReportPdf(downloadTarget)
          : null);
    if (!action) {
      window.print();
      return;
    }
    setBusy(true);
    try {
      await action();
    } catch (error) {
      console.error("Error downloading report:", error);
    } finally {
      setBusy(false);
    }
  };

  const guideOffsets = useMemo(
    () =>
      Array.from({ length: GUIDES_COUNT }, (_, i) => ({
        top:
          i === 0
            ? "var(--report-preview-pad-y)"
            : `calc(var(--report-preview-pad-y) + ${Array(i)
                .fill("var(--report-page-height)")
                .join(" + ")})`,
      })),
    []
  );

  const className = ["rp-browser", debug ? "rp-debug" : "", guides ? "rp-page-guides" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <div className="rp-toolbar">
        <span className="rp-toolbar-title">{title || "Health Screening Report Preview"}</span>
        <div className="rp-toolbar-actions">
          {dev ? (
            <>
              <span className="rp-dev-chip">Dev</span>
              <button
                type="button"
                className={`rp-btn rp-btn-secondary${debug ? " active" : ""}`}
                onClick={() => setDebug((v) => !v)}
              >
                Layout debug
              </button>
              <button
                type="button"
                className={`rp-btn rp-btn-secondary${guides ? " active" : ""}`}
                onClick={() => setGuides((v) => !v)}
              >
                A4 page guides
              </button>
            </>
          ) : null}
          <button
            type="button"
            className="rp-btn"
            onClick={handlePrint}
            disabled={busy}
            aria-busy={busy}
            aria-label={busy ? "Preparing report, please wait" : "Print report"}
          >
            {busy ? (
              <>
                <Loader2 className="rp-print-spinner" aria-hidden="true" />
                Preparing Report...
              </>
            ) : (
              "Print Report"
            )}
          </button>
        </div>
      </div>
      <div className="rp-viewport">
        <div className="rp-preview-shell">
          {guides ? (
            <div className="rp-guides">
              {guideOffsets.map((g, i) => (
                <div key={i} className="rp-guide" style={{ top: g.top }} />
              ))}
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </div>
  );
}