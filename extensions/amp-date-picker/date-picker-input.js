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

import {DateFieldNameByType} from './date-picker-type';
import {DatePickerMode} from './date-picker-mode';
import {user} from '../../src/log';

/**
 * Get the existing input, or create and append a hidden input for the
 * date field.
 * @param {!AmpDoc} ampdoc Ampdoc to search for inputs
 * @param {!Element} element
 * @param {!DatePickerMode} mode
 * @param {!DatePickerType} type The selector for the input field
 * @return {?Element}
 */
export function setupDateField(ampdoc, element, mode, type) {
  const fieldSelector = element.getAttribute(`${type}-selector`);
  const existingField = ampdoc.getRootNode().querySelector(
      fieldSelector);
  if (existingField) {
    return existingField;
  }

  const form = element.closest('form');
  if (mode.mode_ == DatePickerMode.STATIC && form) {
    const hiddenInput = element.ownerDocument.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = getHiddenInputId(element, form, type);
    element.appendChild(hiddenInput);
    return hiddenInput;
  }

  return null;
}

/**
 * Generate a name for a hidden input.
 * Date pickers not in a form don't need named hidden inputs.
 * @param {!Element} element
 * @param {!Element} form
 * @param {!DateFieldType} type
 * @return {string}
 * @private
 */
function getHiddenInputId(element, form, type) {
  const {id} = element;
  const name = DateFieldNameByType[type];
  if (!form) {
    return '';
  }

  if (!form.elements[name]) {
    return name;
  }

  const alternativeName = `${id}-${name}`;
  if (id && !form.elements[alternativeName]) {
    return alternativeName;
  }

  user().error('amp-date-picker', `Multiple date-pickers with implicit ${name} fields ` +
      'need to have IDs');
  return '';
}
