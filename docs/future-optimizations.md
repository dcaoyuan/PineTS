# Future Performance Optimizations for PineTS

## Overview

After implementing incremental computation for TA functions (O(n²) → O(n)), there are several additional optimization opportunities to further improve indicator processing performance. This document outlines these opportunities in order of potential impact.

---

## 1. Array Slicing Optimization (High Impact)

### Current Issue

**Location:** `PineTS.class.ts` lines 122-131

On every bar iteration, we create 10 new array slices:

```typescript
for (let i = this._periods - n, idx = n - 1; i < this._periods; i++, idx--) {
    context.data.close = this.close.slice(idx); // Creates new array
    context.data.open = this.open.slice(idx); // Creates new array
    context.data.high = this.high.slice(idx); // Creates new array
    context.data.low = this.low.slice(idx); // Creates new array
    context.data.volume = this.volume.slice(idx); // Creates new array
    context.data.hl2 = this.hl2.slice(idx); // Creates new array
    context.data.hlc3 = this.hlc3.slice(idx); // Creates new array
    context.data.ohlc4 = this.ohlc4.slice(idx); // Creates new array
    context.data.openTime = this.openTime.slice(idx); // Creates new array
    context.data.closeTime = this.closeTime.slice(idx); // Creates new array
}
```

**Cost per iteration:** 10 array allocations × n bars = potentially millions of allocations for large datasets.

### Proposed Solution: Array Views

Instead of slicing, use a **virtual array view** with lazy evaluation:

```typescript
class ArrayView {
    constructor(private sourceArray: any[], private offset: number = 0) {}

    // Implement array-like interface
    [index: number]: any;

    get length() {
        return Math.max(0, this.sourceArray.length - this.offset);
    }

    // Proxy access to source array with offset
    get(index: number) {
        return this.sourceArray[this.offset + index];
    }

    // For array-like access: arr[0]
    static create(sourceArray: any[], offset: number): any {
        return new Proxy(new ArrayView(sourceArray, offset), {
            get(target, prop) {
                if (prop === 'length') return target.length;
                if (typeof prop === 'string' && !isNaN(parseInt(prop))) {
                    return target.get(parseInt(prop));
                }
                return (target as any)[prop];
            },
        });
    }
}

// In run() method:
for (let i = this._periods - n, idx = n - 1; i < this._periods; i++, idx--) {
    context.data.close = ArrayView.create(this.close, idx);
    context.data.open = ArrayView.create(this.open, idx);
    // ... etc
}
```

**Expected improvement:** 40-60% reduction in memory allocations and GC pressure.

---

## 2. Transpilation Caching (High Impact)

### Current Issue

**Location:** `PineTS.class.ts` line 114

The transpiler runs on **every call** to `run()`, even for the same indicator code:

```typescript
let transpiledFn = transformer(pineTSCode); // Transpiles every time
```

Transpilation involves:

-   Parsing with Acorn
-   AST traversal
-   Code transformation
-   Code generation

**Cost:** ~50-200ms per transpilation depending on code complexity.

### Proposed Solution: Transpilation Cache

```typescript
export class PineTS {
    private static transpiledCache = new Map<string, Function>();

    public async run(pineTSCode: Function | String, n?: number, useTACache?: boolean): Promise<Context> {
        await this.ready();
        if (!n) n = this._periods;

        // Generate cache key
        const cacheKey = typeof pineTSCode === 'function' ? pineTSCode.toString() : pineTSCode;

        // Check cache
        let transpiledFn = PineTS.transpiledCache.get(cacheKey);

        if (!transpiledFn) {
            // Transpile and cache
            const transformer = transpile.bind(this);
            transpiledFn = transformer(pineTSCode);
            PineTS.transpiledCache.set(cacheKey, transpiledFn);
        }

        // ... rest of execution
    }
}
```

**Expected improvement:**

-   First run: No change
-   Subsequent runs: 50-200ms saved per run
-   Critical for real-time updates and backtesting

---

## 3. Context Variable Shifting Optimization (Medium Impact)

