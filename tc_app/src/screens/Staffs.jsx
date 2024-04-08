import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  useLayoutEffect
} from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  StatusBar,
  RefreshControl,
  BackHandler,
  AppState,
  Platform ,
  KeyboardAvoidingView,
  Image,
  Dimensions,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import * as SQLite from "expo-sqlite";
import { CheckBox } from 'react-native-elements';
import Modal from "react-native-modal";
import { useHeaderHeight } from '@react-navigation/elements';
import Constants from 'expo-constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Moment from 'moment';

import Loading from "../components/Loading";
import { GetDB,db_select,db_write } from '../components/Databace';
import Footer from "../components/Footer";

import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ローカルストレージ読み込み
const storage = new Storage({
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

const db = SQLite.openDatabase("db");

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

Notifications.setBadgeCountAsync(0);

const Width = Dimensions.get("window").width;
const Height = Dimensions.get("window").height;

export default function Staffs(props) {

  const [isLoading, setLoading] = useState(false);

  const { navigation, route } = props;

  const [name, setName] = useState("");

  const [staffs, setStaffs] = useState([]); // 全件格納用
  const [staff_list, setStaff_list] = useState([]); // 表示用
  
  const [checked, setChecked] = useState(true);
  
  const [addGroup, setAddGroup] = useState(false);
  const [groupname, setGroupname] = useState("");
  const [group_img, setGroup_img] = useState(null);
  const [g_placeholder, setG_placeholder] = useState("");
  
  const listRef = useRef([]);
  
  var headerHeight = useHeaderHeight();
  const statusBarHeight = Constants.statusBarHeight;

  if (Platform.OS === 'android') {
    headerHeight = headerHeight - StatusBar.currentHeight;
  }

  useEffect(() => {
    
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
              previous:'TimeLine',
              flg:1
            }],
          });
        }
    });

    return () => {
      notificationInteractionSubscription.remove();
    };

  }, []);
  
  useLayoutEffect(() => {

    if (AppState.currentState === "active") {
      Notifications.setBadgeCountAsync(0);
    }

    navigation.setOptions({
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#6C9BCF", height: 110}
        : { backgroundColor: "#FF8F8F", height: 110},
      
      headerTitleAlign: 'center',
      headerTitle: () => (
        <Text style={styles.headertitle}>スタッフを選択</Text>
      ),
      headerLeft: () => (
        <Feather
          name='chevron-left'
          color='white'
          size={30}
          onPress={() => {
            if (route.flg == 'upd_room') {
              navigation.reset({
                index: 0,
                routes: [{
                  name: 'ChatTalk' ,
                  params: route.params,
                  websocket:route.websocket,
                  websocket2:route.websocket2,
                  profile:route.profile,
                  room: route.room,
                  previous:'Staffs',
                  withAnimation: true
                }],
              });
            } else {
              navigation.reset({
                index: 0,
                routes: [{
                  name: 'Company' ,
                  params: route.params,
                  websocket:route.websocket,
                  websocket2:route.websocket2,
                  profile:route.profile,
                  previous:'Staffs'
                }],
              });
            }
          }}
          style={{paddingHorizontal:15,paddingVertical:10}}
        />
      ),
    });

  },[]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
        activeOpacity={1}
          style={{justifyContent:'center',alignItems:'center',width:70,height:70}}
          onPress={() => {

            var room = staffs.filter(function(item,index) {
              return item.checked === true && item.account != route.params.account && item.account != "*****";
            });
            
            if (room.length == 0) {
              Alert.alert("","スタッフが選択されていません");
              return
            }
            
            if (route.flg == 'room') {
              addStaff(room[0]);
            } else if (route.flg == 'upd_room') {
              updGroup();
            } else {
              setAddGroup(true);
            }
          }}
        >
          <Text style={{color:"#fff",textAlign:'center',fontWeight:'800'}}>{route.flg == 'upd_room'?'追 加':route.flg == 'room'?'チャット\n開始':'次 へ'}</Text>
        </TouchableOpacity>
      ),
    });

    if (staffs.length > 0) {
      var room = staffs.filter(function(item,index) {
        return item.checked === true && item.account != "*****";
      });
      var namelist = room.map((r)=>(r.name_1?r.name_1:'')+(r.name_2?r.name_2:''))
      var listtext = namelist.join(',');
      setG_placeholder(listtext)
    }
  },[staffs,checked]);

  const addButton = useMemo(() => {

    var room = staffs.filter(function(item,index) {
      return item.checked === true && item.account != route.params.account && item.account != "*****";
    });

    const bgc = !global.fc_flg ? "#6C9BCF" : "#FF8F8F";

    if (room.length > 0) {
      return (
        <TouchableOpacity
        activeOpacity={1}
          style={[styles.addbutton,{backgroundColor:bgc}]}
          onPress={() => {

            var room = staffs.filter(function(item,index) {
              return item.checked === true && item.account != route.params.account && item.account != "*****";
            });
            
            if (room.length == 0) {
              Alert.alert("","スタッフが選択されていません");
              return
            }
            
            if (route.flg == 'room') {
              addStaff(room[0]);
            } else if (route.flg == 'upd_room') {
              updGroup();
            } else {
              setAddGroup(true);
            }
          }}
        >
          <Text style={styles.addbuttontxt}>{route.flg == 'upd_room'?'追 加':route.flg == 'room'?'チャット\n開始':'次 へ'}</Text>
        </TouchableOpacity>
      )
    } else {
      return null;
    }

  },[staffs,checked])

  async function addStaff(item) {

    // トークルームがすでにあるか確認
    var sql = `select * from chat_room
                where ( user_id = '${item.account},${route.params.account}' 
                or user_id = '${route.params.account},${item.account}' ) 
                and room_type = '0' 
                and del_flg != '1' 
              ;`;
    var chat_room = await db_select(sql);

    const arr = [route.params.account,item.account];
    const lst = arr.join(',');

    var roomdata = {
      room_id:"",
      room_name:"",
      room_img:null,
      room_type:"0",
      user_id:lst,
      user_list:lst,
    }

    if (chat_room == false) {

      const AsyncAlert = async () => new Promise((resolve) => {
        Alert.alert(
          `確認`,
          `${item.name_1}${item.name_2}さん(${item.shop_name})を連絡先登録しますか？\n登録すると相手側にも通知がいきます`,
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

      setLoading(true);

      const room_id = await addRoom_fetch(roomdata);
      roomdata["room_id"] = room_id;

      setLoading(false);

    }
    
    const room = chat_room == false?roomdata:chat_room[0];
      
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
          websocket:route.websocket,
          websocket2:route.websocket2,
          profile:route.profile,
          room: room,
          previous:'Staffs'
        },
      ],
    });

  }
  
  async function updGroup() {

    var room = staffs.filter(function(item,index) {
      return item.checked === true && item.account != route.params.account && item.account != "*****";
    });
    
    var accounts = room.map((r)=>r.account)
    var accounttext = accounts.join(',');

    var name = room.map((r)=>r.name_1+r.name_2+'さん');
    name = name.join(',');

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `確認`,
        `${name}を「${route.room.room_name}」へ追加しますか？\n追加すると相手側にも通知がいきます`,
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

    setLoading(true);

    const lst = accounttext+','+route.room.user_list;

    const roomdata = {
      room_id:route.room.room_id,
      room_name:route.room.room_name,
      room_img:group_img,
      room_type:route.room.room_type,
      user_id:route.room.user_id,
      user_list:lst,
    }

    route.room.user_list = lst;

    var sql = `update chat_room set user_list = ?, upd_date = ? where room_id = ?;`;

    var data = [
      lst,
      Moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
      route.room.room_id,
    ]

    await db_write(sql,data);

    await addRoom_fetch(roomdata);

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
        note: `${name}を「${route.room.room_name}」に追加しました。`,
        user_list: lst,
      }),
    })
    .then((response) => response.json())
    .then((json) => {
    })
    .catch((error) => {
      console.log(error)
      Alert.alert("登録に失敗しました");
    })

    setLoading(false);

    navigation.reset({
      index: 0,
      routes: [{
        name: 'ChatTalk' ,
        params: route.params,
        websocket:route.websocket,
        websocket2:route.websocket2,
        profile:route.profile,
        room: route.room,
        previous:'Staffs'
      }],
    });

  }

  useEffect(() => {

    console.log('--------------------------')

    Display();

    return () => {
      BackHandler.addEventListener("hardwareBackPress", true).remove();
    };

  }, []);

  // 更新
  const [refreshing, setRefreshing] = useState(false);
  
  async function Display() {

    var sql = `select * from staff_all `;

    const testShop = [
      "00001",
      "00002",
      "12345",
      "99999",
      "feides",
      "99998",
    ]

    if (!testShop.includes(route.params.shop_id)) {
      sql += `where shop_id != '00001' and shop_id != '00002' and shop_id != '12345' and shop_id != '99999' and shop_id != 'feides' ;`;
    }

    var sl = await db_select(sql);
    
    if (sl != false) {

      setLoading(true);

      // checked:falseを初期値として代入
      sl.forEach(value => value.checked = false);
  
      // invisible:falseを初期値として代入
      sl.forEach(value => value.invisible = false);

      if (route.flg == 'upd_room') {
        var user_list = (route.room.user_list).split(',');
        for (var s=0;s<sl.length;s++) {
          var value = sl[s];
          if(user_list.includes(value.account)){
            value.invisible = true;
          }
        }
      }

      for (var s2=0;s2<sl.length;s2++) {
        var value = sl[s2];
        if (value["staff_photo1"]) {
          const imageUrl = domain+"img/staff_img/"+value["staff_photo1"];
          value["staff_photo1"] = {uri:imageUrl};
        } else {
          value["staff_photo1"] = require('../../assets/photo4.png');
        }
      }

      var myPhoto = '';

      if (route.profile) {

        const imageUrl = domain+"img/staff_img/"+route.profile[0].staff_photo1;

        const response = await fetch(imageUrl, { method: 'HEAD' });

        if (response.ok) {
          myPhoto = {uri:imageUrl};
        } else {
          myPhoto = require('../../assets/photo4.png');
        }

      } else {
        myPhoto = require('../../assets/photo4.png');
      }

      // 自分追加
      sl.unshift({
        "account": route.params.account,
        "checked": route.flg == 'upd_room'?false:true,
        "name_1": route.params.name_1,
        "name_2": route.params.name_2,
        "shop_id": route.params.shop_id,
        "shop_name": "",
        "staff_photo1": myPhoto,
        "invisible":true
      });

      // 追加ボタン用
      sl.unshift({"checked": true,"account": "*****"});

      setStaffs(sl);
      setStaff_list(sl);
      
      setLoading(false);
    } else {
      setStaffs([]);
    }

  }

  async function addRoom_fetch(data) {
    
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
    formData.append('upd_flg',route.flg == 'upd_room'?1:'');
    formData.append('formdata_flg',1);
    
    if (data.room_img != null) {

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
        resolve(json.room_id);
      })
      .catch((error) => {
        resolve(false);
        console.log(error)
        Alert.alert("登録に失敗しました");
      })

    })
  }

  async function addGroup_fetch() {

    var room = staffs.filter(function(item,index) {
      return item.checked === true && item.account != route.params.account && item.account != "*****";
    });
    
    if (room.length == 0) {
      Alert.alert("","スタッフが選択されていません");
      return
    }

    setLoading(true);

    route.params.account
    var accounts = room.map((r)=>r.account)
    accounts = [route.params.account,...accounts];
    var accounttext = accounts.join(',');
    
    var roomdata = {
      room_id:"",
      room_name:groupname?groupname:g_placeholder,
      room_img:group_img,
      room_type:"1",
      user_id:route.params.account,
      user_list:accounttext,
    }

    const room_id = await addRoom_fetch(roomdata);
    roomdata["room_id"] = room_id;

    setAddGroup(false);
    
    setLoading(false);

    navigation.reset({
      index: 0,
      routes: [
        {
          name: "ChatTalk",
          params: route.params,
          websocket:route.websocket,
          websocket2:route.websocket2,
          profile:route.profile,
          room: roomdata,
          previous:'Staffs'
        },
      ],
    });

  }

  function staffsSearch(name) {
    
    var filteredStaffs = staffs.filter(function(item) {
      if (item.account == route.params.account || item.account == "*****") {
        return item;
      } else {
        return (
          (item.name_1 && item.name_1.includes(name)) ||
          (item.name_2 && item.name_2.includes(name)) ||
          (item.shop_name && item.shop_name.includes(name))
        );
      }
    });

    setStaff_list(name?filteredStaffs:staffs);

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
  const pickImage = async () => {
    
    if (!await LibraryPermissionsCheck()) return;
      
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    
    if (!result.canceled) {

      var Image_ = result.assets[0];
        
      setGroup_img(Image_);
      
    }
	};

  const comList = useMemo(() => {
    if (staff_list.length > 0) {
      return (
        <FlatList
          scrollIndicatorInsets={{ right: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          ref={listRef}
          initialNumToRender={10}
          data={staff_list}
          renderItem={({ item,index }) => {
            if (index < 2) return null;
            return (
              <TouchableOpacity
                style={styles.ListItem}
                onPress={() => checkMark(index)}
                activeOpacity={0.8}
                disabled={item.invisible}
              >
                <Image
                  style={styles.icon}
                  source={item.staff_photo1}
                />
                <View style={styles.ListInner}>
                  <Text style={[styles.shop,item.invisible&&{color:"#999"}]} numberOfLines={1}>
                    {item.shop_name}
                  </Text>
                  <Text style={[styles.name,item.invisible&&{color:"#999"}]} numberOfLines={1}>
                    {item.name_1}{item.name_2}
                  </Text>
                </View>
                <View>
                  {!item.invisible&&(
                  <CheckBox
                    checked={item.checked}
                    onPress={() => checkMark(index)}
                    containerStyle={styles.checkbox}
                    checkedIcon="check-circle"
                    uncheckedIcon="circle"
                    checkedColor={chk}
                  />
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => `${item.account}`}
        />
      )
    }
  },[staff_list,checked])

  const groupList = useMemo(() => {

    if (staffs.length == 0) {
      return null;
    } else {
      
      var room = staffs.filter(function(item) {
        return item.checked === true;
      });

      return (
        <FlatList
          bounces={false}
          numColumns={5}
          data={room}
          keyboardShouldPersistTaps="always"
          renderItem={({ item,index }) => {

            if (index == 0) {
              return (
                <View style={styles.ListItem2}>
                  <TouchableOpacity
                    style={styles.ListItem3}
                    onPress={() => setAddGroup(false)}
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
              )
            } else {
              return (
                <View style={styles.ListItem2}>
                  <Image
                    style={styles.icon2}
                    source={item.staff_photo1}
                  />
                  <Text style={styles.name2}>
                    {item.name_1}{item.name_2}
                  </Text>
                  {index != 1&&(
                    <TouchableOpacity
                      style={styles.del_stf}
                      onPress={() => {checkMark2(item.account)}}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons
                        name="close"
                        color="#000"
                        size={18}
                      />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }
          }}
          keyExtractor={(item) => `${item.account}`}
          extraData={checked}
        />
      )
    }
  },[staffs,checked])

  // 選択されたFlatListのindexを取得し、checkedの値を変更
  const checkMark = (index) => {
    let newlist = [...staff_list];

    if (route.flg == 'room') {
      newlist.forEach((value, i) => {
        if (i === index) {
          value.checked = !value.checked;
        } else {
          value.checked = false;
        }
      });
    } else {
      newlist[index].checked = !newlist[index].checked;
    }

    setStaff_list(newlist);
    setChecked(!checked);
  }
  
  const checkMark2 = (account) => {

    let newlist = [...staffs];

    newlist.forEach(item => {
      if (item.account === account) {
        item.checked = false;
      }
    });

    setStaffs(newlist);
    setChecked(!checked);
  }

  const bgc = !global.fc_flg?"#fff4b3":"#f5d3df";
  const chk = !global.fc_flg?"#81aee6":"#e6c4f5";
  const hdr = !global.fc_flg ? "#6C9BCF" : "#FF8F8F";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -50}
    >
      <View style={[styles.container,{backgroundColor:bgc}]}>
        <Loading isLoading={isLoading} />
        <View style={[styles.inputview,{backgroundColor:bgc}]}>
          <TextInput
            style={styles.searchInput}
            value={name}
            onChangeText={(text) => {
              setName(text);
              staffsSearch(text);
            }}
            placeholder="店舗名、名前が検索できます"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        {comList}
        {addButton}
      </View>
      
      <Modal
        isVisible={addGroup}
        swipeDirection={['up']}
        onSwipeComplete={()=>setAddGroup(false)}
        backdropOpacity={0.5}
        animationInTiming={100}
        animationOutTiming={300}
        animationIn={'fadeIn'}
        animationOut={'fadeOut'}
        propagateSwipe={true}
        transparent={true}
        style={{margin: 0,justifyContent:'flex-start'}}
        onBackdropPress={()=>setAddGroup(false)}
      >
        <View style={[styles.roomheader,{height:headerHeight},Platform.OS === 'ios'&&{paddingTop:statusBarHeight},{backgroundColor:hdr}]}>
          <TouchableOpacity
            style={{width:50,height:50,justifyContent:'center',alignItems:'center',marginRight:'auto'}}
            onPress={() => {
              setAddGroup(false);
            }}
          >
            <Feather
              name='chevron-left'
              color='white'
              size={30}
              style={{paddingHorizontal:15,paddingVertical:10}}
            />
          </TouchableOpacity>
          <Text style={styles.headertitle}>グループ設定</Text>
          <TouchableOpacity
            style={{width:50,height:50,justifyContent:'center',alignItems:'center',marginLeft:'auto'}}
            onPress={async() => {await addGroup_fetch()}}
          >
            <Text style={{color:"#fff"}}>作成</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableWithoutFeedback onPress={()=>{Keyboard.dismiss()}}>
          <View style={{height:(Height-headerHeight),backgroundColor:'#fff'}}>
            <Loading isLoading={isLoading} />
            <View style={styles.inputview}>
              <TouchableOpacity
                style={{width:70,height:70}}
                activeOpacity={0.7}
                onPress={()=>{pickImage()}}
              >
                {group_img?(
                  <Image
                    style={styles.icon3}
                    source={{uri:group_img.uri}}
                  />
                ):(
                  <Image
                    style={styles.icon3}
                    source={require('../../assets/group.jpg')}
                  />
                )}
                <View style={styles.grp_icon} >
                  <MaterialCommunityIcons
                    name="camera-outline"
                    color="#000"
                    size={13}
                  />
                </View>
              </TouchableOpacity>
              <TextInput
                style={styles.searchInput2}
                value={groupname}
                onChangeText={(text) => {
                  setGroupname(text);
                }}
                placeholder={g_placeholder}
                placeholderTextColor="#b3b3b3"
                autoFocus={true}
              />
            </View>
            <View style={{paddingHorizontal:10,justifyContent:'center',width:'100%'}}>
              <Text style={{fontSize:14,marginBottom:10,color:'#999'}}>グループ作成者がグループの管理者になります。{"\n"}管理者だけがグループ設定を変更できます。{"\n"}管理者の変更はグループ作成後行えるようになります。</Text>
              <Text style={{fontSize:16,marginBottom:5}}>メンバー</Text>
              {groupList}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headertitle: {
    color:'#fff',
    fontWeight:'700',
    fontSize:20
  },
  container: {
    flex: 1,
  },
  inputview: {
    zIndex:999,
    padding:10,
    height:70,
    flexDirection:'row',
    alignItems:'center',
    marginVertical:10,
  },
  searchInput: {
    fontSize: 16,
    width: "100%",
    height: 48,
    paddingHorizontal: 10,
    borderColor: "#dddddd",
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  searchInput2: {
    fontSize: 16,
    width: Width-100,
    height: 48,
    paddingHorizontal: 10,
    borderColor: "#dddddd",
    borderWidth: 1,
    backgroundColor: "#ffffff",
    marginLeft:10
  },
  buttonReload: {
    backgroundColor: "#b3b3b3",
    borderRadius: 4,
    alignSelf: "center",
  },
  buttonReloadLabel: {
    fontSize: 16,
    lineHeight: 30,
    paddingVertical: 8,
    paddingHorizontal: 20,
    color: "#000000",
  },
  ListItem: {
    width:"100%",
    height:60,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
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
  icon: {
    width:40,
    height:40,
    borderRadius:100,
    marginRight:10,
    backgroundColor:'#eee'
  },
  icon2: {
    width:55,
    height:55,
    borderRadius:100,
    backgroundColor:'#eee'
  },
  icon3: {
    width:70,
    height:70,
    borderRadius:100,
    backgroundColor:'#eee'
  },
  shop: {
    fontSize: 12,
  },
  name: {
    fontSize: 16,
  },
  name2: {
    marginTop:5,
    fontSize: 10,
  },
  checkbox: {
    flex:1,
    margin: 0,
    marginLeft: 0,
    marginRight: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    height:30,
    justifyContent:'center',
    backgroundColor:'#ffffff',
    alignSelf: 'flex-end'
  },
  roomheader :{
    width:'100%',
    backgroundColor:'#6C9BCF',
    flexDirection:'row',
    alignItems:'center',
    justifyContent:'center'
  },
  del_stf: {
    width:20,
    height:20,
    borderRadius: 100,
    backgroundColor:'#fff',
    alignItems:'center',
    justifyContent:'center',
    position:'absolute',
    top:2,
    right:0,
    shadowColor: "#666",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5
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
  },
  addbutton: {
    width:80,
    height:80,
    position:'absolute',
    bottom:50,
    right:20,
    zIndex:1000,
    borderRadius:100,
    alignItems:'center',
    justifyContent:'center',
  },
  addbuttontxt: {
    textAlign:'center',
    color:'#fff',
    fontSize:14,
    fontWeight:'700'
  }
});
