/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
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

import {rrulestr} from '../../../third_party/rrule/rrule';


/** @enum */
export const DateType = {
  INVALID: 'invalid',
  RRULE: 'rrule',
  DATE: 'date',
};

/**
 * A class which wraps a list of moment or RRULE dates.
 */
export class DatesList {
  /**
   * @param {!Object} ReactDates
   * @param {!moment} moment
   * @param {!Array<string>} dates
   */
  constructor(ReactDates, moment, dates) {
    /** @private @const */
    this.ReactDates_ = ReactDates;

    /** @private @const */
    this.moment_ = moment;

    /** @private @const */
    this.rrulestrs_ = dates
        .filter(d => this.getDateType_(d) === DateType.RRULE)
        .map(d => tryParseRrulestr(d));

    /** @private @const */
    this.dates_ = dates
        .filter(d => this.getDateType_(d) == DateType.DATE)
        .map(d => this.moment_(d));
  }

  /**
   * Determines if the given date is contained within the RRULEs or moment
   * dates contained in the date list.
   * @param {!moment|string} date
   * @return {boolean}
   */
  contains(date) {
    return this.matchesDate_(date) || this.matchesRrule_(date);
  }

  /**
   * Determines if any internal moment object matches the given date.
   * @param {!moment|string} date
   * @return {boolean}
   * @private
   */
  matchesDate_(date) {
    return this.dates_.some(d => this.ReactDates_.isSameDay(d, date));
  }

  /**
   * Determines if any internal RRULE object matches the given date.
   * @param {!moment|string} date
   * @return {boolean}
   * @private
   */
  matchesRrule_(date) {
    return this.rrulestrs_.some(rrule => {
      const nextDate = date.clone().startOf('day').add(1, 'day').toDate();
      const rruleDay = this.moment_(rrule.before(nextDate));
      return this.ReactDates_.isSameDay(rruleDay, date);
    });
  }

  /**
   * Distinguish between RRULE dates and moment dates.
   * @param {!moment|string} date
   * @return {!DateType}
   * @private
   */
  getDateType_(date) {
    if (this.moment_(date).isValid()) {
      return DateType.DATE;
    } else if (tryParseRrulestr(date)) {
      return DateType.RRULE;
    }

    return DateType.INVALID;
  }
}

/**
 * Tries to parse a string into an RRULE object.
 * @param {string} str A string which represents a repeating date RRULE spec.
 * @return {?Object}
 */
function tryParseRrulestr(str) {
  try {
    return rrulestr(str);
  } catch (e) {
    return null;
  }
}
