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
import Toast from 'react-native-root-toast';

import Loading from '../components/Loading';

import { GetDB,db_select,db_write } from '../components/Databace';

LogBox.ignoreAllLogs()

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

const Height = Dimensions.get("window").height;
const Width = Dimensions.get("window").width;

export default function SupportChat(props) {
  
  if (AppState.currentState === 'active') {
    Notifications.setBadgeCountAsync(0);
  }
  
  const { navigation, route } = props;
  
  const [isLoading, setLoading] = useState(false);

  const [modal, setModal] = useState(false);
  
  const [talk, setTalk] = useState([]);

  const [messages, setMessages] = useState([]);

  const [msgtext,setMsgtext] = useState('');
  
  const [isFocused, setIsFocused] = useState(false);
  
  const [ws, setWs] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [edit, setEdit] = useState(false);
  
  const [shopID, setShopID] = useState("");
  const [staffID, setStaffID] = useState("");
  const [roomID, setRoomID] = useState("");
  const [wsID, setWsID] = useState("");
  const [totalcloudID, setTotalcloudID] = useState("");

  const [holidays, setHolidays] = useState([]);

  useEffect(() => {
    return () => {
      if (ws) {
        messageNotify("staffTypingReset");
        exitChatroom();
        ws.close();
      }
    };
  }, [ws]);

  // 端末の戻るボタン
  const backAction = () => {
    if (!isLoading) {
      Alert.alert(
        "確認",
        "サポートチャットを閉じますか？\n閉じると内容は再度確認できません。",
        [
          {
            text: "はい",
            onPress: () => {
              navigation.reset({
                index: 0,
                routes: [{
                  name: route.previous ,
                  params: route.params,
                  websocket:route.websocket,
                  websocket2: route.websocket2,
                  profile:route.profile,
                  previous:'SupportChat',
                  withAnimation2: true
                }],
              });
            }
          },
          {
            text: "いいえ",
          },
        ]
      );
    }
    return true;
  };
  
  useEffect(() => {

    navigation.setOptions({
      headerStyle: !global.fc_flg?{ backgroundColor: '#6C9BCF', height: 110}:{ backgroundColor: '#FF8F8F', height: 110},
      headerTitle:() => (<Text style={styles.header}>サポートチャット</Text>),
      headerLeft: () => (
          <Feather
            name='chevron-left'
            color='white'
            size={30}
            onPress={() => {
              if (!isLoading) {
                Alert.alert(
                  "確認",
                  "サポートチャットを閉じますか？\n閉じると内容は再度確認できません。",
                  [
                    {
                      text: "はい",
                      onPress: () => {
                        navigation.reset({
                          index: 0,
                          routes: [{
                            name: route.previous ,
                            params: route.params,
                            websocket:route.websocket,
                            websocket2: route.websocket2,
                            profile:route.profile,
                            previous:'SupportChat',
                            withAnimation2: true
                          }],
                        });
                      }
                    },
                    {
                      text: "いいえ",
                    },
                  ]
                );
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
    const keyboardWillShowListener = Keyboard.addListener(
      'keyboardWillShow',
      () => {
        setIsFocused(true);
      }
    );
    const keyboardWillHideListener = Keyboard.addListener(
      'keyboardWillHide',
      () => {
        messageNotify("staffTypingReset");
        setIsFocused(false);
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [msgtext]);

  useEffect(() => {

    console.log("--------------------------------------");

    getHoliday().then((holidaysData) => {
      if (holidaysData) {  
        setHolidays(holidaysData);
      }
    })

    setTimeout(function() {
      setModal(true);
    }, 500);

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
        if (
          response.notification.request.content.data.timeline &&
          global.sp_id
        ) {
          const tl_data = response.notification.request.content.data.timeline;
          navigation.navigate(
            'Post',{
              name: 'Post' ,
              params: route.params,
              websocket:route.websocket,
              websocket2: route.websocket2,
              profile:route.profile,
              previous:'TimeLine',
              post: tl_data,
              flg:tl_data["flg"],
            }
          );
        }
        if (
          response.notification.request.content.data.thank &&
          global.sp_id
        ) {
          navigation.reset({
            index: 0,
            routes: [{
              name: 'Thanks' ,
              params: route.params,
              websocket:route.websocket,
              websocket2: route.websocket2,
              profile:route.profile,
              previous:'SupportChat',
              flg:1
            }],
          });
        }
    });

    return () => {
      notificationInteractionSubscription.remove();
    };
    
  }, [])

  async function ConnectChatroom() {

    setModal(false);

    try {

      const room = await getRoomID();

      if (room) {

        const shopId  = room.shop_id;
        const staffId = room.staff_id;
        
        const url           = "wss://jt6593bhik.execute-api.ap-northeast-1.amazonaws.com/production";
        const roomId        = room.room_id;
        const wsId          = "TCSC" + roomId;
        const totalcloud_id = room.totalcloud_id;

        setShopID(shopId);
        setStaffID(staffId);
        setRoomID(roomId);
        setWsID(wsId);
        setTotalcloudID(totalcloud_id);

        const websocketConnection = () => {
          
          const socket = new WebSocket(url, 'echo-protocol');
  
          socket.onopen = (e) => {
            const enter = {
              action: 'enterroom',
              data: wsId,
            };
            socket.send(JSON.stringify(enter));
            setIsConnected(true);
          };
  
          socket.onmessage = (e) => {
            const resData = JSON.parse(e.data);
  
            if (resData[1] === 'supporter') {
              getChatMsgList(roomId);
            } else if (resData[1] === 'supporterTyping') {
              setEdit(true);
            } else if (resData[1] === 'supporterTypingReset') {
              setEdit(false);
            }
          };
  
          socket.onclose = (e) => {
            setIsConnected(false);
          };
  
          socket.onerror = (e) => {
            console.log('WebSocket error:', e);
          };
  
          setWs(socket);
        };
  
        await websocketConnection();
        await enterChatroom(shopId,staffId,roomId);

      } else {
        Alert.alert('エラー','サポートチャット接続に失敗しました。');
        return;
      }

    } catch (error) {
      console.log('Error initializing WebSocket:', error);
      Alert.alert('エラー','サポートチャット接続に失敗しました。');
    }

  }

  //**********************************************
  // 
  //  ルームID発行
  // 
  //**********************************************
  const getRoomID = useCallback(() => {

    return new Promise((resolve, reject)=>{
      fetch(domain + "batch_app/api_system_app.php?" + Date.now(), {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: JSON.stringify({
          ID: route.params.account,
          pass: route.params.password,
          act: "support_chat",
          fc_flg: global.fc_flg,
        }),
      })
      .then((response) => response.json())
      .then((json) => {
        if (json) {
          resolve(json);
        } else {
          resolve(false);
        }
      })
      .catch((error) => {
        console.log(error);
        resolve(false);
      });
    })

  }, []);

  //***************************************************
  // 
  // Websocket 通信(通知)
  // 
  //***************************************************
  const messageNotify = useCallback((notifyType = "") => {
    if (ws != null && totalcloudID != "") {
      let send = {
        action: "notify",
        data: [encodeURI("TCSC" + totalcloudID), notifyType, roomID],
      };
      ws.send(JSON.stringify(send));
    }
  }, [ws, totalcloudID, roomID]);

  //**********************************************
  // 
  //  チャットルームに入室する
  // 
  //**********************************************
  const enterChatroom = useCallback((shop_id,staff_id,room_id) => {

    let formData = new FormData();
    formData.append('id',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act','enterChatroom');
    formData.append('shop_id',shop_id);
    formData.append('staff_id',staff_id);
    formData.append('room_id',room_id);
    formData.append('app_flg',1);

    return new Promise((resolve, reject)=>{
      fetch(domain + "php/ajax/chatroom_support.php", 
      {
        method: 'POST',
        body: formData,
        header: {
          'content-type': 'multipart/form-data',
        },
      })
      .then((response) => response.json())
      .then((json) => {
        resolve(true);
      })
      .catch((error) => {
        console.log(error);
        resolve(false);
      });
    })

  }, [ws,totalcloudID,roomID]);

  useEffect(() => {
    // ルーム作成通知を送る
    if (ws && totalcloudID && roomID && isConnected) {
      messageNotify("staff");
      messageNotify("desktopNotify");
    }
  }, [ws, totalcloudID, roomID, isConnected]);

	//************************************************************************
	// 
	// チャットルームを退出する
	// 
	//************************************************************************
  const exitChatroom = useCallback(() => {

    let formData = new FormData();
    formData.append('id',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act','exitChatroom');
    formData.append('ws_id',wsID);
    formData.append('room_id',roomID);
    formData.append('app_flg',1);

    return new Promise((resolve, reject)=>{
      fetch(domain + "php/ajax/chatroom_support.php", 
      {
        method: 'POST',
        body: formData,
        header: {
          'content-type': 'multipart/form-data',
        },
      })
      .then((response) => response.json())
      .then((json) => {
        messageNotify("staff");
        resolve(true);
      })
      .catch((error) => {
        console.log(error);
        resolve(false);
      });
    })

  }, [wsID,roomID]);

  //***************************************************
  // 
  // メッセージ内容を表示する
  // 
  //***************************************************
  const getChatMsgList = async(roomId) => {
    if (roomId) {
      
      let formData = new FormData();
      formData.append('id',route.params.account);
      formData.append('pass',route.params.password);
      formData.append('act','getChatMsgList');
      formData.append('room_id',roomId);

      const getTalk = () => {
        return new Promise((resolve, reject)=>{
          fetch(domain + "php/ajax/chatroom_support.php", 
          {
            method: 'POST',
            body: formData,
            header: {
              'content-type': 'multipart/form-data',
            },
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
      }

      const talk = await getTalk();
      talk.reverse();
      setTalk(talk);

    }
  };

	//************************************************************************
	// 
	// メッセージを送信する
	// 
	//************************************************************************
  async function sendMessage() {

		let room_id   = roomID;
		let send_text = msgtext;

		// サポート時間外の場合は送信できないようにする
		if(!checkOvertimeSupport()) return false;

		if(room_id && send_text != ""){

      setLoading(true);

      let formData = new FormData();
      formData.append('id',route.params.account);
      formData.append('pass',route.params.password);
      formData.append('act','sendMessage');
      formData.append('shop_id',shopID);
      formData.append('staff_id',staffID);
      formData.append('room_id',room_id);
      formData.append('send_text',send_text);
      formData.append('app_flg',1);

      const sendMsg = () => {
        return new Promise((resolve, reject)=>{
          fetch(domain + "php/ajax/chatroom_support.php", 
          {
            method: 'POST',
            body: formData,
            header: {
              'content-type': 'multipart/form-data',
            },
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
      }

      const result = await sendMsg();

      if (!result) {
        Alert.alert('エラー','メッセージの送信に失敗しました。');
        await messageNotify("staffTypingReset");
        setLoading(false);
        return;
      }

      // メッセージを再表示する
      await getChatMsgList(result);
      
      // メッセージ通知
      await messageNotify("staff");
      await messageNotify("desktopNotify");
      
      setLoading(false);

      return;
    }

  }

  //***************************************************
  // 
  // 画像、ファイルを送信する
  // 
  //***************************************************
  async function sendFiles(fileForm,fileType){

    // サポート時間外の場合は送信できないようにする
    if(!checkOvertimeSupport()) return false;

    setLoading(true);

    let formData = new FormData();
    formData.append('id',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act','sendFiles');
    formData.append('shop_id',shopID);
    formData.append('staff_id',staffID);
    formData.append('room_id',roomID);
    formData.append('type', fileType);
    formData.append('files', fileForm);
    formData.append('app_flg',1);

    const sendFile = () => {
      return new Promise((resolve, reject)=>{
        fetch(domain + "php/ajax/chatroom_support.php", 
        {
          method: 'POST',
          body: formData,
          header: {
            'content-type': 'multipart/form-data',
          },
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
    }

    const result = await sendFile();

    if (!result) {
      Alert.alert('エラー','画像の送信に失敗しました。');
      setLoading(false);
      return;
    }

    // メッセージを再表示する
    await getChatMsgList(result);
    
    // メッセージ通知
    await messageNotify("staff");
    await messageNotify("desktopNotify");

    setLoading(false);

  }

  //***************************************************
  // 
  // サポート時間外かチェックする
  // 
  //***************************************************
  function checkOvertimeSupport(){
    const today    = new Date();
    const holiday  = holidays[Moment(today).format("YYYY-MM-DD")];
    let startTime  = new Date().setHours(9,0,0);
    let endTime    = new Date().setHours(17,30,1);
    
    if(today.getTime() < startTime || today.getTime() > endTime || holiday != undefined){
			messageNotify("staffTypingReset");
			Alert.alert('エラー','サポート時間外なため送信できませんでした');
      return false;
    }
    
    return true;
  }

  //***************************************************
  // 
  // 祝日取得
  // 
  //***************************************************
  const getHoliday = useCallback(() => {

    return new Promise((resolve, reject)=>{
      fetch('https://holidays-jp.github.io/api/v1/date.json')
      .then((response) => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        resolve(false)
      });
    });

  });

  useEffect(() => {
    
    if (talk != null && talk.length > 0) {
      const msg = talk.map((com,index) => {
        
        if (com.speaker === "other") {
          const data = {
            _id: index,
            text: com.type=="image"?"":com.message,
            image:com.type=="image"?com.message:"",
            createdAt: com.datetime,
            user: {
              _id: 2,
              name: "サポート",
              avatar:null,
              status:"",
              title:"",
              html_flg:"",
              user_read:0,
            }
          }
          return data;
        } else {

          const data = {
            _id: index,
            text: com.type=="image"?"":com.message,
            image:com.type=="image"?com.message:"",
            createdAt: com.datetime,
            user: {
              _id: 1,
              name: "",
              avatar:null,
              status:"",
              title:"",
              html_flg:"",
              user_read:0,
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
  const pickImage = async () => {
    
    if (!await LibraryPermissionsCheck()) return;
      
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    
    if (!result.canceled) {

      var Image_ = result.assets[0];

      if(Image_.fileSize > 10000000) {
        Alert.alert('','ファイルのサイズが大きすぎます(10MBまで)');
        return;
      }
      
      let filename = Image_.uri.split('/').pop();

      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      const data = { uri: Image_.uri, name: filename, type };

      await sendFiles(data,'image');
    }

	};

	// ファイル選択
	const pickDocument = async () => {
	  
    let result = await DocumentPicker.getDocumentAsync({});

    if (!result.canceled) {
      
      var File_ = result.assets[0];

      if(File_.size > 10000000) {
        Alert.alert('','ファイルのサイズが大きすぎます(10MBまで)');
        return;
      }

      let filename = File_.uri.split('/').pop();

      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      const data = { uri: File_.uri, name: filename, type };

      await sendFiles(data,'file');

    }

  };

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

  return (
    <>
    <Loading isLoading={isLoading} />
    <Toast
      position={150}
      shadow={true}
      animation={true}
      backgroundColor={'#999'}
      visible={edit}
    >
      トータルクラウドスタッフが入力中です
    </Toast>
    <Modal
      isVisible={modal}
      swipeDirection={null}
      backdropOpacity={0.5}
      animationInTiming={300}
      animationOutTiming={500}
      animationIn={'pulse'}
      animationOut={'slideOutUp'}
      propagateSwipe={true}
      style={{alignItems: 'center'}}
    >
      <View style={styles.modal}>
        <Text style={styles.modal_text}>
          サポートチャットではトータルクラウドに関する各種問い合わせが可能です。{"\n"}
        </Text>
        <Text style={styles.modal_text2}>
          「スタッフが異動したんで名前を消したい」{"\n"}
          「この画面を開くとエラーになる」{"\n"}
          「HTMLメールの機能の使い方教えて」{"\n"}
          「反響来店率を高くしたいから助けて」{"\n"}
          「スーモ掲載状況画面はどのように使ったらいい？」{"\n"}
          「オプション機能って何があるの？」{"\n"}
        </Text>
        <Text style={styles.modal_text}>
          など、今困っていることをお送りください。{"\n"}{"\n"}
          窓口が混みあっている場合、お返事に時間をいただく場合があります。ご了承ください。{"\n"}{"\n"}
          ▼ チャット対応時間{"\n"}
          平日　9:00～17:30{"\n"}
        </Text>
        <Text style={styles.modal_text3}>
          ※アプリを閉じると内容は再度確認できません。{"\n"}
          ご注意ください。
        </Text>
        <View style={styles.button_view} >
          <TouchableOpacity
            style={styles.button}
            activeOpacity={0.7}
            onPress={()=>{ConnectChatroom()}}
          >
            <Text style={styles.button_txt}>O　K</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button,{backgroundColor:"#f59898",borderBottomColor:"#db8686"}]}
            activeOpacity={0.7}
            onPress={()=>{
              navigation.reset({
                index: 0,
                routes: [{
                  name: route.previous ,
                  params: route.params,
                  websocket:route.websocket,
                  websocket2: route.websocket2,
                  profile:route.profile,
                  previous:'SupportChat',
                  withAnimation2: true
                }],
              });
            }}
          >
            <Text style={styles.button_txt}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
    <GiftedChat
      messages={messages}
      text={msgtext?msgtext:''}
      onInputTextChanged={text => {
        if (text.length>0) messageNotify("staffTyping");
        else if (text.length==0) messageNotify("staffTypingReset");
        setMsgtext(text);
      }}
      placeholder="テキストを入力してください"
      onSend={() => sendMessage()}
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
      onLongPress={(context, message)=>onLongPress(context, message)}
      renderBubble={renderBubble}
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
            containerStyle={{backgroundColor:!global.fc_flg ? "#6C9BCF" : "#FF8F8F",paddingBottom:20}}
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
  header: {
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
  modal: {
    width:'100%',
    backgroundColor:'#fff',
    padding:15,
    borderRadius:5,
  },
  modal_text: {
    fontSize:15,
    color:'#333'
  },
  modal_text2: {
    fontSize:14,
    fontWeight:'700',
    color:'#222'
  },
  modal_text3: {
    fontSize:14,
    fontWeight:'200',
    color:'#f59898'
  },
  button_view: {
    flexDirection:'row',
    justifyContent:'center',
    marginVertical:20
  },
  button: {
    width: "40%",
    height: 40,
    marginHorizontal:5,
    alignItems: "center",
    justifyContent:'center',
    borderRadius:5,
    borderBottomWidth:3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation:5,
    backgroundColor:'#81aee6',
    borderBottomColor:'#6c93c4'
  },
  button_txt: {
    color:"#fff",
    fontSize:16,
    fontWeight:"700"
  },
});
