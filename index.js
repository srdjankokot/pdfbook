/**
 * @format
 */

import React from 'react';
import {AppRegistry} from 'react-native';
import notifee from '@notifee/react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import App from './App';
import {handleBackgroundEvent} from './NotifService';
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
notifee.onBackgroundEvent(handleBackgroundEvent);

AppRegistry.registerComponent(appName, () => Root);
