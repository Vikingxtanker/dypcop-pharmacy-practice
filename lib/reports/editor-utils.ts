/** Screen-pixel ratio used by browsers when resolving CSS mm units (96 dpi). */
export const PX_PER_MM = 96 / 25.4;

/** CSS mm per screen pixel. */
export const MM_PER_PX = 25.4 / 96;

/** A4 portrait sheet dimensions, in mm. */
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;

export const pxToMm = (px: number): number => px * MM_PER_PX;

export const mmToPx = (mm: number): number => mm * PX_PER_MM;

/** Number of A4 portrait pages the given content height (in mm) spans. */
export function computePageCount(contentHeightMm: number): number {
  if (!Number.isFinite(contentHeightMm) || contentHeightMm <= 0) return 1;
  return Math.max(1, Math.ceil(contentHeightMm / A4_HEIGHT_MM));
}

const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5] as const;

export const clampZoom = (value: number): number => {
  if (!Number.isFinite(value)) return 1;
  const nearest = ZOOM_LEVELS.reduce((best, level) =>
    Math.abs(level - value) < Math.abs(best - value) ? level : best,
  );
  return nearest;
};

/**
 * Structural CSS validation: strips comments and url() payloads, then checks
 * string quoting and brace balance, and requires at least one rule. Returns a
 * human-readable problem, or null when the text is structurally valid. It is a
 * lint, not a full parser — unreported syntax bugs surface via the live preview.
 */
