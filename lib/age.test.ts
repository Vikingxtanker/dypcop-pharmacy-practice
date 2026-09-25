import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateAgeFromDob } from "./age.ts";

test("birthday has not occurred yet this year", () => {
  assert.equal(calculateAgeFromDob("2006-10-10", "2026-09-25"), 19);
});

test("birthday is today", () => {
  assert.equal(calculateAgeFromDob("2006-09-25", "2026-09-25"), 20);
});

test("birthday already occurred this year", () => {
  assert.equal(calculateAgeFromDob("2006-01-15", "2026-09-25"), 20);
  assert.equal(calculateAgeFromDob("2006-09-25", "2025-09-25"), 19);
});

test("leap-day DOB is handled with calendar comparison", () => {
  assert.equal(calculateAgeFromDob("2000-02-29", "2026-02-28"), 25);
  assert.equal(calculateAgeFromDob("2000-02-29", "2026-03-01"), 26);
  assert.equal(calculateAgeFromDob("2000-02-29", "2028-02-29"), 28);
});

test("invalid DOB returns null instead of an invented age", () => {
  assert.equal(calculateAgeFromDob("not-a-date", "2026-09-25"), null);
  assert.equal(calculateAgeFromDob("2006-13-01", "2026-09-25"), null);
  assert.equal(calculateAgeFromDob("2006-02-30", "2026-09-25"), null);
  assert.equal(calculateAgeFromDob("2026-09-25", "2006-09-25"), null);
});

test("missing DOB returns null", () => {
  assert.equal(calculateAgeFromDob(undefined, "2026-09-25"), null);
  assert.equal(calculateAgeFromDob(null, "2026-09-25"), null);
  assert.equal(calculateAgeFromDob("", "2026-09-25"), null);
});

test("same DOB across different reference dates", () => {
  assert.equal(calculateAgeFromDob("2006-09-25", "2025-09-24"), 18);
  assert.equal(calculateAgeFromDob("2006-09-25", "2025-09-25"), 19);
  assert.equal(calculateAgeFromDob("2006-09-25", "2026-09-24"), 19);
  assert.equal(calculateAgeFromDob("2006-09-25", "2026-09-25"), 20);
});

test("age changes between last year's screening and this year's screening", () => {
  assert.equal(calculateAgeFromDob("2006-09-25", "2025-09-25"), 19);
  assert.equal(calculateAgeFromDob("2006-09-25", "2026-09-25"), 20);
});

test("accepts a Date reference and a Date DOB without timezone shifts", () => {
  assert.equal(calculateAgeFromDob(new Date(2006, 8, 25), new Date(2026, 8, 25)), 20);
  assert.equal(calculateAgeFromDob(new Date(2006, 8, 26), new Date(2026, 8, 25)), 19);
});