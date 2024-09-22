import { type ParameterGrouping, type ParameterObject, parseParameters } from "./parameter";
import type { Referable, References } from "./references";
import type { OpenAPISource } from "./openapi";
import { parseRequestBody, type RequestBody, type RequestBodyObject } from "./request-body";
import { parseResponses, type Responses, type ResponsesObject } from "./responses";
import { ensureDefined, parseKvp, parseObject } from "./utils";

export interface OperationObject {
  summary?: string;
  description?: string;
  parameters?: Referable<ParameterObject>[];
  requestBody?: Referable<RequestBodyObject>;
  responses: ResponsesObject;
  deprecated?: boolean;
}

export interface Operation {
  summary?: string;
  description?: string;
  parameters?: ParameterGrouping;
  requestBody?: RequestBody;
  responses: Responses;
  deprecated: boolean;
  toString(): string;
}

export async function parseOperation(
  operation: OperationObject,
  references: References,
  source: OpenAPISource,
): Promise<Operation> {
  const [parameters, requestBody, responses] = await Promise.all([
    operation.parameters?.length
      ? parseParameters(operation.parameters, references, source)
      : undefined,
    operation.requestBody ? parseRequestBody(operation.requestBody, references, source) : undefined,
    parseResponses(operation.responses, references, source),
  ]);

  const parsedKvps = [
    parameters ? parseKvp("parameters", parameters, parameters.required) : undefined,
    requestBody ? parseKvp("requestBody", requestBody, requestBody.required, true) : undefined,
    parseKvp("responses", responses),
  ].filter(ensureDefined);

  const parsed = parseObject(parsedKvps);

  return {
    summary: operation.summary,
    description: operation.description,
    parameters,
    requestBody,
    responses,
    deprecated: Boolean(operation.deprecated),
    toString: () => parsed,
  };
}
