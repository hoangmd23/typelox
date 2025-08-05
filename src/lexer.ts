import {Lox} from "./lox.js";
import {Token, TokenType} from "./token.js";

const keywords: { [key: string]: TokenType } = {
    "and": TokenType.AND,
    "class": TokenType.CLASS,
    "else": TokenType.ELSE,
    "false": TokenType.FALSE,
    "for": TokenType.FOR,
    "fun": TokenType.FUN,
    "if": TokenType.IF,
    "nil": TokenType.NIL,
    "or": TokenType.OR,
    "print": TokenType.PRINT,
    "return": TokenType.RETURN,
    "super": TokenType.SUPER,
    "this": TokenType.THIS,
    "true": TokenType.TRUE,
    "var": TokenType.VAR,
    "while": TokenType.WHILE,
}

export class Lexer {
    private readonly code: string;

    private start: number = 0;
    private current: number = 0;
    private line: number = 1;

    constructor(code: string) {
        this.code = code;
    }

    private has_more(): boolean {
        return this.current < this.code.length;
    }

    private make_token(token_type: TokenType, value: any = null): Token {
        return new Token(token_type, this.code.slice(this.start, this.current), value, this.line);
    }

    private check_next(expected: string): boolean {
        if (!this.has_more())
            return false;

        if (this.code[this.current] !== expected)
            return false

        this.current++;
        return true;
    }

    private peek_char(): string | null {
        if (this.has_more())
            return this.code[this.current]!;
        else
            return null;
    }

    private peek_next_char(): string | null {
        if (this.current + 1 >= this.code.length)
            return null;
        return this.code[this.current + 1]!;
    }

    private next_char(): string | null {
        const next = this.peek_char();
        this.current++;
        return next;
    }

    private is_digit(char: string | null): boolean {
        if (char == null)
            return false;
        return char >= '0' && char <= '9';
    }

    private is_identifier(char: string | null): boolean {
        if (char == null)
            return false;
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || (char == '_');
    }

    private next_token(): Token | null {
        const char = this.next_char();

        if (char === null)
            return null;

        switch (char) {
            case '(':
                return this.make_token(TokenType.LEFT_PAREN);
            case ')':
                return this.make_token(TokenType.RIGHT_PAREN);
            case '{':
                return this.make_token(TokenType.LEFT_BRACE);
            case '}':
                return this.make_token(TokenType.RIGHT_BRACE);
            case ',':
                return this.make_token(TokenType.COMMA);
            case '.':
                return this.make_token(TokenType.DOT);
            case '-':
                return this.make_token(TokenType.MINUS);
            case '+':
                return this.make_token(TokenType.PLUS);
            case ';':
                return this.make_token(TokenType.SEMICOLON);
            case '*':
                return this.make_token(TokenType.STAR);
            case '!':
                return this.make_token(this.check_next('=') ? TokenType.NOT_EQUAL : TokenType.BANG);
            case '=':
                return this.make_token(this.check_next('=') ? TokenType.DOUBLE_EQUAL : TokenType.EQUAL);
            case '<':
                return this.make_token(this.check_next('=') ? TokenType.LESS_EQUAL : TokenType.LESS);
            case '>':
                return this.make_token(this.check_next('=') ? TokenType.GREATER_EQUAL : TokenType.GREATER);
            case '/':
                if (this.check_next('/')) {
                    while (this.has_more() && this.peek_char() != '\n')
                        this.next_char();
                } else {
                    return this.make_token(TokenType.SLASH);
                }
                break;
            case ' ':
            case '\r':
            case '\t':
                break;
            case '\n':
                this.line++;
                break;
            case '"':
                while (this.peek_char() != '"' && this.has_more()) {
                    if (this.peek_char() == '\n')
                        this.line++;
                    this.next_char();
                }

                if (!this.has_more()) {
                    Lox.error(this.line, 'Unterminated string.');
                }

                // consume "
                this.next_char();

                return this.make_token(TokenType.STRING, this.code.slice(this.start + 1, this.current - 1));
            default:
                if (this.is_digit(char)) {
                    while (this.is_digit(this.peek_char()))
                        this.next_token();

                    if (this.peek_char() == '.' && this.is_digit(this.peek_next_char())) {
                        // consume .
                        this.next_token();

                        while (this.is_digit(this.peek_char()))
                            this.next_token();
                    }

                    return this.make_token(TokenType.NUMBER, Number(this.code.slice(this.start, this.current)))
                } else if (this.is_identifier(char)) {
                    while (this.is_digit(this.peek_char()) || this.is_identifier(this.peek_char()))
                        this.next_token();

                    const value = this.code.slice(this.start, this.current);

                    let token_type = TokenType.IDENTIFIER;
                    if (value in keywords)
                        token_type = keywords[value]!;

                    return this.make_token(token_type, value);
                } else {
                    Lox.error(this.line, 'Unknown token ' + char);
                }
        }

        return null;
    }

    public scan_tokens(): Token[] {
        const tokens: Token[] = [];
        while (this.has_more()) {
            this.start = this.current;
            const token = this.next_token();
            if (token !== null)
                tokens.push(token);
        }
        tokens.push(new Token(TokenType.EOF, "", "", this.line));
        return tokens;
    }
}