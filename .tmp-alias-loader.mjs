import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const abs = path.join(ROOT, specifier.slice(2));
    if (!path.extname(abs) && existsSync(`${abs}.ts`)) return nextResolve(pathToFileURL(`${abs}.ts`).href, context);
    return nextResolve(pathToFileURL(abs).href, context);
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const abs = path.resolve(path.dirname(context.parentURL ? fileURLToPath(context.parentURL) : ROOT), specifier);
    if (!path.extname(abs) && existsSync(`${abs}.ts`)) return nextResolve(pathToFileURL(`${abs}.ts`).href, context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url.startsWith("file:") && url.endsWith(".ts")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    return { format: "module-typescript", source, shortCircuit: true };
  }
  return nextLoad(url, context);
}