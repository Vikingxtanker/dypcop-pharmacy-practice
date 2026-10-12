import test from "node:test";
import assert from "node:assert/strict";
import {
  markCertificateDownloaded,
  type CertificateDownloadDb,
  type CertificateDownloadDbError,
} from "./certificate-download.ts";

const LEGACY_ID = "HC26-JF1DAAAA";

interface FakeOptions {
  downloaded?: boolean;
  exists?: boolean;
  selectError?: CertificateDownloadDbError;
  updateError?: CertificateDownloadDbError;
}

function fakeDb(options: FakeOptions = {}): {
  db: CertificateDownloadDb;
  updateCalls: { downloaded: boolean; certificateId: string }[];
  isDownloaded: () => boolean;
} {
  const exists = options.exists ?? true;
  let downloaded = options.downloaded ?? false;
  const updateCalls: { downloaded: boolean; certificateId: string }[] = [];
  const db = {
    from() {
      return {
        select: () => ({
          eq: (_column: string, value: string) => ({
            maybeSingle: async () => {
              if (options.selectError) return { data: null, error: options.selectError };
              if (!exists) return { data: null, error: null };
              return { data: { certificate_id: value, downloaded }, error: null };
            },
          }),
        }),
        update: (values: { downloaded: boolean }) => ({
          eq: (_column: string, value: string) => {
            updateCalls.push({ downloaded: values.downloaded, certificateId: value });
            if (options.updateError) return Promise.resolve({ data: null, error: options.updateError });
            downloaded = values.downloaded;
            return Promise.resolve({ data: null, error: null });
          },
        }),
      };
    },
  } as unknown as CertificateDownloadDb;
  return { db, updateCalls, isDownloaded: () => downloaded };
}

test("marks an existing, not-yet-downloaded certificate as downloaded", async () => {
  const { db, updateCalls, isDownloaded } = fakeDb({ downloaded: false });

  const outcome = await markCertificateDownloaded(LEGACY_ID, { db });

  assert.equal(outcome, "marked");
  assert.equal(isDownloaded(), true);
  assert.equal(updateCalls.length, 1);
  assert.deepEqual(updateCalls[0], { downloaded: true, certificateId: LEGACY_ID });
});

test("normalizes surrounding whitespace before matching", async () => {
  const { db, updateCalls } = fakeDb();

  const outcome = await markCertificateDownloaded(`  ${LEGACY_ID}  `, { db });

  assert.equal(outcome, "marked");
  assert.equal(updateCalls[0].certificateId, LEGACY_ID);
});

test("is idempotent: an already-downloaded certificate is not written again", async () => {
  const { db, updateCalls } = fakeDb({ downloaded: true });

  const outcome = await markCertificateDownloaded(LEGACY_ID, { db });

  assert.equal(outcome, "already_downloaded");
  assert.equal(updateCalls.length, 0);
});

test("repeated downloads leave the flag true and write only once", async () => {
  const { db, updateCalls, isDownloaded } = fakeDb({ downloaded: false });

  assert.equal(await markCertificateDownloaded(LEGACY_ID, { db }), "marked");
  assert.equal(await markCertificateDownloaded(LEGACY_ID, { db }), "already_downloaded");
  assert.equal(await markCertificateDownloaded(LEGACY_ID, { db }), "already_downloaded");

  assert.equal(isDownloaded(), true);
  assert.equal(updateCalls.length, 1);
});

test("a certificate that is never downloaded stays false", async () => {
  const { db, updateCalls, isDownloaded } = fakeDb({ downloaded: false });

  assert.equal(isDownloaded(), false);
  assert.equal(updateCalls.length, 0);
  // guard against accidental unused-var lint masking the intent
  void db;
});

test("returns not_found for a certificate that does not exist and does not write", async () => {
  const { db, updateCalls } = fakeDb({ exists: false });

  const outcome = await markCertificateDownloaded(LEGACY_ID, { db });

  assert.equal(outcome, "not_found");
  assert.equal(updateCalls.length, 0);
});

test("rejects malformed ids without querying the database", async () => {
  const db = {
    from() {
      throw new Error("database must not be queried for an invalid certificate id");
    },
  } as unknown as CertificateDownloadDb;

  for (const invalid of ["", "   ", "not-a-cert", "HC26-ABC", "hc26-jf1daaaa", null, 42]) {
    assert.equal(await markCertificateDownloaded(invalid, { db }), "invalid_id", `invalid ${JSON.stringify(invalid)}`);
  }
});

test("a lookup error is a server_error and never marks the certificate", async () => {
  const { db, updateCalls } = fakeDb({ selectError: { code: "08006", message: "connection failure" } });

  const outcome = await markCertificateDownloaded(LEGACY_ID, { db });

  assert.equal(outcome, "server_error");
  assert.equal(updateCalls.length, 0);
});

test("an update error is reported as server_error", async () => {
  const { db } = fakeDb({ downloaded: false, updateError: { code: "42501", message: "permission denied" } });

  const outcome = await markCertificateDownloaded(LEGACY_ID, { db });

  assert.equal(outcome, "server_error");
});

test("only the downloaded column is updated", async () => {
  const capturedValues: Record<string, unknown>[] = [];
  const db = {
    from() {
      return {
        select: () => ({
          eq: () => ({ maybeSingle: async () => ({ data: { certificate_id: LEGACY_ID, downloaded: false }, error: null }) }),
        }),
        update: (values: Record<string, unknown>) => {
          capturedValues.push(values);
          return { eq: () => Promise.resolve({ data: null, error: null }) };
        },
      };
    },
  } as unknown as CertificateDownloadDb;

  await markCertificateDownloaded(LEGACY_ID, { db });

  assert.equal(capturedValues.length, 1);
  assert.deepEqual(capturedValues[0], { downloaded: true });
});
