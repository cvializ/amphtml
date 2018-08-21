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
  addToDate,
  getDaysInMonth,
  getFirstDayOfMonth,
  getFirstWeekday,
} from '../date-utils';

import {html as litHtml} from 'lit-html/lit-html';
import {render as renderCalendarDay} from './calendar-day';

const DEFAULT_BORDER_SPACING = 0;

/**
 * @typedef {{
 *  daySize: number,
 *  enableOutsideDays: boolean,
 *  firstDayOfWeek: number,
 *  formats: !../calendar-label-formats.CalendarLabelFormats,
 *  isRtl: boolean,
 *  modifiers: !Object<string,function(!Date):boolean>,
 *  month: !Date,
 *  monthTranslate: number,
 *  phrases: !../phrases.PhrasesDef,
 *  renderDay: ?function(!Date):Promise
 * }}
 */
let CalendarMonthPropsDef;

/**
 * Render a month
 * @param {!CalendarMonthPropsDef} props
 * @return {!lit-html/lit-html.TemplateResult}
 */
export function render(props) {

  const {
    daySize,
    enableOutsideDays,
    firstDayOfWeek,
    formats,
    modifiers,
    month,
    monthTranslate,
    phrases,
    renderDay,
  } = props;

  const title = formats.month(month);

  const cells =
      generateCalendarCells(month, firstDayOfWeek);
  const c = () => {
    const {value, outsideDay} = cells();
    const isOutsideDay = unusedDate => outsideDay;
    return renderCalendarDay({
      daySize,
      enableOutsideDays,
      formats,
      isOutsideDay,
      modifiers,
      phrases,
      renderDay,
      value,
    });
  };
  const calendarWidth = getMonthWidth(daySize, DEFAULT_BORDER_SPACING);

  const translate = -100 - monthTranslate;

  // https://www.w3.org/TR/2018/WD-wai-aria-practices-1.2-20180719/#grid
  const calendarHtml = litHtml`
  <div
    class="i-amphtml-date-calendar-month"
    style="
      width: ${calendarWidth}px;
      transform: translate(${translate}%);
    "
  >
    <div class="i-amphtml-date-calendar-month-title">${title}</div>
    <table role="grid">
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
 * @typedef {{
 *  value: !Date,
 *  outsideDay: boolean
 * }}
 */
let CalendarCellDef;

/**
 *
 * @param {!Date} date
 * @param {number} firstDayOfWeek
 * @return {function():!CalendarCellDef}
 */
function generateCalendarCells(date, firstDayOfWeek) {
  const firstDayOfMonth = getFirstDayOfMonth(date);
  const firstWeekday = getFirstWeekday(date, firstDayOfWeek);
  const daysInMonth = getDaysInMonth(date);

  const cells = [];
  let days = -firstWeekday;
  for (let week = 0; week < 6; week++) {
    for (let weekday = 0; weekday < 7; weekday++) {
      const outsideDay = (
        (week == 0 && weekday < firstWeekday) ||
         days >= daysInMonth
      );

      const value = addToDate(firstDayOfMonth, 0, 0, days++);
      cells.push({value, outsideDay});
    }
  }

  let cellIndex = 0;
  return () => cells[cellIndex++];
}

/**
 *
 * @param {number} daySize
 * @param {number=} opt_borderSpacing
 * @return {number}
 */
export function getMonthWidth(
  daySize, opt_borderSpacing = DEFAULT_BORDER_SPACING) {
  return (opt_borderSpacing + daySize) * 7 + opt_borderSpacing;
}
