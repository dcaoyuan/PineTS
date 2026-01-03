# Change Log

## [0.7.7] - 2025-01-03 - Live Streaming Support

### Added

-   **PineTS.stream() Method**: Event-driven wrapper of `PineTS.run()` to simplify handling live data and real-time updates
-   Documentation updates for streaming functionality

### Fixed

-   **Critical Fix**: Live data processing was producing wrong values in `ta.*` functions due to incorrect handling of current vs committed candles

## [0.7.6] - 2025-12-30 - Additional Plot Functions

### Added

-   **Plot Functions**: Added support for additional Pine Script plot functions:
    -   `plotbar()` - Renders OHLC data as traditional bar charts with horizontal ticks
    -   `plotcandle()` - Renders OHLC data as candlesticks with filled bodies and wicks
    -   `bgcolor()` - Fills the chart background with colors based on conditions
    -   `barcolor()` - Colors the main chart candlesticks based on indicator conditions

### Changed

-   Enhanced `Plots` namespace with support for OHLC array values and color application to main chart
-   Updated API coverage documentation to reflect new plot functions

## [0.7.5] - 2025-12-29 - UDT Support

### Added

-   Support for User defined types

## [0.7.4] - 2025-12-27 - Plot styles fix + PineScript transpiler coverage

### Added

-   Unit-tests for PineToJS transpiler branch bringing the total coverage back to > 80%

### Fixed

-   plot styles were missing in the generated code (e.g plot.style_columns ...etc )

## [0.7.3] - 2025-12-24 - Plot Functions & PineScript Types Enhancement

### Added

-   **Plot Functions**: Added support for `plotshape` and `plotarrow` functions
-   **PineScript Type Constants**: Full implementation of PineScript type namespaces:
    -   `format.*` - Number format types
    -   `plot.*` - Plot style types
    -   `location.*` - Location constants for shapes
    -   `size.*` - Size constants for shapes
    -   `shape.*` - Shape style constants
    -   `display.*` - Display mode constants

## [0.7.2] - 2025-12-22 - Binance Provider Hotfix

-   Hotfix : Binance provider failing for USA users, implemented a fallback logic to use the default binance url and fallback to US local url if the first one fails.

## [0.7.0] - 2025-12-20 - Pine Script Parser & Build System Modernization

### Added

-   **Pine Script Parser/Converter**: Initial implementation of native Pine Script parser that automatically detects and converts Pine Script v5 and v6 source code into PineTS executable code. PineTS.run(source) can now run a native PineScript source.
-   **Async Statement Handling**: Graceful handling of async statements (e.g., `request.security`) declared in PineTS syntax without explicit `await`, bringing PineTS syntax closer to native Pine Script
-   **Test Coverage**: New comprehensive unit tests covering the PineTS transpiler
-   **Namespace Documentation**: Added detailed documentation for Namespaces folder

### Changed

-   **Build Pipeline**: Updated build system to generate modern package supporting multiple formats and environments (ESM, CJS, UMD)
-   **Plot Namespace**: Restructured Plot namespace for better organization and maintainability
-   **Documentation**: Updated README with improved formatting and comprehensive project information

### Fixed

-   **Critical TA bug** : Fixed a critical bug in atr, ema and stdev moving averages, the bug was affecting series that contain NaN values.
-   **Equality Operator**: Fixed `__eq` method to properly handle string value comparisons
-   **Transpiler Expression Handling**: Fixed wrong decomposition of expressions passed to JSON objects
-   **TA Functions**: Fixed `ta.pivotlow` and `ta.pivothigh` when called without optional source argument
-   **Matrix Build**: Fixed matrix namespace build issues

## [0.6.0] - 2025-12-15 - Array, Map, Matrix namespaces & API enhancements

### Added

-   **Array namespace enhancements**:
    -   Implementation of array strong typing
    -   Array binary search functions
    -   Additional array methods: `sum`, `avg`, `min`, `max`, `median`, `mode`, `stdev`, `variance`, `covariance`, `standardize`, `range`, `abs`, `percentrank`, `percentile_linear_interpolation`, `percentile_nearest_rank`
