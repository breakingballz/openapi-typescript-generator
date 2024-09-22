import type { References } from "../references";
import type { OpenAPISource } from "../openapi";
import { parseSchema } from "../schema";
import { ensureDefined, joinTypes, parseObject } from "../utils";
import { getExcluded, getRequired } from "./helpers";
import type { MediaType, MediaTypeObject, Mode } from "./types";

export async function parseMediaType(
  mode: Mode,
  mediaType: MediaTypeObject,
  references: References,
  source: OpenAPISource,
): Promise<MediaType> {
  if (!mediaType.schema) {
    throw new Error("MediaType encoding not supported");
  }

  const schema = await parseSchema(mediaType.schema, references, source);

  const exclude = joinTypes(
    getExcluded(mode, schema).map((item) => `"${item}"`),
    "|",
  );
  const require = joinTypes(
    getRequired(mode, schema).map((item) => `"${item}"`),
    "|",
  );

  let parsed = String(schema);

  if (exclude || require) {
    parsed = `Content<${parsed}, ${parseObject(
      [
        exclude ? `exclude: ${exclude}` : undefined,
        require ? `require: ${require}` : undefined,
      ].filter(ensureDefined),
    )}>`;
  }

  return {
    example: mediaType.example,
    schema,
    toString: () => parsed,
  };
}
