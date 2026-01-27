// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2025 Alaa-eddine KADDOURI

/**
 * Pine Script to JavaScript Transpiler Test Suite
 *
 * This test suite validates the consistency of native Pine Script v6 code transpilation to executable JavaScript.
 * Each test case focuses on specific Pine Script features to ensure proper transformation through the full
 * 2-stage transpilation pipeline:
 *   Stage 1 (pineToJS): Pine Script → PineTS JavaScript syntax
 *   Stage 2 (transpile): PineTS JavaScript → Executable low-level JS
 *
 * Coverage Goals:
 * - Lexer: Tokenization, indentation handling, literals, operators
 * - Parser: AST construction for all Pine Script syntax elements
 * - CodeGen: JavaScript code generation from AST
 * - Full transpilation pipeline integrity
 */

import { describe, it, expect } from 'vitest';
import { transpile } from '../../src/transpiler/index';
import { extractPineScriptVersion } from '../../src/transpiler/pineToJS/pineToJS.index';

describe('Pine Script Version Detection', () => {
    it('should extract version 5 from source code', () => {
        const code = '//@version=5\nindicator("Test")';
        const version = extractPineScriptVersion(code);
        expect(version).toBe(5);
    });

    it('should extract version 6 from source code', () => {
        const code = '//@version=6\nindicator("Test")';
        const version = extractPineScriptVersion(code);
        expect(version).toBe(6);
    });

    it('should return null when version is missing', () => {
        const code = 'indicator("Test")';
        const version = extractPineScriptVersion(code);
        expect(version).toBeNull();
    });

    it('should handle version comment with extra whitespace', () => {
        const code = '//  @version  =  6  \nindicator("Test")';
        const version = extractPineScriptVersion(code);
        expect(version).toBe(6);
    });
});

describe('Pine Script Transpilation - Basic Features', () => {
    it('should transpile simple variable declarations', () => {
        const code = `
//@version=6
indicator("Simple Variable Test")

x = 10
y = 20
z = x + y

plot(z, title="Sum")
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toBeDefined();
        expect(jsCode).toContain('$.let.glb1_x = $.init($.let.glb1_x, 10)');
        expect(jsCode).toContain('$.let.glb1_y = $.init($.let.glb1_y, 20)');
        expect(jsCode).toContain('$.let.glb1_z = $.init($.let.glb1_z, $.get($.let.glb1_x, 0) + $.get($.let.glb1_y, 0))');
    });

    it('should transpile ternary operator', () => {
        const code = `
//@version=6
indicator("Ternary Test")

result = close > open ? 1 : 0
plot(result)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('?');
        expect(jsCode).toContain(':');
        expect(jsCode).toContain('$.get(close, 0) > $.get(open, 0)');
    });

    it('should transpile scientific notation literals', () => {
        const code = `
//@version=6
indicator("Scientific Notation Test")

a = 10e10
b = 1.2e-5
c = 1E+5

plot(a)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        // 10e10 -> 100000000000
        expect(jsCode).toContain('100000000000');
        // 1.2e-5 -> 0.000012
        expect(jsCode).toContain('0.000012');
        // 1E+5 -> 100000
        expect(jsCode).toContain('100000');
    });

    it('should reject Pine Script version < 5', () => {
        const code = '//@version=4\nindicator("Test")';

        expect(() => transpile(code)).toThrow('Unsupported Pine Script version 4');
    });

    it('should fail gracefully when version is missing', () => {
        const code = 'indicator("Test")';

        // When version is missing, it's treated as PineTS syntax, which should transpile
        const result = transpile(code);
        expect(result).toBeDefined();
    });
});

describe('Pine Script Transpilation - Control Flow', () => {
    it('should transpile if-else statements', () => {
        const code = `
//@version=6
indicator("If Test")

price = close
signal = 0

if price > 100
    signal := 1
else
    signal := -1

plot(signal)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('if (');
        expect(jsCode).toContain('} else {');
        expect(jsCode).toContain('$.set($.let.glb1_signal, 1)');
        expect(jsCode).toContain('$.set($.let.glb1_signal, -1)');
    });

    it('should transpile for loops', () => {
        const code = `
//@version=6
indicator("For Loop Test")

sum = 0.0
for i = 0 to 10
    sum := sum + i

plot(sum)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('for (');
        expect(jsCode).toContain('let i = 0; i <= 10; i++');
    });

    it('should transpile while loops', () => {
        const code = `
//@version=6
indicator("While Loop Test")

counter = 0
value = 10

while counter < 5
    value := value + counter
    counter := counter + 1

plot(value)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('while (');
        expect(jsCode).toContain('$.get($.let.glb1_counter, 0) < 5');
    });

    it('should transpile switch expressions', () => {
        const code = `
//@version=6
indicator("Switch Test")

mode = 1
result = switch mode
    1 => 10
    2 => 20
    => 30

plot(result)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        // Switch is converted to if-else chain or ternary
        expect(jsCode).toBeDefined();
    });
});

describe('Pine Script Transpilation - Functions', () => {
    it('should transpile simple function', () => {
        const code = `
//@version=6
indicator("Function Test")

add(a, b) =>
    a + b

result = add(10, 20)
plot(result)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('function add(a, b)');
        expect(jsCode).toContain('return $.precision(');
    });

    it('should transpile function with multiple statements', () => {
        const code = `
//@version=6
indicator("Function Test")

calculate(x, y) =>
    sum = x + y
    product = x * y
    sum + product

result = calculate(5, 3)
plot(result)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('function calculate(x, y)');
        // Expect _callId to be retrieved from context stack, not passed as argument
        expect(jsCode).toContain('$.peekCtx()');
        expect(jsCode).toContain('$.let.fn');
    });

    it('should transpile function returning tuple', () => {
        const code = `
//@version=6
indicator("Tuple Test")

calcMinMax(a, b) =>
    [math.min(a, b), math.max(a, b)]

[minVal, maxVal] = calcMinMax(close, open)
plot(minVal)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('function calcMinMax');
        // Tuple handling
        expect(jsCode).toBeDefined();
    });
});

