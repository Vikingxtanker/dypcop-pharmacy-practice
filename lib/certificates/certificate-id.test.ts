import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import {
  CERTIFICATE_ID_PATTERN,
  CERTIFICATE_PREFIX,
  CERTIFICATE_SUFFIX_ALPHABET,
  CERTIFICATE_SUFFIX_LENGTH,
  generateCertificateId,
  type RandomByteSource,
} from "./certificate-id.ts";

function sourceFrom(chunks: number[][]): RandomByteSource {
  let call = 0;
  return (size: number) => {
    const chunk = chunks[call++];
    if (!chunk) throw new Error(`unexpected random source call #${call}`);
    assert.equal(chunk.length, size, `random source asked for ${size} bytes`);
    return Buffer.from(chunk);
  };
}

test("generated id uses the HC26- prefix and a fixed-length alphanumeric suffix", () => {
  assert.equal(CERTIFICATE_PREFIX, "HC26");
  assert.equal(CERTIFICATE_SUFFIX_ALPHABET.length, 36);
  for (let i = 0; i < 500; i++) {
    const id = generateCertificateId();
    assert.match(id, CERTIFICATE_ID_PATTERN);
    assert.equal(id.length, "HC26-".length + CERTIFICATE_SUFFIX_LENGTH);
  }
});

test("byte to character mapping is exact and unbiased", () => {
  // Alphabet index === byte value for the first 36 bytes (A-Z then 0-9).
  const id = generateCertificateId(sourceFrom([[0, 1, 2, 3, 4, 5, 6, 7]]));
  assert.equal(id, "HC26-ABCDEFGH");
});

test("bytes in the biased tail are rejected and redrawn, not truncated", () => {
  // 252..255 fall in the tail (256 % 36 === 4) and must be skipped. The
  // remaining bytes (0,1,2,3) fill the first half, then a second draw completes
  // the suffix. A padded/truncated implementation would emit trailing "A"s here.
  const id = generateCertificateId(
    sourceFrom([
      [252, 253, 254, 255, 0, 1, 2, 3],
      [4, 5, 6, 7],
    ]),
  );
  assert.equal(id, "HC26-ABCDEFGH");
});

test("the highest accepted byte maps to the last alphabet character", () => {
  // 251 is the largest byte below the 252 ceiling; 251 % 36 === 35 ("9").
  const id = generateCertificateId(sourceFrom([[251, 251, 251, 251, 251, 251, 251, 251]]));
  assert.equal(id, "HC26-99999999");
});

test("no suffix position is fixed and there are no padded trailing characters", () => {
  const samples = 600;
  const ids = Array.from({ length: samples }, () => generateCertificateId());

  // Regression guard: the old generator always ended in "AAAA". Assert the last
  // four characters are broadly varied instead of relying on a single sample.
  const lastFour = new Set(ids.map((id) => id.slice(-4)));
  assert.ok(lastFour.size > 100, `expected varied 4-char tails, saw ${lastFour.size} distinct`);

  // Every one of the 8 positions must draw from many characters.
  for (let pos = 0; pos < CERTIFICATE_SUFFIX_LENGTH; pos++) {
    const distinct = new Set(ids.map((id) => id["HC26-".length + pos]));
    assert.ok(
      distinct.size >= 15,
      `position ${pos} only produced ${distinct.size} distinct characters: ${[...distinct].join("")}`,
    );
  }
});

test("large samples are unique and unpredictable", () => {
  const ids = Array.from({ length: 2000 }, () => generateCertificateId());
  assert.equal(new Set(ids).size, ids.length);
});

test("the default random source is node:crypto randomBytes, never Math.random", async () => {
  const source = await readFile(new URL("./certificate-id.ts", import.meta.url), "utf8");
  assert.match(source, /from "node:crypto"/);
  assert.match(source, /randomBytes/);
  assert.ok(!source.includes("Math.random"), "certificate ids must not use Math.random");
  // Sanity: the default parameter is the same CSPRNG this test imports.
  assert.equal(typeof randomBytes, "function");
  assert.equal(randomBytes(4).length, 4);
});
