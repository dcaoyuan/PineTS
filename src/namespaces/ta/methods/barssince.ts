// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Bars Since
 *
 * Counts the number of bars since the last time the condition was true.
 */
export function barssince(context: any) {
    return (condition: any, _callId?: string) => {
        if (!context.taState) context.taState = {};
        const stateKey = _callId || 'barssince';

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                lastTrueIndex: null,
            };
        }
        const state = context.taState[stateKey];

        const cond = Series.from(condition).get(0);

        if (cond) {
            state.lastTrueIndex = context.idx;
            return 0;
        }

        if (state.lastTrueIndex === null) {
            return NaN;
        }

        return context.idx - state.lastTrueIndex;
    };
}
