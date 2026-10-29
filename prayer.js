import {PermissionsAndroid, Platform} from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import {CalculationMethod, Coordinates, PrayerTimes} from 'adhan';

import BookContents from './book_content.json';
import {toArabicDigits} from './format';
import {cancelReminder, cancelTopicReminders, scheduleReminder} from './NotifService';
import {loadJSON, saveJSON} from './storage';

/**
 * Daily reminders tied to a prayer ("15 minutes after Fajr") rather than a
 * clock time. Prayer times shift a little every day, so instead of one weekly
 * repeating reminder each day gets its own one-off reminder, scheduled
 * DAYS_AHEAD days ahead and topped up whenever one is shown or the app opens.
 */

export const DEFAULT_OFFSET = 15;
export const PRAYER_NAMES = {fajr: 'الفجر', asr: 'العصر'};
const DAYS_AHEAD = 14;

/**
 * "بعد الفجر بـ ١٥ دقيقة", or "بعد الفجر مباشرة" with no offset. Arabic counts
 * 3 to 10 with the plural (دقائق) and 11 and up with the singular (دقيقة).
 */
export function prayerLabel(prayer, offset) {
  const name = PRAYER_NAMES[prayer];
  if (offset === 0) {
    return `بعد ${name} مباشرة`;
  }
  const unit = offset >= 3 && offset <= 10 ? 'دقائق' : 'دقيقة';
  return `بعد ${name} بـ ${toArabicDigits(offset)} ${unit}`;
}
// Re-read the location when the device has moved further than this.
const MOVED_KM = 10;

/**
 * The calculation method used where the reader is. Umm al-Qura is the
 * official method on the Arabian Peninsula and the Egyptian authority's
 * method is used across Egypt; elsewhere the Muslim World League's is the
 * common default. Asr uses the majority (Shafi'i, Maliki, Hanbali) shadow
 * length.
 */
function parametersFor({latitude, longitude}) {
  if (latitude >= 22 && latitude <= 32 && longitude >= 24 && longitude < 35) {
    return CalculationMethod.Egyptian();
  }
  if (latitude >= 12 && latitude <= 32 && longitude >= 35 && longitude <= 60) {
    return CalculationMethod.UmmAlQura();
  }
  return CalculationMethod.MuslimWorldLeague();
}

/** The next `days` reminder times: `prayer` plus `offset` minutes, future only. */
export function upcomingTimes(coords, prayer, offset, days = DAYS_AHEAD) {
  const coordinates = new Coordinates(coords.latitude, coords.longitude);
  const params = parametersFor(coords);
  const now = Date.now();
  const times = [];
  for (let i = 0; times.length < days && i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const prayerTime = new PrayerTimes(coordinates, date, params)[prayer];
    const time = new Date(prayerTime.getTime() + offset * 60 * 1000);
    time.setSeconds(0, 0);
    if (time.getTime() > now) {
      times.push(time);
    }
  }
  return times;
}

function dateKey(date) {
  return (
    String(date.getFullYear()) +
    String(date.getMonth() + 1).padStart(2, '0') +
    String(date.getDate()).padStart(2, '0')
  );
}

/**
 * Day-specific reminders the reader skipped ("already read today"). Kept so a
 * top-up does not schedule them again; entries for past days are dropped.
 */
async function loadSkipped() {
  const today = dateKey(new Date());
  const skipped = await loadJSON('skippedReminders', []);
  return skipped.filter((id) => id.slice(-8) >= today);
}

/** Cancels one prayer-time reminder and keeps it from being scheduled again. */
export async function skipPrayerReminder(id) {
  const skipped = await loadSkipped();
  await saveJSON('skippedReminders', [...skipped, String(id)]);
  await cancelReminder(id);
}

/**
 * Replaces a topic's reminders with one per day for the next DAYS_AHEAD days.
 * Ids carry the date, so a reminder re-registered by another path for the
 * same day replaces this one instead of doubling it.
 */
export async function schedulePrayerReminders(topicId, prayer, offset, coords) {
  const topic = BookContents.find((item) => item.id === Number(topicId));
  if (!topic) {
    return;
  }
  await cancelTopicReminders(topic.id);
  const skipped = await loadSkipped();
  await Promise.all(
    upcomingTimes(coords, prayer, offset)
      .map((time) => ({time, id: `${topic.id}-p${dateKey(time)}`}))
      .filter(({id}) => !skipped.includes(id))
      .map(({time, id}) =>
        scheduleReminder({
          id,
          topicId: topic.id,
          title: topic.title,
          page: topic.page,
          timestamp: time.getTime(),
          weekly: false,
        }),
      ),
  );
}

/**
 * Keeps every enabled prayer-time reminder DAYS_AHEAD days ahead. Runs when the
 * app opens and whenever a reminder is shown, in the background too, so the
 * schedule never runs out while reminders keep arriving.
 */
export async function topUpPrayerReminders() {
  const [modes, coords] = await Promise.all([
    loadJSON('dailyModes', {}),
    loadJSON('location', null),
  ]);
  if (!coords) {
    return;
  }
  for (const [topicId, setting] of Object.entries(modes)) {
    if (setting.mode === 'prayer' && setting.enabled) {
      await schedulePrayerReminders(topicId, setting.prayer, setting.offset, coords);
    }
  }
}

function currentPosition(maximumAge, enableHighAccuracy = false) {
  return new Promise((resolve) => {
    Geolocation.getCurrentPosition(
      ({coords}) => resolve({latitude: coords.latitude, longitude: coords.longitude}),
      (e) => {
        console.log('getCurrentPosition failed', e);
        resolve(null);
      },
      {enableHighAccuracy, timeout: 15000, maximumAge},
    );
  });
}

const LOCATION_PERMISSION = PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

/**
 * Asks once for the approximate location and stores it. Approximate is plenty:
 * prayer times barely change within a city. Resolves to {coords} or to
 * {error: 'denied' | 'unavailable'}.
 */
export async function requestLocation() {
  if (Platform.OS === 'android') {
    const result = await PermissionsAndroid.request(LOCATION_PERMISSION);
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      return {error: 'denied'};
    }
  }
  // The battery-friendly request relies on Wi-Fi and cell towers; where those
  // give nothing (no network location, outdoors), let GPS answer instead.
  // Either way only an approximate position reaches the app.
  const coords =
    (await currentPosition(60 * 60 * 1000)) || (await currentPosition(60 * 60 * 1000, true));
  if (!coords) {
    return {error: 'unavailable'};
  }
  await saveJSON('location', coords);
  return {coords};
}

function distanceKm(a, b) {
  const rad = Math.PI / 180;
  const dLat = (b.latitude - a.latitude) * rad;
  const dLon = (b.longitude - a.longitude) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a.latitude * rad) * Math.cos(b.latitude * rad) * Math.sin(dLon / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
}

/**
 * Follows the reader when they travel, without asking again: only reads the
 * location if permission was already given, and returns the new position when
 * it moved far enough to matter, else null.
 */
export async function refreshLocationSilently() {
  const saved = await loadJSON('location', null);
  if (!saved || Platform.OS !== 'android') {
    return null;
  }
  if (!(await PermissionsAndroid.check(LOCATION_PERMISSION))) {
    return null;
  }
  const coords = await currentPosition(6 * 60 * 60 * 1000);
  if (!coords || distanceKm(saved, coords) < MOVED_KM) {
    return null;
  }
  await saveJSON('location', coords);
  return coords;
}
