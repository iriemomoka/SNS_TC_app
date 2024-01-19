import React, { useContext } from "react";
import {
  StyleSheet, View, Text, TouchableOpacity, Dimensions, KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Context1 } from "./ExportContext";

const Width = Dimensions.get("window").width;

export default function Footer(props){
  
  const { onPress0,onPress1,onPress2,active } = props;

  const active_btn = !global.fc_flg?"#ffed87":"#f5d3df"
  const bgc = !global.fc_flg?"#1d449a":"#fd2c77";

  const context = useContext(Context1);

  return (
    <View style={[styles.hooter,{backgroundColor:bgc}]}>
      <View style={styles.block}>
        <TouchableOpacity
          style={styles.btn}
          onPress={onPress0}
          activeOpacity={1}
        > 
        <MaterialCommunityIcons
          name="chat-processing"
          color={active[0]==true?active_btn:"#fff"}
          size={30}
        />
          <Text style={[styles.back_text,active[0]==true&&{color:active_btn}]}>お客様一覧</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.block}>
        <TouchableOpacity
          style={styles.btn}
          onPress={onPress1}
          activeOpacity={1}
        > 
        {context.chatbell>0&&(
          <View style={[styles.bell,{backgroundColor:!global.fc_flg?"red":"blueviolet"}]}>
            <Text style={styles.belltext} >{context.chatbell}</Text>
          </View>
        )}
        <MaterialCommunityIcons
          name="account-tie"
          color={active[1]==true?active_btn:"#fff"}
          size={30}
        />
          <Text style={[styles.back_text,active[1]==true&&{color:active_btn}]}>社内チャット</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.block}>
        <TouchableOpacity
          style={styles.btn}
          onPress={onPress2}
          activeOpacity={1}
        > 
          <MaterialCommunityIcons
            name="clock"
            color={active[2]==true?active_btn:"#fff"}
            size={30}
          />
          <Text style={[styles.back_text,active[2]==true&&{color:active_btn}]}>スケジュール</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hooter: {
    width: Width,
    height: 80,
    position:'absolute',
    bottom: 0,
    flexDirection: 'row',
    zIndex:999
  },
  block: {
    width:Width*0.333,
    height: 75,
  },
  btn: {
    height: 50,
    width: Width*0.333*0.9,
    alignItems:'center',
    justifyContent: 'center',
    marginTop:5
  },
  back_text: {
    color:"#fff",
    textAlign: 'center',
    fontSize: 12,
    fontWeight:'600',
    marginTop:5
  },
  bell: {
    justifyContent:"center",
    alignItems: "center",
    position: "absolute",
    color: "white",
    fontWeight: "bold",
    borderRadius: 10,
    paddingLeft: 5,
    paddingRight: 5,
    right: 20,
    top:0,
    zIndex:999,
    width:20,
    height:20
  },
  belltext: {
    color:'#fff',
    fontSize:10
  },
});