// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

/**
 * Cumulative Sum (CUM)
 *
 * Returns the cumulative sum of the source values from the first bar to the current bar.
 * The cumulative sum is the running total of all values.
 *
 * Formula:
 * - CUM[0] = source[0]
 * - CUM[n] = CUM[n-1] + source[n]
 *
 * @param source - The data source to accumulate
 * @returns The cumulative sum up to the current bar
 */
export function cum(context: any) {
    return (source: any, _callId?: string) => {
        // Initialize state for cumulative calculation
        if (!context.taState) context.taState = {};
        const stateKey = _callId || 'cum';

        if (!context.taState[stateKey]) {
            context.taState[stateKey] = {
                cumulativeSum: 0,
            };
        }

        const state = context.taState[stateKey];
        const currentValue = Series.from(source).get(0);

        // Handle NaN input - don't add to cumulative sum
        if (isNaN(currentValue)) {
            return context.precision(state.cumulativeSum);
        }

        // Add current value to cumulative sum
        state.cumulativeSum += currentValue;

        return context.precision(state.cumulativeSum);
    };
}

