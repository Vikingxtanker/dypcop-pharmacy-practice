"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import { PatientHealthScreeningReport } from "@/components/reports/PatientHealthScreeningReport";
import type { PatientHealthScreeningReportData } from "@/lib/reports/patient-report-data";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  DEFAULT_EDITOR_PREFS,
  EDITOR_STORAGE_KEYS,
  buildOverrideSheet,
  clampZoom,
  computePageCount,
  cssStructuralError,
  mmToPx,
  pxToMm,
  type EditorPrefs,
} from "@/lib/reports/editor-utils";
import {
  EDITOR_DEMO_SOURCES,
  builtinDemoData,
  createEditorAssets,
  type EditorReportAssets,
  type EditorSession,
} from "@/lib/reports/editor-demo";
import { loadPatientEditorDemo } from "@/lib/reports/editor-demo-load";
import { downloadReportPdfByToken } from "@/lib/reports/report-pdf-download";
import { ReportCssEditor } from "./ReportCssEditor";
import { ReportDesignTokens } from "./ReportDesignTokens";
import { ReportElementTree } from "./ReportElementTree";
import { ReportInspector, type ElementInspectInfo } from "./ReportInspector";
import { GridOverlay, PageBoundaries, RULER_SIZE, RulerHorizontal, RulerVertical } from "./ReportOverlays";
import { SECTION_SELECTOR_LIST } from "@/lib/reports/editor-utils";

interface EditorMetrics {
  wMm: number;
  hMm: number;
  pages: number;
  hOverflow: boolean;
  hOverflowCount: number;
  hOffenders: string[];
}

interface EditorSelection {
  selector: string;
  section: string | null;
}

const DEFAULT_DEMO_ID = "builtin-demo";

const CSS_PLACEHOLDER = [
  "/* Override the report live. Example: */",
  ".rp-header {",
  "  height: 32mm;",
  "}",
].join("\n");

function describeElementSelector(el: HTMLElement, rootEl: HTMLElement): string {
  const parts: string[] = [];
  let node: HTMLElement | null = el;
  while (node && node !== rootEl && parts.length < 8) {
    let part = node.tagName.toLowerCase();
    if (node.id) {
      part = `#${node.id}`;
    } else if (node.classList && node.classList.length > 0) {
      const cls = Array.from(node.classList)
        .filter((c) => !c.startsWith("dyp-ed"))
        .slice(0, 2)
        .join(".");
      if (cls) part = `${part}.${cls}`;
    }
    const parent: HTMLElement | null = node.parentElement;
    if (parent && parent.childElementCount > 1) {
      const index = Array.from(parent.children).indexOf(node) + 1;
      part = `${part}:nth-child(${index})`;
    }
    parts.unshift(part);
    node = parent;
  }
  return parts.join(" > ");
}

function nearestSection(el: HTMLElement): string | null {
  let node: HTMLElement | null = el;
  while (node) {
    for (const selector of SECTION_SELECTOR_LIST) {
      if (node.matches(selector)) return selector;
    }
    if (node.classList.contains("rp-sheet")) break;
    node = node.parentElement;
  }
  return ".rp-sheet";
}

const toast = (icon: "success" | "info" | "warning" | "error", title: string) =>
  Swal.fire({ toast: true, position: "top-end", timer: 3000, showConfirmButton: false, icon, title });

