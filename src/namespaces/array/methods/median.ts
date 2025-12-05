// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';

export function median(context: any) {
    return (id: PineArrayObject) => {
        if (id.array.length === 0) return NaN;

        // Filter out non-numeric values if necessary? Pine Script arrays are typed.
        // Assuming numeric array for median.

        // Create a copy to sort
        const sorted = [...id.array].sort((a, b) => {
            if (typeof a === 'number' && typeof b === 'number') {
                return a - b;
            }
            return 0;
        });

        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 !== 0) {
            return sorted[mid];
        }

        return (sorted[mid - 1] + sorted[mid]) / 2;
    };
}
