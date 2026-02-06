// SPDX-License-Identifier: AGPL-3.0-only

import { type PlotCharOptions, type IndicatorOptions } from '../types/PineTypes';
import { Series } from '../Series';
import { PineTypeObject } from './PineTypeObject';
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

export function parseIndicatorOptions(args: any[]): Partial<IndicatorOptions> {
    return parseArgsForPineParams<Partial<IndicatorOptions>>(args, INDICATOR_SIGNATURE, INDICATOR_ARGS_TYPES);
}
export class Core {
    public color = {
        param: (source, index = 0) => {
            return Series.from(source).get(index);
        },
        rgb: (r: number, g: number, b: number, a?: number) => (a ? `rgba(${r}, ${g}, ${b}, ${(100 - a) / 100})` : `rgb(${r}, ${g}, ${b})`),
        new: (color: string, a?: number) => {
            // Handle hexadecimal colors
            if (color && color.startsWith('#')) {
                // Remove # and convert to RGB
                const hex = color.slice(1);
                const r = parseInt(hex.slice(0, 2), 16);
                const g = parseInt(hex.slice(2, 4), 16);
                const b = parseInt(hex.slice(4, 6), 16);

                return a ? `rgba(${r}, ${g}, ${b}, ${(100 - a) / 100})` : `rgb(${r}, ${g}, ${b})`;

            } else {
                let rgb: string
                switch (color) {
                    case 'aqua':
                        rgb = '0, 188, 212';
                        break;

                    case 'black':
                        rgb = '54, 58, 69';
                        break;

                    case 'blue':
                        rgb = '33, 150, 243';
                        break;

                    case 'fuchsia':
                        rgb = '224, 64, 251';
                        break;

                    case 'gray':
                        rgb = '120, 123, 134';
                        break;

                    case 'green':
                        rgb = '76, 175, 80';
                        break;

                    case 'lime':
                        rgb = '0, 230, 118';
                        break;

                    case 'maroon':
                        rgb = '136, 14, 79';
                        break;

                    case 'navy':
                        rgb = '49, 27, 146';
                        break;

                    case 'olive':
                        rgb = '128, 128, 0';
                        break;

                    case 'orange':
                        rgb = '255, 152, 0';
                        break;

                    case 'purple':
                        rgb = '156, 39, 176';
                        break;

                    case 'red':
                        rgb = '242, 54, 69';
                        break;

                    case 'silver':
                        rgb = '178, 181, 190';
                        break;

                    case 'teal':
                        rgb = '8, 153, 129';
                        break;

                    case 'white':
                        rgb = '255, 255, 255';
                        break;

                    case 'yellow':
                        rgb = '0, 188, 212';
                        break;

                    default:
                }

                return rgb
                    ? a ? `rgba(${rgb}, ${(100 - a) / 100})` : `rgb(${rgb})`
                    : a ? `rgba(${color}, ${(100 - a) / 100})` : color; // Handle existing RGB format
            }
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
    constructor(private context: any) { }
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

    alertcondition(condition, title, message) {
        //console.warn('alertcondition called but is currently not implemented', condition, title, message);
    }
    //types
    bool(series: any) {
        const val = Series.from(series).get(0);
        return !isNaN(val) && val !== 0;
    }
    int(series: any) {
        const val = Series.from(series).get(0);
        if (typeof val !== 'number')
            throw new Error(
                `Cannot call "int" with argument "x"="${val}". An argument of "literal string" type was used but a "simple int" is expected.`
            );
        return Math.floor(val);
    }
    float(series: any) {
        const val = Series.from(series).get(0);
        if (typeof val !== 'number')
            throw new Error(
                `Cannot call "float" with argument "x"="${val}". An argument of "literal string" type was used but a "const float" is expected.`
            );
        return val;
    }
    string(series: any) {
        //Pine Script seems to be throwing an error for any argument that is not a string
        //the following implementation might need to be updated in the future
        const val = Series.from(series).get(0);
        return val.toString();
    }

    Type(definition: Record<string, string>) {
        const definitionKeys = Object.keys(definition);
        const UDT = {
            new: function (...args: any[]) {
                //map the args to the definition
                const mappedArgs = {};
                for (let i = 0; i < args.length; i++) {
                    mappedArgs[definitionKeys[i]] = args[i];
                }
                return new PineTypeObject(mappedArgs, this.context);
            },

            copy: function (object: PineTypeObject) {
                return new PineTypeObject(object.__def__, this.context);
            },
        };
        return UDT;
    }
}
