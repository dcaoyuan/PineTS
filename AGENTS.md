# PineTS - AI Agent Instructions

## Project Overview

**PineTS** is a JavaScript/TypeScript library that enables the execution of Pine Script-like indicator code in a JavaScript environment. It is a sophisticated runtime transpiler that converts PineTS code (which closely resembles Pine Script) into executable JavaScript for processing financial time-series data.

### Key Characteristics

-   **Runtime Transpilation**: Transforms code at runtime without requiring pre-compilation
-   **Pine Script v5+ Compatibility**: Mimics Pine Script behavior and semantics
-   **Time-Series Processing**: Handles historical data with proper lookback capabilities
-   **Stateful Calculations**: Supports incremental technical analysis calculations
-   **Series-Based Architecture**: Everything is a time-series with forward storage and reverse access

## Architecture Documentation

Before making changes, familiarize yourself with the architecture:

-   **[Architecture Guide](docs/architecture/index.md)**: Main architecture overview
-   **[Transpiler](docs/architecture/transpiler/index.md)**: AST parsing, scope analysis, code transformation
    -   [Scope Manager](docs/architecture/transpiler/scope-manager.md): Variable renaming and unique ID generation
    -   [Transformers](docs/architecture/transpiler/transformers.md): AST transformation logic
    -   [Real Examples](docs/architecture/transpiler/examples.md): Actual transpilation output
-   **[Runtime](docs/architecture/runtime/index.md)**: Context, Series, and execution loop
    -   [Context Class](docs/architecture/runtime/context.md): The global state object
    -   [Series Class](docs/architecture/runtime/series.md): Forward storage with reverse access
    -   [Execution Flow](docs/architecture/runtime/execution-flow.md): Run loop and pagination
-   **[Namespaces](docs/architecture/namespaces/index.md)**: Implementation of `ta`, `math`, `request`, etc.
    -   [Technical Analysis (ta)](docs/architecture/namespaces/ta.md)
    -   [Math (math)](docs/architecture/namespaces/math.md)
    -   [Array (array)](docs/architecture/namespaces/array.md)
    -   [Request (request)](docs/architecture/namespaces/request.md)
    -   [Input (input)](docs/architecture/namespaces/input.md)
-   **[Debugging Guide](docs/architecture/debugging.md)**: Practical debugging techniques
-   **[Best Practices](docs/architecture/best-practices.md)**: Common pitfalls and recommended patterns

## Critical Concepts

### 1. Forward Storage, Reverse Access

**CRITICAL**: PineTS stores arrays in forward chronological order (oldest→newest) but provides Pine Script's reverse indexing semantics (0=current, 1=previous).

**How it works:**

-   **Internal Storage**: JavaScript arrays store data forward: `[oldest, ..., newest]`
-   **Pine Script Syntax**: User writes `close[0]` (current) and `close[1]` (previous)
-   **Transpiler's Job**: Converts `close[0]` → `$.get(close, 0)` which translates to `close[length-1]`
-   **Series Class**: Wraps arrays to provide this reverse indexing automatically

**Why forward storage?**

-   **Performance**: Using `.push()` to append new bars is O(1), while `.unshift()` to prepend would be O(n)
-   **Natural order**: Matches chronological order of market data from APIs
-   **Memory efficiency**: No need to shift all elements when adding new data

```javascript
// Internal storage (what you see in memory)
close = [100, 101, 102, 103, 104]  // Forward: oldest to newest
         ↑                      ↑
      oldest                 newest

// Pine Script access (what user writes)
close[0]  // Returns 104 (current/newest)
close[1]  // Returns 103 (previous)
close[4]  // Returns 100 (oldest)

// ❌ WRONG: Direct array access in your code
const current = close[close.length - 1]; // Don't do this!

// ✅ CORRECT: Let transpiler handle it, or use $.get() / Series
// User writes (transpiler converts):
const current = close[0];  // Transpiled to: $.get(close, 0)

// Or in TA functions, use Series:
const current = Series.from(close).get(0);  // Current bar
const previous = Series.from(close).get(1); // Previous bar
```

**Key Point**: The transpiler automatically converts Pine Script array notation (`close[0]`) into the correct internal access pattern. You don't need to think about array indices when writing user code - just use Pine Script syntax.

### 2. Series Class

The `Series` class wraps arrays to provide Pine Script indexing. Always use `Series.from()` in TA functions:

