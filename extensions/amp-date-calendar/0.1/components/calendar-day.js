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

import {CalendarDayStates} from '../calendar-day-states';
import {
  chooseAvailableStartDate,
  getPhrase,
  dateIsUnavailable
} from '../phrases';
import {html as litHtml} from 'lit-html/lit-html';

/**
 * @typedef {{
 *  daySize: number,
 *  enableOutsideDays: boolean,
 *  isOutsideDay: function(!Date):boolean,
 *  formats: !../calendar-label-formats.CalendarLabelFormats,
 *  modifiers: !Object<string,function(!Date):boolean>,
 *  value: !Date
 * }}
 */
let CalendarDayPropsDef;

/**
 *
 * @param {CalendarDayPropsDef} props
 * @return {!lit-html/lit-html.TemplateResult}
 */
export function render(props) {
  const {
    daySize,
    enableOutsideDays,
    formats,
    isOutsideDay,
    modifiers,
    value,
  } = props;

  const outside = isOutsideDay(value) && !enableOutsideDays;
  const labels =
      outside ? [] : getModifiers(modifiers, value);
  if (isOutsideDay(value)) {
    labels.push('outside');
    if (!enableOutsideDays) {
      labels.push('outside-disabled');
    }
  }

  const blocked = modifiers[CalendarDayStates.BLOCKED_CALENDAR](value);
  const formattedDay = formats.day(value);
  const formattedDate = formats.date(value);

  const ariaLabel = blocked ?
    getPhrase(dateIsUnavailable, {date: formattedDate}) :
    getPhrase(chooseAvailableStartDate, {date: formattedDate});

  const valueAttr = outside ? 0 : Number(value);
  const tabindex = getTabindex(blocked, outside);
  return litHtml`
  <td
    style="width: ${daySize}px; height: ${daySize}px"
    class="x-day${labels.length ? ' ' + labels.join(' ') : ''}"
  >
    <button
      aria-label="${ariaLabel}"
      tabindex="${tabindex}"
      class="x-day-button"
      data-i-amphtml-date="${valueAttr}"
    >${outside ? '' : formattedDay}</button>
  </td>`;
}

/**
 * @param {boolean} blocked
 * @param {boolean} outside
 * @return {string}
 */
function getTabindex(blocked, outside) {
  return blocked || outside ? '-1' : '0';
}

/**
 * @param {!Object<string,function(!Date):boolean>} modifiers
 * @param {!Date} value
 * @return {!Array<string>}
 */
function getModifiers(modifiers, value) {
  const labels = [];

  Object.keys(modifiers).forEach(key => {
    if (modifiers[key](value)) {
      labels.push(key);
    }
  });

  return labels;
}
