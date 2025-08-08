import {Token, TokenType} from "./token.js";
import {Lox, RuntimeError} from "./lox.js";
import {
    AssignExpr,
    BinaryExpr,
    CallExpr,
    Expr,
    type ExprVisitor, GetExpr,
    GroupingExpr,
    LiteralExpr,
    LogicalExpr, SetExpr, SuperExpr, ThisExpr,
    UnaryExpr,
    VarExpr
} from "./expression.js";
import {
    BlockStmt,
    ClassStmt,
    type ExprStmt,
    FunctionStmt,
    IfStmt,
    type PrintStmt,
    ReturnStmt,
    Stmt,
    type StmtVisitor,
    VarStmt,
    WhileStmt
} from "./statement.js";
import {Environment} from "./environment.js";

class Return extends Error
{
    readonly value: any;

    constructor(value: any)
    {
        super();
        this.value = value;
    }
}

export abstract class LoxCallable
{
    abstract call(i: Interpreter, args: any[]): any;

    abstract arity(): number;

    abstract to_string(): string;
}

export class LoxFunction extends LoxCallable
{
    private readonly func: FunctionStmt;
    private readonly closure: Environment;
    private readonly is_initializer: boolean;

    constructor(f: FunctionStmt, closure: Environment, is_initializer: boolean)
    {
        super();
        this.func = f;
        this.closure = closure;
        this.is_initializer = is_initializer;
    }

    arity(): number
    {
        return this.func.params.length;
    }

    call(i: Interpreter, args: any[]): any
    {
        const env = new Environment(this.closure);
        for (let i = 0; i < this.func.params.length; i++)
        {
            env.define(this.func.params[i]!.lexeme, args[i]);
        }

        try
        {
            i.execute_block(this.func.body, env);
        }
        catch (ex)
        {
            if (ex instanceof Return)
            {
                if (this.is_initializer)
                {
                    return this.closure.get_at(0, 'this');
                }
                return ex.value;
            }
            else
            {
                throw ex;
            }
        }
        if (this.is_initializer)
            return this.closure.get_at(0, 'this');
        return null;
    }

    bind(instance: LoxInstance): LoxFunction
    {
        const env = new Environment(this.closure);
        env.define("this", instance);
        return new LoxFunction(this.func, env, this.is_initializer);
    }

    to_string(): string
    {
        return `<fn ${this.func.name.lexeme}>`;
    }
}

class GlobalClock extends LoxCallable
{
    arity(): number
    {
        return 0;
    }

    call(i: Interpreter, args: any[]): any
    {
        return Date.now();
    }

    to_string(): string
    {
        return "<GlobalClock>";
    }
}

class LoxInstance
{
    private klass: LoxClass;
    private readonly fields = new Map<string, any>();

    constructor(klass: LoxClass)
    {
        this.klass = klass;
    }

    get(name: Token): any
    {
        if (this.fields.has(name.lexeme))
        {
            return this.fields.get(name.lexeme);
        }

        const method = this.klass.find_method(name.lexeme);
        if (method != null)
            return method.bind(this);

        throw new RuntimeError(name, `Undefined property ${name.lexeme}`);
    }

    set(name: Token, value: any): void
    {
        this.fields.set(name.lexeme, value);
    }
}

class LoxClass extends LoxCallable
{
    readonly name: String;
    readonly superclass: LoxClass | null;
    readonly methods: Map<string, LoxFunction>;

    constructor(name: string, superclass: LoxClass | null, methods: Map<string, LoxFunction>)
    {
        super();
        this.name = name;
        this.superclass = superclass;
        this.methods = methods;
    }

    arity(): number
    {
        const initializer = this.find_method('init');
        if (initializer == null)
            return 0;
        return initializer.arity();
    }

    call(i: Interpreter, args: any[]): any
    {
        let instance = new LoxInstance(this);
        const initializer = this.find_method('init');
        if (initializer != null)
        {
            initializer.bind(instance).call(i, args);
        }
        return instance;
    }

    to_string(): string
    {
        return "";
    }

    find_method(name: string): LoxFunction | null
    {
        if (this.methods.has(name))
        {
            return this.methods.get(name)!;
        }

        if (this.superclass !== null)
        {
            return this.superclass.find_method(name);
        }
        return null;
    }
}

export class Interpreter implements ExprVisitor<any>, StmtVisitor<void>
{
    readonly globals = new Environment();
    private env = this.globals;
    private readonly locals = new Map<Expr, number>();

