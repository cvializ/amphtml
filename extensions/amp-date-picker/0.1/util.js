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

/**
 * Get the next month
 * @param {!Date} date
 * @return {!Date}
 */
export function getNextMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Get the previous month
 * @param {!Date} date
 * @return {!Date}
 */
export function getPreviousMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, date.getDate());
}

/**
 * Get the weekday name of the current month
 * @param {number} index
 * @param {string} locale
 * @param {number} firstDayOfWeek
 * @param {boolean} isRtl
 * @return {string}
 */
export function getWeekdayName(index, locale, firstDayOfWeek, isRtl) {
  index = isRtl ? -index : index;
  const date = new Date(1970, 0, 4 + index + firstDayOfWeek);
  return date.toLocaleString(locale, {weekday: 'narrow'});
}

/**
 * Get the number of days in the given date's month
 * @param {!Date} date
 * @return {number}
 */
export function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return new Date(year, month, 0).getDate();
}

/**
 * Get the first weekday of the month. 0-indexed for Sunday
 * @param {!Date} date
 * @param {number} firstDayOfWeek
 * @return {number}
 */
export function getFirstWeekday(date, firstDayOfWeek) {
  const weekdayIndex = getFirstDayOfMonth(date).getDay();
  return (weekdayIndex - firstDayOfWeek + 7) % 7;
}

/**
 * Gets the first day of the month.
 * @param {!Date} date
 */
export function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Check if a date is between two dates
 * @param {!Date} a
 * @param {!Date} b
 * @param {!Date} test
 * @return {boolean}
 */
export function isBetween(a, b, test) {
  const testMilliseconds = Number(test);
  return testMilliseconds >= Number(a) && testMilliseconds <= Number(b);
}
