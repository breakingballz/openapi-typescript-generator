import type { Referable } from "../references";
import type { Schema, SchemaObject } from "../schema";

export type Mode = "read" | "write";

export interface MediaTypeObject {
  example?: unknown;
  schema?: Referable<SchemaObject>;
}

export interface MediaType {
  example?: unknown;
  schema: Schema;
  toString(): string;
}
