/**
 * @format
 */

import React from 'react';
import {AppRegistry} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import App from './App';
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

AppRegistry.registerComponent(appName, () => Root);
