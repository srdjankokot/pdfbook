import React, {Component} from 'react';
import {
  Modal,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';

import {colors, radius, shadow, spacing} from './theme';
import {timeLabel, toArabicDigits} from './format';
import {PRAYER_NAMES, prayerLabel} from './prayer';

const OFFSETS = [0, 5, 10, 15, 20, 30, 45, 60];

/**
 * Card at the top of the index for the two reminders most people want: the
 * morning and evening adhkar, every day. A switch turns each one on or off;
 * each comes either at a fixed time or a number of minutes after its prayer
 * (Fajr, Asr), and both stay easy to adjust after the first run.
 *
 * `rows` is [{id, label, icon, hours, minutes, enabled, mode, offset, prayer}].
 */
export default class DailyReminders extends Component {
  state = {
    // The row whose clock time is being picked, or null.
    editing: null,
    // The row whose mode dialog is open, or null, and the choice in progress.
    choosing: null,
    draftMode: 'fixed',
    draftOffset: 15,
  };

  row(id) {
    return this.props.rows.find((r) => r.id === id);
  }

  pickerDate() {
    const row = this.row(this.state.editing);
    const date = new Date();
    if (row) {
      date.setHours(row.hours, row.minutes, 0, 0);
    }
    return date;
  }

  onConfirmTime = (date) => {
    const id = this.state.editing;
    this.setState({editing: null});
    this.props.onTimeChange(id, date.getHours(), date.getMinutes());
  };

  openModes(row) {
    this.setState({choosing: row.id, draftMode: row.mode, draftOffset: row.offset});
  }

  onTimePress(row) {
    if (row.mode === 'prayer') {
      this.openModes(row);
    } else {
      this.setState({editing: row.id});
    }
  }

  saveModes = () => {
    const {choosing, draftMode, draftOffset} = this.state;
    this.setState({choosing: null});
    this.props.onModeChange(choosing, draftMode, draftOffset);
  };

  renderOption(mode, text) {
    const selected = this.state.draftMode === mode;
    return (
      <TouchableOpacity
        style={[styles.option, selected && styles.optionOn]}
        activeOpacity={0.7}
        onPress={() => this.setState({draftMode: mode})}>
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected && <View style={styles.radioDot} />}
        </View>
        <Text style={styles.optionText}>{text}</Text>
      </TouchableOpacity>
    );
  }

  renderModeDialog() {
    const row = this.row(this.state.choosing);
    if (!row) {
      return null;
    }
    const {draftMode, draftOffset} = this.state;
    return (
      <Modal
        visible={true}
        transparent={true}
        animationType={'fade'}
        statusBarTranslucent={true}
        onRequestClose={() => this.setState({choosing: null})}>
        <TouchableWithoutFeedback onPress={() => this.setState({choosing: null})}>
          <View style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
              <View style={styles.dialog}>
                <Text style={styles.dialogTitle}>{row.label}</Text>
                <Text style={styles.dialogSubtitle}>متى يصل التذكير؟</Text>

                {this.renderOption('fixed', 'وقت ثابت')}
                {this.renderOption('prayer', `بعد صلاة ${PRAYER_NAMES[row.prayer]}`)}

                {draftMode === 'prayer' && (
                  <View>
                    <Text style={styles.offsetLabel}>بعد كم دقيقة؟</Text>
                    <View style={styles.offsets}>
                      {OFFSETS.map((offset) => (
                        <TouchableOpacity
                          key={offset}
                          style={[styles.offset, offset === draftOffset && styles.offsetOn]}
                          activeOpacity={0.7}
                          onPress={() => this.setState({draftOffset: offset})}>
                          <Text style={[styles.offsetText, offset === draftOffset && styles.offsetTextOn]}>
                            {toArabicDigits(offset)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Text style={styles.note}>يُحسب وقت الصلاة حسب موقعك التقريبي</Text>
                  </View>
                )}

                {/* Same order as the alarm dialog: cancel on the right. */}
                <View style={styles.buttons}>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonGhost]}
                    activeOpacity={0.7}
                    onPress={() => this.setState({choosing: null})}>
                    <Text style={styles.buttonGhostText}>إلغاء</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.buttonPrimary]}
                    activeOpacity={0.7}
                    onPress={this.saveModes}>
                    <Text style={styles.buttonPrimaryText}>حفظ</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  }

  render() {
    const {rows, onToggle} = this.props;
    const anyEnabled = rows.some((r) => r.enabled);

    return (
      <View style={styles.card}>
        <Text style={styles.title}>التذكير اليومي</Text>
        {!anyEnabled && (
          <Text style={styles.hint}>فعّل التذكير لأذكار الصباح والمساء</Text>
        )}

        {rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <Text style={styles.icon}>{row.icon}</Text>
            <View style={styles.labels}>
              <Text style={styles.label} numberOfLines={1}>{row.label}</Text>
              <TouchableOpacity
                activeOpacity={0.6}
                hitSlop={{top: 6, bottom: 6}}
                onPress={() => this.openModes(row)}>
                <Text style={styles.mode} numberOfLines={1}>
                  {row.mode === 'prayer' ? prayerLabel(row.prayer, row.offset) : 'وقت ثابت'} ▾
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.timeButton, !row.enabled && styles.timeButtonOff]}
              activeOpacity={0.7}
              onPress={() => this.onTimePress(row)}>
              <Text style={[styles.time, !row.enabled && styles.timeOff]}>
                {timeLabel(row.hours, row.minutes)}
              </Text>
            </TouchableOpacity>

            <Switch
              value={row.enabled}
              onValueChange={(value) => onToggle(row.id, value)}
              trackColor={{false: colors.border, true: colors.primary}}
              thumbColor={colors.surface}
            />
          </View>
        ))}

        <DateTimePicker
          isVisible={this.state.editing !== null}
          mode={'time'}
          date={this.pickerDate()}
          onConfirm={this.onConfirmTime}
          onCancel={() => this.setState({editing: null})}
        />
        {this.renderModeDialog()}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.primaryTint,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
  },
  hint: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  row: {
    // Reversed so the label reads from the right and the switch sits left.
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 22,
    fontSize: 16,
    color: colors.accent,
    textAlign: 'center',
  },
  labels: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  label: {
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
  },
  mode: {
    marginTop: 1,
    fontSize: 11,
    color: colors.primary,
    textAlign: 'right',
  },
  timeButton: {
    marginHorizontal: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  timeButtonOff: {
    backgroundColor: 'transparent',
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  timeOff: {
    color: colors.textMuted,
  },

  // Mode dialog
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    ...shadow(16),
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  dialogSubtitle: {
    marginTop: spacing.xs,
    marginBottom: spacing.md,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  option: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  optionText: {
    flex: 1,
    marginHorizontal: spacing.md,
    fontSize: 15,
    color: colors.text,
    textAlign: 'right',
  },
  offsetLabel: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'right',
  },
  offsets: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
  },
  offset: {
    minWidth: 52,
    paddingVertical: spacing.sm,
    margin: 3,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  offsetOn: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  offsetText: {
    fontSize: 15,
    color: colors.text,
  },
  offsetTextOn: {
    color: colors.surface,
    fontWeight: '700',
  },
  note: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'right',
  },
  buttons: {
    marginTop: spacing.lg,
    flexDirection: 'row-reverse',
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.xs,
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonPrimaryText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  buttonGhost: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonGhostText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
});
