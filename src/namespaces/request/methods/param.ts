// SPDX-License-Identifier: AGPL-3.0-only

import { Series } from '../../../Series';

export function param(context: any) {
    return (source: any, index: any, name?: string) => {
        if (!context.params[name]) context.params[name] = [];

        let val;
        if (source instanceof Series) {
            // Source is a Series - extract the value at index
            val = source.get(index || 0);
        } else if (Array.isArray(source)) {
            // Check if this is a tuple expression vs a time-series array
            //
            // For request.security, tuples are always passed as arrays of expressions.
            // Heuristic: If the array contains Series objects OR scalar values (not nested arrays),
            // and it's NOT a single-element array, treat it as a tuple.
            //
            // A time-series array would be a forward chronological array of values,
            // which would have nested structure like [[a,b], [a,b], ...] OR simple values [1,2,3...]
            // but NOT a mix of Series objects at the top level.

            const hasOnlySeries = source.every((elem) => elem instanceof Series);
            const hasOnlyScalars = source.every((elem) => !(elem instanceof Series) && !Array.isArray(elem));
            const isTuple = (hasOnlySeries || hasOnlyScalars) && source.length >= 1;

            if (isTuple) {
                // Preserve the tuple, but extract values from Series
                if (hasOnlySeries) {
                    // Extract current value from each Series
                    val = source.map((s: Series) => s.get(0));
                } else {
                    // Already scalar values
                    val = source;
                }
            } else {
                // Time-series array - extract value at index
                val = Series.from(source).get(index || 0);
            }
        } else {
            val = source;
        }

        if (context.params[name].length === 0) {
            context.params[name].push(val);
        } else {
            context.params[name][context.params[name].length - 1] = val;
        }

        return [val, name];
    };
}
