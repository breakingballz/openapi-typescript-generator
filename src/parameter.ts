import { type Referable, referableParser, type References } from "./references";
import { type OpenAPISource } from "./openapi";
import { type Schema, type SchemaObject, parseSchema } from "./schema";
import { ensureDefined, parseKvp, parseObject } from "./utils";

const PARAMETER_LOCATIONS = ["query", "header", "path", "cookie"] as const;

type ParameterLocation = (typeof PARAMETER_LOCATIONS)[number];

export interface ParameterObject {
  name: string;
  in: ParameterLocation;
  description?: string;
  required?: boolean;
  deprecated?: boolean;
  schema?: Referable<SchemaObject>;
  example?: unknown;
}

export interface Parameter {
  name: string;
  in: ParameterLocation;
  description?: string;
  required: boolean;
  deprecated: boolean;
  schema: Schema;
  example?: unknown;
  toString(): string;
}

export interface ParameterGroup {
  group: Record<string, Parameter>;
  required: boolean;
  toString(): string;
}

export interface ParameterGrouping extends Record<ParameterLocation, ParameterGroup> {
  required: boolean;
  toString(): string;
}

async function _parseParameter(
  parameter: ParameterObject,
  references: References,
  source: OpenAPISource,
): Promise<Parameter> {
  if (!parameter.schema) {
    throw new Error("Parameter encoding not supported");
  }

  const schema = await parseSchema(parameter.schema, references, source);
  const parsed = String(schema);

  return {
    in: parameter.in,
    name: parameter.name,
    description: parameter.description,
    required: Boolean(parameter.required),
    deprecated: Boolean(parameter.deprecated),
    schema,
    example: parameter.example,
    toString: () => parsed,
  };
}

export const parseParameter = referableParser(_parseParameter);

function getParameterGroup(parameters: Parameter[]): ParameterGroup {
  const kvps = parameters.map<[string, Parameter]>((parameter) => [parameter.name, parameter]);
  const parsedKvps = kvps.map(([key, val]) => parseKvp(key, val, val.required, true));
  const parsed = parseObject(parsedKvps);

  return {
    group: Object.fromEntries(kvps),
    required: parameters.some((parameter) => parameter.required),
    toString: () => parsed,
  };
}

function getParameterGrouping(parameters: Parameter[]): ParameterGrouping {
  const kvps = PARAMETER_LOCATIONS.map<[ParameterLocation, ParameterGroup]>((location) => [
    location,
    getParameterGroup(parameters.filter((parameter) => parameter.in === location)),
  ]);
  const grouping = Object.fromEntries(kvps) as Record<ParameterLocation, ParameterGroup>;
  const parsedKvps = Object.entries(grouping)
    .map(([key, val]) =>
      Object.keys(val.group).length ? parseKvp(key, val, val.required) : undefined,
    )
    .filter(ensureDefined);

  const parsed = parseObject(parsedKvps);

  return {
    ...grouping,
    required: Object.values(kvps).some(([, val]) => val.required),
    toString: () => parsed,
  };
}

export async function parseParameters(
  parameters: Referable<ParameterObject>[],
  references: References,
  source: OpenAPISource,
): Promise<ParameterGrouping> {
  const parsedParameters = await Promise.all(
    parameters.map((parameter) => parseParameter(parameter, references, source)),
  );

  return getParameterGrouping(parsedParameters);
}
