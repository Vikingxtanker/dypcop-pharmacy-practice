import test from "node:test";
import assert from "node:assert/strict";
import {
  EDITOR_DEMO_SOURCES,
  buildEditorSessions,
  builtinDemoData,
  pickBestSession,
} from "./editor-demo.ts";

const stamp = (iso: string) => new Date(iso).toISOString();

test("EDITOR_DEMO_SOURCES covers the three patients and the built-in fixtures", () => {
  const ids = EDITOR_DEMO_SOURCES.map((s) => s.id);
  assert.deepEqual(ids, ["builtin-demo", "builtin-long", "builtin-nocounsel", "kum413", "sal576", "dip407"]);
  assert.deepEqual(EDITOR_DEMO_SOURCES.filter((s) => s.kind === "patient").map((s) => s.patientId), [
    "kum413",
    "sal576",
    "dip407",
  ]);
});

test("buildEditorSessions groups by IST day and counts reportable types", () => {
  const records = [
    { test_type: "Hemoglobin", created_at: stamp("2026-09-25T02:10:00Z") },
    { test_type: "RBG", created_at: stamp("2026-09-25T02:15:00Z") },
    { test_type: "Systolic", created_at: stamp("2026-09-25T02:20:00Z") },
    { test_type: "Diastolic", created_at: stamp("2026-09-25T02:20:00Z") },
    { test_type: "Counseling", created_at: stamp("2026-09-25T02:30:00Z") },
    { test_type: "Bone Density (T Score)", created_at: stamp("2026-09-23T05:00:00Z") },
  ];
  const sessions = buildEditorSessions(records);
  assert.equal(sessions.length, 2);
  const newer = sessions.find((s) => s.dateKey === "2026-09-25")!;
  const older = sessions.find((s) => s.dateKey === "2026-09-23")!;
  assert.equal(newer.testCount, 3);
  assert.equal(newer.recordCount, 5);
  assert.equal(older.testCount, 1);
  assert.equal(older.recordCount, 1);
});

test("buildEditorSessions ignores invalid dates and non-reportable types", () => {
  const records = [
    { test_type: "Some Other Test", created_at: stamp("2026-09-25T02:10:00Z") },
    { test_type: "Hemoglobin", created_at: "not-a-date" },
  ];
  const sessions = buildEditorSessions(records);
  assert.equal(sessions.length, 0);
});

test("buildEditorSessions sorts sessions newest-first", () => {
  const sessions = buildEditorSessions([
    { test_type: "RBG", created_at: stamp("2026-09-20T02:10:00Z") },
    { test_type: "RBG", created_at: stamp("2026-09-25T02:10:00Z") },
  ]);
  assert.deepEqual(
    sessions.map((s) => s.dateKey),
    ["2026-09-25", "2026-09-20"],
  );
});

test("pickBestSession prefers the most reportable day, breaking ties with recency", () => {
  const sessions = [
    { dateKey: "2026-09-20", testCount: 2, recordCount: 4 },
    { dateKey: "2026-09-25", testCount: 9, recordCount: 12 },
    { dateKey: "2026-09-10", testCount: 9, recordCount: 20 },
  ];
  const best = pickBestSession(sessions)!;
  assert.equal(best.dateKey, "2026-09-25");
});

test("pickBestSession returns null for empty input", () => {
  assert.equal(pickBestSession([]), null);
});

test("builtinDemoData returns the rich demo for the default source", () => {
  const data = builtinDemoData("builtin-demo");
  assert.ok(data.laboratoryResults.length >= 10);
  assert.ok(data.counselingPoints.length > 0);
  assert.ok(data.patient.name.length > 0);
});

test("builtinDemoData long variant stresses many counseling points", () => {
  const data = builtinDemoData("builtin-long");
  assert.ok(data.counselingPoints.length >= 20);
  assert.ok(data.laboratoryResults.length === builtinDemoData("builtin-demo").laboratoryResults.length);
});

test("builtinDemoData no-counsel variant omits the counseling points", () => {
  const data = builtinDemoData("builtin-nocounsel");
  assert.deepEqual(data.counselingPoints, []);
  assert.ok(data.laboratoryResults.length >= 10);
});