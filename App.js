/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {StyleSheet, Dimensions, StatusBar, View, TouchableOpacity, TextInput, SectionList, Alert, Text, Switch} from 'react-native';
import Pdf from 'react-native-pdf';

import BookContent from './BookContent'

import Drawer from './Drawer';

import BookContents from "./book_content.json"
import BookContentsShort from "./book_content_short.json"

import NotifService from './NotifService';

import AlarmPicker from './TimePicker'
import DailyReminders from './DailyReminders';
import {loadJSON, saveJSON} from './storage';
import moment from 'moment';

import {SafeAreaView} from 'react-native-safe-area-context';

import {colors, radius, shadow, spacing} from './theme';
import {pageLabel, printedPage, timeLabel, toArabicDigits} from './format';

const BOOK_TITLE = 'مقاليد السماوات والأرض';
const BOOK_SUBTITLE = 'مع حصن المؤمن';

// The topics behind the daily card; they are ordinary topics, so their
// reminders also show as a tick in the list below it.
const DAILY_REMINDERS = [
  {id: 2, label: 'أذكار الصباح', icon: '☀', hours: 5, minutes: 30},
  {id: 53, label: 'أذكار المساء', icon: '☾', hours: 17, minutes: 0},
];
const ALL_DAYS = ['0', '1', '2', '3', '4', '5', '6'];

function topicById(id) {
  return BookContents.find((item) => item.id === id);
}

const {width: SCREEN_WIDTH} = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(320, SCREEN_WIDTH * 0.86);

/**
 * The next moment that falls on `weekday` (0 = Sunday) at the hour and minute of
 * `time`. Today counts only if that time is still ahead; otherwise next week.
 */
function nextWeekdayAt(weekday, time) {
  var now = moment();
  var next = now.clone()
    .day(Number(weekday))
    .hours(time.getHours())
    .minutes(time.getMinutes())
    .seconds(0)
    .milliseconds(0);
  if (!next.isAfter(now)) {
    next.add(1, 'week');
  }
  return next.toDate();
}

export default class PDFExample extends React.Component {

  constructor(props) {
    super(props);
    this.notif = new NotifService(
      this.onNotif.bind(this),
    );
    this.refreshContentMenu();
  }

  async componentDidMount() {
    const [lastPage, favorites, dailyTimes, onboarded] = await Promise.all([
      loadJSON('lastPage', 1),
      loadJSON('favorites', []),
      loadJSON('dailyTimes', {}),
      loadJSON('onboarded', false),
    ]);
    this.savedPage = lastPage;
    this.setState({favorites, dailyTimes});
    this.restoreLastPage();

    // Open the index once on first launch so the daily reminder card is seen.
    if (!onboarded) {
      saveJSON('onboarded', true);
      setTimeout(() => this._drawer && this.openControlPanel(), 800);
    }
  }

  /**
   * Reopens the book where the reader left off, once both the saved page and
   * the PDF are ready. A tapped reminder already chose the page, so it wins.
   */
  restoreLastPage() {
    if (this.pageRestored || this.savedPage === undefined || !this.pdfLoaded) {
      return;
    }
    this.pageRestored = true;
    if (!this.openedFromNotif && this.savedPage > 1) {
      this.pdf.setPage(this.savedPage);
      this.setState({currentPage: this.savedPage});
    }
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
    return this.notif.getScheduledLocalNotifications(this.scheduledLocalNotifications.bind(this));
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
    favorites: [],
    // {topicId: {hours, minutes}} chosen on the daily card.
    dailyTimes: {},
    // {topicId: bool} shown on the daily switches until scheduling finishes.
    dailyPending: {},
  }


  showDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: true });
  };

  hideDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: false });
  };

  handleDatePicked = async (date, days) => {
    this.hideDateTimePicker();
    await this.notif.ensurePermissions();

    const topic = {id: this.state.alarmId, title: this.state.alarmTitle, page: this.state.pageNumber};
    const chosenDays = Object.keys(days).filter((day) => days[day] == 1);
    await this.scheduleTopic(topic, date, chosenDays);
    this.refreshContentMenu();
  };

  /**
   * One weekly reminder per chosen weekday; its id is the topic id with the
   * weekday appended (see alarmsForContentId).
   */
  scheduleTopic = (topic, time, days) => {
    return Promise.all(
      days.map((day) =>
        this.notif.scheduleNotif(String(topic.id) + day, topic.title, topic.page, nextWeekdayAt(day, time)),
      ),
    );
  }

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

  /** The time a daily row shows: its live reminder, else the saved or default time. */
  dailyTime(row) {
    const alarm = this.alarmsForContentId(row.id)[0];
    const date = alarm && (alarm.date instanceof Date ? alarm.date : new Date(alarm.date));
    if (date && !isNaN(date.getTime())) {
      return {hours: date.getHours(), minutes: date.getMinutes()};
    }
    return this.state.dailyTimes[row.id] || {hours: row.hours, minutes: row.minutes};
  }

  dailyRows() {
    return DAILY_REMINDERS.map((row) => {
      const pending = this.state.dailyPending[row.id];
      return {
        ...row,
        ...this.dailyTime(row),
        enabled: pending !== undefined ? pending : this.isScheduled(row.id),
      };
    });
  }

  /** Replaces a daily topic's reminders with one for every day, or removes them. */
  setDailyReminder = async (id, enabled, hours, minutes) => {
    this.setState({dailyPending: {...this.state.dailyPending, [id]: enabled}});
    await this.removeAlarmForContentId(id);
    if (enabled) {
      await this.notif.ensurePermissions();
      const time = new Date();
      time.setHours(hours, minutes, 0, 0);
      await this.scheduleTopic(topicById(id), time, ALL_DAYS);
    }
    await this.refreshContentMenu();
    const {[id]: _done, ...stillPending} = this.state.dailyPending;
    this.setState({dailyPending: stillPending});
  }

  onDailyToggle = (id, enabled) => {
    const row = DAILY_REMINDERS.find((r) => r.id === id);
    const {hours, minutes} = this.dailyTime(row);
    this.setDailyReminder(id, enabled, hours, minutes);
  }

  onDailyTimeChange = (id, hours, minutes) => {
    const dailyTimes = {...this.state.dailyTimes, [id]: {hours, minutes}};
    this.setState({dailyTimes});
    saveJSON('dailyTimes', dailyTimes);
    // Picking a time is a clear sign the reminder is wanted, so it also turns it on.
    this.setDailyReminder(id, true, hours, minutes);
  }

  toggleFavorite = (id) => {
    const favorites = this.state.favorites.includes(id)
      ? this.state.favorites.filter((f) => f !== id)
      : [...this.state.favorites, id];
    this.setState({favorites});
    saveJSON('favorites', favorites);
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
    // On a cold start this can run before the PDF view and drawer have
    // mounted; `initialPage` alone then opens the book at the right page.
    var page = notif.data.page;
    this.openedFromNotif = true;
    this.setState({initialPage: page, currentPage: page});
    if (this.pdf) {
      this.pdf.setPage(page);
    }
    if (this._drawer) {
      this.closeControlPanel();
    }
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

  /** Favourites first while browsing; a single plain list while searching. */
  drawerSections(items) {
    if (items.length === 0) {
      return [];
    }
    const favorites = this.state.favorites
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean);
    if (this.state.searchText !== '' || favorites.length === 0) {
      return [{key: 'all', data: items}];
    }
    return [
      // Copies with their own keys, since the same topics appear again below.
      {key: 'favorites', title: 'المفضلة', data: favorites.map((item) => ({...item, key: 'fav-' + item.id}))},
      {key: 'all', title: 'كل المواضيع', data: items},
    ];
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

        <SectionList
          sections={this.drawerSections(items)}
          keyboardShouldPersistTaps={'handled'}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <View>
              {this.state.searchText === '' && (
                <DailyReminders
                  rows={this.dailyRows()}
                  onToggle={this.onDailyToggle}
                  onTimeChange={this.onDailyTimeChange}
                />
              )}
              <View style={styles.listHeader}>
                <Text style={styles.listHeaderTopic}>الموضوع</Text>
                <Text style={styles.listHeaderAlarm}>المنبه</Text>
              </View>
            </View>
          }
          renderSectionHeader={({section}) =>
            section.title ? <Text style={styles.sectionHeader}>{section.title}</Text> : null
          }
          renderItem={({ item }) => (
            <BookContent
              name={item.title}
              page={pageLabel(item.page)}
              isScheduled={this.isScheduled(item.id)}
              alarmTime={this.alarmTimeForContentId(item.id)}
              isFavorite={this.state.favorites.includes(item.id)}
              onFavoritePress={() => this.toggleFavorite(item.id)}
              onPress={() => this.onPageSet(item.page)}
              onButtonPress={() => this.createNewAlarm(item.id, item.title, item.page)}
            />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>لا توجد نتائج</Text>
          )}
          keyExtractor={(item, index) => item.key || String(item.id)}
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
              this.pdfLoaded = true;
              this.restoreLastPage();
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`current page: ${page}`);
              this.setState({currentPage: page});
              // The PDF reports page 1 as it loads; saving that before the
              // saved page is restored would lose it.
              if (this.pageRestored) {
                saveJSON('lastPage', page);
              }
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
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'right',
    backgroundColor: colors.surface,
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
    // Follows the window as it rotates; a size read once at startup kept the
    // portrait dimensions after turning the device.
    alignSelf: 'stretch',
    backgroundColor: colors.background,
  },
});