describe('Pine Script Transpilation - Variables', () => {
    it('should transpile var keyword', () => {
        const code = `
//@version=6
indicator("Var Test")

var float counter = 0
counter := counter + 1

plot(counter)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        // var means initialize only once with initVar
        expect(jsCode).toContain('$.initVar(');
        expect(jsCode).toContain('$.set(');
        expect(jsCode).toContain('$.var.glb1_counter');
    });

    it('should transpile varip keyword', () => {
        const code = `
//@version=6
indicator("Varip Test")

varip int tick_counter = 0
tick_counter := tick_counter + 1

plot(tick_counter)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        // varip uses initVar like var
        expect(jsCode).toContain('$.initVar(');
        expect(jsCode).toContain('$.var.glb1_tick_counter');
    });

    it('should transpile reassignment operator :=', () => {
        const code = `
//@version=6
indicator("Reassignment Test")

x = 10
x := 20

plot(x)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('$.init(');
        expect(jsCode).toContain('$.set(');
    });
});

describe('Pine Script Transpilation - Operators', () => {
    it('should transpile logical operators', () => {
        const code = `
//@version=6
indicator("Logical Test")

bull = close > open and volume > 1000
bear = close < open or volume < 500
not_bull = not bull

plot(bull ? 1 : 0)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('&&');
        expect(jsCode).toContain('||');
        expect(jsCode).toContain('!');
    });

    it('should transpile comparison operators', () => {
        const code = `
//@version=6
indicator("Comparison Test")

eq = close == open
neq = close != open
gt = close > open
lt = close < open
gte = close >= open
lte = close <= open

plot(gt ? 1 : 0)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('$.pine.math.__eq(');
        expect(jsCode).toContain('>');
        expect(jsCode).toContain('<');
        expect(jsCode).toContain('>=');
        expect(jsCode).toContain('<=');
    });

    it('should transpile arithmetic operators', () => {
        const code = `
//@version=6
indicator("Arithmetic Test")

sum = 10 + 20
diff = 10 - 5
prod = 10 * 2
quot = 10 / 2
mod = 10 % 3

plot(sum)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('+');
        expect(jsCode).toContain('-');
        expect(jsCode).toContain('*');
        expect(jsCode).toContain('/');
        expect(jsCode).toContain('%');
    });

    it('should preserve parentheses in arithmetic precedence', () => {
        const code = `
//@version=6
indicator("Precedence Test")

x = 10
y = 20
z = 30
res = (x + y) * z
res2 = 100 * (x - y) / z

plot(res)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        // (x + y) * z -> should have parens around addition
        expect(jsCode).toMatch(/(\(.*\+.*\))\s*\*/);

        // 100 * (x - y) / z -> should have parens around subtraction
        expect(jsCode).toMatch(/100\s*\*\s*\(.*-.*\)\s*\//);
    });
});

describe('Pine Script Transpilation - Series and Arrays', () => {
    it('should transpile historical reference operator []', () => {
        const code = `
//@version=6
indicator("Series Test")

prev_close = close[1]
prev_prev_close = close[2]
high_5 = high[5]

plot(prev_close)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('close, 1');
        expect(jsCode).toContain('close, 2');
        expect(jsCode).toContain('high, 5');
    });

    it('should transpile array operations', () => {
        const code = `
//@version=6
indicator("Array Test")

prices = array.new_float(5, 0.0)
array.push(prices, close)
size = array.size(prices)

plot(size)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('array.new_float');
        expect(jsCode).toContain('array.push');
        expect(jsCode).toContain('array.size');
    });

    it('should transpile method call syntax', () => {
        const code = `
//@version=6
indicator("Method Test")

arr = array.new_float(0)
arr.push(close)
size = arr.size()

plot(size)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('.push(');
        expect(jsCode).toContain('.size()');
    });
});