    constructor()
    {
        this.globals.define('clock', new GlobalClock());
    }

    is_truth(obj: any): boolean
    {
        if (obj === null) return false;
        if (typeof obj === "boolean") return obj;
        return true;
    }

    is_equal(left: any, right: any): boolean
    {
        return left === right;
    }

    check_number_operand(operator: Token, operand: any)
    {
        if (typeof operand === "number") return;
        throw new RuntimeError(operator, 'Operand must be a number.');
    }

    check_number_operands(operator: Token, left: any, right: any)
    {
        if (typeof left === "number" && typeof right === "number") return;
        throw new RuntimeError(operator, 'Operands must be numbers.');
    }

    visitBinaryExpr(expr: BinaryExpr): any
    {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type)
        {
            case TokenType.MINUS:
                this.check_number_operands(expr.operator, left, right);
                return Number(left) - Number(right);
            case TokenType.SLASH:
                this.check_number_operands(expr.operator, left, right);
                return Number(left) / Number(right);
            case TokenType.STAR:
                this.check_number_operands(expr.operator, left, right);
                return Number(left) * Number(right);
            case TokenType.PLUS:
                if (typeof left === "number" && typeof right === "number")
                    return Number(left) + Number(right);
                if (typeof left === "string" && typeof right === "string")
                    return String(left) + String(right);
                throw new RuntimeError(expr.operator, 'Operands must be strings or nubmers');
            case TokenType.GREATER:
                this.check_number_operands(expr.operator, left, right);
                return Number(left) > Number(right);
            case TokenType.GREATER_EQUAL:
                this.check_number_operands(expr.operator, left, right);
                return Number(left) >= Number(right);
            case TokenType.LESS:
                this.check_number_operands(expr.operator, left, right);
                return Number(left) < Number(right);
            case TokenType.LESS_EQUAL:
                this.check_number_operands(expr.operator, left, right);
                return Number(left) <= Number(right);
            case TokenType.DOUBLE_EQUAL:
                return this.is_equal(left, right);
            case TokenType.NOT_EQUAL:
                return !this.is_equal(left, right);
        }

