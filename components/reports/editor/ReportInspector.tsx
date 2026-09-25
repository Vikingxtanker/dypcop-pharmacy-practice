"use client";

export interface ElementInspectInfo {
  selector: string;
  tagName: string;
  box: { leftMm: number; topMm: number; widthMm: number; heightMm: number };
  styles: Record<string, string>;
}

interface InspectorProps {
  selected: ElementInspectInfo | null;
}

const STYLE_ROWS: { key: string; label: string }[] = [
  { key: "display", label: "display" },
  { key: "position", label: "position" },
  { key: "padding", label: "padding" },
  { key: "margin", label: "margin" },
  { key: "border", label: "border width" },
  { key: "font-size", label: "font size" },
  { key: "line-height", label: "line height" },
  { key: "overflow", label: "overflow" },
  { key: "background-color", label: "background" },
  { key: "color", label: "color" },
];

function formatValue(value: string): string {
  return value && value !== "none" ? value : value || "inherit";
}

export function ReportInspector({ selected }: InspectorProps) {
  if (!selected) {
    return <p className="dyp-ed-empty">Click a report element or use the tree to inspect a section.</p>;
  }
  const { box, styles } = selected;
  const fmt = (mm: number) => `${mm.toFixed(1)} mm`;
  return (
    <div className="dyp-ed-inspector">
      <dl className="dyp-ed-kv">
        <dt>Selector</dt>
        <dd>{selected.selector}</dd>
        <dt>Element</dt>
        <dd>{selected.tagName}</dd>
        <dt>Left</dt>
        <dd>{fmt(box.leftMm)}</dd>
        <dt>Top</dt>
        <dd>{fmt(box.topMm)}</dd>
        <dt>Width</dt>
        <dd>{fmt(box.widthMm)}</dd>
        <dt>Height</dt>
        <dd>{fmt(box.heightMm)}</dd>
      </dl>

      <div className="dyp-ed-section-divider" />

      <dl className="dyp-ed-kv">
        {STYLE_ROWS.map((row) => (
          <div key={row.key} style={{ display: "contents" }}>
            <dt>{row.label}</dt>
            <dd title={row.key === "border" ? "border-top-width" : styles[row.key]}>
              {formatValue(styles[row.key] ?? "")}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}