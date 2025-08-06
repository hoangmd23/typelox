import fs from "node:fs";
import {Token} from "./token.js";
import {Parser} from "./parser.js";
import {Interpreter} from "./interpreter.js";
import {Lexer} from "./lexer.js";
import {Resolver} from "./resolver.js";

export class RuntimeError extends Error
{
    readonly token: Token;

    constructor(token: Token, message: string)
    {
        super(message);
        this.token = token;
    }
}

export class Lox
{
    private static readonly interpreter = new Interpreter();
    static had_runtime_error: boolean = false;

    public static error(line: number, message: string)
    {
        console.log(`Error: ${message}`);
    }

    public static runtime_error(error: RuntimeError): void
    {
        console.log(`${error.message}\n[line ${error.token.line}]`);
        this.had_runtime_error = true;
    }

    public static run(file_path: string): void
    {
        const content = fs.readFileSync(file_path, 'utf-8');
        const lexer = new Lexer(content);
        const tokens = lexer.scan_tokens();
        // for (const token of tokens)
        // {
        //     console.log(token.toString());
        // }
        const parser = new Parser(tokens);
        const stmts = parser.parse();
        const resolver = new Resolver(this.interpreter);
        resolver.resolve_statements(stmts);
        this.interpreter.interpret(stmts);
    }
}