/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {StyleSheet, Dimensions, Platform, StatusBar, View, TouchableOpacity, TextInput, FlatList, Alert, Text, Switch} from 'react-native';
import Pdf from 'react-native-pdf';

import BookContent from './BookContent'

import Drawer from './Drawer';

import BookContents from "./book_content.json"
import BookContentsShort from "./book_content_short.json"

import NotifService from './NotifService';

import AlarmPicker from './TimePicker'
import moment from 'moment';

import {SafeAreaView} from 'react-native-safe-area-context';

import {colors, radius, shadow, spacing} from './theme';
import {pageLabel, printedPage, timeLabel, toArabicDigits} from './format';

const BOOK_TITLE = 'مقاليد السماوات والأرض';
const BOOK_SUBTITLE = 'مع حصن المؤمن';

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.86);

export default class PDFExample extends React.Component {

  constructor(props) {
    super(props);
    this.notif = new NotifService(
      this.onNotif.bind(this),
    );
    this.refreshContentMenu();
  }

  scheduledLocalNotifications(scheduledLocalNotifications) {
    if (scheduledLocalNotifications != null) {
      this.setState({ scheduleNotif: scheduledLocalNotifications });
      console.log("scheduledLocalNotifications: ", scheduledLocalNotifications);
      this.setState({
        bookContent: BookContents
      })

    }
    // Alert.alert('Permissions', JSON.stringify(scheduledLocalNotifications));
  }

  refreshContentMenu = () => {
    this.notif.removeAllDeliveredNotification();
    this.notif.getScheduledLocalNotifications(this.scheduledLocalNotifications.bind(this));
  }



  handlePerm(perms) {
    Alert.alert('Permissions', JSON.stringify(perms));
  }


  state = {
    scheduleNotif: [],
    searchText: '',
    isDateTimePickerVisible: false,
    initialPage:1,
    isEnabled: true,
    bookUri: 'bundle-assets://book_removed_resized_crop.pdf',
    // Shown until the scheduled-notification lookup comes back, so the
    // table of contents is never empty.
    bookContent: BookContents,
    currentPage: 1,
    totalPages: 0,
  }


  showDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: true });
  };

  hideDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: false });
  };

  handleDatePicked = async (date, days) => {

    console.log("A date has been pickedssss: ", days);

    var now = moment();
    var nowPlusWeek = moment().add(1, 'week');
    // Scheduling is asynchronous now, so collect the calls and refresh the
    // index only once every reminder is actually registered.
    var pending = [];

    for (var i = 0, keys = Object.keys(days), ii = keys.length; i < ii; i++) {

      if (days[keys[i]] == 1)
      {
        // console.log('key : ' + keys[i] + ' val : ' + days[keys[i]]);

        var day = now.clone().weekday(keys[i])

        // console.log(now);
        // console.log(day.toDate());

        if(now > day.toDate())
          day = nowPlusWeek.clone().weekday(keys[i])

        date.setMonth(day.toDate().getMonth(), day.toDate().getDate())
        date.setSeconds(0);
        pending.push(this.scheduleNewLovalNotif(date, keys[i]));
        console.log('Schedule date : ', date);
      }
    }
    await Promise.all(pending);
    this.refreshContentMenu();

    this.hideDateTimePicker();
  };

  createNewAlarm = async (alarmId, alarmTitle, pageNumber) => {
    //Schedule Future Alarm
    if (this.isScheduled(alarmId)) {
      await this.removeAlarmForContentId(alarmId);
      this.refreshContentMenu();
    }
    else {
      this.setState({alarmId:alarmId, alarmTitle:alarmTitle, pageNumber:pageNumber});
      this.showDateTimePicker();
      // this.notif.scheduleNotif(alarmId, alarmTitle, pageNumber);
    }
  }

  scheduleNewLovalNotif= (date, day) =>
  {
    var id = this.state.alarmId + day;
    console.log('Schedule id : ', id);
    // Clone the date: the caller reuses one Date object for every weekday.
    return this.notif.scheduleNotif(id, this.state.alarmTitle+ "_"+day, this.state.pageNumber, new Date(date.getTime()));
  }


  removeAlarmForContentId=(contentId)=>{
    return Promise.all(
      this.alarmsForContentId(contentId).map((data) =>
        this.notif.cancelLocalNotifications(data.id)
      )
    );
  }

  /**
   * Every scheduled notification belongs to one topic; its id is the topic id
   * with the weekday appended, so strip that last character to group them.
   */
  alarmsForContentId = (contentId) => {
    return this.state.scheduleNotif.filter((data) => {
      var id = String(data.id).substring(0, String(data.id).length - 1)
      return id == contentId;
    })
  }

  isScheduled = (contentId) => {
    return this.alarmsForContentId(contentId).length > 0;
  }

  /** "07:30" for the first alarm of a topic, or null if the date is unusable. */
  alarmTimeForContentId = (contentId) => {
    var alarms = this.alarmsForContentId(contentId);
    if (alarms.length === 0) {
      return null;
    }
    var date = alarms[0].date instanceof Date ? alarms[0].date : new Date(alarms[0].date);
    if (isNaN(date.getTime())) {
      return null;
    }
    return timeLabel(date.getHours(), date.getMinutes());
  }

  closeControlPanel = () => {
    this._drawer.closeDrawer()
  };

  openControlPanel = () => {
    console.log("openControlPanel", true);
    this._drawer.openDrawer()
  };

  onPageSet(page) {
    // Alert.alert('page:', `${page}`);
    this.pdf.setPage(page);
    this.setState({currentPage: page});
    this.closeControlPanel();
  }

  onNotif(notif) {
    // Alert.alert(notif.title, `${notif.data.page}`);

    this.onPageSet(notif.data.page);
    this.setState({initialPage:notif.data.page})
  }

  clearSearch=()=>
  {
    this.setState({
      searchText: ''
    });
    if (this.textInput) {
      this.textInput.clear();
    }
  }

  toggleSwitch = () => {
    this.setState({isEnabled: !this.state.isEnabled});
    this.setState({bookUri: this.state.isEnabled? 'bundle-assets://sample.pdf': 'bundle-assets://book_removed_resized_crop.pdf'})
    this.setState({
      bookContent: this.state.isEnabled? BookContentsShort: BookContents
    })
    this.closeControlPanel();
  }

  /** Topics matching the current search text. */
  filteredContent() {
    var content = this.state.bookContent || [];
    var needle = this.state.searchText.toLowerCase().trim();
    if (needle === '') {
      return content;
    }
    return content.filter((item) => item.title.toLowerCase().indexOf(needle) > -1);
  }

  renderSearchIcon() {
    return (
      <View style={styles.searchIcon}>
        <View style={styles.searchIconLens} />
        <View style={styles.searchIconHandle} />
      </View>
    );
  }

  drawerContent() {
    const items = this.filteredContent();

    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.drawer}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>الفهرس</Text>
          <Text style={styles.drawerSubtitle}>{toArabicDigits(items.length)} موضوع</Text>
        </View>

        <View style={styles.searchHolder}>
          {this.renderSearchIcon()}
          <TextInput
            ref={input => { this.textInput = input }}
            style={styles.TextInput}
            placeholder={'ابحث عن موضوع'}
            placeholderTextColor={colors.textMuted}
            textAlign={'right'}
            autoCorrect={false}
            underlineColorAndroid={'transparent'}
            onChangeText={text => this.setState({
              searchText: text
            })}
          />
          {this.state.searchText !== '' && (
            <TouchableOpacity onPress={this.clearSearch} style={styles.clearButton} activeOpacity={0.7}>
              <Text style={styles.clearButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTopic}>الموضوع</Text>
          <Text style={styles.listHeaderAlarm}>المنبه</Text>
        </View>

        <FlatList
          data={items}
          keyboardShouldPersistTaps={'handled'}
          renderItem={({ item }) => (
            <BookContent
              name={item.title}
              page={pageLabel(item.page)}
              isScheduled={this.isScheduled(item.id)}
              alarmTime={this.alarmTimeForContentId(item.id)}
              onPress={() => this.onPageSet(item.page)}
              onButtonPress={() => this.createNewAlarm(item.id, item.title, item.page)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>لا توجد نتائج</Text>
          )}
          keyExtractor={item => item.id}
        />

{/* changing book version */}

{/* <View style={styles.switchHolder}>
<Text>مختصر</Text>

<Switch
        trackColor={{ false: "#2cb136", true: "#2cb136" }}
        thumbColor={this.state.isEnabled ? "#1d6b22" : "#1d6b22"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={this.toggleSwitch}
        value={this.state.isEnabled} />

<Text>كامل</Text>

</View> */}



      </SafeAreaView>
    );
  };

  renderHeader() {
    const {currentPage, totalPages} = this.state;

    return (
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          activeOpacity={0.6}
          onPress={this.openControlPanel}>
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
          <View style={styles.menuBar} />
        </TouchableOpacity>

        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle} numberOfLines={1}>{BOOK_TITLE}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{BOOK_SUBTITLE}</Text>
        </View>

        {totalPages > 0 && (
          <View style={styles.pagePill}>
            {/* The book's own numbering, so this matches the printed page. */}
            <Text style={styles.pagePillText}>
              {pageLabel(currentPage)} / {toArabicDigits(printedPage(totalPages))}
            </Text>
          </View>
        )}
      </View>
    );
  }

  render() {
    // const source = { uri: 'http://samples.leanpub.com/thereactnativebook-sample.pdf', cache: true };
    // const source = require('./book_removed.pdf');  // ios only
    const source = {uri:this.state.bookUri};
    //const source = {uri:'file:///sdcard/test.pdf'};
    //const source = {uri:"data:application/pdf;base64,JVBERi0xLjcKJc..."};

    return (

      <Drawer
        ref={(ref) => this._drawer = ref}
        drawerWidth={DRAWER_WIDTH}
        drawerContent={this.drawerContent()}
        onDrawerOpen={() => {
          console.log('Drawer is opened');
        }}
        onDrawerClose={() => {
           console.log('Drawer is closed')
          }}
      >


        <View style={styles.container}>
          <StatusBar barStyle={'light-content'} backgroundColor={'transparent'} translucent={true} />

          {/* The app draws edge-to-edge, so the bar pads itself down past the
              status bar instead of sitting underneath it. */}
          <SafeAreaView edges={['top']} style={styles.headerSafeArea}>
            {this.renderHeader()}
          </SafeAreaView>

          <Pdf
            ref={(pdf) => { this.pdf = pdf; }}
            source={source}

            onLoadComplete={(numberOfPages, filePath) => {
              console.log(`number of pages: ${numberOfPages}`);
              this.setState({totalPages: numberOfPages});
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`current page: ${page}`);
              this.setState({currentPage: page});
            }}
            onError={(error) => {
              console.log(error);
            }}
            onPressLink={(uri) => {
              console.log(`Link presse: ${uri}`)
            }}
            style={styles.pdf}
            enablePaging={true}
            // minScale={1}
            // maxScale={1}
            fitWidth={true}
            page={this.state.initialPage}

          />

    <AlarmPicker
     isVisible={this.state.isDateTimePickerVisible}
     title={this.state.alarmTitle}
     onOutside = {() => {
      this.setState({isDateTimePickerVisible:false});
    }}

    onCancelPress = {() => {
      this.setState({isDateTimePickerVisible:false});
    }}
    onSetPress = {this.handleDatePicked}

     />

        </View>
      </Drawer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: colors.background,
  },

  // Top bar
  headerSafeArea: {
    width: '100%',
    backgroundColor: colors.primary,
    ...shadow(4),
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
  },
  menuButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  menuBar: {
    height: 2,
    borderRadius: 2,
    marginVertical: 2.5,
    backgroundColor: colors.surface,
  },
  headerTitles: {
    flex: 1,
    marginHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.surface,
    textAlign: 'center',
  },
  headerSubtitle: {
    marginTop: 1,
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  pagePill: {
    minWidth: 56,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
  },
  pagePillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.surface,
  },

  // Drawer (the panel and scrim styling lives in Drawer.js)
  drawer: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: spacing.lg,
  },
  drawerHeader: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'right',
  },
  drawerSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'right',
  },
  searchHolder:{
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  TextInput:{
    flex: 1,
    height: 44,
    paddingVertical: 0,
    marginHorizontal: spacing.sm,
    fontSize: 14,
    color: colors.text,
  },
  searchIcon: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIconLens: {
    width: 11,
    height: 11,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
  },
  searchIconHandle: {
    position: 'absolute',
    bottom: 0,
    right: 1,
    width: 1.5,
    height: 5,
    backgroundColor: colors.textMuted,
    transform: [{rotate: '-45deg'}],
  },
  clearButton: {
    width: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 15,
    lineHeight: 18,
    color: colors.textMuted,
  },
  listHeader:{
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  listHeaderTopic:{
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    textAlign: 'right',
  },
  listHeaderAlarm:{
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  separator: {
    height: 1,
    marginHorizontal: spacing.md,
    backgroundColor: colors.border,
  },
  emptyText: {
    marginTop: spacing.xl,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },

  switchHolder:{
    flexDirection: 'row',
    alignItems: 'center',

    justifyContent: 'center',
    padding: 5,
  },

  pdf: {
    flex: 1,
    width: Dimensions.get('window').width * (Platform.OS === 'android' ? 1.01: 1.11),
    height: Dimensions.get('window').height,
    backgroundColor: colors.background,
  },
});
