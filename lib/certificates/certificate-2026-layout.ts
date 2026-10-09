/**
 * ============================================================================
 * Health Check-up Camp 2026 certificate - LAYOUT CONTROL PANEL
 * ============================================================================
 *
 * This file is the SINGLE source of truth for the position and size of the
 * three adjustable elements on the certificate:
 *
 *   1. qr            - the verification QR code
 *   2. scanCaption   - the "Scan QR code to verify" caption
 *   3. certificateId - the "Certificate ID: HC26-XXXXXXXX" text
 *
 * Edit ONLY the numbers in CERTIFICATE_2026_LAYOUT below to move or resize an
 * element. The renderer (app/certificate-2026/page.tsx) draws the PDF from
 * these exact numbers - they are the real values used on the certificate, not
 * reference values, and no coordinate or font size for these three elements is
 * hardcoded anywhere else.
 *
 * ----------------------------------------------------------------------------
 * HOW TO EDIT (both text elements default to alignment "center")
 * ----------------------------------------------------------------------------
 *   MOVE QR RIGHT:              increase qr.x
 *   MOVE QR LEFT:               decrease qr.x
 *   MOVE QR UP:                 increase qr.y
 *   MOVE QR DOWN:               decrease qr.y
 *   MAKE QR BIGGER:             increase qr.size
 *
 *   MOVE CAPTION RIGHT:         increase scanCaption.x
 *   MOVE CAPTION LEFT:          decrease scanCaption.x
 *   MOVE CAPTION UP:            increase scanCaption.y
 *   MOVE CAPTION DOWN:          decrease scanCaption.y
 *   MAKE CAPTION BIGGER:        increase scanCaption.fontSize
 *
 *   MOVE CERTIFICATE ID RIGHT:  increase certificateId.x
 *   MOVE CERTIFICATE ID LEFT:   decrease certificateId.x
 *   MOVE CERTIFICATE ID UP:     increase certificateId.y
 *   MOVE CERTIFICATE ID DOWN:   decrease certificateId.y
 *   MAKE CERTIFICATE ID BIGGER: increase certificateId.fontSize
 *
 * The three elements are independent: changing one element's x, y or size
 * never moves or resizes the other two.
 *
 * ----------------------------------------------------------------------------
 * COORDINATE SYSTEM (used by every x / y / size / fontSize value below)
 * ----------------------------------------------------------------------------
 *   Unit    : PDF points (1 pt = 1/72 inch)
 *   Origin  : BOTTOM-LEFT corner of the certificate page (pdf-lib native)
 *   X axis  : increases to the RIGHT  (bigger x = further right)
 *   Y axis  : increases UPWARD        (bigger y = higher up the page)
 *
 *   Example: add 10 to an element's x to move it 10 pt to the right.
 *            add 5 to an element's y to move it 5 pt up.
 *
 * The template (public/assets/healthcamp_certificate_2026.pdf) is a landscape
 * page measuring 842.25 pt wide x 595.499986 pt tall. The default values below
 * reproduce the previously verified certificate exactly.
 *
 * ----------------------------------------------------------------------------
 * ANCHORS (which point of each element its x / y values refer to)
 * ----------------------------------------------------------------------------
 *   - qr.x / qr.y ............ BOTTOM-LEFT corner of the QR image.
 *   - scanCaption.x / y ...... text BASELINE. y is the baseline; x depends on
 *   - certificateId.x / y .... text BASELINE. y is the baseline; x depends on
 *                              the element's `alignment`:
 *                                alignment "left"   -> x is the LEFT edge
 *                                alignment "center" -> x is the horizontal CENTRE
 *                                alignment "right"  -> x is the RIGHT edge
 *
 *   Both text elements default to alignment "center", so their default x is
 *   the CENTRE of the text. If you switch an element to "left" or "right", x
 *   keeps the same meaning relative to the new alignment, so the text may
 *   appear to shift - re-tune x if needed.
 *
 * All values are validated by `validateCertificate2026Layout()` before the PDF
 * is drawn, so a bad edit fails loudly instead of producing a broken layout.
 */

/** Reference page size (PDF points) the default values were derived from. */
export const CERTIFICATE_2026_PAGE_WIDTH = 842.25;
export const CERTIFICATE_2026_PAGE_HEIGHT = 595.499986;

export type TextAlignment = "left" | "center" | "right";

export interface RgbColor {
  /** Red channel, 0-1. */
  r: number;
  /** Green channel, 0-1. */
  g: number;
  /** Blue channel, 0-1. */
  b: number;
}

export interface QrLayout {
  /** Horizontal position of the QR's bottom-left corner, in PDF points from the page's left edge. */
  x: number;
  /** Vertical position of the QR's bottom-left corner, in PDF points from the page's bottom edge. */
  y: number;
  /**
   * Side length of the square QR image, in PDF points.
   * The QR is always drawn square (width = height = size) so it stays scannable.
   */
  size: number;
}

export interface TextLayout {
  /** Horizontal anchor position, in PDF points. Its meaning depends on `alignment`. */
  x: number;
  /** Vertical baseline position, in PDF points from the page's bottom edge. */
  y: number;
  /** Font size, in PDF points. Must be > 0. */
  fontSize: number;
  /** Horizontal alignment of the text relative to `x`. */
  alignment: TextAlignment;
  /** Standard PDF font used for this text. Default "Helvetica" (professional, non-cursive). */
  fontFamily: string;
  /** Text colour. Channels are 0-1. */
  color: RgbColor;
}

