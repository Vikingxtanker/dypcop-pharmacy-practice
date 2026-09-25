"use client";

import { A4_HEIGHT_MM, A4_WIDTH_MM, PX_PER_MM } from "@/lib/reports/editor-utils";

export const RULER_SIZE = 24;

interface RulerProps {
  widthMm: number;
  heightMm: number;
}

/** Horizontal mm ruler for the top of the preview canvas. */
export function RulerHorizontal({ widthMm, heightMm }: RulerProps) {
  void heightMm;
  const width = widthMm * PX_PER_MM;
  const ticks: { x: number; h: number; major: boolean; label?: string }[] = [];
  const total = Math.ceil(widthMm);
  for (let mm = 0; mm <= total; mm += 1) {
    const major = mm % 25 === 0;
    const medium = mm % 5 === 0;
    const h = major ? 12 : medium ? 7 : 4;
    if (major) {
      ticks.push({ x: mm * PX_PER_MM, h, major: true, label: String(mm) });
    } else {
      ticks.push({ x: mm * PX_PER_MM, h, major: false });
    }
  }
  return (
    <div className="dyp-ed-ruler dyp-ed-ruler-h" style={{ width, height: RULER_SIZE }}>
      <svg width={width} height={RULER_SIZE}>
        {ticks.map((t) => (
          <line
            key={t.x}
            x1={t.x}
            y1={RULER_SIZE - t.h}
            x2={t.x}
            y2={RULER_SIZE}
            className={t.major ? "dyp-ed-ruler-tick-major" : "dyp-ed-ruler-tick"}
          />
        ))}
        {ticks
          .filter((t) => t.major)
          .map((t) => (
            <text
              key={`t${t.x}`}
              x={t.x + 2}
              y={9}
              className="dyp-ed-ruler-text"
            >
              {t.label}
            </text>
          ))}
      </svg>
    </div>
  );
}

/** Vertical mm ruler for the left edge of the preview canvas. */
export function RulerVertical({ widthMm, heightMm }: RulerProps) {
  void widthMm;
  const height = heightMm * PX_PER_MM;
  return (
    <div className="dyp-ed-ruler dyp-ed-ruler-v" style={{ width: RULER_SIZE, height }}>
      <svg width={RULER_SIZE} height={height}>
        {(() => {
          const ticks: { y: number; h: number; major: boolean; label?: string }[] = [];
          const total = Math.ceil(heightMm);
          for (let mm = 0; mm <= total; mm += 1) {
            const major = mm % 25 === 0;
            const medium = mm % 5 === 0;
            const h = major ? 12 : medium ? 7 : 4;
            if (major) {
              ticks.push({ y: mm * PX_PER_MM, h, major: true, label: String(mm) });
            } else {
              ticks.push({ y: mm * PX_PER_MM, h, major: false });
            }
          }
          return ticks.map((t) => (
            <line
              key={t.y}
              x1={RULER_SIZE - t.h}
              y1={t.y}
              x2={RULER_SIZE}
              y2={t.y}
              className={t.major ? "dyp-ed-ruler-tick-major" : "dyp-ed-ruler-tick"}
            />
          ));
        })()}
        {(() => {
          const labels: { y: number; label: string }[] = [];
          for (let mm = 0; mm <= Math.ceil(heightMm); mm += 25) {
            labels.push({ y: mm * PX_PER_MM, label: String(mm) });
          }
          return labels.map((t) => (
            <text key={`v${t.y}`} x={3} y={t.y - 1} className="dyp-ed-ruler-text">
              {t.label}
            </text>
          ));
        })()}
      </svg>
    </div>
  );
}

interface GridProps {
  widthMm: number;
  heightMm: number;
  stepMm?: number;
}

/** Editor-only mm grid drawn over the preview sheet (pointer-events: none). */
export function GridOverlay({ widthMm, heightMm, stepMm = 10 }: GridProps) {
  const width = widthMm * PX_PER_MM;
  const height = heightMm * PX_PER_MM;
  const lines: string[] = [];
  for (let x = 0; x <= widthMm; x += stepMm) lines.push(`M${x * PX_PER_MM},0 V${height}`);
  for (let y = 0; y <= heightMm; y += stepMm) lines.push(`M0,${y * PX_PER_MM} H${width}`);
  return (
    <div className="dyp-ed-grid" style={{ width, height }}>
      <svg width={width} height={height}>
        <path
          d={lines.join(" ")}
          stroke="rgba(0, 100, 200, 0.10)"
          strokeWidth={1}
          fill="none"
        />
      </svg>
    </div>
  );
}

interface PageBoundariesProps {
  contentHeightMm: number;
  widthMm?: number;
}

/** Dashed A4 page-boundary guides with page-number tags (pointer-events: none). */
export function PageBoundaries({ contentHeightMm, widthMm = A4_WIDTH_MM }: PageBoundariesProps) {
  const width = widthMm * PX_PER_MM;
  const count = Math.max(1, Math.ceil(contentHeightMm / A4_HEIGHT_MM));
  const boundaries: { y: number; label: string }[] = [];
  for (let page = 1; page < count; page += 1) {
    boundaries.push({
      y: page * A4_HEIGHT_MM * PX_PER_MM,
      label: `PAGE ${page + 1}`,
    });
  }
  if (boundaries.length === 0) return null;
  return (
    <>
      {boundaries.map((b) => (
        <div key={b.y} className="dyp-ed-boundary" style={{ top: b.y, width }}>
          <span className="dyp-ed-boundary-tag">{b.label}</span>
        </div>
      ))}
    </>
  );
}