import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

import { Provider } from '@pinets/marketData/Provider.class';

describe('Request ', () => {
    it('request.security higher timeframe', async () => {
        const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, new Date('2025-10-01').getTime(), new Date('2025-10-10').getTime());

        const { result, plots } = await pineTS.run(async (context) => {
            const { close, open } = context.data;
            const { plot, plotchar, request } = context.pine;

            const res = await request.security('BTCUSDC', 'W', close);

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
});
