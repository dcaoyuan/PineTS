// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Chande Momentum Oscillator (CMO)
 *
 * Calculates the difference between the sum of recent gains and the sum of recent losses
 * and then divides the result by the sum of all price movement over the same period.
 *
 * Pine Script Formula:
 * mom = change(src)
 * sm1 = sum((mom >= 0) ? mom : 0.0, length)
 * sm2 = sum((mom >= 0) ? 0.0 : -mom, length)
 * cmo = 100 * (sm1 - sm2) / (sm1 + sm2)
 *
 * @param source - Source series (typically close)
 * @param length - Number of bars (lookback period)
 * @returns CMO value (-100 to +100)
 */
export function cmo(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `cmo_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                gainsWindow: [],
                lossesWindow: [],
                gainsSum: 0,
                lossesSum: 0,
            };
        }

        const state = context.taState[stateKey];

        // Get current and previous values
        const currentValue = Series.from(source).get(0);
        const previousValue = Series.from(source).get(1);

        // Handle NaN inputs
        if (isNaN(currentValue) || isNaN(previousValue)) {
            return NaN;
        }

        // Calculate momentum (change)
        const mom = currentValue - previousValue;

        // Calculate gains and losses
        // sm1: sum of positive momentum
        // sm2: sum of absolute negative momentum
        const gain = mom >= 0 ? mom : 0;
        const loss = mom >= 0 ? 0 : -mom; // Note: -mom to make it positive

        // Add to windows
        state.gainsWindow.unshift(gain);
        state.lossesWindow.unshift(loss);
        state.gainsSum += gain;
        state.lossesSum += loss;

        // Not enough data yet
        if (state.gainsWindow.length < length) {
            return NaN;
        }

        // Remove oldest values if window exceeds length
        if (state.gainsWindow.length > length) {
            const oldGain = state.gainsWindow.pop();
            const oldLoss = state.lossesWindow.pop();
            state.gainsSum -= oldGain;
            state.lossesSum -= oldLoss;
        }

        // Calculate CMO
        const denominator = state.gainsSum + state.lossesSum;
        
        if (denominator === 0) {
            return context.precision(0); // No movement, return 0
        }

        const cmo = 100 * (state.gainsSum - state.lossesSum) / denominator;

        return context.precision(cmo);
    };
}

