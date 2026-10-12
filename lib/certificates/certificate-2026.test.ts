import test from "node:test";
import assert from "node:assert/strict";
import {
  getOrCreateCertificate,
  type CertificateDb,
  type CertificateRecord,
} from "./certificate-2026.ts";
import { CERTIFICATE_ID_PATTERN, generateCertificateId } from "./certificate-id.ts";
import { mintCertificateToken, normalizeCertificateId, redeemCertificateToken } from "./certificate-token.ts";

const PARTICIPANT_ID = "11111111-1111-1111-1111-111111111111";

interface DbResult {
  data: CertificateRecord | null;
  error: { code?: string; message?: string } | null;
}

function certificate(overrides: Partial<CertificateRecord> = {}): CertificateRecord {
  return {
    id: "cert-1",
    certificate_id: "HC26-JF1DAAAA",
    participant_id: PARTICIPANT_ID,
    issued_at: "2026-10-08T00:00:00.000Z",
    status: "valid",
    ...overrides,
  };
}

function fakeDb(options: { select?: DbResult; inserts?: DbResult[] }): {
  db: CertificateDb;
  insertCalls: Record<string, unknown>[];
} {
  const insertCalls: Record<string, unknown>[] = [];
  let insertIndex = 0;
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: async () => options.select ?? { data: null, error: null },
    insert: (values: Record<string, unknown>) => {
      insertCalls.push(values);
      const result = options.inserts?.[insertIndex++] ?? { data: null, error: null };
      return { select: () => ({ single: async () => result }) };
    },
  };
  return { db: { from: () => builder } as unknown as CertificateDb, insertCalls };
}

function duplicateIdError(): DbResult {
  return { data: null, error: { code: "23505", message: "duplicate key value violates unique constraint certificate_id" } };
}

test("reuses the existing certificate for a participant without inserting", async () => {
  const existing = certificate();
  const { db, insertCalls } = fakeDb({ select: { data: existing, error: null } });

  const result = await getOrCreateCertificate(PARTICIPANT_ID, async () => db);

  assert.equal(result.certificate_id, existing.certificate_id);
  assert.equal(insertCalls.length, 0);
});

test("creates a new certificate with a valid random-looking id when none exists", async () => {
  const created = certificate({ certificate_id: generateCertificateId(), id: "cert-new" });
  const { db, insertCalls } = fakeDb({ inserts: [{ data: created, error: null }] });

  const result = await getOrCreateCertificate(PARTICIPANT_ID, async () => db);

  assert.equal(result.id, "cert-new");
  assert.equal(insertCalls.length, 1);
  assert.match(String(insertCalls[0].certificate_id), CERTIFICATE_ID_PATTERN);
  assert.equal(insertCalls[0].participant_id, PARTICIPANT_ID);
  assert.equal(insertCalls[0].status, "valid");
});

test("retries with a fresh id on certificate_id collisions until it succeeds", async () => {
  const created = certificate({ certificate_id: "HC26-ABCDEFGH", id: "cert-created" });
  const { db, insertCalls } = fakeDb({
    inserts: [duplicateIdError(), duplicateIdError(), { data: created, error: null }],
  });

  const result = await getOrCreateCertificate(PARTICIPANT_ID, async () => db);

  assert.equal(result.id, "cert-created");
  assert.equal(insertCalls.length, 3);
  for (const call of insertCalls) {
    assert.match(String(call.certificate_id), CERTIFICATE_ID_PATTERN);
  }
  const attemptedIds = new Set(insertCalls.map((call) => call.certificate_id));
  assert.equal(attemptedIds.size, insertCalls.length);
});

test("gives up safely after repeated certificate_id collisions", async () => {
  const { db, insertCalls } = fakeDb({
    inserts: Array.from({ length: 5 }, () => duplicateIdError()),
  });

  await assert.rejects(
    () => getOrCreateCertificate(PARTICIPANT_ID, async () => db),
    /Failed to generate unique certificate ID after retries/,
  );
  assert.equal(insertCalls.length, 5);
});

test("propagates non-collision insert errors instead of retrying", async () => {
  const { db, insertCalls } = fakeDb({
    inserts: [{ data: null, error: { code: "42501", message: "permission denied" } }],
  });

  await assert.rejects(
    () => getOrCreateCertificate(PARTICIPANT_ID, async () => db),
    (error: { code?: string }) => error.code === "42501",
  );
  assert.equal(insertCalls.length, 1);
});

test("propagates real lookup errors and only treats PGRST116 as 'no row'", async () => {
  const failing = fakeDb({ select: { data: null, error: { code: "08006", message: "connection failure" } } });
  await assert.rejects(() => getOrCreateCertificate(PARTICIPANT_ID, async () => failing.db));

  const noRow = fakeDb({
    select: { data: null, error: { code: "PGRST116", message: "no rows" } },
    inserts: [{ data: certificate({ id: "cert-2" }), error: null }],
  });
  const result = await getOrCreateCertificate(PARTICIPANT_ID, async () => noRow.db);
  assert.equal(result.id, "cert-2");
  assert.equal(noRow.insertCalls.length, 1);
});

test("legacy and newly issued ids remain verifiable via the signed token", () => {
  const legacyId = "HC26-JF1DAAAA";
  assert.equal(normalizeCertificateId(legacyId), legacyId);
  assert.deepEqual(redeemCertificateToken(mintCertificateToken(legacyId)), { certificateId: legacyId });

  const newId = generateCertificateId();
  assert.equal(normalizeCertificateId(newId), newId);
  assert.deepEqual(redeemCertificateToken(mintCertificateToken(newId)), { certificateId: newId });
});
