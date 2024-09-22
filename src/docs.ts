import { ensureDefined, stringifyObject } from "./utils";

const NEW_LINE = "\n * ";

function parseItem(item: string | undefined): string | undefined {
  return item?.length ? item.replaceAll("\n", NEW_LINE) : undefined;
}

function parseExample(example: unknown): string {
  return `@example ${stringifyObject(example)}`;
}

export function parseDocs(item: {
  title?: string;
  summary?: string;
  description?: string;
  deprecated?: boolean;
  example?: unknown;
  format?: string;
}): string {
  const items = [
    parseItem(item.title),
    parseItem(item.summary),
    parseItem(item.description),
    parseItem(item.deprecated ? "@deprecated" : undefined),
    parseItem(item.format ? `@format ${item.format}` : undefined),
    item.example === undefined ? undefined : parseExample(item.example),
  ].filter(ensureDefined);

  const pad = items.length > 1;

  if (items.length) {
    return `\n/**${pad ? NEW_LINE : " "}${items.join(`${NEW_LINE}${NEW_LINE}`)}${pad ? NEW_LINE : ""} */\n`;
  }

  return "";
}
