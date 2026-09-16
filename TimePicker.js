import React , { Component }from 'react';
import {Modal, StyleSheet, View, TouchableOpacity, TouchableWithoutFeedback, Text} from 'react-native';

import WeekdayPicker from './WeekdayPicker';
import DateTimePicker from "react-native-modal-datetime-picker";
import { colors, radius, shadow, spacing } from './theme';
import { timeLabel } from './format';


type Props = {};

/**
 * Dialog for scheduling a recurring reminder: one time of day plus the
 * weekdays it should repeat on.
 */
export default class AlarmPicker extends Component<Props> {

    state = {
        selectedHours: new Date().getHours(),
        selectedMinutes: new Date().getMinutes(),
        days : { 1:1, 2:1 , 3:1 , 4:1 , 5:1, 6:1, 0:1 },
        isTimePickerVisible: false,
        selectedDate:new Date(),

      }
      handleChange = (days) => {
          // `days` is mutated in place by the picker, so copy it to re-render.
          this.setState({days: {...days}});
        }

        hideDateTimePicker = () => {
            this.setState({ isTimePickerVisible: false });
          };

          handleDatePicked = date => {
            // console.log("A date has been picked: ", date);

            // this.scheduleNewLovalNotif(date);
            this.setState({ selectedHours: date.getHours(),
                 selectedMinutes: date.getMinutes(),
                 selectedDate:date })
            this.hideDateTimePicker();
          };

    render() {
        const {selectedHours, selectedMinutes, days} = this.state;
        const hasDay = Object.keys(days).some((day) => days[day] === 1);

        return (
            <Modal
                visible={this.props.isVisible}
                transparent={true}
                animationType={'fade'}
                statusBarTranslucent={true}
                onRequestClose={this.props.onOutside}
            >
            {/* Tap outside the card to dismiss; the inner catcher stops that
                gesture from closing the dialog when the card itself is tapped. */}
            <TouchableWithoutFeedback onPress={this.props.onOutside}>
            <View style={styles.backdrop}>
            <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.dialog}>
                <Text style={styles.dialogTitle}>تعيين المنبه</Text>
                {!!this.props.title && (
                    <Text style={styles.topic} numberOfLines={2}>{this.props.title}</Text>
                )}

                <TouchableOpacity
                    style={styles.timeButton}
                    activeOpacity={0.7}
                    onPress={() => {
                        this.setState({isTimePickerVisible:true});
                    }}>
                    <Text style={styles.time}>
                        {timeLabel(selectedHours, selectedMinutes)}
                    </Text>
                    <Text style={styles.timeHint}>اضغط لتغيير الوقت</Text>
                </TouchableOpacity>

                <DateTimePicker
                    isVisible={this.state.isTimePickerVisible}
                    onConfirm={this.handleDatePicked}
                    onCancel={this.hideDateTimePicker}
                    mode={'time'}
                />

                <Text style={styles.sectionLabel}>أيام التكرار</Text>
                <WeekdayPicker
                    days={days}
                    onChange={this.handleChange}
                />

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={[styles.button, styles.buttonGhost]}
                        activeOpacity={0.7}
                        onPress={() => {
                            this.props.onCancelPress();
                        }}>
                        <Text style={styles.buttonGhostText}>إلغاء</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.buttonPrimary, !hasDay && styles.buttonDisabled]}
                        activeOpacity={0.7}
                        disabled={!hasDay}
                        onPress={(date,days) => {
                            this.props.onSetPress(this.state.selectedDate, this.state.days);
                        }}>
                        <Text style={styles.buttonPrimaryText}>حفظ</Text>
                    </TouchableOpacity>
                </View>
            </View>
            </TouchableWithoutFeedback>
            </View>
            </TouchableWithoutFeedback>
          </Modal>

        )
    }
}

const styles = StyleSheet.create({
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
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      paddingHorizontal: spacing.lg,
      ...shadow(16),
    },
    dialogTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    topic: {
      marginTop: spacing.xs,
      fontSize: 13,
      color: colors.textMuted,
      textAlign: 'center',
    },
    timeButton: {
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.primaryTint,
      alignItems: 'center',
    },
    time: {
      fontSize: 48,
      lineHeight: 56,
      fontWeight: '300',
      color: colors.primary,
      textAlign: 'center',
    },
    timeHint: {
      fontSize: 11,
      color: colors.textMuted,
    },
    sectionLabel: {
      marginTop: spacing.md,
      fontSize: 12,
      fontWeight: '600',
      color: colors.textMuted,
      textAlign: 'center',
    },
    buttonContainer: {
      marginTop: spacing.lg,
      flexDirection: 'row-reverse',
      alignItems: 'center',
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
    buttonDisabled: {
      backgroundColor: colors.border,
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
