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
 * Get the given date's month. Specifically the first day in local time.
 * @param {!Date} date
 * @return {!Date}
 */
export function getMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

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
 * Get the weekday name of the current month.
 * @param {number} index
 * @param {function(!Date):string} format
 * @param {number} firstDayOfWeek
 * @param {boolean=} opt_isRtl Only needed if rendering outside of a table
 * @return {string}
 */
export function getWeekdayName(index, format, firstDayOfWeek, opt_isRtl) {
  index = opt_isRtl ? -index : index;
  const date = new Date(1970, 0, 4 + index + firstDayOfWeek);
  return format(date);
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
 * @return {!Date}
 */
export function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/**
 * Get the last day of the month
 * @param {!Date} date
 * @return {!Date}
 */
export function getLastDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, -1);
}

/**
 * Check if a date is between two dates, exclusive
 * @param {!Date} a
 * @param {!Date} b
 * @param {!Date} test
 * @return {boolean}
 */
export function isBetween(a, b, test) {
  return test > a && test < b;
}

/**
 * Check if a date is between two dates, inclusive
 * @param {!Date} a
 * @param {!Date} b
 * @param {!Date} test
 * @return {boolean}
 */
export function isBetweenInclusive(a, b, test) {
  return test >= a && test <= b;
}

/**
 * Check if two dates are on the same day.
 * @param {!Date} a
 * @param {!Date} b
 * @return {boolean}
 */
export function isSameDay(a, b) {
  return Number(getDay(a)) == Number(getDay(b));
}

/**
 * Gets the day at midnight local time
 * @param {!Date} date
 * @return {!Date}
 */
export function getDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * @param {string} input
 * @return {!Date}
 */
export function parseIsoDateToLocal(input) {
  const date = new Date(input);
  const offset = date.getTimezoneOffset();
  return new Date(
      date.getFullYear(), date.getMonth(), date.getDate(),
      date.getHours(), date.getMinutes() + offset);
}

/**
 * True if a is after b
 * @param {!Date} a
 * @param {!Date} b
 * @return {boolean}
 */
export function isAfter(a, b) {
  return getDay(a) > getDay(b);
}

/**
 * True if a is inclusively after b
 * @param {!Date} a
 * @param {!Date} b
 * @return {boolean}
 */
export function isAfterInclusive(a, b) {
  return getDay(a) >= getDay(b);
}

/**
 * Adds the following calendar indices to the given date.
 * NOTE: This does not account for varying lengths of months, years etc, e.g.
 * @param {!Date} date
 * @param {number} opt_years
 * @param {number} opt_months
 * @param {number} opt_days
 * @param {number} opt_hours
 * @param {number} opt_minutes
 * @param {number} opt_seconds
 * @return {!Date}
 */
export function addToDate(date,
  opt_years = 0, opt_months = 0, opt_days = 0,
  opt_hours = 0, opt_minutes = 0, opt_seconds = 0) {
  return new Date(
      date.getFullYear() + opt_years,
      date.getMonth() + opt_months,
      date.getDate() + opt_days,
      date.getHours() + opt_hours,
      date.getMinutes() + opt_minutes,
      date.getSeconds() + opt_seconds);
}
