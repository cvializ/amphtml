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
  Phrases,
  calendarLabel,
} from '../phrases';
import {
  addToDate,
  getMonth,
  getNextMonth,
  getWeekdayName,
} from '../date-utils';
import {
  getMonthWidth,
  render as renderCalendarMonth,
} from './calendar-month';
import {html as litHtml} from 'lit-html/lit-html';

/**
 * @typedef {{
 *  daySize: number,
 *  displayedDate: !Date,
 *  enableOutsideDays: boolean,
 *  firstDayOfWeek: number,
 *  formats: !../label-formats.LabelFormats,
 *  isRtl: boolean,
 *  modifiers: !Object<string,function(!Date):boolean>,
 *  monthTranslate: number,
 *  numberOfMonths: number,
 *  phrases: !../phrases.PhrasesDef,
 *  renderDay: ?function(!Date):Promise
 * }}
 */
let CalendarPropsDef;

/**
 *
 * @param {CalendarPropsDef} props
 * @return {!lit-html/lit-html.TemplateResult}
 */
export function render(props) {
  const {
    daySize,
    displayedDate,
    enableOutsideDays,
    firstDayOfWeek,
    formats,
    isRtl,
    modifiers,
    monthTranslate,
    numberOfMonths,
    phrases,
    renderDay,
  } = props;

  const jumpToPreviousMonth = phrases[Phrases.JUMP_TO_PREV_MONTH];
  const jumpToNextMonth = phrases[Phrases.JUMP_TO_NEXT_MONTH];
  const rightLabel = isRtl ? jumpToPreviousMonth : jumpToNextMonth;
  const leftLabel = isRtl ? jumpToNextMonth : jumpToPreviousMonth;

  const months = [];
  let month = getMonth(addToDate(displayedDate, 0, 0, -1));
  for (let i = -1; i < numberOfMonths + 1; i++) {
    months.push(renderCalendarMonth({
      daySize,
      enableOutsideDays,
      firstDayOfWeek,
      formats,
      isRtl,
      modifiers,
      month,
      monthTranslate,
      phrases,
      renderDay,
    }));
    month = getNextMonth(month);
  }

  const weekdays = [];
  for (let i = 0; i < 7; i++) {
    const formatWeekday = formats.weekday.bind(formats);
    const name = getWeekdayName(i, formatWeekday, firstDayOfWeek, isRtl);
    weekdays.push(litHtml`
    <span
      style="width: ${daySize}px"
      class="i-amphtml-date-calendar-weekday"
    ><small>${name}</small></span>
    `);
  }

  const header = [];
  for (let i = 0; i < numberOfMonths; i++) {
    header.push(litHtml`
    <div class="i-amphtml-date-calendar-weekdays">${weekdays}</div>
    `);
  }

  const monthWidth = getMonthWidth(daySize) + 13 * 2;
  const calendarWidth = monthWidth * numberOfMonths;

  return litHtml`
  <div
    class="i-amphtml-date-calendar-container"
    aria-label=${calendarLabel}
    role="application"
    style="width: ${calendarWidth}px"
  >
    <div class="i-amphtml-date-calendar-stationary">
      <div class="i-amphtml-date-calendar-header">${header}</div>
    </div>
    <div class="i-amphtml-date-calendar-transition">
      <div class="i-amphtml-date-calendar-months">${months}</div>
    </div>
    <div class="i-amphtml-date-calendar-navigation">
      <button
        class="i-amphtml-date-calendar-right"
        aria-label=${rightLabel}
      ></button>
      <button
        class="i-amphtml-date-calendar-left"
        aria-label=${leftLabel}
      ></button>
    </div>
  </div>
  `;
}
