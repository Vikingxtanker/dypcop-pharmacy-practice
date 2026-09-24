import test from "node:test";
import assert from "node:assert/strict";
import { mintReportToken, redeemReportToken, buildReportUrl } from "./report-token";

const ORIGINAL_SECRET = process.env.REPORT_TOKEN_SECRET;

test("mint -> redeem roundtrip preserves payload", () => {
  process.env.REPORT_TOKEN_SECRET = "test-secret";
  const token = mintReportToken({ patientId: "HSC-P-00127", dateKey: "2026-09-25" });
  const payload = redeemReportToken(token);
  assert.deepEqual(payload, { patientId: "HSC-P-00127", dateKey: "2026-09-25" });
});

test("new token preserves includedTests through sign/verify", () => {
  process.env.REPORT_TOKEN_SECRET = "test-secret";
  const includedTests = ["Hemoglobin", "RBG", "BP"];
  const token = mintReportToken({ patientId: "P1", dateKey: "2026-09-25", includedTests });
  assert.deepEqual(redeemReportToken(token), { patientId: "P1", dateKey: "2026-09-25", includedTests });
});

test("legacy token without includedTests redeems as include-all (undefined)", () => {
  process.env.REPORT_TOKEN_SECRET = "test-secret";
  const token = mintReportToken({ patientId: "P1", dateKey: "2026-09-25" });
  const payload = redeemReportToken(token);
  assert.deepEqual(payload, { patientId: "P1", dateKey: "2026-09-25" });
  assert.equal(payload?.includedTests, undefined);
});

test("redeem normalizes includedTests; rejects malformed values", () => {
  process.env.REPORT_TOKEN_SECRET = "test-secret";
  const cleaned = mintReportToken({
    patientId: "P1",
    dateKey: "2026-09-25",
    includedTests: ["Hemoglobin", "Bogus", "RBG", "Bogus"],
  });
  assert.deepEqual(redeemReportToken(cleaned), { patientId: "P1", dateKey: "2026-09-25", includedTests: ["Hemoglobin", "RBG"] });

  const empty = mintReportToken({ patientId: "P1", dateKey: "2026-09-25", includedTests: [] });
  assert.deepEqual(redeemReportToken(empty), { patientId: "P1", dateKey: "2026-09-25", includedTests: [] });

  const nonArray = mintReportToken({ patientId: "P1", dateKey: "2026-09-25", includedTests: "Hemoglobin" as unknown as string[] });
  assert.equal(redeemReportToken(nonArray), null);

  const nonStringEntry = mintReportToken({ patientId: "P1", dateKey: "2026-09-25", includedTests: ["Hemoglobin", 42] as unknown as string[] });
  assert.equal(redeemReportToken(nonStringEntry), null);
});

test("token changes when the secret changes", () => {
  process.env.REPORT_TOKEN_SECRET = "secret-a";
  const tokenA = mintReportToken({ patientId: "P1", dateKey: "2026-09-25" });
  process.env.REPORT_TOKEN_SECRET = "secret-b";
  const tokenB = mintReportToken({ patientId: "P1", dateKey: "2026-09-25" });
  assert.notEqual(tokenA, tokenB);
  assert.equal(redeemReportToken(tokenA), null);
});

test("tampered token is rejected", () => {
  process.env.REPORT_TOKEN_SECRET = "test-secret";
  const token = mintReportToken({ patientId: "HSC-P-00127", dateKey: "2026-09-25" });
  const [payload, sig] = token.split(".");
  const tamperedPayload = Buffer.from(JSON.stringify({ patientId: "HSC-EVIL", dateKey: "2026-09-25" })).toString("base64url");
  assert.equal(redeemReportToken(`${tamperedPayload}.${sig}`), null);
  assert.equal(redeemReportToken(`${payload}.${"A".repeat(22)}`), null);
});

test("invalid inputs are rejected", () => {
  assert.equal(redeemReportToken(""), null);
  assert.equal(redeemReportToken("not-a-token"), null);
  assert.equal(redeemReportToken(`${"a".repeat(5000)}.${"b".repeat(22)}`), null);
  assert.equal(
    redeemReportToken(`${Buffer.from('{"patientId":123,"dateKey":"x"}').toString("base64url")}.${"a".repeat(22)}`),
    null,
  );
});

test("payload date format is validated", () => {
  process.env.REPORT_TOKEN_SECRET = "test-secret";
  const token = mintReportToken({ patientId: "P1", dateKey: "not-a-date" });
  assert.equal(redeemReportToken(token), null);
});

test("buildReportUrl strips trailing slashes and falls back to the site origin", () => {
  process.env.REPORT_TOKEN_SECRET = "test-secret";
  const hadSite = process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  try {
    const token = mintReportToken({ patientId: "P1", dateKey: "2026-09-25" });
    const url = buildReportUrl({ patientId: "P1", dateKey: "2026-09-25" }, "https://example.com/");
    assert.equal(url, `https://example.com/report/${token}`);
  } finally {
    if (hadSite === undefined) {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    } else {
      process.env.NEXT_PUBLIC_SITE_URL = hadSite;
    }
  }
});

test.after(() => {
  if (ORIGINAL_SECRET === undefined) {
    delete process.env.REPORT_TOKEN_SECRET;
  } else {
    process.env.REPORT_TOKEN_SECRET = ORIGINAL_SECRET;
  }
});