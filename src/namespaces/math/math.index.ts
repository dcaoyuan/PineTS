// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:math-index

import { abs } from './methods/abs';
import { acos } from './methods/acos';
import { asin } from './methods/asin';
import { atan } from './methods/atan';
import { avg } from './methods/avg';
import { ceil } from './methods/ceil';
import { cos } from './methods/cos';
import { exp } from './methods/exp';
import { floor } from './methods/floor';
import { ln } from './methods/ln';
import { log } from './methods/log';
import { max } from './methods/max';
import { min } from './methods/min';
import { param } from './methods/param';
import { pow } from './methods/pow';
import { random } from './methods/random';
import { round } from './methods/round';
import { sin } from './methods/sin';
import { sqrt } from './methods/sqrt';
import { sum } from './methods/sum';
import { tan } from './methods/tan';
import { __eq } from './methods/__eq';

const methods = {
  abs,
  acos,
  asin,
  atan,
  avg,
  ceil,
  cos,
  exp,
  floor,
  ln,
  log,
  max,
  min,
  param,
  pow,
  random,
  round,
  sin,
  sqrt,
  sum,
  tan,
  __eq
};

export class PineMath {
  private _cache = {};
  constructor(private context: any) {
    // Install methods
    Object.entries(methods).forEach(([name, factory]) => {
      this[name] = factory(context);
    });
  }
}

export default PineMath;