```typescript
const currentValue = Series.from(source).get(0); // Current bar
const previousValue = Series.from(source).get(1); // Previous bar
```

### 3. Incremental Calculation

TA functions MUST use incremental calculation with state, not recalculation:

```typescript
// ✅ CORRECT: O(1) per bar
export function sma(context: any) {
    return (source: any, period: any, _callId?: string) => {
        const stateKey = _callId || `sma_${period}`;
        if (!context.taState[stateKey]) {
            context.taState[stateKey] = { window: [], sum: 0 };
        }
        const state = context.taState[stateKey];
        // Update state incrementally...
    };
}
```

### 4. Unique Call IDs

Always use `_callId` parameter to isolate state between multiple calls:

```typescript
export function myIndicator(context: any) {
    return (source: any, period: any, _callId?: string) => {
        const stateKey = _callId || `myInd_${period}`; // REQUIRED
        // ...
    };
}
```

### 5. Tuple Returns

Functions returning tuples MUST use double bracket convention:

```typescript
// ✅ CORRECT
return [[value1, value2, value3]];

// ❌ WRONG
return [value1, value2, value3];
```

### 6. Precision

Always use `context.precision()` for numeric outputs:

```typescript
return context.precision(result); // Rounds to 10 decimals
```

## Development Workflow

### Running Tests

**IMPORTANT**: Always run tests in non-interactive mode to avoid blocking:

```bash
# ✅ CORRECT: Non-interactive
npm test -- --no-watch
npm test -- --watchAll=false

# For specific test files
npm test -- ta.test.ts --no-watch

# ❌ WRONG: Interactive mode (will block)
npm test
```

### Adding New TA Functions

1. Create implementation in `src/namespaces/ta/methods/yourfunction.ts`
2. Follow the factory pattern with `_callId` parameter
3. Use incremental calculation with `context.taState`
4. Return `NaN` during initialization period
5. Use `context.precision()` for output
6. Add unit tests in `tests/namespaces/ta.yourfunction.test.ts`
7. **Regenerate barrel file**: `npm run generate:ta-index`

### File Structure

