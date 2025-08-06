import {
    AssignExpr,
    BinaryExpr,
    CallExpr,
    Expr,
    GroupingExpr,
    LiteralExpr,
    LogicalExpr,
    UnaryExpr,
    VarExpr
} from "./expression.js";
import {Token, TokenType} from "./token.js";
import {
    BlockStmt,
    ExprStmt,
    FunctionStmt,
    IfStmt,
    PrintStmt,
    ReturnStmt,
    Stmt,
    VarStmt,
    WhileStmt
} from "./statement.js";

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

    private function(): Stmt
    {
        const name = this.expect(TokenType.IDENTIFIER);
        this.expect(TokenType.LEFT_PAREN);
        let params: Token[] = [];
        if(!this.peek_match(TokenType.RIGHT_PAREN))
        {
            while(true) {
                params.push(this.expect(TokenType.IDENTIFIER));
                if (params.length > 255) {
                    throw new Error(`Can't have more than 255 parameters.`)
                }
                if (this.peek_match(TokenType.COMMA))
                    this.next();
                else
                    break;
            }
        }
        this.next();
        this.expect(TokenType.LEFT_BRACE);
        const body = this.block() as BlockStmt;
        return new FunctionStmt(name, params, body.statements);
    }

    private declaration(): Stmt
    {
        if(this.peek_match(TokenType.VAR)) {
            this.next()
            return this.var_declaration();
        }
        else if(this.peek_match(TokenType.FUN))
        {
            this.next();
            return this.function();
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

    private if_statement(): Stmt
    {
        this.expect(TokenType.LEFT_PAREN);
        let cond = this.expression();
        this.expect(TokenType.RIGHT_PAREN);

        let then_branch = this.statement();
        let else_branch: Stmt | null = null;

        if(this.peek_match(TokenType.ELSE))
        {
            this.next();
            else_branch = this.statement();
        }

        return new IfStmt(cond, then_branch, else_branch);
    }

    private while_statement(): Stmt
    {
        this.expect(TokenType.LEFT_PAREN);
        let cond = this.expression();
        this.expect(TokenType.RIGHT_PAREN);

        let body = this.statement();

        return new WhileStmt(cond, body);
    }

    private for_statement(): Stmt
    {
        this.expect(TokenType.LEFT_PAREN);
        let init: Stmt | null = null;
        if (this.peek_match(TokenType.VAR))
        {
            this.next();
            init = this.var_declaration();
        }
        else if (!this.peek_match(TokenType.SEMICOLON))
        {
            init = this.expression_statement();
        }

        let condition: Expr | null = null;
        if (!this.peek_match(TokenType.SEMICOLON))
        {
            condition = this.expression();
        }
        this.expect(TokenType.SEMICOLON);

        let incr: Expr | null = null;
        if(!this.peek_match(TokenType.RIGHT_PAREN))
        {
            incr = this.expression();
        }

        this.expect(TokenType.RIGHT_PAREN);
        let body = this.statement();

        if (incr !== null)
        {
            body = new BlockStmt([body, new ExprStmt(incr)]);
        }

        if (condition === null)
        {
            condition = new LiteralExpr(true);
        }

        body = new WhileStmt(condition, body);

        if (init !== null)
        {
            body = new BlockStmt([init, body]);
        }
        return body;
    }

    private return_statement(): Stmt
    {
        let keyword = this.next();
        let value: Expr | null = null;
        if(!this.peek_match(TokenType.SEMICOLON))
            value = this.expression();
        this.expect(TokenType.SEMICOLON);
        return new ReturnStmt(keyword, value);
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
        else if(this.peek_match(TokenType.IF))
        {
            this.next();
            return this.if_statement();
        }
        else if(this.peek_match(TokenType.WHILE))
        {
            this.next();
            return this.while_statement();
        }
        else if(this.peek_match(TokenType.FOR))
        {
            this.next();
            return this.for_statement();
        }
        else if(this.peek_match(TokenType.RETURN))
        {
            return this.return_statement();
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

    private and(): Expr
    {
        let expr = this.equality();

        while(this.peek_match(TokenType.AND))
        {
            let operator = this.next();
            let right = this.equality();
            expr = new LogicalExpr(expr, operator, right);
        }

        return expr;
    }

    private or(): Expr
    {
        let expr = this.and();
        while(this.peek_match(TokenType.OR))
        {
            let operator = this.next();
            let right = this.and();
            expr = new LogicalExpr(expr, operator, right);
        }

        return expr;
    }

    private assignment(): Expr
    {
        let expr = this.or();

        if (this.peek_match(TokenType.EQUAL))
        {
            this.next();
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

    private arguments(): Expr[]
    {
        let args: Expr[] = [this.expression()];
        while(this.peek_match(TokenType.COMMA))
        {
            this.next();
            args.push(this.expression());
            if (args.length > 255)
            {
                throw new Error(`Expected a number of arguments to be less than 256`);
            }
        }
        return args;
    }

    private finish_call(expr: Expr): Expr
    {
        let args: Expr[] = [];
        let paren = this.next();
        if (!this.peek_match(TokenType.RIGHT_PAREN)) {
            args = this.arguments();
        }
        this.next();
        return new CallExpr(expr, paren, args);
    }

    private call(): Expr
    {
        let expr = this.primary();
        while (true)
        {
            if (this.peek_match(TokenType.LEFT_PAREN))
            {
                expr = this.finish_call(expr);
            }
            else
            {
                break;
            }
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
        return this.call();
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