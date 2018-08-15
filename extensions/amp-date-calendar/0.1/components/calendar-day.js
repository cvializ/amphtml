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

import {html as litHtml} from 'lit-html/lit-html';

/**
 * @typedef {{
 *   selected: boolean,
 *   value: !Date,
 *   label: string,
 *   isDayBlocked: function(!Date):boolean
 * }}
 */
let CalendarDayPropsDef;

/**
 *
 * @param {CalendarDayPropsDef} props
 * @return {!lit-html/lit-html/TemplateResult}
 */
export function render(props) {
  const {
    daySize,
    value,
    label,
    // modifiers,
    isDayBlocked,
    isOutsideDay,
  } = props;

  const modifiers = [];
  if (isDayBlocked(value)) {
    modifiers.push('blocked');
  }
  const valueAttr = Number(value);

  if (value) {
    return litHtml`
      <td
        style="width: ${daySize}px; height: ${daySize}px"
        class="x-day${modifiers.length ? ' ' + modifiers.join(' ') : ''}"
      >
        <button
          class="x-day-button"
          data-i-amphtml-date="${valueAttr}"
        >${isOutsideDay ? '' : label}</button>
      </td>`;
  } else {
    return litHtml`
    <td style="width: ${daySize}px; height: ${daySize}px">
      <button class="x-day-button"></button>
    </td>`;
  }
}
