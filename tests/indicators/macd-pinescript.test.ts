import { PineTS } from 'index';
import { describe, expect, it } from 'vitest';

import { Provider } from '@pinets/marketData/Provider.class';

describe('Indicators', () => {
    it('MACD from Pine Script source', async () => {
        const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '1d', 100, 0, new Date('Dec 25 2024').getTime() - 1);
        const code0 = `
//@version=6
indicator(title="Moving Average Convergence Divergence", shorttitle="MACD", timeframe="", timeframe_gaps=true)
// Getting inputs
fast_length = input(title = "Fast Length", defval = 12)
slow_length = input(title = "Slow Length", defval = 26)
src = input(title = "Source", defval = close)
signal_length = input.int(title = "Signal Smoothing",  minval = 1, maxval = 50, defval = 9, display = display.data_window)
sma_source = input.string(title = "Oscillator MA Type",  defval = "EMA", options = ["SMA", "EMA"], display = display.data_window)
sma_signal = input.string(title = "Signal Line MA Type", defval = "EMA", options = ["SMA", "EMA"], display = display.data_window)
// Calculating
fast_ma = sma_source == "SMA" ? ta.sma(src, fast_length) : ta.ema(src, fast_length)
slow_ma = sma_source == "SMA" ? ta.sma(src, slow_length) : ta.ema(src, slow_length)
macd = fast_ma - slow_ma
signal = sma_signal == "SMA" ? ta.sma(macd, signal_length) : ta.ema(macd, signal_length)
hist = macd - signal

alertcondition(hist[1] >= 0 and hist < 0, title = 'Rising to falling', message = 'The MACD histogram switched from a rising to falling state')
alertcondition(hist[1] <= 0 and hist > 0, title = 'Falling to rising', message = 'The MACD histogram switched from a falling to rising state')

hline(0, "Zero Line", color = color.new(#787B86, 50))
plot(hist, title = "Histogram", style = plot.style_columns, color = (hist >= 0 ? (hist[1] < hist ? #26A69A : #B2DFDB) : (hist[1] < hist ? #FFCDD2 : #FF5252)))
plot(macd,   title = "MACD",   color = #2962FF)
plot(signal, title = "Signal", color = #FF6D00)
plotchar(hist >= 0 and hist[1] < hist, title = "Bullish", style = shape.triangleup, location = location.belowbar, color = #26A69A)
plotshape(hist >= 0 and hist[1] < hist, title = "Bullish", style = shape.triangleup, location = location.belowbar, color = #26A69A)
`;

        const code = `
//@version=6
indicator("Moving Average Convergence Divergence", "MACD", timeframe = "", timeframe_gaps = true)

// Inputs
float  sourceInput  = input.source(close, "Source")
int    fastLenInput = input.int(4, "Fast length",   1)
int    slowLenInput = input.int(2, "Slow length",   1)
int    sigLenInput  = input.int(2,  "Signal length", 1)
string oscTypeInput = input.string("EMA", "Oscillator MA type", ["EMA", "SMA"], display = display.data_window)
string sigTypeInput = input.string("EMA", "Signal MA type",     ["EMA", "SMA"], display = display.data_window)

// @function    Calculates an EMA or SMA of a \`source\` series.
ma(float source, int length, simple string maType) =>
    ta.ema(source, length)

// Calculate and plot the MACD, signal, and histogram values.
float maFast = ma(sourceInput, fastLenInput, oscTypeInput)
float maSlow = ma(sourceInput, slowLenInput, oscTypeInput)
float macd   = maFast - maSlow
float signal = ma(macd, sigLenInput, sigTypeInput)
float hist   = macd - signal
color hColor = hist >= 0 ? hist > hist[1] ? #26a69a : #b2dfdb : hist > hist[1] ? #ffcdd2 : #ff5252

//hline(0, "Zero", #787b8680)
plot(hist, "Histogram", hColor, style = plot.style_columns)
plot(macd, "MACD")
plot(signal, "Signal line", #ff6d00)
`;
        const context = await pineTS.run(code);

        console.log(context.plots);
        expect(context.plots).toBeDefined();
    });
});
