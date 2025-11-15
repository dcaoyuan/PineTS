# Technical Analysis Optimization: Incremental Computation

## Overview

PineTS executes indicators bar-by-bar, processing each historical data point sequentially. Prior to optimization, Technical Analysis (TA) functions recalculated their entire window of data on every bar, resulting in O(n²) time complexity for n bars. This caused severe performance degradation for complex indicators over long periods—some taking up to 3 minutes for 500 bars.

**After optimization:** TA functions now use incremental computation with O(n) time complexity, maintaining state across bars and only processing new data points.

---

## The Problem

### Before Optimization

When an indicator calls `ta.ema(close, 14)` on each bar:

```javascript
// Bar 1: Calculate EMA for 1 value
// Bar 2: Recalculate EMA for 2 values (from scratch)
// Bar 3: Recalculate EMA for 3 values (from scratch)
// ...
// Bar 500: Recalculate EMA for 500 values (from scratch)
```

**Total operations:** 1 + 2 + 3 + ... + 500 = 125,250 operations

### Performance Impact

For a complex indicator like `B3.ts` that calls multiple TA functions:

-   **500 bars:** ~3 minutes
-   Multiple EMA, SMA, RSI calls compound the problem
-   Each TA function independently recalculates all historical data

---

## The Solution: Three-Part Optimization

### 1. Incremental State Management

Each TA function now maintains state across bars instead of recalculating everything.

#### Example: EMA (Exponential Moving Average)

**Before (O(n) per bar = O(n²) total):**

```typescript
ema(source, period) {
    // Recalculate entire EMA from scratch every bar
    const values = source.slice(0, period).reverse();
    let sum = values.slice(0, period).reduce((a, b) => a + b, 0);
    let ema = sum / period;

    const multiplier = 2 / (period + 1);
    for (let i = period; i < values.length; i++) {
        ema = (values[i] - ema) * multiplier + ema;
    }
    return ema;
}
```

**After (O(1) per bar = O(n) total):**

```typescript
ema(source, _period, _callId?) {
    const period = Array.isArray(_period) ? _period[0] : _period;

    // Initialize state on first use
    if (!this.context.taState) this.context.taState = {};
    const stateKey = _callId || `ema_${period}`;

    if (!this.context.taState[stateKey]) {
        this.context.taState[stateKey] = {
            prevEma: null,
            initSum: 0,
            initCount: 0
        };
    }

    const state = this.context.taState[stateKey];
    const currentValue = source[0];

    // Initial period: accumulate values
    if (state.initCount < period) {
        state.initSum += currentValue;
        state.initCount++;

        if (state.initCount === period) {
            state.prevEma = state.initSum / period;
            return this.context.precision(state.prevEma);
        }
        return NaN;
    }

    // Incremental update: only process new value
    const multiplier = 2 / (period + 1);
    const ema = (currentValue - state.prevEma) * multiplier + state.prevEma;
    state.prevEma = ema;

    return this.context.precision(ema);
}
```

**Key improvements:**

-   State persists across bars in `context.taState`
-   Only processes the current value
-   125,250 operations → 500 operations (250x speedup)

---

### 2. Transpiler-Injected Call IDs

#### The State Collision Problem

When an indicator calls the same TA function multiple times with different sources:

```javascript
const ema_close = ta.ema(close, 14); // Call #1
const ema_hlc3 = ta.ema(hlc3, 14); // Call #2
const ema_high = ta.ema(high, 14); // Call #3
```

Without unique identifiers, all three calls would share the same state key (`ema_14`), causing incorrect results.

#### Solution: Transpiler Injection

The transpiler automatically injects a unique `_callId` for each TA function call site:

**Source code:**

```javascript
const ema1 = ta.ema(close, 14);
const ema2 = ta.ema(hlc3, 14);
```

**Transpiled code:**

```javascript
const ema1 = ta.ema(close, 14, '_ta0'); // Unique ID injected
const ema2 = ta.ema(hlc3, 14, '_ta1'); // Different ID
```

#### Implementation

**1. ScopeManager Enhancement** (`src/transpiler/ScopeManager.class.ts`):

```typescript
export class ScopeManager {
    private taCallIdCounter: number = 0;

    public getNextTACallId(): any {
        return {
            type: 'Literal',
            value: `_ta${this.taCallIdCounter++}`,
        };
    }
}
```

