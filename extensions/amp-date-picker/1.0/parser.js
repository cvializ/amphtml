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

import {Services} from '../../../src/services';
import {parseIsoDateToLocal} from './date-utils';

export class Parser {
  /**
   *
   * @param {!Element} element
   */
  constructor(element) {
    this.element = element;

    this.parserPromise_ = Services.ampDateParserForDocOrNull(this.element);
  }

  /**
   * Parse the date using the moment parser if available. Otherwise use
   * the default Javascript date parser.
   * @return {function(string):!Date}
   */
  getParser_() {
    return this.parserPromise_.then(ampDateParser => {
      if (ampDateParser == null) {
        return string => parseIsoDateToLocal(string);
      } else {
        return (string, opt_locale) =>
          ampDateParser.moment(string, 'L', opt_locale).toDate();
      }
    });
  }

  /**
   * @param {string} string
   * @param {string=} opt_locale
   * @return {!Promise<?Date>}
   */
  parse(string, opt_locale) {
    return this.getParser_().then(parser => parser(string));
  }
}
