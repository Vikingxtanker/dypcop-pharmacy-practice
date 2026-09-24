"use client";

import { useEffect, useState } from "react";

export default function AutoPrint() {
  const [phase, setPhase] = useState<string>("preparing");

  useEffect(() => {
    const trigger = () => {
      window.setTimeout(() => {
        window.print();
        setPhase("manual");
      }, 300);
    };
    if (document.readyState === "complete") {
      trigger();
    } else {
      window.addEventListener("load", trigger, { once: true });
    }
    return () => window.removeEventListener("load", trigger);
  }, []);

  return (
    <div className="rp-print-bar no-print" role="status">
      <span className="rp-print-bar-text">
        {phase === "preparing" ? "Preparing report..." : "Did the print dialog not open? Use Ctrl+P / Cmd+P."}
      </span>
      <button type="button" className="rp-btn" onClick={() => window.print()}>
        Print Report
      </button>
    </div>
  );
}