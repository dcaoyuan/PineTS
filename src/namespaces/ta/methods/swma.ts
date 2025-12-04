// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * SWMA - Symmetrically Weighted Moving Average
 *
 * Pine Script's ta.swma() uses a fixed period of 4 bars with symmetric weights.
 * The weights are applied symmetrically: the current and 3 previous bars.
 *
 * Weights for 4-bar period: [1, 2, 2, 1]
 * Formula: SWMA = (price[3]*1 + price[2]*2 + price[1]*2 + price[0]*1) / 6
 *
 * @param source - The data source (typically close price)
 *
 * Note: Unlike other moving averages, SWMA has a fixed period of 4 in Pine Script
 */
export function swma(context: any) {
    return (source: any, _callId?: string) => {
        const period = 4; // Fixed period for SWMA
        const weights = [1, 2, 2, 1]; // Symmetric weights
        const weightSum = 6; // Sum of weights

        // Incremental SWMA calculation using rolling window
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `swma`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                window: [],
            };
        }

        const state = context.taState[stateKey];
        const currentValue = Series.from(source).get(0);

        // Add current value to window (most recent at front)
        state.window.unshift(currentValue);

        if (state.window.length < period) {
            // Not enough data yet
            return NaN;
        }

        if (state.window.length > period) {
            // Remove oldest value
            state.window.pop();
        }

        // Calculate symmetrically weighted average
        // Window is [newest, ..., oldest]
        // Weights are [1, 2, 2, 1] for [oldest, ..., newest]
        // So we apply weights in reverse order
        let swma = 0;
        for (let i = 0; i < period; i++) {
            // weights[0] = oldest (weight 1), weights[3] = newest (weight 1)
            // window[0] = newest, window[3] = oldest
            // So weights[i] should multiply window[period-1-i]
            swma += weights[i] * state.window[period - 1 - i];
        }
        swma /= weightSum;

        return context.precision(swma);
    };
}
