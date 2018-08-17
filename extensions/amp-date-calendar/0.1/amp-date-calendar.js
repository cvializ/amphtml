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
import {LitCalendar} from './lit-calendar';
// import {Services} from '../../../src/services';
import {
  addToDate,
  getDay,
  getFirstDayOfMonth,
  getNextMonth,
  getPreviousMonth,
  isAfter,
  isAfterInclusive,
  isBetween,
  isBetweenInclusive,
  isSameDay,
  parseIsoDateToLocal,
} from './date-utils';
import {defaultPhrases} from './phrases';
import {dev} from '../../../src/log';
import {
  escapeCssSelectorIdent,
  scopedQuerySelector,
} from '../../../src/dom';
import {listen} from '../../../src/event-helper';
import {map} from '../../../src/utils/object';

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
};

/** @enum {string} */
const ActiveDateState = {
  DATE: 'date',
  START_DATE: 'start-date',
  END_DATE: 'end-date',
  NONE: 'none',
};

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
    this.displayedDate_ = getFirstDayOfMonth(this.today_);

    /** @private {?Date} */
    this.selectedDate_ = null;

    /** @private {?Date} */
    this.selectedStartDate_ = null;

    /** @private {?Date} */
    this.selectedEndDate_ = null;

    /** @private {?Date} */
    this.hoveredDate_ = null;

    /** @private {!Date} */
    this.focusedDate_ = this.today_;

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

    this.phrases_ = this.getPhrases_();

    /** @private @const */
    this.modifiers_ = this.createModifiers_();

    /** @private */
    this.capturedFocus_ = false;

    /** @private {!ActiveDateState} */
    this.activeDate_ = ActiveDateState.START_DATE;

    /** @private @const */
    this.boundOnGridFocusCaptureChange_ =
        this.onGridFocusCaptureChange_.bind(this);
    /** @private @const */
    this.boundOnGridFocusChange_ = this.onGridFocusChange_.bind(this);
    /** @private @const */
    this.boundOnHoverChange_ = this.onHoverChange_.bind(this);
    /** @private @const */
    this.boundOnKeyboardNavigate_ = this.onKeyboardNavigate_.bind(this);
    /** @private @const */
    this.boundOnSelectDate_ = this.onSelectDate_.bind(this);

    /** @private {?LitCalendar} */
    this.litCalendar_ = null;
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
    this.type_ = type == AmpCalendarType.SINGLE ?
      AmpCalendarType.SINGLE :
      AmpCalendarType.RANGE;

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

    this.litCalendar_ = new LitCalendar(this.container_);
    this.litCalendar_.listen();

    this.render_();

    this.element.appendChild(this.container_);

    // TODO(cvializ): Queue first click for select too?
    // const {activeElement} = this.document_;
    // if (this.element.contains(activeElement)) {
    //   this.handleFocusin_(dev().assertElement(activeElement));
    // }

    listen(this.element, 'click', e => {
      const {target} = e;

      if (target == this.getNextButton_()) {
        this.setDisplayedDate_(getNextMonth(this.displayedDate_),
            getNextMonth(this.focusedDate_));
      } else if (target == this.getPreviousButton_()) {
        this.setDisplayedDate_(getPreviousMonth(this.displayedDate_),
            getPreviousMonth(this.focusedDate_));
      }
      this.render_();
    });
  }

  /** @override */
  layoutCallback() {
    return Promise.resolve();
  }

  /**
   * Update the focused date state. This is read by a modifier.
   * @param {!Date} date
   */
  onGridFocusChange_(date) {
    this.focusedDate_ = date;
    this.render_();
  }

  /**
   * Update the focus capture state.
   * @param {boolean} isCaptured
   */
  onGridFocusCaptureChange_(isCaptured) {
    this.capturedFocus_ = isCaptured;
  }

  /**
   * Change the hover state
   * @param {?Date} date
   */
  onHoverChange_(date) {
    this.hoveredDate_ = date;
  }

  /**
   * @param {?Date} date
   */
  onKeyboardNavigate_(date) {
    if (this.capturedFocus_ && this.focusedDate_) {
      if (!date) {
        return;
      }

      const destinationDay = /** @type {!Date} */ (date);
      let waitForRender;

      if (!this.isVisibleDate_(destinationDay)) {
        // We need to render some new months
        const newDisplayedDate = getFirstDayOfMonth(destinationDay);
        this.setDisplayedDate_(newDisplayedDate, destinationDay);
        waitForRender = this.render_();
      } else {
        waitForRender = Promise.resolve();
      }

      waitForRender.then(() => {
        const success = this.tryFocusDate_(destinationDay);
        if (success) {
          this.focusedDate_ = destinationDay;
          this.render_(); // render again to sync the successful state
        }
      });
    }
  }

  /**
   * @param {?Date} date
   */
  onSelectDate_(date) {
    if (date && !this.canSelect_(date)) {
      return;
    }

    switch (this.activeDate_) {
      case ActiveDateState.DATE:
        this.setSelectedDate_(date);
        break;
      case ActiveDateState.START_DATE:
        this.setSelectedStartDate_(date);
        this.activeDate_ = ActiveDateState.END_DATE;
        break;
      case ActiveDateState.END_DATE:
        this.setSelectedEndDate_(date);
        this.activeDate_ = ActiveDateState.START_DATE;
        break;
      case ActiveDateState.NONE:
      default:
    }
  }

  /**
   * Check if the given date is currently shown in the calendar.
   * @param {!Date} date
   */
  isVisibleDate_(date) {
    const lastDisplayedDate =
        addToDate(this.displayedDate_, 0, this.numberOfMonths_);
    return isBetween(this.displayedDate_, lastDisplayedDate, date);
  }

  /**
   * Try to move focus to the destination date.
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  tryFocusDate_(date) {
    const millis = String(Number(date));
    // TODO(cvializ): put the outside class on the button?
    const destinationElement = scopedQuerySelector(this.element,
        `:not(.outside) >
        [data-i-amphtml-date=${escapeCssSelectorIdent(millis)}]`);
    if (!destinationElement) {
      return false;
    } else {
      destinationElement.focus();
      return true;
    }
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

    if (mutations['active-date'] != null) {
      this.activeDate_ = mutations['active-date'];
      if (this.activeDate_) {
        this.element.setAttribute('active-date', this.activeDate_);
      } else {
        this.element.removeAttribute('active-date');
      }
      mutated = true;
    }

    if (mutated) {
      this.render_();
    }
  }

  /**
   * Get the list of phrases
   * @return {!./phrases.PhrasesDef}
   */
  getPhrases_() {
    return map(defaultPhrases);
  }

  /**
   * @return {!Object<string,function(!Date):boolean>}
   * @private
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
      [CalendarDayStates.FOCUSED]: date => isSameDay(date, this.focusedDate_), // TODO(cvializ): needed?
    };
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   * @private
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
   * @private
   */
  isOutOfRange_(date) {
    if (this.max_ && this.min_) {
      return !isBetweenInclusive(this.min_, this.max_, date);
    }

    if (this.min_) {
      return !isAfterInclusive(date, this.min_);
    }

    if (this.max_) {
      return isAfter(date, this.max_);
    }

    return false;
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isBlocked_(date) {
    return this.blocked_.some(blocked => isSameDay(date, blocked));
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isHighlighted_(date) {
    return this.highlighted_.some(highlighted => isSameDay(date, highlighted));
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isSelectedEnd_(date) {
    return !!this.selectedEndDate_ && isSameDay(date, this.selectedEndDate_);
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isSelectedStart_(date) {
    return !!this.selectedStartDate_ &&
        isSameDay(date, this.selectedStartDate_);
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isSelectedSpan_(date) {
    return !!this.selectedStartDate_ && !!this.selectedEndDate_ &&
        isBetween(this.selectedStartDate_, this.selectedEndDate_, date);
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isSelected_(date) {
    return !!this.selectedDate_ && isSameDay(date, this.selectedDate_);
  }

  /**
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  canSelect_(date) {
    return !this.isBlocked_(date) && !this.isOutOfRange_(date);
  }

  /**
   * Gets the date to focus;
   * @return {!Date}
   * @private
   */
  getFocusedDate_() {
    if (this.focusedDate_) {
      return this.focusedDate_;
    }

    const primary = this.type_ == AmpCalendarType.SINGLE ?
      this.selectedDate_ :
      (this.selectedStartDate_ || this.selectedEndDate_);

    return primary || this.today_;
  }

  /**
   * Get the next button
   * @return {?Element}
   * @private
   */
  getNextButton_() {
    return this.nextButton_ ||
        (this.nextButton_ = this.element.getElementsByClassName('next')[0]);
  }

  /**
   * Get the previous button
   * @return {?Element}
   * @private
   */
  getPreviousButton_() {
    return this.previousButton_ || (this.previousButton_ =
        this.element.getElementsByClassName('previous')[0]);
  }

  /**
   * Render the months.
   * @return {!Promise}
   * @private
   */
  render_() {
    return this.litCalendar_.render({
      daySize: 39,
      displayedDate: this.displayedDate_,
      enableOutsideDays: this.enableOutsideDays_,
      firstDayOfWeek: this.firstDayOfWeek_,
      focusedDate: this.focusedDate_,
      formats: this.formats_,
      isRtl: this.isRtl_,
      modifiers: this.modifiers_,
      numberOfMonths: this.numberOfMonths_,
      onGridFocusCaptureChange: this.boundOnGridFocusCaptureChange_,
      onGridFocusChange: this.boundOnGridFocusChange_,
      onHoverChange: this.boundOnHoverChange_,
      onKeyboardNavigate: this.boundOnKeyboardNavigate_,
      onSelectDate: this.boundOnSelectDate_,
      phrases: this.phrases_,
    });
  }

  /**
   * Update the selected date
   * @param {?Date} date
   * @private
   */
  setSelectedDate_(date) {
    this.selectedDate_ = date;
    this.updateDateSelection_(date);
  }

  /**
   * Update the selected start date
   * @param {?Date} date
   * @private
   */
  setSelectedStartDate_(date) {
    this.selectedStartDate_ = date;
    this.updateDateSelection_(date);
  }

  /**
   * Update the selected start date
   * @param {?Date} date
   * @private
   */
  setSelectedEndDate_(date) {
    this.selectedEndDate_ = date;
    this.updateDateSelection_(date);
  }

  /**
   * Common behavior any time a selected date is moved
   * @param {?Date} date
   */
  updateDateSelection_(date) {
    if (date) {
      this.focusedDate_ = date;

      if (!this.isVisibleDate_(date)) {
        this.setDisplayedDate_(getFirstDayOfMonth(date));
      }
    }

    this.render_();
  }

  /**
   * Sets the displayed date and if necessary updates the focused date
   * @param {!Date} date
   * @param {!Date=} opt_focusedDate
   * @private
   */
  setDisplayedDate_(date, opt_focusedDate) {
    // TODO(cvializ): better message? Do automatically?
    dev().assert(date.getDate() == 1, 'Sanity check failed');
    this.displayedDate_ = date;
    const lastDisplayedDate = addToDate(date, 0, this.numberOfMonths_);
    if (!isBetween(this.displayedDate_, lastDisplayedDate, date)) {
      this.focusedDate_ = opt_focusedDate || date;
    }
  }
}

AMP.extension(TAG, '0.1', AMP => {
  AMP.registerElement(TAG, AmpDateCalendar, CSS);
});
