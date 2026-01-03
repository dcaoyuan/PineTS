[![npm version](https://img.shields.io/npm/v/pinets.svg?style=flat-square)](https://www.npmjs.com/package/pinets)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg?style=flat-square)](https://opensource.org/licenses/AGPL-3.0)
[![Coverage](./.github/badges/coverage.svg)](./.github/badges/coverage.svg)
[![Documentation](https://img.shields.io/badge/docs-github--pages-blue?style=flat-square)](https://quantforgeorg.github.io/PineTS/)
[![Reddit](https://img.shields.io/reddit/subreddit-subscribers/QuantForge?style=flat-square&logo=reddit)](https://www.reddit.com/r/QuantForge/)

---

**PineTS** is a JavaScript/TypeScript runtime that enables execution of Pine Script indicators in JavaScript environments. It supports two input formats:

1. **Native Pine Script v5/v6** _(experimental)_ - Run original Pine Script code directly
2. **PineTS Syntax** - A JavaScript/TypeScript syntax that closely mirrors Pine Script

This makes it possible to run Pine Script indicators in Node.js, browsers, and other JavaScript runtimes without modification or with minimal conversion effort.

> _Disclaimer : PineTS is an independent project and is not affiliated with, endorsed by, or associated with TradingView or Pine Script™. All trademarks and registered trademarks mentioned belong to their respective owners._

## Overview

PineTS is a runtime + transpiler that converts Pine Script (or PineTS syntax) into executable JavaScript. It preserves the original functionality and behavior while providing robust handling of time-series data processing, technical analysis calculations, and Pine Script's distinctive scoping mechanisms.

### Input Format Support

-   **Native Pine Script** _(experimental)_: Run original Pine Script v5 and v6 indicators directly. Note that some indicators may fail if they use Pine Script API features not yet implemented in PineTS. Check the [API coverage badges](#pine-script-api-coverage) below to verify compatibility.
-   **PineTS Syntax**: A JavaScript/TypeScript syntax that mirrors Pine Script closely, requiring minimal conversion effort from original Pine Script code.

## See it in action

Bellow are two ports of Pine Script indicators running in the browser.
PineTS is used to generate plot data, and tradingview light weight chart is used to display the plot.

-   [Williams Vix Fix](https://quantforgeorg.github.io/PineTS/indicators/willvixfix/)
-   [Squeeze Momentum](https://quantforgeorg.github.io/PineTS/indicators/sqzmom/)

## Key Features

-   **Native Pine Script Support**: Run original Pine Script v5/v6 code directly _(experimental)_
-   **Dual Input Format**: Support for both native Pine Script and PineTS syntax
-   **High Precision**: Aims for the same precision as Pine Script (up to the 8th digit)
-   **Time-Series Processing**: Handles historical data and series operations
-   **Technical Analysis Functions**: Comprehensive set of 60+ TA indicators and calculations
-   **Mathematical Operations**: Advanced mathematical functions and precision handling
-   **Input Management**: Flexible parameter and input handling system
-   **Context Management**: Maintains proper scoping and variable access rules
-   **Runtime Transpilation**: Converts code to executable JavaScript at runtime without pre-compilation

## Core Components

### PineTS Class

The main class that handles:

-   Market data management
-   Series calculations
-   Built-in variables (open, high, low, close, volume, etc.)
-   Runtime execution context

### Namespaces

-   **Core**: Essential Pine Script functionality and base operations
-   **TechnicalAnalysis**: Comprehensive set of technical indicators and analysis functions
-   **PineMath**: Mathematical operations and precision handling
-   **Input**: Parameter and input management system
-   **Syminfo**: Symbol information and market data helpers

## Installation

```bash
npm install pinets
```

## Usage Examples

### Streaming Data

PineTS provides a convenient event-based interface for streaming live data:

```javascript
import { PineTS, Provider } from 'pinets';

const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', '1m');

// Start streaming with 1 second interval
const evt = pineTS.stream(
    indicator,
    //assuming that indicator is a pine source code or pineTS function
    {
        pageSize: 10,
        live: true,
        interval: 1000,
    }
);

evt.on('data', (ctx) => {
    console.log('Update:', ctx.result.close);
});

// See documentation for full details
```

### Option 1: Run Native Pine Script Directly _(Experimental)_

Starting with v0.7.0, you can run original Pine Script code directly:

```javascript
import { PineTS, Provider } from 'pinets';

// Initialize with market data
const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);

// Run native Pine Script directly
const pineScriptCode = `
//@version=5
indicator('My EMA Cross Strategy')

ema9 = ta.ema(close, 9)
ema18 = ta.ema(close, 18)

bull_bias = ema9 > ema18
bear_bias = ema9 < ema18

plot(ema9, title = '9 EMA', color = color.yellow)
plot(ema18, title = '18 EMA', color = color.red)
`;

const { plots } = await pineTS.run(pineScriptCode);
//access ema9 and ema18 plots data
```

> **⚠️ Note**: Native Pine Script support is experimental. Some indicators may fail if they use API features not yet implemented. Refer to the [API coverage badges](#pine-script-api-coverage) to check compatibility.

### Option 2: Use PineTS Syntax

PineTS syntax is a JavaScript/TypeScript version of Pine Script with minimal differences:

#### Converting Pine Script to PineTS

Original Pine Script:

<table width="100%">
<tr>
<td>

```pinescript
/*==[ Original Pine Script ]==*/

//@version=5
indicator('My EMA Cross Strategy');

ema9 = ta.ema(close, 9);
ema18 = ta.ema(close, 18);

bull_bias = ema9 > ema18;
bear_bias = ema9 < ema18;

prev_close = close[1];
diff_close = close - prev_close;

_oo = open;
_oo = math.abs(open[1] - close[2]);

// plot ema's
plot(ema9, title = '9 EMA', color = color.yellow)
plot(ema18, title = '18 EMA', color = color.red)
```

</td>
<td>

```javascript
/*==[ Equivalent PineTS ]==*/

//
indicator('My EMA Cross Strategy');

let ema9 = ta.ema(close, 9);
let ema18 = ta.ema(close, 18);

let bull_bias = ema9 > ema18;
let bear_bias = ema9 < ema18;

let prev_close = close[1];
let diff_close = close - prev_close;

let _oo = open;
_oo = math.abs(open[1] - close[2]);

// plot ema's
plot(ema9, { title: '9 EMA', color: color.yellow });
plot(ema18, { title: '18 EMA', color: color.red });
```

</td>
</tr>
</table>

### Running PineTS Code

```javascript
import { PineTS, Provider } from 'pinets';

// Initialize with market data
const pineTS = new PineTS(Provider.Binance, 'BTCUSDT', 'D', 100);

// Run your indicator
const { result } = await pineTS.run((context) => {
    const { ta, math } = context;
    const { close, open } = context.data;

    let ema9 = ta.ema(close, 9);
    let ema18 = ta.ema(close, 18);

    let bull_bias = ema9 > ema18;
    let bear_bias = ema9 < ema18;

    let prev_close = close[1];
    let diff_close = close - prev_close;

    let _oo = open;
    _oo = math.abs(open[1] - close[2]);

    return { ema9, ema18, bull_bias, bear_bias };
});
```

> **📖 For detailed documentation on initialization options, parameters, and advanced usage, see the [Initialization and Usage Guide](https://quantforgeorg.github.io/PineTS/initialization-and-usage/)**

## Key Differences: PineTS Syntax vs Native Pine Script

When using **PineTS syntax** (not native Pine Script), note these differences:

1. **Variable Declaration**: Use JavaScript's `const`, `let`, and `var` instead of Pine Script's implicit declaration
2. **Function Syntax**: JavaScript arrow functions and standard function syntax
3. **Module System**: Import Pine Script namespaces from context: `const { ta } = context; const { close, open } = context.data;`
4. **Object Syntax**: Use JavaScript object notation for parameters: `plot(ema9, { title: '9 EMA', color: color.yellow })`
5. **Scoping Rules**: Maintains Pine Script's series behavior through runtime transformation
6. **Return Syntax**: Can return an object with indicator results for easy access in JavaScript

When using **Native Pine Script**, write code exactly as you would in TradingView - no conversion needed!

## Project Goals

PineTS aims for **full coverage** of Pine Script functions and capabilities to enable seamless execution of Pine Script indicators in JavaScript environments.

**Current Status (v0.7.3)**:

-   ✅ **Native Pine Script Support (Experimental)**: Run original Pine Script v5/v6 code directly
-   ✅ **PineTS Runtime Transpiler**: Convert PineTS syntax to executable JavaScript
-   ✅ **Core Pine Script API**: ~75% coverage of built-in functions and variables
-   ✅ **Series and Scope Management**: Full Pine Script semantics preserved
-   ✅ **Technical Analysis**: 60+ indicators and analysis functions
-   ✅ **Mathematical Operations**: Comprehensive math functions
-   ✅ **Data Structures**: Arrays and Matrices (90+ operations)
-   ✅ **Input System**: Dynamic parameter handling
-   ✅ **Plot Data Management**: Multi-series plotting support
-   ✅ **Real-time Execution**: Live data processing capability
-   ✔️🚧 **Market Data Providers**: Binance supported (more coming soon)
-   ✅ **Visualization**: Interactive charting ==> handled in [QFChart](https://github.com/QuantForgeOrg/QFChart)
-   🚧 **Caching System**: Script and market data optimization (in progress)
-   🎯 **Strategy Execution**: Backtesting and live trading (planned)

> **⚠️ API Coverage**: While PineTS supports native Pine Script execution, not all Pine Script API features are implemented yet. Check the [API coverage badges](#pine-script-api-coverage) below to verify if specific functions are available. Indicators using unimplemented features will fail with descriptive error messages.

## Technical Details

The library uses a dual-layer transpilation system:

### Pine Script Parser _(v0.7.0+, Experimental)_

-   Automatically detects Pine Script v5 and v6 code
-   Converts native Pine Script syntax to PineTS intermediate representation
-   Preserves Pine Script semantics and behavior

### Runtime Transpiler

-   Transforms PineTS source (or converted Pine Script) to handle time-series data
-   Manages variable scoping and context
-   Handles array indexing and series operations
-   Provides Pine Script-compatible function calls
-   Executes in real-time without pre-compilation
    ==> The resulting code is a low level javascript that allows handling the complex structures and specificities of PineScript

### Pine Script API Coverage

#### Data

[![syminfo](./.github/badges/api-syminfo.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/syminfo.html)
[![session](./.github/badges/api-session.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/session.html)
[![timeframe](./.github/badges/api-timeframe.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/timeframe.html)
[![barstate](./.github/badges/api-barstate.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/barstate.html)
[![ticker](./.github/badges/api-ticker.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/ticker.html)
[![builtin](./.github/badges/api-builtin.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/builtin.html)

#### Calculation

[![ta](./.github/badges/api-ta.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/ta.html)
[![math](./.github/badges/api-math.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/math.html)
[![array](./.github/badges/api-array.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/array.html)
[![map](./.github/badges/api-map.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/map.html)
[![matrix](./.github/badges/api-matrix.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/matrix.html)
[![request](./.github/badges/api-request.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/request.html)
[![types](./.github/badges/api-types.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/types.html)
[![strategy](./.github/badges/api-strategy.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/strategy.html)
[![input](./.github/badges/api-input.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/input.html)

#### Visualization

[![color](./.github/badges/api-color.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/color.html)
[![plots](./.github/badges/api-plots.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/plots.html)
[![chart](./.github/badges/api-chart.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/chart.html)
[![label](./.github/badges/api-label.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/label.html)
[![line](./.github/badges/api-line.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/line.html)
[![polyline](./.github/badges/api-polyline.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/polyline.html)
[![box](./.github/badges/api-box.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/box.html)
[![table](./.github/badges/api-table.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/table.html)
[![linefill](./.github/badges/api-linefill.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/linefill.html)

#### Logging

[![log](./.github/badges/api-log.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/log.html)
[![str](./.github/badges/api-str.svg)](https://quantforgeorg.github.io/PineTS/api-coverage/str.html)

---

## Contributing

Contributions are welcome! Please feel free to submit pull requests, create issues, or suggest improvements.

## License

This project is open-source and available under the AGPL License.

## Disclaimer

PineTS is an independent project and is not affiliated with, endorsed by, or associated with TradingView or Pine Script. All trademarks and registered trademarks mentioned belong to their respective owners.