-   **Map namespace**: Full support for `map` namespace operations
-   **Matrix namespace**: Full support for `matrix` namespace operations
-   **Timeframe namespace**: Complete implementation of timeframe-related functions
-   **Request namespace**: Added `request.security_lower_tf` function
-   **Syminfo namespace**: Fully implemented in Binance provider
-   Better API coverage tracking with badges
-   Progress on `math` methods implementations

### Changed

-   Updated `input.*` namespace to fully support dynamic Pine Script parameters

### Fixed

-   Map and Matrix initialization issues
-   Array precision handling
-   Array methods fixes to match exact PineScript logic: `slice`, `every`, `median`, `mode`, `percentile_nearest_rank`, `percentrank`, `some`, `sort_indices`, `sort`
-   Array method fixes: `fill`, `new_float`, `push`, `set`, `unshift`
-   Transpiler return statement for native data
-   Binance provider cache handling
-   Transpiler: passing native series to JSON objects

## [0.5.0] - 2025-12-04 - Extensive TA implementation & Transpiler enhancements

### Added

-   Comprehensive implementation of `ta` namespace methods:
    -   **Trend**: `supertrend`, `dmi`, `sar`, `falling`, `rising`, `cross`
    -   **Volatility/Range**: `bb` (Bollinger Bands), `bbw`, `kc` (Keltner Channels), `kcw`, `range`, `tr` (True Range as method)
    -   **Volume**: `accdist`, `cum`, `iii`, `nvi`, `pvi`, `pvt`, `wad`, `wvad`
    -   **Oscillators**: `cci`, `cmo`, `cog`, `mfi`, `stoch`, `tsi`, `wpr`
    -   **Statistical/Rank**: `correlation`, `barssince`, `valuewhen`, `percentrank`, `percentile_linear_interpolation`, `percentile_nearest_rank`, `mode`, `highestbars`, `lowestbars`
-   Core `bar_index` variable support

### Changed

-   **Unified Namespace Architecture**: All namespace members (e.g., `ta.tr`, `ta.obv`) are now implemented as methods. The transpiler automatically handles the conversion from property access to method call (e.g., `ta.tr` → `ta.tr()`)
-   Updated `ta.tr` and `ta.obv` to align with the unified method pattern

### Fixed

-   **`var` keyword semantics**: Implemented correct Pine Script behavior for `var` variables (initialize once, persist state across bars) via `$.initVar`
-   `math.sum` handling of `NaN` values
-   Transpiler handling of tertiary conditions involving Series access
-   `ta.supertrend` calculation logic

## [0.4.0] - TBD - Request.security implementation and transpiler enhancements

### Added

-   Full implementation of `request.security()` function with lookahead and gaps support
-   New TA methods: `obv`, `alma`, `macd`, `swma`, `vwap`
-   Architecture documentation for transpiler, runtime, and namespaces
-   Support for handling raw .pine.ts indicator code (without context function wrapper)
-   Ability to show original code lines in transpiled code as comments for debugging
-   Comprehensive unit tests for `request.security()` functionality
-   harmonization of Series logic accross the codebase

### Changed

-   Restructured TA unit tests for better organization
-   Improved Series handling for better performance and reliability
-   Enhanced transpiler to handle implicit pine.ts imports and normalize native imports
-   Namespaces import harmonization across the codebase

### Fixed

-   Critical recursion bug in `request.security()` implementation
-   Tuple return handling in functions
-   Property type check issues

## [0.3.1] - 2025-11-26 - Code coverage

### Added

-   Automatic code coverage badge generation

## [0.3.0] - 2025-11-26 - Major refactor + optimization

### Added

-   Pagination and streaming mode support for processing large datasets
-   Automatic regression tests generator for Pine Script compatibility testing
-   Series class implementation for forward arrays optimization
-   Support for checking transpiled code during development
-   Added Pine Script language unit tests
-   Added WillVixFix and SQZMOM indicators for compatibility tests
-   Automatic code coverage badge

