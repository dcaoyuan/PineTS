// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Transpiler Scope Edge Cases', () => {
    it('should handle deeply nested scopes with name collisions', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta, plotchar } = context.pine;
            
            let x = ta.sma(close, 20);
            
            if (close > 100) {
                let x = ta.ema(close, 20);  // Different x in if scope
                
                if (close > 200) {
                    let x = ta.rsi(close, 14);  // Different x in nested if
                    
                    if (close > 300) {
                        let x = ta.atr(14);  // Different x in double-nested if
                        plotchar(x, 'innermost');
                    }
                    plotchar(x, 'nested');
                }
                plotchar(x, 'if');
            }
            plotchar(x, 'global');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['global']).toBeDefined();
        expect(plots['if']).toBeDefined();
        expect(plots['nested']).toBeDefined();
        expect(plots['innermost']).toBeDefined();
    });

    it('should not transform function parameters that shadow outer vars', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta, plotchar } = context.pine;
            
            let sma = ta.sma(close, 20);
            
            function process(sma) {  // Parameter shadows outer var
                return sma * 2;  // Should use parameter, not outer var
            }
            
            let result = process(5);
            plotchar(result, 'result');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['result']).toBeDefined();
        expect(plots['result'].data[0].value).toBe(10); // 5 * 2
    });

    it('should handle loop variables in nested loops', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { plotchar } = context.pine;
            
            let sum = 0;
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 2; j++) {
                    sum = sum + i + j;
                }
            }
            
            plotchar(sum, 'sum');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['sum']).toBeDefined();
        // Expected: (0+0) + (0+1) + (1+0) + (1+1) + (2+0) + (2+1) = 0 + 1 + 1 + 2 + 2 + 3 = 9
        expect(plots['sum'].data[0].value).toBe(9);
    });

    it('should handle variables with same name in different function scopes', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { ta, plotchar } = context.pine;
            
            function calc1() {
                let result = ta.sma(close, 10);
                return result;
            }
            
            function calc2() {
                let result = ta.ema(close, 10);  // Same name, different scope
                return result;
            }
            
            let sma_result = calc1();
            let ema_result = calc2();
            
            plotchar(sma_result, 'sma');
            plotchar(ema_result, 'ema');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['sma']).toBeDefined();
        expect(plots['ema']).toBeDefined();
        expect(Array.isArray(plots['sma'].data)).toBe(true);
        expect(Array.isArray(plots['ema'].data)).toBe(true);
    });

    it('should handle for loop scope isolation', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { plotchar } = context.pine;
            
            let outer = 10;
            
            for (let i = 0; i < 3; i++) {
                let inner = i * 2;
                outer = outer + inner;
            }
            
            plotchar(outer, 'result');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['result']).toBeDefined();
        // Expected: 10 + (0*2) + (1*2) + (2*2) = 10 + 0 + 2 + 4 = 16
        expect(plots['result'].data[0].value).toBe(16);
    });

    it('should handle variable declarations in if/else branches', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { plotchar } = context.pine;
            
            let result = 0;
            
            if (close > 50000) {
                let branch_var = 100;
                result = branch_var;
            } else {
                let branch_var = 200;  // Same name, different scope
                result = branch_var;
            }
            
            plotchar(result, 'result');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['result']).toBeDefined();
        expect(typeof plots['result'].data[0].value).toBe('number');
    });

    it('should handle variable shadowing with const, let, and var', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { close } = context.data;
            const { plotchar } = context.pine;
            
            const x = 10;
            let y = 20;
            var z = 30;
            
            if (close > 0) {
                const x = 11;  // Shadows outer const
                let y = 21;    // Shadows outer let
                var z = 31;    // Shadows outer var
                plotchar(x + y + z, 'inner');
            }
            
            plotchar(x + y + z, 'outer');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['inner']).toBeDefined();
        expect(plots['outer']).toBeDefined();
        expect(plots['inner'].data[0].value).toBe(63); // 11 + 21 + 31
        expect(plots['outer'].data[0].value).toBe(60); // 10 + 20 + 30
    });

    it('should handle block scope in switch statements', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

        const code = `
            const { plotchar } = context.pine;
            
            let mode = 2;
            let result = 0;
            
            switch (mode) {
                case 1: {
                    let value = 100;
                    result = value;
                    break;
                }
                case 2: {
                    let value = 200;  // Same name, different case scope
                    result = value;
                    break;
                }
                default: {
                    let value = 300;
                    result = value;
                }
            }
            
            plotchar(result, 'result');
        `;

        const { plots } = await pineTS.run(code);
        expect(plots).toBeDefined();
        expect(plots['result']).toBeDefined();
        expect(plots['result'].data[0].value).toBe(200);
    });
});

