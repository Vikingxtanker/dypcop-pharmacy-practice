import test from "node:test";
import assert from "node:assert/strict";
import { resolveRouteParam } from "./certificate-params.ts";

test("awaits a Promise of params and returns the real certificate id", async () => {
  const params = Promise.resolve({ certificateId: "HC26-JF1DAAAA" });
  const certificateId = await resolveRouteParam(params, "certificateId");
  assert.equal(certificateId, "HC26-JF1DAAAA");
  assert.notEqual(certificateId, "[object Promise]");
  assert.notEqual(certificateId, "undefined");
});

test("accepts a plain params object (non-Promise) for safety", async () => {
  const certificateId = await resolveRouteParam({ certificateId: "HC26-JF1DAAAA" }, "certificateId");
  assert.equal(certificateId, "HC26-JF1DAAAA");
});

test("awaits a token param", async () => {
  const token = await resolveRouteParam(Promise.resolve({ token: "abc.def" }), "token");
  assert.equal(token, "abc.def");
});

test("unknown or missing params resolve to an empty string", async () => {
  assert.equal(await resolveRouteParam(Promise.resolve({} as { certificateId: string }), "certificateId"), "");
  assert.equal(await resolveRouteParam(undefined, "certificateId"), "");
});

test("a non-string param value never stringifies to [object Promise]", async () => {
  const resolved = await resolveRouteParam(
    Promise.resolve({ certificateId: Promise.resolve("HC26-JF1DAAAA") as unknown as string }),
    "certificateId",
  );
  assert.equal(resolved, "");
});