### Current Issue

**Location:** `PineTS.class.ts` lines 157-167

After each bar, we iterate through all context variables and shift arrays:

```typescript
for (let ctxVarName of contextVarNames) {
    for (let key in context[ctxVarName]) {
        if (Array.isArray(context[ctxVarName][key])) {
            const val = context[ctxVarName][key][0];
            context[ctxVarName][key].unshift(val); // O(n) operation!
        }
    }
}
```

**Problem:** `unshift()` is O(n) because it shifts all elements. If you have 10 variables, this becomes expensive.

### Proposed Solution: Circular Buffer

Instead of shifting, use a circular buffer with an index:

```typescript
class CircularBuffer {
    private buffer: any[];
    private headIndex: number = 0;
    private maxSize: number;

    constructor(maxSize: number = 100) {
        this.buffer = new Array(maxSize);
        this.maxSize = maxSize;
    }

    push(value: any) {
        this.buffer[this.headIndex] = value;
        this.headIndex = (this.headIndex + 1) % this.maxSize;
    }

    // Access like arr[0], arr[1], etc.
    get(index: number) {
        const actualIndex = (this.headIndex - 1 - index + this.maxSize) % this.maxSize;
        return this.buffer[actualIndex];
    }
}
```

**Expected improvement:** 10-20% faster context shifting, especially with many variables.

---

## 4. Parallel Execution for Independent Indicators (High Impact)

### Current Issue

All indicators run sequentially, even when they're independent:

```typescript
const ema14 = await pinets.run(indicator1, 500);
const rsi = await pinets.run(indicator2, 500);
const atr = await pinets.run(indicator3, 500);
```

### Proposed Solution: Parallel Execution

```typescript
// Run multiple independent indicators in parallel
const results = await Promise.all([pinets.run(indicator1, 500), pinets.run(indicator2, 500), pinets.run(indicator3, 500)]);
```

For even better performance, use Worker threads:

```typescript
class PineTSWorkerPool {
    private workers: Worker[];

    async runParallel(indicators: any[], data: any[]): Promise<any[]> {
        return Promise.all(
            indicators.map((indicator, i) => {
                const worker = this.workers[i % this.workers.length];
                return this.runInWorker(worker, indicator, data);
            })
        );
    }
}
```

**Expected improvement:** Near-linear scaling with number of cores for independent indicators.

---

## 5. WebAssembly for Compute-Intensive Operations (Very High Impact)

### Opportunity

Mathematical operations in TA functions can be compiled to WebAssembly for significant speedups:

-   Matrix operations (for advanced indicators)
-   Moving average calculations
-   Statistical functions (variance, stdev)
-   Linear regression

### Implementation Example

```typescript
// Rust code compiled to WASM
#[wasm_bindgen]
pub fn calculate_ema_bulk(values: &[f64], period: usize) -> Vec<f64> {
    let mut results = Vec::with_capacity(values.len());
    let multiplier = 2.0 / (period as f64 + 1.0);

    let mut ema = values[..period].iter().sum::<f64>() / period as f64;
    results.push(ema);

    for &value in &values[period..] {
        ema = (value - ema) * multiplier + ema;
        results.push(ema);
    }

    results
}
```

```typescript
// TypeScript usage
import { calculate_ema_bulk } from './ta_wasm';

ema(source, _period, _callId?) {
    if (USE_WASM && source.length > 100) {
        return calculate_ema_bulk(source, period);
    }
    // ... fallback to JS implementation
}
```

**Expected improvement:** 2-10x faster for bulk calculations, especially for complex math.

---

## 6. Lazy Evaluation for Plot Values (Medium Impact)

### Current Issue

All plot values are calculated even if not displayed:

```typescript
return {
    signal: buy_signal,
    trend: trend_direction,
    strength: strength_value,
    debug1: debug_value, // Often not displayed
    debug2: another_debug, // Often not displayed
    // ... many more
};
```

### Proposed Solution: Lazy Evaluation

