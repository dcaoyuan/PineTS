// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import * as acorn from 'acorn';

/**
 * Checks if the code is already wrapped in a function.
 * Returns true if the code is a function expression or arrow function.
 */
function isWrappedInFunction(code: string): boolean {
    try {
        const ast = acorn.parse(code, {
            ecmaVersion: 'latest',
            sourceType: 'module',
        });

        // Check if the entire program is a single expression statement containing a function
        if (ast.type === 'Program' && ast.body.length === 1) {
            const firstStatement = ast.body[0];

            // Check for ExpressionStatement containing ArrowFunctionExpression or FunctionExpression
            if (firstStatement.type === 'ExpressionStatement') {
                const expr = firstStatement.expression;
                if (expr.type === 'ArrowFunctionExpression' || expr.type === 'FunctionExpression') {
                    return true;
                }
            }

            // Check for FunctionDeclaration
            if (firstStatement.type === 'FunctionDeclaration') {
                return true;
            }
        }

        return false;
    } catch (e) {
        // If parsing fails, assume it's not wrapped
        return false;
    }
}

/**
 * Wraps unwrapped code in a context arrow function.
 * If the code is already wrapped in a function, returns it as-is.
 * Otherwise, wraps it in: (context) => { ... }
 *
 * @param code The input code string
 * @returns The wrapped code string
 */
export function wrapInContextFunction(code: string): string {
    code = code.trim();

    // Check if already wrapped
    if (isWrappedInFunction(code)) {
        return code;
    }

    // Wrap in context arrow function
    return `(context) => {\n${code}\n}`;
}
