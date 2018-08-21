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
  Phrases,
  getPhrase,
} from '../phrases';
import {html as litHtml} from 'lit-html/lit-html';
import {until} from 'lit-html/lib/until';

/**
 * @typedef {{
 *  daySize: number,
 *  enableOutsideDays: boolean,
 *  isOutsideDay: function(!Date):boolean,
 *  formats: !../calendar-label-formats.CalendarLabelFormats,
 *  modifiers: !Object<string,function(!Date):boolean>,
 *  phrases: !../phrases.PhrasesDef,
 *  value: !Date,
 *  renderDay: ?function(!Date):Promise
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
    renderDay,
    value,
  } = props;

  const dateIsUnavailable = phrases[Phrases.DATE_IS_UNAVAILABLE];
  const chooseAvailableDate = phrases[Phrases.CHOOSE_AVAILABLE_DATE];

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
  const blockedMinimumNights =
      modifiers[CalendarDayStates.BLOCKED_MINIMUM_NIGHTS](value);
  const blockedOutOfRange =
      modifiers[CalendarDayStates.BLOCKED_OUT_OF_RANGE](value);
  const focused = modifiers[CalendarDayStates.FOCUSED](value);
  const formattedDate = formats.day(value);
  const formattedFullDate = formats.date(value);

  const classAttr = ['i-amphtml-date-calendar-day'].concat(labels).join(' ');
  const ariaLabel = (blocked || blockedMinimumNights || blockedOutOfRange) ?
    getPhrase(dateIsUnavailable, {date: formattedFullDate}) :
    getPhrase(chooseAvailableDate, {date: formattedFullDate});
  const valueAttr = outsideButEnableable ? 0 : Number(value);
  const tabindex = focused && !outsideButEnableable ? '0' : '-1';

  const cellText = outsideButEnableable ? '' : formattedDate;
  const renderedText = renderDay ?
    renderDay(value, cellText) :
    Promise.resolve(cellText);
  return litHtml`
  <td
    style="width: ${daySize}px; height: ${daySize - 1}px"
    class="${classAttr}"
    role="button"
    tabindex="${tabindex}"
    aria-label="${ariaLabel}"
    data-i-amphtml-date="${valueAttr}"
  >
    <div class="i-amphtml-date-calendar-cell">
      ${until(renderedText, cellText)}
    </div>
  </td>`;
  // TODO(cvializ): renderDay
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
