import test from "node:test";
import assert from "node:assert/strict";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  MM_PER_PX,
  PX_PER_MM,
  buildOverrideSheet,
  clampZoom,
  computePageCount,
  cssStructuralError,
  mmToPx,
  pxToMm,
} from "./editor-utils.ts";

test("mm <-> px conversion round trips at 96 dpi", () => {
  assert.equal(mmToPx(1), pxToMm(1) > 0 ? PX_PER_MM : 0);
  assert.ok(Math.abs(mmToPx(10) - 10 * PX_PER_MM) < 1e-9);
  assert.ok(Math.abs(pxToMm(mmToPx(37.5)) - 37.5) < 1e-9);
  assert.ok(Math.abs(mmToPx(pxToMm(300)) - 300) < 1e-9);
  assert.equal(MM_PER_PX, 25.4 / 96);
  assert.equal(PX_PER_MM, 96 / 25.4);
});

test("A4 constants are portrait fitness dimensions", () => {
  assert.equal(A4_WIDTH_MM, 210);
  assert.equal(A4_HEIGHT_MM, 297);
});

test("computePageCount collapses every A4 height into one page and overflows onward", () => {
  assert.equal(computePageCount(0), 1);
  assert.equal(computePageCount(-5), 1);
  assert.equal(computePageCount(297), 1);
  assert.equal(computePageCount(297.1), 2);
  assert.equal(computePageCount(594), 2);
  assert.equal(computePageCount(594.1), 3);
  assert.equal(computePageCount(Number.NaN), 1);
});

test("clampZoom snaps to the nearest supported level", () => {
  assert.equal(clampZoom(0.5), 0.5);
  assert.equal(clampZoom(1), 1);
  assert.equal(clampZoom(0.8), 0.75);
  assert.equal(clampZoom(1.35), 1.25);
  assert.equal(clampZoom(1.4), 1.5);
  assert.equal(clampZoom(2), 1.5);
  assert.equal(clampZoom(Number.NaN), 1);
});

test("cssStructuralError accepts balanced stylesheets", () => {
  assert.equal(cssStructuralError(".rp-header { height: 36mm; }"), null);
  assert.equal(
    cssStructuralError(":root { --a: 1mm; }\n@media print { .rp-sheet { width: 210mm; } }"),
    null,
  );
  assert.equal(cssStructuralError(""), null);
});

test("cssStructuralError ignores strings and url() payloads", () => {
  assert.equal(cssStructuralError(`.a::before { content: "}"; }`), null);
  assert.equal(cssStructuralError(`.a { background: url(data:image/png;base64,AAAA}); }`), null);
});

test("cssStructuralError strips comments before checking depth", () => {
  assert.equal(cssStructuralError("/* unbalanced { here */ .a { color: red; }"), null);
  assert.equal(cssStructuralError(".a { /* open } comment */ color: red; }"), null);
});

test("cssStructuralError rejects unbalanced braces, unterminated strings and empty rules", () => {
  assert.match(cssStructuralError(".a { color: red;") ?? "", /closing brace/);
  assert.match(cssStructuralError(".a }  { color: red;") ?? "", /stray closing/);
  assert.match(cssStructuralError('.a::before { content: "oops }') ?? "", /Unterminated/);
  assert.match(cssStructuralError("just-some-text") ?? "", /No CSS rule/);
});

test("buildOverrideSheet emits a :root block only for non-null tokens", () => {
  const css = ".rp-header { height: 32mm; }";
  const sheet = buildOverrideSheet(css, {
    "--report-header-height": "32mm",
    "--report-font-body": null,
  });
  assert.match(sheet, /:root \{[\s\S]*--report-header-height: 32mm/);
  assert.ok(!sheet.includes("--report-font-body"));
  assert.ok(sheet.includes(css));
});

test("buildOverrideSheet strips HTML-flavoured escape sequences", () => {
  const sheet = buildOverrideSheet("<style> .a { color: red; } </style><script>x</script>", {});
  assert.ok(!sheet.includes("<"));
  assert.ok(!sheet.includes("style"));
  assert.ok(sheet.includes(".a { color: red; }"));
});