describe('Pine Script Transpilation - Built-in Functions', () => {
    it('should transpile ta functions', () => {
        const code = `
//@version=6
indicator("TA Functions Test")

sma_val = ta.sma(close, 20)
ema_val = ta.ema(close, 20)
rsi_val = ta.rsi(close, 14)

plot(sma_val)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('ta.sma');
        expect(jsCode).toContain('ta.ema');
        expect(jsCode).toContain('ta.rsi');
    });

    it('should transpile math functions', () => {
        const code = `
//@version=6
indicator("Math Test")

abs_val = math.abs(-10)
max_val = math.max(close, open)
sqrt_val = math.sqrt(close)

plot(max_val)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('math.abs');
        expect(jsCode).toContain('math.max');
        expect(jsCode).toContain('math.sqrt');
    });

    it('should transpile input functions', () => {
        const code = `
//@version=6
indicator("Input Test")

length = input.int(14, "Length", minval=1, maxval=200)
src = input.source(close, "Source")
multiplier = input.float(2.0, "Multiplier")

plot(src)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('input.int');
        expect(jsCode).toContain('input.source');
        expect(jsCode).toContain('input.float');
    });

    it('should transpile string functions', () => {
        const code = `
//@version=6
indicator("String Test")

text = "Hello World"
length = str.length(text)
contains = str.contains(text, "Hello")

plot(length)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('str.length');
        expect(jsCode).toContain('str.contains');
    });

    it('should transpile color functions', () => {
        const code = `
//@version=6
indicator("Color Test")

base = color.blue
trans = color.new(color.blue, 50)
rgb = color.rgb(255, 0, 0)
dynamic = close > open ? color.green : color.red

plot(close, color=dynamic)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('color.blue');
        expect(jsCode).toContain('color.new');
        expect(jsCode).toContain('color.rgb');
        expect(jsCode).toContain('color.green');
        expect(jsCode).toContain('color.red');
    });
});

describe('Pine Script Transpilation - Special Values', () => {
    it('should transpile na (not available)', () => {
        const code = `
//@version=6
indicator("NA Test")

var float prev = na
is_na = na(prev)
safe = nz(prev, close)

plot(safe)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('NaN');
    });

    it('should handle boolean values', () => {
        const code = `
//@version=6
indicator("Boolean Test")

flag = true
flag2 = false

result = flag ? 1 : 0
plot(result)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('true');
        expect(jsCode).toContain('false');
    });
});

describe('Pine Script Transpilation - Comments', () => {
    it('should handle single-line comments', () => {
        const code = `
//@version=6
indicator("Comment Test")

// This is a comment
x = 10  // Inline comment

plot(x)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        // Comments should be filtered out or preserved based on options
        expect(jsCode).toBeDefined();
    });

    it('should handle indicator declaration', () => {
        const code = `
//@version=6
indicator("My Indicator", shorttitle="MI", overlay=true)

plot(close)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('indicator');
        expect(jsCode).toContain('My Indicator');
    });
});

describe('Pine Script Transpilation - Complex Expressions', () => {
    it('should transpile nested ternary operators', () => {
        const code = `
//@version=6
indicator("Nested Ternary")

signal = close > open ? 1 : (close < open ? -1 : 0)
plot(signal)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('?');
        expect(jsCode).toContain(':');
    });

    it('should transpile complex boolean expressions', () => {
        const code = `
//@version=6
indicator("Complex Boolean")

condition = (close > open and volume > 1000) or (close < open and volume < 500)
plot(condition ? 1 : 0)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('&&');
        expect(jsCode).toContain('||');
    });

    it('should transpile function calls with expressions', () => {
        const code = `
//@version=6
indicator("Expression Test")

result = ta.sma(close > open ? close : open, 14)
plot(result)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('ta.sma');
    });
});

