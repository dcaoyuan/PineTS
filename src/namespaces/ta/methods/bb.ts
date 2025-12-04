// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Bollinger Bands (BB)
 *
 * Bollinger Bands are volatility bands placed above and below a moving average.
 * Volatility is based on the standard deviation, which changes as volatility increases and decreases.
 *
 * Formula:
 * - Middle Band = SMA(source, length)
 * - Upper Band = Middle Band + (multiplier × Standard Deviation)
 * - Lower Band = Middle Band - (multiplier × Standard Deviation)
 *
 * @param source - The data source (typically close price)
 * @param length - The period for SMA and standard deviation (default 20)
 * @param mult - The multiplier for standard deviation (default 2)
 * @returns [upper, middle, lower]
 */
export function bb(context: any) {
    return (source: any, _length: any, _mult: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const mult = Series.from(_mult).get(0);

        // Use incremental calculation with rolling window
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `bb_${length}_${mult}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                window: [],
                sum: 0,
            };
        }

        const state = context.taState[stateKey];
        const currentValue = Series.from(source).get(0);

        // Handle NaN input
        if (isNaN(currentValue)) {
            return [[NaN, NaN, NaN]];
        }

        // Add current value to window
        state.window.unshift(currentValue);
        state.sum += currentValue;

        // Not enough data yet
        if (state.window.length < length) {
            return [[NaN, NaN, NaN]];
        }

        // Remove oldest value if window exceeds length
        if (state.window.length > length) {
            const oldValue = state.window.pop();
            state.sum -= oldValue;
        }

        // Calculate middle band (SMA)
        const middle = state.sum / length;

        // Calculate standard deviation
        let sumSquaredDiff = 0;
        for (let i = 0; i < length; i++) {
            sumSquaredDiff += Math.pow(state.window[i] - middle, 2);
        }
        const stdev = Math.sqrt(sumSquaredDiff / length);

        // Calculate upper and lower bands
        const upper = middle + mult * stdev;
        const lower = middle - mult * stdev;

        // Return as tuple with double brackets
        return [[context.precision(upper), context.precision(middle), context.precision(lower)]];
    };
}

