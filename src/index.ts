import { Argument, Command } from "commander";
import { generate } from "./generate";
export { generate };

const program = new Command();

program.option("-o, --output <FILENAME>", "Output file", "generated-types.ts");
program.addArgument(new Argument("source", "Source file"));
program.parse();

const [source] = program.args as [string];
const { output: target } = program.opts() as { output?: string };

if (!target) {
  process.exit("Missing source file");
}

generate(source, target);
