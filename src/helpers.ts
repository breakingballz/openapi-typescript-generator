const HELPERS = `\
/* This file was auto-generated; DO NOT MODIFY IT'S CONTENTS */

interface Options {
  exclude?: string;
  require?: string;
};

type StepEntry<T, K extends string | number | symbol> = K extends string | number
  ? {
      [key in T as string]: key extends \`\${K}.\${infer U}\` ? U : never;
    }[string] extends infer Out extends string
    ? Out
    : never
  : never;

type StepOptions<T extends Options, K extends string | number | symbol> = {
  exclude: StepEntry<T["exclude"], K>;
  require: StepEntry<T["require"], K>;
};

type Content<
  T,
  TOptions extends Options = {},
  TExclude extends keyof T = Extract<TOptions["exclude"], keyof T>,
  TRequire extends keyof T = Extract<TOptions["require"], keyof T>,
> = T extends (infer A)[]
  ? Content<A, TOptions>[]
  : T extends object
    ? {
        [key in Exclude<keyof T, TRequire> as key extends TExclude ? never : key]?:
          | Content<Exclude<T[key], null>, StepOptions<TOptions, key>>
          | (null extends T[key] ? null : never);
      } & {
        [key in TRequire as key extends TExclude ? never : key]:
          | Content<Exclude<T[key], null>, StepOptions<TOptions, key>>
          | (null extends T[key] ? null : never);
      } extends infer TOut
      ? { [key in keyof TOut]: TOut[key] }
      : never
    : T`;

export function getHelpers(): string {
  return HELPERS;
}
