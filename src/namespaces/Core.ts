// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../Series';
import { parseArgsForPineParams } from './utils';

const INDICATOR_SIGNATURE = [
    'title',
    'shorttitle',
    'overlay',
    'format',
    'precision',
    'scale',
    'max_bars_back',
    'timeframe',
    'timeframe_gaps',
    'explicit_plot_zorder',
    'max_lines_count',
    'max_labels_count',
    'max_boxes_count',
    'calc_bars_count',
    'max_polylines_count',
    'dynamic_requests',
    'behind_chart',
];

const PLOT_SIGNATURE = [
    'series',
    'title',
    'color',
    'linewidth',
    'style',
    'trackprice',
    'histbase',
    'offset',
    'join',
    'editable',
    'show_last',
    'display',
    'format',
    'precision',
    'force_overlay',
];

const INDICATOR_ARGS_TYPES = {
    title: 'string',
    shorttitle: 'string',
    overlay: 'boolean',
    format: 'string',
    precision: 'number',
    scale: 'string', ////TODO : handle enums types
    max_bars_back: 'number',
    timeframe: 'string',
    timeframe_gaps: 'boolean',
    explicit_plot_zorder: 'boolean',
    max_lines_count: 'number',
    max_labels_count: 'number',
    max_boxes_count: 'number',
    calc_bars_count: 'number',
    max_polylines_count: 'number',
    dynamic_requests: 'boolean',
    behind_chart: 'boolean',
};

const PLOT_ARGS_TYPES = {
    series: 'series',
    title: 'string',
    color: 'string',
    linewidth: 'number',
    style: 'string',
    trackprice: 'boolean',
    histbase: 'number',
    offset: 'number',
    join: 'bool',
    editable: 'boolean',
    show_last: 'number',
    display: 'string',
    format: 'string',
    precision: 'number',
    force_overlay: 'boolean',
};

export function parseIndicatorOptions(args: any[]): Partial<IndicatorOptions> {
    return parseArgsForPineParams<Partial<IndicatorOptions>>(args, INDICATOR_SIGNATURE, INDICATOR_ARGS_TYPES);
}
export class Core {
    public color = {
        param: (source, index = 0) => {
            return Series.from(source).get(index);
        },
        rgb: (r: number, g: number, b: number, a?: number) => (a ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`),
        new: (color: string, a?: number) => {
            // Handle hexadecimal colors
            if (color && color.startsWith('#')) {
                // Remove # and convert to RGB
                const hex = color.slice(1);
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);

                return a ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
            }
            // Handle existing RGB format
            return a ? `rgba(${color}, ${a})` : color;
        },
        white: 'white',
        lime: 'lime',
        green: 'green',
        red: 'red',
        maroon: 'maroon',
        black: 'black',
        gray: 'gray',
        blue: 'blue',
        yellow: 'yellow',
        orange: 'orange',
        purple: 'purple',
        pink: 'pink',
        brown: 'brown',
        teal: 'teal',
        cyan: 'cyan',
        navy: 'navy',
        indigo: 'indigo',
        violet: 'violet',
        magenta: 'magenta',
        rose: 'rose',
        gold: 'gold',
        silver: 'silver',
        bronze: 'bronze',
    };
    constructor(private context: any) {}
    private extractPlotOptions(options: PlotCharOptions) {
        const _options: any = {};
        for (let key in options) {
            _options[key] = Series.from(options[key]).get(0);
        }
        return _options;
    }
    indicator(...args) {
        const options = parseIndicatorOptions(args);

        const defaults = {
            title: '',
            shorttitle: '',
            overlay: false,
            format: 'inherit',
            precision: 10,
            scale: 'points',
            max_bars_back: 0,
            timeframe: '',
            timeframe_gaps: true,
            explicit_plot_zorder: false,
            max_lines_count: 50,
            max_labels_count: 50,
            max_boxes_count: 50,
            calc_bars_count: 0,
            max_polylines_count: 50,
            dynamic_requests: false,
            behind_chart: true,
        };
        //TODO : most of these values are not actually used by PineTS, future work should be done to implement them
        this.context.indicator = { ...defaults, ...options };
        return this.context.indicator;
    }

    //in the current implementation, plot functions are only used to collect data for the plots array and map it to the market data
    plotchar(series: number[], title: string, options: PlotCharOptions) {
        if (!this.context.plots[title]) {
            this.context.plots[title] = { data: [], options: this.extractPlotOptions(options), title };
        }

        const value = Series.from(series).get(0);

        this.context.plots[title].data.push({
            time: this.context.marketData[this.context.idx].openTime,
            value: value,
            options: { ...this.extractPlotOptions(options), style: 'char' },
        });
    }

    plot(...args) {
        const _parsed = parseArgsForPineParams<PlotOptions>(args, PLOT_SIGNATURE, PLOT_ARGS_TYPES);
        const { series, title, ...others } = _parsed;
        const options = this.extractPlotOptions(others);
        if (!this.context.plots[title]) {
            this.context.plots[title] = { data: [], options, title };
        }

        const value = Series.from(series).get(0);

        this.context.plots[title].data.push({
            time: this.context.marketData[this.context.idx].openTime,
            value: value,
            options: { color: options.color || '' },
        });
    }

    get bar_index() {
        return this.context.idx;
    }

    na(series: any) {
        return isNaN(Series.from(series).get(0));
    }
    nz(series: any, replacement: number = 0) {
        const val = Series.from(series).get(0);
        const rep = Series.from(replacement).get(0);
        return isNaN(val) ? rep : val;
    }
    fixnan(series: any) {
        const _s = Series.from(series);
        for (let i = 0; i < _s.length; i++) {
            const val = _s.get(i);
            if (!isNaN(val)) {
                return val;
            }
        }
        return NaN;
    }

    //types
    bool(series: any) {
        const val = Series.from(series).get(0);
        return !isNaN(val) && val !== 0;
    }
}
