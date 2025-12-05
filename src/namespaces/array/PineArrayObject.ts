// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:array-index

import { abs as abs_factory } from './methods/abs';
import { avg as avg_factory } from './methods/avg';
import { binary_search as binary_search_factory } from './methods/binary_search';
import { binary_search_leftmost as binary_search_leftmost_factory } from './methods/binary_search_leftmost';
import { binary_search_rightmost as binary_search_rightmost_factory } from './methods/binary_search_rightmost';
import { clear as clear_factory } from './methods/clear';
import { concat as concat_factory } from './methods/concat';
import { copy as copy_factory } from './methods/copy';
import { covariance as covariance_factory } from './methods/covariance';
import { every as every_factory } from './methods/every';
import { fill as fill_factory } from './methods/fill';
import { first as first_factory } from './methods/first';
import { get as get_factory } from './methods/get';
import { includes as includes_factory } from './methods/includes';
import { indexof as indexof_factory } from './methods/indexof';
import { insert as insert_factory } from './methods/insert';
import { join as join_factory } from './methods/join';
import { last as last_factory } from './methods/last';
import { lastindexof as lastindexof_factory } from './methods/lastindexof';
import { max as max_factory } from './methods/max';
import { median as median_factory } from './methods/median';
import { min as min_factory } from './methods/min';
import { mode as mode_factory } from './methods/mode';
import { percentile_linear_interpolation as percentile_linear_interpolation_factory } from './methods/percentile_linear_interpolation';
import { percentile_nearest_rank as percentile_nearest_rank_factory } from './methods/percentile_nearest_rank';
import { percentrank as percentrank_factory } from './methods/percentrank';
import { pop as pop_factory } from './methods/pop';
import { push as push_factory } from './methods/push';
import { range as range_factory } from './methods/range';
import { remove as remove_factory } from './methods/remove';
import { reverse as reverse_factory } from './methods/reverse';
import { set as set_factory } from './methods/set';
import { shift as shift_factory } from './methods/shift';
import { size as size_factory } from './methods/size';
import { slice as slice_factory } from './methods/slice';
import { some as some_factory } from './methods/some';
import { sort as sort_factory } from './methods/sort';
import { sort_indices as sort_indices_factory } from './methods/sort_indices';
import { standardize as standardize_factory } from './methods/standardize';
import { stdev as stdev_factory } from './methods/stdev';
import { sum as sum_factory } from './methods/sum';
import { unshift as unshift_factory } from './methods/unshift';
import { variance as variance_factory } from './methods/variance';

export class PineArrayObject {
    constructor(public array: any, public context: any) {}

    toString(): string {
        return 'PineArrayObject:' + this.array.toString();
    }

    abs(...args: any[]) {
        return (abs_factory(this.context) as any)(this, ...args);
    }

    avg(...args: any[]) {
        return (avg_factory(this.context) as any)(this, ...args);
    }

    binary_search(...args: any[]) {
        return (binary_search_factory(this.context) as any)(this, ...args);
    }

    binary_search_leftmost(...args: any[]) {
        return (binary_search_leftmost_factory(this.context) as any)(this, ...args);
    }

    binary_search_rightmost(...args: any[]) {
        return (binary_search_rightmost_factory(this.context) as any)(this, ...args);
    }

    clear(...args: any[]) {
        return (clear_factory(this.context) as any)(this, ...args);
    }

    concat(...args: any[]) {
        return (concat_factory(this.context) as any)(this, ...args);
    }

    copy(...args: any[]) {
        return (copy_factory(this.context) as any)(this, ...args);
    }

    covariance(...args: any[]) {
        return (covariance_factory(this.context) as any)(this, ...args);
    }

    every(...args: any[]) {
        return (every_factory(this.context) as any)(this, ...args);
    }

    fill(...args: any[]) {
        return (fill_factory(this.context) as any)(this, ...args);
    }

    first(...args: any[]) {
        return (first_factory(this.context) as any)(this, ...args);
    }

    get(...args: any[]) {
        return (get_factory(this.context) as any)(this, ...args);
    }

    includes(...args: any[]) {
        return (includes_factory(this.context) as any)(this, ...args);
    }

    indexof(...args: any[]) {
        return (indexof_factory(this.context) as any)(this, ...args);
    }

    insert(...args: any[]) {
        return (insert_factory(this.context) as any)(this, ...args);
    }

    join(...args: any[]) {
        return (join_factory(this.context) as any)(this, ...args);
    }

    last(...args: any[]) {
        return (last_factory(this.context) as any)(this, ...args);
    }

    lastindexof(...args: any[]) {
        return (lastindexof_factory(this.context) as any)(this, ...args);
    }

    max(...args: any[]) {
        return (max_factory(this.context) as any)(this, ...args);
    }

    median(...args: any[]) {
        return (median_factory(this.context) as any)(this, ...args);
    }

    min(...args: any[]) {
        return (min_factory(this.context) as any)(this, ...args);
    }

    mode(...args: any[]) {
        return (mode_factory(this.context) as any)(this, ...args);
    }

    percentile_linear_interpolation(...args: any[]) {
        return (percentile_linear_interpolation_factory(this.context) as any)(this, ...args);
    }

    percentile_nearest_rank(...args: any[]) {
        return (percentile_nearest_rank_factory(this.context) as any)(this, ...args);
    }

    percentrank(...args: any[]) {
        return (percentrank_factory(this.context) as any)(this, ...args);
    }

    pop(...args: any[]) {
        return (pop_factory(this.context) as any)(this, ...args);
    }

    push(...args: any[]) {
        return (push_factory(this.context) as any)(this, ...args);
    }

    range(...args: any[]) {
        return (range_factory(this.context) as any)(this, ...args);
    }

    remove(...args: any[]) {
        return (remove_factory(this.context) as any)(this, ...args);
    }

    reverse(...args: any[]) {
        return (reverse_factory(this.context) as any)(this, ...args);
    }

    set(...args: any[]) {
        return (set_factory(this.context) as any)(this, ...args);
    }

    shift(...args: any[]) {
        return (shift_factory(this.context) as any)(this, ...args);
    }

    size(...args: any[]) {
        return (size_factory(this.context) as any)(this, ...args);
    }

    slice(...args: any[]) {
        return (slice_factory(this.context) as any)(this, ...args);
    }

    some(...args: any[]) {
        return (some_factory(this.context) as any)(this, ...args);
    }

    sort(...args: any[]) {
        return (sort_factory(this.context) as any)(this, ...args);
    }

    sort_indices(...args: any[]) {
        return (sort_indices_factory(this.context) as any)(this, ...args);
    }

    standardize(...args: any[]) {
        return (standardize_factory(this.context) as any)(this, ...args);
    }

    stdev(...args: any[]) {
        return (stdev_factory(this.context) as any)(this, ...args);
    }

    sum(...args: any[]) {
        return (sum_factory(this.context) as any)(this, ...args);
    }

    unshift(...args: any[]) {
        return (unshift_factory(this.context) as any)(this, ...args);
    }

    variance(...args: any[]) {
        return (variance_factory(this.context) as any)(this, ...args);
    }
}
