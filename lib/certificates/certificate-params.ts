/**
 * Next.js 16 dynamic route `params` are Promises. Reading a property off the
 * Promise (instead of awaiting it) yields `undefined`, which is the root cause
 * of the false "Certificate Not Found" result. This helper centralises the
 * await so every certificate route resolves the real string value.
 */
export function resolveRouteParam<K extends string>(
  params: Promise<Record<K, string>> | Record<K, string> | undefined,
  key: K,
): Promise<string> {
  return (async () => {
    const resolved = await params;
    if (!resolved || typeof resolved !== "object") return "";
    const value = (resolved as Record<string, unknown>)[key];
    return typeof value === "string" ? value : "";
  })();
}
