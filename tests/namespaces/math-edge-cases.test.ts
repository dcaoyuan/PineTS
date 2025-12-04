// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

import { describe, it, expect } from 'vitest';
import { PineTS } from '../../src/PineTS.class';
import { Provider } from '@pinets/marketData/Provider.class';

describe('Math Edge Cases', () => {
    describe('NaN Handling', () => {
        it('math.sqrt of negative numbers should return NaN', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar, na } = context.pine;
                
                const result = math.sqrt(-1);
                const is_nan = na(result);
                
                plotchar(is_nan ? 1 : 0, 'is_nan');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['is_nan'].data[0].value).toBe(1);
        });

        it('math.log of negative numbers should return NaN', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar, na } = context.pine;
                
                const result = math.log(-10);
                const is_nan = na(result);
                
                plotchar(is_nan ? 1 : 0, 'is_nan');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['is_nan'].data[0].value).toBe(1);
        });

        it('math.log of zero should return -Infinity', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar } = context.pine;
                
                const result = math.log(0);
                plotchar(result, 'result');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['result'].data[0].value).toBe(-Infinity);
        });

        it('division by zero should handle Infinity', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { plotchar } = context.pine;
                
                const result = 1 / 0;
                plotchar(result, 'result');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['result'].data[0].value).toBe(Infinity);
        });

        it('0/0 should return NaN', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { plotchar, na } = context.pine;
                
                const result = 0 / 0;
                const is_nan = na(result);
                
                plotchar(is_nan ? 1 : 0, 'is_nan');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['is_nan'].data[0].value).toBe(1);
        });
    });

    describe('Infinity Handling', () => {
        it('math.pow with large exponents should handle Infinity', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar } = context.pine;
                
                const result = math.pow(10, 1000);
                plotchar(result, 'result');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['result'].data[0].value).toBe(Infinity);
        });

        it('math operations with Infinity should propagate correctly', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar } = context.pine;
                
                const inf = Infinity;
                const sum = inf + 100;
                const product = inf * 2;
                const sqrt_inf = math.sqrt(inf);
                
                plotchar(sum, 'sum');
                plotchar(product, 'product');
                plotchar(sqrt_inf, 'sqrt_inf');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['sum'].data[0].value).toBe(Infinity);
            expect(plots['product'].data[0].value).toBe(Infinity);
            expect(plots['sqrt_inf'].data[0].value).toBe(Infinity);
        });

        it('Infinity - Infinity should return NaN', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { plotchar, na } = context.pine;
                
                const result = Infinity - Infinity;
                const is_nan = na(result);
                
                plotchar(is_nan ? 1 : 0, 'is_nan');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['is_nan'].data[0].value).toBe(1);
        });
    });

    describe('Math.__eq Special Cases', () => {
        it('should handle NaN == NaN as true (Pine Script behavior)', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar } = context.pine;
                
                const nan1 = 0 / 0;
                const nan2 = math.sqrt(-1);
                const are_equal = nan1 == nan2;
                
                plotchar(are_equal ? 1 : 0, 'equal');
            `;

            const { plots } = await pineTS.run(code);
            // Based on __eq implementation: NaN == NaN returns true
            expect(plots['equal'].data[0].value).toBe(1);
        });

        it('should handle Infinity comparisons', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { plotchar } = context.pine;
                
                const inf1 = 1 / 0;
                const inf2 = Infinity;
                const neg_inf1 = -1 / 0;
                const neg_inf2 = -Infinity;
                
                plotchar(inf1, 'inf1');
                plotchar(inf2, 'inf2');
                plotchar(neg_inf1, 'neg_inf1');
                plotchar(neg_inf2, 'neg_inf2');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['inf1'].data[0].value).toBe(Infinity);
            expect(plots['inf2'].data[0].value).toBe(Infinity);
            expect(plots['neg_inf1'].data[0].value).toBe(-Infinity);
            expect(plots['neg_inf2'].data[0].value).toBe(-Infinity);
        });
    });

    describe('Math Functions with Edge Values', () => {
        it('math.abs should handle very large numbers', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar } = context.pine;
                
                const abs_pos = math.abs(1000000);
                const abs_neg = math.abs(-1000000);
                
                plotchar(abs_pos, 'pos');
                plotchar(abs_neg, 'neg');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['pos'].data[0].value).toBe(1000000);
            expect(plots['neg'].data[0].value).toBe(1000000);
        });

        it('math.max and math.min should work with large numbers', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar } = context.pine;
                
                const max_val = math.max(100, 1000000);
                const min_val = math.min(100, -1000000);
                
                plotchar(max_val, 'max_val');
                plotchar(min_val, 'min_val');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['max_val'].data[0].value).toBe(1000000);
            expect(plots['min_val'].data[0].value).toBe(-1000000);
        });

        it('math.ceil and math.floor should work correctly', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar } = context.pine;
                
                const ceil_val = math.ceil(3.14);
                const floor_val = math.floor(3.14);
                const ceil_neg = math.ceil(-3.14);
                const floor_neg = math.floor(-3.14);
                
                plotchar(ceil_val, 'ceil_val');
                plotchar(floor_val, 'floor_val');
                plotchar(ceil_neg, 'ceil_neg');
                plotchar(floor_neg, 'floor_neg');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['ceil_val'].data[0].value).toBe(4);
            expect(plots['floor_val'].data[0].value).toBe(3);
            expect(plots['ceil_neg'].data[0].value).toBe(-3);
            expect(plots['floor_neg'].data[0].value).toBe(-4);
        });

        it('math.round should work correctly', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar } = context.pine;
                
                const round_up = math.round(3.6);
                const round_down = math.round(3.4);
                const round_neg = math.round(-3.6);
                
                plotchar(round_up, 'up');
                plotchar(round_down, 'down');
                plotchar(round_neg, 'neg');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['up'].data[0].value).toBe(4);
            expect(plots['down'].data[0].value).toBe(3);
            expect(plots['neg'].data[0].value).toBe(-4);
        });
    });

    describe('Trigonometric Functions with Edge Cases', () => {
        it('math.sin, math.cos should handle Infinity as NaN', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar, na } = context.pine;
                
                const sin_inf = math.sin(Infinity);
                const cos_inf = math.cos(Infinity);
                const tan_inf = math.tan(Infinity);
                
                plotchar(na(sin_inf) ? 1 : 0, 'sin_nan');
                plotchar(na(cos_inf) ? 1 : 0, 'cos_nan');
                plotchar(na(tan_inf) ? 1 : 0, 'tan_nan');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['sin_nan'].data[0].value).toBe(1);
            expect(plots['cos_nan'].data[0].value).toBe(1);
            expect(plots['tan_nan'].data[0].value).toBe(1);
        });

        it('math.asin, math.acos should handle out of range values', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar, na } = context.pine;
                
                const asin_out = math.asin(2);    // Out of range [-1, 1]
                const acos_out = math.acos(-2);   // Out of range [-1, 1]
                
                plotchar(na(asin_out) ? 1 : 0, 'asin_nan');
                plotchar(na(acos_out) ? 1 : 0, 'acos_nan');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['asin_nan'].data[0].value).toBe(1);
            expect(plots['acos_nan'].data[0].value).toBe(1);
        });
    });

    describe('Exponential and Logarithmic Edge Cases', () => {
        it('math.exp should handle large values to Infinity', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar } = context.pine;
                
                const result = math.exp(1000);
                plotchar(result, 'result');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['result'].data[0].value).toBe(Infinity);
        });

        it('math.ln and math.log10 should handle edge cases', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar, na } = context.pine;
                
                const ln_zero = math.ln(0);
                const ln_neg = math.ln(-1);
                const log10_zero = math.log10(0);
                const log10_neg = math.log10(-1);
                
                plotchar(ln_zero, 'ln_zero');
                plotchar(log10_zero, 'log10_zero');
                plotchar(na(ln_neg) ? 1 : 0, 'ln_neg');
                plotchar(na(log10_neg) ? 1 : 0, 'log10_neg');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['ln_zero'].data[0].value).toBe(-Infinity);
            expect(plots['log10_zero'].data[0].value).toBe(-Infinity);
            expect(plots['ln_neg'].data[0].value).toBe(1);
            expect(plots['log10_neg'].data[0].value).toBe(1);
        });
    });

    describe('Zero and Very Small Numbers', () => {
        it('should handle division by very small numbers', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { plotchar } = context.pine;
                
                const very_small = 1e-300;
                const result = 1 / very_small;
                const is_large = result > 1e299;
                
                plotchar(is_large ? 1 : 0, 'large');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['large'].data[0].value).toBe(1);
        });

        it('should handle underflow to zero', async () => {
            const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', '1h', null, new Date('2024-01-01').getTime(), new Date('2024-01-10').getTime());

            const code = `
                const { math, plotchar } = context.pine;
                
                const very_small = 1e-200;
                const underflow = very_small * 1e-200;
                const is_zero = underflow === 0;
                
                plotchar(is_zero ? 1 : 0, 'zero');
            `;

            const { plots } = await pineTS.run(code);
            expect(plots['zero'].data[0].value).toBe(1);
        });
    });
});

