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

import {CSS} from '../../../build/amp-date-calendar-0.1.css';
import {CalendarDayStates} from './calendar-day-states';
import {CalendarLabelFormats} from './calendar-label-formats';
import {Layout} from '../../../src/layout';
import {Services} from '../../../src/services';
import {
  getNextMonth,
  getPreviousMonth,
  isSameDay,
} from './date-utils';
import {map} from '../../../src/utils/object';
import {render} from 'lit-html/lit-html';
import {render as renderCalendar} from './components/calendar';
const TAG = 'amp-date-calendar';

// TODO(cvializ): Focus areas
// - RTL
// - Intl
// - Animation
// - Orientation flexibility
// - Interaction statefulness (highlights, selected, start and end, etc.)
//

/* TODO(cvializ): This is a temporary name. It will be amp-date-picker 0.2? */
export class AmpDateCalendar extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    this.document_ = this.element.ownerDocument;

    this.displayedDate_ = new Date();

    this.selectedDate_ = new Date('2018-08-13');

    this.datesMap = map();

    /** @private {?Element} */
    this.container_ = null;

    this.isRtl_ = false;

    this.locale_ = this.element.getAttribute('locale') || 'en-US';

    this.formats_ = new CalendarLabelFormats(this.locale_);

    /** @private @const */
    this.firstDayOfWeek_ =
        Number(this.element.getAttribute('first-day-of-week')) || 0;

    this.numberOfMonths_ =
        Number(this.element.getAttribute('number-of-months')) || 2;

    /** @private */
    this.ampDateParser_ = null;

    this.calendarStateRanges = {
      [CalendarDayStates.AFTER_HOVERED_START]: [],
      [CalendarDayStates.BLOCKED_CALENDAR]: [],
      [CalendarDayStates.BLOCKED_MINIMUM_NIGHTS]: [],
      [CalendarDayStates.BLOCKED_OUT_OF_RANGE]: [],
      [CalendarDayStates.HIGHLIGHTED_CALENDAR]: [],
      [CalendarDayStates.HOVERED_SPAN]: [],
      [CalendarDayStates.LAST_IN_RANGE]: [],
      [CalendarDayStates.SELECTED_END]: [],
      [CalendarDayStates.SELECTED_SPAN]: [],
      [CalendarDayStates.SELECTED_START]: [],
      [CalendarDayStates.SELECTED]: [],
      [CalendarDayStates.TODAY]: [],
    };

    Services.ampDateParserForDocOrNull(this.element).then(adp => {
      this.ampDateParser = adp;
    });
  }

  /** @override */
  mutatedAttributesCallback(mutations) {
    if (mutations['number-of-months']) {
      this.numberOfMonths_ = Number(mutations['number-of-months']);
      this.element.setAttribute('number-of-months', this.numberOfMonths_);
      this.render_();
    }
  }

  /** @override */
  buildCallback() {
    this.isRtl_ = this.document_.dir == 'rtl' ||
        this.element.hasAttribute('rtl');

    this.container_ = this.document_.createElement('div');

    this.render_();

    this.setSelectedDate_(this.selectedDate_);
    this.element.appendChild(this.container_);
  }

  /** @override */
  layoutCallback() {
    this.element.addEventListener('click', e => {
      const {target} = e;

      const date = Number(target.dataset.iAmphtmlDate);
      if (date) {
        this.selectedDate_ = new Date(date);
        this.setSelectedDate_(this.selectedDate_);
      } else {
        if (e.target == this.getNextButton_()) {
          this.displayedDate_ = getNextMonth(this.displayedDate_);
        } else if (e.target == this.getPreviousButton_()) {
          this.displayedDate_ = getPreviousMonth(this.displayedDate_);
        } else if (e.target == this.today_) {
          this.displayedDate_ = new Date();
        }
        this.render_();
      }
    });
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.CONTAINER;
  }

  /**
   * Get the next button
   * @return {?Element}
   */
  getNextButton_() {
    return this.next_ ||
        (this.next_ = this.element.getElementsByClassName('next')[0]);
  }

  /**
   * Get the previous button
   * @return {?Element}
   */
  getPreviousButton_() {
    return this.previous_ ||
        (this.previous_ = this.element.getElementsByClassName('previous')[0]);
  }

  /**
   * Render the months
   */
  render_() {
    const calendar = renderCalendar({
      daySize: 39,
      numberOfMonths: this.numberOfMonths_,
      displayedDate: this.displayedDate_,
      selectedDate: this.selectedDate_,
      formats: this.formats_,
      firstDayOfWeek: this.firstDayOfWeek_,
      isRtl: this.isRtl_,
      isDayBlocked: date => isSameDay(date, new Date()),
    });

    render(calendar, this.container_);
  }

  /**
   * Update the selected date
   * @param {!Date} date
   */
  setSelectedDate_(date) {
    this.selectedDate_ = new Date(date);
    this.render_();
  }
}

AMP.extension(TAG, '0.1', AMP => {
  AMP.registerElement(TAG, AmpDateCalendar, CSS);
});
