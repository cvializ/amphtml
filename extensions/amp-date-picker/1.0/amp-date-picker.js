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

import {ActionTrust} from '../../../src/action-constants';
import {Animation} from '../../../src/animation';
import {BindDateDetails, BindDatesDetails} from './common/bindings';
import {CSS} from '../../../build/amp-date-picker-1.0.css';
import {DateFieldType} from './common/date-field-type';
import {DatePickerEvent} from './common/date-picker-event';
import {DatePickerMode} from './common/date-picker-mode';
import {DatePickerState} from './common/date-picker-state';
import {DatePickerType} from './common/date-picker-type';
import {DayStates} from './day-states';
import {FiniteStateMachine} from '../../../src/finite-state-machine';
import {KeyCodes} from '../../../src/utils/key-codes';
import {LabelFormats} from './label-formats';
import {Layout, isLayoutSizeDefined} from '../../../src/layout';
import {LitCalendar} from './lit-calendar';
import {Parser} from './parser';
import {
  Phrases,
  chooseAvailableDate,
  chooseAvailableEndDate,
  chooseAvailableStartDate,
  defaultPhrases,
} from './phrases';
import {RenderedDatesCache} from './rendered-dates-cache';
import {Services} from '../../../src/services';
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
import {batchFetchJsonFor} from '../../../src/batched-json';
import {createCustomEvent, listen} from '../../../src/event-helper';
import {debounce} from '../../../src/utils/rate-limit';
import {dev, user} from '../../../src/log';
import {escapeCssSelectorIdent, isRTL} from '../../../src/dom';
import {getDayTemplateData} from './common/template';
import {map} from '../../../src/utils/object';
import {setupDateField} from './common/input';

const TAG = 'amp-date-picker';

// TODO: Focus areas to finish implementing
// - parsing input
// - configurable i18n a11y strings
// - src

const INPUT_FOCUS_CSS = 'amp-date-picker-selecting';

/** @enum {string} */
const ActiveDateState = {
  DATE: 'date',
  START_DATE: 'start-date',
  END_DATE: 'end-date',
};

