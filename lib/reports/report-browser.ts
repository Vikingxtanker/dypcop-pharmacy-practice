import { existsSync } from "node:fs";
import type { Browser } from "puppeteer-core";

function fallbackChromiumPackUrl(): string {
  const arch = process.arch === "arm64" ? "arm64" : "x64";
  return `https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.${arch}.tar`;
}

let cachedExecutablePath: string | null = null;
let pendingExecutablePath: Promise<string> | null = null;

function isServerless(): boolean {
  return Boolean(process.env.VERCEL_ENV || process.env.VERCEL);
}

function resolveChromiumPackUrl(): string {
  const configured = process.env.CHROMIUM_PACK_URL?.trim();
  return configured || fallbackChromiumPackUrl();
}

function resolveLocalExecutablePath(): string | undefined {
  const envPath = process.env.CHROME_EXECUTABLE_PATH || process.env.PUPPETEER_EXECUTABLE_PATH;
  if (envPath) return envPath;
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
          "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
        ]
      : [
          "/usr/bin/google-chrome",
          "/usr/bin/google-chrome-stable",
          "/usr/bin/chromium-browser",
          "/usr/bin/chromium",
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        ];
  for (const candidate of candidates) {
    try {
      if (existsSync(candidate)) return candidate;
    } catch {
      // ignore
    }
  }
  return undefined;
}

async function getServerlessExecutablePath(): Promise<string> {
  if (cachedExecutablePath) return cachedExecutablePath;
  if (!pendingExecutablePath) {
    pendingExecutablePath = (async () => {
      const chromium = (await import("@sparticuz/chromium-min")).default;
      const resolved = await chromium.executablePath(resolveChromiumPackUrl());
      cachedExecutablePath = resolved;
      return resolved;
    })().catch((error) => {
      pendingExecutablePath = null;
      throw error;
    });
  }
  return pendingExecutablePath;
}

async function launchBrowser(): Promise<Browser> {
  if (isServerless()) {
    const chromium = (await import("@sparticuz/chromium-min")).default;
    const puppeteer = await import("puppeteer-core");
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: { width: 1240, height: 1754 },
      executablePath: await getServerlessExecutablePath(),
      headless: "shell",
    });
  }

  const puppeteer = await import("puppeteer");
  return puppeteer.launch({
    headless: true,
    executablePath: resolveLocalExecutablePath(),
  });
}

/** Renders an already-rendered report URL (canonical HTML/CSS) to an A4 PDF buffer. */
export async function renderReportPdf(url: string): Promise<Uint8Array> {
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1240, height: 1754, deviceScaleFactor: 1 });
    await page.goto(url, { waitUntil: "load", timeout: 30000 });

    const reportRendered = await page
      .waitForSelector("main.rp-pdf-shell", { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    if (!reportRendered) {
      throw new Error(`Report page did not render report content: ${url}`);
    }

    await page
      .waitForSelector('html[data-report-ready="true"]', { timeout: 20000 })
      .catch(() => undefined);

    await page.evaluate(async () => {
      try {
        await document.fonts?.ready;
      } catch {
        // ignore
      }
    });

    await page.emulateMediaType("print");

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });

    return new Uint8Array(pdf);
  } finally {
    await browser.close();
  }
}
