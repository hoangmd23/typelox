import {AssignExpr, BinaryExpr, Expr, GroupingExpr, LiteralExpr, UnaryExpr, VarExpr} from "./expression.js";
import {Token, TokenType} from "./token.js";
import {BlockStmt, ExprStmt, PrintStmt, Stmt, VarStmt} from "./statement.js";

export class Parser
{
    private readonly tokens: Token[];
    private current: number = 0;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
    }

    public parse(): Stmt[]
    {
        let res: Stmt[] = [];
        while (this.has_more())
        {
            res.push(this.declaration());
        }
        return res;
    }

    private declaration(): Stmt
    {
        if(this.peek_match(TokenType.VAR)) {
            this.next()
            return this.var_declaration();
        }
        return this.statement();
    }

    private var_declaration(): Stmt
    {
        let name = this.expect(TokenType.IDENTIFIER);
        let initializer: Expr | null = null;

        if(this.peek_match(TokenType.EQUAL))
        {
            this.next();
            initializer = this.expression();
        }

        this.expect(TokenType.SEMICOLON);

        return new VarStmt(name, initializer);
    }

    private statement(): Stmt
    {
        if(this.peek_match(TokenType.PRINT))
        {
            this.next();
            return this.print_statement();
        }
        else if(this.peek_match(TokenType.LEFT_BRACE))
        {
            this.next();
            return this.block();
        }
        return this.expression_statement();
    }

    private block(): Stmt
    {
        let stmts: Stmt[] = [];
        while(!this.peek_match(TokenType.RIGHT_BRACE) && this.has_more())
        {
            stmts.push(this.declaration());
        }
        this.expect(TokenType.RIGHT_BRACE);
        return new BlockStmt(stmts);
    }

    private print_statement(): Stmt
    {
        const value = this.expression();
        this.expect(TokenType.SEMICOLON);
        return new PrintStmt(value);
    }

    private expression_statement(): Stmt
    {
        const value = this.expression();
        this.expect(TokenType.SEMICOLON);
        return new ExprStmt(value);
    }

    private assignment(): Expr
    {
        let expr = this.equality();

        if (this.peek_match(TokenType.EQUAL))
        {
            let equals = this.next();
            let value = this.assignment();

            if (expr instanceof VarExpr)
            {
                const name = expr.name;
                return new AssignExpr(name, value)
            }

            throw new Error('Invalid assignment target.');
        }

        return expr;
    }

    private expression(): Expr {
        return this.assignment();
    }

    private has_more(): boolean {
        return this.peek().type != TokenType.EOF;
    }

    private peek(): Token
    {
        return this.tokens[this.current]!;
    }

    private peek_match(...types: TokenType[]): boolean
    {
        if(!this.has_more())
            return false;
        return types.includes(this.peek()!.type);
    }

    private next(): Token
    {
        return this.tokens[this.current++]!;
    }

    private equality(): Expr
    {
        let expr = this.comparison();

        while(this.peek_match(TokenType.DOUBLE_EQUAL, TokenType.NOT_EQUAL))
        {
            const operator = this.next();
            const right = this.comparison();
            expr = new BinaryExpr(expr, operator, right);
        }

        return expr;
    }

    private comparison(): Expr
    {
        let expr = this.term();
        while(this.peek_match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL))
        {
            const operator = this.next();
            const right = this.term();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr;
    }

    private term(): Expr
    {
        let expr = this.factor();
        while(this.peek_match(TokenType.MINUS, TokenType.PLUS))
        {
            const operator = this.next();
            const right = this.factor();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr;

    }

    private factor(): Expr
    {
        let expr = this.unary();
        while(this.peek_match(TokenType.SLASH, TokenType.STAR))
        {
            const operator = this.next();
            const right = this.unary();
            expr = new BinaryExpr(expr, operator, right);
        }
        return expr;
    }

    private unary(): Expr
    {
        if(this.peek_match(TokenType.BANG, TokenType.MINUS))
        {
            const operator = this.next();
            const right = this.unary();
            return new UnaryExpr(operator, right);
        }
        return this.primary();
    }

    private expect(...types: TokenType[]): Token
    {
        let matched = this.peek_match(...types) ;
        if (matched)
        {
            return this.next();
        }
        else
        {
            throw new Error("Unexpected token type");
        }
    }

    private primary(): Expr
    {
        let token = this.next();
        switch(token.type)
        {
            case TokenType.FALSE:
                return new LiteralExpr(false);
            case TokenType.TRUE:
                return new LiteralExpr(true);
            case TokenType.NIL:
                return new LiteralExpr(null);
            case TokenType.NUMBER:
            case TokenType.STRING:
                return new LiteralExpr(token.value);
            case TokenType.LEFT_PAREN:
                let expr = this.expression();
                this.expect(TokenType.RIGHT_PAREN);
                return new GroupingExpr(expr);
            case TokenType.IDENTIFIER:
                return new VarExpr(token);
            default:
                throw new Error("Unexpected token type");
        }
    }

}


export function stringify(expr: Expr): string {
    if (expr instanceof BinaryExpr) {
        return `(${expr.operator.lexeme} ${stringify(expr.left)} ${stringify(expr.right)})`;
    }
    if (expr instanceof GroupingExpr) {
        return `(group ${stringify(expr.expression)})`;
    }
    if (expr instanceof LiteralExpr) {
        return expr.value === null ? "nil" : expr.value.toString();
    }
    if (expr instanceof UnaryExpr) {
        return `(${expr.operator.lexeme} ${stringify(expr.right)})`;
    }

    throw new Error("Unknown expression type");
}