```typescript
class LazyResult {
    private computed = new Map<string, any>();

    constructor(private computeFunctions: Record<string, () => any>) {}

    get(key: string) {
        if (!this.computed.has(key)) {
            this.computed.set(key, this.computeFunctions[key]());
        }
        return this.computed.get(key);
    }
}

// Usage in indicator
return new LazyResult({
    signal: () => calculateSignal(),
    trend: () => calculateTrend(),
    strength: () => calculateStrength(),
    debug1: () => calculateDebug1(), // Only computed if accessed
});
```

**Expected improvement:** 20-40% for indicators with many unused plot values.

---

## 7. SIMD Operations for Array Processing (High Impact)

### Opportunity

Modern JavaScript engines support SIMD (Single Instruction, Multiple Data) operations through typed arrays:

```typescript
class SIMDOperations {
    static addArrays(a: Float64Array, b: Float64Array): Float64Array {
        const result = new Float64Array(a.length);
        const remainder = a.length % 4;

        // Process 4 elements at a time
        for (let i = 0; i < a.length - remainder; i += 4) {
            result[i] = a[i] + b[i];
            result[i + 1] = a[i + 1] + b[i + 1];
            result[i + 2] = a[i + 2] + b[i + 2];
            result[i + 3] = a[i + 3] + b[i + 3];
        }

        // Process remainder
        for (let i = a.length - remainder; i < a.length; i++) {
            result[i] = a[i] + b[i];
        }

        return result;
    }

    static multiplyScalar(arr: Float64Array, scalar: number): Float64Array {
        const result = new Float64Array(arr.length);
        // ... SIMD multiplication
        return result;
    }
}
```

**Expected improvement:** 2-4x faster for bulk array operations.

---

## 8. Smart Data Precomputation (Medium Impact)

### Opportunity

Precompute commonly used derived values once instead of repeatedly:

**Current (in many indicators):**

```typescript
const hlc3 = (high[0] + low[0] + close[0]) / 3; // Computed many times
const typical_price = (high[0] + low[0] + close[0]) / 3; // Same thing
```

**Optimized:**

```typescript
// Already computed in PineTS.class.ts (lines 60-64)
// Just use: context.data.hlc3[0]
```

But we can extend this:

```typescript
// Precompute more derived values
this.tr = marketData.map((d, i) => {
    if (i === 0) return d.high - d.low;
    const prevClose = marketData[i - 1].close;
    return Math.max(d.high - d.low, Math.abs(d.high - prevClose), Math.abs(d.low - prevClose));
});

this.log_return = marketData.map((d, i) => {
    if (i === 0) return 0;
    return Math.log(d.close / marketData[i - 1].close);
});
```

**Expected improvement:** 10-15% for indicators using these values repeatedly.

---

## 9. JIT-Friendly Code Patterns (Low-Medium Impact)

### Optimization Techniques

Help V8/SpiderMonkey optimize the hot paths:

**1. Monomorphic function calls:**

```typescript
// Bad: Polymorphic
function process(value: any) {
    return value + 1; // Could be number, string, etc.
}

// Good: Monomorphic
function processNumber(value: number): number {
    return value + 1;
}
```

**2. Avoid hidden class changes:**

```typescript
// Bad: Properties added in different order
const state1 = {};
state1.ema = 10;
state1.count = 5;

const state2 = {};
state2.count = 5; // Different order!
state2.ema = 10;

// Good: Consistent shape
class State {
    ema: number = 0;
    count: number = 0;
}
```

**3. Use TypedArrays for numeric data:**

```typescript
// Instead of: number[]
const prices: number[] = [...];

// Use: Float64Array
const prices = new Float64Array(marketData.length);
```

**Expected improvement:** 15-30% through better JIT compilation.

---

## 10. Result Object Pool (Low-Medium Impact)

### Current Issue

Every bar creates a new result object:

```typescript
context.result.push(result); // New object every bar
```

### Proposed Solution: Object Pool

