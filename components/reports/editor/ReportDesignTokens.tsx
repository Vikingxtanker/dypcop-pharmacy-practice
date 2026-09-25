"use client";

import { useMemo } from "react";
import { EDITOR_DESIGN_TOKENS } from "@/lib/reports/editor-utils";

interface DesignTokensProps {
  values: Record<string, string | null>;
  onChange: (name: string, value: string | null) => void;
  onResetAll: () => void;
}

/** Design-token editor surface. Blank = production default (never emitted). */
export function ReportDesignTokens({ values, onChange, onResetAll }: DesignTokensProps) {
  const grouped = useMemo(() => {
    const set = values;
    return EDITOR_DESIGN_TOKENS.map((token) => ({
      ...token,
      current: set[token.name] ?? "",
      overridden: set[token.name] !== undefined && set[token.name] !== null && set[token.name] !== "",
    }));
  }, [values]);

  return (
    <div className="dyp-ed-tokens">
      {grouped.map((token) => (
        <div key={token.name} className="dyp-ed-token-row">
          <label className="dyp-ed-token-label" htmlFor={`dyp-token-${token.name}`}>
            {token.label}
            <span className="dyp-ed-token-name">{token.name}</span>
          </label>
          <div>
            <input
              id={`dyp-token-${token.name}`}
              value={token.current}
              placeholder={token.defaultValue}
              onChange={(e) => onChange(token.name, e.target.value.trim() ? e.target.value : null)}
              aria-label={`${token.label} override`}
            />
            {token.overridden && <div className="dyp-ed-token-default">default: {token.defaultValue}</div>}
          </div>
        </div>
      ))}
      <div className="dyp-ed-css-actions">
        <button type="button" className="dyp-ed-btn" onClick={onResetAll}>
          Reset tokens
        </button>
      </div>
    </div>
  );
}