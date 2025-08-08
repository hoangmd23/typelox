import {Token} from './token.js'

export interface ExprVisitor<T>
{
    visitBinaryExpr(expr: BinaryExpr): T;

    visitUnaryExpr(expr: UnaryExpr): T;

    visitGroupingExpr(expr: GroupingExpr): T;

    visitLiteralExpr(expr: LiteralExpr): T;

    visitVarExpr(expr: VarExpr): T;

    visitAssignExpr(expr: AssignExpr): T;

    visitLogicalExpr(expr: LogicalExpr): T;

    visitCallExpr(expr: CallExpr): T;

    visitGetExpr(expr: GetExpr): T;

    visitSetExpr(expr: SetExpr): T;

    visitThisExpr(expr: ThisExpr): T;
}

export abstract class Expr
{
    public abstract accept<T>(visitor: ExprVisitor<T>): T;
}

export class BinaryExpr extends Expr
{
    readonly left: Expr;
    readonly operator: Token;
    readonly right: Expr;

    constructor(left: Expr, operator: Token, right: Expr)
    {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitBinaryExpr(this);
    }
}

export class GroupingExpr extends Expr
{
    readonly expression: Expr;

    constructor(expression: Expr)
    {
        super();
        this.expression = expression;
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitGroupingExpr(this);
    }
}

export class LiteralExpr extends Expr
{
    readonly value: any;

    constructor(value: any)
    {
        super();
        this.value = value;
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitLiteralExpr(this);
    }
}

export class LogicalExpr extends Expr
{
    readonly left: Expr;
    readonly operator: Token;
    readonly right: Expr;

    constructor(left: Expr, operator: Token, right: Expr)
    {
        super();
        this.left = left;
        this.operator = operator;
        this.right = right;
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitLogicalExpr(this);
    }
}

export class UnaryExpr extends Expr
{
    readonly operator: Token;
    readonly right: Expr;

    constructor(operator: Token, right: Expr)
    {
        super();
        this.operator = operator;
        this.right = right;
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitUnaryExpr(this);
    }
}

export class VarExpr extends Expr
{
    readonly name: Token;

    constructor(name: Token)
    {
        super();
        this.name = name;
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitVarExpr(this);
    }
}

export class AssignExpr extends Expr
{
    readonly name: Token;
    readonly value: Expr;

    constructor(name: Token, value: Expr)
    {
        super();
        this.name = name;
        this.value = value
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitAssignExpr(this);
    }
}

export class CallExpr extends Expr
{
    readonly callee: Expr;
    readonly paren: Token;
    readonly arguments: Expr[];

    constructor(callee: Expr, paren: Token, args: Expr[])
    {
        super();
        this.callee = callee;
        this.paren = paren;
        this.arguments = args;
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitCallExpr(this);
    }
}

export class GetExpr extends Expr
{
    readonly object: Expr;
    readonly name: Token;

    constructor(object: Expr, name: Token)
    {
        super();
        this.object = object;
        this.name = name;
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitGetExpr(this);
    }
}

export class SetExpr extends Expr
{
    readonly object: Expr;
    readonly name: Token;
    readonly value: Expr;

    constructor(object: Expr, name: Token, value: Expr)
    {
        super();
        this.object = object;
        this.name = name;
        this.value = value;
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitSetExpr(this);
    }
}

export class ThisExpr extends Expr
{
    readonly keyword: Token;

    constructor(keyword: Token)
    {
        super();
        this.keyword = keyword;
    }

    public accept<T>(visitor: ExprVisitor<T>): T
    {
        return visitor.visitThisExpr(this);
    }
}
