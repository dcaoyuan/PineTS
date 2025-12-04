// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Commodity Channel Index (CCI)
 *
 * CCI measures the deviation of the price from its average price.
 * It's used to identify cyclical trends and overbought/oversold conditions.
 *
 * Formula:
 * - Typical Price (TP) = (high + low + close) / 3
 * - CCI = (TP - SMA(TP, length)) / (0.015 × Mean Deviation)
 * - Mean Deviation = Average of |TP - SMA(TP)| over length periods
 *
 * @param source - Source series (typically close price, but can be any price)
 * @param length - Number of bars back (lookback period)
 * @returns CCI value
 *
 * @remarks
 * - Returns NaN during initialization period (when not enough data)
 * - The constant 0.015 ensures approximately 70-80% of values fall between -100 and +100
 */
export function cci(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        // Use incremental calculation with rolling window
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `cci_${length}`;

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
            return NaN;
        }

        // Add current value to window
        state.window.unshift(currentValue);
        state.sum += currentValue;

        // Not enough data yet
        if (state.window.length < length) {
            return NaN;
        }

        // Remove oldest value if window exceeds length
        if (state.window.length > length) {
            const oldValue = state.window.pop();
            state.sum -= oldValue;
        }

        // Calculate SMA (mean)
        const sma = state.sum / length;

        // Calculate Mean Deviation
        let sumAbsoluteDeviations = 0;
        for (let i = 0; i < length; i++) {
            sumAbsoluteDeviations += Math.abs(state.window[i] - sma);
        }
        const meanDeviation = sumAbsoluteDeviations / length;

        // Avoid division by zero
        if (meanDeviation === 0) {
            return 0;
        }

        // Calculate CCI
        const cci = (currentValue - sma) / (0.015 * meanDeviation);

        return context.precision(cci);
    };
}

