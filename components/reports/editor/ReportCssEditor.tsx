"use client";

import { useRef, useLayoutEffect } from "react";

interface ReportCssEditorProps {
  value: string;
  onChange: (value: string) => void;
  valid: boolean;
  error: string | null;
  placeholder: string;
}

/** Monospace CSS textarea with a synced line-number gutter (no new dependency). */
export function ReportCssEditor({ value, onChange, valid, error, placeholder }: ReportCssEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = value.split("\n").length;

  useLayoutEffect(() => {
    const gutter = gutterRef.current;
    const textarea = textareaRef.current;
    if (!gutter || !textarea) return;
    const sync = () => {
      if (gutter.style.transform !== `translateY(${-textarea.scrollTop}px)`) {
        gutter.style.transform = `translateY(${-textarea.scrollTop}px)`;
      }
    };
    sync();
    textarea.addEventListener("scroll", sync, { passive: true });
    const observer = new ResizeObserver(sync);
    observer.observe(textarea);
    return () => {
      textarea.removeEventListener("scroll", sync);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="dyp-ed-css-wrap">
      <div className="dyp-ed-css-status">
        {valid ? (
          <span className="dyp-ed-badge dyp-ed-badge-ok">Valid CSS</span>
        ) : (
          <span className="dyp-ed-badge dyp-ed-badge-err">Syntax problem</span>
        )}
        <span className="dyp-ed-hint">
          {error
            ? error
            : value.trim()
              ? "Applied live. Invalid edits keep the last valid preview."
              : "Overrides below. They apply on top of report.css."}
        </span>
      </div>

      <div className="dyp-ed-css-editor">
        <div
          ref={gutterRef}
          className="dyp-ed-linenos"
          title="Line numbers"
        >
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i}>{i + 1}</div>
          ))}
        </div>
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          spellCheck={false}
          wrap="off"
          aria-label="CSS overrides"
        />
      </div>
    </div>
  );
}