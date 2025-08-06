export enum TokenType
{
    // Single-character tokens.
    LEFT_PAREN, RIGHT_PAREN, LEFT_BRACE, RIGHT_BRACE,
    COMMA, DOT, MINUS, PLUS, SEMICOLON, SLASH, STAR,

    // One or two character tokens.
    BANG, NOT_EQUAL,
    EQUAL, DOUBLE_EQUAL,
    GREATER, GREATER_EQUAL,
    LESS, LESS_EQUAL,

    // Literals.
    IDENTIFIER, STRING, NUMBER,

    // Keywords.
    AND, CLASS, ELSE, FALSE, FUN, FOR, IF, NIL, OR,
    PRINT, RETURN, SUPER, THIS, TRUE, VAR, WHILE,

    EOF
}

export class Token
{
    readonly type: TokenType;
    readonly lexeme: string;
    readonly value: any;
    readonly line: number;

    constructor(type: TokenType, lexeme: string, value: any, line: number)
    {
        this.type = type;
        this.lexeme = lexeme;
        this.value = value;
        this.line = line;
    }

    toString(): string
    {
        return `${this.line}: ${TokenType[this.type]} ${this.lexeme}`;
    }
}

