import React, {Component} from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Vibration,
  View,
} from 'react-native';

import {colors, radius, shadow, spacing} from './theme';
import {toArabicDigits} from './format';

// The repeat counts the book asks for most ("ثلاث مرات", "مائة مرة"...);
// 0 counts without a target.
const TARGETS = [3, 7, 10, 33, 100, 0];
const ROUND_PATTERN = [0, 180, 90, 180];
const ROUND_BUZZ_MS = 450;

/**
 * A tasbih counter over the page being read: the whole circle is the button,
 * so it can be tapped without looking. Reaching the target vibrates longer
 * and starts the next round. The count lives only while the app is open.
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

  setTarget(target) {
    this.setState({target, count: 0, rounds: 0});
  }

  render() {
    const {visible, onClose} = this.props;
    const {count, rounds, target} = this.state;

    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType={'slide'}
        statusBarTranslucent={true}
        onRequestClose={onClose}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.sheet}>
                <View style={styles.header}>
                  <Text style={styles.title}>العدّاد</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                    <Text style={styles.close}>×</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.targets}>
                  {TARGETS.map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.target, t === target && styles.targetOn]}
                      activeOpacity={0.7}
                      onPress={() => this.setTarget(t)}>
                      <Text style={[styles.targetText, t === target && styles.targetTextOn]}>
                        {t === 0 ? 'بلا حد' : toArabicDigits(t)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.circle}
                  activeOpacity={0.85}
                  onPress={this.tap}>
                  <Text style={styles.count}>{toArabicDigits(count)}</Text>
                  {target > 0 && (
                    <Text style={styles.of}>من {toArabicDigits(target)}</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.footer}>
                  <Text style={styles.rounds}>
                    {target > 0 ? 'الدورات المكتملة: ' + toArabicDigits(rounds) : 'اضغط على الدائرة للعدّ'}
                  </Text>
                  <TouchableOpacity
                    style={styles.reset}
                    activeOpacity={0.7}
                    onPress={this.reset}>
                    <Text style={styles.resetText}>إعادة</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }
}

const CIRCLE = 200;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(12, 32, 24, 0.25)',
  },
  sheet: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 480,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl + spacing.lg,
    ...shadow(16),
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  close: {
    fontSize: 26,
    lineHeight: 28,
    color: colors.textMuted,
  },
  targets: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  target: {
    minWidth: 48,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    margin: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  targetOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  targetText: {
    fontSize: 14,
    color: colors.text,
  },
  targetTextOn: {
    color: colors.surface,
    fontWeight: '700',
  },
  circle: {
    alignSelf: 'center',
    width: CIRCLE,
    height: CIRCLE,
    borderRadius: CIRCLE / 2,
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(6),
  },
  count: {
    fontSize: 64,
    fontWeight: '300',
    color: colors.surface,
  },
  of: {
    marginTop: -4,
    fontSize: 15,
    color: 'rgba(255,255,255,0.8)',
  },
  footer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  rounds: {
    fontSize: 14,
    color: colors.textMuted,
  },
  reset: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