export function cssStructuralError(css: string): string | null {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/url\(\s*["']?[\s\S]*?["']?\s*\)/g, "url()");
  let quote: "'" | '"' | null = null;
  let depth = 0;
  let rules = 0;

  for (let i = 0; i < clean.length; i += 1) {
    const ch = clean[i];
    if (quote) {
      if (ch === "\\") i += 1;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "'" || ch === '"') {
      quote = ch;
      continue;
    }
    if (ch === "{") depth += 1;
    if (ch === "}") {
      depth -= 1;
      if (depth === 0) rules += 1;
      if (depth < 0) return "Unbalanced braces: stray closing }";
    }
  }

  if (quote) return "Unterminated string literal";
  if (depth > 0) return `Missing ${depth} closing brace${depth > 1 ? "s" : ""}`;
  if (rules === 0 && clean.trim()) return "No CSS rule found (expected { … } block)";
  return null;
}

function sanitizeCssText(css: string): string {
  return css
    .replace(/<\s*(\/?)(style|script)[^>]*>/gi, "")
    .replace(/</g, "")
    .trim();
}

/**
 * Builds the final override <style> body: an optional :root token block followed
 * by the user's CSS. Only tokens with a non-null value are emitted.
 */
export function buildOverrideSheet(
  cssText: string,
  tokens: Record<string, string | null>,
): string {
  const overridden = Object.entries(tokens).filter(
    (entry): entry is [string, string] => entry[1] !== null && entry[1].trim() !== "",
  );
  const parts: string[] = [];
  if (overridden.length > 0) {
    const lines = overridden.map(([name, value]) => `  ${name}: ${value.trim()};`);
    parts.push(`:root {\n${lines.join("\n")}\n}`);
  }
  const cleaned = sanitizeCssText(cssText);
  if (cleaned) parts.push(cleaned);
  return parts.join("\n\n");
}

/**
 * Curated design tokens surfaced in the editor panel. Values are the production
 * defaults from report.css :root; the editor only emits overrides.
 */
export interface ReportDesignToken {
  name: string;
  label: string;
  defaultValue: string;
}

export const EDITOR_DESIGN_TOKENS: ReportDesignToken[] = [
  { name: "--report-header-height", label: "Header height", defaultValue: "31mm" },
  { name: "--report-header-margin-top", label: "Header top margin", defaultValue: "5mm" },
  { name: "--report-logo-size", label: "Logo size", defaultValue: "26mm" },
  { name: "--report-title-height", label: "Title bar height", defaultValue: "11mm" },
  { name: "--report-title-margin-top", label: "Title top margin", defaultValue: "2.5mm" },
  { name: "--report-title-icon", label: "Title icon size", defaultValue: "5.2mm" },
  { name: "--report-section-gap", label: "Section gap", defaultValue: "4mm" },
  { name: "--report-content-gap", label: "Content gap", defaultValue: "3.5mm" },
  { name: "--report-page-padding-x", label: "Page side padding", defaultValue: "6.3mm" },
  { name: "--report-demo-padding-y", label: "Demographics pad-y", defaultValue: "2.8mm" },
  { name: "--report-demo-padding-x", label: "Demographics pad-x", defaultValue: "5.5mm" },
  { name: "--report-demo-label-width", label: "Demographics label width", defaultValue: "28mm" },
  { name: "--report-demo-column-gap", label: "Demographics column gap", defaultValue: "13mm" },
  { name: "--report-table-cell-pad-y", label: "Table cell pad-y", defaultValue: "2.2mm" },
  { name: "--report-counseling-pad", label: "Counseling padding", defaultValue: "3mm 4.5mm" },
  { name: "--report-footer-height", label: "Footer height", defaultValue: "25mm" },
  { name: "--report-footer-gap-top", label: "Footer top gap", defaultValue: "6mm" },
  { name: "--report-qr-size", label: "QR code size", defaultValue: "18mm" },
  { name: "--report-font-title", label: "Title font size", defaultValue: "16pt" },
  { name: "--report-font-section", label: "Section heading size", defaultValue: "14pt" },
  { name: "--report-font-body", label: "Body font size", defaultValue: "10.5pt" },
  { name: "--report-font-label", label: "Label font size", defaultValue: "10pt" },
  { name: "--report-font-table", label: "Table font size", defaultValue: "10pt" },
  { name: "--report-font-caption", label: "Caption font size", defaultValue: "9pt" },
  { name: "--report-font-footnote", label: "Footnote font size", defaultValue: "8.5pt" },
  { name: "--report-line-body", label: "Body line height", defaultValue: "1.45" },
  { name: "--report-line-table", label: "Table line height", defaultValue: "1.3" },
  { name: "--report-line-counseling", label: "Counseling line height", defaultValue: "1.5" },
  { name: "--report-maroon", label: "Primary maroon", defaultValue: "#741019" },
  { name: "--report-maroon-dark", label: "Dark maroon", defaultValue: "#5c0b12" },
  { name: "--report-maroon-soft", label: "Soft maroon", defaultValue: "#8e2931" },
  { name: "--report-blue", label: "Blue accent", defaultValue: "#244664" },
  { name: "--report-status-normal", label: "Status normal", defaultValue: "#16803c" },
  { name: "--report-status-low", label: "Status low", defaultValue: "#b77900" },
  { name: "--report-status-high", label: "Status high", defaultValue: "#c62828" },
  { name: "--report-status-neutral", label: "Status neutral", defaultValue: "#244664" },
  { name: "--report-border", label: "Border color", defaultValue: "#d8b8b9" },
  { name: "--report-table-border", label: "Table border", defaultValue: "#dac7c8" },
  { name: "--report-table-wrap-border", label: "Table wrap border", defaultValue: "#8f7a7b" },
  { name: "--report-background", label: "Report background", defaultValue: "#fffdfb" },
  { name: "--report-muted", label: "Muted text", defaultValue: "#5f6871" },
  { name: "--report-watermark-opacity", label: "Watermark opacity", defaultValue: "0.055" },
];

export const EDITOR_STORAGE_KEYS = {
  css: "dyp-report-editor:css",
  tokens: "dyp-report-editor:tokens",
  demo: "dyp-report-editor:demo",
  prefs: "dyp-report-editor:prefs",
} as const;

export interface EditorPrefs {
  zoom: number;
  rulers: boolean;
  grid: boolean;
  boundaries: boolean;
}

export const DEFAULT_EDITOR_PREFS: EditorPrefs = {
  zoom: 1,
  rulers: false,
  grid: false,
  boundaries: false,
};

/** Section selectors clickable in the live preview, matching the DOM tree. */
export const REPORT_SECTIONS: ReadonlyArray<{ key: string; label: string; selector: string }> = [
  { key: "sheet", label: "Report", selector: ".rp-sheet" },
  { key: "header", label: "Header", selector: ".rp-header" },
  { key: "title", label: "Title Bar", selector: ".rp-title-strip" },
  { key: "demographics", label: "Demographics", selector: ".rp-demo-box" },
  { key: "lab", label: "Laboratory Results", selector: ".rp-lab-wrap" },
  { key: "counseling", label: "Counseling", selector: ".rp-counseling-box" },
  { key: "footer", label: "Footer", selector: ".rp-footer" },
];

export const SECTION_SELECTOR_LIST = REPORT_SECTIONS.map((s) => s.selector);