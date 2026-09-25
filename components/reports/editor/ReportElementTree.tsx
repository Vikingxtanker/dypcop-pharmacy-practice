"use client";

import { REPORT_SECTIONS } from "@/lib/reports/editor-utils";

interface ElementTreeProps {
  selectedSelector: string | null;
  onSelect: (selector: string) => void;
}

const PARENT_SECTION = REPORT_SECTIONS[0];

/** Declarative report structure tree; clicking a node selects it in the preview. */
export function ReportElementTree({ selectedSelector, onSelect }: ElementTreeProps) {
  const children = REPORT_SECTIONS.filter((s) => s.key !== PARENT_SECTION.key);

  return (
    <div className="dyp-ed-tree" role="tree" aria-label="Report structure">
      <div
        role="treeitem"
        aria-selected={selectedSelector === PARENT_SECTION.selector}
        className="dyp-ed-tree-item"
        onClick={() => onSelect(PARENT_SECTION.selector)}
      >
        <span className="dyp-ed-tree-kind">section</span>
        <span>{PARENT_SECTION.label}</span>
      </div>
      <div className="dyp-ed-tree-children" role="group">
        {children.map((section) => (
          <div
            key={section.key}
            role="treeitem"
            aria-selected={selectedSelector === section.selector}
            className="dyp-ed-tree-item"
            onClick={() => onSelect(section.selector)}
          >
            <span className="dyp-ed-tree-kind">child</span>
            <span>{section.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}