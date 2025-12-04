// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function change(context: any) {
    return (source: any, _length: any = 1, _callId?: string) => {
        //handle the case where ta.change is called with the source only,
        // in that case the transpiler will inject the callId as a second parameter
        // so we need to extract the callId and set the length to 1
        if (typeof _length === 'string') {
            _callId = _length;
            _length = 1;
        }
        const length = Series.from(_length).get(0);

        // Simple lookback - store window
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `change_${length}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = { window: [] };
        }

        const state = context.taState[stateKey];
        const currentValue = Series.from(source).get(0);

        state.window.unshift(currentValue);

        if (state.window.length <= length) {
            return NaN;
        }

        if (state.window.length > length + 1) {
            state.window.pop();
        }

        const change = currentValue - state.window[length];
        return context.precision(change);
    };
}
