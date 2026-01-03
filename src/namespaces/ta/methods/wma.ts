// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function wma(context: any) {
    return (source: any, _period: any, _callId?: string) => {
        const period = Series.from(_period).get(0);

        // Weighted Moving Average
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `wma_${period}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastIdx: -1,
                // Committed state
                prevWindow: [],
                // Tentative state
                currentWindow: [],
            };
        }

        const state = context.taState[stateKey];

        // Commit logic
        if (context.idx > state.lastIdx) {
            if (state.lastIdx >= 0) {
                state.prevWindow = [...state.currentWindow];
            }
            state.lastIdx = context.idx;
        }

        const currentValue = Series.from(source).get(0);

        // Use committed state
        const window = [...state.prevWindow];

        window.unshift(currentValue);

        if (window.length < period) {
            state.currentWindow = window;
            return NaN;
        }

        if (window.length > period) {
            window.pop();
        }

        // Update tentative state
        state.currentWindow = window;

        let numerator = 0;
        let denominator = 0;
        for (let i = 0; i < period; i++) {
            const weight = period - i;
            numerator += window[i] * weight;
            denominator += weight;
        }

        const wma = numerator / denominator;
        return context.precision(wma);
    };
}
