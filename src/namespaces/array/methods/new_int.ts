// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject, PineArrayType } from '../PineArrayObject';
import { precision } from '../utils';

export function new_int(context: any) {
    return (size: number, initial_value: number = 0): PineArrayObject => {
        return new PineArrayObject(Array(size).fill(precision(initial_value)), PineArrayType.int, context);
    };
}
