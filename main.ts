import * as path from "path";
import {Lox} from "./src/lox.js";

const args = process.argv.slice(2);

if (args.length !== 1)
{
    console.error("Usage: node main.js <input_file>");
    process.exit(1);
}

Lox.run(path.resolve(args[0]!));
