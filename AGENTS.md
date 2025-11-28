# PineTS Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Core Architecture](#core-architecture)
3. [The Transpiler Engine](#the-transpiler-engine)
4. [Series and Time-Series Processing](#series-and-time-series-processing)
5. [The param() Function System](#the-param-function-system)
6. [Unique ID Generation](#unique-id-generation)
7. [Context Management](#context-management)
8. [Namespace System](#namespace-system)
9. [Execution Flow](#execution-flow)
10. [Critical Implementation Details](#critical-implementation-details)
11. [Common Pitfalls and Best Practices](#common-pitfalls-and-best-practices)
12. [Syntax Evolution and Deprecation](#syntax-evolution-and-deprecation)

---

## Project Overview

**PineTS** is a JavaScript/TypeScript library that enables the execution of Pine Script-like indicator code in a JavaScript environment. It is **not** a direct Pine Script interpreter, but rather a sophisticated runtime transpiler that converts PineTS code (which closely resembles Pine Script) into executable JavaScript that can process financial time-series data.

### Key Design Goals

1. **Pine Script Compatibility**: Mimic Pine Script v5+ behavior and semantics
2. **Time-Series Processing**: Handle historical data with proper lookback capabilities
3. **Runtime Transpilation**: Transform code at runtime without requiring pre-compilation
4. **Stateful Calculations**: Support incremental technical analysis calculations
5. **Caching & Performance**: Optimize repeated calculations through intelligent caching

---

## Core Architecture

PineTS follows a three-layer architecture:

```
┌─────────────────────────────────────────────────┐
│          User PineTS Code (Input)              │
│    (Looks like Pine Script, uses JS syntax)    │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│           Transpiler Layer                      │
│  • AST Parsing (acorn)                         │
│  • Scope Analysis                              │
│  • Code Transformation                         │
│  • Context Variable Management                 │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Runtime Execution Layer                 │
│  • Context Object ($)                          │
│  • Series Management                           │
│  • Namespace Functions (ta, math, etc.)       │
│  • State Management                            │
└─────────────────────────────────────────────────┘
```

### Main Components

1. **PineTS Class**: Orchestrates market data loading, execution, and pagination
2. **Context Class**: Maintains execution state, series data, and namespaces
3. **Transpiler**: Transforms PineTS code into executable JavaScript
4. **Namespaces**: Provide Pine Script functions (ta.ema, math.abs, etc.)

---

## The Transpiler Engine

The transpiler is the heart of PineTS. It transforms user code to handle Pine Script's unique scoping and time-series behavior.

### Transpilation Pipeline

```
Input Code String/Function
        ↓
┌───────────────────────┐
│  0. Wrapper Check     │
│  • Detect if code is  │
│    already wrapped in │
│    a function         │
│  • Auto-wrap unwrapped│
│    code in (context)  │
│    => { ... }         │
└───────┬───────────────┘
        ↓
┌───────────────────────┐
│  1. Parse to AST      │ (using acorn)
│     (ECMAScript AST)  │
└───────┬───────────────┘
        ↓
┌───────────────────────┐
│  2. Pre-Processing    │
│  • Transform nested   │
│    arrow functions    │
│  • Normalize native   │
│    imports (aliasing) │
│  • Inject implicit    │
│    imports (context.*)│
│  • Identify context-  │
│    bound variables    │
└───────┬───────────────┘
        ↓
┌───────────────────────┐
│  3. Analysis Pass     │
│  • Register functions │
│  • Track parameters   │
│  • Build scope tree   │
│  • Destructure arrays │
└───────┬───────────────┘
        ↓
┌───────────────────────┐
│  4. Transformation    │
│  • Variable scoping   │
│  • Series wrapping    │
│  • Expression Unwrapping│ (Hoisting)
│  • param() injection  │
│  • ID generation      │
└───────┬───────────────┘
        ↓
┌───────────────────────┐
│  5. Post-Processing   │
│  • Transform == to    │
│    $.math.__eq()      │
└───────┬───────────────┘
        ↓
┌───────────────────────┐
│  6. Code Generation   │ (using astring)
│     (Final JS code)   │
└───────────────────────┘
```

### Context Variable System

One of the most critical transformations is converting all user variables to use a **context object** (represented as `$`).

**Original User Code:**

```javascript
let ema9 = ta.ema(close, 9);
```

**Transpiled Code (Simplified):**

```javascript
const p0 = ta.param(close, undefined, 'p0');
const p1 = ta.param(9, undefined, 'p1');
const temp_1 = ta.ema(p0, p1, '_ta0');
$.let.glb1_ema9 = $.init($.let.glb1_ema9, temp_1);
```

#### Why This Transformation?

1. **State Persistence**: Variables need to maintain their history across iterations
2. **Series Behavior**: Every variable becomes a time-series array
3. **Scope Isolation**: Prevents naming conflicts across different scopes
4. **Lookback Support**: Enables `variable[1]` to access previous values
5. **Hoisting & Unwrapping**: Complex expressions are "unwrapped" into temporary variables to ensure proper execution order and simplified debugging.

### Scope Management

The transpiler maintains a sophisticated scope tree. Each variable is renamed with a prefix indicating its scope:

-   `glb1_` - Global scope (first occurrence)
-   `fn2_` - Function scope (second function)
-   `if3_` - If statement scope (third if block)
-   `for1_` - For loop scope

**Example:**

```javascript
// Original
let x = 10;
if (condition) {
    let x = 20; // Different x
}

// Transpiled
$.let.glb1_x = $.init($.let.glb1_x, 10);
if (condition) {
    $.let.if1_x = $.init($.let.if1_x, 20);
}
```

This prevents scope collisions and ensures each variable is tracked independently.

---

## Series and Time-Series Processing

### The Series Class and Data Storage

**Critical Concept**: PineTS uses a **Series class** to provide Pine Script-compatible array access on forward-ordered data.

```
Pine Script Perspective:
[Bar 0, Bar 1, Bar 2, Bar 3, ..., Bar N]
   ↑
  Current bar (index 0)

PineTS Internal Storage (Forward Order):
[Bar 0, Bar 1, Bar 2, ..., Bar N-1, Bar N]
   ↑                                   ↑
  Oldest bar                     Newest bar (current)

Series Access Layer:
Series.get(0) → Bar N (most recent)
Series.get(1) → Bar N-1 (previous)
Series.get(n) → Bar N-n (n bars ago)
```

#### Why Forward Storage with Series Wrapper?

1. **Pine Script Compatibility**: The Series class provides `series[0]` = current bar semantics
2. **Efficient Appending**: New bars are added with `.push()` at the end
3. **Natural Storage**: Matches chronological order of market data
4. **Reverse Index Calculation**: `Series.get(index)` translates to `data[length - 1 - index]`

### The Series Class

The `Series` class is a wrapper around standard JavaScript arrays that provides Pine Script-compatible indexing:

```typescript
class Series {
    constructor(public data: any[], public offset: number = 0) {}

    // Get value at Pine Script index (0 = current, 1 = previous, etc.)
    get(index: number): any {
        const realIndex = this.data.length - 1 - (this.offset + index);
        if (realIndex < 0 || realIndex >= this.data.length) {
            return NaN;
        }
        return this.data[realIndex];
    }

    // Set value at Pine Script index
    set(index: number, value: any): void {
        const realIndex = this.data.length - 1 - (this.offset + index);
        if (realIndex >= 0 && realIndex < this.data.length) {
            this.data[realIndex] = value;
        }
    }
}
```

**Key Features:**

-   **Offset Support**: Enables lookback operations like `close[1]` by creating a new Series with `offset = 1`
-   **Automatic NaN**: Returns NaN for out-of-bounds access (Pine Script behavior)
-   **Forward Array**: Wraps a standard forward-ordered array

### Series Initialization with $.init()

Every variable assignment goes through the `$.init()` function:

```javascript
$.init(target, source, (index = 0));
```

**Purpose:**

-   Creates a time-series array if it doesn't exist
-   Sets the current value (last element) from the source
-   Handles Series objects and regular values
-   Returns the array for chaining

**Implementation Logic:**

```typescript
init(trg, src: any, idx: number = 0) {
    // Handle Series objects
    if (src instanceof Series) {
        src = src.get(0);
    }

    if (!trg) {
        // Initialize new array
        if (Array.isArray(src)) {
            trg = [this.precision(src[src.length - 1 + idx])];
        } else {
            trg = [this.precision(src)];
        }
    } else {
        // Update existing array (at last index = current value)
        if (!Array.isArray(src) || Array.isArray(src[0])) {
            // Handle 2D arrays (tuples) or scalar values
            trg[trg.length - 1] = Array.isArray(src?.[0]) ? src[0] : this.precision(src);
        } else {
            trg[trg.length - 1] = this.precision(src[src.length - 1 + idx]);
        }
    }

    return trg;
}
```

**Example Transformation:**

```javascript
// User writes:
let sma20 = ta.sma(close, 20);

// Transpiler generates:
$.let.glb1_sma20 = $.init($.let.glb1_sma20, ta.sma(ta.param(close, undefined, 'p0'), ta.param(20, undefined, 'p1'), '_ta0'));
```

### Context $.get() and $.set() Methods

The transpiler transforms all array access and assignments to use context methods:

```typescript
// Access a series value with Pine Script semantics
get(source: any, index: number) {
    if (source instanceof Series) {
        return source.get(index);
    }

    if (Array.isArray(source)) {
        // Forward array access: index 0 -> last element
        const realIndex = source.length - 1 - index;
        if (realIndex < 0 || realIndex >= source.length) {
            return NaN;
        }
        return source[realIndex];
    }

    // Scalar value - return as is
    return source;
}

// Set the current value of a series (index 0)
set(target: any, value: any) {
    if (target instanceof Series) {
        target.set(0, value);
        return;
    }

    if (Array.isArray(target)) {
        if (target.length > 0) {
            target[target.length - 1] = value;  // Update current (last element)
        } else {
            target.push(value);
        }
    }
}
```

**Transpiler Transformations:**

```javascript
// User writes:
let prev_close = close[1];
cc = close[2];

// Transpiler generates:
$.let.glb1_prev_close = $.init($.let.glb1_prev_close, $.get(close, 1));
$.set($.let.glb1_cc, $.get(close, 2));
```

### Series Growth (Pushing New Values)

At the end of each iteration, all series grow by pushing the current value:

```javascript
// For each variable in context ['const', 'var', 'let', 'params']
for (let ctxVarName of contextVarNames) {
    for (let key in context[ctxVarName]) {
        if (Array.isArray(context[ctxVarName][key])) {
            const arr = context[ctxVarName][key];
            const val = arr[arr.length - 1]; // Current value (last element)
            arr.push(val); // Append to create history
        }
    }
}
```

This creates the time-series behavior where `variable[1]` accesses the previous bar's value:

```
Before iteration N+1: [val0, val1, ..., valN]
                                          ↑ current

After processing N+1:  [val0, val1, ..., valN, valN+1]
                                          ↑            ↑
                                          [1]          [0] current
```

### Understanding Series.from() Helper

Many TA functions use `Series.from()` to normalize inputs:

```typescript
static from(source: any): Series {
    if (source instanceof Series) return source;
    if (Array.isArray(source)) return new Series(source);
    return new Series([source]); // Wrap scalar in array
}
```

This allows functions to accept:

-   Series objects (pass through)
-   Arrays (wrap in Series)
-   Scalar values (wrap in single-element array, then Series)

---

## The param() Function System

### What is param()?

The `param()` function is a **critical wrapper** that the transpiler automatically injects around all arguments passed to namespace functions.

**Purpose:**

1. **Normalize Arguments**: Convert both single values and series into a consistent series format
2. **Lookback Handling**: Properly handle array access expressions like `close[1]`
3. **Caching**: Enable efficient caching by providing unique identifiers
4. **Type Conversion**: Handle edge cases like `na` (NaN) conversion

### Namespace-Specific param() Functions

Each namespace (ta, math, array, etc.) has its **own** param function:

-   `ta.param()` - For technical analysis functions
-   `math.param()` - For mathematical operations
-   `array.param()` - For array operations
-   `$.param()` - For general context operations

**Why separate functions?**

-   Allows namespace-specific parameter handling
-   Enables different caching strategies per namespace
-   Provides better debugging and error tracing

### param() Signature

```javascript
param(source, index, uniqueId);
```

**Parameters:**

1. `source`: The value or array to wrap
2. `index`: Lookback index (e.g., 1 for `close[1]`)
3. `uniqueId`: Unique identifier for caching (e.g., 'p0', 'p1')

### param() Implementation

The param() function now returns **Series objects** instead of raw arrays:

```typescript
// Context.param() implementation
param(source, index, name?: string) {
    if (typeof source === 'string') return source;

    // Handle Series objects
    if (source instanceof Series) {
        if (index) {
            return new Series(source.data, source.offset + index);
        }
        return source;
    }

    // Skip non-series object types
    if (!Array.isArray(source) && typeof source === 'object') return source;

    // Initialize params array if needed
    if (!this.params[name]) this.params[name] = [];

    if (Array.isArray(source)) {
        // Wrap array in Series with optional offset
        return new Series(source, index || 0);
    } else {
        // Wrap scalar value: store in params array, then wrap in Series
        if (this.params[name].length === 0) {
            this.params[name].push(source);
        } else {
            this.params[name][this.params[name].length - 1] = source;
        }
        return new Series(this.params[name], 0);
    }
}
```

**Namespace-Specific param() implementations (ta, math) are similar:**

```typescript
// ta.param() and math.param()
export function param(context: any) {
    return (source: any, index: any, name?: string) => {
        if (source instanceof Series) {
            if (index) {
                return new Series(source.data, source.offset + index);
            }
            return source;
        }

        if (!context.params[name]) context.params[name] = [];

        if (Array.isArray(source)) {
            return new Series(source, index || 0);
        } else {
            if (context.params[name].length === 0) {
                context.params[name].push(source);
            } else {
                context.params[name][context.params[name].length - 1] = source;
            }
            return new Series(context.params[name], 0);
        }
    };
}
```

### How Lookback Works with Series

When you write `close[1]`, the transpiler transforms it to:

```javascript
ta.param(close, 1, 'p0');
```

Inside param():

```javascript
// close is [oldestValue, ..., newestValue] (forward array)
// index is 1
// Result: new Series(close, 1)
//
// When Series.get(0) is called:
// realIndex = close.length - 1 - (offset + 0)
// realIndex = close.length - 1 - 1 = close.length - 2
// Returns the second-to-last element (previous bar)
return new Series(source, index);
```

This creates a **Series wrapper with an offset**, so when the TA function accesses `series.get(0)`, it automatically gets the value from `n` bars ago.

---

## Unique ID Generation

The transpiler generates **unique identifiers** for two purposes:

### 1. Parameter IDs (for param function)

**Counter**: `paramIdCounter`

**Format**: `'p0'`, `'p1'`, `'p2'`, ...

**Purpose**:

-   Uniquely identify each parameter passed to namespace functions
-   Enable caching of parameter transformations
-   Track parameter lineage for debugging

**Example:**

```javascript
ta.ema(close, 9);
// Becomes:
ta.ema(ta.param(close, undefined, 'p0'), ta.param(9, undefined, 'p1'), '_ta0');
```

### 2. TA Call IDs (for state management)

**Counter**: `taCallIdCounter`

**Format**: `'_ta0'`, `'_ta1'`, `'_ta2'`, ...

**Purpose**:

-   Uniquely identify each technical analysis function call
-   Enable separate state tracking for multiple calls to the same function
-   Critical for incremental calculations

**Why This Matters:**

Consider this code:

```javascript
let ema1 = ta.ema(close, 9);
let ema2 = ta.ema(close, 21);
let ema3 = ta.ema(close, 9); // Same parameters as ema1!
```

Without unique call IDs:

-   `ema1` and `ema3` would share the same state (both use period 9)
-   They would return identical values (wrong!)
-   State would be corrupted

With unique call IDs:

```javascript
let ema1 = ta.ema(close, 9, '_ta0'); // Own state
let ema2 = ta.ema(close, 21, '_ta1'); // Own state
let ema3 = ta.ema(close, 9, '_ta2'); // Own state
```

Each call maintains **independent state** even with identical parameters.

### 3. Cache IDs (for optimization)

**Counter**: `cacheIdCounter`

**Format**: `'cache_0'`, `'cache_1'`, ...

**Purpose**:

-   Cache complex calculations
-   Avoid redundant computations
-   Improve performance for expensive operations

---

## Context Management

The **Context** class is the runtime execution environment. It holds all state during indicator execution.

### Context Structure

```typescript
class Context {
    // Market data (forward chronological order - oldest to newest)
    data: {
        open: []; // Opening prices (forward array)
        high: []; // High prices (forward array)
        low: []; // Low prices (forward array)
        close: []; // Closing prices (forward array)
        volume: []; // Volume data (forward array)
        hl2: []; // (high + low) / 2
        hlc3: []; // (high + low + close) / 3
        ohlc4: []; // (open + high + low + close) / 4
        openTime: []; // Bar open timestamps
        closeTime: []; // Bar close timestamps
    };

    // User variables by declaration type
    const: {}; // Variables declared with const
    let: {}; // Variables declared with let
    var: {}; // Variables declared with var
    params: {}; // Parameter-wrapped series

    // Namespace instances
    ta: TechnicalAnalysis;
    math: PineMath;
    array: PineArray;
    input: Input;
    request: PineRequest;
    core: Core;
    lang: any;

    // Constants
    NA: any = NaN;

    // State management
    taState: {}; // TA function states (for incremental calculations)
    cache: {}; // General caching

    // Execution state
    idx: number; // Current iteration index
    result: any; // Accumulated results
    plots: {}; // Plot metadata

    // Market data references
    marketData: any;
    source: IProvider | any[];
    tickerId: string;
    timeframe: string;
    limit: number;
    sDate: number;
    eDate: number;
    pineTSCode: Function | String;

    // Runtime methods
    init(target, source, index): any; // Initialize/update series
    param(source, index, name): Series; // Wrap values in Series
    get(source, index): any; // Get value from series
    set(target, value): void; // Set current value in series
    precision(value, decimals): number; // Round to N decimals (default 10)
}
```

### Context Lifecycle

```
┌─────────────────────────┐
│  1. Context Creation    │
│  - Initialize namespaces│
│  - Set up data arrays   │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  2. Data Population     │
│  - Load market data     │
│  - Initialize series    │
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  3. Iteration Loop      │◄───┐
│  For each bar:          │    │
│  - Update context.idx   │    │
│  - Push new data        │    │
│  - Execute transpiled   │    │
│    code                 │    │
│  - Collect results      │    │
│  - Grow all series      │────┘
└──────────┬──────────────┘
           ↓
┌─────────────────────────┐
│  4. Result Collection   │
│  - Aggregate outputs    │
│  - Return final context │
└─────────────────────────┘
```

### State Management for TA Functions

Technical analysis functions use `context.taState` to maintain incremental calculation state.

**Example: EMA State**

```javascript
context.taState['_ta0'] = {
    prevEma: 100.5, // Previous EMA value
    initSum: 950.2, // Sum for initialization
    initCount: 9, // Count for initialization
};
```

This enables **incremental calculations** instead of recalculating from scratch each bar.

---

## Namespace System

Namespaces organize related functionality (similar to Pine Script's namespaces).

### Namespace Structure

Each namespace:

1. Is instantiated with the Context
2. Has its own `param()` function
3. Implements Pine Script-compatible functions
4. May have its own caching/state management

### Common Namespaces

#### ta (Technical Analysis)

-   `ta.sma()` - Simple Moving Average
-   `ta.ema()` - Exponential Moving Average
-   `ta.rsi()` - Relative Strength Index
-   `ta.atr()` - Average True Range
-   ... many more

#### math (Mathematical Operations)

-   `math.abs()` - Absolute value
-   `math.max()` - Maximum
-   `math.min()` - Minimum
-   `math.avg()` - Average
-   `math.__eq()` - Special equality check (handles NaN)
-   ... many more

#### array (Array Operations)

-   `array.new()` - Create new array
-   `array.push()` - Add element
-   `array.get()` - Get element
-   ... many more

### Namespace Factory Pattern

All namespace functions use a factory pattern:

```javascript
// Export a factory function
export function ema(context: any) {
    // Return the actual function
    return (source: any, period: any, callId?: string) => {
        // Implementation
    };
}
```

**Why?**

-   Each function closure has access to the context
-   Functions can maintain state across calls
-   Supports dependency injection for testing

---

## Execution Flow

### Complete Execution Cycle

```
1. User calls: pineTS.run(code, periods)
   ↓
2. PineTS.ready() - Ensure market data loaded
   ↓
3. Initialize Context
   ↓
4. Transpile user code
   ↓
5. For each bar (iteration i):
   ┌─────────────────────────────────┐
   │ a. Set context.idx = i          │
   │ b. Push new OHLCV data          │
   │    (data.close.push(value))     │
   │ c. Execute transpiled function  │
   │ d. Collect result               │
   │ e. Grow all user variables      │
   │    ($.let.var.push(current))    │
   └─────────────────────────────────┘
   ↓
6. Return final Context with results
```

**Key Points:**

-   Data arrays grow with `.push()` (forward append)
-   Variables accessed via `$.get(var, index)` use Pine Script semantics
-   Each iteration processes one bar, growing all series by one element

### Data Flow During Iteration

```
Iteration N (Processing Bar N):

┌──────────────────────┐
│  Market Data Arrays  │
│  [0, 1, 2, ..., N]   │  (Forward order)
└─────────┬────────────┘
          │ push(value[N])
          ▼
┌──────────────────────┐
│ Context.data.close   │
│  [0, 1, ..., N]      │  (Forward order)
└─────────┬────────────┘
          │ Access via $.get(close, index)
          ▼
┌──────────────────────┐
│  Transpiled Code     │
│  $.get(close, 0)     │  → close[N] (current)
│  $.get(close, 1)     │  → close[N-1] (previous)
└─────────┬────────────┘
          │ Results written to $.let.var
          ▼
┌──────────────────────┐
│  Variable Updates    │
│  $.set($.let.var, x) │  → var[var.length-1] = x
└─────────┬────────────┘
          │ push(current_value)
          ▼
┌──────────────────────┐
│  Series History      │
│  [0, 1, ..., N]      │  (Forward order)
└──────────────────────┘
```

### Pagination Mode

PineTS supports **pagination** for processing large datasets or live streaming:

```javascript
const generator = pineTS.run(code, periods, pageSize);

for await (const pageContext of generator) {
    // pageContext contains only NEW results for this page
    console.log(pageContext.result);
}
```

**Key Features:**

-   Processes data in chunks (pages)
-   Maintains state across pages
-   Supports live data streaming
-   Automatically recalculates last candle on updates (for live data)
-   Each page yields only new results, not cumulative

**Live Streaming Behavior:**
When live streaming is enabled (`eDate` undefined + provider source):

1. Fetches new candles from provider starting at last candle's openTime
2. Updates last candle if still open (same openTime)
3. Recalculates last bar's results to reflect updated data
4. Appends new complete candles
5. Yields `null` when no new data is available

---

## Critical Implementation Details

### 1. Auto-Wrapping Unwrapped Code

The transpiler automatically detects if the provided code is wrapped in a function. If not, it wraps it in a context arrow function before processing.

**Why This Matters:**

Pine Script indicators can be written in two ways:

1. **Wrapped (explicit context parameter)**:

```javascript
(context) => {
    const { close } = context.data;
    const { ta } = context.pine;
    let sma = ta.sma(close, 20);
};
```

2. **Unwrapped (implicit context)**:

```javascript
const { close } = context.data;
const { ta } = context.pine;
let sma = ta.sma(close, 20);
```

Or even simpler (with implicit imports):

```javascript
let sma = ta.sma(close, 20);
```

**Auto-Wrapping Process:**

1. The transpiler checks if the code is already a function expression/declaration
2. If not wrapped, it automatically wraps it: `(context) => { ... }`
3. This happens **before** AST parsing, ensuring consistent processing
4. Combined with implicit imports, users can write minimal Pine Script-like code

**Implementation:**

The `wrapInContextFunction()` transformer:

-   Parses the code to detect if it's already a function
-   Returns code as-is if already wrapped
-   Wraps in `(context) => { ... }` if not

This enables a more natural Pine Script writing experience where users don't need to worry about the JavaScript function wrapper.

### 2. The Forward Array Growth Pattern

Variables maintain history through appending (pushing):

```javascript
// After calculation (updates last element)
$.set($.let.var, newValue); // Updates last element
// Or during init: $.let.var[$.let.var.length - 1] = newValue

// At end of iteration
const arr = $.let.var;
const val = arr[arr.length - 1]; // Get current value (last element)
arr.push(val); // Append to create history
```

Result:

```
Before: [oldest, ..., prev1, current]  (length = N)
                              ↑
                              index N-1

After:  [oldest, ..., prev1, current, current]  (length = N+1)
                              ↑       ↑
                              index   index N
                              N-1     (new current)

Access via $.get():
  $.get(arr, 0) → arr[N]     (current)
  $.get(arr, 1) → arr[N-1]   (previous)
```

### 3. Equality Check Transformation

JavaScript's `==` and `===` don't properly handle NaN comparisons (critical in financial data).

**Transformation:**

```javascript
// User writes:
if (value == NaN) { ... }

// Transpiler converts to:
if ($.math.__eq(value, NaN)) { ... }
```

The `__eq()` function properly handles:

-   NaN comparisons (NaN == NaN → true in Pine Script)
-   Series comparisons
-   Type coercion edge cases

### 4. Expression Hoisting & Unwrapping

To ensure predictable execution order and easier debugging, the transpiler "unwraps" nested function calls and expressions into temporary variables.

**Array Pattern Destructuring Example:**

```javascript
// User writes:
let [a, b] = ta.supertrend(close, 10, 3);

// Transpiler converts to:
const p0 = ta.param(close, undefined, 'p0');
const p1 = ta.param(10, undefined, 'p1');
const p2 = ta.param(3, undefined, 'p2');
const temp_1 = ta.supertrend(p0, p1, p2, '_ta0');

let a = $.init($.let.glb1_a, temp_1?.[0][0]);
let b = $.init($.let.glb1_b, temp_1?.[0][1]);
```

### 5. Native Symbol Normalization & na Handling

**Normalization:**
The transpiler ensures that standard Pine Script symbols (like `close`, `open`, `ta`, `math`) cannot be renamed by the user via aliasing in imports.
`const { close: c } = context.data;` becomes `const { close } = context.data;` and all usages of `c` are replaced with `close`.

**na Handling:**
The symbol `na` is treated specially:

-   When used as a value: Replaced with `NaN` (e.g., `x = na` -> `x = NaN`).
-   When used as a function: Remains as a function call (e.g., `na(x)`).

### 6. Nested Function Parameters

Function parameters are marked as "context-bound" to prevent transformation:

```javascript
// User writes:
const myFunc = (value) => value * 2;

// Parameter 'value' is NOT transformed to $.let.value
// It remains as 'value' for proper function behavior
```

### 7. Loop Variable Handling

Loop variables receive special treatment:

```javascript
// User writes:
for (let i = 0; i < 10; i++) {
    sum += values[i];
}

// Loop variable 'i' is NOT transformed
// But 'sum' and 'values' ARE transformed
```

### 8. Precision Management

All numeric values are rounded to 10 decimal places (Pine Script standard):

```javascript
context.precision(value, decimals = 10) {
    if (typeof value !== 'number' || isNaN(value)) return value;
    return Number(value.toFixed(decimals));
}
```

---

## Real Transpiler Examples

These examples show actual transpiler output from the test suite:

### Example 1: Basic Variable Assignment

```javascript
// Input:
let sma = ta.sma(close, 20);

// Transpiled Output:
const { close } = $.data;
const ta = $.ta;
const p0 = ta.param(close, undefined, 'p0');
const p1 = ta.param(20, undefined, 'p1');
const temp_1 = ta.sma(p0, p1, '_ta0');
$.let.glb1_sma = $.init($.let.glb1_sma, temp_1);
```

### Example 2: Array Access and Assignment

```javascript
// Input:
let prev_close = close[1];
cc = close[2];

// Transpiled Output:
const { close } = $.data;
$.let.glb1_prev_close = $.init($.let.glb1_prev_close, $.get(close, 1));
$.set($.let.glb1_cc, $.get(close, 2));
```

### Example 3: Binary Operations

```javascript
// Input:
const green_candle = close > open;
const bull_bias = ema9 > ema18;

// Transpiled Output:
const { close, open } = $.data;
// Note: Simple binary ops might inline $.get(), but param() wrappers are still hoisted if used
$.const.glb1_green_candle = $.init($.const.glb1_green_candle, $.get(close, 0) > $.get(open, 0));
$.const.glb1_bull_bias = $.init($.const.glb1_bull_bias, $.get($.const.glb1_ema9, 0) > $.get($.const.glb1_ema18, 0));
```

### Example 4: Nested Function Calls

```javascript
// Input:
let d = ta.ema(math.abs(ap - 99), 10);

// Transpiled Output:
const ta = $.ta;
const math = $.math;
const p0 = math.param($.get($.let.glb1_ap, 0) - 99, undefined, 'p0');
const temp_1 = math.abs(p0, '_ta_math_0'); // (Internal ID may vary)
const p1 = ta.param(temp_1, undefined, 'p1');
const p2 = ta.param(10, undefined, 'p2');
const temp_2 = ta.ema(p1, p2, '_ta0');

$.let.glb1_d = $.init($.let.glb1_d, temp_2);
```

### Example 5: Scoped Variables (If Statement)

```javascript
// Input:
let aa = 0;
if (_cc > 1) {
    let bb = 1;
    aa = 1;
}

// Transpiled Output:
$.let.glb1_aa = $.init($.let.glb1_aa, 0);
if ($.get($.const.glb1__cc, 0) > 1) {
    $.let.if2_bb = $.init($.let.if2_bb, 1); // Scoped to 'if2'
    $.set($.let.glb1_aa, 1); // Updates global scope
}
```

### Example 6: Equality Checks

```javascript
// Input:
if (avg_len === 0) {
    ret_val = cc[1];
}

// Transpiled Output:
if ($.math.__eq($.get(avg_len, 0), 0)) {
    $.set($.let.fn2_ret_val, $.get($.let.fn2_cc, 1));
}
```

**Note:** Equality operators (`==`, `===`) are transformed to `$.math.__eq()` to handle NaN comparisons correctly.

---

## Common Pitfalls and Best Practices

### ⚠️ Pitfall 1: Confusing Storage Order vs Access Order

**Problem:**

```javascript
// Thinking arrays are stored in reverse
let lastValue = context.data.close[0]; // Actually oldest bar!
let currentValue = context.data.close[context.data.close.length - 1]; // Current bar
```

**Solution:**
Remember the distinction:

-   **Storage**: Forward order (oldest at [0], newest at [length-1])
-   **Access via $.get() or Series**: Pine Script semantics (0 = current, 1 = previous)
-   Always use `$.get(close, index)` or `Series.get(index)` for Pine Script semantics
-   Direct array access `close[i]` gives forward chronological order

### ⚠️ Pitfall 2: Modifying Transpiler Without Understanding Scope

**Problem:**
Changing variable transformation logic can break scope isolation and cause variable collisions.

**Solution:**
Always test with the transpiler test suite. Understand the scope tree before modifying.

### ⚠️ Pitfall 3: Not Handling NaN Properly

**Problem:**

```javascript
if (value == NaN) { ... }  // Will never be true in JavaScript
```

**Solution:**
The transpiler automatically converts == to $.math.\_\_eq(), but if you manually create code, use the function explicitly.

### ⚠️ Pitfall 4: Sharing State Across Function Calls

**Problem:**

```javascript
// Two calls with same parameters sharing state
let ema1 = ta.ema(close, 9);
let ema2 = ta.ema(close, 9); // Should be independent!
```

**Solution:**
The transpiler automatically injects unique call IDs. Never manually remove them.

### ⚠️ Pitfall 5: Not Initializing Variables with $.init()

**Problem:**

```javascript
$.let.var = someValue; // Missing $.init(), won't work as series
```

**Solution:**
Always use `$.init()` for variable assignments (transpiler handles this automatically).

### ✅ Best Practice 1: Use the Transpiler

Never write transpiled code manually. Always let the transpiler handle transformations.

### ✅ Best Practice 2: Test with Multiple Scenarios

When modifying the transpiler, test with:

-   Simple variable assignments
-   Complex nested expressions
-   Multiple function calls with same parameters
-   Array operations
-   Conditional logic
-   Loops

### ✅ Best Practice 3: Understand the Context

Before debugging, understand what the context contains at each iteration:

-   What's in `$.let`, `$.const`, `$.var`?
-   What's in `$.params`?
-   What state is in `context.taState`?

### ✅ Best Practice 4: Respect the Scope Manager

The ScopeManager tracks:

-   Variable scopes and renaming
-   Context-bound variables
-   Loop variables
-   Array pattern elements
-   Parameter and cache ID generation

Don't bypass it or modify its state inconsistently.

### ✅ Best Practice 5: Incremental TA Functions

When implementing new TA functions, prefer incremental calculations over full recalculation:

```typescript
// ❌ Bad: Recalculate from scratch each time
function sma(source: any, period: any) {
    let sum = 0;
    for (let i = 0; i < period; i++) {
        sum += Series.from(source).get(i); // Expensive repeated calls
    }
    return sum / period;
}

// ✅ Good: Incremental with state
export function sma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0); // Extract period value
        const stateKey = _callId || `sma_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = { window: [], sum: 0 };
        }

        const state = context.taState[stateKey];
        const current = Series.from(source).get(0); // Get current value

        // Add new value
        state.window.push(current);
        state.sum += current;

        // Remove old value if window is full
        if (state.window.length > period) {
            state.sum -= state.window.shift();
        }

        // Return average or NaN if not enough data
        return state.window.length >= period ? context.precision(state.sum / period) : NaN;
    };
}
```

**Key Points:**

-   Use `callId` for unique state per function call
-   Extract values from Series using `.get(0)` or `Series.from()`
-   Maintain internal state (window, sum) for efficiency
-   Return NaN during initialization period (Pine Script behavior)
-   Use `context.precision()` for consistent decimal precision

---

## Debugging Guide

### Viewing Transpiled Code

```javascript
const transformer = transpile.bind(context);
const transpiledFn = transformer(userCode);
console.log(transpiledFn.toString());
```

### Inspecting Context State

```javascript
console.log('Variables:', context.let);
console.log('Parameters:', context.params);
console.log('TA State:', context.taState);
console.log('Current Index:', context.idx);
```

### Common Debug Patterns

```javascript
// Check series values (remember: forward storage!)
const close = context.data.close;
console.log('Current close:', close[close.length - 1]); // Last element = current
console.log('Previous close:', close[close.length - 2]); // Second-to-last = previous

// Using $.get() (Pine Script semantics)
console.log('close[0]:', context.get(close, 0)); // Current
console.log('close[1]:', context.get(close, 1)); // Previous

// Check variable history (forward arrays)
console.log('ema9 series:', context.let.glb1_ema9); // Full forward array
console.log('ema9 current:', context.let.glb1_ema9[context.let.glb1_ema9.length - 1]);

// Check parameter transformations (Series objects)
console.log('Params:', context.params);

// Check Series objects
const series = context.ta.param(close, 1, 'test');
console.log('Series data:', series.data); // Underlying forward array
console.log('Series offset:', series.offset); // Offset for lookback
console.log('Series.get(0):', series.get(0)); // Value at Pine Script index 0
```

---

## Architecture Diagrams

### Overall Data Flow

```
┌──────────────┐
│ Market Data  │
│   Provider   │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   PineTS     │──────┐
│    Class     │      │
└──────┬───────┘      │
       │              │
       ▼              ▼
┌──────────────┐ ┌──────────────┐
│  Transpiler  │ │   Context    │
└──────┬───────┘ └──────┬───────┘
       │                │
       └────────┬───────┘
                ▼
         ┌──────────────┐
         │  Execution   │
         │    Loop      │
         └──────┬───────┘
                ▼
         ┌──────────────┐
         │   Results    │
         └──────────────┘
```

### Transpiler Pass Flow

```
User Code
   ↓
Parse (acorn) → AST
   ↓
Pre-Process
   ↓
Analysis Pass → Scope Manager
   ↓           (Variable tracking,
Transformation  ID generation)
   ↓
Post-Process
   ↓
Generate (astring)
   ↓
Executable JS
```

---

## Summary of Key Concepts

| Concept             | Purpose                 | Critical Detail                                    |
| ------------------- | ----------------------- | -------------------------------------------------- |
| **Series Class**    | Pine Script indexing    | Wraps forward arrays, provides reverse indexing    |
| **Forward Storage** | Data storage order      | Arrays stored oldest→newest, accessed via Series   |
| **$.get()**         | Array access            | Translates Pine index to forward array index       |
| **$.set()**         | Value assignment        | Sets current value (last element in forward array) |
| **$.init()**        | Variable initialization | Creates/updates time-series arrays                 |
| **param()**         | Argument wrapping       | Returns Series objects, handles lookback           |
| **Unique IDs**      | State isolation         | Separate state for each function call              |
| **Scope Manager**   | Variable renaming       | Prevents collisions, tracks context                |
| **Context ($)**     | Runtime environment     | Holds all state, data, and methods                 |
| **Array Growth**    | Series history          | Current value pushed to maintain history           |
| **Transpiler**      | Code transformation     | AST-based, multi-pass transformation               |

---

## Syntax Evolution and Deprecation

PineTS is evolving to provide a more unified and cleaner API surface. While older syntax patterns remain supported for backward compatibility, they may trigger runtime warnings.

### The Unified Namespace Pattern

**✅ Recommended (New Syntax):**

Destructure all Pine Script namespaces and built-in functions from `context.pine`. This creates a cleaner import section that mirrors Pine Script's unified environment.

```javascript
(context) => {
    const { close, open, high, low, hlc3, volume } = context.data;
    // Import everything from context.pine - unified namespace
    const { plotchar, color, plot, na, nz, ta, math } = context.pine;

    const sma = ta.sma(close, 20);
    const abs = math.abs(sma - close);
};
```

**Transpiled Output:**

```javascript
($) => {
    const { close, open, high, low, hlc3, volume } = $.data;
    const { plotchar, color, plot, na, nz, ta, math } = $.pine;
    // ... rest of transpiled code
};
```

**⚠️ Deprecated (Old Syntax):**

Accessing namespaces directly from the context root or splitting imports between `context.core` and direct assignments is considered legacy behavior and may trigger warnings.

```javascript
(context) => {
    const { close, open, high, low, hlc3, volume } = context.data;
    const { plotchar, color, plot, na, nz } = context.core; // ⚠️ Legacy: context.core
    const ta = context.ta; // ⚠️ Legacy: Direct access
    const math = context.math; // ⚠️ Legacy: Direct access

    const sma = ta.sma(close, 20);
    const abs = math.abs(sma - close);
};
```

**Transpiled Output:**

```javascript
($) => {
    const { close, open, high, low, hlc3, volume } = $.data;
    const { plotchar, color, plot, na, nz } = $.core; // ⚠️ Deprecated
    const ta = $.ta; // ⚠️ Deprecated
    const math = $.math; // ⚠️ Deprecated
    // ... rest of transpiled code
};
```

### Key Differences

1. **`context.pine` vs `context.core`**: Use `context.pine` as the single source of truth for Pine Script functions and variables. The `context.core` namespace is deprecated.

2. **Namespace Access**: Prefer destructuring `ta`, `math`, `array`, etc., from `context.pine` rather than accessing them directly from `context.ta`, `context.math`, etc.

3. **Consistency**: The new syntax provides a single, consistent pattern that's easier to understand and maintain.

### Migration Guide

To migrate from old syntax to new syntax:

**Before (Old Syntax):**

```javascript
(context) => {
    const { close, open } = context.data;
    const { plot, color } = context.core;
    const ta = context.ta;
    const math = context.math;
    const array = context.array;

    // Your indicator logic
};
```

**After (New Syntax):**

```javascript
(context) => {
    const { close, open } = context.data;
    const { plot, color, ta, math, array } = context.pine;

    // Your indicator logic (unchanged)
};
```

### Backward Compatibility

-   **Old syntax still works**: Existing indicators using the old syntax will continue to function correctly.
-   **Runtime warnings**: Indicators using deprecated syntax may log warnings to help developers migrate.
-   **No breaking changes**: The transpiler handles both syntaxes identically after normalization.
-   **Gradual migration**: You can migrate indicators at your own pace.

### Why the Change?

1. **Simplification**: One unified namespace (`context.pine`) instead of multiple access patterns.
2. **Clarity**: Clear distinction between market data (`context.data`) and Pine Script functions (`context.pine`).
3. **Maintainability**: Easier to document and understand for new users.
4. **Future-proofing**: Provides a cleaner foundation for future API enhancements.

---

## Conclusion

PineTS is a sophisticated system that bridges Pine Script semantics with JavaScript execution. The key to understanding and maintaining it is recognizing:

1. **Series-based architecture** - The Series class provides Pine Script indexing on forward-ordered arrays
2. **Forward storage, reverse access** - Data stored oldest→newest, accessed via Series with Pine Script semantics
3. **Dual access methods** - `$.get()/$.set()` for Pine Script semantics, direct array access for chronological order
4. **State isolation** - Unique IDs ensure independent state for each function call
5. **Context-driven execution** - The $ object is the central nervous system
6. **Incremental calculations** - TA functions maintain state for efficiency
7. **param() returns Series** - All namespace functions receive and return Series objects

When modifying PineTS:

-   Understand the Series class and its role in bridging storage and access semantics
-   Understand the transpilation pipeline and how it transforms array access
-   Respect the scope manager and variable transformation rules
-   Maintain the series paradigm (forward storage, Series-based access)
-   Test thoroughly with edge cases, especially array indexing
-   Document any new transformations or Series-related changes

This architecture enables running thousands of Pine Script indicators in JavaScript with high fidelity and performance while maintaining compatibility with Pine Script's unique time-series semantics.
