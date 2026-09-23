import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COUNSELING_MAX_LINES,
  COUNSELING_MAX_CHARS,
  COUNSELING_TOTAL_CAPACITY,
  enforceCounselingLimit,
} from "./counseling-limit";

const emptyLines = (text: string) => text.split("\n");

test("Test 1: fewer than 103 characters pass through unchanged", () => {
  const input = "low hb with low BP";
  const res = enforceCounselingLimit(input, input.length);
  assert.equal(res.value, input);
  assert.equal(res.truncated, false);
  assert.equal(res.caret, input.length);
});

test("Test 2: exactly 103 characters are accepted", () => {
  const input = "a".repeat(COUNSELING_MAX_CHARS);
  const res = enforceCounselingLimit(input, input.length);
  assert.equal(res.value, input);
  assert.equal(res.truncated, false);
  assert.equal(res.lines.length, 1);
  assert.equal(res.lines[0], input);
});

test("Test 3: character 104 automatically starts line 2", () => {
  const line1 = "w".repeat(COUNSELING_MAX_CHARS);
  const input = line1 + "x";
  const res = enforceCounselingLimit(input, input.length);
  const lines = emptyLines(res.value);
  assert.equal(lines.length, 2);
  assert.equal(lines[0].length, COUNSELING_MAX_CHARS);
  assert.equal(lines[1], "x");
  // caret lands right after the char that moved to line 2
  assert.equal(res.caret, res.value.length);
});

test("Test 4: first four lines can be filled, line 5 accepts normally", () => {
  const input = Array(4).fill("w".repeat(COUNSELING_MAX_CHARS)).join("\n") + "hello";
  const res = enforceCounselingLimit(input, input.length);
  assert.equal(res.lines.length, 5);
  assert.equal(res.truncated, false);
  assert.equal(res.lines[4], "hello");
});

test("Test 5: exactly 5 x 103 characters are accepted", () => {
  const input = Array(COUNSELING_MAX_LINES).fill("c".repeat(COUNSELING_MAX_CHARS)).join("\n");
  const res = enforceCounselingLimit(input, input.length);
  assert.equal(res.value, input);
  assert.equal(res.truncated, false);
  assert.equal(res.value.length, COUNSELING_TOTAL_CAPACITY + COUNSELING_MAX_LINES - 1);
  assert.equal(res.lines.length, COUNSELING_MAX_LINES);
});

test("Test 6: character 516 is rejected and flagged truncated", () => {
  const line = "z".repeat(COUNSELING_MAX_CHARS);
  const input = Array(COUNSELING_MAX_LINES).fill(line).join("\n") + "overflow";
  const res = enforceCounselingLimit(input, input.length);
  assert.equal(res.truncated, true);
  const kept = res.lines.slice(0, COUNSELING_MAX_LINES);
  assert.ok(kept.every((l) => l.length <= COUNSELING_MAX_CHARS));
  assert.ok(res.value.length <= COUNSELING_TOTAL_CAPACITY + COUNSELING_MAX_LINES - 1);
});

test("Test 7: paste of >515 characters keeps only valid capacity", () => {
  const input = ("word ".repeat(200)).trim();
  const res = enforceCounselingLimit(input, input.length);
  assert.equal(res.truncated, true);
  assert.ok(res.lines.length <= COUNSELING_MAX_LINES);
  assert.ok(res.lines.every((l) => l.length <= COUNSELING_MAX_CHARS));
  assert.ok(res.value.length <= COUNSELING_TOTAL_CAPACITY + COUNSELING_MAX_LINES - 1);
});

test("Test 8: manual Enter creates a logical line; 5-line max enforced", () => {
  const input = "line1\nline2\nline3";
  const res = enforceCounselingLimit(input, input.length);
  assert.equal(res.lines.join("\n"), "line1\nline2\nline3");

  const tooMany = Array(7).fill("x").join("\n");
  const res2 = enforceCounselingLimit(tooMany, tooMany.length);
  assert.equal(res2.lines.length, COUNSELING_MAX_LINES);
  assert.equal(res2.truncated, true);
});

test("Test 9: a single word longer than 103 is safely split", () => {
  const input = "W".repeat(120);
  const res = enforceCounselingLimit(input, input.length);
  assert.ok(res.lines.every((l) => l.length <= COUNSELING_MAX_CHARS));
  assert.equal(res.lines[0].length, COUNSELING_MAX_CHARS);
  assert.equal(res.lines[1], "W".repeat(17));
  assert.equal(res.truncated, false);
});

test("Test 10: backspace merges lines without corruption", () => {
  const res = enforceCounselingLimit("123\nabc", 3);
  assert.equal(res.value, "123\nabc");
  assert.equal(res.caret, 3);
});

test("Test 11: existing valid multi-line data is not modified", () => {
  const input = "Existing line one\nExisting line two\nExisting line three";
  const res = enforceCounselingLimit(input, input.length);
  assert.equal(res.value, input);
  assert.equal(res.truncated, false);
});

test("space + word overflow pushes the word to the next line within the 103 budget", () => {
  const input = "x".repeat(101) + " " + "yy";
  const res = enforceCounselingLimit(input, input.length);
  const lines = emptyLines(res.value);
  assert.equal(lines[0].length, 101);
  assert.equal(lines[1], "yy");
  assert.equal(res.truncated, false);
});