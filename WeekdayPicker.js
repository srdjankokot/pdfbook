import React from 'react';
import {
  View,
  StyleSheet,
} from 'react-native';
import Day from './Day';
import { spacing } from './theme';

// Fixed order so the week always reads الأحد → السبت from the right,
// regardless of the key order of the `days` object we are handed.
const WEEK_ORDER = [0, 1, 2, 3, 4, 5, 6];

WeekdayPicker.defaultProps = {
    onChange: null,
    style: null,
    dayStyle: null,
    days: { 1:1, 2:1 , 3:1 , 4:1 , 5:1, 6:0, 0:0 }
}

export default function WeekdayPicker(props){
  let { onChange, style, dayStyle, days } = props;
  /**
   * Function for toggling the day
   *
   * @param {String} day - Day of the week in one or two letters. e.g. M, Tu, W
   */
  const toggleDay = (day) => {
    // If the day is 0 set it 1, if 1 set 0
    days[day]
    ? days[day] = 0
    : days[day] = 1
    // Call the parent function to set the new reminder in the state
    onChange(days)
  }

  return (
    <View style={[styles.container, style]}>
        {WEEK_ORDER.map((day) => (
          <Day
            key={day}
            toggleDay={toggleDay}
            day={day}
            style={[styles.day, dayStyle]}
            isActive={1 === days[day]} // Pass boolean
          />
        ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container:{
    // Reversed so Sunday sits on the right, as an Arabic week reads.
    flexDirection: 'row-reverse',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  day: {
    marginHorizontal: 3
  }
});
