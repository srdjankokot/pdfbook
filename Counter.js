import React, {Component} from 'react';
import {StyleSheet, Text, TouchableOpacity, Vibration, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {colors, radius, shadow, spacing} from './theme';
import {toArabicDigits} from './format';

// The repeat counts the book asks for most ("ثلاث مرات", "مائة مرة"...);
// 0 counts without a target.
const TARGETS = [3, 7, 10, 33, 100, 0];
const ROUND_PATTERN = [0, 180, 90, 180];
const ROUND_BUZZ_MS = 450;

/**
 * A tasbih counter docked as a bar under the book. It takes its own space in
 * the layout, so the page shrinks above it instead of being covered, whatever
 * the page's margins. The round button counts; beside it the target, reset
 * and close. Reaching the target vibrates longer and starts the next round.
 *
 * Kept mounted while hidden (`open` false), so the count survives closing it.
 */
export default class Counter extends Component {
  state = {
    count: 0,
    rounds: 0,
    target: 33,
  };

  tap = () => {
    const {count, rounds, target} = this.state;
    const next = count + 1;
    if (target > 0 && next >= target) {
      Vibration.vibrate(ROUND_PATTERN);
      this.roundEndedAt = Date.now();
      this.setState({count: 0, rounds: rounds + 1});
    } else {
      // A new vibration cancels the one playing, so a quick tap right after a
      // round would cut short the buzz that marks it.
      if (!(Date.now() - this.roundEndedAt < ROUND_BUZZ_MS)) {
        Vibration.vibrate(12);
      }
      this.setState({count: next});
    }
  };

  reset = () => {
    this.setState({count: 0, rounds: 0});
  };

  /** Steps through the targets; changing it starts counting again. */
  nextTarget = () => {
    const index = TARGETS.indexOf(this.state.target);
    this.setState({target: TARGETS[(index + 1) % TARGETS.length], count: 0, rounds: 0});
  };

  render() {
    if (!this.props.open) {
      return null;
    }
    const {count, rounds, target} = this.state;

    return (
      <SafeAreaView edges={['bottom']} style={styles.bar}>
        <View style={styles.row}>
          {/* Reversed: target on the right, the counting button in the middle,
              reset and close on the left. */}
          <View style={styles.side}>
            <TouchableOpacity style={styles.chip} activeOpacity={0.7} onPress={this.nextTarget}>
              <Text style={styles.chipText}>
                {target > 0 ? 'العدد: ' + toArabicDigits(target) : 'بلا حد'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.rounds}>
              {target > 0 ? 'الدورات: ' + toArabicDigits(rounds) : ' '}
            </Text>
          </View>

          <TouchableOpacity style={styles.circle} activeOpacity={0.8} onPress={this.tap}>
            <Text style={styles.count}>{toArabicDigits(count)}</Text>
            {target > 0 && <Text style={styles.of}>من {toArabicDigits(target)}</Text>}
          </TouchableOpacity>

          <View style={[styles.side, styles.actions]}>
            <TouchableOpacity
              style={styles.icon}
              activeOpacity={0.7}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
              onPress={this.reset}>
              <Text style={styles.iconText}>↺</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.icon}
              activeOpacity={0.7}
              hitSlop={{top: 6, bottom: 6, left: 6, right: 6}}
              onPress={this.props.onClose}>
              <Text style={styles.iconText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }
}

const CIRCLE = 84;

const styles = StyleSheet.create({
  bar: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadow(8),
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  side: {
    flex: 1,
    alignItems: 'flex-end',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  circle: {
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '600',
    color: colors.surface,
  },
  of: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  rounds: {
    marginTop: 6,
    fontSize: 12,
    color: colors.textMuted,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
    lineHeight: 24,
    color: colors.textMuted,
  },
});
