import React, { Component } from 'react';
    
import {
    TouchableHighlight,
    View,
    StyleSheet,
    Text,
    Button, 
    TouchableOpacity,
} from 'react-native';
import { RTLView, RTLText } from 'react-native-rtl-layout'

type Props = {};

export default class AKButton extends Component<Props> {
    render() {
        return (
            <TouchableOpacity
            style={styles.container}
                onPress={() => {
                    this.props.onPress();
                }}>
            
            <View style={styles.rowContainer}>  
                <RTLView locale={'ar'}>
                    <Text style={styles.title}>{this.props.name}</Text>
                    <TouchableHighlight onPress={this.props.onButtonPress} >
                        <RTLText locale={'ar'} style={styles.buttonTextStyle}>{this.props.button_name}</RTLText>
                    </TouchableHighlight>
                     </RTLView>

            </View>

            </TouchableOpacity>
        )
    }
}

const styles = StyleSheet.create({
    title: {
      backgroundColor: '#fff',
      padding: 10,
      fontSize: 15, 
      flex:1,
    textAlign:'right'

    },
    buttonTextStyle: {
        backgroundColor: '#fff',
        padding: 10,
        fontSize: 13, 
        color:'green'
      },
    rowContainer: {
        flexDirection: 'row',
        alignItems: "center",
        flex: 1
      },
    container: {
        padding: 2,
        backgroundColor: '#ffffff',
        flex: 1
      },
    reminderButton:{
        fontSize: 5,
      }
  });