        return null;
    }

    visitGroupingExpr(expr: GroupingExpr): any
    {
        return this.evaluate(expr.expression);
    }

    visitLiteralExpr(expr: LiteralExpr): any
    {
        return expr.value;
    }

    visitUnaryExpr(expr: UnaryExpr): any
    {
        let right = this.evaluate(expr.right);
        switch (expr.operator.type)
        {
            case TokenType.MINUS:
                this.check_number_operand(expr.operator, right);
                return -Number(right);
            case TokenType.BANG:
                return !this.is_truth(right);
        }

        return null;
    }

    look_up_variable(name: Token, expr: Expr): any
    {
        const distance = this.locals.get(expr);
        if (distance !== undefined)
        {
            return this.env.get_at(distance, name.lexeme);
        }
        else
        {
            return this.globals.get(name);
        }
    }

    visitVarExpr(expr: VarExpr): any
    {
        return this.look_up_variable(expr.name, expr);
    }

    visitAssignExpr(expr: AssignExpr): any
    {
        let value = this.evaluate(expr.value);

        const distance = this.locals.get(expr);
        if (distance !== undefined)
        {
            this.env.assign_at(distance, expr.name, value);
        }
        else
        {
            this.globals.assign(expr.name, value);
        }
        return value;
    }

    visitLogicalExpr(expr: LogicalExpr): any
    {
        let left = this.evaluate(expr.left);
        if (expr.operator.type == TokenType.OR)
        {
            if (this.is_truth(left))
                return left;
        }
        else if (expr.operator.type == TokenType.AND)
        {
            if (!this.is_truth(left))
                return left;
        }
        else
        {
            throw new RuntimeError(expr.operator, 'Unknown logical operator');
        }

        return this.evaluate(expr.right);
    }

    visitExpressionStmt(stmt: ExprStmt): void
    {
        this.evaluate(stmt.expr);
    }

    visitPrintStmt(stmt: PrintStmt): void
    {
        console.log(this.evaluate(stmt.expr));
    }

    visitVarStmt(stmt: VarStmt): void
    {
        let value: any = null;
        if (stmt.initializer !== null)
        {
            value = this.evaluate(stmt.initializer);
        }

        this.env.define(stmt.name.lexeme, value);
    }

    visitBlockStmt(stmt: BlockStmt): void
    {
        this.execute_block(stmt.statements, new Environment(this.env));
    }

    visitIfStmt(stmt: IfStmt): void
    {
        let cond = this.evaluate(stmt.condition);
        if (this.is_truth(cond))
            this.execute(stmt.then_branch);
        else if (stmt.else_branch !== null)
            this.execute(stmt.else_branch);
    }

    visitWhileStmt(stmt: WhileStmt): void
    {
        while (this.is_truth(this.evaluate(stmt.condition)))
        {
            this.execute(stmt.body);
        }
    }

    visitFunctionStmt(stmt: FunctionStmt): void
    {
        const func = new LoxFunction(stmt, this.env, false);
        this.env.define(stmt.name.lexeme, func);
    }

    visitReturnStmt(stmt: ReturnStmt): void
    {
        let value: any = null;
        if (stmt.value !== null)
        {
            value = this.evaluate(stmt.value);
        }
        throw new Return(value);
    }

    execute_block(stmts: Stmt[], env: Environment): void
    {
        let prev_env = this.env;
        try
        {
            this.env = env;
            for (const stmt of stmts)
            {
                this.execute(stmt);
            }
        }
        finally
        {
            this.env = prev_env;
        }
    }

    visitCallExpr(expr: CallExpr): any
    {
        let args: any[] = [];
        for (const arg of expr.arguments)
        {
            args.push(this.evaluate(arg));
        }

        let func = this.evaluate(expr.callee);
        if (func instanceof LoxCallable)
        {
            if (args.length != func.arity())
            {
                throw new RuntimeError(expr.paren, `Expected ${func.arity()} arguments but got ${args.length}.`)
            }
            return func.call(this, args);
        }
        else
        {
            throw new RuntimeError(expr.paren, "Can only call functions and classes.")
        }
    }

    visitClassStmt(stmt: ClassStmt): void
    {
        let superclass: any = null;
        if (stmt.superclass !== null)
        {
            superclass = this.evaluate(stmt.superclass);
            if (!(superclass instanceof LoxClass))
            {
                throw new RuntimeError(stmt.superclass.name, `Superclass must be a class.`)
            }
        }

        this.env.define(stmt.name.lexeme, null);

        if (stmt.superclass !== null)
        {
            this.env = new Environment(this.env);
            this.env.define('super', superclass);
        }

        const methods: Map<string, LoxFunction> = new Map();
        for (const m of stmt.methods)
        {
            const func = new LoxFunction(m, this.env, m.name.lexeme === "init");
            methods.set(m.name.lexeme, func);
        }
        const klass = new LoxClass(stmt.name.lexeme, superclass as LoxClass, methods);

        if (stmt.superclass !== null)
        {
            this.env = this.env.enclosing!;
        }

        this.env.assign(stmt.name, klass);
    }

    visitGetExpr(expr: GetExpr): any
    {
        const object = this.evaluate(expr.object);
        if (object instanceof LoxInstance)
        {
            return object.get(expr.name);
        }

        throw new RuntimeError(expr.name, "Only instances have properties.")
    }

    visitSetExpr(expr: SetExpr): any
    {
        const object = this.evaluate(expr.object);
        if (!(object instanceof LoxInstance))
        {
            throw new RuntimeError(expr.name, `Only instances have fields.`)
        }

        const value = this.evaluate(expr.value);
        object.set(expr.name, value);
        return value;
    }

    visitThisExpr(expr: ThisExpr): any
    {
        return this.look_up_variable(expr.keyword, expr);
    }

    visitSuperExpr(expr: SuperExpr): any
    {
        let distance = this.locals.get(expr)!;
        const superclass = this.env.get_at(distance, 'super') as LoxClass;
        const object = this.env.get_at(distance - 1, 'this') as LoxInstance;
        const method = superclass.find_method(expr.method.lexeme);
        if (method == null)
        {
            throw new RuntimeError(expr.method, `Undefined property ${expr.method.lexeme}.`)
        }
        return method.bind(object);
    }

    evaluate(expr: Expr): any
    {
        return expr.accept(this);
    }

    execute(stmt: Stmt): void
    {
        stmt.accept(this);
    }

    interpret(stmts: Stmt[]): void
    {
        try
        {
            for (const stmt of stmts)
            {
                this.execute(stmt);
            }
        }
        catch (err)
        {
            if (err instanceof RuntimeError)
            {
                Lox.runtime_error(err);
            }
        }
    }

    resolve(expr: Expr, depth: number)
    {
        this.locals.set(expr, depth);
    }
}