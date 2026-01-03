// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function dev(context: any) {
    return (source: any, _length: any, _callId?: string) => {
        const length = Series.from(_length).get(0);

        // Mean Absolute Deviation
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `dev_${length}`;

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

        const currentValue = Series.from(source).get(0) || 0;

        const window = [...state.prevWindow];
        let sum = state.prevSum;

        window.unshift(currentValue);
        sum += currentValue;

        if (window.length > length) {
            const oldValue = window.pop();
            sum -= oldValue;
        }

        state.currentWindow = window;
        state.currentSum = sum;

        if (window.length < length) {
            return NaN;
        }

        const mean = sum / length;
        let sumDeviation = 0;
        for (let i = 0; i < length; i++) {
            sumDeviation += Math.abs(window[i] - mean);
        }

        const dev = sumDeviation / length;
        return context.precision(dev);
    };
}