```typescript
class ResultPool {
    private pool: any[] = [];
    private active = new Set<any>();

    acquire(): any {
        let obj = this.pool.pop();
        if (!obj) {
            obj = this.createResult();
        }
        this.active.add(obj);
        return obj;
    }

    release(obj: any) {
        this.active.delete(obj);
        this.reset(obj);
        this.pool.push(obj);
    }

    private createResult() {
        return { time: 0, value: 0 };
    }

    private reset(obj: any) {
        obj.time = 0;
        obj.value = 0;
    }
}
```

**Expected improvement:** 5-10% reduction in GC pressure.

---

## 11. Incremental Data Updates (High Impact for Real-Time)

### Opportunity

For real-time indicators, instead of reprocessing all data:

```typescript
class IncrementalPineTS extends PineTS {
    private lastProcessedBar: number = 0;

    async updateWithNewBar(newBar: any) {
        // Only process the new bar
        this.data.push(newBar);

        // Update derived values incrementally
        this.close.push(newBar.close);
        this.hlc3.push((newBar.high + newBar.low + newBar.close) / 3);
        // ... etc

        // Run indicator on just the new bar
        return this.runIncremental(this.lastProcessedBar + 1);
    }
}
```

**Expected improvement:** Near-instant updates for real-time data.

---

## Performance Impact Summary

| Optimization                       | Impact            | Implementation Difficulty | Priority             |
| ---------------------------------- | ----------------- | ------------------------- | -------------------- |
| Array Slicing → Views              | 40-60%            | Medium                    | **High**             |
| Transpilation Caching              | 50-200ms/run      | Low                       | **High**             |
| WebAssembly for Math               | 2-10x             | High                      | **High**             |
| Parallel Execution                 | Linear with cores | Medium                    | **High**             |
| Context Shifting → Circular Buffer | 10-20%            | Medium                    | Medium               |
| SIMD Operations                    | 2-4x              | Medium                    | Medium               |
| Lazy Plot Evaluation               | 20-40%            | Low                       | Medium               |
| Incremental Updates                | Near-instant      | Medium                    | High (for real-time) |
| Smart Precomputation               | 10-15%            | Low                       | Low                  |
| JIT-Friendly Patterns              | 15-30%            | Low                       | Low                  |
| Object Pooling                     | 5-10%             | Low                       | Low                  |

---

## Implementation Roadmap

### Phase 1: Quick Wins (Low-hanging fruit)

1. ✅ **Transpilation caching** - Immediate benefit, easy to implement
2. ✅ **Smart precomputation** - Extend existing derived values
3. ✅ **JIT-friendly patterns** - Refactor hot paths

### Phase 2: Medium Complexity

1. **Array slicing → Views** - Significant memory savings
2. **Context shifting → Circular buffer** - Better performance
3. **Lazy plot evaluation** - For indicators with many outputs

### Phase 3: Advanced Optimizations

1. **WebAssembly integration** - Massive speedups for math-heavy operations
2. **SIMD operations** - For bulk array processing
3. **Parallel execution** - Multi-core utilization

### Phase 4: Architecture Changes

1. **Incremental updates** - For real-time use cases
2. **Worker thread pool** - True parallel processing

---

## Measurement & Benchmarking

Before implementing optimizations, establish benchmarks:

```typescript
class PerformanceBenchmark {
    static async benchmark(pinets: PineTS, indicator: Function, iterations: number = 10) {
        const times: number[] = [];

        for (let i = 0; i < iterations; i++) {
            const start = performance.now();
            await pinets.run(indicator, 500);
            const end = performance.now();
            times.push(end - start);
        }

        return {
            mean: times.reduce((a, b) => a + b) / times.length,
            median: times.sort()[Math.floor(times.length / 2)],
            min: Math.min(...times),
            max: Math.max(...times),
        };
    }
}
```

---

## Conclusion

Combined with the TA incremental computation optimization, these improvements could yield:

-   **2-5x overall speedup** for typical use cases
-   **10-20x speedup** for real-time updates with incremental processing
-   **50-100x speedup** for specific math-heavy operations with WebAssembly

The key is to implement optimizations in order of impact vs. complexity, starting with transpilation caching and array view optimizations.
