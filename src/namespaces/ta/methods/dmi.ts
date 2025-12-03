// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Directional Movement Index (DMI)
 *
 * The DMI function returns the directional movement index.
 *
 * Formula:
 * up = high - high[1]
 * down = low[1] - low
 * plusDM = (up > down && up > 0) ? up : 0
 * minusDM = (down > up && down > 0) ? down : 0
 * tr = ta.tr
 * tru = rma(tr, diLength)
 * plus = rma(plusDM, diLength)
 * minus = rma(minusDM, diLength)
 * plusDI = 100 * plus / tru
 * minusDI = 100 * minus / tru
 * dx = 100 * abs(plusDI - minusDI) / (plusDI + minusDI)
 * adx = rma(dx, adxSmoothing)
 *
 * @param diLength - DI Period
 * @param adxSmoothing - ADX Smoothing Period
 * @returns Tuple of three DMI series: [+DI, -DI, ADX]
 */
export function dmi(context: any) {
    return (_diLength: any, _adxSmoothing: any, _callId?: string) => {
        const diLength = Series.from(_diLength).get(0);
        const adxSmoothing = Series.from(_adxSmoothing).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `dmi_${diLength}_${adxSmoothing}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                // Previous bar values
                prevHigh: NaN,
                prevLow: NaN,
                prevClose: NaN,

                // RMA states for TR, +DM, -DM (using diLength)
                // We track initSum and initCount for the SMA initialization phase
                trInitSum: 0,
                plusInitSum: 0,
                minusInitSum: 0,
                initCount: 0, // Counts valid bars for DI initialization

                prevSmoothedTR: NaN,
                prevSmoothedPlus: NaN,
                prevSmoothedMinus: NaN,

                // RMA state for ADX (using adxSmoothing)
                dxInitSum: 0,
                adxInitCount: 0,
                prevADX: NaN,
            };
        }

        const state = context.taState[stateKey];

        const high = context.get(context.data.high, 0);
        const low = context.get(context.data.low, 0);
        const close = context.get(context.data.close, 0);

        if (isNaN(high) || isNaN(low) || isNaN(close)) {
            return [[NaN, NaN, NaN]];
        }

        // Need previous values to calculate DM and TR
        if (isNaN(state.prevHigh)) {
            state.prevHigh = high;
            state.prevLow = low;
            state.prevClose = close;
            return [[NaN, NaN, NaN]];
        }

        // Calculate TR
        // tr = max(high - low, abs(high - prevClose), abs(low - prevClose))
        const tr = Math.max(high - low, Math.abs(high - state.prevClose), Math.abs(low - state.prevClose));

        // Calculate Directional Movement
        const up = high - state.prevHigh;
        const down = state.prevLow - low;

        const plusDM = (up > down && up > 0) ? up : 0;
        const minusDM = (down > up && down > 0) ? down : 0;

        // Update prev values for next time
        state.prevHigh = high;
        state.prevLow = low;
        state.prevClose = close;

        // --- Calculate Smoothed TR, +DM, -DM (RMA with diLength) ---
        // RMA logic:
        // If initCount < length: accumulate
        // If initCount == length: initial value is SMA (sum / length)
        // If initCount > length: alpha * current + (1-alpha) * prev

        let smoothedTR, smoothedPlus, smoothedMinus;

        state.initCount++;

        if (state.initCount <= diLength) {
            state.trInitSum += tr;
            state.plusInitSum += plusDM;
            state.minusInitSum += minusDM;

            if (state.initCount === diLength) {
                state.prevSmoothedTR = state.trInitSum / diLength;
                state.prevSmoothedPlus = state.plusInitSum / diLength;
                state.prevSmoothedMinus = state.minusInitSum / diLength;
            }
        } else {
            // Incremental RMA
            const alpha = 1 / diLength;
            state.prevSmoothedTR = alpha * tr + (1 - alpha) * state.prevSmoothedTR;
            state.prevSmoothedPlus = alpha * plusDM + (1 - alpha) * state.prevSmoothedPlus;
            state.prevSmoothedMinus = alpha * minusDM + (1 - alpha) * state.prevSmoothedMinus;
        }

        smoothedTR = state.prevSmoothedTR;
        smoothedPlus = state.prevSmoothedPlus;
        smoothedMinus = state.prevSmoothedMinus;

        // If not enough data for DI, return NaNs
        if (state.initCount < diLength) {
            return [[NaN, NaN, NaN]];
        }

        // Calculate DI
        // Avoid division by zero
        const plusDI = smoothedTR === 0 ? 0 : (100 * smoothedPlus / smoothedTR);
        const minusDI = smoothedTR === 0 ? 0 : (100 * smoothedMinus / smoothedTR);

        // Calculate DX
        const sumDI = plusDI + minusDI;
        const dx = sumDI === 0 ? 0 : (100 * Math.abs(plusDI - minusDI) / sumDI);

        // --- Calculate ADX (RMA of DX with adxSmoothing) ---
        let adx = NaN;

        state.adxInitCount++;

        if (state.adxInitCount <= adxSmoothing) {
            state.dxInitSum += dx;

            if (state.adxInitCount === adxSmoothing) {
                state.prevADX = state.dxInitSum / adxSmoothing;
                adx = state.prevADX;
            }
        } else {
            const alphaAdx = 1 / adxSmoothing;
            state.prevADX = alphaAdx * dx + (1 - alphaAdx) * state.prevADX;
            adx = state.prevADX;
        }

        return [[context.precision(plusDI), context.precision(minusDI), context.precision(adx)]];
    };
}

