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

import {calendarLabel} from '../phrases';
import {
  getMonth,
  getNextMonth,
} from '../date-utils';
import {html as litHtml} from 'lit-html/lit-html';
import {render as renderCalendarMonth} from './calendar-month';

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
    numberOfMonths,
  } = props;

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
    }));
    month = getNextMonth(month);
  }

  return litHtml`
  <div class="x-container" aria-label=${calendarLabel} role="application">
    <div class="stationary">
      <div class="navigation">
        <button class="next">Next</button>
        <button class="previous">Prev</button>
      </div>
      <div class="header">
        ⚡️
      </div>
    </div>
    <div class="picker">
      ${months}
    </div>
  </div>
  `;
}
