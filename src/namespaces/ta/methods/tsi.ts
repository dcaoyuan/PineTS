// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * True Strength Index (TSI)
 *
 * True strength index uses moving averages of the underlying momentum of a financial instrument.
 *
 * Formula:
 * pc = change(source)                    // Price change
 * double_smoothed_pc = ema(ema(pc, long_length), short_length)
 * double_smoothed_abs_pc = ema(ema(abs(pc), long_length), short_length)
 * tsi = double_smoothed_pc / double_smoothed_abs_pc
 *
 * @param source - Source series (typically close)
 * @param shortLength - Short EMA length
 * @param longLength - Long EMA length
 * @returns TSI value in range [-1, 1]
 */
export function tsi(context: any) {
    return (source: any, _shortLength: any, _longLength: any, _callId?: string) => {
        const shortLength = Series.from(_shortLength).get(0);
        const longLength = Series.from(_longLength).get(0);

        if (!context.taState) context.taState = {};
        const stateKey = _callId || `tsi_${shortLength}_${longLength}`;

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                // For price change (pc)
                prevSource: NaN,
                // For first EMA of pc (long)
                ema1_pc_multiplier: 2 / (longLength + 1),
                ema1_pc_value: NaN,
                ema1_pc_count: 0,
                ema1_pc_sum: 0,
                // For second EMA of pc (short) - double smoothed
                ema2_pc_multiplier: 2 / (shortLength + 1),
                ema2_pc_value: NaN,
                ema2_pc_count: 0,
                ema2_pc_sum: 0,
                // For first EMA of abs(pc) (long)
                ema1_abs_multiplier: 2 / (longLength + 1),
                ema1_abs_value: NaN,
                ema1_abs_count: 0,
                ema1_abs_sum: 0,
                // For second EMA of abs(pc) (short) - double smoothed
                ema2_abs_multiplier: 2 / (shortLength + 1),
                ema2_abs_value: NaN,
                ema2_abs_count: 0,
                ema2_abs_sum: 0,
            };
        }

        const state = context.taState[stateKey];
        const currentSource = Series.from(source).get(0);

        // Handle NaN input
        if (isNaN(currentSource)) {
            return NaN;
        }

        // Calculate price change
        const pc = isNaN(state.prevSource) ? NaN : currentSource - state.prevSource;
        state.prevSource = currentSource;

        if (isNaN(pc)) {
            return NaN;
        }

        const absPC = Math.abs(pc);

        // First EMA of pc (long length)
        state.ema1_pc_count++;
        if (state.ema1_pc_count <= longLength) {
            state.ema1_pc_sum += pc;
            if (state.ema1_pc_count === longLength) {
                state.ema1_pc_value = state.ema1_pc_sum / longLength;
            }
        } else {
            state.ema1_pc_value = pc * state.ema1_pc_multiplier + state.ema1_pc_value * (1 - state.ema1_pc_multiplier);
        }

        // First EMA of abs(pc) (long length)
        state.ema1_abs_count++;
        if (state.ema1_abs_count <= longLength) {
            state.ema1_abs_sum += absPC;
            if (state.ema1_abs_count === longLength) {
                state.ema1_abs_value = state.ema1_abs_sum / longLength;
            }
        } else {
            state.ema1_abs_value = absPC * state.ema1_abs_multiplier + state.ema1_abs_value * (1 - state.ema1_abs_multiplier);
        }

        // Check if first EMA is ready
        if (isNaN(state.ema1_pc_value) || isNaN(state.ema1_abs_value)) {
            return NaN;
        }

        // Second EMA of pc (short length) - double smoothed
        state.ema2_pc_count++;
        if (state.ema2_pc_count <= shortLength) {
            state.ema2_pc_sum += state.ema1_pc_value;
            if (state.ema2_pc_count === shortLength) {
                state.ema2_pc_value = state.ema2_pc_sum / shortLength;
            }
        } else {
            state.ema2_pc_value = state.ema1_pc_value * state.ema2_pc_multiplier + state.ema2_pc_value * (1 - state.ema2_pc_multiplier);
        }

        // Second EMA of abs(pc) (short length) - double smoothed
        state.ema2_abs_count++;
        if (state.ema2_abs_count <= shortLength) {
            state.ema2_abs_sum += state.ema1_abs_value;
            if (state.ema2_abs_count === shortLength) {
                state.ema2_abs_value = state.ema2_abs_sum / shortLength;
            }
        } else {
            state.ema2_abs_value = state.ema1_abs_value * state.ema2_abs_multiplier + state.ema2_abs_value * (1 - state.ema2_abs_multiplier);
        }

        // Check if second EMA is ready
        if (isNaN(state.ema2_pc_value) || isNaN(state.ema2_abs_value)) {
            return NaN;
        }

        // Avoid division by zero
        if (state.ema2_abs_value === 0) {
            return context.precision(0);
        }

        // Calculate TSI
        const tsi = state.ema2_pc_value / state.ema2_abs_value;

        return context.precision(tsi);
    };
}

