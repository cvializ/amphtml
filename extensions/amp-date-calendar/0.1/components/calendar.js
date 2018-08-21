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
 *  formats: !../calendar-label-formats.CalendarLabelFormats,
 *  isRtl: boolean,
 *  modifiers: !Object<string,function(!Date):boolean>,
 *  numberOfMonths: number,
 *  phrases: !../phrases.PhrasesDef,
 * }}
 */
let CalendarPropsDef;

const DEFAULT_CALENDAR_PADDING = 8;

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
    numberOfMonths,
    phrases,
  } = props;

  const jumpToPreviousMonth = phrases[Phrases.JUMP_TO_PREV_MONTH];
  const jumpToNextMonth = phrases[Phrases.JUMP_TO_NEXT_MONTH];
  const rightLabel = isRtl ? jumpToPreviousMonth : jumpToNextMonth;
  const leftLabel = isRtl ? jumpToNextMonth : jumpToPreviousMonth;

  const months = [];
  let month = getMonth(displayedDate);
  for (let i = 0; i < numberOfMonths; i++) {
    months.push(renderCalendarMonth({
      daySize,
      enableOutsideDays,
      firstDayOfWeek,
      formats,
      isRtl,
      modifiers,
      month,
      phrases,
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

  const monthWidth = getMonthWidth(daySize);
  const calendarWidth = monthWidth * numberOfMonths +
      DEFAULT_CALENDAR_PADDING * 2;

  return litHtml`
  <div
    class="i-amphtml-date-calendar-container"
    aria-label=${calendarLabel}
    role="application"
  >
    <div class="i-amphtml-date-calendar-stationary">
      <div class="i-amphtml-date-calendar-header">${header}</div>
    </div>
    <div class="i-amphtml-date-calendar-months">${months}</div>
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
