// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * ALMA - Arnaud Legoux Moving Average
 * 
 * ALMA uses a Gaussian distribution to weight the moving average,
 * reducing lag while maintaining smoothness.
 * 
 * @param source - The data source (typically close price)
 * @param period - The number of periods (window size)
 * @param offset - Position of Gaussian peak (0-1, default 0.85). Higher = more responsive
 * @param sigma - Width of Gaussian curve (default 6). Higher = smoother
 * 
 * Formula:
 * - m = offset * (period - 1)
 * - s = period / sigma
 * - weight[i] = exp(-((i - m)^2) / (2 * s^2))
 * - ALMA = sum(weight[i] * price[i]) / sum(weight[i])
 */
export function alma(context: any) {
    return (source: any, _period: any, _offset: any, _sigma: any, _callId?: string) => {
        const period = Series.from(_period).get(0);
        const offset = Series.from(_offset).get(0);
        const sigma = Series.from(_sigma).get(0);

        // Incremental ALMA calculation using rolling window
        if (!context.taState) context.taState = {};
        const stateKey = _callId || `alma_${period}_${offset}_${sigma}`;

        if (!context.taState[stateKey]) {
            // Pre-calculate weights (they're constant for given parameters)
            const m = offset * (period - 1);
            const s = period / sigma;
            const weights = [];
            let weightSum = 0;

            for (let i = 0; i < period; i++) {
                const weight = Math.exp(-Math.pow(i - m, 2) / (2 * s * s));
                weights.push(weight);
                weightSum += weight;
            }

            // Normalize weights
            for (let i = 0; i < weights.length; i++) {
                weights[i] /= weightSum;
            }

            context.taState[stateKey] = { 
                window: [],
                weights: weights
            };
        }

        const state = context.taState[stateKey];
        const currentValue = Series.from(source).get(0);

        // Add current value to window (most recent at front)
        state.window.unshift(currentValue);

        if (state.window.length < period) {
            // Not enough data yet
            return NaN;
        }

        if (state.window.length > period) {
            // Remove oldest value
            state.window.pop();
        }

        // Calculate weighted average
        // Window is [newest, ..., oldest], but weights are indexed [oldest, ..., newest]
        // So we need to apply weights in reverse order
        let alma = 0;
        for (let i = 0; i < period; i++) {
            // weights[0] = oldest, weights[period-1] = newest
            // window[0] = newest, window[period-1] = oldest
            // So weights[i] should multiply window[period-1-i]
            alma += state.weights[i] * state.window[period - 1 - i];
        }

        return context.precision(alma);
    };
}

