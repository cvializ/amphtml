/**
 * Copyright 2018 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  isAfter,
  isBefore,
  isBetween,
} from './date-utils';
import {map} from '../../../src/utils/object';


export class RenderedDatesCache {
  /**
   * Initialize the cache
   */
  constructor() {
    /** @private {!Object<string, !Promise<string,!Element>} */
    this.map_ = map();
  }

  /**
   *
   * @param {!Date} key
   * @param {!Promise<string|!Element>} value
   */
  put(key, value) {
    this.map_[this.cacheFn_(key)] = value;
  }

  /**
   * Get a string key from a Date object
   * @param {!Date} date
   * @return {string}
   */
  cacheFn_(date) {
    return String(Number(date));
  }

  /**
   * Get a value from the cache
   * @param {!Date} key
   */
  get(key) {
    return this.map_[this.cacheFn_(key)];
  }

  /**
   * Remove values that are not needed
   * @param {!Date=} opt_keepAfter
   * @param {!Date=} opt_keepBefore
   */
  clear(opt_keepAfter, opt_keepBefore) {
    if (!opt_keepAfter && !opt_keepBefore) {
      this.map_ = map();
      return;
    }

    const keys = Object.keys(this.map_);
    const newCache = map();

    let keepFunction;
    if (opt_keepAfter && !opt_keepBefore) {
      keepFunction = value => isAfter(value, opt_keepAfter);
    } else if (!opt_keepAfter && opt_keepBefore) {
      keepFunction = value => isBefore(value, opt_keepAfter);
    } else {
      keepFunction = value => isBetween(opt_keepAfter, opt_keepBefore, value);
    }

    keys.forEach(key => {
      const value = this.map_[key];
      if (keepFunction(value)) {
        newCache[key] = value;
      }
    });
  }
}
