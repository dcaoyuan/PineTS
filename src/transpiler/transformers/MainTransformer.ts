// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import * as walk from 'acorn-walk';
import ScopeManager from '../analysis/ScopeManager';
import { ASTFactory } from '../utils/ASTFactory';
import { transformIdentifier, transformCallExpression, transformMemberExpression } from './ExpressionTransformer';
import {
    transformVariableDeclaration,
    transformReturnStatement,
    transformAssignmentExpression,
    transformForStatement,
    transformIfStatement,
    transformFunctionDeclaration,
} from './StatementTransformer';

export function transformEqualityChecks(ast: any): void {
    const baseVisitor = { ...walk.base, LineComment: () => {} };
    walk.simple(
        ast,
        {
            BinaryExpression(node: any) {
                // Check if this is an equality operator
                if (node.operator === '==' || node.operator === '===') {
                    // Store the original operands
                    const leftOperand = node.left;
                    const rightOperand = node.right;

                    // Transform the BinaryExpression into a CallExpression
                    const callExpr = ASTFactory.createMathEqCall(leftOperand, rightOperand);
                    callExpr._transformed = true;

                    Object.assign(node, callExpr);
                }
            },
        },
        baseVisitor
    );
}

export function runTransformationPass(
    ast: any,
    scopeManager: ScopeManager,
    originalParamName: string,
    options: { debug: boolean; ln?: boolean } = { debug: false, ln: false },
    sourceLines: string[] = []
): void {
    const createDebugComment = (originalNode: any): any => {
        if (!options.debug || !originalNode.loc || !sourceLines.length) return null;
        const lineIndex = originalNode.loc.start.line - 1;
        if (lineIndex >= 0 && lineIndex < sourceLines.length) {
            const lineText = sourceLines[lineIndex].trim();
            if (lineText) {
                const prefix = options.ln ? ` [Line ${originalNode.loc.start.line}]` : '';
                return {
                    type: 'LineComment',
                    value: `${prefix} ${lineText}`,
                };
            }
        }
        return null;
    };

    walk.recursive(ast, scopeManager, {
        Program(node: any, state: ScopeManager, c: any) {
            // state.pushScope('glb');
            const newBody: any[] = [];

            node.body.forEach((stmt: any) => {
                state.enterHoistingScope();
                c(stmt, state);
                const hoistedStmts = state.exitHoistingScope();

                const commentNode = createDebugComment(stmt);
                if (commentNode) newBody.push(commentNode);

                newBody.push(...hoistedStmts);
                newBody.push(stmt);
            });

            node.body = newBody;
            // state.popScope();
        },
        BlockStatement(node: any, state: ScopeManager, c: any) {
            // state.pushScope('block');
            const newBody: any[] = [];

            node.body.forEach((stmt: any) => {
                state.enterHoistingScope();
                c(stmt, state);
                const hoistedStmts = state.exitHoistingScope();

                const commentNode = createDebugComment(stmt);
                if (commentNode) newBody.push(commentNode);

                newBody.push(...hoistedStmts);
                newBody.push(stmt);
            });

            node.body = newBody;
            // state.popScope();
        },
        ReturnStatement(node: any, state: ScopeManager) {
            transformReturnStatement(node, state);
        },
        VariableDeclaration(node: any, state: ScopeManager) {
            transformVariableDeclaration(node, state);
        },
        Identifier(node: any, state: ScopeManager) {
            transformIdentifier(node, state);
        },
        CallExpression(node: any, state: ScopeManager) {
            transformCallExpression(node, state);
        },
        MemberExpression(node: any, state: ScopeManager) {
            transformMemberExpression(node, originalParamName, state);
        },
        AssignmentExpression(node: any, state: ScopeManager) {
            transformAssignmentExpression(node, state);
        },
        FunctionDeclaration(node: any, state: ScopeManager, c: any) {
            transformFunctionDeclaration(node, state, c);
        },
        ForStatement(node: any, state: ScopeManager, c: any) {
            transformForStatement(node, state, c);
        },
        IfStatement(node: any, state: ScopeManager, c: any) {
            transformIfStatement(node, state, c);
        },
    });
}
