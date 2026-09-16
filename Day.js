import React from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';
import { colors, radius } from './theme';

// Short Arabic weekday labels, keyed the same way as JS getDay():
// 0 الأحد, 1 الاثنين, 2 الثلاثاء, 3 الأربعاء, 4 الخميس, 5 الجمعة, 6 السبت
const daysMapping = {0: 'أح', 1: 'إث', 2: 'ثل', 3: 'أر', 4: 'خم', 5: 'جم', 6: 'سب'};

export default function Day(props) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={ [props.style, styles.default, props.isActive ? styles.active : styles.inactive]}
      onPress={() => props.toggleDay(props.day)}
    >
      <Text style={props.isActive ? styles.activeText : styles.inactiveText}>
        {daysMapping[props.day]}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  default:{
    height: 40,
    width: 40,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center'
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  inactive: {
    backgroundColor: colors.surface,
    borderColor: colors.border
  },
  activeText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '700'
  },
  inactiveText: {
    color: colors.textMuted,
    fontSize: 13
  }
});
