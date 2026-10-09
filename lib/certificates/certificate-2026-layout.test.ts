import test from "node:test";
import assert from "node:assert/strict";
import {
  CERTIFICATE_2026_LAYOUT,
  CERTIFICATE_2026_PAGE_HEIGHT,
  CERTIFICATE_2026_PAGE_WIDTH,
  resolveAlignedX,
  validateCertificate2026Layout,
  type Certificate2026Layout,
} from "./certificate-2026-layout.ts";

// Legacy constants from the original hardcoded implementation.
const LEGACY_QR_OFFSET_RIGHT = 50;
const LEGACY_QR_OFFSET_TOP = 40;
const LEGACY_QR_SIZE = 60;
const LEGACY_VERIFY_TEXT_SIZE = 7;
const LEGACY_VERIFY_OFFSET_TOP = 95;
const LEGACY_CERT_ID_TEXT_SIZE = 8;
const LEGACY_CERT_ID_OFFSET_TOP = 107;

const W = CERTIFICATE_2026_PAGE_WIDTH;
const H = CERTIFICATE_2026_PAGE_HEIGHT;

function cloneLayout(): Certificate2026Layout {
  return structuredClone(CERTIFICATE_2026_LAYOUT);
}

// Values are derived from the same page size; allow for float representation noise.
function assertClose(actual: number, expected: number, message?: string): void {
  assert.ok(Math.abs(actual - expected) < 1e-6, `${message ?? "value"}: expected ${expected}, got ${actual}`);
}

test("default QR values reproduce the legacy layout", () => {
  assertClose(CERTIFICATE_2026_LAYOUT.qr.x, W - LEGACY_QR_OFFSET_RIGHT - LEGACY_QR_SIZE);
  assertClose(CERTIFICATE_2026_LAYOUT.qr.y, H - LEGACY_QR_OFFSET_TOP - LEGACY_QR_SIZE);
  assert.equal(CERTIFICATE_2026_LAYOUT.qr.size, LEGACY_QR_SIZE);
});

test("default scan caption values reproduce the legacy layout", () => {
  assertClose(CERTIFICATE_2026_LAYOUT.scanCaption.x, W - LEGACY_QR_OFFSET_RIGHT - LEGACY_QR_SIZE / 2);
  assertClose(CERTIFICATE_2026_LAYOUT.scanCaption.y, H - LEGACY_VERIFY_OFFSET_TOP);
  assert.equal(CERTIFICATE_2026_LAYOUT.scanCaption.fontSize, LEGACY_VERIFY_TEXT_SIZE);
  assert.equal(CERTIFICATE_2026_LAYOUT.scanCaption.alignment, "center");
});

test("default certificate ID values reproduce the legacy layout", () => {
  assertClose(CERTIFICATE_2026_LAYOUT.certificateId.x, W - LEGACY_QR_OFFSET_RIGHT - LEGACY_QR_SIZE / 2);
  assertClose(CERTIFICATE_2026_LAYOUT.certificateId.y, H - LEGACY_CERT_ID_OFFSET_TOP);
  assert.equal(CERTIFICATE_2026_LAYOUT.certificateId.fontSize, LEGACY_CERT_ID_TEXT_SIZE);
  assert.equal(CERTIFICATE_2026_LAYOUT.certificateId.alignment, "center");
  assert.equal(CERTIFICATE_2026_LAYOUT.certificateId.label, "Certificate ID:");
});

test("the three elements are independent configuration objects", () => {
  const layout = cloneLayout();
  layout.qr.x += 25;
  layout.qr.size += 10;
  assert.equal(layout.scanCaption.x, CERTIFICATE_2026_LAYOUT.scanCaption.x);
  assert.equal(layout.scanCaption.y, CERTIFICATE_2026_LAYOUT.scanCaption.y);
  assert.equal(layout.certificateId.x, CERTIFICATE_2026_LAYOUT.certificateId.x);
  assert.equal(layout.certificateId.y, CERTIFICATE_2026_LAYOUT.certificateId.y);
  assert.equal(layout.certificateId.fontSize, CERTIFICATE_2026_LAYOUT.certificateId.fontSize);
});

test("resolveAlignedX applies left / center / right semantics", () => {
  assert.equal(resolveAlignedX(100, 40, "left"), 100);
  assert.equal(resolveAlignedX(100, 40, "center"), 80);
  assert.equal(resolveAlignedX(100, 40, "right"), 60);
});

test("default layout passes validation within the real page bounds", () => {
  assert.doesNotThrow(() => validateCertificate2026Layout(CERTIFICATE_2026_LAYOUT, { width: W, height: H }));
});

test("validation rejects invalid numeric and alignment values", () => {
  const cases: Array<(l: Certificate2026Layout) => void> = [
    (l) => {
      l.qr.size = 0;
    },
    (l) => {
      l.qr.size = -5;
    },
    (l) => {
      l.qr.x = Number.NaN;
    },
    (l) => {
      l.qr.y = Number.POSITIVE_INFINITY;
    },
    (l) => {
      l.scanCaption.fontSize = 0;
    },
    (l) => {
      l.certificateId.fontSize = -1;
    },
    (l) => {
      l.scanCaption.alignment = "middle" as unknown as "center";
    },
    (l) => {
      l.certificateId.color.r = 2;
    },
  ];
  for (const mutate of cases) {
    const layout = cloneLayout();
    mutate(layout);
    assert.throws(() => validateCertificate2026Layout(layout), /certificate-2026-layout/);
  }
});

test("validation rejects a QR that would overflow the page bounds", () => {
  const layout = cloneLayout();
  layout.qr.x = W - 10;
  assert.throws(
    () => validateCertificate2026Layout(layout, { width: W, height: H }),
    /outside the page bounds/,
  );
});
