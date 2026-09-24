export interface ReportPdfTarget {
  patientId: string;
  dateKey: string;
}

const DEFAULT_FILENAME = "health-screening-report.pdf";

function filenameFromResponse(response: Response): string {
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  return match?.[1] ? decodeURIComponent(match[1]) : DEFAULT_FILENAME;
}

function triggerDownload(blob: Blob, filename: string): void {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}

/** Downloads a report PDF using an already-minted report token (silent download). */
export async function downloadReportPdfByToken(token: string): Promise<void> {
  const response = await fetch(`/api/report-pdf?token=${encodeURIComponent(token)}`);
  if (!response.ok) {
    throw new Error("Could not generate the report. Please try again.");
  }
  const blob = await response.blob();
  triggerDownload(blob, filenameFromResponse(response));
}

/**
 * Mints a report token, downloads the server-rendered PDF and triggers a silent
 * browser download. No new tab, print dialog or post-click interaction.
 */
export async function downloadHealthScreeningReportPdf(target: ReportPdfTarget): Promise<void> {
  const tokenResponse = await fetch("/api/report-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientId: target.patientId, dateKey: target.dateKey }),
  });
  if (!tokenResponse.ok) {
    throw new Error("Could not prepare the report. Please try again.");
  }

  const { token } = (await tokenResponse.json()) as { token?: string };
  if (!token) {
    throw new Error("Could not prepare the report. Please try again.");
  }

  await downloadReportPdfByToken(token);
}
