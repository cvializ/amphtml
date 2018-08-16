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
 * distributed under the License is distributed on an "AS_IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Formats calendar labels for a given locale
 */
export class CalendarLabelFormats {
  /**
   * Construct the Intl formatters
   * @param {Array<string>} locales
   */
  constructor(locales) {
    /** @const */
    this.month_ = new Intl.DateTimeFormat(locales,
        {month: 'long', year: 'numeric'});

    /** @const */
    this.day_ = new Intl.DateTimeFormat(locales, {day: 'numeric'});

    /** @const */
    this.weekday_ = new Intl.DateTimeFormat(locales, {weekday: 'narrow'});

    /** @const */
    this.date_ = new Intl.DateTimeFormat(locales,
        {weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'});
  }

  /**
   * Convert a Date to a string representing its month in the format's locale.
   * Example: new Date(2018-01-01) -> "January"
   * @param {!Date} date
   * @return {string}
   */
  month(date) {
    return this.month_.format(date);
  }

  /**
   * Convert a Date to a string representing its day in the format's locale.
   * Example: new Date(2018-01-01) -> "1"
   * @param {!Date} date
   * @return {string}
   */
  day(date) {
    return this.day_.format(date);
  }

  /**
   * Convert a Date to a string representing its weekday in the given locale.
   * Example: new Date(2018-01-01) -> "T"
   * @param {!Date} date
   * @return {string}
   */
  weekday(date) {
    return this.weekday_.format(date);
  }

  /**
   * Convert a Date to a string representing its date in the given locale.
   * Example: new Date(2018-01-01) -> "Tuesday, January 1, 2018"
   * @param {!Date} date
   * @return {string}
   */
  date(date) {
    return this.date_.format(date);
  }
}
