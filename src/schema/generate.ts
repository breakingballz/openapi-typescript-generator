import { ensureDefined, parseKvp, parseObject } from "../utils";
import type { ParsedSchema, Schema } from "./types";
import { joinTypes } from "../utils";

const OBJECT = "Record<string, unknown>";
const ARRAY = "unknown[]";
const STRING = "string";
const BOOLEAN = "boolean";
const NUMBER = "number";
const UNKNOWN = "unknown";
const NULL = "null";

function generateArray(schema: ParsedSchema): string | undefined {
  if (!schema.items) {
    return undefined;
  }

  return `${schema.items}[]`;
}

function generateObject(schema: ParsedSchema): string | undefined {
  if (!schema.properties) {
    return undefined;
  }

  if (!Object.keys(schema.properties).length) {
    return OBJECT;
  }

  const kvps = Object.entries(schema.properties).map(([key, inner]) =>
    parseKvp(key, inner, true, true),
  );

  return parseObject(kvps);
}

function generatePrimitive(type: Schema["type"]): string | undefined {
  if (type instanceof Array) {
    return joinTypes(type.map((item) => generatePrimitive(item)).filter(ensureDefined), "|");
  }

  switch (type) {
    case "null":
      return "null";
    case "array":
      return ARRAY;
    case "boolean":
      return BOOLEAN;
    case "integer":
    case "number":
      return NUMBER;
    case "object":
      return OBJECT;
    case "string":
      return STRING;
    default:
      return undefined;
  }
}

function generateEnum(schema: ParsedSchema): string | undefined {
  if (!schema.enum?.length) {
    return undefined;
  }

  return joinTypes(
    schema.enum.map((item) => (typeof item === "string" ? `"${item}"` : String(item))),
    "|",
  );
}

export function generateType(schema: ParsedSchema): string {
  const enumerable = generateEnum(schema);
  const primitive = generatePrimitive(schema.type);
  const array = generateArray(schema);
  const obj = generateObject(schema);
  const allOf = schema.allOf?.map(String) ?? [];
  const oneOf = schema.oneOf?.map(String) ?? [];
  const anyOf = schema.anyOf?.map(String) ?? [];
  const not = schema.not ? String(schema.not) : undefined;
  const nullType = schema.nullable ? NULL : undefined;

  const simple = enumerable ?? array ?? obj ?? primitive;

  const andUnion = [simple, ...allOf].filter(ensureDefined);
  const joinedAnd = andUnion.length ? joinTypes(andUnion, "&") : undefined;

  const orUnion = [...oneOf, ...anyOf];
  const joinedOr = orUnion.length ? joinTypes(orUnion, "|") : undefined;

  let type: string | undefined;

  if (joinedAnd && joinedOr) {
    type = joinTypes([joinedAnd, joinedOr], "&");
  } else {
    type = joinedAnd ?? joinedOr;
  }

  type = joinTypes([type, nullType].filter(ensureDefined), "|") ?? UNKNOWN;

  return not ? `Exclude<${type}, ${not}>` : type;
}
