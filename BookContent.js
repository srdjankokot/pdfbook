import React, { Component } from 'react';

import {
    View,
    StyleSheet,
    Text,
    TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing } from './theme';

type Props = {};

/**
 * One row of the table of contents: topic title, its page number and the
 * alarm toggle. Laid out right-to-left to match the Arabic content.
 */
export default class AKButton extends Component<Props> {
    render() {
        const { name, page, isScheduled, alarmTime } = this.props;

        return (
            <TouchableOpacity
                style={styles.container}
                activeOpacity={0.6}
                onPress={() => {
                    this.props.onPress();
                }}>
                {/* Reversed row: first child lands on the right, so the order
                    below is title → page → alarm, matching the column headers. */}
                <View style={styles.row}>
                    <Text style={styles.title}>{name}</Text>

                    {page != null && (
                        <View style={styles.pageBadge}>
                            <Text style={styles.pageBadgeText}>{page}</Text>
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.alarmZone}
                        activeOpacity={0.7}
                        onPress={this.props.onButtonPress}>
                        <View style={[styles.alarmButton, isScheduled && styles.alarmButtonOn]}>
                            <Text style={[styles.alarmIcon, isScheduled && styles.alarmIconOn]}>
                                {isScheduled ? '✓' : '+'}
                            </Text>
                        </View>
                        {isScheduled && !!alarmTime && (
                            <Text style={styles.alarmTime}>{alarmTime}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
    },
    row: {
        // Reversed so the first child (alarm) sits on the left and the title
        // reads from the right edge.
        flexDirection: 'row-reverse',
        alignItems: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
    },
    pageBadge: {
        minWidth: 34,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: radius.sm,
        backgroundColor: colors.primaryTint,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pageBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.primary,
    },
    title: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
        color: colors.text,
        textAlign: 'right',
        marginHorizontal: spacing.md,
    },
    alarmZone: {
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 44,
    },
    alarmButton: {
        width: 32,
        height: 32,
        borderRadius: radius.pill,
        borderWidth: 1.5,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.surface,
    },
    alarmButtonOn: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    alarmIcon: {
        fontSize: 18,
        lineHeight: 21,
        color: colors.textMuted,
    },
    alarmIconOn: {
        fontSize: 15,
        color: colors.surface,
    },
    alarmTime: {
        marginTop: 2,
        fontSize: 10,
        fontWeight: '600',
        color: colors.primary,
    },
});
