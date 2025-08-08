import type {Expr} from "./expression.js";
import type {Token} from "./token.js";

export abstract class Stmt
{
    public abstract accept<T>(visitor: StmtVisitor<T>): void;
}

export interface StmtVisitor<T>
{
    visitExpressionStmt(stmt: ExprStmt): T;

    visitPrintStmt(stmt: PrintStmt): T;

    visitVarStmt(stmt: VarStmt): T;

    visitBlockStmt(stmt: BlockStmt): T;

    visitIfStmt(stmt: IfStmt): T;

    visitWhileStmt(stmt: WhileStmt): T;

    visitFunctionStmt(stmt: FunctionStmt): T;

    visitReturnStmt(stmt: ReturnStmt): T;

    visitClassStmt(stmt: ClassStmt): T;
}

export class ExprStmt extends Stmt
{
    public readonly expr: Expr;

    constructor(expr: Expr)
    {
        super();
        this.expr = expr;
    }

    public accept<T>(visitor: StmtVisitor<T>): void
    {
        visitor.visitExpressionStmt(this);
    }
}

export class PrintStmt extends Stmt
{
    public readonly expr: Expr;

    constructor(expr: Expr)
    {
        super();
        this.expr = expr;
    }

    public accept<T>(visitor: StmtVisitor<T>): void
    {
        visitor.visitPrintStmt(this);
    }
}

export class VarStmt extends Stmt
{
    public readonly name: Token;
    public readonly initializer: Expr | null;

    constructor(name: Token, initializer: Expr | null)
    {
        super();
        this.name = name;
        this.initializer = initializer;
    }

    public accept<T>(visitor: StmtVisitor<T>): void
    {
        visitor.visitVarStmt(this);
    }
}

export class BlockStmt extends Stmt
{
    public readonly statements: Stmt[];

    constructor(statements: Stmt[])
    {
        super();
        this.statements = statements;
    }

    public accept<T>(visitor: StmtVisitor<T>): void
    {
        visitor.visitBlockStmt(this);
    }
}

export class IfStmt extends Stmt
{
    public readonly condition: Expr;
    public readonly then_branch: Stmt;
    public readonly else_branch: Stmt | null;

    constructor(condition: Expr, then_branch: Stmt, else_branch: Stmt | null)
    {
        super();
        this.condition = condition;
        this.then_branch = then_branch;
        this.else_branch = else_branch;
    }

    public accept<T>(visitor: StmtVisitor<T>): void
    {
        visitor.visitIfStmt(this);
    }
}

export class WhileStmt extends Stmt
{
    public readonly condition: Expr;
    public readonly body: Stmt;

    constructor(condition: Expr, body: Stmt)
    {
        super();
        this.condition = condition;
        this.body = body;
    }

    public accept<T>(visitor: StmtVisitor<T>): void
    {
        visitor.visitWhileStmt(this);
    }
}

export class FunctionStmt extends Stmt
{
    public readonly name: Token;
    public readonly params: Token[];
    public readonly body: Stmt[];

    constructor(name: Token, params: Token[], body: Stmt[])
    {
        super();
        this.name = name;
        this.params = params;
        this.body = body;
    }

    public accept<T>(visitor: StmtVisitor<T>): void
    {
        visitor.visitFunctionStmt(this);
    }
}

export class ReturnStmt extends Stmt
{
    public readonly keyword: Token;
    public readonly value: Expr | null;

    constructor(keyword: Token, value: Expr | null)
    {
        super();
        this.keyword = keyword;
        this.value = value;
    }

    public accept<T>(visitor: StmtVisitor<T>): void
    {
        visitor.visitReturnStmt(this);
    }
}

export class ClassStmt extends Stmt
{
    public readonly name: Token;
    public readonly methods: FunctionStmt[];

    constructor(name: Token, methods: FunctionStmt[])
    {
        super();
        this.name = name;
        this.methods = methods;
    }

    public accept<T>(visitor: StmtVisitor<T>): void
    {
        visitor.visitClassStmt(this);
    }
}
