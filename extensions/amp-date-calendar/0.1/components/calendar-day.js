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
import {getPhrase} from '../phrases';
import {html as litHtml} from 'lit-html/lit-html';

/**
 * @typedef {{
 *  daySize: number,
 *  enableOutsideDays: boolean,
 *  isOutsideDay: function(!Date):boolean,
 *  formats: !../calendar-label-formats.CalendarLabelFormats,
 *  modifiers: !Object<string,function(!Date):boolean>,
 *  phrases: !../phrases.PhrasesDef,
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
    phrases,
    value,
  } = props;

  const {
    dateIsUnavailable,
    chooseAvailableDate,
  } = phrases;

  // const outsideAndDisabled = isOutsideDay(value);
  const outsideButEnableable = isOutsideDay(value) && !enableOutsideDays;
  const labels =
      outsideButEnableable ? [] : getModifiers(modifiers, value);
  if (isOutsideDay(value)) {
    labels.push('outside');
    if (!enableOutsideDays) {
      labels.push('outside-disabled');
    }
  }

  const blocked = modifiers[CalendarDayStates.BLOCKED_CALENDAR](value);
  const blockedOutOfRange =
      modifiers[CalendarDayStates.BLOCKED_OUT_OF_RANGE](value);
  const focused = modifiers[CalendarDayStates.FOCUSED](value);
  const formattedDay = formats.day(value);
  const formattedDate = formats.date(value);

  const ariaLabel = (blocked || blockedOutOfRange) ?
    getPhrase(dateIsUnavailable, {date: formattedDate}) :
    getPhrase(chooseAvailableDate, {date: formattedDate});

  const valueAttr = outsideButEnableable ? 0 : Number(value);
  const tabindex = focused && !outsideButEnableable ? '0' : '-1';
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
    >${outsideButEnableable ? '' : formattedDay}</button>
  </td>`;
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
