import { type Content, type ContentObject, parseContent } from "./content";
import { type HeaderObject, type Headers, parseHeaders } from "./header";
import { type Referable, referableParser, type References } from "./references";
import { type OpenAPISource } from "./openapi";
import { ensureDefined, parseKvp, parseObject } from "./utils";

export interface ResponseObject {
  description: string;
  headers?: Record<string, Referable<HeaderObject>>;
  content?: ContentObject;
}

export interface Response {
  description: string;
  headers?: Headers;
  content?: Content;
  toString(): string;
}

async function _parseResponse(
  response: ResponseObject,
  references: References,
  source: OpenAPISource,
): Promise<Response> {
  const [content, headers] = await Promise.all([
    response.content ? parseContent("read", response.content, references, source) : undefined,
    response.headers ? parseHeaders(response.headers, references, source) : undefined,
  ]);

  const parsedKvps = [
    content ? parseKvp("content", content) : undefined,
    headers ? parseKvp("headers", headers, headers.required) : undefined,
  ].filter(ensureDefined);

  const parsed = parseObject(parsedKvps);

  return {
    description: response.description,
    headers,
    content,
    toString: () => parsed,
  };
}

export const parseResponse = referableParser(_parseResponse);
