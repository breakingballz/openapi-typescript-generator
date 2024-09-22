import type { Referable, References } from "./references";
import type { OpenAPISource } from "./openapi";
import { type ResponseObject, type Response, parseResponse } from "./response";
import { getKvps, parseKvp, parseObject } from "./utils";

export interface ResponsesObject extends Record<number, Referable<ResponseObject>> {
  default?: Referable<ResponseObject>;
  "1XX"?: Referable<ResponseObject>;
  "2XX"?: Referable<ResponseObject>;
  "3XX"?: Referable<ResponseObject>;
  "4XX"?: Referable<ResponseObject>;
  "5XX"?: Referable<ResponseObject>;
}

export interface Responses extends Record<number, Response> {
  default?: Response;
  "1XX"?: Response;
  "2XX"?: Response;
  "3XX"?: Response;
  "4XX"?: Response;
  "5XX"?: Response;
  toString(): string;
}

export async function parseResponses(
  responses: ResponsesObject,
  references: References,
  source: OpenAPISource,
): Promise<Responses> {
  const kvps = await getKvps(
    responses as Record<string | number, Referable<ResponseObject>>,
    references,
    source,
    parseResponse,
  );

  const parsedKvps = kvps.map(([key, val]) => parseKvp(key, val, true, true));
  const parsed = parseObject(parsedKvps);

  return {
    toString: () => parsed,
  };
}
