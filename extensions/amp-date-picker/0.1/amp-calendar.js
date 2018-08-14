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

import {Layout} from '../../../src/layout';
import {
  getDaysInMonth,
  getFirstDayOfMonth,
  getFirstWeekday,
  getNextMonth,
  getPreviousMonth,
  getWeekdayName,
} from './util';
import {htmlFor} from '../../../src/static-template';
import {html as litHtml, render} from 'lit-html';
import {map} from '../../../src/utils/object';

// import {Component, render} from 'preact';

// TODO(cvializ): Focus areas
// - RTL
// - Intl
// - Animation
// - Orientation flexibility
// - Interaction statefulness (highlights, selected, start and end, etc.)
//
const DAY_MILLISECONDS = 86400000;

const CalendarStates = {
  AFTER_HOVERED_START: 'after-hovered-start',
  BLOCKED_CALENDAR: 'blocked-calendar',
  BLOCKED_MINIMUM_NIGHTS: 'blocked-minimum-nights',
  BLOCKED_OUT_OF_RANGE: 'blocked-out-of-range',
  HIGHLIGHTED_CALENDAR: 'highlighted-calendar',
  HOVERED_SPAN: 'hovered-span',
  LAST_IN_RANGE: 'last-in-range',
  SELECTED_END: 'selected-end',
  SELECTED_SPAN: 'selected-span',
  SELECTED_START: 'selected-start',
  SELECTED: 'selected',
  TODAY: 'today',
};

/**
 * Represents and controls a single date.
 */
class CalendarDay {
  /**
   *
   * @param {!Element} element
   * @param {Date} date
   */
  constructor(element, date) {
    this.element = element;

    this.date = date;

    this.element.dataset.iAmphtmlDate = Number(date);
  }

  /**
   *
   * @param {string} state
   * @param {boolean} value
   */
  toggleState(state, value) {

  }
}

export class AmpCalendar extends AMP.BaseElement {
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

    /** @private @const */
    this.firstDayOfWeek_ =
        Number(this.element.getAttribute('first-day-of-week')) || 0;


  }

  /** @override */
  buildCallback() {
    this.isRtl = this.document_.dir == 'rtl' ||
        this.element.hasAttribute('rtl');

    // This is a lit-html template function. It returns a lit-html template.
    const helloTemplate = name => litHtml`<div>Hello ${name}!</div>`;

    // This renders <div>Hello Steve!</div> to the document body
    render(helloTemplate('Steve'), this.element);

    const picker = htmlFor(this.document_)`
    <div class="picker">
      <button class="next">Next</button>
      <button class="previous">Prev</button>
      <button class="today">Today</button>
      <div class="months"></div>
    </div>
    `;
    this.container_ = picker;
    this.next_ = picker.getElementsByClassName('next')[0];
    this.prev_ = picker.getElementsByClassName('previous')[0];
    this.today_ = picker.getElementsByClassName('today')[0];

    this.element.addEventListener('click', e => {
      const {target} = e;

      const date = Number(target.dataset.iAmphtmlDate);
      if (date) {
        this.selectedDate_ = new Date(date);
        this.setSelectedDate_(this.selectedDate_);
      } else {
        if (e.target == this.next_) {
          this.displayedDate_ = getNextMonth(this.displayedDate_);
        } else if (e.target == this.prev_) {
          this.displayedDate_ = getPreviousMonth(this.displayedDate_);
        } else if (e.target == this.today_) {
          this.displayedDate_ = new Date();
        }
        this.renderMonths_();
      }
    });

    this.renderMonths_();
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
      }
    });
  }

  /** @override */
  isLayoutSupported(layout) {
    return layout == Layout.CONTAINER;
  }

  /**
   * Render the months
   */
  renderMonths_() {
    const doc = this.document_;
    const months = this.container_.getElementsByClassName('months')[0];
    // months.innerHTML = '';

    const month1 = renderMonth(doc, getPreviousMonth(
        this.displayedDate_), this.selectedDate_, this.locale_, this.firstDayOfWeek_, this.isRtl_);
    const month2 = renderMonth(
        doc, this.displayedDate_, this.selectedDate_, this.locale_, this.firstDayOfWeek_, this.isRtl_);
    const month3 = renderMonth(doc, getNextMonth(
        this.displayedDate_), this.selectedDate_, this.locale_, this.firstDayOfWeek_, this.isRtl_);

    render(litHtml`${month1}${month2}${month3}`, months);
  }

  /** Update the selected date */
  setSelectedDate_(date) {
    this.selectedDate_ = new Date(date);
    this.renderMonths_();
  }
}

/**
 * Render a month
 * @param {!Document} doc
 * @param {!Date} month
 * @param {!Date} selectedDate
 * @param {string} locale
 * @param {number} firstDayOfWeek
 * @param {boolean} isRtl
 * @return {!Element}
 */
function renderMonth(doc, month, selectedDate, locale, firstDayOfWeek, isRtl) {

  const title = month.toLocaleString(locale, {month: 'long', year: 'numeric'});

  const weekdays = [];
  for (let i = 0; i < 7; i++) {
    weekdays.push(
        litHtml`<th>${getWeekdayName(i, locale, firstDayOfWeek, isRtl)}</th>`);
  }

  const cells = generateCalendarCells(month, locale, firstDayOfWeek, selectedDate);
  const c = () => {
    const {value, label, selected} = cells();
    return value ?
      litHtml`<td class="${selected ? 'selected' : ''}" data-i-amphtml-date=${Number(value)}>${label}</td>` :
      litHtml`<td></td>`;
  };

  const calendarHtml = litHtml`
  <div class="calendar-month">
    <span class="month">${title}</span>
    <table>
      <tr class="weekdays">${weekdays}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
      <tr>${c()}${c()}${c()}${c()}${c()}${c()}${c()}</tr>
    </table>
  </div>
  `;

  return calendarHtml;
}

/**
 *
 * @param {!Date} date
 * @param {string} locale
 * @param {number} firstDayOfWeek
 * @param {?Date} selectedDate
 * @return {function()}
 */
function generateCalendarCells(date, locale, firstDayOfWeek, selectedDate) {
  const millis = Number(getFirstDayOfMonth(date));
  const firstWeekday = getFirstWeekday(date, firstDayOfWeek);
  const daysInMonth = getDaysInMonth(date);

  const cells = [];
  let days = 0;
  for (let week = 0; week < 6; week++) {
    for (let weekday = 0; weekday < 7; weekday++) {
      const isOutsideDay = (
        (week == 0 && weekday < firstWeekday) ||
         days >= daysInMonth
      );

      if (!isOutsideDay) {
        const value = new Date(millis + DAY_MILLISECONDS * days++);
        const label = value.toLocaleString(locale, {day: '2-digit'});
        const selected = selectedDate && Number(getDay(selectedDate)) == Number(getDay(value));
        cells.push({value, label, selected});
      } else {
        cells.push({});
      }
    }
  }

  let cellIndex = 0;
  return () => cells[cellIndex++];
}

/**
 * Gets the day at midnight local time
 * @param {!Date} date
 */
function getDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
