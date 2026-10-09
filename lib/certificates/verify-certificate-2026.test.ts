import test from "node:test";
import assert from "node:assert/strict";
import { verifyCertificate2026, type CertificateVerificationDb } from "./verify-certificate-2026.ts";

interface QueryResult {
  data: unknown;
  error: { code?: string; message?: string } | null;
}

function fakeDb(responses: Record<string, QueryResult>): CertificateVerificationDb {
  return {
    from(table: string) {
      const response = responses[table] ?? { data: null, error: null };
      const builder = {
        select: () => builder,
        eq: () => builder,
        maybeSingle: async () => response,
      };
      return builder;
    },
  } as unknown as CertificateVerificationDb;
}

const certificate = {
  certificate_id: "HC26-JF1DAAAA",
  participant_id: "11111111-1111-1111-1111-111111111111",
  issued_at: "2026-10-08T00:00:00.000Z",
  status: "valid",
};

const participant = { name: "Gaurav Gaikwad", prefix: null };

test("valid certificate resolves as valid with participant name", async () => {
  const result = await verifyCertificate2026("HC26-JF1DAAAA", {
    db: fakeDb({
      certificates2026: { data: certificate, error: null },
      participants2026: { data: participant, error: null },
    }),
  });
  assert.equal(result.outcome, "valid");
  assert.equal(result.certificateId, "HC26-JF1DAAAA");
  assert.equal(result.participantName, "Gaurav Gaikwad");
  assert.equal(result.issuedAt, certificate.issued_at);
});

test("prefix is included in the displayed participant name", async () => {
  const result = await verifyCertificate2026("HC26-JF1DAAAA", {
    db: fakeDb({
      certificates2026: { data: certificate, error: null },
      participants2026: { data: { name: "Gaikwad", prefix: "Dr." }, error: null },
    }),
  });
  assert.equal(result.outcome, "valid");
  assert.equal(result.participantName, "Dr. Gaikwad");
});

test("revoked certificate resolves as revoked", async () => {
  const result = await verifyCertificate2026("HC26-JF1DAAAA", {
    db: fakeDb({
      certificates2026: { data: { ...certificate, status: "revoked" }, error: null },
      participants2026: { data: participant, error: null },
    }),
  });
  assert.equal(result.outcome, "revoked");
  assert.equal(result.status, "revoked");
});

test("missing certificate resolves as not_found with the requested id", async () => {
  const result = await verifyCertificate2026("HC26-NOTFOUND", {
    db: fakeDb({
      certificates2026: { data: null, error: null },
      participants2026: { data: participant, error: null },
    }),
  });
  assert.equal(result.outcome, "not_found");
  assert.equal(result.certificateId, "HC26-NOTFOUND");
});

test("certificate database error resolves as server_error, never not_found", async () => {
  const result = await verifyCertificate2026("HC26-JF1DAAAA", {
    db: fakeDb({
      certificates2026: { data: null, error: { code: "08006", message: "connection failure" } },
    }),
  });
  assert.equal(result.outcome, "server_error");
  assert.notEqual(result.outcome, "not_found");
});

test("participant database error resolves as server_error", async () => {
  const result = await verifyCertificate2026("HC26-JF1DAAAA", {
    db: fakeDb({
      certificates2026: { data: certificate, error: null },
      participants2026: { data: null, error: { code: "08006", message: "connection failure" } },
    }),
  });
  assert.equal(result.outcome, "server_error");
});

test("missing participant relationship resolves as data_inconsistent", async () => {
  const result = await verifyCertificate2026("HC26-JF1DAAAA", {
    db: fakeDb({
      certificates2026: { data: certificate, error: null },
      participants2026: { data: null, error: null },
    }),
  });
  assert.equal(result.outcome, "data_inconsistent");
  assert.equal(result.certificateId, "HC26-JF1DAAAA");
});

test("unexpected statuses fail safely and are never treated as valid", async () => {
  for (const status of ["pending", "expired", "", "VALID_EXTRA"]) {
    const result = await verifyCertificate2026("HC26-JF1DAAAA", {
      db: fakeDb({
        certificates2026: { data: { ...certificate, status }, error: null },
        participants2026: { data: participant, error: null },
      }),
    });
    assert.equal(result.outcome, "data_inconsistent", `status ${JSON.stringify(status)}`);
  }
});

test("status comparisons are case-insensitive and trimmed", async () => {
  const result = await verifyCertificate2026("HC26-JF1DAAAA", {
    db: fakeDb({
      certificates2026: { data: { ...certificate, status: " VALID " }, error: null },
      participants2026: { data: participant, error: null },
    }),
  });
  assert.equal(result.outcome, "valid");
});

test("empty certificate id resolves as not_found without querying", async () => {
  const db = {
    from() {
      throw new Error("database must not be queried for an empty id");
    },
  } as unknown as CertificateVerificationDb;
  const result = await verifyCertificate2026("   ", { db });
  assert.equal(result.outcome, "not_found");
  assert.equal(result.certificateId, null);
});
