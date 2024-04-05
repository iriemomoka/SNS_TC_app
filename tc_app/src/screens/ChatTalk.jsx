import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Platform, StyleSheet, View, Text, Alert, Keyboard, TouchableOpacity, TextInput, Linking, LogBox, BackHandler, AppState, FlatList, TouchableWithoutFeedback, Dimensions, Image, StatusBar
} from 'react-native';
import { GiftedChat, Actions, Send, InputToolbar, Bubble, Time, Composer, Message  } from 'react-native-gifted-chat';
import Feather from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import GestureRecognizer from 'react-native-swipe-gestures';
import Modal from "react-native-modal";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Moment from 'moment';

import Loading from '../components/Loading';

import { GetDB,db_select,db_write } from '../components/Databace';

LogBox.ignoreAllLogs()

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

const Height = Dimensions.get("window").height;
const Width = Dimensions.get("window").width;

export default function ChatTalk(props) {
  
  if (AppState.currentState === 'active') {
    Notifications.setBadgeCountAsync(0);
  }
  
  const { navigation, route } = props;
  
  const [isLoading, setLoading] = useState(false);

  const [header_name,setHeader_name] = useState('');
  
  const [talk, setTalk] = useState([]);

  const [messages, setMessages] = useState([]);

  const [msgtext,setMsgtext] = useState('');
  
  const [isFocused, setIsFocused] = useState(false);

  const [settingGroup, setSettingGroup] = useState(false);
  const [settingMember, setSettingMember] = useState(false);
  const [member, setMember] = useState({
    "account": "",
    "name_1": "",
    "name_2": "",
    "shop_id": "",
    "shop_name": "",
    "staff_photo1": "",
    "admin": false
  });
  const [adminGroup, setAdminGroup] = useState(false);
  const [groupname, setGroupname] = useState("");
  const [group_img, setGroup_img] = useState(null);
  const [group_img_change, setGroup_img_change] = useState(false);
  const [staff_list, setStaff_list] = useState([]);

  const [userModal, setUserModal] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name:"",
    avatar:""
  });
  const [userImage, setUserImage] = useState(false);

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
                    name: 'Company' ,
                    params: route.params,
                    websocket:route.websocket,
                    websocket2: route.websocket2,
                    profile:route.profile,
                    previous:'ChatTalk'
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
            name: 'Company' ,
            params: route.params,
            websocket:route.websocket,
            websocket2: route.websocket2,
            profile:route.profile,
            previous:'ChatTalk'
          }],
        });
      }
    }
    return true;
  };
  
  useEffect(() => {

    navigation.setOptions({
      headerTitle:() => (<Text style={styles.name}>{header_name}</Text>),
      headerLeft: () => (
          <Feather
            name='chevron-left'
            color='white'
            size={30}
            onPress={() => {
              if (settingGroup) {
                setSettingGroup(!settingGroup);
                
                if (route.room.room_type=="1") {
                  const imageUrl = domain+"chat_tmp/"+route.room.room_id+"/chatroom_"+route.room.room_id+".jpg";
              
                  fetch(imageUrl, { method: 'HEAD' })
                  .then((response) => {
                    if (response.ok) {
                      setGroup_img({uri:imageUrl});
                    } else {
                      setGroup_img(null);
                    }
                  })
              
                }
              } else {
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
                                name: 'Company' ,
                                params: route.params,
                                websocket:route.websocket,
                                websocket2: route.websocket2,
                                profile:route.profile,
                                previous:'ChatTalk'
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
                        name: 'Company' ,
                        params: route.params,
                        websocket:route.websocket,
                        websocket2: route.websocket2,
                        profile:route.profile,
                        previous:'ChatTalk'
                      }],
                    });
                  }
                }
              }
            }}
            style={{paddingHorizontal:15,paddingVertical:10}}
          />
      ),
      
    });
    
    const user_id = (route.room.user_id).split(',');
    if (user_id.includes(route.params.account)) setAdminGroup(true);

    if (route.room.room_type == "1") {
      navigation.setOptions({
        headerRight: () => (
          <Feather
            name='settings'
            color='white'
            size={30}
            onPress={() => {
              setSettingGroup(!settingGroup);

              if (route.room.room_type=="1") {
                const imageUrl = domain+"chat_tmp/"+route.room.room_id+"/chatroom_"+route.room.room_id+".jpg";
            
                fetch(imageUrl, { method: 'HEAD' })
                .then((response) => {
                  if (response.ok) {
                    setGroup_img({uri:imageUrl});
                  } else {
                    setGroup_img(null);
                  }
                })
            
              }
            }}
            style={{paddingHorizontal:15,paddingVertical:10}}
          />
        ),
      });
    }

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
    
  }, [msgtext,isLoading,settingGroup,header_name])

  useEffect(() => {
    
    setGroupname(route.room.room_name);

    if (route.room.room_type=="1") {
      const imageUrl = domain+"chat_tmp/"+route.room.room_id+"/chatroom_"+route.room.room_id+".jpg";
  
      fetch(imageUrl, { method: 'HEAD' })
      .then((response) => {
        if (response.ok) {
          setGroup_img({uri:imageUrl});
        } else {
          setGroup_img(null);
        }
      })
  
    }

    onRefresh(true);

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
  
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      () => {
        setIsFocused(true);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        setIsFocused(false);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const onRefresh = useCallback(async(flg) => {

    console.log('--------------------------');

    if (flg) setLoading(true);

    var user_list = (route.room.user_list).split(',');

    var staff_arr = [];

    const user_id = (route.room.user_id).split(',');

    for (var s=0;s<user_list.length;s++) {
      var sql = `select * from staff_all where account = '${user_list[s]}';`;
      var staff = await db_select(sql);
      if (staff != false) {
        if (user_id.includes(staff[0]["account"])) {
          staff[0]["admin"] = true;
        } else {
          staff[0]["admin"] = false;
        }
        staff_arr.push(staff[0]);
      }
    }

    staff_arr.unshift({
      "account": route.params.account,
      "name_1": route.params.name_1,
      "name_2": route.params.name_2,
      "shop_id": route.params.shop_id,
      "shop_name": "",
      "staff_photo1": route.profile?route.profile[0].staff_photo1:'',
      "admin": user_id.includes(route.params.account)
    })

    setStaff_list(staff_arr);

    var staff_flg = "";

    const header_name_ = route.room.room_type=="0"?route.room.name_1+route.room.name_2:route.room.room_name;

    function isString(value) {
      if (typeof value === "string" || value instanceof String) {
        return true;
      } else {
        return false;
      }
    }

    if (isString(header_name_)) {
      setHeader_name(header_name_);
    } else {
      staff_flg = "1";
    }

    const startTime = Date.now(); // 開始時間

    const json = await getCOM(staff_flg);

    // ログアウトしてたら中断
    if(!global.sp_token && !global.sp_id) return;

    if (json != null && json != false) {

      if (staff_flg) {
        await Insert_staff_all_db(json["staff_list"]);
        
        var user_id_ = route.room["user_id"].split(',');

        var account = user_id_.filter(function(id) {
          return id !== route.params.account;
        });

        var sql = `select * from staff_all where account = '${account[0]}';`;
        var staff = await db_select(sql);

        route.room["account"]      = account[0];
        route.room["name_1"]       = staff[0]["name_1"];
        route.room["name_2"]       = staff[0]["name_2"];
        route.room["shop_id"]      = staff[0]["shop_id"];
        route.room["shop_name"]    = staff[0]["shop_name"];
        
        if (staff[0]["staff_photo1"]) {
          const imageUrl = domain+"img/staff_img/"+staff[0]["staff_photo1"];
          route.room["staff_photo1"] = {uri:imageUrl};
        } else {
          route.room["staff_photo1"] = require('../../assets/photo4.png');
        }

        setHeader_name(route.room.name_1+route.room.name_2);

      }

      await Insert_chatmessage_db(json["chatmessage"]);
      
      const endTime2 = Date.now(); // 終了時間
      const time2 = (endTime2 - startTime)/1000;
      console.log('トーク登録：'+time2 + '秒')

    } else {

      var sql = `select chat_message.*,staff_all.name_1,staff_all.name_2,staff_all.staff_photo1 from chat_message 
      left join staff_all on chat_message.user_id = staff_all.account
      where ( room_id = '${route.room.room_id}' ) order by time desc;`;

      var talk_ = await db_select(sql);

      if (talk_ == false) talk_ = [];

      setTalk(talk_);
      
      const errTitle = 'ネットワークの接続に失敗しました';
      const errMsg = '直近の'+talk_.length+'件のメッセージのみ表示します\n※送受信やおすすめ物件、画像の表示などはできません'
      Alert.alert(errTitle,errMsg);

      setLoading(false);
    }

    setLoading(false);
    return;

  }, []);

  const getCOM = useCallback((staff_flg) => {
    
    return new Promise((resolve, reject)=>{
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
          act:'chatmessage',
          room_id:route.room.room_id,
          fc_flg: global.fc_flg,
          staff_all:staff_flg
        })
      })
      .then((response) => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        console.log(error);
        resolve(false);
      });
    })

  });
  
  // websocket通信(繋がった)
  route.websocket2.onopen = (open) => {
    console.log('open');
  };
  
  // websocket通信(メール届いたら更新)
  route.websocket2.onmessage = (message) => {
    console.log('chattalk_websocket')
    onRefresh(false);
  }
  
  // websocket通信(切断したら再接続)
  route.websocket2.onclose = (close) => {
    
    if (global.sp_token & global.sp_id) {
      console.log('closed');
      const WS_URL2 = 'ws://54.168.20.149:8080/ws/'+route.params.account+'/'
      navigation.reset({
        index: 0,
        routes: [{
          name: 'TalkScreen' ,
          params: route.params ,
          customer:route.customer,
          websocket: route.websocket,
          websocket2: new WebSocket(WS_URL2),
          profile:route.profile,
        }],
      });
    }
    
  }
  
  useEffect(() => {
    
    if (talk != null && talk.length > 0) {
      const msg = talk.map(com => {
        
        if (com.del_flg){
          return
        }
        
        var read_arr = (com.user_read).split(',');
        read_arr = read_arr.filter(r => r !== route.params.account);
        
        if (com.user_id === route.params.account) {
          const data = {
            _id:  com.message_id,
            text: com.message_flg=="1"?'':com.note,
            image:com.message_flg=="1"?com.note:'',
            createdAt: com.time,
            room_type:route.room.room_type,
            user: {
              _id: 1,
              name: '',
              avatar:null,
              status:"",
              title:"",
              html_flg:"",
              user_read:read_arr,
            }
          }
          return data;
        } else if (com.user_id === "system") {
          const data = {
            _id:  com.message_id,
            text: com.note,
            createdAt: com.time,
            room_type:route.room.room_type,
            user: {
              _id: 3,
              name: '',
              avatar:null,
              status:"",
              title:"",
              html_flg:"",
              user_read:read_arr,
            }
          }
          return data;
        } else {

          const image_ = com.staff_photo1!=null?
          domain+"img/staff_img/"+com.staff_photo1:
          require('../../assets/photo4.png');

          const data = {
            _id:  com.message_id,
            text: com.message_flg=="1"?'':com.note,
            image:com.message_flg=="1"?com.note:'',
            createdAt: com.time,
            room_type:route.room.room_type,
            user: {
              _id: 2,
              name: com.name_1+com.name_2,
              avatar:image_,
              status:"",
              title:"",
              html_flg:"",
              user_read:read_arr,
            }
          }
          return data;
        }
      }).filter(data => data);
      setMessages(msg);
    }

  }, [talk])
  
  const renderBubble = props => {
    
    const message_sender_id = props.currentMessage.user._id;

    if (message_sender_id == 3) {
      return (
        <View style={{flex:1,alignItems:'center'}}>
          <View style={{paddingVertical:5,paddingHorizontal:10,backgroundColor:'#b4b4b4',borderRadius:5}}>
            <Text style={{textAlign:'center',fontSize:10,color:"#fff"}}>
              {props.currentMessage.createdAt}
            </Text>
            <Text style={{textAlign:'center',fontSize:12,color:"#fff",fontWeight:'700'}}>
              {props.currentMessage.text}
            </Text>
          </View>
        </View>
      );
    } else {
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
              backgroundColor: '#346cb8',
              marginLeft: 5,
              marginVertical: 5,
              borderBottomLeftRadius: 1,
              maxWidth: '75%',
            },
          }}
        />
      );
    }
    
  };
  
  // コミュニケーション履歴データベース登録
  async function Insert_chatmessage_db(msg){

    if (msg) {
      
      var del_list = []; // 削除リスト
      var count_   = 0;  // 20件までのカウント

      // 最新トーク
      talklist: for (var c=0;c<msg.length;c++) {

        var c_msg = msg[c];

        if (count_ == 20) break;

        // 削除フラグは追加しない
        if (c_msg.del_flg) {
          del_list.push(c_msg);
          continue talklist;
        }

        var sql = `insert or replace into chat_message values (?,?,?,?,?,?,?,?,?,?);`;

        var user_read = '';

        var read_arr = (c_msg.user_read).split(',')
        var read_in_ = read_arr.includes(route.params.account);

        if (read_in_) {
          user_read = c_msg.user_read;
        } else {
          if (c_msg.user_read == "" || !c_msg.user_read) {
            user_read = route.params.account;
          } else {
            user_read = c_msg.user_read+","+route.params.account;
          }
        }

        var data = [
          c_msg.room_id,
          c_msg.message_id,
          c_msg.user_id,
          c_msg.send_list,
          c_msg.note,
          c_msg.message_flg,
          user_read,
          c_msg.time,
          c_msg.upd_date,
          c_msg.del_flg
        ];

        count_++;
        await db_write(sql,data);

      }

      // 削除フラグが立っているコミュニケーション履歴を削除する
      for (var d=0;d<del_list.length;d++) {
        var delsql = `delete from chat_message where (room_id = ? and message_id = ?);`
        var data = [
          del_list[d]["room_id"],
          del_list[d]["message_id"]
        ]
        await db_write(delsql,data);
      }

      // 20件超えたら古いものから削除する
      var sql = `select count(*) as count from chat_message where room_id = '${route.room.room_id}';`;
      var talk_ = await db_select(sql);
      const cnt = talk_[0]["count"];
      
      if (cnt >= 20) {
        var delcus = `DELETE FROM chat_message WHERE room_id = '${route.room.room_id}' AND time NOT IN (SELECT time FROM chat_message WHERE room_id = '${route.room.room_id}' ORDER BY time DESC LIMIT 20);`;
        await db_write(delcus,[]);
      }

    }
  
    var sql = `select chat_message.*,staff_all.name_1,staff_all.name_2,staff_all.staff_photo1 from chat_message 
              left join staff_all on chat_message.user_id = staff_all.account
              where ( room_id = '${route.room.room_id}' ) order by time desc;`;
    var talk_ = await db_select(sql);

    if (talk_ == false) talk_ = [];

    setTalk(talk_);
  }
  
  // スタッフリストデータベース登録
  async function Insert_staff_all_db(staff_all) {

    if (staff_all) {

      const startTime = Date.now(); // 開始時間

      // ローカルDBのスタッフ情報
      const stf = await GetDB('staff_all');
  
      var DBstf = [];
      if (stf != false) {
        DBstf = stf.map((s) => {
          return s.account
        })
      }
  
      // 最新のスタッフ情報
      var APIstf = [];
  
      for (var s=0;s<staff_all.length;s++) {
        var staff = staff_all[s];
        var staff_insert = `insert or replace into staff_all values (?,?,?,?,?,?);`
        var staff_data = [staff.account, staff.shop_id, staff.name, staff.name_1, staff.name_2, staff.staff_photo1];
        await db_write(staff_insert,staff_data);
        APIstf.push(staff.account);
      }
  
      // 削除するスタッフ情報
      const DELstf = DBstf.filter(stf => !APIstf.includes(stf));
      
      for (var d=0;d<DELstf.length;d++) {
        var account = DELstf[d];
        var staff_delete = `delete from staff_all where ( account = ? );`;
        await db_write(staff_delete,[account]);
      }
      
      const endTime = Date.now(); // 終了時間
      const time = (endTime - startTime)/1000;
      console.log('staff_all：'+time + '秒');
    }

  }

  async function onSend() {
    
    setLoading(true);

    let newMessage = [];
    newMessage[0] = {
      _id: '',
      text: '',
      image: '',
      createdAt: '',
      room_type:route.room.room_type,
      user: {
        _id: 1,
        name: route.params.account,
        status: '',
        title: '',
        user_read:[],
      }
    }
    
    newMessage[0]._id = String(Number(messages[0]._id)+1);
    
    newMessage[0].createdAt = new Date();
    newMessage[0].text      = msgtext;

    var user_list = route.room.user_list;

    // 所属店舗グループの場合、所属スタッフ全員をセットする
    if (route.room.room_type == "2" && route.room.user_id == route.params.shop_id) {
      var sql = `select account from staff_all where shop_id = '${route.params.shop_id}';`;
      var staffs = await db_select(sql);
      user_list = staffs.map(item => item.account).join(',') + "," + route.params.account;
    }
    
    fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
    {
      method: 'POST',
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        ID: route.params.account,
        pass: route.params.password,
        act: "chatmessage",
        fc_flg: global.fc_flg,
        room_id: route.room.room_id,
        send_flg: 1,
        message_flg: "0",
        note: msgtext,
        user_list: user_list,
      }),
    })
    .then((response) => response.json())
    .then(async(json) => {
      setLoading(false);
      setMessages(GiftedChat.append(messages, newMessage));
      await Insert_chatmessage_db(json["chatmessage"]);
    })
    .catch((error) => {
      setLoading(false);
      console.log(error)
      Alert.alert("登録に失敗しました");
    })

  }

  async function saveGroupname() {

    if (!groupname) {
      Alert.alert('','グループ名を入力してください');
      return
    }

    setLoading(true);

    const roomdata = {
      room_id:route.room.room_id,
      room_name:groupname,
      room_img:group_img,
      room_type:route.room.room_type,
      user_id:route.room.user_id,
      user_list:route.room.user_list,
    }

    var sql = `update chat_room set room_name = ?, upd_date = ? where room_id = ?;`;

    var data = [
      groupname,
      Moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      route.room.room_id,
    ]
    
    await db_write(sql,data);

    await updRoom_fetch(roomdata);
    
    setLoading(false);
    setGroup_img_change(false);
    setSettingGroup(false);
    setHeader_name(groupname);

  }
  
  async function addAdminGroup() {

    if (member.admin) {
      var txt = `${member.name_1}${member.name_2}さん(${member.shop_name})を管理者から削除しますか？`;
    } else {
      var txt = `${member.name_1}${member.name_2}さん(${member.shop_name})を管理者に追加しますか？`;
    }

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `確認`,
        txt,
        [
          {
            text: "はい",
            onPress: () => {resolve(true);}
          },
          {
            text: "いいえ",
            style: "cancel",
            onPress:() => {resolve(false);}
          },
        ]
      );
    });

    if (!await AsyncAlert()) return;

    var room = route.room;
    room["room_name"] = header_name;

    if (member.admin) {
      var user_id = (room.user_id).split(',');
      user_id = user_id.filter(u => u !== member.account);
      user_id = user_id.join(',');
  
      room["user_id"] = user_id;
    } else {
      room["user_id"] = `${route.room.user_id},${member.account}`;
    }

    const roomdata = {
      room_id:route.room.room_id,
      room_name:header_name,
      room_img:null,
      room_type:route.room.room_type,
      user_id:room["user_id"],
      user_list:route.room.user_list,
    }

    var sql = `update chat_room set user_id = ?, upd_date = ? where room_id = ?;`;

    var data = [
      room["user_id"],
      Moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      route.room.room_id,
    ]

    await db_write(sql,data);

    await updRoom_fetch(roomdata);

    setSettingGroup(false);
    setSettingMember(false);
    
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

  async function delGroupMember() {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `確認`,
        `${member.name_1}${member.name_2}さん(${member.shop_name})を削除しますか？`,
        [
          {
            text: "はい",
            onPress: () => {resolve(true);}
          },
          {
            text: "いいえ",
            style: "cancel",
            onPress:() => {resolve(false);}
          },
        ]
      );
    });

    if (!await AsyncAlert()) return;

    var room = route.room;
    room["room_name"] = header_name;

    var user_list = (room.user_list).split(',');
    user_list = user_list.filter(u => u !== member.account);
    user_list = user_list.join(',');

    room["user_list"] = user_list;

    const roomdata = {
      room_id:route.room.room_id,
      room_name:header_name,
      room_img:null,
      room_type:route.room.room_type,
      user_id:route.room.user_id,
      user_list:user_list,
    }

    var sql = `update chat_room set user_list = ?, upd_date = ? where room_id = ?;`;

    var data = [
      user_list,
      Moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      route.room.room_id,
    ]

    await db_write(sql,data);

    await updRoom_fetch(roomdata);

    fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
    {
      method: 'POST',
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        ID: route.params.account,
        pass: route.params.password,
        act: "chatmessage",
        fc_flg: global.fc_flg,
        room_id: route.room.room_id,
        send_flg: 1,
        message_flg: "3",
        note: `${member.name_1}${member.name_2}さんを「${room["room_name"]}」から削除しました。`,
        user_list: user_list,
      }),
    })
    .then((response) => response.json())
    .then((json) => {
      setSettingGroup(false);
      setSettingMember(false);
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
    })
    .catch((error) => {
      setLoading(false);
      console.log(error)
      Alert.alert("登録に失敗しました");
    })

  }

  async function updRoom_fetch(data) {

    let formData = new FormData();
    formData.append('ID',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act','company');
    formData.append('fc_flg',global.fc_flg);
    formData.append('add_room',1);
    formData.append('room_id',data.room_id);
    formData.append('room_name',data.room_name);
    formData.append('room_type',data.room_type);
    formData.append('user_id',data.user_id);
    formData.append('user_list',data.user_list);
    formData.append('upd_flg',1);
    formData.append('formdata_flg',1);
    
    if (data.room_img != null && group_img_change) {

      var Image_ = data.room_img;
        
      let filename = Image_.uri.split('/').pop();
  
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      
      formData.append('file', { uri: Image_.uri, name: filename, type });

    }

    return new Promise((resolve, reject)=>{

      fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
      {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data',
        },
        body: formData,
      })
      .then((response) => response.json())
      .then((json) => {
        resolve(true);
      })
      .catch((error) => {
        console.log(error)
        Alert.alert("登録に失敗しました");
        resolve(false);
      })

    })
  }

  const LibraryPermissionsCheck = async() => {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `カメラロールへのアクセスが無効になっています`,
        "設定画面へ移動しますか？",
        [
          {
            text: "キャンセル",
            style: "cancel",
            onPress:() => {resolve(false)}
          },
          {
            text: "設定する",
            onPress: () => {
              Linking.openSettings();
              resolve(false)
            }
          }
        ]
      );
    });

	  // カメラロールのアクセス許可を付与
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        await AsyncAlert();
        return false;
      } else {
        return true;
      }
    }

  }
  
  // カメラロールから画像またはビデオを選択
  const pickImage = async (item) => {
    
    if (!await LibraryPermissionsCheck()) return;
    
    setLoading(true);
      
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    
    if (!result.canceled) {

      var Image_ = result.assets[0];
      
      let filename = Image_.uri.split('/').pop();

      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      
      var user_list = route.room.user_list;

      // 所属店舗グループの場合、所属スタッフ全員をセットする
      if (route.room.room_type == "2" && route.room.user_id == route.params.shop_id) {
        var sql = `select account from staff_all where shop_id = '${route.params.shop_id}';`;
        var staffs = await db_select(sql);
        user_list = staffs.map(item => item.account).join(',') + "," + route.params.account;
      }

      let formData = new FormData();
      formData.append('ID',route.params.account);
      formData.append('pass',route.params.password);
      formData.append('act','chatmessage');
      formData.append('fc_flg',global.fc_flg);
      formData.append('room_id',route.room.room_id);
      formData.append('send_flg',1);
      formData.append('message_flg',"1");
      formData.append('note',"");
      formData.append('user_list',user_list);
      formData.append('file', { uri: Image_.uri, name: filename, type });
      formData.append('formdata_flg',1);

      fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
      {
        method: 'POST',
        headers: {
          'content-type': 'multipart/form-data',
        },
        body: formData,
      })
      .then((response) => response.json())
      .then(async(json) => {
        setMessages(
          GiftedChat.append(messages,
            [{
              _id:String(Number(messages[0]._id)+1),
              text:'',
              image:Image_.uri,
              createdAt: new Date(),
              room_type:route.room.room_type,
              user:{
                _id: 1,
                name: route.params.account,
                status: "",
                title: "",
                user_read:[],
              }
            }]
          )
        );
        await Insert_chatmessage_db(json["chatmessage"]);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error)
        const errorMsg = "ファイルをアップできませんでした";
        Alert.alert(errorMsg);
        setLoading(false);
      })
      
    }

    setLoading(false);
	};
	
  // カメラロールから画像またはビデオを選択
  const pickImage2 = async () => {
    
    if (!await LibraryPermissionsCheck()) return;
      
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    
    if (!result.canceled) {

      var Image_ = result.assets[0];

      setGroup_img(Image_);
      setGroup_img_change(true);
      
    }
	};

	// ファイル選択
	const pickDocument = async () => {
	  
    let result = await DocumentPicker.getDocumentAsync({});
    
    setLoading(true);

    if (!result.canceled) {
      
      let filename = result.uri.split('/').pop();

      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      
      var user_list = route.room.user_list;

      // 所属店舗グループの場合、所属スタッフ全員をセットする
      if (route.room.room_type == "2" && route.room.user_id == route.params.shop_id) {
        var sql = `select account from staff_all where shop_id = '${route.params.shop_id}';`;
        var staffs = await db_select(sql);
        user_list = staffs.map(item => item.account).join(',') + "," + route.params.account;
      }

      let formData = new FormData();
      formData.append('ID',route.params.account);
      formData.append('pass',route.params.password);
      formData.append('act','chatmessage');
      formData.append('fc_flg',global.fc_flg);
      formData.append('room_id',route.room.room_id);
      formData.append('send_flg',1);
      formData.append('message_flg',"2");
      formData.append('note',"");
      formData.append('user_list',user_list);
      formData.append('file', { uri: result.uri, name: filename, type });
      formData.append('formdata_flg',1);
      
      fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
      {
        method: 'POST',
        body: formData,
        header: {
          'content-type': 'multipart/form-data',
        },
      })
      .then((response) => response.json())
      .then(async(json) => {
        
        const text = json["chatmessage"][0]["note"];

        setMessages(
          GiftedChat.append(messages,
            [{
              _id:String(Number(messages[0]._id)+1),
              text:'',
              image:text,
              createdAt: new Date(),
              room_type:route.room.room_type,
              user:{
                _id: 1,
                name: route.params.account,
                status: "",
                title: "",
                user_read:[],
              }
            }]
          )
        );
        await Insert_chatmessage_db(json["chatmessage"]);
        setLoading(false);
      })
      .catch((error) => {
        console.log(error)
        const errorMsg = "ファイルをアップできませんでした";
        Alert.alert(errorMsg);
        setLoading(false);
      })

    }

    setLoading(false);
  };

  const groupList = useMemo(() => {

    if (staff_list.length == 0) {
      return null;
    } else {

      return (
        <FlatList
          bounces={false}
          numColumns={adminGroup?4:5}
          data={staff_list}
          keyboardShouldPersistTaps="always"
          renderItem={({ item,index }) => {
            return (
              <>
              {index == 0&&adminGroup&&(
                <View style={styles.ListItem2}>
                  <TouchableOpacity
                    style={styles.ListItem3}
                    onPress={() => {
                      setSettingGroup(false);
                      navigation.reset({
                        index: 0,
                        routes: [{
                          name: 'Staffs' ,
                          params: route.params,
                          websocket:route.websocket,
                          websocket2: route.websocket2,
                          profile:route.profile,
                          previous:'ChatTalk',
                          flg: 'upd_room',
                          room:route.room
                        }],
                      });
                    }}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="plus"
                      color="#000"
                      size={35}
                    />
                  </TouchableOpacity>
                  <Text style={styles.name2}>追加</Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.ListItem2}
                onPress={()=>{
                  setMember(item);
                  setSettingMember(true);
                }}
                disabled={adminGroup&&index!=0?false:true}
              >
                {item.staff_photo1?
                (
                  <Image
                    style={styles.icon2}
                    source={{uri:domain+"img/staff_img/"+item.staff_photo1}}
                  />
                ):(
                  <Image
                    style={styles.icon2}
                    source={require('../../assets/photo4.png')}
                  />
                )
                }
                <Text style={styles.name2}>
                  {item.name_1}{item.name_2}
                </Text>
                {item.admin&&(
                  <View style={styles.adm_stf}>
                    <Text style={styles.adm_text}>管</Text>
                  </View>
                )}
              </TouchableOpacity>
              </>
            );
          }}
          keyExtractor={(item) => `${item.account}`}
        />
      )
    }
  },[staff_list])


  const onLongPress = (context, message) => {
    var options = ['コピー','キャンセル'];

    const cancelButtonIndex = options.length - 1;

    context.actionSheet().showActionSheetWithOptions({
      options,
      cancelButtonIndex
    }, (buttonIndex) => {
      switch (buttonIndex) {
        case 0:
          Clipboard.setStringAsync(message.text);
          break;
        case 1:
          break;
      }
    });

  }

  const bgc = !global.fc_flg?"#81aee6":"#e6c4f5";
  const bbc = !global.fc_flg?"#6c93c4":"#c4a3d4";

  return (
    <>
    <Loading isLoading={isLoading} />
    <Modal
      isVisible={userModal}
      swipeDirection={['up']}
      onSwipeComplete={()=>setUserModal(false)}
      backdropOpacity={0.5}
      animationInTiming={100}
      animationOutTiming={300}
      animationIn={'fadeIn'}
      animationOut={'fadeOut'}
      propagateSwipe={true}
      transparent={true}
      onBackdropPress={()=>setUserModal(false)}
      style={{alignItems:'center',zIndex:100}}
    >
      <View style={styles.modal3}>
        <TouchableOpacity
          style={styles.clsbtn}
          onPress={()=>setUserModal(false)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="close-circle"
            color="#999"
            size={30}
          />
        </TouchableOpacity>
        {isNaN(userInfo.avatar)?
          (
            <TouchableOpacity
              style={{width:120,height:120}}
              activeOpacity={0.7}
              onPress={()=>{setUserImage(true)}}
            >
              <Image
                style={styles.icon5}
                source={{uri:userInfo.avatar}}
              />
            </TouchableOpacity>
          ):(
            <Image
              style={styles.icon5}
              source={require('../../assets/photo4.png')}
            />
          )
        }
        <Text style={[styles.name3,{marginTop:30}]}>{userInfo.name}</Text>
      </View>
      <Modal
        isVisible={userImage}
        swipeDirection={['up']}
        onSwipeComplete={()=>setUserImage(false)}
        backdropOpacity={1}
        animationInTiming={100}
        animationOutTiming={300}
        animationIn={'fadeIn'}
        animationOut={'fadeOut'}
        propagateSwipe={true}
        transparent={true}
        onBackdropPress={()=>setUserImage(false)}
        style={{alignItems:'center',zIndex:999}}
      >
        <TouchableOpacity
          style={styles.clsbtn}
          onPress={()=>setUserImage(false)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="close-circle"
            color="#999"
            size={30}
          />
        </TouchableOpacity>
        <View style={{width:Width,height:Width}}>
          <Image
            style={{width:Width,height:Width}}
            source={{uri:userInfo.avatar}}
          />
        </View>
      </Modal>
    </Modal>
    <Modal
      isVisible={settingGroup}
      swipeDirection={['up']}
      onSwipeComplete={()=>setSettingGroup(false)}
      backdropOpacity={0.5}
      animationInTiming={100}
      animationOutTiming={300}
      animationIn={'fadeIn'}
      animationOut={'fadeOut'}
      propagateSwipe={true}
      transparent={true}
      style={{margin: 0,justifyContent:'flex-start'}}
      onBackdropPress={()=>setSettingGroup(false)}
      coverScreen={false}
    >
      <TouchableWithoutFeedback onPress={()=>{Keyboard.dismiss()}}>
        <View style={{height:'100%',backgroundColor:'#fff'}}>
          <View style={styles.inputview}>
            <View style={styles.inputview2}>
              <TouchableOpacity
                style={{width:70,height:70}}
                activeOpacity={0.7}
                onPress={()=>{pickImage2()}}
                disabled={!adminGroup}
              >
                {group_img?(
                  <Image
                    style={styles.icon4}
                    source={{uri:group_img.uri}}
                  />
                ):(
                  <Image
                    style={styles.icon4}
                    source={require('../../assets/group.jpg')}
                  />
                )}
                {adminGroup&&(
                  <View style={styles.grp_icon} >
                    <MaterialCommunityIcons
                      name="camera-outline"
                      color="#000"
                      size={13}
                    />
                  </View>
                )}
              </TouchableOpacity>
              <View style={{marginLeft:10}}>
                <Text style={{fontSize:16,marginBottom:5}}>グループ名</Text>
                <TextInput
                  style={styles.searchInput}
                  value={groupname}
                  onChangeText={(text) => {
                    setGroupname(text);
                  }}
                  placeholderTextColor="#b3b3b3"
                  editable={adminGroup}
                />
              </View>
            </View>
            {adminGroup&&(
              <TouchableOpacity
                style={[styles.searchBtn,{backgroundColor:bgc,borderBottomColor:bbc}]}
                activeOpacity={0.7}
                onPress={()=>{saveGroupname()}}
              >
                <Text style={styles.searchBtntxt}>保　存</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={{marginHorizontal:10,justifyContent:'center',width:'100%'}}>
            {adminGroup?(
              <Text style={{fontSize:14,marginBottom:10,color:'#999'}}>管理者だけがグループ設定を変更できます。{"\n"}メンバーをタップして管理者の変更と削除が行えます。</Text>
            ):(
              <Text style={{fontSize:14,marginBottom:10,color:'#999'}}>管理者だけがグループ設定を変更できます。{"\n"}管理者権限は管理者に変更してもらう必要があります。</Text>
            )}
            <Text style={{fontSize:16,marginBottom:5}}>メンバー</Text>
            {groupList}
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
    <Modal
      isVisible={settingMember}
      swipeDirection={['up']}
      onSwipeComplete={()=>setSettingMember(false)}
      backdropOpacity={0.5}
      animationInTiming={100}
      animationOutTiming={300}
      animationIn={'fadeIn'}
      animationOut={'fadeOut'}
      propagateSwipe={true}
      transparent={true}
      onBackdropPress={()=>setSettingMember(false)}
    >
      <View style={styles.modal2}>
        <TouchableOpacity
          style={styles.clsbtn}
          onPress={()=>setSettingMember(false)}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name="close-circle"
            color="#999"
            size={30}
          />
        </TouchableOpacity>
        <View style={{alignItems:'center',marginBottom:30}}>
          {member.staff_photo1?
          (
            <Image
              style={styles.icon3}
              source={{uri:domain+"img/staff_img/"+member.staff_photo1}}
            />
          ):(
            <Image
              style={styles.icon3}
              source={require('../../assets/photo4.png')}
            />
          )
          }
          <Text style={styles.name3}>
            {member.name_1}{member.name_2}
          </Text>
        </View>
        <View style={{flexDirection:'row'}} >
          <TouchableOpacity
            style={[styles.searchBtn2,{backgroundColor:bgc,borderBottomColor:bbc}]}
            activeOpacity={0.7}
            onPress={()=>{addAdminGroup()}}
          >
            <Text style={styles.searchBtntxt}>{member.admin?"管理者から削除":"管理者に追加"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.searchBtn2}
            activeOpacity={0.7}
            onPress={()=>{delGroupMember()}}
          >
            <Text style={styles.searchBtntxt}>削　除</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    <GiftedChat
      messages={messages}
      text={msgtext?msgtext:''}
      onInputTextChanged={text => {setMsgtext(text)}}
      placeholder="テキストを入力してください"
      onSend={() => onSend()}
      renderMessage={(props) => {
        return (
          <GestureRecognizer
            onSwipeRight={()=>{backAction()}}
            config={{
              velocityThreshold: 0.3,
              directionalOffsetThreshold: 80,
            }}
            style={{flex: 1}}
          >
            <Message {...props}/>
          </GestureRecognizer>
        );
      }}
      showAvatarForEveryMessage={true}
      onPressAvatar={(user)=>{
        setUserModal(true);
        setUserInfo({name:user.name,avatar:user.avatar})
      }}
      onLongPress={(context, message)=>onLongPress(context, message)}
      renderBubble={renderBubble}
      renderUsernameOnMessage={route.room.room_type=="0"?false:true}
      renderSend={(props) => {
        return (
          <Send {...props} containerStyle={styles.sendContainer}>
            <Feather name='send' color='gray' size={25} />
          </Send>
        );
      }}
      user={{_id: 1,text:msgtext}}
      textInputStyle={styles.textInput}
      textStyle={{color: "black"}}
      keyboardShouldPersistTaps={'never'}
      minInputToolbarHeight={30}
      messagesContainerStyle={
        Platform.OS === 'android'?{paddingBottom:50}:
        Platform.OS === 'ios'&&!isFocused?
        {paddingBottom:30}:{paddingBottom:0}
      }
      maxComposerHeight={150}
      renderInputToolbar={(props) => (
          <InputToolbar {...props}
            containerStyle={{backgroundColor:!global.fc_flg?'#47a9ce':'#fe95bb',paddingBottom:20}}
          />
        )
      }
      bottomOffset={Platform.select({ios: -13})} // 入力欄下の謎のすき間埋める(iosのみ)
      dateFormat={'MM/DD(ddd)'}
      renderActions={(props) => {
        if (!isFocused) {
          return (
            <>
            <Actions {...props} icon={() => <Feather name={'image'} color={!global.fc_flg?'#191970':'#ffffff'} size={25} />} onPressActionButton={()=>pickImage()} />
            <Actions {...props} icon={() => <Feather name={'file'} color={!global.fc_flg?'#191970':'#ffffff'} size={25} />} onPressActionButton={()=>pickDocument()} />
            </>
          );
        } else {
          return null;
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
  roomheader :{
    width:'100%',
    backgroundColor:'#1d449a',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center'
  },
  inputview: {
    padding:10,
    marginBottom:10,
  },
  inputview2: {
    zIndex:999,
    height:70,
    flexDirection:'row',
    alignItems:'center',
    marginVertical:10,
  },
  searchInput: {
    fontSize: 16,
    width: Width-100,
    height: 48,
    paddingHorizontal: 10,
    borderColor: "#dddddd",
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  searchBtn: {
    width: "100%",
    height: 40,
    alignItems: "center",
    justifyContent:'center',
    marginTop:10,
    borderRadius:5,
    borderBottomWidth:3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 1,
    elevation:5
  },
  searchBtn2: {
    width: "40%",
    height: 40,
    marginHorizontal:5,
    alignItems: "center",
    justifyContent:'center',
    backgroundColor:"#f59898",
    borderBottomColor:"#db8686",
    borderRadius:5,
    borderBottomWidth:3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation:5
  },
  searchBtntxt: {
    color:"#fff",
    fontSize:16,
    fontWeight:"700"
  },
  ListItem2: {
    width:(Width-20)*0.2,
    alignItems: "center",
    marginBottom:8,
    paddingHorizontal:5
  },
  ListItem3: {
    width:60,
    height:60,
    borderRadius:100,
    borderWidth:0.5,
    borderColor:'#999',
    alignItems: "center",
    justifyContent:'center',
  },
  ListInner: {
    flex: 1,
  },
  icon2: {
    width:55,
    height:55,
    borderRadius:100,
    backgroundColor:'#eee'
  },
  icon3: {
    width:100,
    height:100,
    borderRadius:100,
    backgroundColor:'#eee'
  },
  icon4: {
    width:70,
    height:70,
    borderRadius:100,
    backgroundColor:'#eee'
  },
  icon5: {
    width:120,
    height:120,
    borderRadius:100,
    backgroundColor:'#eee'
  },
  name2: {
    marginTop:5,
    fontSize: 10,
  },
  name3: {
    marginTop:10,
    fontSize: 18,
  },
  modal2: {
    height:250,
    backgroundColor:'#fff',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5
  },
  modal3: {
    height:250,
    width:250,
    backgroundColor:'#fff',
    justifyContent:'center',
    borderRadius:5,
    alignItems:'center'
  },
  clsbtn: {
    position:'absolute',
    top:0,
    right:0,
    width:60,
    height:60,
    justifyContent:'center',
    alignItems:'center',
  },
  adm_stf: {
    justifyContent:"center",
    alignItems: "center",
    position: "absolute",
    backgroundColor: "red",
    borderRadius: 10,
    paddingLeft: 5,
    paddingRight: 5,
    right: 5,
    top:0,
    zIndex:999,
    width:20,
    height:20,
    shadowColor: "#666",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5
  },
  adm_text: {
    fontSize:10,
    color: "white",
    fontWeight:'700'
  },
  grp_icon: {
    width:20,
    height:20,
    borderRadius: 100,
    backgroundColor:'#fff',
    alignItems:'center',
    justifyContent:'center',
    position:'absolute',
    bottom:0,
    right:0,
    shadowColor: "#666",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5
  }
});
