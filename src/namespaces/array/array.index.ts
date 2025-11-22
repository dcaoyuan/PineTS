// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:array-index

export { PineArrayObject } from './PineArrayObject';

import { abs } from './methods/abs';
import { avg } from './methods/avg';
import { clear } from './methods/clear';
import { concat } from './methods/concat';
import { copy } from './methods/copy';
import { covariance } from './methods/covariance';
import { every } from './methods/every';
import { fill } from './methods/fill';
import { first } from './methods/first';
import { from } from './methods/from';
import { get } from './methods/get';
import { includes } from './methods/includes';
import { indexof } from './methods/indexof';
import { insert } from './methods/insert';
import { join } from './methods/join';
import { last } from './methods/last';
import { lastindexof } from './methods/lastindexof';
import { max } from './methods/max';
import { min } from './methods/min';
import { new_fn } from './methods/new';
import { new_bool } from './methods/new_bool';
import { new_float } from './methods/new_float';
import { new_int } from './methods/new_int';
import { new_string } from './methods/new_string';
import { param } from './methods/param';
import { pop } from './methods/pop';
import { push } from './methods/push';
import { range } from './methods/range';
import { remove } from './methods/remove';
import { reverse } from './methods/reverse';
import { set } from './methods/set';
import { shift } from './methods/shift';
import { size } from './methods/size';
import { slice } from './methods/slice';
import { some } from './methods/some';
import { sort } from './methods/sort';
import { sort_indices } from './methods/sort_indices';
import { standardize } from './methods/standardize';
import { stdev } from './methods/stdev';
import { sum } from './methods/sum';
import { unshift } from './methods/unshift';
import { variance } from './methods/variance';

const methods = {
  abs,
  avg,
  clear,
  concat,
  copy,
  covariance,
  every,
  fill,
  first,
  from,
  get,
  includes,
  indexof,
  insert,
  join,
  last,
  lastindexof,
  max,
  min,
  new: new_fn,
  new_bool,
  new_float,
  new_int,
  new_string,
  param,
  pop,
  push,
  range,
  remove,
  reverse,
  set,
  shift,
  size,
  slice,
  some,
  sort,
  sort_indices,
  standardize,
  stdev,
  sum,
  unshift,
  variance
};

export class PineArray {
  private _cache = {};
  constructor(private context: any) {
    // Install methods
    Object.entries(methods).forEach(([name, factory]) => {
      this[name] = factory(context);
    });
  }
}

export default PineArray;
