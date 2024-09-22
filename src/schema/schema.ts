import { type Referable, type References, referableParser } from "../references";
import type { OpenAPISource } from "../openapi";
import type { SchemaObject, Schema, ParsedSchema } from "./types";
import { generateType } from "./generate";

async function parseSchemas(
  schemas: Referable<SchemaObject>[],
  references: References,
  source: OpenAPISource,
): Promise<Schema[]> {
  return await Promise.all(schemas.map((schema) => parseSchema(schema, references, source)));
}

async function parseSchemaObject(
  schema: SchemaObject,
  references: References,
  source: OpenAPISource,
): Promise<ParsedSchema> {
  const additionalProperties =
    typeof schema.additionalProperties === "boolean"
      ? schema.additionalProperties
      : typeof schema.additionalProperties === "object"
        ? await parseSchema(schema.additionalProperties, references, source)
        : undefined;

  const properties = schema.properties
    ? Object.fromEntries(
        await Promise.all(
          Object.entries(schema.properties).map(([prop, inner]) =>
            parseSchema(inner, references, source).then<[string, Schema]>((value) => [prop, value]),
          ),
        ),
      )
    : undefined;

  return {
    deprecated: Boolean(schema.deprecated),
    nullable: Boolean(schema.nullable),
    readOnly: Boolean(schema.readOnly),
    writeOnly: Boolean(schema.writeOnly),
    additionalProperties,
    allOf: schema.allOf ? await parseSchemas(schema.allOf, references, source) : undefined,
    anyOf: schema.anyOf ? await parseSchemas(schema.anyOf, references, source) : undefined,
    oneOf: schema.oneOf ? await parseSchemas(schema.oneOf, references, source) : undefined,
    not: schema.not ? await parseSchema(schema.not, references, source) : undefined,
    default: schema.default,
    description: schema.description,
    enum: schema.enum,
    example: schema.example,
    format: schema.format,
    items: schema.items ? await parseSchema(schema.items, references, source) : undefined,
    properties,
    required: schema.required ?? [],
    title: schema.title,
    type: schema.type,
  };
}

async function _parseSchema(
  schemaObj: SchemaObject,
  references: References,
  source: OpenAPISource,
): Promise<Schema> {
  const schema = await parseSchemaObject(schemaObj, references, source);
  const parsed = generateType(schema);

  return {
    ...schema,
    toString: () => parsed,
  };
}

export const parseSchema = referableParser(_parseSchema);
