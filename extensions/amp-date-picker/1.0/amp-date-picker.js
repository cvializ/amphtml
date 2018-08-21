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

import {Animation} from '../../../src/animation';
import {CSS} from '../../../build/amp-date-picker-1.0.css';
import {
  DateFieldNameByType,
  DateFieldType,
} from '../date-field-type';
import {DatePickerEvent} from '../date-picker-event';
import {DatePickerMode} from '../date-picker-mode';
import {DatePickerState} from '../date-picker-state';
import {DatePickerType} from '../date-picker-type';
import {DayStates} from './calendar-day-states';
import {FiniteStateMachine} from '../../../src/finite-state-machine';
import {LabelFormats} from './label-formats';
import {
  Layout,
  isLayoutSizeDefined,
} from '../../../src/layout';
import {LitCalendar} from './lit-calendar';
import {
  Phrases,
  chooseAvailableDate,
  chooseAvailableEndDate,
  chooseAvailableStartDate,
  defaultPhrases,
} from './phrases';
// import {Services} from '../../../src/services';
import {
  addToDate,
  getDay,
  getFirstDayOfMonth,
  isAfter,
  isAfterInclusive,
  isBetween,
  isBetweenInclusive,
  isSameDay,
  parseIsoDateToLocal,
} from './date-utils';
import {createCustomEvent, listen} from '../../../src/event-helper';
import {dev, user} from '../../../src/log';
import {
  escapeCssSelectorIdent,
  isRTL,
} from '../../../src/dom';
import {map} from '../../../src/utils/object';
import {setupDateField} from '../date-picker-input';

const TAG = 'amp-date-picker';

