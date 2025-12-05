// SPDX-License-Identifier: AGPL-3.0-only

import { PineArrayObject } from '../PineArrayObject';
import { inferArrayType, inferValueType, precision } from '../utils';

export function new_fn(context: any) {
    return <T>(size: number, initial_value: T): PineArrayObject => {
        return new PineArrayObject(Array(size).fill(precision(initial_value || 0)), inferValueType((initial_value as any) || 0), context);
    };
}
