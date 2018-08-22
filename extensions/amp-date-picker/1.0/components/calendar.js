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
} from '../date-utils';
import {
  getMonthWidth,
  render as renderMonth,
} from './month';
import {html as litHtml} from 'lit-html/lit-html';
import {px} from '../../../../src/style';
import {render as renderWeekdays} from './weekdays';

/**
 * @typedef {{
 *  daySize: number,
 *  displayedDate: !Date,
 *  enableOutsideDays: boolean,
 *  firstDayOfWeek: number,
 *  formats: !../label-formats.LabelFormats,
 *  fullscreen: boolean,
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
    fullscreen,
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
  let month = fullscreen ?
    displayedDate :
    getMonth(addToDate(displayedDate, 0, 0, -1));
  const end = fullscreen ? numberOfMonths : numberOfMonths + 2;
  for (let i = 0; i < end; i++) {
    months.push(renderMonth({
      daySize,
      enableOutsideDays,
      firstDayOfWeek,
      formats,
      fullscreen,
      isRtl,
      modifiers,
      month,
      monthTranslate,
      phrases,
      renderDay,
    }));
    month = getNextMonth(month);
  }

  const weekdays = renderWeekdays({
    daySize,
    firstDayOfWeek,
    formats,
    isRtl,
  });

  let header = '';
  if (!fullscreen) {
    const headerWeekdays = [];
    for (let i = 0; i < numberOfMonths; i++) {
      headerWeekdays.push(litHtml`
      <div class="i-amphtml-date-calendar-weekdays">${weekdays}</div>
      `);
    }
    header = litHtml`
    <div class="i-amphtml-date-calendar-header">${headerWeekdays}</div>
    `;
  }

  const monthWidth = getMonthWidth(daySize) + 13 * 2;
  const calendarWidth = fullscreen ? 'auto' : monthWidth * numberOfMonths;
  const boundaryWidth = fullscreen ? 'auto' : px(2000 + calendarWidth);

  return litHtml`
  <div
    class="i-amphtml-date-calendar-container"
    aria-label=${calendarLabel}
    role="application"
    style="width: ${px(calendarWidth)}"
  >
    <div class="i-amphtml-date-calendar-stationary">${header}</div>
    <div class="i-amphtml-date-calendar-transition">
      <div
        class="i-amphtml-date-calendar-months"
        style="width: ${boundaryWidth}"
      >${months}</div>
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