export interface CertificateIdLayout extends TextLayout {
  /** Static label drawn before the dynamic certificate id, e.g. "Certificate ID:". */
  label: string;
}

export interface Certificate2026Layout {
  qr: QrLayout;
  scanCaption: TextLayout;
  certificateId: CertificateIdLayout;
}

/** Caption text drawn next to the QR code. */
export const CERTIFICATE_2026_SCAN_CAPTION_TEXT = "Scan QR code to verify";

export const CERTIFICATE_2026_LAYOUT: Certificate2026Layout = {
  qr: {
    // x = horizontal position of the QR's bottom-left corner (pt from page left). Bigger = right.
    x: 631.25,
    // y = vertical position of the QR's bottom-left corner (pt from page bottom). Bigger = up.
    y: 502.499986,
    // size = side length of the square QR in pt (drawn width = height = size).
    size: 70,
  },

  scanCaption: {
    // x = horizontal CENTRE of the caption (alignment is "center"). Bigger = right.
    x: 762.25,
    // y = text baseline height from the page bottom. Bigger = up.
    y: 500.499986,
    fontSize: 7,
    alignment: "center",
    fontFamily: "Helvetica",
    color: { r: 0, g: 0, b: 0 },
  },

  certificateId: {
    // x = horizontal CENTRE of the text (alignment is "center"). Bigger = right.
    x: 762.25,
    // y = text baseline height from the page bottom. Bigger = up.
    y: 488.499986,
    fontSize: 8,
    alignment: "center",
    fontFamily: "Helvetica",
    color: { r: 0, g: 0, b: 0 },
    label: "Certificate ID:",
  },
};

/**
 * Resolve the x coordinate to pass to pdf-lib for a text string, given the
 * configured anchor and alignment. Keeps the alignment semantics in one place.
 */
export function resolveAlignedX(anchorX: number, textWidth: number, alignment: TextAlignment): number {
  switch (alignment) {
    case "left":
      return anchorX;
    case "right":
      return anchorX - textWidth;
    case "center":
    default:
      return anchorX - textWidth / 2;
  }
}

function assertFiniteNumber(value: number, name: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`[certificate-2026-layout] "${name}" must be a finite number (received ${String(value)}).`);
  }
}

function assertPositive(value: number, name: string): void {
  assertFiniteNumber(value, name);
  if (value <= 0) {
    throw new Error(`[certificate-2026-layout] "${name}" must be greater than 0 (received ${value}).`);
  }
}

function assertColor(color: RgbColor, name: string): void {
  for (const channel of ["r", "g", "b"] as const) {
    assertFiniteNumber(color?.[channel], `${name}.${channel}`);
    if (color[channel] < 0 || color[channel] > 1) {
      throw new Error(`[certificate-2026-layout] "${name}.${channel}" must be between 0 and 1 (received ${color[channel]}).`);
    }
  }
}

function assertAlignment(alignment: TextAlignment, name: string): void {
  if (alignment !== "left" && alignment !== "center" && alignment !== "right") {
    throw new Error(`[certificate-2026-layout] "${name}" must be "left", "center" or "right" (received ${String(alignment)}).`);
  }
}

function assertTextLayout(layout: TextLayout, name: string): void {
  assertFiniteNumber(layout.x, `${name}.x`);
  assertFiniteNumber(layout.y, `${name}.y`);
  assertPositive(layout.fontSize, `${name}.fontSize`);
  assertAlignment(layout.alignment, `${name}.alignment`);
  if (typeof layout.fontFamily !== "string" || layout.fontFamily.trim() === "") {
    throw new Error(`[certificate-2026-layout] "${name}.fontFamily" must be a non-empty font name string.`);
  }
  assertColor(layout.color, `${name}.color`);
}

/**
 * Validate the layout before rendering. Throws a descriptive error for any
 * invalid value (non-finite numbers, non-positive sizes/font sizes, bad
 * alignment/colour) and, when page dimensions are supplied, for a QR that
 * would be drawn outside the page. Intentionally simple - no layout engine.
 */
export function validateCertificate2026Layout(
  layout: Certificate2026Layout,
  page?: { width: number; height: number },
): void {
  assertFiniteNumber(layout.qr.x, "qr.x");
  assertFiniteNumber(layout.qr.y, "qr.y");
  assertPositive(layout.qr.size, "qr.size");

  assertTextLayout(layout.scanCaption, "scanCaption");
  assertTextLayout(layout.certificateId, "certificateId");

  if (typeof layout.certificateId.label !== "string") {
    throw new Error("[certificate-2026-layout] \"certificateId.label\" must be a string.");
  }

  if (page) {
    assertFiniteNumber(page.width, "page.width");
    assertFiniteNumber(page.height, "page.height");
    const { x, y, size } = layout.qr;
    if (x < 0 || y < 0 || x + size > page.width || y + size > page.height) {
      throw new Error(
        `[certificate-2026-layout] QR code falls outside the page bounds ` +
          `(qr.x=${x}, qr.y=${y}, size=${size}, page=${page.width}x${page.height}).`,
      );
    }
  }
}
