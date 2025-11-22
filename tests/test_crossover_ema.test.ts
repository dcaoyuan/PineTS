// Temporary test to check if expectations were for EMA crossover
import { describe, expect, it } from 'vitest';
import { Context, PineTS, Provider } from './src/index';

describe('Crossover EMA Test', () => {
    it('Test if expectations were for EMA crossover', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', null, new Date('2025-10-29').getTime(), 1763596800000);

        const sourceCode = (context: Context) => {
            const { close, open } = context.data;
            const ta = context.ta;
            const { plotchar } = context.core;
            const ema9 = ta.ema(close, 9);
            const ema18 = ta.ema(close, 18);
            const crossoverEMA = ta.crossover(ema9, ema18); // EMA crossover instead
            const crossoverCloseOpen = ta.crossover(close, open); // Close/Open crossover
            plotchar(crossoverEMA, 'crossoverEMA');
            plotchar(crossoverCloseOpen, 'crossoverCloseOpen');
            return { crossoverEMA, crossoverCloseOpen };
        };

        const { result, plots } = await pineTS.run(sourceCode);

        console.log('\n=== EMA Crossover Results ===');
        const plotdataEMA = plots['crossoverEMA'].data.reverse();
        plotdataEMA.forEach((e) => {
            const date = new Date(e.time).toISOString().split('T')[0];
            if (e.value) {
                console.log(`${date}: ${e.value}`);
            }
        });

        console.log('\n=== Close/Open Crossover Results ===');
        const plotdataCloseOpen = plots['crossoverCloseOpen'].data.reverse();
        plotdataCloseOpen.forEach((e) => {
            const date = new Date(e.time).toISOString().split('T')[0];
            if (e.value) {
                console.log(`${date}: ${e.value}`);
            }
        });
    });
});

