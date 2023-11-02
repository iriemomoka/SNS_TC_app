import React, { useState,useEffect } from 'react';
import { Platform,StyleSheet, View, Text, Alert, Keyboard, TouchableOpacity,TextInput,Linking,LogBox,BackHandler,AppState, FlatList } from 'react-native';
import { GiftedChat, Actions, Send, InputToolbar, Bubble, Time, Composer, Message  } from 'react-native-gifted-chat';
import Feather from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import * as Permissions from "expo-permissions";
import GestureRecognizer from 'react-native-swipe-gestures';
import RenderHtml from 'react-native-render-html';

import Loading from '../components/Loading';
import { db } from '../components/Databace';

LogBox.ignoreAllLogs()

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

export default function BellScreen(props) {
  
  if (AppState.currentState === 'active') {
    Notifications.setBadgeCountAsync(0);
  }
  
  const { navigation, route } = props;
  
  const [isLoading, setLoading] = useState(false);
  
  const [talk, setTalk] = useState([]);

  const [messages, setMessages] = useState([]);
  const [customer, setCustomer] = useState(false);
  const [menu, setMenu] = useState(false);
  const [msgtext,setMsgtext] = useState('');
  const [staffs, setStaffs] = useState([]);
  const [fixed,setFixed] = useState([]);

  navigation.setOptions({
    headerStyle: !global.fc_flg?{ backgroundColor: '#1d449a', height: 110}:{ backgroundColor: '#fd2c77', height: 110},
  });
  
  // 端末の戻るボタン
  const backAction = () => {
    if (!isLoading) {
      if(msgtext) {
        Alert.alert(
          "入力されたテキストは消えますが\nよろしいですか？",
          "",
          [
            {
              text: "はい",
              onPress: () => {
                navigation.reset({
                  index: 0,
                  routes: [{
                    name: 'CommunicationHistory' ,
                    params: route.params,
                    websocket:route.websocket,
                    profile:route.profile,
                    previous:'BellScreen'
                  }],
                });
              }
            },
            {
              text: "いいえ",
            },
          ]
        );
      } else {
        navigation.reset({
          index: 0,
          routes: [{
            name: 'CommunicationHistory' ,
            params: route.params,
            websocket:route.websocket,
            profile:route.profile,
            previous:'BellScreen'
          }],
        });
      }
    }
    return true;
  };
  
  useEffect(() => {
    
    navigation.setOptions({
      headerTitle:() => (<Text style={styles.name}>通知</Text>),
      headerLeft: () => (
          <Feather
            name='chevron-left'
            color='white'
            size={30}
            onPress={() => {
              if (!isLoading) {
                if(msgtext) {
                  Alert.alert(
                    "入力されたテキストは消えますが\nよろしいですか？",
                    "",
                    [
                      {
                        text: "はい",
                        onPress: () => {
                          navigation.reset({
                            index: 0,
                            routes: [{
                              name: 'CommunicationHistory' ,
                              params: route.params,
                              websocket:route.websocket,
                              profile:route.profile,
                              previous:'BellScreen'
                            }],
                          });
                        }
                      },
                      {
                        text: "いいえ",
                      },
                    ]
                  );
                } else {
                  navigation.reset({
                    index: 0,
                    routes: [{
                      name: 'CommunicationHistory' ,
                      params: route.params,
                      websocket:route.websocket,
                      profile:route.profile,
                      previous:'BellScreen'
                    }],
                  });
                }
              }
            }}
            style={{paddingHorizontal:15,paddingVertical:10}}
          />
      ),

    });
    
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
    
  }, [msgtext,isLoading])
  
  
  useEffect(() => {
    setLoading(true);
    fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: JSON.stringify({
        ID : route.params.account,
        pass : route.params.password,
        act:'get_bell',
        customer_id:route.customer,
        fc_flg: global.fc_flg
      })
    })
      .then((response) => response.json())
      .then((json) => {
        console.log("TEST1:"+json);
        if(json['communication']){
          setTalk(json['communication']);
        }
        setLoading(false);

      })
      .catch((error) => {
        setLoading(false);
      })
  
  }, [])

  
  useEffect(() => {
    
    const msg = talk.map(com => {
      
      if (com.del_flg){
        return
      }
      const data = {
        _id:  com.customer_id,
        name: com.name,
        text: "お客様名:"+com.name+"\n\n"+com.note,
        image:'',
        view_flg:com.view_flg,
        createdAt: com.ins_dt,
        user: {
          _id: 2,
          name: "お客様",
          avatar:null,
          status:"メール受信",
          title:com.title,
          html_flg:com.html_flg,
        }
      }
      return data;
    }).filter(data => data);
    setMessages(msg);
  }, [talk])

  
  const renderBubble = props => {
    
    const message_sender_id = props.currentMessage.user._id;
    const image = props.currentMessage.image;
    const stamp = props.currentMessage.user.title;
    const view_flg = props.currentMessage.view_flg;

    return (
      <Bubble
        {...props}
        position={message_sender_id == 2 ? 'left' : 'right'}
        textStyle={{
            right: {
              fontSize: 12,
            },
            left: {
              fontSize: 12
            },
        }}
        wrapperStyle={{
            right: {
                backgroundColor: 'white',
                borderWidth: 1.5,
                borderColor: '#346cb8',
                marginRight: 5,
                marginVertical: 5,
                maxWidth: '75%',
            },
            left: {
                backgroundColor: (view_flg==='0'?'#696969':'#346cb8'),
                marginLeft: 5,
                marginVertical: 5,
                borderBottomLeftRadius: 1,
                maxWidth: '75%',
            },
        }}
      />
    );
    
  };

  // 更新
  const [refreshing, setRefreshing] = useState(false);
  


  if(menu){
    Keyboard.dismiss() // キーボード隠す
  }
  


  const [menu_height,setMenu_height] = useState(false);
  const getHeight = (e) => {
    const height = e.nativeEvent.layout.height;
    if (height > 40) {
      //setMenu_height(height-40)
    } else {
      //setMenu_height(height)
    }
  }
  
  return (
    <>
    <Loading isLoading={isLoading} />

    <GiftedChat
      messages={messages}
      locale='ja'
      // メッセージ画面を押したときのイベント
      onPress={(context, message) => {
        navigation.reset({
          index: 0,
          routes: [{
            name: 'TalkScreen',
            params: route.params ,
            customer:message._id,
            websocket:route.websocket,
            profile:route.profile,
            cus_name:message.name,
            staff:staffs,
            fixed:fixed,
          }],
        });
      }}
      placeholder={""}
      renderBubble={renderBubble}
      renderComposer={(props) => {
        if (!customer.line) {
          return (
            <TouchableOpacity>
            </TouchableOpacity>
          )
        } else {
          return (<Composer {...props}/>)
        }
      }}
    />

    </>
  )

}

const styles = StyleSheet.create({
  name: {
    color:'#ffffff',
    fontSize:18,
    fontWeight:'500'
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginRight: 15,
  },
  menu_btn:{
    flex:1,
    alignItems: 'center',
    height:45,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  menu_btn_text:{
    color:'#ffffff',
    fontSize:20,
  },
  textInput: {
    marginTop:5,
    marginRight: 10,
    borderRadius: 10,
    paddingLeft: 5,
    backgroundColor: "white",
    paddingTop: 8,
    lineHeight:20,
    textAlignVertical:'top',
  },
  border: {
    backgroundColor:'#b4b4b4',
    height:210,
  },
  menu: {
    marginVertical:8,
    width:364,
    height:80,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  menuBox: {
    width:80,
    height:80,
    backgroundColor:'#fafafa',
    borderWidth:1.5,
    borderColor:'#191970',
    borderRadius:20,
    marginHorizontal:5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize:12,
    fontWeight:'600',
    color:'#191970',
    marginTop:5,
    textAlign:'center',
  },
});
