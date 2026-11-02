import React, {Component} from 'react';
import {StyleSheet, Text, TouchableOpacity, Vibration, View} from 'react-native';

import {colors, radius, shadow, spacing} from './theme';
import {toArabicDigits} from './format';

// The repeat counts the book asks for most ("ثلاث مرات", "مائة مرة"...);
// 0 counts without a target.
const TARGETS = [3, 7, 10, 33, 100, 0];
const ROUND_PATTERN = [0, 180, 90, 180];
const ROUND_BUZZ_MS = 450;

/**
 * A tasbih counter that sits in a corner of the reading screen, small enough
 * that the adhkar being counted stay readable and the page can still be
 * turned. The round button counts; next to it the target, reset and close.
 * Reaching the target vibrates longer and starts the next round. The count
 * lives only while the app is open.
 */
export default class Counter extends Component {
  state = {
    open: false,
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
    const {open, count, rounds, target} = this.state;

    if (!open) {
      return (
        <TouchableOpacity
          style={[styles.corner, styles.openButton]}
          activeOpacity={0.8}
          onPress={() => this.setState({open: true})}>
          <Text style={styles.openText}>عدّاد</Text>
        </TouchableOpacity>
      );
    }

    return (
      <View style={[styles.corner, styles.bar]}>
        <TouchableOpacity style={styles.circle} activeOpacity={0.8} onPress={this.tap}>
          <Text style={styles.count}>{toArabicDigits(count)}</Text>
          {target > 0 && <Text style={styles.of}>من {toArabicDigits(target)}</Text>}
        </TouchableOpacity>

        <View style={styles.side}>
          <TouchableOpacity style={styles.chip} activeOpacity={0.7} onPress={this.nextTarget}>
            <Text style={styles.chipText}>
              {target > 0 ? 'العدد: ' + toArabicDigits(target) : 'بلا حد'}
            </Text>
          </TouchableOpacity>
          {target > 0 && rounds > 0 && (
            <Text style={styles.rounds}>الدورات: {toArabicDigits(rounds)}</Text>
          )}
          <View style={styles.actions}>
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
              onPress={() => this.setState({open: false})}>
              <Text style={styles.iconText}>×</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

const CIRCLE = 84;

const styles = StyleSheet.create({
  corner: {
    position: 'absolute',
    left: spacing.lg,
    bottom: spacing.xl + spacing.lg,
  },
  openButton: {
    minWidth: 56,
    height: 56,
    paddingHorizontal: spacing.md,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(6),
  },
  openText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.surface,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.96)',
    ...shadow(8),
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
  side: {
    marginLeft: spacing.sm,
    alignItems: 'flex-start',
  },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  rounds: {
    marginTop: 4,
    fontSize: 11,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 6,
  },
  icon: {
    width: 30,
    height: 30,
    marginRight: spacing.xs,
    borderRadius: 15,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 17,
    lineHeight: 20,
    color: colors.textMuted,
  },
});
