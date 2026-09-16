import notifee, {
  AlarmType,
  AndroidImportance,
  AuthorizationStatus,
  EventType,
  RepeatFrequency,
  TriggerType,
} from '@notifee/react-native';

const CHANNEL_ID = 'pdf-book-channel-id';
const CHANNEL_NAME = 'المنبهات';

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
    this.channelReady = this.setupChannel();
    this.attachHandlers();
  }

  async setupChannel() {
    try {
      await notifee.requestPermission();
      return await notifee.createChannel({
        id: CHANNEL_ID,
        name: CHANNEL_NAME,
        importance: AndroidImportance.HIGH,
        vibration: true,
      });
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

    // Opened from a cold start by tapping the reminder.
    notifee
      .getInitialNotification()
      .then((initial) => {
        if (initial) {
          this.deliver(initial.notification);
        }
      })
      .catch((e) => console.log('getInitialNotification failed', e));
  }

  async scheduleNotif(alarmId, alarmTitle, pageNumber, date) {
    // Read the time before awaiting: callers reuse one Date object across a
    // loop, so it may be mutated by the time the channel promise resolves.
    const timestamp = date.getTime();
    const channelId = await this.channelReady;
    try {
      await notifee.createTriggerNotification(
        {
          id: String(alarmId),
          title: alarmTitle,
          body: alarmTitle,
          // notifee only accepts string values in `data`.
          data: {page: String(pageNumber)},
          android: {
            channelId,
            smallIcon: 'ic_launcher',
            pressAction: {id: 'default', launchActivity: 'default'},
            sound: 'default',
          },
          ios: {sound: 'default'},
        },
        {
          type: TriggerType.TIMESTAMP,
          timestamp,
          repeatFrequency: RepeatFrequency.WEEKLY,
          alarmManager: {type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE},
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
