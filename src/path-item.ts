import { type Operation, type OperationObject, parseOperation } from "./operation";
import { type ParameterGrouping, type ParameterObject, parseParameters } from "./parameter";
import { type Referable, referableParser, type References } from "./references";
import { type OpenAPISource } from "./openapi";
import { ensureDefined, getKvps, parseKvp, parseObject } from "./utils";

const METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"] as const;

type Method = (typeof METHODS)[number];

export interface PathItemObject extends Partial<Record<Method, OperationObject>> {
  summary?: string;
  description?: string;
  parameters?: Referable<ParameterObject>[];
}

export interface PathItem extends Partial<Record<Method, Operation>> {
  summary?: string;
  description?: string;
  parameters?: ParameterGrouping;
  toString(): string;
}

async function _parsePathItem(
  pathItem: PathItemObject,
  references: References,
  source: OpenAPISource,
): Promise<PathItem> {
  const { summary, description, parameters: parametersRaw, ...methods } = pathItem;

  const [operations, parameters] = await Promise.all([
    getKvps(methods, references, source, parseOperation),
    parametersRaw?.length ? parseParameters(parametersRaw, references, source) : undefined,
  ]);

  const parsedKvps = [
    ...operations.map(([key, val]) => parseKvp(key, val, true, true)),
    parameters ? parseKvp("parameters", parameters, parameters.required) : undefined,
  ].filter(ensureDefined);

  const parsed = parseObject(parsedKvps);

  return {
    ...Object.fromEntries(operations),
    summary: pathItem.summary,
    description: pathItem.description,
    parameters,
    toString: () => parsed,
  };
}

export const parsePathItem = referableParser(_parsePathItem);
