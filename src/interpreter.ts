import {Token, TokenType} from "./token.js";
import {Lox, RuntimeError} from "./lox.js";
import {
    AssignExpr,
    BinaryExpr,
    Expr,
    type ExprVisitor,
    GroupingExpr,
    LiteralExpr, LogicalExpr,
    UnaryExpr,
    VarExpr
} from "./expression.js";
import {
    BlockStmt,
    type ExprStmt,
    IfStmt,
    type PrintStmt,
    Stmt,
    type StmtVisitor,
    VarStmt,
    WhileStmt
} from "./statement.js";
import {Environment} from "./environment.js";

export class Interpreter implements ExprVisitor<any>, StmtVisitor<void> {
    private env = new Environment();

    is_truth(obj: any): boolean {
        if (obj === null) return false;
        if (typeof obj === "boolean") return obj;
        return true;
    }

    is_equal(left: any, right: any): boolean {
        return left === right;
    }

    check_number_operand(operator: Token, operand: any) {
        if (typeof operand === "number") return;
        throw new RuntimeError(operator, 'Operand must be a number.');
    }

    check_number_operands(operator: Token, left: any, right: any) {
        if (typeof left === "number" && typeof right === "number") return;
        throw new RuntimeError(operator, 'Operands must be numbers.');
    }

    visitBinaryExpr(expr: BinaryExpr): any {
        const left = this.evaluate(expr.left);
        const right = this.evaluate(expr.right);

        switch (expr.operator.type) {
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

    visitGroupingExpr(expr: GroupingExpr): any {
        return this.evaluate(expr.expression);
    }

    visitLiteralExpr(expr: LiteralExpr): any {
        return expr.value;
    }

    visitUnaryExpr(expr: UnaryExpr): any {
        let right = this.evaluate(expr.right);
        switch (expr.operator.type) {
            case TokenType.MINUS:
                this.check_number_operand(expr.operator, right);
                return -Number(right);
            case TokenType.BANG:
                return !this.is_truth(right);
        }

        return null;
    }

    visitVarExpr(expr: VarExpr) : any
    {
        return this.env.get(expr.name);
    }

    visitAssignExpr(expr: AssignExpr): any
    {
        let value = this.evaluate(expr.value);
        this.env.assign(expr.name, value);
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
        while(this.is_truth(this.evaluate(stmt.condition)))
        {
            this.execute(stmt.body);
        }
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

    evaluate(expr: Expr): any {
        return expr.accept(this);
    }

    execute(stmt: Stmt): void
    {
        stmt.accept(this);
    }

    interpret(stmts: Stmt[]): void {
        try {
            for (const stmt of stmts)
            {
                this.execute(stmt);
            }
        } catch (err) {
            if (err instanceof RuntimeError) {
                Lox.runtime_error(err);
            }
        }
    }
}