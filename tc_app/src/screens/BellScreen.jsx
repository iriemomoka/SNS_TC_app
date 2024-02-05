import React, { useState,useEffect } from 'react';
import { StyleSheet, View, Text,LogBox,BackHandler,AppState } from 'react-native';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import Feather from 'react-native-vector-icons/Feather';
import * as Notifications from 'expo-notifications';

import Loading from '../components/Loading';

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
  
  // 端末の戻るボタン
  const backAction = () => {
    if (!isLoading) {
      navigation.reset({
        index: 0,
        routes: [{
          name: 'CommunicationHistory' ,
          params: route.params,
          websocket:route.websocket,
          websocket2: route.websocket2,
          profile:route.profile,
          previous:'BellScreen'
        }],
      });
    }
    return true;
  };
  
  useEffect(() => {
    
    navigation.setOptions({
      headerStyle: !global.fc_flg?{ backgroundColor: '#1d449a', height: 110}:{ backgroundColor: '#fd2c77', height: 110},
      headerTitle:() => (<Text style={styles.name}>通知</Text>),
      headerLeft: () => (
          <Feather
            name='chevron-left'
            color='white'
            size={30}
            onPress={() => {
              if (!isLoading) {
                navigation.reset({
                  index: 0,
                  routes: [{
                    name: route.previous,
                    params: route.params,
                    websocket:route.websocket,
                    websocket2: route.websocket2,
                    profile:route.profile,
                    previous:'BellScreen'
                  }],
                });
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
    
  }, [isLoading])
  
  
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
        if(json['communication']){
          setTalk(json['communication']);
        }
        setLoading(false);

      })
      .catch((error) => {
        setLoading(false);
      })
  
    // 通知をタップしたらお客様一覧 → トーク画面 (ログイン済)
    const notificationInteractionSubscription =
      Notifications.addNotificationResponseReceivedListener(async(response) => {
        if (
          response.notification.request.content.data.customer &&
          global.sp_id
        ) {
          const cus_data = response.notification.request.content.data.customer;

          navigation.reset({
            index: 0,
            routes: [
              {
                name: "TalkScreen",
                params: route.params,
                customer: cus_data.customer_id,
                websocket: route.websocket,
                websocket2: route.websocket2,
                profile: route.profile,
                cus_name: cus_data.name,
              },
            ],
          });
        }
        if (
          response.notification.request.content.data.room_id &&
          global.sp_id
        ) {
          const room_id = response.notification.request.content.data.room_id;

          var sql = `select * from chat_room where del_flg != '1' and room_id = '${room_id}';`;
          var rooms_ = await db_select(sql);
          
          if (rooms_ != false) {
            var room = rooms_[0];
    
            if (room["room_type"] == "0") {
    
              var user_id = room["user_id"].split(',');
    
              var account = user_id.filter(function(id) {
                return id !== route.params.account;
              });
    
              var sql = `select * from staff_all where account = '${account[0]}';`;
              var staff = await db_select(sql);
    
              if (staff != false) {
                room["account"]      = account[0];
                room["name_1"]       = staff[0]["name_1"];
                room["name_2"]       = staff[0]["name_2"];
                room["shop_id"]      = staff[0]["shop_id"];
                room["shop_name"]    = staff[0]["shop_name"];
                room["staff_photo1"] = staff[0]["staff_photo1"];
              }
    
            }

            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "ChatTalk",
                  params: route.params,
                  websocket: route.websocket,
                  websocket2: route.websocket2,
                  profile: route.profile,
                  room: room
                },
              ],
            });

          }
        }
    });

    return () => {
      notificationInteractionSubscription.remove();
    };

  }, [])

  // お客様IDの重複防止用5桁ランダム数字生成
  function Random5() {
    const randomInteger = Math.floor(Math.random() * 1000000);
    const sixDigitNumber = String(randomInteger).padStart(5, '0');  
    return sixDigitNumber;
  }

  // 追加したランダム数字を削除する
  function removeCusID(ID) {

    const indexOfUnderscore = ID.indexOf('_');
  
    if (indexOfUnderscore !== -1) {
      return ID.substring(0, indexOfUnderscore);
    } else {
      return ID;
    }
  }

  useEffect(() => {
    
    const msg = talk.map(com => {
      
      if (com.del_flg){
        return
      }
      const data = {
        _id:  com.customer_id+"_"+Random5(),
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
          user_read:0,
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
            customer:removeCusID(message._id),
            websocket:route.websocket,
            websocket2: route.websocket2,
            profile:route.profile,
            cus_name:message.name,
          }],
        });
      }}
      placeholder={""}
      renderBubble={renderBubble}
      renderComposer={(props) => {return (<View></View>)}}
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