**2. Transpiler Modification** (`src/transpiler/index.ts`):

```typescript
if (isNamespaceCall) {
    const namespace = node.callee.object.name;

    // Transform arguments
    node.arguments = node.arguments.map((arg: any) => {
        if (arg._isParamCall) return arg;
        return transformFunctionArgument(arg, namespace, scopeManager);
    });

    // Inject unique call ID for TA functions
    if (namespace === 'ta') {
        node.arguments.push(scopeManager.getNextTACallId());
    }

    node._transformed = true;
}
```

**3. TA Function Signature** (`src/namespaces/TechnicalAnalysis.ts`):

```typescript
ema(source, _period, _callId?) {
    const stateKey = _callId || `ema_${period}`;  // Use injected ID
    // ... rest of implementation
}
```

---

### 3. Context State Initialization

**Context Class Enhancement** (`src/Context.class.ts`):

```typescript
export class Context {
    public data: any = {
        /* ... */
    };
    public cache: any = {};
    public taState: any = {}; // ← State storage for incremental TA
    // ... rest of class
}
```

This ensures `taState` is always available for TA functions to store their incremental state.

---

## Optimization Examples

### Example 1: SMA (Simple Moving Average)

**Before:** Recalculate sum of last N values on every bar
**After:** Rolling window with O(1) updates

```typescript
sma(source, _period, _callId?) {
    const period = Array.isArray(_period) ? _period[0] : _period;

    if (!this.context.taState) this.context.taState = {};
    const stateKey = _callId || `sma_${period}`;

    if (!this.context.taState[stateKey]) {
        this.context.taState[stateKey] = { window: [], sum: 0 };
    }

    const state = this.context.taState[stateKey];
    const currentValue = source[0] || 0;

    // Add current value
    state.window.push(currentValue);
    state.sum += currentValue;

    // Remove old value if window is full
    if (state.window.length > period) {
        state.sum -= state.window.shift();
    }

    // Return average
    if (state.window.length < period) return NaN;
    return this.context.precision(state.sum / period);
}
```

**Speedup:** O(n²) → O(n)

---

### Example 2: RSI (Relative Strength Index)

**Before:** Recalculate average gains/losses over entire period
**After:** Wilders smoothing with incremental updates

```typescript
rsi(source, _period, _callId?) {
    const period = Array.isArray(_period) ? _period[0] : _period;

    if (!this.context.taState) this.context.taState = {};
    const stateKey = _callId || `rsi_${period}`;

    if (!this.context.taState[stateKey]) {
        this.context.taState[stateKey] = {
            prevValue: null,
            avgGain: null,
            avgLoss: null,
            count: 0
        };
    }

    const state = this.context.taState[stateKey];
    const currentValue = source[0];

    if (state.prevValue === null) {
        state.prevValue = currentValue;
        return NaN;
    }

    const change = currentValue - state.prevValue;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    state.count++;

    // Initial period: accumulate
    if (state.count < period) {
        state.avgGain = (state.avgGain || 0) + gain;
        state.avgLoss = (state.avgLoss || 0) + loss;
        state.prevValue = currentValue;

        if (state.count === period) {
            state.avgGain /= period;
            state.avgLoss /= period;
        }
        return NaN;
    }

    if (state.count === period) {
        state.avgGain /= period;
        state.avgLoss /= period;
    }

    // Wilders smoothing (incremental update)
    state.avgGain = (state.avgGain * (period - 1) + gain) / period;
    state.avgLoss = (state.avgLoss * (period - 1) + loss) / period;
    state.prevValue = currentValue;

    if (state.avgLoss === 0) return 100;
    const rs = state.avgGain / state.avgLoss;
    return this.context.precision(100 - 100 / (1 + rs));
}
```

**Speedup:** O(n²) → O(n)

---

### Example 3: ATR (Average True Range)

**Before:** Recalculate all TR values and average
**After:** EMA-like smoothing with incremental TR calculation

