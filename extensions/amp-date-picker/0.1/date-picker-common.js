/**
 * Copyright 2017 The AMP HTML Authors. All Rights Reserved.
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

import {omit} from '../../../src/utils/object';


/**
 * A higher-order component that wraps a specific date-picker implmentation
 * with common functionality.
 * @param {!Object} React
 * @param {!Object} PropTypes
 * @param {!Object} ReactDates
 * @param {!Object} ReactDatesConstants
 * @param {!moment} moment
 * @param {!Object} WrappedComponent A date-picker component to wrap
 * @return {!React.Component} A date picker component with common functionality
 */
export function withDatePickerCommon(
    React, PropTypes, ReactDates, ReactDatesConstants, moment,
    WrappedComponent) {

  const {isInclusivelyAfterDay, isInclusivelyBeforeDay} = ReactDates;

  /**
   * @param {!moment} max
   */
  function getDefaultMinDate(max) {
    const today = moment();
    if (max) {
      return !isInclusivelyAfterDay(today, moment(max)) ? today : '';
    } else {
      return today;
    }
  }

  /**
   * @param {string} min
   * @param {string} max
   * @param {!moment} date
   */
  function isOutsideRange(min, max, date) {
    const maxInclusive = max && moment(max);
    const minInclusive = min && moment(min);
    if (!maxInclusive && !minInclusive) {
      return false;
    } else if (!minInclusive) {
      return !isInclusivelyBeforeDay(date, maxInclusive);
    } else if (!maxInclusive) {
      return !isInclusivelyAfterDay(date, minInclusive);
    } else {
      return !date.isBetween(minInclusive, maxInclusive);
    }
  }

  const propTypes = {
    blocked: PropTypes.object,
    highlighted: PropTypes.object,
    initialVisibleMonth: PropTypes.string,
    max: PropTypes.string,
    min: PropTypes.string,
    installActionHandler: PropTypes.func,
    src: PropTypes.string,
  };

  const defaultProps = {
    blocked: null,
    highlighted: null,
    initialVisibleMonth: '',
    max: '',
    min: '',
    installActionHandler: null,
    src: '',
  };

  class Component extends React.Component {
    constructor(props) {
      super(props);

      const {min, max, blocked, highlighted} = this.props;

      this.state = {
        blocked,
        highlighted,
        max,
        min: min || getDefaultMinDate(max),
      };

      this.isDayBlocked = this.isDayBlocked.bind(this);
      this.isDayHighlighted = this.isDayHighlighted.bind(this);
      this.isOutsideRange = this.isOutsideRange.bind(this);
    }

    /**
     * @param {!moment} day
     */
    isDayBlocked(day) {
      return this.state.blocked.contains(day);
    }

    /**
     * @param {!moment} day
     */
    isDayHighlighted(day) {
      return this.state.highlighted.contains(day);
    }

    /**
     * @param {!moment} day
     */
    isOutsideRange(day) {
      return isOutsideRange(this.state.min, this.state.max, day);
    }

    /** @override */
    render() {
      const props = omit(this.props, Object.keys(defaultProps));

      if (this.props.initialVisibleMonth) {
        props.initialVisibleMonth =
            () => moment(this.props.initialVisibleMonth);
      }

      return React.createElement(WrappedComponent, Object.assign({}, props, {
        daySize: Number(props.daySize),
        installActionHandler: this.props.installActionHandler,
        isDayBlocked: this.isDayBlocked,
        isDayHighlighted: this.isDayHighlighted,
        isOutsideRange: this.isOutsideRange,
      }));
    }
  };

  Component.defaultProps = defaultProps;
  Component.propTypes = propTypes;

  return Component;
}
