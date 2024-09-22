import type { Schema } from "../schema";
import type { Mode } from "./types";

function getPrefix(base: string, next: string): string {
  if (base === "") {
    return next;
  }

  return `${base}.${next}`;
}

export function getExcluded(mode: Mode, schema: Schema, prefix = ""): string[] {
  const attr = mode === "read" ? "writeOnly" : "readOnly";
  const excluded: string[] = [];

  if (schema[attr] && prefix.length) {
    excluded.push(prefix);
  }

  excluded.push(...(schema.allOf ?? []).flatMap((inner) => getExcluded(mode, inner, prefix)));
  excluded.push(...(schema.anyOf ?? []).flatMap((inner) => getExcluded(mode, inner, prefix)));
  excluded.push(...(schema.oneOf ?? []).flatMap((inner) => getExcluded(mode, inner, prefix)));
  excluded.push(
    ...Object.entries(schema.properties ?? {}).flatMap(([key, inner]) =>
      getExcluded(mode, inner, getPrefix(prefix, key)),
    ),
  );
  excluded.push(...(schema.items ? getExcluded(mode, schema.items, prefix) : []));

  return Array.from(new Set(excluded));
}

export function getRequired(mode: Mode, schema: Schema, prefix = ""): string[] {
  const required = schema.required.map((item) => getPrefix(prefix, item));

  // Schemas with default values are optional when writing but required when reading
  if (mode === "read" && schema.default && prefix.length) {
    required.push(prefix);
  }

  required.push(...(schema.allOf ?? []).flatMap((inner) => getRequired(mode, inner, prefix)));
  required.push(...(schema.anyOf ?? []).flatMap((inner) => getRequired(mode, inner, prefix)));
  required.push(...(schema.oneOf ?? []).flatMap((inner) => getRequired(mode, inner, prefix)));
  required.push(
    ...Object.entries(schema.properties ?? {}).flatMap(([key, inner]) =>
      getRequired(mode, inner, getPrefix(prefix, key)),
    ),
  );
  required.push(...(schema.items ? getRequired(mode, schema.items, prefix) : []));

  return Array.from(new Set(required));
}
