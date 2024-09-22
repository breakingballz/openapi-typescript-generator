import { type Referable, referableParser, type References } from "./references";
import type { OpenAPISource } from "./openapi";
import { parseSchema } from "./schema/schema";
import type { Schema, SchemaObject } from "./schema";
import { getKvps, parseKvp, parseObject } from "./utils";

export interface HeaderObject {
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: Referable<SchemaObject>;
  example?: unknown;
}

export interface Header {
  description?: string;
  required: boolean;
  deprecated: boolean;
  schema: Schema;
  example?: unknown;
  toString(): string;
}

export interface Headers {
  value: Record<string, Header>;
  required: boolean;
  toString(): string;
}

async function _parseHeader(
  header: HeaderObject,
  references: References,
  source: OpenAPISource,
): Promise<Header> {
  if (!header.schema) {
    throw new Error("Header encoding not supported");
  }

  const schema = await parseSchema(header.schema, references, source);
  const parsed = String(schema);

  return {
    description: header.description,
    required: Boolean(header.required),
    deprecated: Boolean(header.deprecated),
    schema,
    example: header.example,
    toString: () => parsed,
  };
}

export const parseHeader = referableParser(_parseHeader);

export async function parseHeaders(
  headers: Record<string, Referable<HeaderObject>>,
  references: References,
  source: OpenAPISource,
): Promise<Headers> {
  const kvps = await getKvps(headers, references, source, parseHeader);
  const parsedKvps = kvps.map(([key, val]) => parseKvp(key, val, val.required, true));
  const parsed = parseObject(parsedKvps);

  return {
    value: Object.fromEntries(kvps),
    required: kvps.some(([, header]) => header.required),
    toString: () => parsed,
  };
}
