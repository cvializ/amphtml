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

import {Deferred} from '../../../src/utils/promise';
import {
  addToDate,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getNextMonth,
  getPreviousMonth,
} from './date-utils';
import {dev} from '../../../src/log';
import {listen} from '../../../src/event-helper';
import {render} from 'lit-html/lit-html';
import {render as renderCalendar} from './components/calendar';
/** @enum {string} */
export const ActiveDateState = {
  DATE: 'date',
  START_DATE: 'start-date',
  END_DATE: 'end-date',
  NONE: 'none',
};

/**
 * @typedef {{
 *  daySize: number,
 *  displayedDate: !Date,
 *  enableOutsideDays: boolean,
 *  firstDayOfWeek: number,
 *  focusedDate: !Date,
 *  formats: !./calendar-label-formats.CalendarLabelFormats,
 *  isRtl: boolean,
 *  modifiers: !Object<string,function(!Date):boolean>,
 *  numberOfMonths: number,
 *  onDisplayedDateChange: function(!Date):undefined,
 *  onGridFocusCaptureChange: function(boolean):undefined,
 *  onGridFocusChange: function(!Date):undefined,
 *  onHoverChange: function(?Date):undefined,
 *  onKeyboardNavigate: function(!Date):undefined,
 *  onSelectDate: function(?Date):undefined,
 *  phrases: !./phrases.PhrasesDef
 * }}
 */
let LitCalendarPropsDef;

/**
 * A calendar class that renders and triggers listeners on keyboard navigation.
 * This class does not change its own state. The owner class will set the props
 * in response to the provided listeners.
 */
export class LitCalendar {
  /**
   * Create a new calendar. Handles event listeners and rendering.
   * @param {!Element} element A container element
   */
  constructor(element) {
    this.element = element;

    this.win = element.ownerDocument.defaultView;

    /** @private {?LitCalendarPropsDef} */
    this.props_ = null;
  }

  /**
   * Listen
   */
  listen() {
    listen(this.element, 'click', e => {
      const {target} = e;
      const {
        displayedDate,
        isRtl,
        onDisplayedDateChange,
        onSelectDate,
      } = this.getProps_();

      const dateString = target.dataset['iAmphtmlDate'];
      if (dateString) {
        onSelectDate(new Date(Number(dateString)));
        return;
      }

      if (target.classList.contains('i-amphtml-date-calendar-right')) {
        const month = isRtl ?
          getPreviousMonth(displayedDate) :
          getNextMonth(displayedDate);
        onDisplayedDateChange(month);
        return;
      }

      if (target.classList.contains('i-amphtml-date-calendar-left')) {
        const month = isRtl ?
          getNextMonth(displayedDate) :
          getPreviousMonth(displayedDate);
        onDisplayedDateChange(month);
        return;
      }
    });

    listen(this.element, 'mouseover', e => {
      const target = dev().assertElement(e.target);
      const {onHoverChange} = this.getProps_();

      const dateString = target.dataset['iAmphtmlDate'];
      if (dateString) {
        onHoverChange(new Date(Number(dateString)));
      }
    });

    listen(this.element, 'mouseout', () => {
      const {onHoverChange} = this.getProps_();
      onHoverChange(null);
    });

    listen(this.element, 'focusin', e => {
      const target = dev().assertElement(e.target);
      const {
        onGridFocusChange,
        onGridFocusCaptureChange,
      } = this.getProps_();

      const dateString = target.dataset['iAmphtmlDate'];
      if (dateString) {
        onGridFocusChange(new Date(Number(dateString)));
      }
      if (this.element.contains(target)) {
        onGridFocusCaptureChange(true);
      }
    });

    listen(this.element, 'focusout', e => {
      const {onGridFocusCaptureChange} = this.getProps_();
      const {relatedTarget} = e;
      if (!relatedTarget ||
          !this.element.contains(dev().assertElement(relatedTarget))) {
        onGridFocusCaptureChange(false);
      }
    });

    // https://www.w3.org/TR/2009/WD-wai-aria-practices-20090224/
    listen(this.element, 'keydown', e => {
      const {
        focusedDate,
        onKeyboardNavigate,
      } = this.props_;
      const {key, shiftKey} = e;
      const maybeDestinationDay =
          getKeyboardNavigationDate(focusedDate, key, shiftKey);

      if (maybeDestinationDay) {
        e.preventDefault();
      }

      onKeyboardNavigate(/** @type {!Date} */ (maybeDestinationDay));
    });
  }



  /**
   * @return {!LitCalendarPropsDef}
   */
  getProps_() {
    return /** @type {!LitCalendarPropsDef} */ (this.props_);
  }

  /**
   * @param {!LitCalendarPropsDef} props
   * @return {!Promise}
   */
  render(props) {
    this.props_ = props;
    const {
      daySize,
      displayedDate,
      enableOutsideDays,
      firstDayOfWeek,
      focusedDate,
      formats,
      isRtl,
      modifiers,
      numberOfMonths,
      phrases,
    } = props;

    const calendar = renderCalendar({
      daySize,
      displayedDate,
      enableOutsideDays,
      firstDayOfWeek,
      focusedDate,
      formats,
      isRtl,
      modifiers,
      numberOfMonths,
      phrases,
    });
    render(calendar, this.element);

    // Use chunk because the lit-html uses microtasks. Wait 1 microtask.
    // TODO explain better
    // TODO is a deferred needed or is any microtask enough?
    const deferred = new Deferred();
    this.win.requestAnimationFrame(deferred.resolve);
    return deferred.promise;
  }
}

/**
 * Handles keyboard navigation on the calendar.
 * @param {!Date} date
 * @param {string} key
 * @param {boolean} shiftKey
 * @return {?Date}
 * @private
 */
function getKeyboardNavigationDate(date, key, shiftKey) {
  switch (key) {
    case 'ArrowRight': return addToDate(date, 0, 0, 1);
    case 'ArrowLeft': return addToDate(date, 0, 0, -1);
    case 'ArrowDown': return addToDate(date, 0, 0, 7);
    case 'ArrowUp': return addToDate(date, 0, 0, -7);
    case 'PageDown':
      return shiftKey ? addToDate(date, 1, 0, 0) : addToDate(date, 0, 1, 0);
    case 'PageUp':
      return shiftKey ? addToDate(date, -1, 0, 0) : addToDate(date, 0, -1, 0);
    case 'Home': return getFirstDayOfMonth(date);
    case 'End': return getLastDayOfMonth(date);
    default: return null;
  }
}
