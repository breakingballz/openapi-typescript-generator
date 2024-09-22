import type { OpenAPISource } from "./openapi";
import { stringifyObject } from "./utils";

export interface Reference<T> {
  $ref: string;
}

type ReferenceObject = { toString(): string };

export type References = Record<string, Promise<ReferenceObject>>;

export type Referable<T> = T | Reference<T>;

const REFS_KEY = "Refs";

function isReference<T>(data: Referable<T>): data is Reference<T> {
  return typeof data === "object" && data !== null && "$ref" in data;
}

function formatRefPart(part: string): string {
  return part.replaceAll("~1", "/");
}

function getRefParts(ref: string): string[] {
  const [filepath, hash] = ref.split("#/");

  return [filepath as string, ...(hash?.split("/").map((part) => formatRefPart(part)) ?? [])];
}

async function resolveReference<T, U>(
  ref: string,
  func: (data: T, references: References, source: OpenAPISource) => Promise<U>,
  references: References,
  source: OpenAPISource,
): Promise<U> {
  const data = getRefParts(ref).reduce((prev, curr) => prev[curr] as OpenAPISource, source);

  return func(data as T, references, source);
}

function parseReference(ref: string): string {
  const parts = getRefParts(ref).map((part) => `["${formatRefPart(part)}"]`);

  return `${REFS_KEY}${parts.join("")}`;
}

export function referableParser<T, U>(
  func: (data: T, references: References, source: OpenAPISource) => Promise<U>,
): (data: Referable<T>, references: References, source: OpenAPISource) => Promise<U> {
  return async (data, references, source) => {
    if (isReference(data)) {
      references[data.$ref] =
        references[data.$ref] ??
        (resolveReference(data.$ref, func, references, source) as Promise<ReferenceObject>);

      const parsed = parseReference(data.$ref);

      return references[data.$ref]?.then((value) => ({ ...value, toString: () => parsed })) as U;
    }

    return func(data, references, source);
  };
}

export async function parseReferences(references: References): Promise<string> {
  const kvps = await Promise.all(
    Object.entries(references).map(([ref, val]) =>
      val.then<[string, ReferenceObject]>((value) => [ref, value]),
    ),
  );
  const result: Record<string, unknown> = {};

  kvps.forEach(([ref, val]) => {
    let current = result;

    getRefParts(ref).forEach((part, idx, arr) => {
      if (idx === arr.length - 1) {
        current[part] = val;
      } else {
        current = (current[part] = current[part] ?? {}) as Record<string, unknown>;
      }
    });
  });

  return `interface ${REFS_KEY} ${stringifyObject(result)}`;
}
