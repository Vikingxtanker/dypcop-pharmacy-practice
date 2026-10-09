import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  mintCertificateToken,
  redeemCertificateToken,
  buildCertificateViewUrl,
  normalizeCertificateId,
} from "./certificate-token.ts";
import { redeemReportToken } from "../reports/report-token.ts";

const ORIGINAL_SECRET = process.env.CERTIFICATE_TOKEN_SECRET;

test("mint -> redeem roundtrip preserves certificate id", () => {
  process.env.CERTIFICATE_TOKEN_SECRET = "test-secret";
  const token = mintCertificateToken("HC26-JF1DAAAA");
  assert.deepEqual(redeemCertificateToken(token), { certificateId: "HC26-JF1DAAAA" });
});

test("invalid signature is rejected", () => {
  process.env.CERTIFICATE_TOKEN_SECRET = "test-secret";
  const token = mintCertificateToken("HC26-JF1DAAAA");
  const [payload] = token.split(".");
  assert.equal(redeemCertificateToken(`${payload}.${"A".repeat(43)}`), null);
});

test("tampered certificate id is rejected", () => {
  process.env.CERTIFICATE_TOKEN_SECRET = "test-secret";
  const token = mintCertificateToken("HC26-JF1DAAAA");
  const [, signature] = token.split(".");
  const tamperedPayload = Buffer.from(
    JSON.stringify({ purpose: "certificate-2026", certificateId: "HC26-EVIL0000" }),
    "utf8",
  ).toString("base64url");
  assert.equal(redeemCertificateToken(`${tamperedPayload}.${signature}`), null);
});

test("malformed payloads are rejected", () => {
  process.env.CERTIFICATE_TOKEN_SECRET = "test-secret";
  const notJson = Buffer.from("not json", "utf8").toString("base64url");
  const notObject = Buffer.from(JSON.stringify("hello"), "utf8").toString("base64url");
  const missingPurpose = Buffer.from(JSON.stringify({ certificateId: "HC26-JF1DAAAA" }), "utf8").toString("base64url");
  const missingId = Buffer.from(JSON.stringify({ purpose: "certificate-2026" }), "utf8").toString("base64url");
  const badId = Buffer.from(
    JSON.stringify({ purpose: "certificate-2026", certificateId: "not-a-cert" }),
    "utf8",
  ).toString("base64url");
  assert.equal(redeemCertificateToken(""), null);
  assert.equal(redeemCertificateToken("not-a-token"), null);
  assert.equal(redeemCertificateToken(`${"a".repeat(5000)}.${"b".repeat(43)}`), null);
  assert.equal(redeemCertificateToken(`${notJson}.${"a".repeat(43)}`), null);
  assert.equal(redeemCertificateToken(`${notObject}.${"a".repeat(43)}`), null);
  assert.equal(redeemCertificateToken(`${missingPurpose}.${"a".repeat(43)}`), null);
  assert.equal(redeemCertificateToken(`${missingId}.${"a".repeat(43)}`), null);
  assert.equal(redeemCertificateToken(`${badId}.${"a".repeat(43)}`), null);
});

test("a token signed with the wrong purpose is rejected", () => {
  process.env.CERTIFICATE_TOKEN_SECRET = "test-secret";
  const payload = Buffer.from(JSON.stringify({ purpose: "report", certificateId: "HC26-JF1DAAAA" }), "utf8").toString(
    "base64url",
  );
  const signature = createHmac("sha256", "test-secret").update(payload).digest().toString("base64url");
  assert.equal(redeemCertificateToken(`${payload}.${signature}`), null);
});

test("certificate tokens are not accepted as patient report tokens", () => {
  process.env.CERTIFICATE_TOKEN_SECRET = "test-secret";
  process.env.REPORT_TOKEN_SECRET = "test-secret";
  const certificateToken = mintCertificateToken("HC26-JF1DAAAA");
  assert.equal(redeemReportToken(certificateToken), null);
});

test("token changes when the certificate secret changes", () => {
  process.env.CERTIFICATE_TOKEN_SECRET = "secret-a";
  const tokenA = mintCertificateToken("HC26-JF1DAAAA");
  process.env.CERTIFICATE_TOKEN_SECRET = "secret-b";
  const tokenB = mintCertificateToken("HC26-JF1DAAAA");
  assert.notEqual(tokenA, tokenB);
  assert.equal(redeemCertificateToken(tokenA), null);
});

test("normalizeCertificateId enforces the expected shape", () => {
  assert.equal(normalizeCertificateId(" HC26-JF1DAAAA "), "HC26-JF1DAAAA");
  assert.equal(normalizeCertificateId("hc26-jf1daaaa"), null);
  assert.equal(normalizeCertificateId(""), null);
  assert.equal(normalizeCertificateId(null), null);
  assert.equal(normalizeCertificateId(42), null);
  assert.equal(normalizeCertificateId("[object Promise]"), null);
});

test("buildCertificateViewUrl uses the canonical signed route", () => {
  process.env.CERTIFICATE_TOKEN_SECRET = "test-secret";
  const hadSite = process.env.NEXT_PUBLIC_SITE_URL;
  delete process.env.NEXT_PUBLIC_SITE_URL;
  try {
    const url = buildCertificateViewUrl("HC26-JF1DAAAA", "https://example.com/");
    const token = mintCertificateToken("HC26-JF1DAAAA");
    assert.equal(url, `https://example.com/certificate-2026/view/${token}`);
    assert.ok(url.includes("/certificate-2026/view/"));
    assert.ok(!url.includes("/verify/"));
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
    delete process.env.CERTIFICATE_TOKEN_SECRET;
  } else {
    process.env.CERTIFICATE_TOKEN_SECRET = ORIGINAL_SECRET;
  }
});
