// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Parabolic SAR (Stop and Reverse)
 *
 * Parabolic SAR is a method devised by J. Welles Wilder, Jr., to find potential reversals
 * in the market price direction.
 *
 * @param start - Start acceleration factor
 * @param inc - Increment acceleration factor
 * @param max - Maximum acceleration factor
 * @returns Parabolic SAR value
 */
export function sar(context: any) {
    return (_start: any, _inc: any, _max: any, _callId?: string) => {
        const start = Series.from(_start).get(0);
        const inc = Series.from(_inc).get(0);
        const max = Series.from(_max).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `sar_${start}_${inc}_${max}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                result: NaN,
                maxMin: NaN,
                acceleration: NaN,
                isBelow: false,
                barIndex: 0, // Internal bar counter to match Pine's bar_index
            };
        }

        const state = context.taState[stateKey];

        // Get current OHLC
        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        // Get previous OHLC
        const prevClose = context.get(context.data.close, 1);
        const prevHigh = context.get(context.data.high, 1);
        const prevLow = context.get(context.data.low, 1);
        const prevHigh2 = context.get(context.data.high, 2);
        const prevLow2 = context.get(context.data.low, 2);

        // Handle NaN inputs
        if (isNaN(high) || isNaN(low) || isNaN(close)) {
            return NaN;
        }

        let isFirstTrendBar = false;

        // Initialize on second bar (bar_index 1)
        // Pine Script bar_index is 0-based. First bar is 0.
        if (state.barIndex === 1) {
            if (close > prevClose) {
                state.isBelow = true;
                state.maxMin = high;
                state.result = prevLow;
            } else {
                state.isBelow = false;
                state.maxMin = low;
                state.result = prevHigh;
            }
            isFirstTrendBar = true;
            state.acceleration = start;
        }

        // Only calculate if initialized
        if (state.barIndex >= 1) {
            // Calculate SAR
            // result := result + acceleration * (maxMin - result)
            state.result = state.result + state.acceleration * (state.maxMin - state.result);

            // Check for Reversal
            if (state.isBelow) {
                if (state.result > low) {
                    isFirstTrendBar = true;
                    state.isBelow = false;
                    state.result = Math.max(high, state.maxMin);
                    state.maxMin = low;
                    state.acceleration = start;
                }
            } else {
                if (state.result < high) {
                    isFirstTrendBar = true;
                    state.isBelow = true;
                    state.result = Math.min(low, state.maxMin);
                    state.maxMin = high;
                    state.acceleration = start;
                }
            }

            // Update Acceleration and MaxMin if not a reversal bar
            if (!isFirstTrendBar) {
                if (state.isBelow) {
                    if (high > state.maxMin) {
                        state.maxMin = high;
                        state.acceleration = Math.min(state.acceleration + inc, max);
                    }
                } else {
                    if (low < state.maxMin) {
                        state.maxMin = low;
                        state.acceleration = Math.min(state.acceleration + inc, max);
                    }
                }
            }

            // Ensure SAR doesn't penetrate recent prices
            if (state.isBelow) {
                state.result = Math.min(state.result, prevLow);
                if (state.barIndex > 1) {
                    state.result = Math.min(state.result, prevLow2);
                }
            } else {
                state.result = Math.max(state.result, prevHigh);
                if (state.barIndex > 1) {
                    state.result = Math.max(state.result, prevHigh2);
                }
            }
        }

        // Increment bar index for next call
        state.barIndex++;

        if (state.barIndex <= 1) {
            return NaN;
        }

        return context.precision(state.result);
    };
}
