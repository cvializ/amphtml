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

/* eslint-disable max-len */ // REVIEW: is this ok?
export const calendarLabel = 'Calendar';
export const closeDatePicker = 'Close';
export const focusStartDate = 'Interact with the calendar and add the check-in date for your trip.';
export const clearDate = 'Clear Date';
export const clearDates = 'Clear Dates';
export const jumpToPrevMonth = 'Move backward to switch to the previous month.';
export const jumpToNextMonth = 'Move forward to switch to the next month.';
export const keyboardShortcuts = 'Keyboard Shortcuts';
export const showKeyboardShortcutsPanel = 'Open the keyboard shortcuts panel.';
export const hideKeyboardShortcutsPanel = 'Close the shortcuts panel.';
export const openThisPanel = 'Open this panel.';
export const enterKey = 'Enter key';
export const leftArrowRightArrow = 'Right and left arrow keys';
export const upArrowDownArrow = 'up and down arrow keys';
export const pageUpPageDown = 'page up and page down keys';
export const homeEnd = 'Home and end keys';
export const escape = 'Escape key';
export const questionMark = 'Question mark';
export const selectFocusedDate = 'Select the date in focus.';
export const moveFocusByOneDay = 'Move backward (left) and forward (right) by one day.';
export const moveFocusByOneWeek = 'Move backward (up) and forward (down) by one week.';
export const moveFocusByOneMonth = 'Switch months.';
export const moveFocustoStartAndEndOfWeek = 'Go to the first or last day of a week.';
export const returnFocusToInput = 'Return to the date input field.';
export const keyboardNavigationInstructions = 'Press the down arrow key to interact with the calendar and export select a date. Press the question mark key to get the keyboard shortcuts for changing dates.';
export const chooseAvailableStartDate = ({date}) => `Choose ${date} as your start date. It's available.`;
export const chooseAvailableEndDate = ({date}) => `Choose ${date} as your end date. It's available.`;
export const chooseAvailableDate = ({date}) => date;
export const dateIsUnavailable = ({date}) => `Not available. ${date}`;
/* eslint-enable max-len */

/**
 * @param {string|function(Object<string, string>)} phrase
 * @param {{date: string}} opt_args
 * @return {string}
 */
export function getPhrase(phrase, opt_args) {
  if (typeof phrase === 'string') {
    return phrase;
  }

  if (typeof phrase === 'function') {
    return phrase(opt_args);
  }

  return '';
}
