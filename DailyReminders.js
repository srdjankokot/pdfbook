import React, {Component} from 'react';
import {StyleSheet, Switch, Text, TouchableOpacity, View} from 'react-native';
import DateTimePicker from 'react-native-modal-datetime-picker';

import {colors, radius, spacing} from './theme';
import {timeLabel} from './format';

/**
 * Card at the top of the index for the two reminders most people want: the
 * morning and evening adhkar, every day. A switch turns each one on or off and
 * tapping its time changes it, so they stay easy to adjust after the first run.
 *
 * `rows` is [{id, label, icon, hours, minutes, enabled}].
 */
export default class DailyReminders extends Component {
  state = {
    // The row whose time is being edited, or null.
    editing: null,
  };

  pickerDate() {
    const row = this.props.rows.find((r) => r.id === this.state.editing);
    const date = new Date();
    if (row) {
      date.setHours(row.hours, row.minutes, 0, 0);
    }
    return date;
  }

  onConfirm = (date) => {
    const id = this.state.editing;
    this.setState({editing: null});
    this.props.onTimeChange(id, date.getHours(), date.getMinutes());
  };

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
            <Text style={styles.label} numberOfLines={1}>{row.label}</Text>

            <TouchableOpacity
              style={[styles.timeButton, !row.enabled && styles.timeButtonOff]}
              activeOpacity={0.7}
              onPress={() => this.setState({editing: row.id})}>
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
          onConfirm={this.onConfirm}
          onCancel={() => this.setState({editing: null})}
        />
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
  label: {
    flex: 1,
    marginHorizontal: spacing.sm,
    fontSize: 15,
    color: colors.text,
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
});