describe('Pine Script Transpilation - Error Handling', () => {
    it('should handle syntax errors gracefully', () => {
        const code = `
//@version=6
indicator("Error Test")

x = 
plot(x)
        `;

        // transpile may throw an error or produce incomplete output
        try {
            const result = transpile(code);
            const jsCode = result.toString();
            // If it doesn't throw, it should at least produce some output
            expect(jsCode).toBeDefined();
        } catch (error) {
            // Error is expected and acceptable for invalid syntax
            expect(error).toBeDefined();
        }
    });

    it('should handle invalid indentation', () => {
        const code = `
//@version=6
indicator("Indent Error")

if close > open
plot(close)
        `;

        // Should either succeed with warning or fail with descriptive error
        try {
            const result = transpile(code);
            expect(result).toBeDefined();
        } catch (error) {
            // Error is acceptable for invalid syntax
            expect(error).toBeDefined();
        }
    });
});

describe('Pine Script Transpilation - Real-World Example (MACD)', () => {
    it('should transpile complete MACD indicator', () => {
        const code = `
//@version=6
indicator("MACD", shorttitle="MACD")

fast_length = input.int(12, "Fast Length", minval=1)
slow_length = input.int(26, "Slow Length", minval=1)
signal_length = input.int(9, "Signal Length", minval=1)
src = input.source(close, "Source")

fast_ma = ta.ema(src, fast_length)
slow_ma = ta.ema(src, slow_length)
macd = fast_ma - slow_ma
signal = ta.ema(macd, signal_length)
hist = macd - signal

plot(hist, title="Histogram", style=plot.style_histogram, color=color.blue)
plot(macd, title="MACD", color=color.blue)
plot(signal, title="Signal", color=color.orange)
        `;

        const result = transpile(code);
        const jsCode = result.toString();

        expect(jsCode).toContain('input.int');
        expect(jsCode).toContain('ta.ema');
        expect(jsCode).toContain('plot');
        expect(jsCode).toContain('$.let.glb1_macd');
        expect(jsCode).toContain('$.let.glb1_signal');
        expect(jsCode).toContain('$.let.glb1_hist');
    });
});
