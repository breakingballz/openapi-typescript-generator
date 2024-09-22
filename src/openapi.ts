import { parsePathItem, type PathItem, type PathItemObject } from "./path-item";
import type { Referable, References } from "./references";
import { getKvps, parseKvp, parseObject } from "./utils";

export type OpenAPISource = Record<string, unknown>;

export interface OpenAPIObject {
  paths: Record<string, Referable<PathItemObject>>;
}

const OPENAPI_KEY = "Paths";

export interface OpenAPI {
  paths: Record<string, PathItem>;
  toString(): string;
}

export async function parseOpenAPI(
  openapi: OpenAPIObject,
  references: References,
  source: OpenAPISource,
): Promise<OpenAPI> {
  const kvps = await getKvps(openapi.paths, references, source, parsePathItem);
  const parsedKvps = kvps.map(([key, val]) => parseKvp(key, val, true, true));
  const parsed = `export interface ${OPENAPI_KEY} ${parseObject(parsedKvps)}`;

  return {
    paths: Object.fromEntries(kvps),
    toString: () => parsed,
  };
}