function readStorage(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function ReportEditor() {
  const [demoId, setDemoId] = useState<string>(() => {
    const saved = readStorage(EDITOR_STORAGE_KEYS.demo);
    return saved && EDITOR_DEMO_SOURCES.some((s) => s.id === saved) ? saved : DEFAULT_DEMO_ID;
  });
  const [data, setData] = useState<PatientHealthScreeningReportData | null>(null);
  const [assets, setAssets] = useState<EditorReportAssets | null>(null);
  const [session, setSession] = useState<EditorSession | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [cssText, setCssText] = useState<string>(() => readStorage(EDITOR_STORAGE_KEYS.css) ?? "");
  const [appliedCss, setAppliedCss] = useState("");
  const [tokens, setTokens] = useState<Record<string, string | null>>(() => {
    const raw = readStorage(EDITOR_STORAGE_KEYS.tokens);
    if (!raw) return {};
    try {
      return JSON.parse(raw) as Record<string, string | null>;
    } catch {
      return {};
    }
  });
  const [prefs, setPrefs] = useState<EditorPrefs>(() => {
    const raw = readStorage(EDITOR_STORAGE_KEYS.prefs);
    if (!raw) return DEFAULT_EDITOR_PREFS;
    try {
      return { ...DEFAULT_EDITOR_PREFS, ...(JSON.parse(raw) as Partial<EditorPrefs>) };
    } catch {
      return DEFAULT_EDITOR_PREFS;
    }
  });

  const [selection, setSelection] = useState<EditorSelection | null>(null);
  const [selBox, setSelBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
  const [inspect, setInspect] = useState<ElementInspectInfo | null>(null);
  const [metrics, setMetrics] = useState<EditorMetrics>({
    wMm: A4_WIDTH_MM,
    hMm: A4_HEIGHT_MM,
    pages: 1,
    hOverflow: false,
    hOverflowCount: 0,
    hOffenders: [],
  });

  const sheetWrapRef = useRef<HTMLDivElement>(null);
  const selectionRef = useRef<EditorSelection | null>(null);
  const zoomRef = useRef(prefs.zoom);
  const initRef = useRef(false);

  const runMeasure = useCallback(() => {
    const wrap = sheetWrapRef.current;
    if (!wrap) return;
    const sheet = wrap.querySelector<HTMLElement>(".rp-sheet");
    if (!sheet) return;
    const zoom = zoomRef.current;
    const wMm = pxToMm(sheet.offsetWidth);
    const hMm = pxToMm(sheet.offsetHeight);
    const pages = computePageCount(hMm);
    const sheetRect = sheet.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const tolPx = mmToPx(0.25) * zoom;

    const offenders: string[] = [];
    for (const raw of Array.from(sheet.querySelectorAll("*"))) {
      const el = raw as HTMLElement;
      let clipped = false;
      let parent = el.parentElement;
      while (parent && parent !== sheet) {
        const ox = getComputedStyle(parent).overflowX;
        if (ox === "hidden" || ox === "clip" || ox === "auto" || ox === "scroll") {
          clipped = true;
          break;
        }
        parent = parent.parentElement;
      }
      if (clipped) continue;
      const elRect = el.getBoundingClientRect();
      if (elRect.right - sheetRect.left > sheetRect.width + tolPx) {
        const cls = typeof el.className === "string" && el.className ? el.className : el.tagName.toLowerCase();
        offenders.push(cls);
      }
    }
    setMetrics({
      wMm,
      hMm,
      pages,
      hOverflow: offenders.length > 0,
      hOverflowCount: offenders.length,
      hOffenders: Array.from(new Set(offenders)).slice(0, 4),
    });

    const selected = selectionRef.current;
    if (selected) {
      const target = wrap.querySelector<HTMLElement>(selected.selector);
      if (target) {
        const r = target.getBoundingClientRect();
        setSelBox({
          left: r.left - wrapRect.left,
          top: r.top - wrapRect.top,
          width: r.width,
          height: r.height,
        });
        const cs = getComputedStyle(target);
        const styles: Record<string, string> = {};
        const keys = [
          "display", "position", "padding", "margin", "border-top-width",
          "font-size", "line-height", "overflow", "background-color", "color",
        ];
        for (const key of keys) styles[key] = cs.getPropertyValue(key).trim();
        setInspect({
          selector: selected.selector,
          tagName: target.tagName.toLowerCase(),
          box: {
            leftMm: pxToMm((r.left - sheetRect.left) / zoom),
            topMm: pxToMm((r.top - sheetRect.top) / zoom),
            widthMm: pxToMm(target.offsetWidth),
            heightMm: pxToMm(target.offsetHeight),
          },
          styles,
        });
      } else {
        setSelBox(null);
        setInspect(null);
      }
    } else {
      setSelBox(null);
      setInspect(null);
    }
  }, []);

  useEffect(() => {
    zoomRef.current = prefs.zoom;
    runMeasure();
  }, [prefs.zoom, runMeasure]);

  const loadSource = useCallback(
    async (id: string) => {
      setLoadState("loading");
      setLoadError(null);
      selectionRef.current = null;
      setSelection(null);
      setSelBox(null);
      setInspect(null);
      setSession(null);
      try {
        const source = EDITOR_DEMO_SOURCES.find((s) => s.id === id);
        if (!source) throw new Error("Unknown demo source.");
        let d: PatientHealthScreeningReportData;
        let s: EditorSession | null = null;
        if (source.kind === "builtin") {
          d = builtinDemoData(id);
        } else if (source.patientId) {
          const loadedDemo = await loadPatientEditorDemo(source.patientId);
          d = loadedDemo.data;
          s = loadedDemo.session;
        } else {
          throw new Error("Demo source has no data.");
        }
        const a = await createEditorAssets(d);
        setData(d);
        setAssets(a);
        setSession(s);
        setLoadState("ready");
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : String(err));
        setLoadState("error");
      }
    },
    [],
  );

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    void loadSource(demoId);
  }, [loadSource, demoId]);

  useEffect(() => {
    try {
      window.localStorage.setItem(EDITOR_STORAGE_KEYS.prefs, JSON.stringify(prefs));
    } catch {
      // ignore quota errors
    }
  }, [prefs]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(EDITOR_STORAGE_KEYS.css, cssText);
      } catch {
        // ignore quota errors
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [cssText]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        window.localStorage.setItem(EDITOR_STORAGE_KEYS.tokens, JSON.stringify(tokens));
      } catch {
        // ignore quota errors
      }
    }, 400);
    return () => window.clearTimeout(timer);
  }, [tokens]);

  const onCssChange = useCallback((value: string) => {
    setCssText(value);
  }, []);

  useEffect(() => {
    const error = cssStructuralError(cssText);
    if (error !== null) return;
    const timer = window.setTimeout(() => setAppliedCss(cssText.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [cssText]);

  useEffect(() => {
    window.requestAnimationFrame(runMeasure);
  }, [appliedCss, data, assets, runMeasure]);

  useEffect(() => {
    if (!data) return;
    const first = window.requestAnimationFrame(runMeasure);
    const wrap = sheetWrapRef.current;
    const imgs = wrap ? Array.from(wrap.querySelectorAll("img")) : [];
    let cancelled = false;
    Promise.all(
      imgs.map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => undefined))),
    ).then(() => {
      if (!cancelled) window.requestAnimationFrame(runMeasure);
    });
    const onResize = () => window.requestAnimationFrame(runMeasure);
    window.addEventListener("resize", onResize);
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(first);
      window.removeEventListener("resize", onResize);
    };
  }, [data, assets, runMeasure]);

  const selectElement = useCallback(
    (selector: string, section?: string | null) => {
      const sel: EditorSelection = {
        selector,
        section: section ?? (nearestSection(document.querySelector(selector) as HTMLElement) || ".rp-sheet"),
      };
      selectionRef.current = sel;
      setSelection(sel);
      window.requestAnimationFrame(runMeasure);
    },
    [runMeasure],
  );

  const onCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (loadState !== "ready" || !data) return;
      const target = e.target as HTMLElement;
      const wrap = sheetWrapRef.current;
      const sheet = wrap?.querySelector<HTMLElement>(".rp-sheet");
      if (!sheet || !target || !sheet.contains(target)) return;
      const section = nearestSection(target);
      selectElement(describeElementSelector(target, sheet), section);
    },
    [loadState, data, selectElement],
  );

  const applyNow = useCallback(() => {
    if (cssStructuralError(cssText) !== null) {
      toast("warning", "Fix the CSS first — invalid text is not applied.");
      return;
    }
    setAppliedCss(cssText.trim());
    toast("success", "Overrides applied.");
  }, [cssText]);

  const resetOverrides = useCallback(() => {
    setCssText("");
    setAppliedCss("");
    setTokens({});
    window.requestAnimationFrame(runMeasure);
    toast("info", "Overrides cleared.");
  }, [runMeasure]);

  const saveDesign = useCallback(() => {
    try {
      window.localStorage.setItem(EDITOR_STORAGE_KEYS.css, cssText);
      window.localStorage.setItem(EDITOR_STORAGE_KEYS.tokens, JSON.stringify(tokens));
      window.localStorage.setItem(EDITOR_STORAGE_KEYS.demo, demoId);
      window.localStorage.setItem(EDITOR_STORAGE_KEYS.prefs, JSON.stringify(prefs));
    } catch {
      toast("error", "Could not write to localStorage.");
      return;
    }
    toast("success", "Design saved locally.");
  }, [cssText, tokens, demoId, prefs]);

  const loadSavedDesign = useCallback(() => {
    try {
      const savedCss = window.localStorage.getItem(EDITOR_STORAGE_KEYS.css);
      const savedTokens = window.localStorage.getItem(EDITOR_STORAGE_KEYS.tokens);
      if (savedCss !== null) setCssText(savedCss);
      if (savedTokens) setTokens(JSON.parse(savedTokens));
      toast("success", "Saved design loaded.");
    } catch {
      toast("error", "Nothing saved yet.");
    }
  }, []);

  const resetSavedDesign = useCallback(() => {
    try {
      window.localStorage.removeItem(EDITOR_STORAGE_KEYS.css);
      window.localStorage.removeItem(EDITOR_STORAGE_KEYS.tokens);
      window.localStorage.removeItem(EDITOR_STORAGE_KEYS.demo);
      window.localStorage.removeItem(EDITOR_STORAGE_KEYS.prefs);
    } catch {
      // ignore
    }
    resetOverrides();
    setPrefs(DEFAULT_EDITOR_PREFS);
    toast("info", "Saved design reset.");
  }, [resetOverrides]);

  const exportCssFile = useCallback(() => {
    const body = buildOverrideSheet(cssText, tokens);
    const header = [
      "/* DYP Health Screening Report — Editor Overrides */",
      `/* Generated: ${new Date().toISOString()} */`,
      "/* Preview-only CSS. Production report files are untouched. */",
      "",
    ].join("\n");
    const content = header + (body ? `${body}\n` : "/* (no overrides) */\n");
    const blob = new Blob([content], { type: "text/css;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "report-editor-overrides.css";
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast("success", "Overrides exported as .css");
  }, [cssText, tokens]);

  const copyOverrides = useCallback(() => {
    const body = buildOverrideSheet(cssText, tokens);
    const text = `/* DYP Health Screening Report — Editor Overrides */\n${body || "/* (no overrides) */"}\n`;
    void navigator.clipboard
      .writeText(text)
      .then(() => toast("success", "Overrides copied to clipboard."))
      .catch(() => toast("error", "Could not copy to clipboard."));
  }, [cssText, tokens]);

  const onPdfPreview = useCallback(async () => {
    const source = EDITOR_DEMO_SOURCES.find((s) => s.id === demoId);
    if (!source || source.kind !== "patient" || !source.patientId || !session) {
      toast("info", "PDF preview needs a live patient demo (read-only patients).");
      return;
    }
    try {
      const tokenResponse = await fetch("/api/report-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: source.patientId, dateKey: session.dateKey }),
      });
      if (!tokenResponse.ok) throw new Error("token");
      const { token } = (await tokenResponse.json()) as { token?: string };
      if (!token) throw new Error("token");
      await downloadReportPdfByToken(token);
      toast("success", "PDF generated via production renderer (overrides not applied — production parity).");
    } catch {
      toast("error", "Could not generate the PDF. Try again.");
    }
  }, [demoId, session]);

  const activeSource = EDITOR_DEMO_SOURCES.find((s) => s.id === demoId) ?? EDITOR_DEMO_SOURCES[0];
  const sheetWidth = mmToPx(A4_WIDTH_MM);
  const contentHeightMm = Math.max(metrics ? metrics.hMm : A4_HEIGHT_MM, A4_HEIGHT_MM);
  const scaledW = sheetWidth + RULER_SIZE;
  const scaledH = mmToPx(contentHeightMm) + RULER_SIZE;
  const scaleTransform = `scale(${prefs.zoom})`;
  const cssError = cssText.trim() === "" ? null : cssStructuralError(cssText);
  const cssIsEmpty = !cssText.trim() && Object.values(tokens).every((v) => !v || !v.trim());
  const pdfTooltip = activeSource.kind === "patient"
    ? "Render the current patient/day via the production Puppeteer pipeline."
    : "Static demos have no database record — use a live patient demo to preview the PDF.";

  return (
    <div className="dyp-ed-app">
      <style>{buildOverrideSheet(appliedCss, tokens)}</style>

      <header className="dyp-ed-header">
        <h1>Health Screening Report Editor</h1>
        <span className="dyp-ed-header-sub">Dev-only visual design tool — production files untouched</span>
        <a className="dyp-ed-link" href="/station">
          ← Back to Station
        </a>
        <span className="dyp-ed-role-badge">admin / station</span>
      </header>

      <div className="dyp-ed-toolbar">
        <div className="dyp-ed-tool-group">
          <span className="dyp-ed-label">Demo data</span>
          <select
            className="dyp-ed-select"
            value={demoId}
            onChange={(e) => {
              const next = e.target.value;
              setDemoId(next);
              try {
                window.localStorage.setItem(EDITOR_STORAGE_KEYS.demo, next);
              } catch {
                // ignore
              }
              void loadSource(next);
            }}
          >
            {EDITOR_DEMO_SOURCES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          {session && <span className="dyp-ed-hint">best session: {session.dateKey} · {session.testCount} test types</span>}
        </div>

        <div className="dyp-ed-tool-group">
          <span className="dyp-ed-label">PDF</span>
          <button
            type="button"
            className="dyp-ed-btn dyp-ed-btn-primary"
            onClick={onPdfPreview}
            disabled={activeSource.kind !== "patient" || !session}
            title={pdfTooltip}
          >
            Preview PDF (production render)
          </button>
          {activeSource.kind === "patient" && session && (
            <a
              className="dyp-ed-link"
              title="Open the same patient/day in the existing browser preview"
              href={`/station/report-preview?patientId=${encodeURIComponent(activeSource.patientId || "")}&dateKey=${session.dateKey}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              open raw preview ↗
            </a>
          )}
        </div>

        <div className="dyp-ed-tool-group">
          <span className="dyp-ed-label">Design</span>
          <button type="button" className="dyp-ed-btn" onClick={applyNow} title="Validate and apply the CSS buffer now">
            Apply set
          </button>
          <button type="button" className="dyp-ed-btn" onClick={resetOverrides} title="Clear the CSS buffer and token overrides">
            Reset overrides
          </button>
          <button type="button" className="dyp-ed-btn" onClick={saveDesign} title="Persist the current design to this browser (localStorage)">
            Save Design
          </button>
          <button type="button" className="dyp-ed-btn" onClick={loadSavedDesign} title="Reload the design saved in this browser">
            Load Saved Design
          </button>
          <button type="button" className="dyp-ed-btn" onClick={resetSavedDesign} title="Delete the saved design from this browser">
            Reset Saved Design
          </button>
        </div>

        <div className="dyp-ed-tool-group">
          <span className="dyp-ed-label">Export</span>
          <button type="button" className="dyp-ed-btn" onClick={exportCssFile} title="Download the override sheet as a .css file">
            Export CSS
          </button>
          <button type="button" className="dyp-ed-btn" onClick={copyOverrides} title="Copy the override sheet to the clipboard">
            Copy overrides
          </button>
        </div>

        <div className="dyp-ed-tool-group">
          <span className="dyp-ed-label">Zoom</span>
          {[0.5, 0.75, 1, 1.25, 1.5].map((z) => (
            <button
              key={z}
              type="button"
              className="dyp-ed-toggle"
              aria-pressed={prefs.zoom === z}
              onClick={() => setPrefs((p) => ({ ...p, zoom: clampZoom(z) }))}
            >
              {Math.round(z * 100)}%
            </button>
          ))}
        </div>

        <div className="dyp-ed-tool-group">
          <span className="dyp-ed-label">View</span>
          <button
            type="button"
            className="dyp-ed-toggle"
            aria-pressed={prefs.rulers}
            onClick={() => setPrefs((p) => ({ ...p, rulers: !p.rulers }))}
          >
            Rulers
          </button>
          <button
            type="button"
            className="dyp-ed-toggle"
            aria-pressed={prefs.grid}
            onClick={() => setPrefs((p) => ({ ...p, grid: !p.grid }))}
          >
            Grid
          </button>
          <button
            type="button"
            className="dyp-ed-toggle"
            aria-pressed={prefs.boundaries}
            onClick={() => setPrefs((p) => ({ ...p, boundaries: !p.boundaries }))}
          >
            Page boundaries
          </button>
        </div>
      </div>

      <div className="dyp-ed-body">
        <aside className="dyp-ed-panel dyp-ed-panel-left">
          <div className="dyp-ed-panel-head">CSS Overrides</div>
          <div className="dyp-ed-panel-scroll">
            <ReportCssEditor
              value={cssText}
              onChange={onCssChange}
              valid={cssError === null}
              error={cssError}
              placeholder={CSS_PLACEHOLDER}
            />
            <div className="dyp-ed-section-divider" />
            <div className="dyp-ed-panel-head" style={{ margin: "0 -12px 10px" }}>
              <span>Design Tokens</span>
              {!cssIsEmpty && <span style={{ color: "var(--dyp-ed-ok)" }}>active override</span>}
            </div>
            <ReportDesignTokens
              values={tokens}
              onChange={(name, value) => {
                setTokens((prev) => ({ ...prev, [name]: value }));
                try {
                  const next = { ...tokens, [name]: value };
                  window.localStorage.setItem(EDITOR_STORAGE_KEYS.tokens, JSON.stringify(next));
                } catch {
                  // ignore
                }
              }}
              onResetAll={() => setTokens({})}
            />
          </div>
        </aside>

        <main className="dyp-ed-center">
          <div className="dyp-ed-scroll">
            <div
              className="dyp-ed-canvas-sizer"
              style={{ width: scaledW * prefs.zoom, height: scaledH * prefs.zoom }}
            >
              <div className="dyp-ed-canvas" style={{ width: scaledW, height: scaledH, transform: scaleTransform }}>
              {prefs.rulers && (
                <>
                  <RulerHorizontal widthMm={A4_WIDTH_MM} heightMm={contentHeightMm} />
                  <RulerVertical widthMm={A4_WIDTH_MM} heightMm={contentHeightMm} />
                </>
              )}
              <div
                ref={sheetWrapRef}
                className="dyp-ed-sheet-wrap"
                style={{ left: RULER_SIZE, top: RULER_SIZE, width: sheetWidth }}
                onClick={onCanvasClick}
                title="Click a report element to inspect it"
              >
                {data && assets ? (
                  <>
                    <PatientHealthScreeningReport data={data} assets={assets} />
                    {prefs.grid && (
                      <GridOverlay widthMm={A4_WIDTH_MM} heightMm={contentHeightMm} />
                    )}
                    {prefs.boundaries && (
                      <PageBoundaries contentHeightMm={contentHeightMm} widthMm={A4_WIDTH_MM} />
                    )}
                    {selBox && (
                      <div
                        className="dyp-ed-selection"
                        style={{
                          left: selBox.left,
                          top: selBox.top,
                          width: selBox.width,
                          height: selBox.height,
                        }}
                      >
                        <span className="dyp-ed-selection-tag">{selection?.selector}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="dyp-ed-error" style={{ width: sheetWidth - 4, boxSizing: "border-box" }}>
                    {loadState === "loading" ? (
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                        <span className="dyp-ed-spinner" /> Loading demo data…
                      </span>
                    ) : (
                      <span>{loadError ?? "No report to show."}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>

          <div className="dyp-ed-statusbar">
            <span>A4 {A4_WIDTH_MM} × {A4_HEIGHT_MM} mm</span>
            <span>content {metrics.hMm.toFixed(0)} mm</span>
            <span>
              pages <strong>{metrics.pages}</strong>
            </span>
            {metrics.hOverflow ? (
              <span style={{ color: "var(--dyp-ed-warn)" }}>
                ⚠ {metrics.hOverflowCount} element{metrics.hOverflowCount === 1 ? "" : "s"} overflow horizontally
              </span>
            ) : (
              <span style={{ color: "var(--dyp-ed-ok)" }}>no horizontal overflow</span>
            )}
            {selection && <span>selected: {selection.selector}</span>}
          </div>
        </main>

        <aside className="dyp-ed-panel dyp-ed-panel-right">
          <div className="dyp-ed-panel-head">Report Structure</div>
          <div className="dyp-ed-panel-scroll">
            <ReportElementTree
              selectedSelector={selection ? (selection.section ?? null) : null}
              onSelect={(selector) => selectElement(selector, selector)}
            />
          </div>
          <div className="dyp-ed-section-divider" style={{ margin: 0 }} />
          <div className="dyp-ed-panel-head">Inspector</div>
          <div className="dyp-ed-panel-scroll">
            <ReportInspector selected={inspect} />
          </div>
          <div className="dyp-ed-section-divider" style={{ margin: 0 }} />
          <div className="dyp-ed-panel-head">Diagnostics</div>
          <div className="dyp-ed-panel-scroll">
            <div className="dyp-ed-diagnostics">
              <div className={`dyp-ed-diagnostic ${metrics.hOverflow ? "warn" : "ok"}`}>
                <span>Horizontal overflow</span>
                <span>{metrics.hOverflow ? `${metrics.hOverflowCount} found` : "none"}</span>
              </div>
              <div className={`dyp-ed-diagnostic ${metrics.pages > 1 ? "warn" : "ok"}`}>
                <span>Fits one A4 page</span>
                <span>{metrics.pages > 1 ? `${metrics.pages} pages` : "yes"}</span>
              </div>
              {metrics.pages > 1 && (
                <p className="dyp-ed-hint">Content exceeds one A4 page — the printed report will fragment at the guides.</p>
              )}
              {metrics.hOverflow && (
                <div className="dyp-ed-hint">
                  Offenders:
                  <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
                    {metrics.hOffenders.map((o) => (
                      <li key={o}>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}