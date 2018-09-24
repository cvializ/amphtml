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
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {dict} from '../../../../src/utils/object';

/**
 * Create the data needed to render a day template
 * @param {!Date} date
 * @param {!../label-formats.DateLabelFormats} formats
 * @param {!Array<!Date>} highlighted
 * @param {!Array<!Date>} blocked
 * @return {!JsonObject}
 * @private
 */
export function getDayTemplateData(date, formats, highlighted, blocked) {
  const templateData = dict();
  templateData['X'] = Number(date);
  templateData['x'] = Number(date) * 1000;
  templateData['D'] = formats.day(date);
  templateData['DD'] = formats.dayTwoDigit(date);
  templateData['isHighlighted'] = highlighted.includes(date);
  templateData['isBlocked'] = blocked.includes(date);
  return templateData;
}