```
src/
├── transpiler/           # AST parsing and transformation
│   ├── transformers/     # Code transformers
│   └── ScopeManager.ts   # Variable scoping
├── namespaces/           # Pine Script namespaces
│   ├── ta/               # Technical Analysis
│   │   └── methods/      # Individual TA functions
│   ├── math/             # Mathematical operations
│   ├── array/            # Array operations
│   ├── request/          # Multi-timeframe analysis
│   └── input/            # User inputs
├── Context.class.ts      # Runtime context
├── Series.ts             # Series wrapper class
└── PineTS.class.ts       # Main orchestrator

tests/
├── namespaces/           # Namespace tests
└── transpiler/           # Transpiler tests

docs/
└── architecture/         # Architecture documentation
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Direct Array Access

```javascript
// WRONG
const current = close[close.length - 1];
```

**Fix**: Use `$.get(close, 0)` or `Series.from(close).get(0)`

### ❌ Mistake 2: Missing \_callId

```javascript
// WRONG
export function ema(context: any) {
    return (source: any, period: any) => {
        const stateKey = `ema_${period}`; // Shared state!
    };
}
```

**Fix**: Add `_callId?: string` parameter and use it in state key

### ❌ Mistake 3: Recalculating History

```javascript
// WRONG: O(n) per bar
for (let i = 0; i < period; i++) {
    sum += Series.from(source).get(i);
}
```

**Fix**: Use incremental state with rolling window

### ❌ Mistake 4: Not Handling NaN

```javascript
// WRONG
state.sum += currentValue; // NaN corrupts state!
```

**Fix**: Check `isNaN(currentValue)` before updating state

### ❌ Mistake 5: Forgetting Precision

```javascript
// WRONG
return sum / period;
```

**Fix**: `return context.precision(sum / period);`

### ❌ Mistake 6: Plain Tuple Return

```javascript
// WRONG
return [macd, signal, hist];
```

**Fix**: `return [[macd, signal, hist]];`

## Transpiler Rules

### DO NOT modify transpiler unless absolutely necessary

-   The transpiler is complex and fragile
-   Always run full test suite after transpiler changes
-   Understand scope management before making changes
-   Consult [Transpiler Documentation](docs/architecture/transpiler/index.md)

### Variable Transformation

-   `let x = value` → `$.let.glb1_x = $.init($.let.glb1_x, value)`
-   `x = value` → `$.set($.let.glb1_x, value)`
-   `x[1]` → `$.get(x, 1)`
-   `func(arg)` → `func(ns.param(arg, undefined, 'p0'), '_id')`

## Testing Requirements

### Unit Tests Must Include

1. **Basic functionality**: Correct calculation with known inputs
2. **Edge cases**: NaN inputs, single bar, empty data
3. **Multiple calls**: Same parameters, different call IDs
4. **Initialization period**: Return NaN when insufficient data
5. **State isolation**: Independent state for different calls

### Test Pattern

```typescript
it('should calculate correctly', async () => {
    const pineTS = new PineTS(Provider.Mock, 'BTCUSDC', 'D', null, startDate, endDate);

    const sourceCode = (context) => {
        const { close } = context.data;
        const { ta } = context.pine;
        const result = ta.myFunc(close, 14);
        return { result };
    };

    const { result } = await pineTS.run(sourceCode);
    expect(result.myFunc[result.myFunc.length - 1]).toBeCloseTo(expected);
});
```

## Code Style

### TypeScript

-   Use TypeScript for new code
-   Type function signatures properly
-   Document complex logic with comments

### Naming Conventions

-   TA functions: lowercase (e.g., `ema`, `sma`, `rsi`)
-   Classes: PascalCase (e.g., `Series`, `Context`)
-   Private methods: prefix with `_` (e.g., `_initializeState`)
-   State keys: use `_callId` or descriptive string

### Comments

-   Explain WHY, not WHAT
-   Document non-obvious behavior
-   Add warnings for critical sections

## Git Workflow

### Commits

-   Write clear, descriptive commit messages
-   Reference issue numbers when applicable
-   Keep commits focused and atomic

### Branches

-   Feature branches: `feature/description`
-   Bug fixes: `fix/description`
-   Optimizations: `optimization/description`

### Pull Requests

-   Include test coverage
-   Update documentation if needed
-   Regenerate barrel files if adding namespace methods
-   Ensure all tests pass in non-interactive mode

## Performance Considerations

1. **Incremental Calculation**: O(1) per bar, not O(n)
2. **State Management**: Store only necessary data
3. **Series Wrapping**: Reuse Series objects when possible
4. **Avoid Redundant Calculations**: Cache expensive operations

## Debugging

### Enable Debug Output

```javascript
// In TA function
console.log(`[${_callId}] Current value:`, currentValue);
console.log(`[${_callId}] State:`, state);
```

### View Transpiled Code

```javascript
const transformer = transpile.bind(context);
const transpiledFn = transformer(userCode);
console.log(transpiledFn.toString());
```

### Check Context State

```javascript
console.log('Variables:', context.let);
console.log('TA State:', context.taState);
console.log('Current Index:', context.idx);
```

See [Debugging Guide](docs/architecture/debugging.md) for more techniques.

## Resources

-   **Architecture**: [docs/architecture/](docs/architecture/)
-   **API Coverage**: [docs/api-coverage/](docs/api-coverage/)
-   **Examples**: [docs/architecture/transpiler/examples.md](docs/architecture/transpiler/examples.md)
-   **Best Practices**: [docs/architecture/best-practices.md](docs/architecture/best-practices.md)

## Questions?

When in doubt:

1. Read the [Architecture Guide](docs/architecture/index.md)
2. Check [Best Practices](docs/architecture/best-practices.md)
3. Look at existing implementations in `src/namespaces/ta/methods/`
4. Run tests in non-interactive mode: `npm test -- --no-watch`

## Summary

**Key Takeaways for AI Agents:**

-   ✅ Forward storage, reverse access (use `$.get()` or `Series`)
-   ✅ Incremental calculation with state (not recalculation)
-   ✅ Always use `_callId` parameter for state isolation
-   ✅ Return tuples as `[[...]]` (double brackets)
-   ✅ Use `context.precision()` for numeric outputs
-   ✅ Handle NaN inputs gracefully
-   ✅ Run tests with `--no-watch` flag
-   ✅ Regenerate barrel files after adding methods
-   ❌ Don't modify transpiler without deep understanding
-   ❌ Don't use direct array access for time-series data
-   ❌ Don't share state between function calls