### Changed

-   Major namespaces refactoring for better organization and maintainability
-   Transpiler refactor for improved code generation
-   Updated unit tests with new approach to compare to Pine Script data
-   Updated documentation pages and build process
-   Improved README readability and documentation links

### Fixed

-   Fixed compound assignment operations
-   Fixed history access in series
-   Fixed index handling in forward arrays
-   Fixed plot parameters
-   Fixed arithmetic operations for native series
-   Fixed browser build
-   Fixed plot values and time indexes

## [0.2.1] - 2025-11-16 - Hotfix: floating point equality + performance optimization

### Fixed

-   Missing math namespace for floating point equality check
-   Small performance optimization (removed array slicing in the main loop)

### Changed

-   Updated README and transpiler unit tests (added cache id)
-   Documentation indicators update

## [0.2.0] - 2025-11-15 - Major TA performance optimization

### Changed

-   Performance optimization: reimplementation of most TA functions to enhance performance (~x5 execution speed on average)
-   Documentation updates

## [0.1.34] - 2025-04-24 - Documentation and bug fixes

### Fixed

-   Fix issue #4 (https://github.com/alaa-eddine/PineTS/issues/4)
-   Fix doc page chart

### Changed

-   Documentation updates
-   Added demo chart to the documentation
-   Theme update: switching to just-the-docs theme
-   GitHub pages layout updates
-   Documentation layout fixes

## [0.1.33] - 2025-04-24 - Functions variables bug fix

### Fixed

-   Functions variables bug fix

## [0.1.32] - 2025-04-23 - TA crossover functions

### Added

-   Support for ta.crossover, ta.crossunder, ta.pivothigh, ta.pivotlow functions

## [0.1.31] - 2025-02-12 -

### Added

-   Fix for math.avg function

## [0.1.3] - 2025-02-10 -

### Added

-   Multiple transpiler fixes
-   Fix Logical, Binary and unary expressions when passed as arguments to PineTS internal functions (e.g plot(close && open, ...))
-   Support fo "na" as valid value (will be converted to NaN by the transpiler)
-   Fix for Pine Script functions returning tupples
-   Add partial support for color.rgb and color.new (these need to be completely rewritten)
-   Experimenting a cache approach for TA functions (not yet ready, only tested with sma)
-   Add Support for querying large time interval from MarketDataProvider by running multiple requests with a step, the requested market data is cached to prevent rate limiting and optimize performance
-   Complete refactor of math.\* functions to ensure compatibility with time series for all functions using the same syntax as Pine Script

## [0.1.2] - 2025-02-05 - initial request.security() support

### Added

-   Support for request.security() function : in this build we only support the security() function for timeframes higher than the current timeframe, also, gaps, ignore_invalid_symbol, currency and calc_bars_count parameters are supported yet

## [0.1.1] - 2025-02-01 - array namespace

### Added

-   array namespace partial support. Ported functions : array.new_bool, array.new_float, array.new_int, array.new_string, array.new<type>, abs, avg, clear, concat, copy, covariance, every, fill, first, from, get, includes, indexof, insert, join, last, lastindexof, pop, push, range, remove, reverse, set, shift, slice, some, sort, sort_indices, standardize, stdev, sum.
-   Documentation pages to track portage coverage of Pine Script API and Language features.

## [0.1.0] - 2025-01-29 - Initial release

This is the first release of PineTS, a TypeScript library that allows you to port Pine Script indicators to TypeScript.

### Added

-   Support for Pine Script time series, if conditions, for loops, functions, and partial plot directives.
-   Partial implementation of ta namespace. ported functions : ema, sma, vwma, wma, hma, rma, change, rsi, atr, mom, roc, dev, variance, highest, lowest, median, stdev, linreg, supertrend.
-   Partial implementation of math namespace. ported functions : abs, pow, sqrt, log, ln, exp, floor, round, random, max, min, sin, cos, tan, asin, acos, atan, avg.
