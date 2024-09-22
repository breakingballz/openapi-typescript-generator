import type { Referable } from "../references";

type SchemaType = "string" | "number" | "integer" | "boolean" | "array" | "object" | "null";

type SchemaFormat = string;

export interface SchemaObject {
  title?: string;
  required?: string[];
  enum?: unknown[];
  type?: SchemaType | SchemaType[];
  allOf?: Referable<SchemaObject>[];
  oneOf?: Referable<SchemaObject>[];
  anyOf?: Referable<SchemaObject>[];
  not?: Referable<SchemaObject>;
  items?: Referable<SchemaObject>;
  properties?: Record<string, Referable<SchemaObject>>;
  additionalProperties?: boolean | Referable<SchemaObject>;
  description?: string;
  format?: SchemaFormat;
  default?: unknown;
  nullable?: boolean;
  readOnly?: boolean;
  writeOnly?: boolean;
  example?: unknown;
  deprecated?: boolean;
}

export interface Schema {
  title?: string;
  required: string[];
  enum?: unknown[];
  type?: SchemaType | SchemaType[];
  allOf?: Schema[];
  oneOf?: Schema[];
  anyOf?: Schema[];
  not?: Schema;
  items?: Schema;
  properties?: Record<string, Schema>;
  additionalProperties?: boolean | Schema;
  description?: string;
  format?: SchemaFormat;
  default?: unknown;
  nullable: boolean;
  readOnly: boolean;
  writeOnly: boolean;
  example?: unknown;
  deprecated: boolean;
  toString(topLevel?: boolean): string;
}

export type ParsedSchema = Omit<Schema, "toString">;
