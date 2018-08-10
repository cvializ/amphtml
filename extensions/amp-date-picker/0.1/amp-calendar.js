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

import {Layout} from '../../../src/layout';
import {htmlFor} from '../../../src/static-template';
import {iterateCursor} from '../../../src/dom';

// TODO(cvializ): Focus areas
// - RTL
// - Intl
// - Animation
// - Orientation flexibility
// - Interaction statefulness (highlights, selected, start and end, etc.)
//
const DAY_MILLISECONDS = 86400000;

export class AmpCalendar extends AMP.BaseElement {
  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    this.document_ = this.element.ownerDocument;

    this.displayedDate_ = new Date();

    this.selectedDate_ = null;

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
      if (e.target == this.next_) {
        this.displayedDate_ = getNextMonth(this.displayedDate_);
      } else if (e.target == this.prev_) {
        this.displayedDate_ = getPreviousMonth(this.displayedDate_);
      } else if (e.target == this.today_) {
        this.displayedDate_ = new Date();
      }
      this.renderMonths_();
    });
    this.renderMonths_();
    this.element.appendChild(this.container_);
  }

  /** @override */
  layoutCallback() {
    this.element.addEventListener('click', e => {
      const {target} = e;
      const date = Number(target.dataset.iAmphtmlDate);
      if (date) {
        this.selectedDate_ = new Date(date);
        console.log(this.selectedDate_);
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
    months.innerHTML = '';

    months.appendChild(renderMonth(doc, getPreviousMonth(
        this.displayedDate_),this.locale_, this.firstDayOfWeek_), this.isRtl_);
    months.appendChild(renderMonth(
        doc, this.displayedDate_, this.locale_, this.firstDayOfWeek_, this.isRtl_));
    months.appendChild(renderMonth(doc, getNextMonth(
        this.displayedDate_), this.locale_, this.firstDayOfWeek_, this.isRtl_));
  }

}

/**
 * Render a month
 * @param {!Document} doc
 * @param {!Date} date
 * @param {string} locale
 * @param {number} firstDayOfWeek
 * @param {boolean} isRtl
 * @return {!Element}
 */
function renderMonth(doc, date, locale, firstDayOfWeek, isRtl) {
  const calendarHtml = htmlFor(doc)`
  <div class="calendar-month" style="display: inline-block">
    <span class="month"></span>
    <table>
      <tr class="weekdays">
        <th></th><th></th><th></th><th></th><th></th><th></th><th></th>
      </tr>
      <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
      <tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>
    </table>
  </div>
  `;
  const firstWeekday = getFirstWeekday(date, firstDayOfWeek);
  const daysInMonth = getDaysInMonth(date);

  const title = calendarHtml.getElementsByClassName('month')[0];
  title.innerText =
      date.toLocaleString(locale, {month: 'long', year: 'numeric'});

  const weekdays = calendarHtml.getElementsByClassName('weekdays')[0].children;
  iterateCursor(weekdays, (weekday, i) => {
    weekday.innerText = getWeekdayName(i, locale, firstDayOfWeek, isRtl);
  });

  const dayCells = calendarHtml.getElementsByTagName('td');
  const dateMilliseconds = Number(getFirstDayOfMonth(date));
  let days = 0;
  iterateCursor(dayCells, (cell, i) => {
    if (i >= firstWeekday && days < daysInMonth) {
      const calendarDate = new Date(dateMilliseconds + DAY_MILLISECONDS * days++);
      cell.innerText = calendarDate.toLocaleString(locale, {day: '2-digit'});
      cell.dataset.iAmphtmlDate = Number(calendarDate);
    }
  });

  return calendarHtml;
}

/**
 * Get the next month
 * @param {!Date} date
 * @return {!Date}
 */
function getNextMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

/**
 * Get the previous month
 * @param {!Date} date
 * @return {!Date}
 */
function getPreviousMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() - 1, date.getDate());
}

/**
 * Get the weekday name of the current month
 * @param {number} index
 * @param {string} locale
 * @param {number} firstDayOfWeek
 * @param {boolean} isRtl
 * @return {string}
 */
function getWeekdayName(index, locale, firstDayOfWeek, isRtl) {
  index = isRtl ? -index : index;
  const date = new Date(1970, 0, 4 + index + firstDayOfWeek);
  return date.toLocaleString(locale, {weekday: 'narrow'});
}

/**
 * Get the number of days in the given date's month
 * @param {!Date} date
 * @return {number}
 */
function getDaysInMonth(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return new Date(year, month, 0).getDate();
}

/**
 * Get the first weekday of the month. 0-indexed for Sunday
 * @param {!Date} date
 * @param {number} firstDayOfWeek
 * @return {number}
 */
function getFirstWeekday(date, firstDayOfWeek) {
  const weekdayIndex = getFirstDayOfMonth(date).getDay();
  return (weekdayIndex - firstDayOfWeek + 7) % 7;
}

/**
 * Gets the first day of the month.
 * @param {!Date} date
 */
function getFirstDayOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
