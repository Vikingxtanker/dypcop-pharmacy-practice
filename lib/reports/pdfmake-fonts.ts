import fs from "node:fs";
import path from "node:path";
import pdfMake from "pdfmake";
import type { TDocumentDefinitions } from "pdfmake/interfaces";

interface PdfMakeInstance {
  virtualfs: { writeFileSync(name: string, content: Buffer): void };
  setFonts(fonts: Record<string, Record<string, string>>): void;
  setUrlAccessPolicy(callback: (url: string) => boolean): void;
  setLocalAccessPolicy(callback: (target: string) => boolean): void;
  createPdf(docDefinition: TDocumentDefinitions): { getBuffer(): Promise<Buffer> };
}

/** pdfmake 0.3 ships an ESM/CJS singleton instance, not the old factory object. */
export const pdfMakeInstance = pdfMake as unknown as PdfMakeInstance;

const FONT_DIR = path.join(process.cwd(), "lib", "reports", "fonts");

const FONT_FILES = [
  "Roboto-Regular.ttf",
  "Roboto-Italic.ttf",
  "Roboto-Medium.ttf",
  "Roboto-MediumItalic.ttf",
  "Roboto-Bold.ttf",
  "Roboto-BoldItalic.ttf",
  "Roboto-Black.ttf",
  "Roboto-BlackItalic.ttf",
] as const;

let registered = false;

/**
 * Registers the bundled Roboto faces into pdfmake's virtual file system.
 *
 * pdfmake 0.3 font descriptors must be strings: either a key in its virtual
 * file system or a local path. Buffers are not accepted, so the TTF bytes are
 * loaded once and written into the VFS under their file names.
 *
 * Three families cover the CSS weight palette:
 * - Roboto        -> body copy (400) + bold (700)
 * - RobotoMedium  -> 600/650 labels and captions
 * - RobotoBlack   -> 800-950 headings (browser renders those with the 900 face)
 */
export function ensureReportFonts(): void {
  if (registered) return;

  for (const file of FONT_FILES) {
    const bytes = fs.readFileSync(path.join(FONT_DIR, file));
    pdfMakeInstance.virtualfs.writeFileSync(file, bytes);
  }

  pdfMakeInstance.setFonts({
    Roboto: {
      normal: "Roboto-Regular.ttf",
      bold: "Roboto-Bold.ttf",
      italics: "Roboto-Italic.ttf",
      bolditalics: "Roboto-BoldItalic.ttf",
    },
    RobotoMedium: {
      normal: "Roboto-Medium.ttf",
      bold: "Roboto-Bold.ttf",
      italics: "Roboto-MediumItalic.ttf",
      bolditalics: "Roboto-BoldItalic.ttf",
    },
    RobotoBlack: {
      normal: "Roboto-Black.ttf",
      bold: "Roboto-Black.ttf",
      italics: "Roboto-BlackItalic.ttf",
      bolditalics: "Roboto-BlackItalic.ttf",
    },
  });

  // Report assets are embedded data URIs; never fetch remote or arbitrary
  // local resources while rendering a patient document.
  pdfMakeInstance.setUrlAccessPolicy(() => false);
  pdfMakeInstance.setLocalAccessPolicy((target) => target.startsWith(FONT_DIR));

  registered = true;
}
