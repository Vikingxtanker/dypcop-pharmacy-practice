"use client";

import { useEffect } from "react";

/**
 * Marks the document as ready for headless PDF rendering once fonts and images
 * have settled. The server-side renderer waits for this signal before printing.
 */
export default function ReportReadySignal() {
  useEffect(() => {
    let cancelled = false;

    const markReady = () => {
      if (!cancelled) {
        document.documentElement.setAttribute("data-report-ready", "true");
      }
    };

    const waitForImages = () =>
      Promise.all(
        Array.from(document.images).map(
          (image) =>
            new Promise<void>((resolve) => {
              if (image.complete) {
                resolve();
                return;
              }
              image.addEventListener("load", () => resolve(), { once: true });
              image.addEventListener("error", () => resolve(), { once: true });
            }),
        ),
      );

    const run = async () => {
      try {
        await document.fonts?.ready;
      } catch {
        // ignore
      }
      await waitForImages();
      requestAnimationFrame(() => requestAnimationFrame(markReady));
    };

    if (document.readyState === "complete") {
      void run();
    } else {
      window.addEventListener("load", () => void run(), { once: true });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
