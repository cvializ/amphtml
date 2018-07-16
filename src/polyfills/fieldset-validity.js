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

/**
 * Submittable elements except for 'object' elements are candidates
 * for constraint validation.
 * https://www.w3.org/TR/html5/sec-forms.html#constraints-definitions
 * https://www.w3.org/TR/html5/sec-forms.html#barred-from-constraint-validation
 */
const SUBMITTABLE_ELEMENTS_SELECTOR = 'button,input,select,textarea';

/**
 * Returns false if any of the fieldset's child elements are invalid,
 * and returns false and triggers an 'invalid' event otherwise.
 * https://www.w3.org/TR/html5/sec-forms.html#dom-htmlinputelement-checkvalidity
 *
 * @return {boolean}
 * @this {HTMLFieldSetElement}
 */
function checkValidity() {
  const children = this./*OK*/querySelectorAll(SUBMITTABLE_ELEMENTS_SELECTOR);
  for (let i = 0, child; (child = children[i]) != null; i++) {
    if (!child.checkValidity()) {
      child.dispatchEvent(new CustomEvent('invalid'));
      return false;
    }
  }
  return true;
}

/**
 * Returns false if any of the fieldset's child elements are invalid,
 * and triggers an 'invalid' event otherwise. If the invalid event is canceled,
 * return true. If the invalid event is not canceled return false.
 * https://www.w3.org/TR/html5/sec-forms.html#dom-htmlinputelement-reportvalidity
 *
 * @return {boolean}
 * @this {HTMLFieldSetElement}
 */
function reportValidity() {
  const children = this./*OK*/querySelectorAll(SUBMITTABLE_ELEMENTS_SELECTOR);
  for (let i = 0, child; (child = children[i]) != null; i++) {
    if (!child.checkValidity()) {
      const defaultPrevented = child.dispatchEvent(new CustomEvent('invalid'));
      return defaultPrevented;
    }
  }
  return true;
}

/**
 * Sets the HTMLFieldSetElement.checkValidity polyfill if it returns
 * non-standard CSS Selectors 4 behavior.
 * @param {!Window} win
 */
export function install(win) {
  const fieldset = win.document.createElement('fieldset');
  const input = win.document.createElement('input');
  const incorrectValidBehavior = fieldset.checkValidity() == false;
  input.required = true;
  const incorrectInvalidBehavior = fieldset.checkValidity() == true;

  if (incorrectValidBehavior || incorrectInvalidBehavior) {
    win.Object.defineProperty(HTMLFieldSetElement.prototype, 'checkValidity', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: checkValidity,
    });
    win.Object.defineProperty(HTMLFieldSetElement.prototype, 'reportValidity', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: reportValidity,
    });
  }
}
