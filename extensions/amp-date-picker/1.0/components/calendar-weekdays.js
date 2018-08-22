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

import {getWeekdayName} from '../date-utils';
import {html as litHtml} from 'lit-html/lit-html';
import {px} from '../../../../src/style';

/**
 * @typedef {{
 *  daySize: ?number,
 *  enableOutsideDays: boolean,
 *  isOutsideDay: function(!Date):boolean,
 *  formats: !../label-formats.LabelFormats,
 *  modifiers: !Object<string,function(!Date):boolean>,
 *  phrases: !../phrases.PhrasesDef,
 *  value: !Date,
 *  renderDay: ?function(!Date):Promise
 * }}
 */
let CalendarWeekdaysPropsDef;

/**
 *
 * @param {CalendarWeekdaysPropsDef} props
 * @return {!Array<!lit-html/lit-html.TemplateResult>}
 */
export function render(props) {
  const {
    daySize,
    firstDayOfWeek,
    formats,
    isRtl,
  } = props;

  const width = daySize != null ? `width: ${px(daySize)}` : '';

  const weekdays = [];
  for (let i = 0; i < 7; i++) {
    const formatWeekday = formats.weekday.bind(formats);
    const name = getWeekdayName(i, formatWeekday, firstDayOfWeek, isRtl);
    weekdays.push(litHtml`
    <span
      style="${width}"
      class="i-amphtml-date-calendar-weekday"
    ><small>${name}</small></span>
    `);
  }

  return weekdays;
}
