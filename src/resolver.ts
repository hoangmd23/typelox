import {
    AssignExpr,
    BinaryExpr,
    CallExpr,
    Expr,
    type ExprVisitor, GetExpr, GroupingExpr, LiteralExpr,
    LogicalExpr, SetExpr, ThisExpr,
    UnaryExpr,
    VarExpr
} from "./expression.js";
import {
    BlockStmt, ClassStmt,
    ExprStmt,
    FunctionStmt,
    IfStmt,
    PrintStmt,
    ReturnStmt, Stmt,
    type StmtVisitor,
    VarStmt, WhileStmt
} from "./statement.js";
import type {Interpreter} from "./interpreter.js";
import type {Token} from "./token.js";

enum FunctionType
{
    NONE,
    FUNCTION,
    INITIALIZER,
    METHOD,
}

enum ClassType
{
    NONE,
    CLASS,
}

export class Resolver implements ExprVisitor<void>, StmtVisitor<void>
{
    private readonly intepreter: Interpreter;
    private readonly scopes: Map<string, boolean>[] = [];
    private current_function = FunctionType.NONE;
    private current_class = ClassType.NONE;

    constructor(intepreter: Interpreter)
    {
        this.intepreter = intepreter;
    }

    begin_scope(): void
    {
        this.scopes.push(new Map());
    }

    end_scope(): void
    {
        this.scopes.pop();
    }

    resolve_expr(expr: Expr): void
    {
        expr.accept(this);
    }

    resolve_statement(stmt: Stmt): void
    {
        stmt.accept(this);
    }

    resolve_expression(expr: Expr): void
    {
        expr.accept(this);
    }

    resolve_statements(stmts: Stmt[]): void
    {
        for (const statement of stmts)
        {
            this.resolve_statement(statement);
        }
    }

    visitAssignExpr(expr: AssignExpr): void
    {
        this.resolve_expr(expr.value);
        this.resolve_local(expr, expr.name);
    }

    visitBinaryExpr(expr: BinaryExpr): void
    {
        this.resolve_expr(expr.left);
        this.resolve_expr(expr.right);
    }

    visitBlockStmt(stmt: BlockStmt): void
    {
        this.begin_scope();
        this.resolve_statements(stmt.statements);
        this.end_scope();
    }

    visitCallExpr(expr: CallExpr): void
    {
        this.resolve_expr(expr.callee);
        for (const arg of expr.arguments)
        {
            this.resolve_expr(arg);
        }
    }

    visitExpressionStmt(stmt: ExprStmt): void
    {
        this.resolve_expr(stmt.expr);
    }

    resolve_function(stmt: FunctionStmt, type: FunctionType): void
    {
        let enclosing_function = this.current_function;
        this.current_function = type;

        this.begin_scope();
        for (const param of stmt.params)
        {
            this.declare(param);
            this.define(param);
        }
        this.resolve_statements(stmt.body);
        this.end_scope();

        this.current_function = enclosing_function;
    }

    visitFunctionStmt(stmt: FunctionStmt): void
    {
        this.declare(stmt.name);
        this.define(stmt.name);
        this.resolve_function(stmt, FunctionType.FUNCTION);
    }

    visitGroupingExpr(expr: GroupingExpr): void
    {
        this.resolve_expr(expr.expression);
    }

    visitIfStmt(stmt: IfStmt): void
    {
        this.resolve_expr(stmt.condition);
        this.resolve_statement(stmt.then_branch);
        if (stmt.else_branch !== null)
            this.resolve_statement(stmt.else_branch);
    }

    visitLiteralExpr(_: LiteralExpr): void
    {
        // do nothing
    }

    visitLogicalExpr(expr: LogicalExpr): void
    {
        this.resolve_expr(expr.left);
        this.resolve_expr(expr.right);
    }

    visitPrintStmt(stmt: PrintStmt): void
    {
        this.resolve_expr(stmt.expr);
    }

    visitReturnStmt(stmt: ReturnStmt): void
    {
        if (this.current_function == FunctionType.NONE)
        {
            throw new Error(`Can't return from top-level code.`)
        }

        if (stmt.value !== null)
        {
            if (this.current_function == FunctionType.INITIALIZER)
            {
                throw new Error(`Can't return a value from an initializer.`)
            }
            this.resolve_expr(stmt.value);
        }
    }

    visitUnaryExpr(expr: UnaryExpr): void
    {
        this.resolve_expr(expr.right);
    }

    resolve_local(expr: Expr, name: Token): void
    {
        for (let i = this.scopes.length - 1; i >= 0; i--)
        {
            if (this.scopes[i]!.has(name.lexeme))
            {
                this.intepreter.resolve(expr, this.scopes.length - 1 - i);
                return;
            }
        }
    }

    visitVarExpr(expr: VarExpr): void
    {
        if (this.has_scope() && this.get_last_scope()!.get(expr.name.lexeme) == false)
        {
            throw new Error(`Unable to resolve variable ${expr.name}`);
        }
        this.resolve_local(expr, expr.name);
    }

    visitVarStmt(stmt: VarStmt): void
    {
        this.declare(stmt.name);
        if (stmt.initializer !== null)
        {
            this.resolve_expression(stmt.initializer);
        }
        this.define(stmt.name);
    }

    visitWhileStmt(stmt: WhileStmt): void
    {
        this.resolve_expr(stmt.condition);
        this.resolve_statement(stmt.body);
    }

    visitClassStmt(stmt: ClassStmt): void
    {
        let enclosing_class = this.current_class;
        this.current_class = ClassType.CLASS;

        this.declare(stmt.name);
        this.define(stmt.name);
        this.begin_scope();

        this.get_last_scope()!.set("this", true);

        for (const m of stmt.methods)
        {
            let declaration = FunctionType.METHOD;
            if (m.name.lexeme === "init")
                declaration = FunctionType.INITIALIZER;
            this.resolve_function(m, declaration);
        }

        this.end_scope();
        this.current_class = enclosing_class;
    }

    visitGetExpr(expr: GetExpr): void
    {
        this.resolve_expr(expr.object);
    }

    visitSetExpr(expr: SetExpr): void
    {
        this.resolve_expr(expr.value);
        this.resolve_expr(expr.object);
    }

    visitThisExpr(expr: ThisExpr): void
    {
        if (this.current_class == ClassType.NONE)
        {
            throw new Error(`Can't use 'this' outside of a class.`)
        }
        this.resolve_local(expr, expr.keyword);
    }

    get_last_scope(): Map<string, boolean> | null
    {
        if (!this.has_scope())
            return null;
        return this.scopes[this.scopes.length - 1]!;
    }

    has_scope(): boolean
    {
        return this.scopes.length > 0;
    }

    declare(name: Token): void
    {
        if (!this.has_scope())
            return;
        const scope = this.get_last_scope()!;
        if (scope.has(name.lexeme))
        {
            throw new Error(`Variable duplication ${name.lexeme}`);
        }
        scope.set(name.lexeme, false);
    }

    define(name: Token): void
    {
        if (!this.has_scope())
            return;
        const scope = this.get_last_scope()!;
        scope.set(name.lexeme, true);

    }
}