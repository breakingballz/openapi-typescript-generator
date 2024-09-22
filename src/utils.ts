import { parseDocs } from "./docs";
import type { OpenAPISource } from "./openapi";
import type { References } from "./references";

export function ensureDefined<T>(data: T | undefined): data is T {
  return data !== undefined;
}

export function joinTypes(types: string[], delimiter: "|" | "&"): string | undefined {
  if (!types.length) {
    return undefined;
  }

  const parsed = types.join(` ${delimiter} `);

  return types.length > 1 ? `(${parsed})` : parsed;
}

export function stringifyObject(obj: unknown): string {
  if (obj instanceof Array) {
    return `[ ${obj.map(stringifyObject).join(", ")} ]`;
  }

  if (typeof obj === "object" && obj !== null) {
    const parsed = `${obj}`;

    if (parsed !== "[object Object]") {
      return parsed;
    }

    return `{ ${Object.entries(obj)
      .map(([key, val]) => `${stringifyObject(key)}: ${stringifyObject(val)}`)
      .join("; ")} }`;
  }

  if (typeof obj === "string") {
    return `"${obj}"`;
  }

  return `${obj}`;
}

function qualifyName(name: unknown): string | number {
  if (typeof name === "number" || (!isNaN(Number(name)) && !String(name).includes("."))) {
    return Number(name);
  }

  if (typeof name === "string" && !name.match(/^[a-zA-Z_$][a-zA-Z0-9_$]*$/)) {
    return `"${name}"`;
  }

  return String(name);
}

function makeRequired(key: string | number, required: boolean): string {
  return required ? String(key) : `${key}?`;
}

export async function getKvps<T extends Record<string, U>, U, V>(
  obj: T,
  references: References,
  source: OpenAPISource,
  parser: (data: U, references: References, source: OpenAPISource) => Promise<V>,
): Promise<[keyof T, V][]> {
  return await Promise.all(
    Object.entries(obj).map(([key, val]) =>
      parser(val, references, source).then<[keyof T, V]>((value) => [key, value]),
    ),
  );
}

export function parseKvp<T extends object>(
  key: unknown,
  value: T,
  required = true,
  docs = false,
): string {
  return `${docs ? parseDocs(value) : ""}${makeRequired(qualifyName(key), required)}: ${value}`;
}

export function parseObject(kvps: string[]): string {
  return `{ ${kvps.join("; ")} }`;
}
