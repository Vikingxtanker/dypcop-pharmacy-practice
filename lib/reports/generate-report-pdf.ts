import { chromium } from "playwright-core";

const HEADER_TEMPLATE = "<div></div>";

const FOOTER_TEMPLATE = [
  '<div style="width:100%;box-sizing:border-box;font-family:\'Segoe UI\',Arial,sans-serif;font-size:8px;color:#741019;text-align:center;padding:0 10mm;">',
  "Dr. D. Y. Patil College of Pharmacy, Akurdi, Pune",
  " &nbsp;&middot;&nbsp; Page ",
  '<span class="pageNumber"></span>',
  " of ",
  '<span class="totalPages"></span>',
  "</div>",
].join("");

async function launchChromium() {
  const channels: Array<"msedge" | "chrome" | undefined> = ["msedge", "chrome", undefined];
  let lastError: unknown;
  for (const channel of channels) {
    try {
      return await chromium.launch({ channel });
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Could not launch a Chromium browser for PDF generation");
}

export async function generateHealthReportPdfFromUrl(url: string): Promise<Buffer> {
  let browser;
  try {
    browser = await launchChromium();
    const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
    await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
    const rendered = await page.locator(".rp-pdf-shell").count();
    if (rendered === 0) {
      throw new Error("Report page did not render a report shell");
    }
    const pdfBytes = await page.pdf({
      format: "A4",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: HEADER_TEMPLATE,
      footerTemplate: FOOTER_TEMPLATE,
      margin: { top: "0", bottom: "9mm", left: "0", right: "0" },
    });
    return Buffer.from(pdfBytes);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}