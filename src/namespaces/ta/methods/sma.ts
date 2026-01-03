// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function sma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Incremental SMA calculation using rolling sum
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `sma_${period}`;

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

        // Use committed state
        const window = [...state.prevWindow];
        let sum = state.prevSum;

        // Add current value to window
        window.unshift(currentValue);
        sum += currentValue;

        if (window.length < period) {
            // Update tentative state
            state.currentWindow = window;
            state.currentSum = sum;
            return NaN;
        }

        if (window.length > period) {
            // Remove oldest value from sum
            const oldValue = window.pop();
            sum -= oldValue;
        }

        // Update tentative state
        state.currentWindow = window;
        state.currentSum = sum;

        const sma = sum / period;
        return context.precision(sma);
    };
}
