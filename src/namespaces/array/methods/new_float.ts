// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';
import { precision } from '../utils';

export function new_float(context: any) {
    return (size: number, initial_value: number = NaN): PineArrayObject => {
        return new PineArrayObject(Array(size).fill(precision(initial_value)), PineArrayType.float, context);
    };
}
