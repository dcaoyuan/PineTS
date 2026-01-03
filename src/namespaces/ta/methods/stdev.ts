// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function stdev(context: any) {
    return (source: any, _length: any, _bias: any = true, _callId?: string) => {
        const length = Series.from(_length).get(0);
        const bias = Series.from(_bias).get(0);

        // Standard Deviation
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `stdev_${length}_${bias}`;

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

        // Fix: Handle NaN/null values by skipping them
        if (currentValue === null || currentValue === undefined || isNaN(currentValue)) {
            return NaN;
        }

        // Use committed state
        const window = [...state.prevWindow];
        let sum = state.prevSum;

        window.unshift(currentValue);
        sum += currentValue;

        if (window.length < length) {
            state.currentWindow = window;
            state.currentSum = sum;
            return NaN;
        }

        if (window.length > length) {
            const oldValue = window.pop();
            sum -= oldValue;
        }

        // Update tentative state
        state.currentWindow = window;
        state.currentSum = sum;

        const mean = sum / length;
        let sumSquaredDiff = 0;
        for (let i = 0; i < length; i++) {
            sumSquaredDiff += Math.pow(window[i] - mean, 2);
        }

        const divisor = bias ? length : length - 1;
        const stdev = Math.sqrt(sumSquaredDiff / divisor);

        return context.precision(stdev);
    };
}
