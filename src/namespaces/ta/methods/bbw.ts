// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Bollinger Bands Width (BBW)
 *
 * Formula:
 * basis = ta.sma(source, length)
 * dev = mult * ta.stdev(source, length)
 * bbw = (((basis + dev) - (basis - dev)) / basis) * 100
 */
export function bbw(context: any) {
    return (source: any, _length: any, _mult: any, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const mult = Series.from(_mult).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `bbw_${length}_${mult}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                prevSum: 0,
                // Tentative state
                currentWindow: [],
                currentSum: 0,
            };
        }

        const state = context.taState[stateKey];
        
        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
                state.prevSum = state.currentSum;
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        if (isNaN(currentValue)) {
            state.currentWindow = [...state.prevWindow];
            state.currentSum = state.prevSum;
            return NaN;
        }

        const window = [...state.prevWindow];
        let sum = state.prevSum;

        window.unshift(currentValue);
        sum += currentValue;

        if (window.length > length) {
            const removed = window.pop();
            sum -= removed;
        }

        state.currentWindow = window;
        state.currentSum = sum;

        if (window.length < length) {
            return NaN;
        }

        const basis = sum / length;

        let sumSqDiff = 0;
        for (let i = 0; i < length; i++) {
            const diff = window[i] - basis;
            sumSqDiff += diff * diff;
        }
        const variance = sumSqDiff / length;
        const stdev = Math.sqrt(variance);
        
        const dev = mult * stdev;
        
        if (basis === 0) {
             return context.precision(0);
        }

        const bbw = ((2 * dev) / basis) * 100;
        return context.precision(bbw);
    };
}
