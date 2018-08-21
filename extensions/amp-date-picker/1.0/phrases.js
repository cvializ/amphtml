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

/**
 * These keys will be used by publishers to specify i18n values.
 * @enum {string}
 */
export const Phrases = {
  CALENDAR_LABEL: 'calendar-label',
  CHOOSE_AVAILABLE_DATE: 'choose-available-date',
  CHOOSE_AVAILABLE_END_DATE: 'choose-available-end-date',
  CHOOSE_AVAILABLE_START_DATE: 'choose-available-start-date',
  CLEAR_DATE: 'clear-date',
  CLEAR_DATES: 'clear-dates',
  CLOSE_DATE_PICKER: 'close-date-picker',
  DATE_IS_UNAVAILABLE: 'date-is-unavailable',
  ENTER_KEY: 'enter-key',
  ESCAPE: 'escape',
  FOCUS_START_DATE: 'focus-start-date',
  HIDE_KEYBOARD_SHORTCUTS_PANEL: 'hide-keyboard-shortcuts-panel',
  HOME_END: 'home-end',
  JUMP_TO_NEXT_MONTH: 'jump-to-next-month',
  JUMP_TO_PREV_MONTH: 'jump-to-prev-month',
  KEYBOARD_NAVIGATION_INSTRUCTIONS: 'keyboard-navigation-instructions',
  KEYBOARD_SHORTCUTS: 'keyboard-shortcuts',
  LEFT_ARROW_RIGHT_ARROW: 'left-arrow-right-arrow',
  MOVE_FOCUS_BY_ONE_DAY: 'move-focus-by-one-day',
  MOVE_FOCUS_BY_ONE_MONTH: 'move-focus-by-one-month',
  MOVE_FOCUS_BY_ONE_WEEK: 'move-focus-by-one-week',
  MOVE_FOCUS_TO_START_AND_END_OF_WEEK: 'move-focus-to-start-and-end-of-week',
  OPEN_THIS_PANEL: 'open-this-panel',
  PAGE_UP_PAGE_DOWN: 'page-up-page-down',
  QUESTION_MARK: 'question-mark',
  RETURN_FOCUS_TO_INPUT: 'return-focus-to-input',
  SELECT_FOCUSED_DATE: 'select-focused-date',
  SHOW_KEYBOARD_SHORTCUTS_PANEL: 'show-keyboard-shortcuts-panel',
  UP_ARROW_DOWN_ARROW: 'up-arrow-down-arrow',
};

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
export const moveFocusToStartAndEndOfWeek = 'Go to the first or last day of a week.';
export const returnFocusToInput = 'Return to the date input field.';
export const keyboardNavigationInstructions = 'Press the down arrow key to interact with the calendar and export select a date. Press the question mark key to get the keyboard shortcuts for changing dates.';
export const chooseAvailableStartDate = 'Choose %s as your start date. It\'s available.';
export const chooseAvailableEndDate = 'Choose %s as your end date. It\'s available.';
export const chooseAvailableDate = '%s';
export const dateIsUnavailable = 'Not available. %s';
/* eslint-enable max-len */

export const defaultPhrases = {
  [Phrases.CALENDAR_LABEL]: calendarLabel,
  [Phrases.CHOOSE_AVAILABLE_DATE]: chooseAvailableDate,
  [Phrases.CLEAR_DATE]: clearDate,
  [Phrases.CLEAR_DATES]: clearDates,
  [Phrases.CLOSE_DATE_PICKER]: closeDatePicker,
  [Phrases.DATE_IS_UNAVAILABLE]: dateIsUnavailable,
  [Phrases.ENTER_KEY]: enterKey,
  [Phrases.ESCAPE]: escape,
  [Phrases.FOCUS_START_DATE]: focusStartDate, // TODO(cvializ): cancel?
  [Phrases.HIDE_KEYBOARD_SHORTCUTS_PANEL]: hideKeyboardShortcutsPanel,
  [Phrases.HOME_END]: homeEnd,
  [Phrases.JUMP_TO_NEXT_MONTH]: jumpToNextMonth,
  [Phrases.JUMP_TO_PREV_MONTH]: jumpToPrevMonth,
  [Phrases.KEYBOARD_NAVIGATION_INSTRUCTIONS]: keyboardNavigationInstructions,
  [Phrases.KEYBOARD_SHORTCUTS]: keyboardShortcuts,
  [Phrases.LEFT_ARROW_RIGHT_ARROW]: leftArrowRightArrow,
  [Phrases.MOVE_FOCUS_BY_ONE_DAY]: moveFocusByOneDay,
  [Phrases.MOVE_FOCUS_BY_ONE_MONTH]: moveFocusByOneMonth,
  [Phrases.MOVE_FOCUS_BY_ONE_WEEK]: moveFocusByOneWeek,
  [Phrases.MOVE_FOCUS_TO_START_AND_END_OF_WEEK]: moveFocusToStartAndEndOfWeek,
  [Phrases.OPEN_THIS_PANEL]: openThisPanel,
  [Phrases.PAGE_UP_PAGE_DOWN]: pageUpPageDown,
  [Phrases.QUESTION_MARK]: questionMark,
  [Phrases.RETURN_FOCUS_TO_INPUT]: returnFocusToInput,
  [Phrases.SELECT_FOCUSED_DATE]: selectFocusedDate,
  [Phrases.SHOW_KEYBOARD_SHORTCUTS_PANEL]: showKeyboardShortcutsPanel,
  [Phrases.UP_ARROW_DOWN_ARROW]: upArrowDownArrow,
};

/**
 * Matches the substitution token `%s`
 * REVIEW: Is there a better way to do substitutions like this?
 * An alternative I considered was an Array with spaces,
 * e.g. ['Select ', ' as your date'] and ['', ''] for the date by itself.
 */
const SUBSTITUTE_RE = /%s/g;

/**
 * @param {string} phrase
 * @param {{date: string}=} opt_args
 * @return {string}
 */
export function getPhrase(phrase, opt_args) {
  if (opt_args) {
    return phrase.replace(SUBSTITUTE_RE, opt_args.date);
  } else {
    return phrase;
  }
}

/** @typedef {!Object<string, string>} */
export let PhrasesDef;
