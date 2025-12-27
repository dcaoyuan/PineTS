import { Series } from '../Series';
import { parseArgsForPineParams } from './utils';

//prettier-ignore
const PLOT_SIGNATURE = [
    'series', 'title', 'color', 'linewidth', 'style', 'trackprice', 'histbase', 'offset', 
    'join', 'editable', 'show_last', 'display', 'format', 'precision', 'force_overlay',
];

//prettier-ignore
const PLOT_SHAPE_SIGNATURE = [
    'series', 'title', 'style', 'location', 'color', 'offset', 'text', 'textcolor',
    'editable', 'size', 'show_last', 'display', 'format', 'precision', 'force_overlay',
];

//prettier-ignore
const PLOT_ARROW_SIGNATURE = [
    'series', 'title', 'colorup', 'colordown', 'offset', 'minheight', 'maxheight', 
    'editable', 'show_last', 'display', 'format', 'precision', 'force_overlay',
];

//prettier-ignore
const PLOT_ARGS_TYPES = {
    series: 'series', title: 'string', color: 'string', linewidth: 'number',
    style: 'string', trackprice: 'boolean', histbase: 'number', offset: 'number',
    join: 'bool', editable: 'boolean', show_last: 'number', display: 'string',
    format: 'string', precision: 'number', force_overlay: 'boolean',
};

//prettier-ignore
const PLOT_SHAPE_ARGS_TYPES = {
    series: 'series', title: 'string', style: 'string', location: 'string',
    color: 'string', offset: 'number', text: 'string', textcolor: 'string',
    editable: 'boolean', size: 'string', show_last: 'number', display: 'string',
    format: 'string', precision: 'number', force_overlay: 'boolean',
};

//prettier-ignore
const PLOT_ARROW_ARGS_TYPES = {
    series: 'series', title: 'string', colorup: 'string', colordown: 'string',
    offset: 'number', minheight: 'number', maxheight: 'number',
    editable: 'boolean', show_last: 'number', display: 'string',
    format: 'string', precision: 'number', force_overlay: 'boolean',
};

export class PlotHelper {
    constructor(private context: any) {}
    private extractPlotOptions(options: PlotCharOptions | PlotShapeOptions) {
        const _options: any = {};
        for (let key in options) {
            _options[key] = Series.from(options[key]).get(0);
        }
        return _options;
    }

    public get linestyle_dashed() {
        return 'linestyle_dashed';
    }
    public get linestyle_dotted() {
        return 'linestyle_dotted';
    }
    public get linestyle_solid() {
        return 'linestyle_solid';
    }
    public get style_area() {
        return 'style_area';
    }
    public get style_areabr() {
        return 'style_areabr';
    }
    public get style_circles() {
        return 'style_circles';
    }
    public get style_columns() {
        return 'style_columns';
    }
    public get style_cross() {
        return 'style_cross';
    }
    public get style_histogram() {
        return 'style_histogram';
    }
    public get style_line() {
        return 'style_line';
    }
    public get style_linebr() {
        return 'style_linebr';
    }
    public get style_stepline() {
        return 'style_stepline';
    }
    public get style_stepline_diamond() {
        return 'style_stepline_diamond';
    }
    public get style_steplinebr() {
        return 'style_steplinebr';
    }

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    //in the current implementation, plot functions are only used to collect data for the plots array and map it to the market data
    plotchar(...args) {
        // if (!this.context.plots[title]) {
        //     this.context.plots[title] = { data: [], options: this.extractPlotOptions(options), title };
        // }
        // const value = Series.from(series).get(0);
        // this.context.plots[title].data.push({
        //     time: this.context.marketData[this.context.idx].openTime,
        //     value: value,
        //     options: { ...this.extractPlotOptions(options), style: 'char' },
        // });
        this.any(...args);
    }

    //this will map to plot() - see README.md for more details

    any(...args) {
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
            options: { color: options.color, offset: options.offset },
        });
    }
    plotshape(...args) {
        const _parsed = parseArgsForPineParams<PlotShapeOptions>(args, PLOT_SHAPE_SIGNATURE, PLOT_SHAPE_ARGS_TYPES);
        const { series, title, ...others } = _parsed;
        const options: PlotShapeOptions = this.extractPlotOptions(others);
        if (!this.context.plots[title]) {
            this.context.plots[title] = { data: [], options: { ...options, style: 'shape', shape: options.style }, title };
        }
        const value = Series.from(series).get(0);
        this.context.plots[title].data.push({
            time: this.context.marketData[this.context.idx].openTime,
            value: value,
            options:
                options?.location === 'absolute' || value
                    ? {
                          text: options.text,
                          textcolor: options.textcolor,
                          color: options.color,
                          offset: options.offset,
                          shape: options.style,
                          location: options.location,
                          size: options.size,
                      }
                    : undefined,
        });
    }

    plotarrow(...args) {
        const _parsed = parseArgsForPineParams<PlotArrowOptions>(args, PLOT_ARROW_SIGNATURE, PLOT_ARROW_ARGS_TYPES);
        const { series, title, ...others } = _parsed;
        const value = Series.from(series).get(0);
        const options: PlotArrowOptions = this.extractPlotOptions(others);
        if (!this.context.plots[title]) {
            this.context.plots[title] = { data: [], options: { ...options, style: 'shape' }, title };
        }

        this.context.plots[title].data.push({
            time: this.context.marketData[this.context.idx].openTime,
            value: value,
            options:
                typeof value === 'number' && !isNaN(value) && value !== 0
                    ? {
                          text: undefined,
                          textcolor: undefined,
                          color: value > 0 ? options.colorup : options.colordown,
                          offset: options.offset,
                          shape: value > 0 ? 'arrowup' : 'arrowdown',
                          location: value > 0 ? 'belowbar' : 'abovebar',
                          height: options.maxheight,
                      }
                    : undefined,
        });
    }
}

export class HlineHelper {
    constructor(private context: any) {}

    public get style_dashed() {
        return 'dashed';
    }
    public get style_solid() {
        return 'solid';
    }
    public get style_dotted() {
        return 'dotted';
    }

    param(source: any, index: number = 0, name?: string) {
        return Series.from(source).get(index);
    }

    //this will map to hline()
    any(price, title, color, linestyle, linewidth, editable, display) {
        //plot.any is mapped to plot() at runtime
        return this.context.pine.plot.any(price, { title, color, linestyle, linewidth, editable, display });
    }
}
