// SPDX-License-Identifier: AGPL-3.0-only

import { PineMatrixObject } from '../PineMatrixObject';
import { Context } from '../../../Context.class';
import { PineArrayObject } from '../../array/PineArrayObject';
import { inferValueType } from '@pinets/namespaces/array/utils';

export function row(context: Context) {
    return (id: PineMatrixObject, row: number) => {
        if (!id.matrix[row]) {
            const anyType = inferValueType(id.matrix[0][0]);
            return new PineArrayObject([], anyType as any, context);
        }
        const rowType = inferValueType(id.matrix[row][0]);
        return new PineArrayObject([...id.matrix[row]], rowType as any, context);
    };
}
