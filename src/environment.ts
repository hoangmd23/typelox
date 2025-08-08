import type {Token} from "./token.js";
import {RuntimeError} from "./lox.js";

export class Environment
{
    private readonly values = new Map<string, any>;
    public readonly enclosing: Environment | null;

    constructor(enclosing: Environment | null = null)
    {
        this.enclosing = enclosing;
    }

    define(name: string, value: any)
    {
        this.values.set(name, value);
    }

    get(name: Token): any
    {
        if (this.values.has(name.lexeme))
        {
            return this.values.get(name.lexeme);
        }

        if (this.enclosing != null)
        {
            return this.enclosing.get(name);
        }

        throw new RuntimeError(name, `Undefined variable ${name.lexeme}`);
    }

    get_at(distance: number, name: string)
    {
        return this.ancestor(distance).values.get(name);
    }

    ancestor(distance: number): Environment
    {
        let env: Environment = this;
        for (let i = 0; i < distance; i++)
        {
            env = env.enclosing!;
        }
        return env;
    }

    assign(name: Token, value: any)
    {
        if (this.values.has(name.lexeme))
        {
            this.values.set(name.lexeme, value);
            return;
        }

        if (this.enclosing != null)
        {
            this.enclosing.assign(name, value);
            return;
        }

        throw new RuntimeError(name, `Undefined variable ${name.lexeme}`);
    }

    assign_at(distance: number, name: Token, value: any)
    {
        return this.ancestor(distance).values.set(name.lexeme, value);
    }
}