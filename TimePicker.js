import React , { Component }from 'react';
import {StyleSheet, Dimensions, View, Button, TouchableOpacity, TextInput, FlatList, Easing, Alert, Image, TouchableHighlight, Text, Switch} from 'react-native';

import TimePicker from 'react-native-simple-time-picker';
import WeekdayPicker from './WeekdayPicker';
import Dialog, { DialogContent } from 'react-native-popup-dialog';
import DateTimePicker from "react-native-modal-datetime-picker";


type Props = {};
export default class AlarmPicker extends Component<Props> {

    state = {
        selectedHours: new Date().getHours(),
        selectedMinutes: new Date().getMinutes(),
        days : { 1:1, 2:1 , 3:1 , 4:1 , 5:1, 6:1, 0:1 },
        isTimePickerVisible: false,
        selectedDate:new Date(),
        
      }
      handleChange = (days) => { 
          this.setState(days);
        }

        hideDateTimePicker = () => {
            this.setState({ isTimePickerVisible: false });
          };
         
          handleDatePicked = date => {
            // console.log("A date has been picked: ", date);
        
            // this.scheduleNewLovalNotif(date);
            this.setState({ selectedHours: date.getHours(),
                 selectedMinutes: date.getMinutes(),
                 selectedDate:date })
            this.hideDateTimePicker();
          };

    render() {
       
        return (
            <Dialog
            visible={this.props.isVisible}
            onTouchOutside={this.props.onOutside}
          >
            <DialogContent>
            <View>
            {/* <TimePicker
          selectedHours={selectedHours}
          selectedMinutes={selectedMinutes}
          onChange={(hours, minutes) => this.setState({ selectedHours: hours, selectedMinutes: minutes })}
        />  */}

<TouchableOpacity
                onPress={() => {
                    this.setState({isTimePickerVisible:true});
                }}>
        <Text style={styles.time}>{("0" + this.state.selectedHours).slice(-2)}:{("0" + this.state.selectedMinutes).slice(-2)}</Text>
        </TouchableOpacity>
         <DateTimePicker
            isVisible={this.state.isTimePickerVisible}
            onConfirm={this.handleDatePicked}
            onCancel={this.hideDateTimePicker}
            mode={'time'}
          
          >
          </DateTimePicker>

        <WeekdayPicker
        days={this.state.days}
        onChange={this.handleChange}
        />



<View style={styles.buttonContainer}>



    <TouchableOpacity
    style={styles.button}
                onPress={() => {
                    this.props.onCancelPress();
                }}>

        <Text>Cancel</Text>
    </TouchableOpacity>


    <TouchableOpacity
style={styles.button}
                onPress={(date,days) => {
                    this.props.onSetPress(this.state.selectedDate, this.state.days);
                }}>

        <Text>SET</Text>

    </TouchableOpacity>

</View>
   
        </View>
            </DialogContent>
          </Dialog>

        )
    }
}

const styles = StyleSheet.create({
    time: {
      backgroundColor: '#fff',
      padding: 10,
      fontSize: 50, 
    textAlign:'center'
    },

    buttonContainer:{
      justifyContent: 'center', //Centered vertically
   alignItems: 'center', // Centered horizontally
   flexDirection: 'row',
    },
    button:{
     flex:1,
   alignItems: 'center', // Centered horizontally

    }

  });