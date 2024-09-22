import { type Content, type ContentObject, parseContent } from "./content";
import { referableParser, type References } from "./references";
import { type OpenAPISource } from "./openapi";
import { parseKvp, parseObject } from "./utils";

export interface RequestBodyObject {
  description?: string;
  content: ContentObject;
  required?: boolean;
}

export interface RequestBody {
  description?: string;
  content: Content;
  required: boolean;
  toString(): string;
}

async function _parseRequestBody(
  requestBody: RequestBodyObject,
  references: References,
  source: OpenAPISource,
): Promise<RequestBody> {
  const content = await parseContent("write", requestBody.content, references, source);
  const parsedKvps = [parseKvp("content", content)];
  const parsed = parseObject(parsedKvps);

  return {
    description: requestBody.description,
    content: content,
    required: Boolean(requestBody.required),
    toString: () => parsed,
  };
}

export const parseRequestBody = referableParser(_parseRequestBody);