// TODO(cvializ): Focus areas
// - Orientation flexibility
// - Overlay, fullscreen

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

    const type = this.element.getAttribute('type');
    this.type_ = type == DatePickerType.RANGE ?
      DatePickerType.RANGE :
      DatePickerType.SINGLE; // default

    const mode = this.element.getAttribute('mode');
    this.mode_ = mode == DatePickerMode.OVERLAY ?
      DatePickerMode.OVERLAY :
      DatePickerMode.STATIC; // default

    this.isOpen_ = this.mode_ == DatePickerMode.STATIC;

    this.activeDate_ =
        this.type_ == DatePickerType.SINGLE ?
          ActiveDateState.DATE :
          ActiveDateState.START_DATE;

    const date = this.element.getAttribute('date');
    this.selectedDate_ = date ? parseIsoDateToLocal(date) : null;

    const startDate = this.element.getAttribute('start-date');
    this.selectedStartDate_ = startDate ? parseIsoDateToLocal(startDate) : null;

    const endDate = this.element.getAttribute('end-date');
    this.selectedEndDate_ = endDate ? parseIsoDateToLocal(endDate) : null;

    /** @private {!Date} */
    this.displayedDate_ = getFirstDayOfMonth(this.today_);

    /** @private {?Date} */
    this.hoveredDate_ = null;

    /** @private {!Date} */
    this.focusedDate_ = this.today_;

    const min = this.element.getAttribute('min');
    this.min_ = min ? parseIsoDateToLocal(min) : null;

    const max = this.element.getAttribute('max');
    this.max_ = max ? parseIsoDateToLocal(max) : null;

    const blocked = this.element.getAttribute('blocked');
    this.blocked_ = blocked ?
      blocked.split(/\s+/).map(v => parseIsoDateToLocal(v)) :
      [];

    const highlighted = this.element.getAttribute('highlighted');
    this.highlighted_ = highlighted ?
      highlighted.split(/\s+/).map(v => parseIsoDateToLocal(v)) :
      [];

    const locale = this.element.getAttribute('locale');
    this.locales_ = locale ? locale.split(/\s+/) : ['en-US'];

    this.formats_ = new LabelFormats(this.locales_);

    this.enableOutsideDays_ = this.element.hasAttribute('enable-outside-days');

    const minimumNights = this.element.getAttribute('minimum-nights');
    this.minimumNights_ = minimumNights ? Number(minimumNights) : 0;

    const firstDayOfWeek = this.element.getAttribute('first-day-of-week');
    this.firstDayOfWeek_ = firstDayOfWeek ? Number(firstDayOfWeek) : 0;

    const numberOfMonths = this.element.getAttribute('number-of-months');
    this.numberOfMonths_ = numberOfMonths ? Number(numberOfMonths) : 2;

    const daySize = this.element.getAttribute('day-size');
    this.daySize_ = daySize ? Number(daySize) : 39;

    /** @private {?Element} */
    this.container_ = null;

    /** @private {!Array<string>} */
    this.locales_ = ['en-US'];

    /** @private {!LabelFormats} */
    this.formats_ = new LabelFormats(this.locales_);

    /** @private @const */
    this.modifiers_ = this.createModifiers_();

    /** @private */
    this.capturedFocus_ = false;

    /** @private {!ActiveDateState} */
    this.activeDate_ = ActiveDateState.START_DATE;

    /** @private */
    this.monthTranslate_ = 0;

    /** @private @const */
    this.boundOnDisplayedDateChange_ = this.onDisplayedDateChange_.bind(this);
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
    /** @private @const */
    this.boundRenderDay_ = this.renderDay_.bind(this);

    /** @private {?LitCalendar} */
    this.litCalendar_ = null;
    // this.ampDateParser_ = null;
    // Services.ampDateParserForDocOrNull(this.element).then(adp => {
    //   this.ampDateParser = adp;
    // });

    const initialState = (this.mode_ == DatePickerMode.OVERLAY ?
      DatePickerState.OVERLAY_CLOSED :
      DatePickerState.STATIC);
    /** @private @const */
    this.stateMachine_ = new FiniteStateMachine(initialState);
    this.setupStateMachine_(this.stateMachine_);
  }

  /** @override */
  buildCallback() {
    this.isRTL_ = isRTL(this.win.document);

    this.focusedDate_ = this.getFocusedDate_();

    if (this.type_ === DatePickerType.SINGLE) {
      this.dateField_ = setupDateField(
          this.getAmpDoc(), this.element, this.mode_, DateFieldType.DATE);
      if (this.mode_ == DatePickerMode.OVERLAY &&
          this.dateField_ === null) {
        user().error(TAG,
            'Overlay single pickers must specify "input-selector" to ' +
            'an existing input element.');
      }
    } else if (this.type_ === DatePickerType.RANGE) {
      this.startDateField_ = setupDateField(
          this.getAmpDoc(), this.element, this.mode_, DateFieldType.START_DATE);
      this.endDateField_ = setupDateField(
          this.getAmpDoc(), this.element, this.mode_, DateFieldType.END_DATE);

      if (this.mode_ == DatePickerMode.OVERLAY &&
          (!this.startDateField_ || !this.endDateField_)) {
        user().error(TAG,
            'Overlay range pickers must "start-input-selector" and ' +
            '"end-input-selector" to existing start and end input elements.');
      }
    } else {
      user().error(TAG, 'Invalid date picker type', this.type_);
    }

    this.container_ = this.document_.createElement('div');

    this.litCalendar_ = new LitCalendar(this.container_);
    this.litCalendar_.listen();

    this.render_();

    this.element.appendChild(this.container_);
  }

  /** @override */
  layoutCallback() {
    const ampdoc = this.getAmpDoc();
    const root = ampdoc.getRootNode().documentElement || ampdoc.getBody();
    listen(root, 'focusin', this.handleFocus_.bind(this));

    if (this.mode_ == DatePickerMode.OVERLAY) {
      listen(root, 'click', this.handleClick_.bind(this));
    }

    return Promise.resolve();
  }

  /**
   * Configure the states and transitions in the state machine.
   * @param {!FiniteStateMachine} sm
   */
  setupStateMachine_(sm) {
    const {
      OVERLAY_OPEN_INPUT,
      OVERLAY_CLOSED,
      OVERLAY_OPEN_PICKER,
      STATIC,
    } = DatePickerState;
    const noop = () => {};
    sm.addTransition(STATIC, STATIC, noop);

    sm.addTransition(OVERLAY_CLOSED, OVERLAY_OPEN_INPUT, () => {
      this.isOpen_ = true;
      this.render_().then(() => {
        this.triggerEvent_(DatePickerEvent.ACTIVATE);
      });
    });
    sm.addTransition(OVERLAY_CLOSED, OVERLAY_OPEN_PICKER, () => {
      this.isOpen_ = true;
      this.render_();
    });
    sm.addTransition(OVERLAY_CLOSED, OVERLAY_CLOSED, noop);


    sm.addTransition(OVERLAY_OPEN_INPUT, OVERLAY_OPEN_PICKER, () => {
      this.isOpen_ = true;
      this.render_();
    });
    sm.addTransition(OVERLAY_OPEN_INPUT, OVERLAY_CLOSED, () => {
      this.updateDateFieldFocus_(null);
      this.isOpen_ = false;
      this.render_();
    });
    sm.addTransition(OVERLAY_OPEN_INPUT, OVERLAY_OPEN_INPUT, noop);


    sm.addTransition(OVERLAY_OPEN_PICKER, OVERLAY_OPEN_PICKER, noop);
    sm.addTransition(OVERLAY_OPEN_PICKER, OVERLAY_OPEN_INPUT, () => {
      // remove focus?
    });
    sm.addTransition(OVERLAY_OPEN_PICKER, OVERLAY_CLOSED, () => {
      this.updateDateFieldFocus_(null);
      this.isOpen_ = false;
      this.render_();
    });
  }

  /**
   * Helper method for transitioning states.
   * @param {!DatePickerState} state
   */
  transitionTo_(state) {
    if (this.mode_ == DatePickerMode.STATIC) {
      return;
    }
    this.stateMachine_.setState(state);
  }

  /**
   * Handle clicks inside and outside of the date picker to detect when to
   * open and close the date picker.
   * @param {!Event} e
   * @private
   */
  handleClick_(e) {
    const target = dev().assertElement(e.target);
    const clickWasInDatePicker = (
      this.container_.contains(target) || this.isDateField_(target)
    );

    if (!clickWasInDatePicker) {
      this.transitionTo_(DatePickerState.OVERLAY_CLOSED);
    }
  }

  /**
   * Handle focus events in the document.
   * @param {!Event} e
   * @private
   */
  handleFocus_(e) {
    this.maybeTransitionWithFocusChange_(dev().assertElement(e.target));
  }

  /**
   * Switch between selecting the start and end dates,
   * and when to open and close the date picker.
   * @param {!Element} target
   */
  maybeTransitionWithFocusChange_(target) {
    if (this.isDateField_(target)) {
      if (target == this.startDateField_) {
        this.updateDateFieldFocus_(this.startDateField_);
        this.activeDate_ = ActiveDateState.START_DATE;
      } else if (target == this.endDateField_) {
        this.updateDateFieldFocus_(this.endDateField_);
        this.activeDate_ = ActiveDateState.END_DATE;
      } else if (target == this.dateField_) {
        this.updateDateFieldFocus_(this.dateField_);
      }
      this.transitionTo_(DatePickerState.OVERLAY_OPEN_INPUT);
      this.render_();
    } else if (!this.element.contains(target)) {
      this.updateDateFieldFocus_(null);
      this.transitionTo_(DatePickerState.OVERLAY_CLOSED);
      this.render_();
    }
  }

  /**
   * True if the input is a field of this date picker.
   * @param {?Element} field
   * @return {boolean}
   * @private
   */
  isDateField_(field) {
    return (
      field === this.dateField_ ||
      field === this.startDateField_ ||
      field === this.endDateField_
    );
  }

  /**
   * Apply the focus CSS class to the given field and unapply it from
   * the others.
   * @param {?Element} focusedField The field to apply focus to
   * @param {boolean=} opt_toggle
   * @private
   */
  updateDateFieldFocus_(focusedField, opt_toggle) {
  }

  /**
   * Update the displayed date state.
   * @param {!Date} date
   */
  onDisplayedDateChange_(date) {
    if (this.monthTranslate_ != 0) {
      return;
    }

    const direction = isAfter(date, this.displayedDate_) ? 100 : -100;
    Animation.animate(
        this.element,
        d => {
          this.monthTranslate_ = d * direction;
          this.render_();
        },
        250,
        'ease-in-out')
        .thenAlways(() => {
          this.setDisplayedDate_(date);
          this.monthTranslate_ = 0;
          this.render_();
        });
  }

  /**
   * Update the focused date state.
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
    this.render_();
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
   * Select dates, and transition between active date states.
   * @param {?Date} date
   */
  onSelectDate_(date) {
    if (date && !this.canSelect_(date)) {
      return;
    }

    switch (this.activeDate_) {
      case ActiveDateState.DATE:
        this.selectedDate_ = date;
        // Remain in the single date DATE state
        break;
      case ActiveDateState.START_DATE:
        this.selectedStartDate_ = date;
        this.activeDate_ = ActiveDateState.END_DATE;
        break;
      case ActiveDateState.END_DATE:
        if (!date) {
          this.selectedEndDate_ = date;
          break;
        }

        if (!this.selectedStartDate_) {
          this.selectedEndDate_ = date;
          this.activeDate_ = ActiveDateState.START_DATE;
          break;
        }

        if (isAfterInclusive(date, this.selectedStartDate_)) {
          this.selectedEndDate_ = date;
        } else {
          this.selectedStartDate_ = date;
          this.selectedEndDate_ = null;
        }
        // Remain in END_DATE state.
        break;
      case ActiveDateState.NONE:
      default:
    }

    if (date) {
      this.focusedDate_ = date;

      // If the selected date is not visible in the rendered date, render it.
      if (!this.isVisibleDate_(date)) {
        this.setDisplayedDate_(getFirstDayOfMonth(date));
      }
    }

    this.render_(); // TODO(cvializ): Optimize
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
    const m = String(Number(date));
    const destinationElement = this.element.querySelector(
        `[data-i-amphtml-date=${escapeCssSelectorIdent(m)}]:not(.outside)`);
    if (!destinationElement) {
      return false;
    } else {
      destinationElement.focus(); // TODO(cvializ): mutateElement
      return true;
    }
  }

  /** @override */
  isLayoutSupported(layout) {
    return this.mode_ == DatePickerMode.STATIC ?
      isLayoutSizeDefined(layout) :
      layout == Layout.CONTAINER;
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
    if (mutations['day-size'] != null) {
      this.daySize_ = Number(mutations['day-size']);
      this.element.setAttribute('day-size', mutations['day-size']);
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
    const phrases = map(defaultPhrases);

    // TODO(cvializ): Make this change based on the activeDate and where the
    // day is relative to it, e.g. before the start date, it will say
    // "choose x as your start date" even if the activeDate is END_DATE.
    phrases[Phrases.CHOOSE_AVAILABLE_DATE] =
      this.type_ == DatePickerType.RANGE ?
        (this.activeDate_ == ActiveDateState.START_DATE ?
          chooseAvailableStartDate :
          chooseAvailableEndDate) :
        chooseAvailableDate;

    return phrases;
  }

  /**
   * @return {!Object<string,function(!Date):boolean>}
   * @private
   */
  createModifiers_() {
    return {
      [DayStates.AFTER_HOVERED_START]:
          date => this.afterHoveredStart_(date),
      [DayStates.BLOCKED_CALENDAR]:
          date => this.isBlocked_(date),
      [DayStates.BLOCKED_MINIMUM_NIGHTS]:
          date => this.isBlockedMinimumNights_(date),
      [DayStates.BLOCKED_OUT_OF_RANGE]:
          date => this.isBlockedOutOfRange_(date),
      [DayStates.HIGHLIGHTED_CALENDAR]:
          date => this.isHighlighted_(date),
      [DayStates.HOVERED_SPAN]: date => this.isHoveredSpan_(date),
      [DayStates.LAST_IN_RANGE]: date => this.isLastInRange_(date),
      [DayStates.SELECTED_END]: date => this.isSelectedEnd_(date),
      [DayStates.SELECTED_SPAN]: date => this.isSelectedSpan_(date),
      [DayStates.SELECTED_START]: date => this.isSelectedStart_(date),
      [DayStates.SELECTED]: date => this.isSelected_(date),
      [DayStates.TODAY]: date => isSameDay(date, this.today_),
      [DayStates.FOCUSED]: date => isSameDay(date, this.focusedDate_),
    };
  }

  /**
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  afterHoveredStart_(date) {
    if (this.minimumNights_ == 0) {
      return false;
    }

    if (this.selectedEndDate_) {
      return false;
    }

    if (!this.hoveredDate_) {
      return false;
    }

    if (this.hoveredDate_ != this.selectedStartDate_) {
      return false;
    }

    if (this.isBlocked_(date)) {
      return false;
    }

    return isSameDay(date, addToDate(this.selectedStartDate_, 0, 0, 1));
  }

  /**
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isHoveredSpan_(date) {
    if (!this.selectedStartDate_) {
      return false;
    }

    if (this.selectedEndDate_) {
      return false;
    }

    if (!this.hoveredDate_) {
      return false;
    }

    if (this.minimumNights_ > 0) {
      const lastMinimumNight =
          addToDate(this.selectedStartDate_, 0, 0, this.minimumNights_);
      const isMinimumNight = isBetween(
          this.selectedStartDate_, lastMinimumNight, this.hoveredDate_);
      if (isMinimumNight) {
        return false;
      }
    }

    return isBetweenInclusive(
        this.selectedStartDate_, this.hoveredDate_, date);
  }

  /**
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isLastInRange_(date) {
    if (!this.selectedEndDate_) {
      return false;
    }

    return this.isSelectedSpan_(date) &&
        isSameDay(addToDate(date, 0, 0, 1), this.selectedEndDate_);
  }

  /**
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isBlocked_(date) {
    return this.blocked_.some(blocked => isSameDay(date, blocked));
  }

  /**
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isBlockedMinimumNights_(date) {
    if (this.activeDate_ != ActiveDateState.END_DATE) {
      return false;
    }

    if (!this.selectedStartDate_) {
      return false;
    }

    if (this.minimumNights_ == 0) {
      return false;
    }

    const lastMinimumNight =
        addToDate(this.selectedStartDate_, 0, 0, this.minimumNights_);
    return isSameDay(date, this.selectedStartDate_) ||
        isBetween(this.selectedStartDate_, lastMinimumNight, date);
  }

  /**
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isBlockedOutOfRange_(date) {
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
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isHighlighted_(date) {
    return this.highlighted_.some(highlighted => isSameDay(date, highlighted));
  }

  /**
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isSelectedEnd_(date) {
    return !!this.selectedEndDate_ && isSameDay(date, this.selectedEndDate_);
  }

  /**
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
    return !this.isBlocked_(date) &&
        !this.isBlockedMinimumNights_(date) &&
        !this.isBlockedOutOfRange_(date); // TODO(cvializ): minimum nights?
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

    const primary = this.type_ == DatePickerType.SINGLE ?
      this.selectedDate_ :
      (this.selectedStartDate_ || this.selectedEndDate_);

    return primary || this.today_;
  }

  /**
   * @param {Date} date
   * @return {!Promise}
   */
  renderDay_(date) {
    return new Promise(
        resolve => resolve(this.formats_.day(addToDate(date, 0, 0, 1))));
  }

  /**
   * Render the months.
   * @return {!Promise}
   * @private
   */
  render_() {
    return this.litCalendar_.render({
      daySize: this.daySize_,
      displayedDate: this.displayedDate_,
      enableOutsideDays: this.enableOutsideDays_,
      firstDayOfWeek: this.firstDayOfWeek_,
      focusedDate: this.focusedDate_,
      formats: this.formats_,
      isOpen: this.isOpen_,
      isRtl: this.isRtl_,
      modifiers: this.modifiers_,
      numberOfMonths: this.numberOfMonths_,
      monthTranslate: this.monthTranslate_,
      onDisplayedDateChange: this.boundOnDisplayedDateChange_,
      onGridFocusCaptureChange: this.boundOnGridFocusCaptureChange_,
      onGridFocusChange: this.boundOnGridFocusChange_,
      onHoverChange: this.boundOnHoverChange_,
      onKeyboardNavigate: this.boundOnKeyboardNavigate_,
      onSelectDate: this.boundOnSelectDate_,
      phrases: this.getPhrases_(), // TODO(cvializ): does this need to be more efficient?
      renderDay: null, // this.boundRenderDay_,
    });
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

AMP.extension(TAG, '1.0', AMP => {
  AMP.registerElement(TAG, AmpDateCalendar, CSS);
});
