// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * SuperTrend Indicator
 *
 * The Supertrend is a trend following indicator based on ATR.
 *
 * Pine Script Formula:
 * src = hl2
 * atr = ta.atr(atrPeriod)
 * upperBand = src + factor * atr
 * lowerBand = src - factor * atr
 * prevLowerBand = nz(lowerBand[1])
 * prevUpperBand = nz(upperBand[1])
 *
 * lowerBand := lowerBand > prevLowerBand or close[1] < prevLowerBand ? lowerBand : prevLowerBand
 * upperBand := upperBand < prevUpperBand or close[1] > prevUpperBand ? upperBand : prevUpperBand
 *
 * direction: 1 (down/bearish), -1 (up/bullish)
 * superTrend := direction == -1 ? lowerBand : upperBand
 *
 * @param factor - The multiplier by which the ATR will get multiplied
 * @param atrPeriod - Length of ATR
 * @returns Tuple [supertrend, direction] where direction is 1 (down) or -1 (up)
 */
export function supertrend(context: any) {
    return (_factor: any, _atrPeriod: any, _callId?: string) => {
        const factor = Series.from(_factor).get(0);
        const atrPeriod = Series.from(_atrPeriod).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `supertrend_${factor}_${atrPeriod}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                // For ATR calculation (using RMA)
                trWindow: [],
                trSum: 0,
                atrValue: NaN,
                atrCount: 0,
                // For SuperTrend
                prevLowerBand: NaN,
                prevUpperBand: NaN,
                prevSuperTrend: NaN,
                prevDirection: NaN,
                prevClose: NaN,
            };
        }

        const state = context.taState[stateKey];

        // Get current OHLC values
        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        // Handle NaN inputs
        if (isNaN(high) || isNaN(low) || isNaN(close)) {
            return [[NaN, NaN]];
        }

        // Calculate hl2 (source)
        const hl2 = (high + low) / 2;

        // Calculate True Range
        let tr;
        if (isNaN(state.prevClose)) {
            tr = high - low;
        } else {
            tr = Math.max(high - low, Math.abs(high - state.prevClose), Math.abs(low - state.prevClose));
        }

        // Calculate ATR using RMA (same as ta.atr)
        state.atrCount++;
        if (state.atrCount <= atrPeriod) {
            state.trWindow.push(tr);
            state.trSum += tr;
            if (state.atrCount === atrPeriod) {
                state.atrValue = state.trSum / atrPeriod;
            }
        } else {
            // RMA formula: rma = (prev_rma * (length - 1) + current) / length
            state.atrValue = (state.atrValue * (atrPeriod - 1) + tr) / atrPeriod;
        }

        const atr = state.atrValue;

        // Store current close for next bar's TR calculation
        const prevClose = state.prevClose;
        state.prevClose = close;

        // Not enough data for ATR yet
        if (isNaN(atr)) {
            return [[NaN, NaN]];
        }

        // Calculate bands
        let upperBand = hl2 + factor * atr;
        let lowerBand = hl2 - factor * atr;

        // Get previous bands (use 0 if NaN - nz() behavior)
        const prevLowerBand = isNaN(state.prevLowerBand) ? 0 : state.prevLowerBand;
        const prevUpperBand = isNaN(state.prevUpperBand) ? 0 : state.prevUpperBand;

        // Adjust lowerBand: keep previous if price didn't break below
        // lowerBand := lowerBand > prevLowerBand or close[1] < prevLowerBand ? lowerBand : prevLowerBand
        if (!isNaN(state.prevLowerBand)) {
            if (lowerBand > prevLowerBand || prevClose < prevLowerBand) {
                // Keep new lowerBand
            } else {
                lowerBand = prevLowerBand;
            }
        }

        // Adjust upperBand: keep previous if price didn't break above
        // upperBand := upperBand < prevUpperBand or close[1] > prevUpperBand ? upperBand : prevUpperBand
        if (!isNaN(state.prevUpperBand)) {
            if (upperBand < prevUpperBand || prevClose > prevUpperBand) {
                // Keep new upperBand
            } else {
                upperBand = prevUpperBand;
            }
        }

        // Determine direction
        let direction: number;
        let superTrend: number;

        const prevSuperTrend = state.prevSuperTrend;

        if (state.atrCount === atrPeriod) {
            // First bar with ATR - initialize direction
            direction = 1;
        } else if (prevSuperTrend === state.prevUpperBand) {
            // Previous supertrend was upper band (bearish)
            direction = close > upperBand ? -1 : 1;
        } else {
            // Previous supertrend was lower band (bullish)
            direction = close < lowerBand ? 1 : -1;
        }

        // Set supertrend based on direction
        superTrend = direction === -1 ? lowerBand : upperBand;

        // Store state for next bar
        state.prevLowerBand = lowerBand;
        state.prevUpperBand = upperBand;
        state.prevSuperTrend = superTrend;
        state.prevDirection = direction;

        return [[context.precision(superTrend), direction]];
    };
}
