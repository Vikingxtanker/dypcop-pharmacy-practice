import test from "node:test";
import assert from "node:assert/strict";
import {
  buildParticipantDisplayName,
  filterParticipants2026,
  normalizePhone,
  type Participant2026,
} from "./participants-2026-search.ts";

const rows: Participant2026[] = [
  { id: "1", name: "Gaurav Gaikwad", phone: "7058963791", prefix: "Mr." },
  { id: "2", name: "Dev Shokeen", phone: "9873804291", prefix: "Mr." },
  { id: "3", name: "Apurwa Nikam", phone: "7666251195", prefix: "Miss" },
  { id: "4", name: "Ankit Thakur", phone: "7030716349", prefix: "Mr." },
];

test("buildParticipantDisplayName joins prefix and name", () => {
  assert.equal(buildParticipantDisplayName(rows[0]), "Mr. Gaurav Gaikwad");
  assert.equal(buildParticipantDisplayName({ name: "No Prefix", prefix: null }), "No Prefix");
});

test("normalizePhone strips non-digits", () => {
  assert.equal(normalizePhone("+91 70589-63791"), "917058963791");
  assert.equal(normalizePhone(null), "");
});

test("empty or whitespace query returns no results", () => {
  assert.deepEqual(filterParticipants2026(rows, ""), []);
  assert.deepEqual(filterParticipants2026(rows, "   "), []);
});

test("a single letter matches names case-insensitively", () => {
  const result = filterParticipants2026(rows, "g");
  assert.deepEqual(result.map((r) => r.id), ["1"]);
});

test("a single digit matches phone numbers immediately", () => {
  const result = filterParticipants2026(rows, "7");
  assert.deepEqual(result.map((r) => r.id).sort(), ["1", "2", "3", "4"]);
  assert.deepEqual(filterParticipants2026(rows, "6").map((r) => r.id).sort(), ["1", "3", "4"]);
});

test("a full name typed rapidly matches on every token", () => {
  assert.deepEqual(filterParticipants2026(rows, "gaurav gaikwad").map((r) => r.id), ["1"]);
  assert.deepEqual(filterParticipants2026(rows, "gaurav gai").map((r) => r.id), ["1"]);
  assert.deepEqual(filterParticipants2026(rows, "gaurav x").map((r) => r.id), []);
});

test("partial phone numbers with spaces and country codes match", () => {
  assert.deepEqual(filterParticipants2026(rows, "9873").map((r) => r.id), ["2"]);
  assert.deepEqual(filterParticipants2026(rows, "987 380").map((r) => r.id), ["2"]);
  assert.deepEqual(filterParticipants2026(rows, "+91 9873804291").map((r) => r.id), ["2"]);
  assert.deepEqual(filterParticipants2026(rows, "+91 9873").map((r) => r.id), []);
});

test("prefix participates in name matching", () => {
  assert.deepEqual(filterParticipants2026(rows, "Miss").map((r) => r.id), ["3"]);
});

test("results are limited", () => {
  assert.equal(filterParticipants2026(rows, "a", 2).length, 2);
});

test("no matches returns an empty list", () => {
  assert.deepEqual(filterParticipants2026(rows, "zzzz"), []);
});
