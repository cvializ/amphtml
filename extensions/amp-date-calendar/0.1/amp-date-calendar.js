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
import {KeyCodes} from '../../../src/utils/key-codes';
import {Layout} from '../../../src/layout';
// import {Services} from '../../../src/services';
import {
  addToDate,
  getDay,
  getNextMonth,
  getPreviousMonth,
  isBetween,
  isBetweenInclusive,
  isInclusivelyAfter,
  isSameDay,
  parseIsoDateToLocal,
} from './date-utils';
import {
  escapeCssSelectorIdent,
} from '../../../src/dom';
import {listen} from '../../../src/event-helper';
import {render} from 'lit-html/lit-html';
import {render as renderCalendar} from './components/calendar';
const TAG = 'amp-date-calendar';

// TODO(cvializ): Focus areas
// - Animation
// - state cursors
// - Orientation flexibility
// - a11y labels
// - a11y interaction keyboard etc
// - Interaction statefulness (highlights, selected, start and end, etc.)

/** @enum {string} */
const AmpCalendarType = {
  SINGLE: 'single',
  RANGE: 'range',
}

/* TODO(cvializ): This is a temporary name. It will be amp-date-picker 0.2? */
export class AmpDateCalendar extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private @const */
    this.document_ = this.element.ownerDocument;

    /** @private {!Date} */
    this.today_ = getDay(new Date());

    /** @private */
    this.isRtl_ = false;

    /** @private {!AmpCalendarType} */
    this.type_ = AmpCalendarType.SINGLE;

    /** @private {!Date} */
    this.displayedDate_ = new Date();

    /** @private {?Date} */
    this.selectedDate_ = null;

    /** @private {?Date} */
    this.selectedStartDate_ = null;

    /** @private {?Date} */
    this.selectedEndDate_ = null;

    /** @private {?Date} */
    this.hoveredDate_ = null;

    /** @private {?Date} */
    this.focusedDate_ = null;

    /** @private {?Date} */
    this.min_ = null;

    /** @private {?Date} */
    this.max_ = null;

    /** @private {!Array<!Date>} */
    this.blocked_ = [];

    /** @private {!Array<!Date>} */
    this.highlighted_ = [];

    /** @private  */
    this.enableOutsideDays_ = false;

    /** @private */
    this.firstDayOfWeek_ = 0;

    /** @private */
    this.numberOfMonths_ = 2;

    /** @private {?Element} */
    this.nextButton_ = null;

    /** @private {?Element} */
    this.previousButton_ = null;

    /** @private {?Element} */
    this.container_ = null;

    /** @private {!Array<string>} */
    this.locales_ = ['en-US'];

    /** @private {!CalendarLabelFormats} */
    this.formats_ = new CalendarLabelFormats(this.locales_);

    /** @private @const */
    this.modifiers_ = this.createModifiers_();

    /** @private */
    this.capturedFocus_ = false;

    // this.ampDateParser_ = null;
    // Services.ampDateParserForDocOrNull(this.element).then(adp => {
    //   this.ampDateParser = adp;
    // });
  }

  /** @override */
  buildCallback() {
    this.isRtl_ = this.document_.dir == 'rtl' ||
        this.element.hasAttribute('rtl');

    const type = this.element.getAttribute('type');
    this.type_ = AmpCalendarType[type];

    const date = this.element.getAttribute('date');
    this.selectedDate_ = date ? parseIsoDateToLocal(date) : null;

    const startDate = this.element.getAttribute('start-date');
    this.selectedStartDate_ = startDate ? parseIsoDateToLocal(startDate) : null;

    const endDate = this.element.getAttribute('end-date');
    this.selectedEndDate_ = endDate ? parseIsoDateToLocal(endDate) : null;

    this.focusedDate_ = this.getFocusedDate_();

    const min = this.element.getAttribute('min');
    if (min) {
      this.min_ = parseIsoDateToLocal(min);
    }

    const max = this.element.getAttribute('max');
    if (max) {
      this.max_ = parseIsoDateToLocal(max);
    }

    const blocked = this.element.getAttribute('blocked');
    if (blocked) {
      this.blocked_ = blocked.split(/\s+/).map(v => parseIsoDateToLocal(v));
    }

    const highlighted = this.element.getAttribute('highlighted');
    if (highlighted) {
      this.highlighted_ = highlighted.split(/\s+/)
          .map(v => parseIsoDateToLocal(v));
    }

    const locale = this.element.getAttribute('locale') || 'en-US';
    this.locales_ = locale.split(/\s+/);

    this.formats_ = new CalendarLabelFormats(this.locales_);

    this.enableOutsideDays_ = this.element.hasAttribute('enable-outside-days');

    const firstDayOfWeek = this.element.getAttribute('first-day-of-week');
    this.firstDayOfWeek_ = Number(firstDayOfWeek) || 0;

    const numberOfMonths = this.element.getAttribute('number-of-months');
    this.numberOfMonths_ = Number(numberOfMonths) || 2;

    this.container_ = this.document_.createElement('div');
    this.render_();

    this.element.appendChild(this.container_);
  }

  /** @override */
  layoutCallback() {
    listen(this.element, 'click', e => {
      const {target} = e;

      const dateString = target.dataset['iAmphtmlDate'];
      if (dateString) {
        const date = new Date(Number(dateString));
        // TODO(cvializ): improve
        if (target.closest('.outside-disabled')) {
          return;
        }
        if (!this.canSelect_(date)) {
          return;
        }

        this.setSelectedDate_(date);
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

    listen(this.element, 'mouseover', e => {
      const {target} = e;

      const dateString = target.dataset['iAmphtmlDate'];
      if (dateString) {
        this.hoveredDate_ = new Date(Number(dateString));
        this.render_();
      }
    });

    listen(this.element, 'mouseout', e => {
      // TODO(cvializ): Don't clear if the user is still in the month table but
      // not on another date
      const {relatedTarget} = e;
      if (!relatedTarget || !relatedTarget.dataset['iAmphtmlDate']) {
        this.hoveredDate_ = null;
        this.render_();
      }
    });

    listen(this.element, 'focusin', e => {
      const {target} = e;
      const dateString = target.dataset.iAmphtmlDate;
      if (dateString) {
        this.focusedDate_ = new Date(Number(dateString));
      }
      if (this.container_.contains(target)) {
        this.capturedFocus_ = true;
      }
    });

    listen(this.element, 'focusout', e => {
      const {relatedTarget} = e;
      if (!this.container_.contains(relatedTarget)) {
        this.capturedFocus_ = false;
      }
    });

    listen(this.element, 'keydown', e => {
      const {element} = this;
      if (this.capturedFocus_ && this.focusedDate_) {
        let numberOfDays = 0;
        switch (e.keyCode) {
          case KeyCodes.RIGHT_ARROW: numberOfDays = 1; break;
          case KeyCodes.LEFT_ARROW: numberOfDays = -1; break;
          case KeyCodes.DOWN_ARROW: numberOfDays = 7; break;
          case KeyCodes.UP_ARROW: numberOfDays = -7; break;
          default:
            return;
        }

        const destinationDay = addToDate(this.focusedDate_, 0, 0, numberOfDays);
        const millis = Number(destinationDay);
        const destinationElement = element.querySelector(
            `[data-i-amphtml-date=${escapeCssSelectorIdent(millis)}]`);
        destinationElement.focus();
        this.focusedDate_ = destinationDay;
      }
    });

    return Promise.resolve();
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.CONTAINER;
  }

  /** @override */
  mutatedAttributesCallback(mutations) {
    let mutated = false;

    if (mutations['number-of-months']) {
      this.numberOfMonths_ = Number(mutations['number-of-months']);
      this.element.setAttribute('number-of-months', this.numberOfMonths_);
      mutated = true;
    }
    if (mutations['enable-outside-days'] != null) {
      this.enableOutsideDays_ = !!mutations['enable-outside-days'];
      if (this.enableOutsideDays_) {
        this.element.setAttribute('enable-outside-days', '');
      } else {
        this.element.removeAttribute('enable-outside-days');
      }
      mutated = true;
    }

    if (mutated) {
      this.render_();
    }
  }

  /**
   * @return {!Object<string,function(!Date):boolean>}
   */
  createModifiers_() {
    return {
      [CalendarDayStates.AFTER_HOVERED_START]: date => false, // TODO
      [CalendarDayStates.BLOCKED_CALENDAR]:
          date => this.isBlocked_(date),
      [CalendarDayStates.BLOCKED_MINIMUM_NIGHTS]:
          date => false, // TODO
      [CalendarDayStates.BLOCKED_OUT_OF_RANGE]:
          date => this.isOutOfRange_(date),
      [CalendarDayStates.HIGHLIGHTED_CALENDAR]:
          date => this.isHighlighted_(date),
      [CalendarDayStates.HOVERED_SPAN]: date => this.isHoveredSpan_(date),
      [CalendarDayStates.LAST_IN_RANGE]: date => false, // TODO
      [CalendarDayStates.SELECTED_END]: date => this.isSelectedEnd_(date),
      [CalendarDayStates.SELECTED_SPAN]: date => this.isSelectedSpan_(date),
      [CalendarDayStates.SELECTED_START]: date => this.isSelectedStart_(date),
      [CalendarDayStates.SELECTED]: date => this.isSelected_(date),
      [CalendarDayStates.TODAY]: date => isSameDay(date, this.today_),
    };
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   */
  isHoveredSpan_(date) {
    if (!this.hoveredDate_) {
      return false;
    }

    if (this.selectedStartDate_) {
      return isBetweenInclusive(
          this.selectedStartDate_, this.hoveredDate_, date);
    }

    return false;
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   */
  isOutOfRange_(date) {
    if (this.max_) {
      return !isBetweenInclusive(this.min_, this.max_, date);
    } else {
      return !isInclusivelyAfter(date, this.min_);
    }
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   */
  isBlocked_(date) {
    return this.blocked_.some(blocked => isSameDay(date, blocked));
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   */
  isHighlighted_(date) {
    return this.highlighted_.some(highlighted => isSameDay(date, highlighted));
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   */
  isSelectedEnd_(date) {
    return this.selectedEndDate_ && isSameDay(date, this.selectedEndDate_);
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   */
  isSelectedStart_(date) {
    return this.selectedStartDate_ && isSameDay(date, this.selectedStartDate_);
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   */
  isSelectedSpan_(date) {
    return this.selectedStartDate_ && this.selectedEndDate_ &&
        isBetween(this.selectedStartDate_, this.selectedEndDate_, date);
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   */
  isSelected_(date) {
    return !!this.selectedDate_ && isSameDay(date, this.selectedDate_);
  }

  /**
   * @param {!Date} date
   * @return {boolean}
   */
  canSelect_(date) {
    return !this.isBlocked_(date) && !this.isOutOfRange_(date);
  }

  /**
   * Gets the date to focus;
   * @return {!Date}
   */
  getFocusedDate_() {
    if (this.focusedDate_) {
      return this.focusedDate_;
    }

    const primary = this.type == AmpCalendarType.SINGLE ?
      this.selectedDate_ :
      (this.selectedStartDate_ || this.selectedEndDate);

    return primary || this.today_;
  }

  /**
   * Get the next button
   * @return {?Element}
   */
  getNextButton_() {
    return this.nextButton_ ||
        (this.nextButton_ = this.element.getElementsByClassName('next')[0]);
  }

  /**
   * Get the previous button
   * @return {?Element}
   */
  getPreviousButton_() {
    return this.previousButton_ ||
        (this.previousButton_ = this.element.getElementsByClassName('previous')[0]);
  }

  /**
   * Render the months
   */
  render_() {
    const calendar = renderCalendar({
      daySize: 39,
      displayedDate: this.displayedDate_,
      enableOutsideDays: this.enableOutsideDays_,
      firstDayOfWeek: this.firstDayOfWeek_,
      formats: this.formats_,
      isRtl: this.isRtl_,
      modifiers: this.modifiers_,
      numberOfMonths: this.numberOfMonths_,
    });

    render(calendar, this.container_);
  }

  /**
   * Update the selected date
   * @param {?Date} date
   */
  setSelectedDate_(date) {
    this.selectedDate_ = date;
    this.focusedDate_ = date;
    this.render_();
  }
}

AMP.extension(TAG, '0.1', AMP => {
  AMP.registerElement(TAG, AmpDateCalendar, CSS);
});
