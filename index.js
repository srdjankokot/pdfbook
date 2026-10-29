/**
 * @format
 */

import React from 'react';
import {AppRegistry} from 'react-native';
import notifee, {EventType} from '@notifee/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import App from './App';
import {handleBackgroundEvent} from './NotifService';
import {topUpPrayerReminders} from './prayer';
import {name as appName} from './app.json';

// React Native draws edge-to-edge by default, so the screens need the real
// system-bar insets to keep the header clear of the status bar.
function Root() {
  return (
    <SafeAreaProvider>
      <App />
    </SafeAreaProvider>
  );
}

// Must be registered before the app renders so a reminder tapped while the app
// is in the background still opens its page.
notifee.onBackgroundEvent(async (event) => {
  // Each shown prayer-time reminder schedules the days ahead, so they keep
  // coming even if the app is not opened.
  if (event.type === EventType.DELIVERED) {
    await topUpPrayerReminders();
  }
  await handleBackgroundEvent(event);
});

AppRegistry.registerComponent(appName, () => Root);