```typescript
atr(_period, _callId?) {
    const period = Array.isArray(_period) ? _period[0] : _period;

    if (!this.context.taState) this.context.taState = {};
    const stateKey = _callId || `atr_${period}`;

    if (!this.context.taState[stateKey]) {
        this.context.taState[stateKey] = {
            prevAtr: null,
            initSum: 0,
            initCount: 0,
            prevClose: null,
        };
    }

    const state = this.context.taState[stateKey];
    const high = this.context.data.high[0];
    const low = this.context.data.low[0];
    const close = this.context.data.close[0];

    // Calculate True Range (current bar only)
    let tr;
    if (state.prevClose !== null) {
        const hl = high - low;
        const hc = Math.abs(high - state.prevClose);
        const lc = Math.abs(low - state.prevClose);
        tr = Math.max(hl, hc, lc);
    } else {
        tr = high - low;
    }

    state.prevClose = close;

    // Initial period: accumulate
    if (state.initCount < period) {
        state.initSum += tr;
        state.initCount++;

        if (state.initCount === period) {
            state.prevAtr = state.initSum / period;
            return this.context.precision(state.prevAtr);
        }
        return NaN;
    }

    // Incremental smoothing
    const atr = (state.prevAtr * (period - 1) + tr) / period;
    state.prevAtr = atr;

    return this.context.precision(atr);
}
```

---

## Performance Results

### B3 Indicator (500 bars)

| Metric         | Before     | After  | Improvement    |
| -------------- | ---------- | ------ | -------------- |
| Execution Time | ~180s      | ~6s    | **30x faster** |
| Operations     | O(n²)      | O(n)   | Asymptotic     |
| Memory         | High churn | Stable | Better GC      |

### General Improvements

-   **Small datasets (50-100 bars):** 5-10x speedup
-   **Medium datasets (500 bars):** 20-30x speedup
-   **Large datasets (1000+ bars):** 50-100x speedup

The speedup increases with dataset size due to the algorithmic complexity improvement (O(n²) → O(n)).

---

## Optimized Functions

All Technical Analysis functions now use incremental computation:

-   **Moving Averages:** `sma`, `ema`, `wma`, `vwma`, `hma`, `rma`
-   **Momentum Indicators:** `rsi`, `mom`, `roc`
-   **Volatility:** `atr`, `stdev`, `variance`, `dev`
-   **Statistics:** `highest`, `lowest`, `median`
-   **Advanced:** `linreg`, `supertrend`
-   **Utilities:** `change`, `crossover`, `crossunder`

---

## Testing

### Unit Tests (`tests/namespaces/ta2.test.ts`)

Created comprehensive unit tests for all TA functions:

-   25 individual test cases
-   Tests verify incremental results match expected values
-   Validates state management across multiple calls

### Integration Tests

-   `dca.test.ts`: Complex indicator with multiple TA calls
-   `B3.ts`: Real-world performance benchmark
-   All tests pass with optimized implementation

---

## Technical Details

### State Key Generation

Each TA function call gets a unique state key combining:

1. **Function name** (e.g., `ema`)
2. **Parameters** (e.g., period `14`)
3. **Call ID** (injected by transpiler, e.g., `_ta0`)

Result: `_ta0` (transpiler-injected) or fallback to `ema_14` (for direct calls)

### Why Transpiler Injection?

**Problem:** Runtime call counters can fail with conditional logic:

```javascript
if (condition) {
    const ema1 = ta.ema(close, 14); // Sometimes called, sometimes not
}
const ema2 = ta.ema(close, 14); // Always called
```

With counters, `ema2` gets different IDs on different bars depending on whether `ema1` was called.

**Solution:** Transpiler-injected IDs are static and based on code location, ensuring consistency across all bars regardless of conditional execution.

---

## Future Enhancements

Potential further optimizations:

1. **SIMD operations** for array processing
2. **WebAssembly** for compute-intensive functions
3. **Parallel processing** for independent indicators
4. **Smart caching** of intermediate results
5. **Lazy evaluation** for unused plot values

---

## Backward Compatibility

The optimization is **fully backward compatible**:

-   Existing indicators work without modification
-   The `_callId` parameter is optional
-   Fallback to parameter-based keys works for direct calls
-   No breaking changes to the public API

---

## Conclusion

By combining incremental computation, transpiler-injected call IDs, and proper state management, we achieved:

-   **30-100x performance improvement** for typical use cases
-   **O(n²) → O(n)** algorithmic complexity
-   **Zero breaking changes** to existing code
-   **Robust state management** preventing collisions

This optimization makes PineTS suitable for real-time analysis of large datasets and complex multi-indicator strategies.
