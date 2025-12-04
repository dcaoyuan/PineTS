// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * VWAP - Volume Weighted Average Price
 *
 * VWAP calculates the average price weighted by volume for a trading session.
 * It resets at the start of each new session (typically daily).
 *
 * Formula: VWAP = Σ(Price × Volume) / Σ(Volume)
 *
 * @param source - The price source (typically close, hlc3, or ohlc4)
 *
 * Note: This implementation resets VWAP at the start of each trading session
 * based on detecting new trading days (when openTime changes to a new day).
 */
export function vwap(context: any) {
    return (source: any, _callId?: string) => {
        // VWAP calculation using cumulative sums
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `vwap`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                cumulativePV: 0, // Cumulative price * volume
                cumulativeVolume: 0, // Cumulative volume
                lastSessionDate: null, // Track last session date
            };
        }

        const state = context.taState[stateKey];

        // Get current values
        const currentPrice = Series.from(source).get(0);
        const currentVolume = Series.from(context.data.volume).get(0);

        // Get current bar's open time to detect session changes
        const currentOpenTime = Series.from(context.data.openTime).get(0);

        // Detect new session (new trading day)
        const currentDate = new Date(currentOpenTime);
        const currentSessionDate = currentDate.toISOString().slice(0, 10); // YYYY-MM-DD

        // Reset VWAP at the start of a new session
        if (state.lastSessionDate !== currentSessionDate) {
            state.cumulativePV = 0;
            state.cumulativeVolume = 0;
            state.lastSessionDate = currentSessionDate;
        }

        // Update cumulative values
        state.cumulativePV += currentPrice * currentVolume;
        state.cumulativeVolume += currentVolume;

        // Calculate VWAP
        if (state.cumulativeVolume === 0) {
            return NaN;
        }

        const vwap = state.cumulativePV / state.cumulativeVolume;
        return context.precision(vwap);
    };
}
