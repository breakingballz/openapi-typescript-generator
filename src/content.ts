import { type MediaType, type MediaTypeObject, type Mode, parseMediaType } from "./media-type";
import type { References } from "./references";
import type { OpenAPISource } from "./openapi";
import { getKvps, parseKvp, parseObject } from "./utils";

export type ContentObject = Record<string, MediaTypeObject>;

export interface Content {
  content: Record<string, MediaType>;
  toString(): string;
}

export async function parseContent(
  mode: Mode,
  content: ContentObject,
  references: References,
  source: OpenAPISource,
): Promise<Content> {
  const kvps = await getKvps(content, references, source, parseMediaType.bind(undefined, mode));
  const parsedKvps = kvps.map(([key, val]) => parseKvp(key, val, true, true));
  const parsed = parseObject(parsedKvps);

  return {
    content: Object.fromEntries(kvps),
    toString: () => parsed,
  };
}
