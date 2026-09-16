import React, {Component} from 'react';
import {Animated, Dimensions, Easing, StyleSheet, TouchableWithoutFeedback, View} from 'react-native';
import {colors, shadow} from './theme';

/**
 * Slide-in side panel.
 *
 * Replaces react-native-drawer-menu, which was last published in 2017 and does
 * not build against current React Native. This app only ever opens the drawer
 * from a button, so a plain Animated panel plus a scrim covers it, with no
 * gesture-handler/reanimated dependency.
 */
export default class Drawer extends Component {
  state = {
    // Kept mounted but pushed off-screen so the list is not rebuilt on toggle.
    open: false,
  };

  progress = new Animated.Value(0);

  openDrawer = () => {
    this.setState({open: true}, () => this.animateTo(1, this.props.onDrawerOpen));
  };

  closeDrawer = () => {
    this.animateTo(0, () => {
      this.setState({open: false});
      if (this.props.onDrawerClose) {
        this.props.onDrawerClose();
      }
    });
  };

  animateTo(value, onDone) {
    Animated.timing(this.progress, {
      toValue: value,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      if (onDone) {
        onDone();
      }
    });
  }

  render() {
    const {drawerWidth, drawerContent, children} = this.props;
    const {open} = this.state;
    const width = drawerWidth || Math.min(320, Dimensions.get('window').width * 0.86);

    const translateX = this.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-width, 0],
    });

    return (
      <View style={styles.root}>
        {children}

        {open && (
          <TouchableWithoutFeedback onPress={this.closeDrawer}>
            <Animated.View style={[styles.scrim, {opacity: this.progress}]} />
          </TouchableWithoutFeedback>
        )}

        {open && (
          <Animated.View style={[styles.panel, {width, transform: [{translateX}]}]}>
            {drawerContent}
          </Animated.View>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.surface,
    ...shadow(12),
  },
});