export class AmpDatePicker extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private @const */
    this.document_ = this.element.ownerDocument;

    /** @private {?../../../src/service/action-impl.ActionService} */
    this.action_ = null;

    /** @private @const */
    this.templates_ = Services.templatesFor(this.win);

    /** @private {?Parser} */
    this.parser_ = null;

    /** @private {!Date} */
    this.today_ = getDay(new Date());

    /** @private */
    this.isRtl_ = false;

    /** @private {string} */
    this.src_ = this.element.getAttribute('src') || '';

    const type = this.element.getAttribute('type');
    this.type_ =
      type == DatePickerType.RANGE
        ? DatePickerType.RANGE
        : DatePickerType.SINGLE; // default

    const mode = this.element.getAttribute('mode');
    this.mode_ =
      mode == DatePickerMode.OVERLAY
        ? DatePickerMode.OVERLAY
        : DatePickerMode.STATIC; // default

    this.isOpen_ = this.mode_ == DatePickerMode.STATIC;

    this.activeDate_ =
      this.type_ == DatePickerType.SINGLE
        ? ActiveDateState.DATE
        : ActiveDateState.START_DATE;

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
    /** @private {?Date} */
    this.min_ = min ? parseIsoDateToLocal(min) : null;

    const max = this.element.getAttribute('max');
    /** @private {?Date} */
    this.max_ = max ? parseIsoDateToLocal(max) : null;

    const blocked = this.element.getAttribute('blocked');
    /** @private {Array<!Date>} */
    this.blocked_ = blocked
      ? blocked.split(/\s+/).map(v => parseIsoDateToLocal(v))
      : [];

    const highlighted = this.element.getAttribute('highlighted');
    /** @private {Array<!Date>} */
    this.highlighted_ = highlighted
      ? highlighted.split(/\s+/).map(v => parseIsoDateToLocal(v))
      : [];

    const locale = this.element.getAttribute('locale');
    /** @private {Array<string>} */
    this.locales_ = locale ? locale.split(/\s+/) : ['en-US'];

    /** @private */
    this.formats_ = new LabelFormats(this.locales_);

    /** @private */
    this.enableOutsideDays_ = this.element.hasAttribute('enable-outside-days');

    /** @private */
    this.allowBlockedRanges_ = this.element.hasAttribute(
      'allow-blocked-ranges'
    );

    /** @private @const */
    this.fullscreen_ = this.element.hasAttribute('fullscreen');
    if (this.fullscreen_) {
      user().assert(
        this.mode_ == DatePickerMode.STATIC,
        'amp-date-picker mode must be "static" to use fullscreen attribute'
      );
    }

    /** @private */
    this.keepOpenOnDateSelect_ = this.element.hasAttribute(
      'keep-open-on-date-select'
    );

    /** @private */
    this.reopenPickerOnClearDate_ = this.element.hasAttribute(
      'reopen-picker-on-clear-date'
    );

    const minimumNights = this.element.getAttribute('minimum-nights');
    /** @private */
    this.minimumNights_ = minimumNights ? Number(minimumNights) : 0;

    const firstDayOfWeek = this.element.getAttribute('first-day-of-week');
    /** @private */
    this.firstDayOfWeek_ = firstDayOfWeek ? Number(firstDayOfWeek) : 0;

    const numberOfMonths = this.element.getAttribute('number-of-months');
    /** @private */
    this.numberOfMonths_ = numberOfMonths ? Number(numberOfMonths) : 1;

    const daySize = this.element.getAttribute('day-size');
    /** @private */
    this.daySize_ = daySize ? Number(daySize) : 39;

    /** @private {?Element} */
    this.container_ = null;

    /** @private @const */
    this.modifiers_ = this.createModifiers_();

    /** @private */
    this.capturedFocus_ = false;

    /** @private */
    this.monthTranslate_ = 0;

    /** @private {?Element} */
    this.dateField_ = null;

    /** @private {?Element} */
    this.startDateField_ = null;

    /** @private {?Element} */
    this.endDateField_ = null;

    /** @private */
    this.renderedTemplates_ = new RenderedDatesCache();

    /** @private @const */
    this.boundOnDisplayedDateChange_ = this.onDisplayedDateChange_.bind(this);
    /** @private @const */
    this.boundOnGridFocusCaptureChange_ = this.onGridFocusCaptureChange_.bind(
      this
    );
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

    const initialState =
      this.mode_ == DatePickerMode.OVERLAY
        ? DatePickerState.OVERLAY_CLOSED
        : DatePickerState.STATIC;
    /** @private @const */
    this.stateMachine_ = new FiniteStateMachine(initialState);
    this.setupStateMachine_(this.stateMachine_);
  }

  /** @override */
  buildCallback() {
    this.action_ = Services.actionServiceForDoc(this.element);

    this.parser_ = new Parser(this.element);

    Services.ampDateParserForDocOrNull(this.element).then(adp => {
      this.ampDateParser_ = adp;
      //m.locale('fa');x=m().format('L');m(x, 'L', 'fa')
    });

    this.isRtl_ = isRTL(this.win.document);

    this.focusedDate_ = this.getFocusedDate_();

    if (this.type_ === DatePickerType.SINGLE) {
      this.dateField_ = setupDateField(
        this.getAmpDoc(),
        this.element,
        this.mode_,
        DateFieldType.DATE
      );
      if (this.mode_ == DatePickerMode.OVERLAY && this.dateField_ === null) {
        user().error(
          TAG,
          'Overlay single pickers must specify "input-selector" to ' +
            'an existing input element.'
        );
      }
    } else if (this.type_ === DatePickerType.RANGE) {
      this.startDateField_ = setupDateField(
        this.getAmpDoc(),
        this.element,
        this.mode_,
        DateFieldType.START_DATE
      );
      this.endDateField_ = setupDateField(
        this.getAmpDoc(),
        this.element,
        this.mode_,
        DateFieldType.END_DATE
      );

      if (
        this.mode_ == DatePickerMode.OVERLAY &&
        (!this.startDateField_ || !this.endDateField_)
      ) {
        user().error(
          TAG,
          'Overlay range pickers must "start-input-selector" and ' +
            '"end-input-selector" to existing start and end input elements.'
        );
      }
    } else {
      user().error(TAG, 'Invalid date picker type', this.type_);
    }

    this.container_ = this.document_.createElement('div');

    this.litCalendar_ = new LitCalendar(this.container_);
    this.litCalendar_.listen();

    this.render_();

    this.element.appendChild(this.container_);

    this.registerAction('setDate', invocation =>
      this.handleSetDateFromString_(invocation.args['date'])
    );
    this.registerAction('setDates', invocation =>
      this.handleSetDatesFromString_(
        invocation.args['startDate'],
        invocation.args['endDate']
      )
    );
    this.registerAction('clear', () => this.handleClear_());
    this.registerAction(
      'today',
      this.todayAction_.bind(this, d => this.handleSetDate_(d))
    );
    this.registerAction(
      'startToday',
      this.todayAction_.bind(this, d => this.handleSetDates_(d, null))
    );
    this.registerAction(
      'endToday',
      this.todayAction_.bind(this, d => this.handleSetDates_(null, d))
    );
  }

  /**
   * Trigger an action that consumes the current day plus an offset
   * @param {function(!Date)} cb
   * @param {!../../../src/service/action-impl.ActionInvocation} invocation
   */
  todayAction_(cb, invocation) {
    const offset = invocation.args && invocation.args['offset'];
    cb(offset ? addToDate(this.today_, 0, 0, Number(offset)) : this.today_);
  }

  /**
   * Set the date via a string.
   * @param {string} date
   */
  handleSetDateFromString_(date) {
    const parsed = parseIsoDateToLocal(date); // TODO(cvializ): parsing
    return this.handleSetDate_(parsed);
  }

  /**
   * Set the date via a Date object.
   * @param {?Date} date
   */
  handleSetDate_(date) {
    this.selectedDate_ = date;
    if (!this.isVisibleDate_(date)) {
      // We need to render some new months
      const newDisplayedDate = getFirstDayOfMonth(date);
      this.setDisplayedDate_(newDisplayedDate, date);
    }

    this.updateDateField_(this.dateField_, date);
    const formattedDate = date ? this.formats_.date(date) : '';
    this.element.setAttribute('date', formattedDate);
    this.render_();
    this.triggerEvent_(DatePickerEvent.SELECT, this.getSelectData_(date));
  }

  /**
   *
   * @param {?string} startDate
   * @param {?string} endDate
   */
  handleSetDatesFromString_(startDate, endDate) {
    const start = startDate ? parseIsoDateToLocal(startDate) : null;
    const end = endDate ? parseIsoDateToLocal(endDate) : null;
    this.handleSetDates_(start, end);
  }

  /**
   * Set one, both, or neither date via AMP action.
   * @param {?Date} startDate
   * @param {?Date} endDate
   */
  handleSetDates_(startDate, endDate) {
    if (startDate) {
      this.selectedStartDate_ = startDate;
      const formattedDate = startDate ? this.formats_.date(startDate) : '';
      this.element.setAttribute('start-date', formattedDate);
      this.updateDateField_(this.startDateField_, startDate);
    }
    if (endDate) {
      this.selectedEndDate_ = endDate;
      const formattedDate = endDate ? this.formats_.date(endDate) : '';
      this.element.setAttribute('end-date', formattedDate);
      this.updateDateField_(this.endDateField_, endDate);
    }

    const oneOf = startDate || endDate;
    if (oneOf) {
      if (!this.isVisibleDate_(oneOf)) {
        // We need to render some new months
        const newDisplayedDate = getFirstDayOfMonth(oneOf);
        this.setDisplayedDate_(newDisplayedDate, oneOf);
      }
      this.render_();
    }

    if (startDate && endDate) {
      const selectData = this.getSelectData_(startDate, endDate);
      this.triggerEvent_(DatePickerEvent.SELECT, selectData);
    }
  }

  /**
   * Clear the values from the input fields and
   * trigger events with the empty values.
   */
  handleClear_() {
    this.clearDateField_(this.dateField_);
    this.clearDateField_(this.startDateField_);
    this.clearDateField_(this.endDateField_);
    this.element.removeAttribute('date');
    this.element.removeAttribute('start-date');
    this.element.removeAttribute('end-date');

    this.selectedDate_ = this.selectedStartDate_ = this.selectedEndDate_ = null;

    if (this.type_ == DatePickerType.RANGE) {
      this.activeDate_ = ActiveDateState.START_DATE;
    }
    this.triggerEvent_(DatePickerEvent.SELECT, null);

    if (this.reopenPickerOnClearDate_) {
      this.updateDateFieldFocus_(this.startDateField_, true);
      this.triggerEvent_(DatePickerEvent.ACTIVATE);
      this.transitionTo_(DatePickerState.OVERLAY_OPEN_INPUT);
    }
    this.render_();
  }

  /** @override */
  layoutCallback() {
    const ampdoc = this.getAmpDoc();
    const root = ampdoc.getRootNode().documentElement || ampdoc.getBody();
    // TODO(cvializ): down arrow trigger overlay
    listen(root, 'focusin', this.handleFocus_.bind(this));
    listen(
      root,
      'input',
      debounce(this.win, this.handleInput_.bind(this), 1000)
    );

    if (this.mode_ == DatePickerMode.OVERLAY) {
      listen(root, 'click', this.handleClick_.bind(this));
    }
    listen(root, 'keydown', this.handleKeydown_.bind(this));

    this.parseSrcData_();

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
   * Trigger the activate AMP action. Triggered when the overlay opens or when
   * the static date picker should receive focus from the attached input.
   * @param {string} name
   * @param {?BindDatesDetails|?BindDateDetails=} opt_data
   * @private
   */
  triggerEvent_(name, opt_data = null) {
    const event = createCustomEvent(this.win, `${TAG}.${name}`, opt_data);
    this.action_.trigger(this.element, name, event, ActionTrust.HIGH);
  }

  /**
   * Create the response for the 'select' AMP event.
   * @param {?Date} dateOrStartDate
   * @param {?Date=} endDate
   * @return {?BindDatesDetails|?BindDateDetails}
   * @private
   */
  getSelectData_(dateOrStartDate, endDate = null) {
    if (this.type_ == DatePickerType.SINGLE) {
      return this.getBindDate_(dateOrStartDate);
    } else if (this.type_ == DatePickerType.RANGE) {
      return dateOrStartDate
        ? this.getBindDates_(dateOrStartDate, endDate)
        : null;
    } else {
      dev().error(TAG, 'Invalid date picker type');
      return null;
    }
  }

  /**
   * Create a date object to be consumed by AMP actions and events or amp-bind.
   * @param {?Date} date
   * @return {?BindDateDetails}
   * @private
   */
  getBindDate_(date) {
    if (!date) {
      return null;
    }
    // TODO(cvializ): Improve bind date object
    // const template = this.getDayTemplate_(date);
    const formattedDate = date ? this.formats_.date(date) : '';
    const details = new BindDateDetails(formattedDate, null);
    return details;
  }

  /**
   * Create an array for date objects to be consumed by AMP actions and events
   * or amp-bind.
   * @param {!Date} start
   * @param {?Date} end
   * @return {!BindDatesDetails}
   * @private
   */
  getBindDates_(start, end) {
    const dates = [];
    for (let date = start; date < end; date = addToDate(date, 0, 0, 1)) {
      dates.push(this.getBindDate_(date));
    }
    return new BindDatesDetails(dates);
  }

  /**
   * Handle changing values of the attached input fields, and the hotkey for
   * closing the date picker.
   * @param {!Event} e
   * @return {boolean}
   * @private
   */
  handleKeydown_(e) {
    const target = dev().assertElement(e.target);
    if (this.isDateField_(target)) {
      this.handleInputKeydown_(e); // TODO(cvializ): should this return?
    } else {
      return this.handleDocumentKeydown_(e);
    }
  }

  /**
   * Close the date picker overlay when the escape key is pressed.
   * @param {!Event} e
   * @return {boolean}
   * @private
   */
  handleDocumentKeydown_(e) {
    if (
      e.key == KeyCodes.ESCAPE &&
      this.mode_ == DatePickerMode.OVERLAY &&
      this.element.contains(this.document_.activeElement)
    ) {
      this.transitionTo_(DatePickerState.OVERLAY_CLOSED);
    }
    return true; // TODO(cvializ): why is return true needed.
  }

  /**
   * Handle the states for keyboard input.
   * @param {!Event} e
   * @private
   */
  handleInputKeydown_(e) {
    const target = dev().assertElement(e.target);
    if (!this.isDateField_(target) || target.type == 'hidden') {
      return;
    }

    if (e.keyCode == KeyCodes.DOWN_ARROW) {
      this.updateDateFieldFocus_(target);
      this.transitionTo_(DatePickerState.OVERLAY_OPEN_PICKER);
      if (this.mode_ === DatePickerMode.STATIC) {
        this.triggerEvent_(DatePickerEvent.ACTIVATE);
        // TODO(cvializ): Automatically focus the date?
      }
      e.preventDefault();
    } else if (e.keyCode == KeyCodes.ESCAPE) {
      this.transitionTo_(DatePickerState.OVERLAY_CLOSED);
    } else {
      this.transitionTo_(DatePickerState.OVERLAY_OPEN_INPUT);
    }
  }

  /**
   * Handle clicks inside and outside of the date picker to detect when to
   * open and close the date picker.
   * @param {!Event} e
   * @private
   */
  handleClick_(e) {
    const target = dev().assertElement(e.target);
    const clickWasInDatePicker =
      this.container_.contains(target) || this.isDateField_(target);

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
    if (e.target.tagName == 'BUTTON') {
      return;
    }
    if (Number(e.target.dataset['iAmphtmlDate']) == Number(this.focusedDate_)) {
      return;
    }
    this.maybeTransitionWithFocusChange_(dev().assertElement(e.target));
  }

  /**
   * For inputs that are valid dates, update the date-picker value.
   * @param {!Event} e
   * @private
   */
  handleInput_(e) {
    if (!this.parser_) {
      return;
    }

    const target = dev().assertElement(e.target);
    // TODO(cvializ): Is it possible for input to be triggered on hidden?
    // If so, this hidden check can be removed
    if (!this.isDateField_(target) || target.type == 'hidden') {
      return;
    }

    const stringValue = target.value || '';
    this.parser_.parse(stringValue).then(parsedValue => {
      if (isNaN(parsedValue)) {
        return;
      }
      if (target === this.dateField_) {
        this.handleSetDate_(parsedValue);
      } else if (target === this.startDateField_) {
        this.handleSetDates_(parsedValue, null);
      } else if (target === this.endDateField_) {
        this.handleSetDates_(null, parsedValue);
      }
      this.render_();
    });
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
    if (this.mode_ == DatePickerMode.STATIC) {
      return;
    }

    const toggle = typeof opt_toggle != 'undefined' ? opt_toggle : true;
    this.toggleDateFieldClass_(this.startDateField_, INPUT_FOCUS_CSS, false);
    this.toggleDateFieldClass_(this.endDateField_, INPUT_FOCUS_CSS, false);
    this.toggleDateFieldClass_(this.dateField_, INPUT_FOCUS_CSS, false);
    this.toggleDateFieldClass_(focusedField, INPUT_FOCUS_CSS, toggle);
  }

  /**
   * Toggle the provided class on the given input
   * @param {?Element} field An input field
   * @param {string} className A css classname
   * @param {boolean=} value
   * @private
   */
  toggleDateFieldClass_(field, className, value) {
    if (field) {
      this.mutateElement(() => field.classList.toggle(className, value), field);
    }
  }

  /**
   * Update the displayed date state.
   * @param {!Date} date
   */
  onDisplayedDateChange_(date) {
    if (this.monthTranslate_ != 0) {
      return;
    }

    if (this.fullscreen_) {
      this.setDisplayedDate_(date);
      this.render_();
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
      'ease-in-out'
    ).thenAlways(() => {
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
        this.dateChanged_();
        // Remain in the single date DATE state
        break;
      case ActiveDateState.START_DATE:
        this.selectedStartDate_ = date;
        this.activeDate_ = ActiveDateState.END_DATE;
        this.updateDateFieldFocus_(this.endDateField_);
        this.datesChanged_();
        break;
      case ActiveDateState.END_DATE:
        if (!date) {
          this.selectedEndDate_ = date;
          this.datesChanged_();
          break;
        }

        if (!this.selectedStartDate_) {
          this.selectedEndDate_ = date;
          this.activeDate_ = ActiveDateState.START_DATE;
          this.updateDateFieldFocus_(this.startDateField_);
          this.datesChanged_();
          break;
        }

        if (isAfterInclusive(date, this.selectedStartDate_)) {
          if (this.canSelectRange_(this.selectedStartDate_, date)) {
            this.selectedEndDate_ = date;
          }
        } else {
          this.selectedStartDate_ = date;
          this.selectedEndDate_ = null;
        }
        this.datesChanged_();
        // Remain in END_DATE state.
        break;
      default:
    }

    if (date) {
      this.focusedDate_ = date;

      // If the selected date is not visible in the rendered date, render it.
      if (!this.isVisibleDate_(date)) {
        this.setDisplayedDate_(getFirstDayOfMonth(date));
      }
    }

    this.render_();
  }

  /**
   * Perform actions that happen when the date field changes.
   */
  dateChanged_() {
    this.triggerEvent_(
      DatePickerEvent.SELECT,
      this.getSelectData_(this.selectedDate_)
    );
    this.updateDateField_(this.dateField_, this.selectedDate_);
    const formattedDate = this.selectedDate_
      ? this.formats_.date(this.selectedDate_)
      : '';
    this.element.setAttribute('date', formattedDate);

    if (!this.keepOpenOnDateSelect_) {
      this.transitionTo_(DatePickerState.OVERLAY_CLOSED);
    }
  }

  /**
   * Perform actions that happen when the date fields change.
   */
  datesChanged_() {
    const isFinalSelection =
      !this.keepOpenOnDateSelect_ &&
      this.activeDate_ != ActiveDateState.END_DATE;

    const selectData = this.getSelectData_(
      this.selectedStartDate_,
      this.selectedEndDate_
    );
    this.triggerEvent_(DatePickerEvent.SELECT, selectData);

    this.updateDateField_(this.startDateField_, this.selectedStartDate_);
    const formattedStartDate = this.selectedStartDate_
      ? this.formats_.date(this.selectedStartDate_)
      : '';
    this.element.setAttribute('start-date', formattedStartDate);
    this.updateDateField_(this.endDateField_, this.selectedEndDate_);

    const formattedEndDate = this.selectedEndDate_
      ? this.formats_.date(this.selectedEndDate_)
      : '';
    this.element.setAttribute('end-date', formattedEndDate);

    if (isFinalSelection && this.selectedStartDate_ && this.selectedEndDate_) {
      this.transitionTo_(DatePickerState.OVERLAY_CLOSED);
      this.triggerEvent_(DatePickerEvent.DEACTIVATE);
    }
  }

  /**
   * Clear the value from the given input field.
   * @param {?Element} field An input field
   * @private
   */
  clearDateField_(field) {
    if (field) {
      field.value = '';
    }
  }

  /**
   * Assign the provided date value to the given input.
   * input[type="date"] expects YYYY-MM-DD for setting its value,
   * so it is special-cased here.
   * @param {?Element} field An input field
   * @param {?Date} date A date value
   * @private
   */
  updateDateField_(field, date) {
    if (!field) {
      return;
    }
    if (!date) {
      field.value = '';
      return;
    }

    // TODO(cvializ): For now use YYYY-MM-DD for both
    const year = date.getFullYear();
    const month = date.toLocaleString('en-US', {month: '2-digit'});
    const day = date.toLocaleString('en-US', {day: '2-digit'});
    field.value =
      field.type == 'date'
        ? `${year}-${month}-${day}`
        : `${year}-${month}-${day}`;
  }

  /**
   * Check if the given date is currently shown in the calendar.
   * @param {!Date} date
   * @return {boolean}
   */
  isVisibleDate_(date) {
    const lastDisplayedDate = addToDate(
      this.displayedDate_,
      0,
      this.numberOfMonths_
    );
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
      `[data-i-amphtml-date=${escapeCssSelectorIdent(m)}]:not(.outside)`
    );
    if (!destinationElement) {
      return false;
    } else {
      this.mutateElement(() => destinationElement.focus());
      return true;
    }
  }

  /** @override */
  isLayoutSupported(layout) {
    return this.mode_ == DatePickerMode.STATIC
      ? isLayoutSizeDefined(layout)
      : layout == Layout.CONTAINER;
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
   * Fetch json
   * @param {string} src
   * @return {!Promise}
   */
  fetchSrc_() {
    return this.element.getAttribute('src')
      ? batchFetchJsonFor(this.getAmpDoc(), this.element)
      : Promise.resolve();
  }

  /**
   * TODO: implement
   * @return {!Promise}
   */
  parseSrcData_() {
    return this.fetchSrc_().then(json => {
      if (!json) {
        return;
      }

      const date = json['date'];
      const startDate = json['startDate'];
      const endDate = json['endDate'];
      const highlighted = json['highlighted'];
      const blocked = json['blocked'];

      const shouldSetDate = !this.dateField_ || !this.dateField_.value;
      const shouldSetStartDate =
        !this.startDateField_ || !this.startDateField_.value;
      const shouldSetEndDate = !this.endDateField_ || !this.endDateField_.value;

      // if (shouldSetDate && date !== undefined) {
      //   this.handleSetDateFromString_(date || '');
      // }

      // if (shouldSetStartDate && startDate !== undefined) {
      //   this.handleSetDatesFromString_(startDate)
      //   this.startDate_ = startDate ? parseIsoDateToLocal(startDate) : null;
      // }

      // if (shouldSetEndDate && endDate !== undefined) {
      //   this.endDate_ = endDate ? parseIsoDateToLocal(endDate) : null;
      // }

      this.highlighted = highlighted
        ? highlighted.map(v => parseIsoDateToLocal(v))
        : [];
      this.blocked = blocked ? blocked.map(v => parseIsoDateToLocal(v)) : [];

      this.render_();
    });
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
      this.type_ == DatePickerType.RANGE
        ? this.activeDate_ == ActiveDateState.START_DATE
          ? chooseAvailableStartDate
          : chooseAvailableEndDate
        : chooseAvailableDate;

    return phrases;
  }

  /**
   * @return {!Object<string,function(!Date):boolean>}
   * @private
   */
  createModifiers_() {
    return {
      [DayStates.AFTER_HOVERED_START]: date => this.afterHoveredStart_(date),
      [DayStates.BLOCKED_CALENDAR]: date => this.isBlocked_(date),
      [DayStates.BLOCKED_MINIMUM_NIGHTS]: date =>
        this.isBlockedMinimumNights_(date),
      [DayStates.BLOCKED_OUT_OF_RANGE]: date => this.isBlockedOutOfRange_(date),
      [DayStates.HIGHLIGHTED_CALENDAR]: date => this.isHighlighted_(date),
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
      const lastMinimumNight = addToDate(
        this.selectedStartDate_,
        0,
        0,
        this.minimumNights_
      );
      const isMinimumNight = isBetween(
        this.selectedStartDate_,
        lastMinimumNight,
        this.hoveredDate_
      );
      if (isMinimumNight) {
        return false;
      }
    }

    return isBetweenInclusive(this.selectedStartDate_, this.hoveredDate_, date);
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

    return (
      this.isSelectedSpan_(date) &&
      isSameDay(addToDate(date, 0, 0, 1), this.selectedEndDate_)
    );
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

    const lastMinimumNight = addToDate(
      this.selectedStartDate_,
      0,
      0,
      this.minimumNights_
    );
    return (
      isSameDay(date, this.selectedStartDate_) ||
      isBetween(this.selectedStartDate_, lastMinimumNight, date)
    );
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
    return (
      !!this.selectedStartDate_ && isSameDay(date, this.selectedStartDate_)
    );
  }

  /**
   *
   * @param {!Date} date
   * @return {boolean}
   * @private
   */
  isSelectedSpan_(date) {
    return (
      !!this.selectedStartDate_ &&
      !!this.selectedEndDate_ &&
      isBetween(this.selectedStartDate_, this.selectedEndDate_, date)
    );
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
    return (
      !this.isBlocked_(date) &&
      !this.isBlockedMinimumNights_(date) &&
      !this.isBlockedOutOfRange_(date)
    ); // TODO(cvializ): minimum nights?
  }

  /**
   * @param {!Date} start
   * @param {!Date} end
   * @return {boolean}
   * @private
   */
  canSelectRange_(start, end) {
    for (let date = start; date < end; date = addToDate(date, 0, 0, 1)) {
      if (this.isBlocked_(date) && !this.allowBlockedRanges_) {
        return false;
      }
      if (this.isBlockedOutOfRange_(date)) {
        return false;
      }
    }
    return true;
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

    const primary =
      this.type_ == DatePickerType.SINGLE
        ? this.selectedDate_
        : this.selectedStartDate_ || this.selectedEndDate_;

    return primary || this.today_;
  }

  /**
   * Render the template that corresponds to the date with its data.
   * @param {!Date} date
   * @return {!Promise<string>}
   * @private
   */
  renderDayTemplate_(date) {
    const cachedDay = this.renderedTemplates_.get(date);
    if (cachedDay) {
      return cachedDay;
    }

    const template = this.getDayTemplate_(date);
    const data = getDayTemplateData(
      date,
      this.formats_,
      this.highlighted_,
      this.blocked_
    );
    const rendered = this.renderTemplate_(
      template,
      data,
      this.formats_.day(date)
    );
    this.renderedTemplates_.put(date, rendered);
    return rendered;
  }

  /**
   * Get the template tag corresponding to a given date.
   * @param {!moment} date
   * @return {?Element}
   * @private
   */
  getDayTemplate_(date) {
    return (
      // this.getTemplate_(this.srcTemplates_, date) ||
      // this.getTemplate_(this.elementTemplates_, date) ||
      // this.srcDefaultTemplate_ ||
      this.element.querySelector('[date-template][default]')
    );
  }

  /**
   * Render the given template with the given data. If the template does not
   * exist, use a fallback string.
   * The fallback string will be rendered directly into the DOM. Note that
   * it is currently just a date or an empty string, but if extended beyond
   * those cases, it should be sanitized.
   * @param {?Element} template
   * @param {!JsonObject=} opt_data
   * @param {string=} opt_fallback
   * @return {!Promise<string>}
   * @private
   */
  renderTemplate_(template, opt_data, opt_fallback = '') {
    if (template) {
      return this.renderTemplateElement_(template, opt_data);
    } else {
      return Promise.resolve(opt_fallback);
    }
  }

  /**
   * Render the given template into an element with the given data.
   * @param {!Element} template
   * @param {!JsonObject=} opt_data
   * @return {!Promise<!Element>}
   * @private
   */
  renderTemplateElement_(template, opt_data = /** @type {!JsonObject} */ ({})) {
    return this.templates_.renderTemplate(template, opt_data);
  }

  /**
   * @param {!Date} date
   * @return {!Promise}
   */
  renderDay_(date) {
    return this.renderDayTemplate_(date).then(rendered => {
      // TODO(cvializ): Figure out why using rendered directly makes the
      // last rows disappear. Nodes getting cleaned up too early?
      if (rendered.cloneNode) {
        return rendered.cloneNode(/** deep */ true);
      }
      return rendered;
    });
  }

  /**
   * Render the months.
   * @return {!Promise}
   * @private
   */
  render_() {
    return this.mutateElement(() => {
      return this.litCalendar_.render({
        daySize: this.daySize_,
        displayedDate: this.displayedDate_,
        enableOutsideDays: this.enableOutsideDays_,
        firstDayOfWeek: this.firstDayOfWeek_,
        focusedDate: this.focusedDate_,
        formats: this.formats_,
        fullscreen: this.fullscreen_,
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
        phrases: this.getPhrases_(),
        renderDay: this.boundRenderDay_,
      });
    });
  }

  /**
   * Sets the displayed date and if necessary updates the focused date
   * @param {!Date} date
   * @param {!Date=} opt_focusedDate
   * @private
   */
  setDisplayedDate_(date, opt_focusedDate) {
    // REVIEW: Unnecessary? Seems like a good sanity check.
    dev().assert(
      date.getDate() == 1,
      'Displayed date should always be set to the first day of the month'
    );
    this.displayedDate_ = date;
    const lastDisplayedDate = addToDate(date, 0, this.numberOfMonths_);
    if (!isBetween(this.displayedDate_, lastDisplayedDate, date)) {
      this.focusedDate_ = opt_focusedDate || date;
    }
    this.renderedTemplates_.clear(
      addToDate(this.displayedDate_, 0, -1),
      addToDate(lastDisplayedDate, 0, 1)
    );
  }
}

AMP.extension(TAG, '1.0', AMP => {
  AMP.registerElement(TAG, AmpDatePicker, CSS);
});
