import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import { Provider } from '@pinets/marketData/Provider.class';

describe('Request ', () => {
    it('request.security higher timeframe lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-10-01').getTime(), new Date('2025-10-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', 'W', close, false, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-01T00:00:00.000-00:00]: 112224.95
[2025-10-02T00:00:00.000-00:00]: 112224.95
[2025-10-03T00:00:00.000-00:00]: 112224.95
[2025-10-04T00:00:00.000-00:00]: 112224.95
[2025-10-05T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: 123529.91
[2025-10-07T00:00:00.000-00:00]: 123529.91
[2025-10-08T00:00:00.000-00:00]: 123529.91
[2025-10-09T00:00:00.000-00:00]: 123529.91
[2025-10-10T00:00:00.000-00:00]: 123529.91`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
    it('request.security higher timeframe lookahead=true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-10-01').getTime(), new Date('2025-10-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', 'W', close, false, true);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-01T00:00:00.000-00:00]: 123529.91
[2025-10-02T00:00:00.000-00:00]: 123529.91
[2025-10-03T00:00:00.000-00:00]: 123529.91
[2025-10-04T00:00:00.000-00:00]: 123529.91
[2025-10-05T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: 115073.27
[2025-10-07T00:00:00.000-00:00]: 115073.27
[2025-10-08T00:00:00.000-00:00]: 115073.27
[2025-10-09T00:00:00.000-00:00]: 115073.27
[2025-10-10T00:00:00.000-00:00]: 115073.27`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security higher timeframe gaps=true lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-10-01').getTime(), new Date('2025-10-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', 'W', close, true, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-01T00:00:00.000-00:00]: NaN
[2025-10-02T00:00:00.000-00:00]: NaN
[2025-10-03T00:00:00.000-00:00]: NaN
[2025-10-04T00:00:00.000-00:00]: NaN
[2025-10-05T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: NaN
[2025-10-07T00:00:00.000-00:00]: NaN
[2025-10-08T00:00:00.000-00:00]: NaN
[2025-10-09T00:00:00.000-00:00]: NaN
[2025-10-10T00:00:00.000-00:00]: NaN`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
    it('request.security higher timeframe gaps=true lookahead=true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-10-01').getTime(), new Date('2025-10-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', 'W', close, true, true);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-10-01T00:00:00.000-00:00]: NaN
[2025-10-02T00:00:00.000-00:00]: NaN
[2025-10-03T00:00:00.000-00:00]: NaN
[2025-10-04T00:00:00.000-00:00]: NaN
[2025-10-05T00:00:00.000-00:00]: NaN
[2025-10-06T00:00:00.000-00:00]: 115073.27
[2025-10-07T00:00:00.000-00:00]: NaN
[2025-10-08T00:00:00.000-00:00]: NaN
[2025-10-09T00:00:00.000-00:00]: NaN
[2025-10-10T00:00:00.000-00:00]: NaN`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security lower timeframe lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2025-08-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', '240', close, false, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 119327.1
[2025-08-11T00:00:00.000-00:00]: 117490
[2025-08-18T00:00:00.000-00:00]: 113491.2
[2025-08-25T00:00:00.000-00:00]: 108270.38
[2025-09-01T00:00:00.000-00:00]: 111144.4
[2025-09-08T00:00:00.000-00:00]: 115343
[2025-09-15T00:00:00.000-00:00]: 115314.26
[2025-09-22T00:00:00.000-00:00]: 112224.95
[2025-09-29T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: 115073.27
[2025-10-13T00:00:00.000-00:00]: 108689.01
[2025-10-20T00:00:00.000-00:00]: 114574.42
[2025-10-27T00:00:00.000-00:00]: 110550.87
[2025-11-03T00:00:00.000-00:00]: 104710.22
[2025-11-10T00:00:00.000-00:00]: 94205.71`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security lower timeframe lookahead=true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2025-08-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', '240', close, false, true);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 119327.1
[2025-08-11T00:00:00.000-00:00]: 117490
[2025-08-18T00:00:00.000-00:00]: 113491.2
[2025-08-25T00:00:00.000-00:00]: 108270.38
[2025-09-01T00:00:00.000-00:00]: 111144.4
[2025-09-08T00:00:00.000-00:00]: 115343
[2025-09-15T00:00:00.000-00:00]: 115314.26
[2025-09-22T00:00:00.000-00:00]: 112224.95
[2025-09-29T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: 115073.27
[2025-10-13T00:00:00.000-00:00]: 108689.01
[2025-10-20T00:00:00.000-00:00]: 114574.42
[2025-10-27T00:00:00.000-00:00]: 110550.87
[2025-11-03T00:00:00.000-00:00]: 104710.22
[2025-11-10T00:00:00.000-00:00]: 106036.45`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security lower timeframe gaps=true lookahead=false', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2025-08-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', '240', close, true, false);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 119327.1
[2025-08-11T00:00:00.000-00:00]: 117490
[2025-08-18T00:00:00.000-00:00]: 113491.2
[2025-08-25T00:00:00.000-00:00]: 108270.38
[2025-09-01T00:00:00.000-00:00]: 111144.4
[2025-09-08T00:00:00.000-00:00]: 115343
[2025-09-15T00:00:00.000-00:00]: 115314.26
[2025-09-22T00:00:00.000-00:00]: 112224.95
[2025-09-29T00:00:00.000-00:00]: 123529.91
[2025-10-06T00:00:00.000-00:00]: 115073.27
[2025-10-13T00:00:00.000-00:00]: 108689.01
[2025-10-20T00:00:00.000-00:00]: 114574.42
[2025-10-27T00:00:00.000-00:00]: 110550.87
[2025-11-03T00:00:00.000-00:00]: 104710.22
[2025-11-10T00:00:00.000-00:00]: 94205.71`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });

    it('request.security lower timeframe gaps=true lookahead=true', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'W', null, new Date('2025-08-01').getTime(), new Date('2025-11-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', '240', close, true, true);

            plotchar(res, '_plotchar');

            return {
                res,
            };
        });

        const plotdata = plots['_plotchar']?.data;

        plotdata.forEach((e) => {
            e.time = new Date(e.time).toISOString().slice(0, -1) + '-00:00';

            delete e.options;
        });
        const plotdata_str = plotdata.map((e) => `[${e.time}]: ${e.value}`).join('\n');

        const expected_plot = `[2025-08-04T00:00:00.000-00:00]: 114598.51
[2025-08-11T00:00:00.000-00:00]: 121731.99
[2025-08-18T00:00:00.000-00:00]: 115406.13
[2025-08-25T00:00:00.000-00:00]: 112902
[2025-09-01T00:00:00.000-00:00]: 107676.24
[2025-09-08T00:00:00.000-00:00]: 111055.99
[2025-09-15T00:00:00.000-00:00]: 115494.24
[2025-09-22T00:00:00.000-00:00]: 114740.51
[2025-09-29T00:00:00.000-00:00]: 111934.31
[2025-10-06T00:00:00.000-00:00]: 123916.17
[2025-10-13T00:00:00.000-00:00]: 114933.61
[2025-10-20T00:00:00.000-00:00]: 110171.78
[2025-10-27T00:00:00.000-00:00]: 114993.89
[2025-11-03T00:00:00.000-00:00]: 107952
[2025-11-10T00:00:00.000-00:00]: 106036.45`;

        console.log('Expected plot:', expected_plot);
        console.log('Actual plot:', plotdata_str);

        expect(plotdata_str.trim()).toEqual(expected_plot.trim());
    });
});
