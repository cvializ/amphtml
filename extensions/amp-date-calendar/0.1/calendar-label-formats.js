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
   * @param {string} locale
   */
  constructor(locale) {
    /** @const */
    const month = new Intl.DateTimeFormat(
        locale, {month: 'long', year: 'numeric'});
    this.month = month.format.bind(month);

    /** @const */
    const day = new Intl.DateTimeFormat(locale, {day: 'numeric'});
    this.day = day.format.bind(day);

    /** @const */
    const weekday = new Intl.DateTimeFormat(locale, {weekday: 'narrow'});
    this.weekday = weekday.format.bind(weekday);
  }
}
