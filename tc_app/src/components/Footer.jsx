import React, { useContext } from "react";
import {
  StyleSheet, View, Text, TouchableOpacity, Dimensions, KeyboardAvoidingView
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Context1 } from "./ExportContext";

const Width = Dimensions.get("window").width;

export default function Footer(props){
  
  const { onPress0,onPress1,onPress2,onPress3,active } = props;

  const active_btn = !global.fc_flg?"#F9F871":"#FDFDBD"
  const bgc = !global.fc_flg?"#6C9BCF":"#FF8F8F";
  const footerWidth1 = global.testShop_flg?Width*0.25:Width*0.333;
  const footerWidth2 = global.testShop_flg?Width*0.25*0.9:Width*0.333*0.9;

  const context = useContext(Context1);

  return (
    <View style={[styles.hooter,{backgroundColor:bgc}]}>
      <View style={[styles.block,{width:footerWidth1}]}>
        <TouchableOpacity
          style={[styles.btn,{width:footerWidth2}]}
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
      <View style={[styles.block,{width:footerWidth1}]}>
        <TouchableOpacity
          style={[styles.btn,{width:footerWidth2}]}
          onPress={onPress1}
          activeOpacity={1}
        > 
        {context.chatbell>0&&(
          <View style={[styles.bell,{backgroundColor:!global.fc_flg?"red":"#574141"}]}>
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
      <View style={[styles.block,{width:footerWidth1}]}>
        <TouchableOpacity
          style={[styles.btn,{width:footerWidth2}]}
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
      {global.testShop_flg&&(
        <View style={[styles.block,{width:footerWidth1}]}>
          <TouchableOpacity
          style={[styles.btn,{width:footerWidth2}]}
            onPress={onPress3}
            activeOpacity={1}
          > 
            <MaterialCommunityIcons
              name="timeline-text"
              color={active[3]==true?active_btn:"#fff"}
              size={30}
            />
            <Text style={[styles.back_text,active[3]==true&&{color:active_btn}]}>タイムライン</Text>
          </TouchableOpacity>
        </View>
      )}
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
    height: 75,
  },
  btn: {
    height: 50,
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
    fontSize:9
  },
});