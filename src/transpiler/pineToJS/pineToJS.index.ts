// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

// PineScript to JavaScript Converter
// Converts PineScript files to JavaScript using the parser and code generator

import { Lexer } from './lexer';
import { Parser } from './parser';
import { CodeGenerator } from './codegen';

export function pineToJS(sourceCode: string, options: any = {}) {
    try {
        // Step 1: Tokenize
        const lexer = new Lexer(sourceCode);
        const tokens = lexer.tokenize();

        // Step 2: Parse to AST
        const parser = new Parser(tokens);
        const ast = parser.parse();

        // Step 3: Generate JavaScript (pass source code for comments)
        const codegenOptions = { ...options, sourceCode };
        const codegen = new CodeGenerator(codegenOptions);
        const jsCode = codegen.generate(ast);

        return {
            success: true,
            code: jsCode,
            ast: ast,
            tokens: tokens,
        };
    } catch (error) {
        return {
            success: false,
            error: error.message,
            stack: error.stack,
        };
    }
}
