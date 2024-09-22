import fs from "fs/promises";
import { existsSync } from "fs";
import { format } from "prettier";
import { type OpenAPISource, type OpenAPIObject, parseOpenAPI } from "./openapi";
import { parseReferences, type References } from "./references";
import { getHelpers } from "./helpers";
import { parseRef, resolveRef } from "json-schema-resolver";
import path from "path";

async function putDir(filepath: string): Promise<void> {
  const dirname = path.dirname(filepath);

  if (existsSync(dirname)) {
    return;
  }

  return fs.mkdir(dirname);
}

async function generateTS(openapi: OpenAPIObject, source: OpenAPISource): Promise<string> {
  const references: References = {};
  const parsedOpenAPI = await parseOpenAPI(openapi, references, source);
  const parsedReferences = await parseReferences(references);
  const items = [getHelpers(), parsedOpenAPI, parsedReferences];
  const stringified = items.join(";\n\n");

  return format(stringified, {
    parser: "typescript",
    printWidth: 100,
    trailingComma: "all",
    tabWidth: 2,
  });
}

export async function generate(source: string, target: string): Promise<void> {
  const ref = parseRef(source);
  const resolvedRef = await resolveRef(ref);
  const content = await generateTS(resolvedRef.root as unknown as OpenAPIObject, resolvedRef);

  await putDir(target);
  await fs.writeFile(target, content, "utf-8");
}
