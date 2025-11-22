// SPDX-License-Identifier: AGPL-3.0-only
// This file is auto-generated. Do not edit manually.
// Run: npm run generate:ta-index

import { tr } from './getters/tr';

import { atr } from './methods/atr';
import { change } from './methods/change';
import { crossover } from './methods/crossover';
import { crossunder } from './methods/crossunder';
import { dev } from './methods/dev';
import { ema } from './methods/ema';
import { highest } from './methods/highest';
import { hma } from './methods/hma';
import { linreg } from './methods/linreg';
import { lowest } from './methods/lowest';
import { median } from './methods/median';
import { mom } from './methods/mom';
import { param } from './methods/param';
import { pivothigh } from './methods/pivothigh';
import { pivotlow } from './methods/pivotlow';
import { rma } from './methods/rma';
import { roc } from './methods/roc';
import { rsi } from './methods/rsi';
import { sma } from './methods/sma';
import { stdev } from './methods/stdev';
import { supertrend } from './methods/supertrend';
import { variance } from './methods/variance';
import { vwma } from './methods/vwma';
import { wma } from './methods/wma';

const getters = {
  tr
};

const methods = {
  atr,
  change,
  crossover,
  crossunder,
  dev,
  ema,
  highest,
  hma,
  linreg,
  lowest,
  median,
  mom,
  param,
  pivothigh,
  pivotlow,
  rma,
  roc,
  rsi,
  sma,
  stdev,
  supertrend,
  variance,
  vwma,
  wma
};

export class TechnicalAnalysis {
  constructor(private context: any) {
    // Install getters
    Object.entries(getters).forEach(([name, factory]) => {
      Object.defineProperty(this, name, {
        get: factory(context),
        enumerable: true
      });
    });
    
    // Install methods
    Object.entries(methods).forEach(([name, factory]) => {
      this[name] = factory(context);
    });
  }
}

export default TechnicalAnalysis;
