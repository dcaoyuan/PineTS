// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Williams %R (WPR)
 *
 * The oscillator shows the current closing price in relation to the high and low
 * of the past 'length' bars.
 *
 * Formula:
 * %R = (Highest High - Close) / (Highest High - Lowest Low) * -100
 *
 * Note: Williams %R produces values between -100 and 0
 * - Values near -100 indicate oversold conditions
 * - Values near 0 indicate overbought conditions
 *
 * @param length - Number of bars (lookback period)
 * @returns Williams %R value (-100 to 0)
 */
export function wpr(context: any) {
    return (_length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `wpr_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                highWindow: [],
                lowWindow: [],
            };
        }

        const state = context.taState[stateKey];

        // Get current values from context.data
        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        // Handle NaN inputs
        if (isNaN(high) || isNaN(low) || isNaN(close)) {
            return NaN;
        }

        // Add to windows
        state.highWindow.unshift(high);
        state.lowWindow.unshift(low);

        // Not enough data yet
        if (state.highWindow.length < length) {
            return NaN;
        }

        // Remove oldest values if window exceeds length
        if (state.highWindow.length > length) {
            state.highWindow.pop();
            state.lowWindow.pop();
        }

        // Find highest high and lowest low in the window
        let highestHigh = state.highWindow[0];
        let lowestLow = state.lowWindow[0];

        for (let i = 1; i < length; i++) {
            if (state.highWindow[i] > highestHigh) {
                highestHigh = state.highWindow[i];
            }
            if (state.lowWindow[i] < lowestLow) {
                lowestLow = state.lowWindow[i];
            }
        }

        // Calculate Williams %R
        const range = highestHigh - lowestLow;

        if (range === 0) {
            return context.precision(0); // Avoid division by zero
        }

        // Williams %R formula: (Highest High - Close) / (Highest High - Lowest Low) * -100
        const wpr = ((highestHigh - close) / range) * -100;

        return context.precision(wpr);
    };
}
