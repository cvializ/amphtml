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

import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getFirstWeekday,
  getWeekdayName,
} from '../date-utils';

import {html as litHtml} from 'lit-html/lit-html';
import {render as renderCalendarDay} from './calendar-day';

const DAY_MILLISECONDS = 86400000;

const DEFAULT_BORDER_SPACING = 2;

/**
 * @typedef {{
 *  daySize: number,
 *  month: !Date,
 *  selectedDate: !Date,
 *  formats: ../calendar-label-formats.CalendarLabelFormats
 *  firstDayOfWeek: number,
 *  isRtl: boolean,
 *  isDayBlocked: function(!Date):boolean
 * }}
 */
let CalendarMonthPropsDef;

/**
 * Render a month
 * @param {!CalendarMonthPropsDef} props
 * @return {!lit-html/lit-html/TemplateResult}
 */
export function render(props) {

  const {
    daySize,
    month,
    selectedDate,
    formats,
    firstDayOfWeek,
    isDayBlocked,
    // isRtl,
  } = props;

  const title = formats.month(month);

  const weekdays = [];
  for (let i = 0; i < 7; i++) {
    // TODO(cvializ): Remove isRtl if I render the weekdays inside the table
    const name = getWeekdayName(i, formats.weekday, firstDayOfWeek/*, isRtl*/);
    weekdays.push(litHtml`<th>${name}</th>`);
  }

  const cells =
      generateCalendarCells(month, formats, firstDayOfWeek, selectedDate);
  const c = () => {
    const {value, label, isOutsideDay} = cells();
    return renderCalendarDay({
      daySize,
      value,
      label,
      isDayBlocked,
      isOutsideDay,
    });
  };
  const calendarWidth = getCalendarWidth(daySize, DEFAULT_BORDER_SPACING);

  const calendarHtml = litHtml`
  <div class="x-calendar-month" style="width: ${calendarWidth}px">
    <div class="x-calendar-month-title">${title}</div>
    <table>
      <tr class="weekdays">${weekdays}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
    </table>
  </div>
  `;

  return calendarHtml;
}

/**
 *
 * @param {!Date} date
 * @param {CalendarLabelFormats} formats
 * @param {number} firstDayOfWeek
 * @return {function()}
 */
function generateCalendarCells(date, formats, firstDayOfWeek) {
  const millis = Number(getFirstDayOfMonth(date));
  const firstWeekday = getFirstWeekday(date, firstDayOfWeek);
  const daysInMonth = getDaysInMonth(date);

  const cells = [];
  let days = 0;
  for (let week = 0; week < 6; week++) {
    for (let weekday = 0; weekday < 7; weekday++) {
      const isOutsideDay = (
        (week == 0 && weekday < firstWeekday) ||
         days >= daysInMonth
      );

      const value = isOutsideDay ?
        new Date(millis + DAY_MILLISECONDS * weekday) :
        new Date(millis + DAY_MILLISECONDS * days++);
      const label = isOutsideDay ? '' : formats.day(value);
      cells.push({value, label, isOutsideDay});
    }
  }

  let cellIndex = 0;
  return () => cells[cellIndex++];
}

/**
 *
 * @param {number} daySize
 * @param {number} borderSpacing
 * @return {number}
 */
function getCalendarWidth(daySize, borderSpacing) {
  return (borderSpacing + daySize) * 7 + borderSpacing;
}
