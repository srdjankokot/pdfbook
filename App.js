/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow strict-local
 */

import React from 'react';
import {StyleSheet, Dimensions, View, Button, TouchableOpacity, TextInput, FlatList, Easing, Alert, Image, TouchableHighlight, Text, Switch} from 'react-native';
import Pdf from 'react-native-pdf';

import BookContent from './BookContent'

import Drawer from 'react-native-drawer-menu';

import { DeviceEventEmitter } from 'react-native';
import PushNotificationIOS from "@react-native-community/push-notification-ios";
import DateTimePicker from "react-native-modal-datetime-picker";
import BookContents from "./book_content.json"
import BookContentsShort from "./book_content_short.json"

import NotifService from './NotifService';
import { RTLView, RTLText } from 'react-native-rtl-layout'

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
  }


  showDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: true });
  };
 
  hideDateTimePicker = () => {
    this.setState({ isDateTimePickerVisible: false });
  };
 
  handleDatePicked = date => {
    console.log("A date has been picked: ", date);

    this.scheduleNewLovalNotif(date);
    this.hideDateTimePicker();
  };

  createNewAlarm = (alarmId, alarmTitle, pageNumber) => {
    //Schedule Future Alarm
    if (this.isScheduled(alarmId)) {
      this.notif.cancelLocalNotifications(alarmId);
      this.refreshContentMenu();
    }
    else {
      this.setState({alarmId:alarmId, alarmTitle:alarmTitle, pageNumber:pageNumber});
      this.showDateTimePicker();
      // this.notif.scheduleNotif(alarmId, alarmTitle, pageNumber);
    }
  }

  scheduleNewLovalNotif= (date) =>
  {
    this.notif.scheduleNotif(this.state.alarmId, this.state.alarmTitle, this.state.pageNumber, date);
    this.refreshContentMenu();
  }



  isScheduled = (contentId) => {

    var scheduled = false;
    this.state.scheduleNotif.map((data) => {
      if (parseInt(data.id) == contentId) {
        scheduled = true;
      }
    })
    return scheduled;
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
    this.textInput.clear();
  }

  toggleSwitch = () => {
    this.setState({isEnabled: !this.state.isEnabled});
    this.setState({bookUri: this.state.isEnabled? 'bundle-assets://sample.pdf': 'bundle-assets://book_removed_resized_crop.pdf'})
    this.setState({
      bookContent: this.state.isEnabled? BookContentsShort: BookContents
    })
    this.closeControlPanel();
  }

  drawerContent() {

    return (
      <View style={styles.drawerStyle}>
       <View style={styles.searchHolder}>
       <TouchableHighlight onPress={this.clearSearch}>
            <Image style={styles.xMark} source={require('./x-mark.png')} />
          </TouchableHighlight>
       <TextInput
            ref={input => { this.textInput = input }}
          style={styles.TextInput}
          onChangeText={text => this.setState({
            searchText: text
          })}
        />
       </View>

       <View style={styles.drawerHeader}>
       <RTLText style={styles.drawerHeaderLeft}>المنبه</RTLText>
       <RTLText style={styles.drawerHeaderRight}>الموضوع</RTLText>
       </View>
    
        <FlatList
          data={this.state.bookContent}
          renderItem={({ item }) => (
            item.title.toLowerCase().indexOf(this.state.searchText.toLowerCase()) > -1 && <BookContent name={item.title} onPress={() => this.onPageSet(item.page)} button_name={this.isScheduled(item.id) ? " - "  : " + "} onButtonPress={() => this.createNewAlarm(item.id, item.title, item.page)} />
          )}
          keyExtractor={item => item.id}
        />


<View style={styles.switchHolder}>
<RTLText >مختصر</RTLText>
   
<Switch
        trackColor={{ false: "#2cb136", true: "#2cb136" }}
        thumbColor={this.state.isEnabled ? "#1d6b22" : "#1d6b22"}
        ios_backgroundColor="#3e3e3e"
        onValueChange={this.toggleSwitch}
        value={this.state.isEnabled} />

<RTLText >كامل</RTLText>

</View>
      </View>
    );
  };


  render() {
    // const source = { uri: 'http://samples.leanpub.com/thereactnativebook-sample.pdf', cache: true };
    // const source = require('./book_removed.pdf');  // ios only
    const source = {uri:this.state.bookUri};
    //const source = {uri:'file:///sdcard/test.pdf'};
    //const source = {uri:"data:application/pdf;base64,JVBERi0xLjcKJc..."};
    const resourceType = 'url';

    const drawerStyles = {
      drawer: { shadowColor: '#000000', shadowOpacity: 0.8, shadowRadius: 3 },
      main: { paddingLeft: 3 },
    }

    var customStyles = {
      drawer: {
        shadowColor: '#000',
        shadowOpacity: 0.4,
        shadowRadius: 10
      },
      mask: {}, // style of mask if it is enabled
      main: {} // style of main board
    };

    return (

      <Drawer
        ref={(ref) => this._drawer = ref}
        style={styles.container}
        drawerWidth={300}
        drawerContent={this.drawerContent()}
        type={Drawer.types.Overlay}
        customStyles={{ drawer: styles.drawerStyle }}
        drawerPosition={Drawer.positions.Left}
        onDrawerOpen={() => { 
          console.log('Drawer is opened'); 
        }}
        onDrawerClose={() => {
           console.log('Drawer is closed') 
          }}
        easingFunc={Easing.ease}
      >


        <View style={styles.container}>
          <View style={styles.toolbar}>

          <TouchableHighlight style={styles.hamburgerr} onPress={this.openControlPanel}>
            <Image style={styles.hamburger}  source={require('./hamburger.png')} />
          </TouchableHighlight>
            
          </View>

          <Pdf
            ref={(pdf) => { this.pdf = pdf; }}
            source={{uri:this.state.bookUri}}

            onLoadComplete={(numberOfPages, filePath) => {
              console.log(`number of pages: ${numberOfPages}`);
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`current page: ${page}`);
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

          <DateTimePicker
            isVisible={this.state.isDateTimePickerVisible}
            onConfirm={this.handleDatePicked}
            onCancel={this.hideDateTimePicker}
            mode={'time'}
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
    paddingTop: Platform.OS === 'android' ? 0: 15
  },
  drawerStyle: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 5,
    paddingTop: Platform.OS === 'android' ? 0: 15

  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width * (Platform.OS === 'android' ? 1.01: 1.11),
    height: Dimensions.get('window').height,
    backgroundColor: '#fff',
  },
  TextInput:{
    height: 40, 
    borderColor: 'green', 
    borderWidth: 1,
    borderRadius: 20 ,
    color:'green',
    padding:10,
    flex:1
  },
  searchHolder:{
    flexDirection: 'row',
    alignItems: 'center',
  },

  switchHolder:{
    flexDirection: 'row',
    alignItems: 'center',
  
    justifyContent: 'center',
    padding: 5
  },

  toolbar:{
    width: Dimensions.get('window').width,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  hamburger:{
    width: 50,
    height: 50,
  },
  hamburgerr:{
    width: 55,
    height: 55,
  }
  ,
  xMark:{
    width: 20,
    height: 20,
    margin:5
  }

,
drawerHeader:{
  padding:5,
  flexDirection: 'row',
}
,
drawerHeaderRight:{
  flex:1,
  fontSize: 18,
  fontWeight: "bold",
  textAlign:'right'
},
drawerHeaderLeft:{
  fontSize: 18,
  fontWeight: "bold"
}
});