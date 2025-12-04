// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Money Flow Index (MFI)
 *
 * MFI is a momentum indicator that uses price and volume to identify overbought or oversold conditions.
 *
 * Pine Script Formula:
 * upper = sum(volume * (change(src) <= 0 ? 0 : src), length)
 * lower = sum(volume * (change(src) >= 0 ? 0 : src), length)
 * mfi = 100.0 - (100.0 / (1.0 + upper / lower))
 *
 * @param source - Source series (typically hlc3)
 * @param length - Number of bars back (lookback period)
 * @returns MFI value (0-100)
 */
export function mfi(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `mfi_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                upperWindow: [],
                lowerWindow: [],
                upperSum: 0,
                lowerSum: 0,
            };
        }

        const state = context.taState[stateKey];

        // Get current values
        const currentSrc = Series.from(source).get(0);
        const previousSrc = Series.from(source).get(1);
        const volume = context.get(context.data.volume, 0);

        // Handle NaN inputs
        if (isNaN(currentSrc) || isNaN(volume)) {
            return NaN;
        }

        // Calculate change
        const change = isNaN(previousSrc) ? NaN : currentSrc - previousSrc;

        // Calculate upper and lower based on Pine Script formula
        // upper component: volume * (change <= 0 ? 0 : src)
        // lower component: volume * (change >= 0 ? 0 : src)
        let upperComponent = 0;
        let lowerComponent = 0;

        // Calculate components following Pine Script logic exactly
        // When change is NaN, comparisons return false, so we use src
        // upper: if change <= 0, use 0, else use src
        upperComponent = volume * (change <= 0 ? 0 : currentSrc);
        // lower: if change >= 0, use 0, else use src
        lowerComponent = volume * (change >= 0 ? 0 : currentSrc);

        // Add to windows
        state.upperWindow.unshift(upperComponent);
        state.lowerWindow.unshift(lowerComponent);
        state.upperSum += upperComponent;
        state.lowerSum += lowerComponent;

        // Not enough data yet
        if (state.upperWindow.length < length) {
            return NaN;
        }

        // Remove oldest values if window exceeds length
        if (state.upperWindow.length > length) {
            const oldUpper = state.upperWindow.pop();
            const oldLower = state.lowerWindow.pop();
            state.upperSum -= oldUpper;
            state.lowerSum -= oldLower;
        }

        // Calculate MFI
        if (state.lowerSum === 0) {
            if (state.upperSum === 0) {
                return context.precision(100); // No change = bullish (Pine Script behavior)
            }
            return context.precision(100); // All positive money flow
        }

        if (state.upperSum === 0) {
            return context.precision(0); // All negative money flow
        }

        const mfi = 100.0 - 100.0 / (1.0 + state.upperSum / state.lowerSum);

        return context.precision(mfi);
    };
}
