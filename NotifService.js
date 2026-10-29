import {Alert, AppState, Platform} from 'react-native';
import notifee, {
  AlarmType,
  AndroidImportance,
  AndroidNotificationSetting,
  AuthorizationStatus,
  EventType,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';

// A channel's sound can never be changed once created, and 1.0 created
// 'pdf-book-channel-id' without one, so reminders moved to a new channel.
const CHANNEL_ID = 'reminders';
const LEGACY_CHANNEL_ID = 'pdf-book-channel-id';
const CHANNEL_NAME = 'المنبهات';
// "Tap to open the page" — the title already names the topic.
const REMINDER_BODY = 'اضغط لفتح الصفحة';
const NOTIFICATION_COLOR = '#136F4E';
// Earlier versions appended the weekday to the title ("أذكار الصباح_2").
const LEGACY_TITLE_SUFFIX = /_\d$/;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Moves a weekly timestamp forward by whole weeks until it is in the future. */
function nextOccurrence(timestamp) {
  const now = Date.now();
  if (timestamp > now) {
    return timestamp;
  }
  return timestamp + Math.ceil((now - timestamp + 1) / WEEK_MS) * WEEK_MS;
}

// A reminder tapped while the app is in the background reaches notifee's
// background handler, not onForegroundEvent. index.js registers
// `handleBackgroundEvent` once at startup; it hands the press to the live
// service, or keeps it until the service starts.
let activeService = null;
let pendingPress = null;

export async function handleBackgroundEvent({type, detail}) {
  if (type !== EventType.PRESS) {
    return;
  }
  if (activeService) {
    activeService.deliver(detail.notification);
  } else {
    pendingPress = detail.notification;
  }
}

/**
 * Schedules the per-topic reminders.
 *
 * Replaces react-native-push-notification, which was last published in 2022 and
 * cannot build against current React Native. The public methods keep the same
 * names and shapes as before so the screens did not have to change:
 * each reminder is one weekly-repeating trigger whose payload carries the page
 * to open, and its id is the topic id with the weekday appended.
 */
export default class NotifService {
  constructor(onNotification) {
    this.onNotification = onNotification;
    activeService = this;
    this.channelReady = this.setupChannel();
    this.attachHandlers();

    this.syncTriggers();
    // The user may grant or revoke the exact-alarm permission in the system
    // settings; pick that up as soon as they come back.
    AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        this.syncTriggers();
      }
    });
  }

  /**
   * Android 14+ denies SCHEDULE_EXACT_ALARM by default, and notifee then drops
   * an exact trigger without reporting an error, so reminders must only ask for
   * an exact alarm when the permission is actually granted.
   */
  async canScheduleExactAlarms() {
    if (Platform.OS !== 'android') {
      return true;
    }
    try {
      const settings = await notifee.getNotificationSettings();
      return settings.android.alarm === AndroidNotificationSetting.ENABLED;
    } catch (e) {
      return false;
    }
  }

  /**
   * Called before saving a reminder. Explains and offers the settings screen when
   * notifications are blocked or exact alarms are not allowed. Never blocks the
   * save: without exact alarms the reminder still fires, just possibly late.
   */
  async ensurePermissions() {
    let settings;
    try {
      settings = await notifee.getNotificationSettings();
    } catch (e) {
      return;
    }

    if (settings.authorizationStatus === AuthorizationStatus.DENIED) {
      Alert.alert(
        'الإشعارات متوقفة',
        'لن تظهر التذكيرات لأن الإشعارات متوقفة لهذا التطبيق. يرجى تفعيلها من الإعدادات.',
        [
          {text: 'ليس الآن', style: 'cancel'},
          {text: 'فتح الإعدادات', onPress: () => notifee.openNotificationSettings()},
        ],
      );
      return;
    }

    if (
      Platform.OS === 'android' &&
      settings.android.alarm !== AndroidNotificationSetting.ENABLED
    ) {
      Alert.alert(
        'تفعيل المنبهات الدقيقة',
        'لكي تصل التذكيرات في الوقت الذي اخترته بالضبط، يرجى السماح للتطبيق بضبط المنبهات والتذكيرات من الإعدادات. بدون هذا الإذن قد تتأخر التذكيرات بضع دقائق.',
        [
          {text: 'ليس الآن', style: 'cancel'},
          {text: 'فتح الإعدادات', onPress: () => notifee.openAlarmPermissionSettings()},
        ],
      );
    }
  }

  /**
   * Re-registers every saved reminder, each time the app opens or returns.
   *
   * A force stop (which some vendors apply when an app is swiped away) wipes
   * the app's alarms while notifee still lists the reminders as scheduled,
   * and notifee only restores them after a reboot, so they would silently
   * never fire. Re-creating a trigger under the same id simply replaces it.
   *
   * On the way through each reminder also gets the alarm type the exact-alarm
   * permission allows (exact when granted, WorkManager when not) and the
   * current channel, title, text and icon, which repairs reminders saved by
   * earlier versions.
   */
  async syncTriggers() {
    if (Platform.OS !== 'android') {
      return;
    }
    const exact = await this.canScheduleExactAlarms();
    const channelId = await this.channelReady;
    try {
      const entries = await notifee.getTriggerNotifications();
      await Promise.all(
        entries
          .filter(({trigger}) => trigger)
          .map(({notification, trigger}) => {
            const {alarmManager, ...rest} = trigger;
            return notifee.createTriggerNotification(
              {
                ...notification,
                title: (notification.title || '').replace(LEGACY_TITLE_SUFFIX, ''),
                body: REMINDER_BODY,
                android: {
                  ...notification.android,
                  channelId,
                  smallIcon: 'ic_notification',
                  color: NOTIFICATION_COLOR,
                },
              },
              {
                ...rest,
                timestamp: nextOccurrence(trigger.timestamp),
                ...(exact && {
                  alarmManager: {type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE},
                }),
              },
            );
          }),
      );
    } catch (e) {
      console.log('syncTriggers failed', e);
    }
  }

  async setupChannel() {
    try {
      await notifee.requestPermission();
      const channelId = await notifee.createChannel({
        id: CHANNEL_ID,
        name: CHANNEL_NAME,
        importance: AndroidImportance.HIGH,
        // notifee's default is silent, unlike Android's own.
        sound: 'default',
        vibration: true,
      });
      await notifee.deleteChannel(LEGACY_CHANNEL_ID);
      return channelId;
    } catch (e) {
      console.log('createChannel failed', e);
      return CHANNEL_ID;
    }
  }

  /** Normalises a notifee event into the `{data: {page}}` shape screens expect. */
  deliver(notification) {
    if (!notification || !notification.data) {
      return;
    }
    const page = Number(notification.data.page);
    if (!isNaN(page) && this.onNotification) {
      this.onNotification({data: {page}});
    }
  }

  attachHandlers() {
    notifee.onForegroundEvent(({type, detail}) => {
      if (type === EventType.PRESS) {
        this.deliver(detail.notification);
      }
    });

    // Opened from a cold start by tapping the reminder. The background handler
    // may have seen the same press first, so deliver it only once.
    notifee
      .getInitialNotification()
      .then((initial) => {
        const notification = pendingPress || (initial && initial.notification);
        pendingPress = null;
        this.deliver(notification);
      })
      .catch((e) => console.log('getInitialNotification failed', e));
  }

  async scheduleNotif(alarmId, alarmTitle, pageNumber, date) {
    // Read the time before awaiting: callers reuse one Date object across a
    // loop, so it may be mutated by the time the channel promise resolves.
    const timestamp = date.getTime();
    const channelId = await this.channelReady;
    const exact = await this.canScheduleExactAlarms();
    try {
      await notifee.createTriggerNotification(
        {
          id: String(alarmId),
          title: alarmTitle,
          body: REMINDER_BODY,
          // notifee only accepts string values in `data`.
          data: {page: String(pageNumber)},
          android: {
            channelId,
            smallIcon: 'ic_notification',
            color: NOTIFICATION_COLOR,
            pressAction: {id: 'default', launchActivity: 'default'},
            sound: 'default',
          },
          ios: {sound: 'default'},
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp,
          repeatFrequency: RepeatFrequency.WEEKLY,
          // Without the permission notifee falls back to WorkManager, which
          // may run a few minutes late but does deliver the reminder.
          ...(exact && {
            alarmManager: {type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE},
          }),
        },
      );
    } catch (e) {
      console.log('scheduleNotif failed', e);
    }
  }

  /**
   * Hands back `[{id, title, date, data}]`, matching what the old library
   * returned, so the index can show which topics have a reminder and at what time.
   */
  async getScheduledLocalNotifications(cb) {
    try {
      const entries = await notifee.getTriggerNotifications();
      cb(
        entries.map(({notification, trigger}) => ({
          id: notification.id,
          title: notification.title,
          date: trigger && trigger.timestamp ? new Date(trigger.timestamp) : null,
          data: notification.data,
        })),
      );
    } catch (e) {
      console.log('getScheduledLocalNotifications failed', e);
      cb([]);
    }
  }

  async cancelLocalNotifications(id) {
    try {
      await notifee.cancelTriggerNotification(String(id));
    } catch (e) {
      console.log('cancelLocalNotifications failed', e);
    }
  }

  async removeAllDeliveredNotification() {
    try {
      await notifee.cancelDisplayedNotifications();
    } catch (e) {
      console.log('removeAllDeliveredNotification failed', e);
    }
  }

  async checkPermission(cbk) {
    try {
      const settings = await notifee.getNotificationSettings();
      cbk(settings.authorizationStatus === AuthorizationStatus.AUTHORIZED);
    } catch (e) {
      cbk(false);
    }
  }
}
