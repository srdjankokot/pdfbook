import React from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import {colors, radius, shadow, spacing} from './theme';

/**
 * Every reminder that is set, soonest first, so the reader can see what is
 * coming and skip or cancel it without hunting through the index.
 *
 * `items` is [{topicId, title, page, schedule, next}], where `schedule` says
 * when it repeats and `next` when it fires next, both ready to show.
 */
export default function Reminders({visible, items, onClose, onOpen, onSkip, onCancel}) {
  const confirmCancel = (item) => {
    Alert.alert('حذف التذكير', `سيتم حذف تذكير «${item.title}»`, [
      {text: 'تراجع', style: 'cancel'},
      {text: 'حذف', style: 'destructive', onPress: () => onCancel(item)},
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType={'fade'}
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.sheet}>
              <View style={styles.header}>
                <Text style={styles.title}>التذكيرات</Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                  <Text style={styles.close}>×</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={items}
                keyExtractor={(item) => String(item.topicId)}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={() => (
                  <Text style={styles.empty}>
                    لا توجد تذكيرات. اضغط ＋ بجانب أي موضوع في الفهرس لإضافة تذكير.
                  </Text>
                )}
                renderItem={({item}) => (
                  <View style={styles.item}>
                    <TouchableOpacity activeOpacity={0.6} onPress={() => onOpen(item)}>
                      <View style={styles.itemTop}>
                        <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                        <Text style={styles.next}>{item.next}</Text>
                      </View>
                      <Text style={styles.schedule}>{item.schedule}</Text>
                    </TouchableOpacity>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.action}
                        activeOpacity={0.7}
                        onPress={() => onSkip(item)}>
                        <Text style={styles.actionText} numberOfLines={1}>تخطي المرة القادمة</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.action, styles.actionDanger]}
                        activeOpacity={0.7}
                        onPress={() => confirmCancel(item)}>
                        <Text style={[styles.actionText, styles.actionDangerText]} numberOfLines={1}>
                          حذف التذكير
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const DANGER = '#B3261E';

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    ...shadow(16),
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
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
  separator: {
    height: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.border,
  },
  empty: {
    padding: spacing.xl,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textMuted,
    textAlign: 'center',
  },
  item: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  itemTop: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
  },
  itemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'right',
  },
  next: {
    marginRight: spacing.md,
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  schedule: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  actions: {
    flexDirection: 'row-reverse',
    marginTop: spacing.sm,
  },
  action: {
    flexShrink: 0,
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  actionDanger: {
    borderColor: '#F2D3D0',
  },
  actionDangerText: {
    color: DANGER,
  },
});
