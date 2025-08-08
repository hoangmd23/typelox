# Lox Interpreter in TypeScript

A **tree-walk interpreter** for the Lox programming language, implemented in **TypeScript**.  
Based on the first interpreter from Bob Nystrom’s book *[Crafting Interpreters](https://craftinginterpreters.com/)*,
this project brings Lox to the TypeScript ecosystem.

---

## 📜 About

Lox is a small, dynamically-typed scripting language designed for learning how interpreters and compilers work.  
This implementation follows the **tree-walk** approach:

1. **Lexing** → Convert raw source code into tokens.
2. **Parsing** → Build an abstract syntax tree (AST) from tokens.
3. **Interpreting** → Traverse the AST and execute code directly.

---

## 🚀 Features

- Variables, control flow, and functions
- First-class functions & closures
- Classes and inheritance

---

## 📦 Installation

Install dependencies:

```
npm install
```

Compile TypeScript:

```
npx tsc
```

## 🖥 Usage

Run a Lox script:

```
node main.js <input_file>
```