import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
  useLayoutEffect,
  useContext
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
} from "react-native";
import DropDownPicker, { Item } from "react-native-dropdown-picker";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SideMenu from 'react-native-side-menu-updated';
import * as SQLite from "expo-sqlite";
import Modal from "react-native-modal";
import { useHeaderHeight } from '@react-navigation/elements';
import Constants from 'expo-constants';

import Loading from "../components/Loading";
import { GetDB,db_select,db_write } from '../components/Databace';
import Footer from "../components/Footer";
import { Context1 } from "../components/ExportContext";

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

export default function Company(props) {

  const [isLoading, setLoading] = useState(false);

  const { navigation, route } = props;

  const [addchat, setAddchat] = useState(false);

  const [all_data, setAlldata] = useState([]); // 全件格納用
  const [shop_staffs, setShop_staffs] = useState([]); // 表示用

  const [staffs, setStaffs] = useState([]);
  const [filteredStaffs, setFilteredStaffs] = useState("");

  const [bell_count, setBellcount] = useState(null);

  const [menu, setMenu] = useState(false);
  const deviceScreen = Dimensions.get('window');
  
  const listRef = useRef([]);
  const filteredRef = useRef([]);
  
  // 参照データ取得日時
  const [date, setDate] = useState('');
  
  const context = useContext(Context1);

  var headerHeight = useHeaderHeight();
  const statusBarHeight = Constants.statusBarHeight;

  if (Platform.OS === 'android') {
    headerHeight = headerHeight - StatusBar.currentHeight;
  }
  
  useLayoutEffect(() => {

    if (AppState.currentState === "active") {
      Notifications.setBadgeCountAsync(0);
    }

    navigation.setOptions({
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#6C9BCF", height: 110}
        : { backgroundColor: "#FF8F8F", height: 110},
      headerTitle: () => (
        <Text style={styles.headertitle}>社内チャット</Text>
      ),
      headerRight: () => (
        <View style={{marginRight:5,flexDirection:'row'}}>
          <TouchableOpacity
            style={{width:50,height:50,justifyContent:'center',alignItems:'center'}}
            onPress={() => {
              setAddchat(!addchat);
              setMenu(false);
            }}
          >
            <MaterialCommunityIcons
              name="chat-plus-outline"
              color="white"
              size={35}
            />
          </TouchableOpacity>
          <>
          <View style={bell_count?[styles.bell,{backgroundColor:!global.fc_flg?"red":"#574141"}]:{display:'none'}}>
            <Text Id="bell_text" style={styles.belltext} >{bell_count}</Text>
          </View>
          <TouchableOpacity
            style={{width:50,height:50,justifyContent:'center',alignItems:'center'}}
            onPress={() => {
              setAddchat(false);
              setMenu(!menu);
            }}
          >
            <Feather
              name="menu"
              color="white"
              size={35}
            />
          </TouchableOpacity>
          </>
        </View>
      ),
    });

  },[addchat,bell_count]);
    
  useEffect(() => {

    console.log('--------------------------')

    Display();

    // 通知をタップしたらチャット一覧 → トーク画面 (ログイン済)
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
                previous:'Company'
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
                  room: room,
                  previous:'Company'
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
      BackHandler.addEventListener("hardwareBackPress", true).remove();
      notificationInteractionSubscription.remove();
    };

  }, []);

  // 更新
  const [refreshing, setRefreshing] = useState(false);

  async function Display() {

    const sl = await GetDB('staff_list');

    if (sl != false) {
      setStaffs(sl);
    } else {
      setStaffs([]);
    }

    storage.load({
      key : 'GET-DATA2'
    })
    .then(data => {
      
      if (data) {
        
        var GET_DATA2 = new Date(data.replace(/-/g, '/')); // 直近の取得時間
        var currentDate = new Date(); // 現在時間

        var timeDifference = currentDate - GET_DATA2;
        
        // 直近取得時間から30分以上空いてたら更新かける
        if (timeDifference < 30 * 60 * 1000 || route.previous == "ChatTalk" || route.previous == "Staffs") {
          onRefresh(false);
        }

        var parts = data.split(/-|:/);
        
        // 年、月、日、時、分を取得
        var year = parts[0];
        var month = parts[1];
        var day = parts[2];
        var hour = parts[3];
        var minute = parts[4];
        
        // 新しいフォーマットの日付文字列を作成
        var newDate = year + "-" + month + "-" + day + " " + hour + ":" + minute;

        setDate(newDate+' 時点');
      } else {
        onRefresh(true);
      }

    })
    .catch(err => {
      storage.save({
        key: 'GET-DATA2',
        data: '',
      });
      onRefresh(true);
    })

    await Insert_chatroom_db();
    
    await getBELL();

    setLoading(false);
  }

  // websocket通信(繋がった)
  route.websocket2.onopen = (open) => {
    console.log("open2");
  };

  // websocket通信(メール届いたら更新)
  route.websocket2.onmessage = (message) => {
    let catchmail_flg = JSON.parse(message.data);
    console.log("websocket2::"+catchmail_flg.message);
    onRefresh(false);
  };

  // websocket通信(切断したら再接続)
  route.websocket2.onclose = (close) => {
    if (global.sp_token & global.sp_id) {
      console.log("closed");
      const WS_URL2 = 'ws://54.168.20.149:8080/ws/'+route.params.account+'/'
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "Company",
            params: route.params,
            websocket: route.websocket,
            websocket2: new WebSocket(WS_URL2),
            profile:route.profile,
            previous:'Company'
          },
        ],
      });
    }
  };

  const onRefresh = useCallback(async(flg,staff_flg="") => {

    const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    if (flg) setLoading(true);

    setDate('最新データ取得中');

    const startTime = Date.now(); // 開始時間

    const json = await getCOM(staff_flg);

    // ログアウトしてたら中断
    if(!global.sp_token && !global.sp_id) return;

    const endTime = Date.now(); // 終了時間
    const time = (endTime - startTime)/1000;
    console.log('onRefresh2：'+time + '秒');

    if (json == 'AbortError') {
      return;
    }

    if (json != false) {

      if (staff_flg) {
        await Insert_staff_all_db(json["staff_list"]);
      }
      
      await Insert_chatroom_db(json["chatroom"]);

      function addZero(num, length) {
        var minus = "";
        var zero = ('0'.repeat(length)).slice(-length);
        if (parseInt(num) < 0) {
          // マイナス値の場合
          minus = "-";
          num = -num;
          zero = zero.slice(-(length - 1 - String(num).length));	// -の1桁+数値の桁数分引く
        }
      
        return (minus + zero + num).slice(-length);
      }

      // データ取得日時
      var date = new Date();
      var date_ = (date.getFullYear()).toString() + "-" 
      + addZero((date.getMonth() + 1).toString(),2) + "-" 
      + addZero((date.getDate()).toString(),2) + "-" 
      + addZero((date.getHours()).toString(),2) + "-" 
      + addZero((date.getMinutes()).toString(),2) + "-" 
      + addZero((date.getSeconds()).toString(),2);

      storage.save({
        key: 'GET-DATA2',
        data: date_,
      });

      var parts = date_.split(/-|:/);
        
      // 年、月、日、時、分を取得
      var year = parts[0];
      var month = parts[1];
      var day = parts[2];
      var hour = parts[3];
      var minute = parts[4];
      
      // 新しいフォーマットの日付文字列を作成
      var newDate = year + "-" + month + "-" + day + " " + hour + ":" + minute;

      setDate(newDate+' 時点');

    } else {

      setDate('');
      
      var sql = `select count(*) as count from chat_room;`;
      var customer = await db_select(sql);
      const cnt = customer[0]["count"];

      const errTitle = "ネットワークの接続に失敗しました";
      const errMsg   = "端末に保存された" + cnt + "件のメッセージのみ表示します";

      Alert.alert(errTitle, errMsg);

      setLoading(false);

    }

    await getBELL();

    setLoading(false);

    return;

  }, [abortControllerRef]);

  const appState = useRef(AppState.currentState);
  const abortControllerRef = useRef(new AbortController());

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        resumeFetchWithDelay();
      } else if (nextAppState === 'background') {
        // アプリがバックグラウンドになった場合の処理
        pauseFetch();
      }
      appState.current = nextAppState;
    };

    const Listener = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      Listener.remove();
    };
  }, []);

  const pauseFetch = () => {
    console.log('バックグラウンドになりました2');
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
  };

  const resumeFetchWithDelay = async() => {
    await onRefresh(false);
  };

  const getCOM = useCallback((staff_flg) => {
    
    const signal = abortControllerRef.current.signal;

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
          act: "company",
          fc_flg: global.fc_flg,
          staff_all:staff_flg
        }),
        signal
      })
      .then((response) => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        if (error.name == 'AbortError') {
          resolve('AbortError');
        } else {
          console.log(error);
          resolve(false);
        }
      });
    })

  },[abortControllerRef]);

  const getBELL = useCallback(() => {
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
          act: "new_bell_cnt",
          fc_flg: global.fc_flg,
        }),
      })
      .then((response) => response.json())
      .then((json) => {
        if (json.bell_count.cnt != "0") {
          setBellcount(json.bell_count.cnt);
        } else {
          setBellcount(null);
        }
        resolve()
      })
      .catch((error) => {
        setBellcount(null);
        resolve()
      });
    })
  });

  // チャットルーム登録
  async function Insert_chatroom_db(rooms) {

    if (rooms) {
      
      const chat_room = await GetDB('chat_room');

      // ローカルDBのチャットルーム情報
      var DBroom = [];
      if (chat_room != false) {
        DBroom = chat_room.map((f) => {
          return f.room_id
        })
      }

      // 最新のチャットルーム情報
      var APIroom = [];

      // 最新のお客様情報
      for (var r=0;r<rooms.length;r++) {

        var room = rooms[r]

        var sql = `insert or replace into chat_room values (?,?,?,?,?,?,?,?,?,?,?,?);`;

        var data = [
          room.room_id,
          room.user_id,
          room.user_list,
          room.room_type,
          room.room_name,
          room.ins_date,
          room.upd_date,
          room.del_flg,
          room.note,
          room.time,
          room.message_flg,
          room.unread,
        ]
        
        await db_write(sql,data);
        APIroom.push(room.room_id);

      }

      // 削除フラグ立っているルームは削除
      var room_delete_flg = `delete from chat_room where del_flg = '1';`;
      await db_write(room_delete_flg,[]);

      // サーバーDBにないのは削除
      const DELroom = DBroom.filter(r => !APIroom.includes(r));
      for (var d=0;d<DELroom.length;d++) {
        var room_id = DELroom[d];
        var room_delete = `delete from chat_room where ( room_id = ? );`;
        await db_write(room_delete,[room_id]);
      }

      // 500件超えたら古いものから削除する
      var sql = `select count(*) as count from chat_room;`;
      var customer = await db_select(sql);
      const cnt = customer[0]["count"];

      if (cnt > 500) {
        var delcus = `DELETE FROM chat_room WHERE room_id IN (SELECT room_id FROM chat_room ORDER BY time LIMIT (SELECT COUNT(*) - 500 FROM chat_room));`;
        await db_write(delcus,[]);
      }

    }

    var sql = `select * from chat_room where del_flg != '1' order by time desc;`;
    var rooms_ = await db_select(sql);
    
    if (rooms_ != false) {

      var cnt = 0;

      for (var r=0;r<rooms_.length;r++) {
        var room = rooms_[r];

        const unread = Number(room["unread"]);
        cnt += unread;

        if (room["room_type"] == "0") {

          var user_id = room["user_id"].split(',');

          var account = user_id.filter(function(id) {
            return id !== route.params.account;
          });

          var sql = `select * from staff_all where account = '${account[0]}';`;
          var staff = await db_select(sql);

          // 退職したスタッフとのトークルームは削除
          if(!staff) {
            var room_delete = `delete from chat_room where ( room_id = ? );`;
            await db_write(room_delete,[room["room_id"]]);
            continue;
          }

          room["account"]      = account[0];
          room["name_1"]       = staff[0]["name_1"];
          room["name_2"]       = staff[0]["name_2"];
          room["shop_id"]      = staff[0]["shop_id"];
          room["shop_name"]    = staff[0]["shop_name"];
          
          if (staff[0]["staff_photo1"]) {
            const imageUrl = domain+"img/staff_img/"+staff[0]["staff_photo1"];
            room["staff_photo1"] = {uri:imageUrl};
          } else {
            room["staff_photo1"] = require('../../assets/photo4.png');
          }

        } else if (room["room_type"] == "1") {

          const imageUrl = domain+"chat_tmp/"+room["room_id"]+"/chatroom_"+room["room_id"]+".jpg";

          const response = await fetch(imageUrl, { method: 'HEAD' });

          if (response.ok) {
            room["room_img"] = {uri:imageUrl};
          } else {
            room["room_img"] = require('../../assets/group.jpg');
          }

        }

      }
      
      context.setChatbell(cnt);

      if (filteredRef.current.value) {
        const txt = filteredRef.current.value;

        var filteredStaffs_ = rooms_.filter(function(item) {
          return (
            (item.name_1 && item.name_1.includes(txt)) ||
            (item.name_2 && item.name_2.includes(txt)) ||
            (item.shop_name && item.shop_name.includes(txt)) ||
            (item.room_name && item.room_name.includes(txt)) ||
            (item.note && item.note.includes(txt))
          );
        });
    
        setShop_staffs(txt?filteredStaffs_:rooms_);
        setAlldata(rooms_);

      } else {
        setShop_staffs(rooms_);
        setAlldata(rooms_);
      }
      
      listRef.current.scrollToOffset({ animated: true, offset: 0 });

    } else {
      setShop_staffs([]);
      setAlldata([]);
    }
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

  async function Delete_staff_db(){

    const dbList = [
      "staff_mst",
      "staff_list",
      "customer_mst",
      "communication_mst",
      "fixed_mst",
      "staff_profile",
      "ranking_mst",
      "black_sales_mst",
      "staff_all",
      "chat_room",
      "chat_message",
      "comment_mst",
    ]
    
    for (var d=0;d<dbList.length;d++) {
      var table = dbList[d];
      var delete_sql = `DROP TABLE ${table};`;
      const del_res = await db_write(delete_sql,[]);
      if (del_res) {
        console.log(`${table} 削除 成功`);
      } else {
        console.log(`${table} 削除 失敗`);
      }
    }
  
  }
    
  async function logout() {
    
    const logoutCheck = async () => new Promise((resolve) => {
      Alert.alert(
        "ログアウトしますか？",
        "",
        [
          {
            text: "はい",
            onPress: async() => {resolve(true);}
          },
          {
            text: "いいえ",
            style: "cancel",
            onPress:() => {resolve(false);}
          },
        ]
      );
    })

    if (!await logoutCheck()) return;

    storage.save({
      key: 'GET-DATA',
      data: '',
    });

    storage.save({
      key: 'GET-DATA2',
      data: '',
    });
    
    await Delete_staff_db();
    
    if(global.sp_token && global.sp_id){
      
      const tokenDelete = async () => new Promise((resolve) => {
        // サーバーに情報送信して、DBから削除
        fetch(domain+'app/app_system/set_staff_app_token.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: global.sp_id,
            token: global.sp_token,
            del_flg:1,
            fc_flg: global.fc_flg
          }),
        })
        .then((response) => response.json())
        .then((json) => {resolve(true)})
        .catch((error) => {resolve(true)})
      })

      await tokenDelete();
      
    }
    
    if(global.fc_flg){
      
      const fc_logout = async () => new Promise((resolve) => {
        let formData = new FormData();
        formData.append('fc_logout',1);
        
        fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
        {
          method: 'POST',
          header: {
            'content-type': 'multipart/form-data',
          },
          body: formData
        })
        .then((response) => response.json())
        .then((json) => {resolve(true)})
        .catch((error) => {resolve(true)})
      })

      await fc_logout();
      
    }
    
    global.sp_token = ''; // スマホトークン
    global.sp_id = '';    // ログインID
    global.fc_flg = '';   // fcフラグ
    
    navigation.reset({
      index: 0,
      routes: [{ name: 'LogIn' }],
    });
    
  }
  
  const headerRight = useMemo(() => {
    return (
      <View style={{backgroundColor:'#fff',flex:1,paddingTop:25}}>
        <TouchableOpacity
          style={styles.menulist}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "BellScreen",
                  params: route.params,
                  websocket: route.websocket,
                  websocket2: route.websocket2,
                  profile: route.profile,
                  previous:'Company'
                },
              ],
            });
          }}
        >
          <MaterialCommunityIcons
            name="bell"
            color={global.fc_flg?"#FF8F8F":"#6C9BCF"}
            size={35}
          />
          <Text style={styles.menutext}>通知</Text>
          <View style={bell_count?[styles.bell2,{backgroundColor:!global.fc_flg?"red":"#574141"}]:{display:'none'}}>
            <Text Id="bell_text" style={styles.belltext} >{bell_count}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menulist}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Setting",
                  params: route.params,
                  websocket: route.websocket,
                  websocket2: route.websocket2,
                  profile: route.profile,
                  previous:'Company'
                },
              ],
            });
          }}
        >
          <MaterialCommunityIcons
            name="account"
            color={global.fc_flg?"#FF8F8F":"#6C9BCF"}
            size={35}
          />
          <Text style={styles.menutext}>設定</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menulist}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Ranking",
                  params: route.params,
                  websocket: route.websocket,
                  websocket2: route.websocket2,
                  profile: route.profile,
                  previous:'Company'
                },
              ],
            });
          }}
        >
          <MaterialCommunityIcons
            name="crown"
            color={global.fc_flg?"#FF8F8F":"#6C9BCF"}
            size={35}
          />
          <Text style={styles.menutext}>売上順位</Text>
        </TouchableOpacity>
        {global.testShop_flg&&(
          <TouchableOpacity
            style={styles.menulist}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{
                  name: 'Thanks' ,
                  params: route.params,
                  websocket:route.websocket,
                  websocket2: route.websocket2,
                  profile:route.profile,
                  previous:'Company',
                }],
              });
            }}
          >
            <MaterialCommunityIcons
              name="heart"
              color={global.fc_flg?"#FF8F8F":"#6C9BCF"}
              size={35}
            />
            <Text style={styles.menutext}>ありがとう</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.menulist}
          onPress={() => logout()}
        >
          <MaterialCommunityIcons
            name="logout"
            color={global.fc_flg?"#FF8F8F":"#6C9BCF"}
            size={35}
          />
          <Text style={styles.menutext}>ログアウト</Text>
        </TouchableOpacity>
      </View>
    )
  },[bell_count])

  const comList = useMemo(() => {
    
    if (shop_staffs.length == 0 && !filteredStaffs) {
      return (
        <View style={{marginTop:150}}>
          <TouchableOpacity style={styles.buttonReload} onPress={()=>onRefresh(true)}>
            <Text style={styles.buttonReloadLabel}>読　込</Text>
          </TouchableOpacity>
        </View>
      )
    } else {
      return (
        <FlatList
          bounces={true}
          ref={listRef}
          refreshControl={
            date != '最新データ取得中' ?
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async()=>{
                await onRefresh(true,"1");
                listRef.current.scrollToOffset({ animated: true, offset: 0 });
              }}
            />
            :<></>
          }
          initialNumToRender={10}
          data={shop_staffs}
          renderItem={({ item }) => {
            if (!item.del_flg) {
              return (
                <TouchableOpacity
                  style={[styles.ListItem,item.room_type=='2'&&{backgroundColor:spc}]}
                  onPress={() => {
                    navigation.reset({
                      index: 0,
                      routes: [
                        {
                          name: "ChatTalk",
                          params: route.params,
                          websocket: route.websocket,
                          websocket2: route.websocket2,
                          profile: route.profile,
                          room: item,
                          previous:'Company'
                        },
                      ],
                    });
                  }}
                >
                  {item.room_type == '0'?
                  (
                    <Image
                      style={styles.icon}
                      source={item.staff_photo1}
                    />
                  ):item.room_type == '1'?
                  (
                    <Image
                      style={styles.icon}
                      source={item.room_img}
                    />
                  ):item.room_type == '2'?(
                    <View style={styles.icon2}>
                      <MaterialCommunityIcons
                        name="home-account"
                        color={!global.fc_flg?"#6C9BCF":"#FF8F8F"}
                        size={40}
                      />
                    </View>
                  ):(
                    <Image
                      style={styles.icon}
                      source={require('../../assets/photo4.png')}
                    />
                  )
                  }
                  <View style={styles.ListInner}>
                    {item.room_type == '0'?
                      (
                      <>
                        <Text style={styles.shop} numberOfLines={1}>
                          {item.shop_name}
                        </Text>
                        <Text style={styles.name} numberOfLines={1}>
                          {item.name_1}{item.name_2}
                        </Text>
                      </>
                      ):(
                        <Text style={styles.name} numberOfLines={1}>
                          {item.room_name}
                        </Text>
                      )
                    }
                    <Text style={styles.date}>
                      {item.time?item.time:''}
                    </Text>
                    <Text style={styles.message} numberOfLines={1}>
                      {
                        item.message_flg == '0'||item.message_flg == '3'?
                          item.note:
                        item.message_flg == '1'?
                          '画像を送信しました':
                        item.message_flg == '2'?
                          'ファイルを送信しました':
                          ''
                      }
                    </Text>
                    {item.unread > 0&&(
                    <View style={styles.bell3}>
                      <Text style={styles.belltext} >{item.unread}</Text>
                    </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }
          }}
          keyExtractor={(item) => `${item.room_id}`}
        />
      )
    }
  },[shop_staffs,date,filteredStaffs])

  const bgc = !global.fc_flg?"#E6F4F1":"#FFF6F5";
  const spc = !global.fc_flg?"#dce6fc":"#ffe8f0";

  function staffsSearch(txt) {
    
    var filteredStaffs_ = all_data.filter(function(item) {
      return (
        (item.name_1 && item.name_1.includes(txt)) ||
        (item.name_2 && item.name_2.includes(txt)) ||
        (item.shop_name && item.shop_name.includes(txt)) ||
        (item.room_name && item.room_name.includes(txt)) ||
        (item.note && item.note.includes(txt))
      );
    });

    setShop_staffs(txt?filteredStaffs_:all_data);

  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -50}
    >
    <SideMenu
      menu={headerRight}
      isOpen={menu}
      onChange={isOpen => {
        setMenu(isOpen);
      }}
      menuPosition={'right'}
      openMenuOffset={deviceScreen.width * 0.5}
    >
      <Modal
          isVisible={addchat}
          swipeDirection={['up']}
          onSwipeComplete={()=>setAddchat(false)}
          backdropOpacity={0.5}
          animationInTiming={100}
          animationOutTiming={300}
          animationIn={'fadeIn'}
          animationOut={'fadeOut'}
          propagateSwipe={true}
          transparent={true}
          style={{margin: 0,justifyContent:'flex-start'}}
          onBackdropPress={()=>setAddchat(false)}
        >
        <View style={[styles.roomheader,{height:headerHeight},Platform.OS === 'ios'&&{paddingTop:statusBarHeight},{backgroundColor:global.fc_flg?"#FF8F8F":"#6C9BCF"}]}>
          <Text style={[styles.headertitle,{marginLeft:16}]}>社内チャット</Text>
          
          <View style={{marginRight:5,flexDirection:'row',marginLeft:'auto'}}>
            <TouchableOpacity
                style={{width:50,height:50,justifyContent:'center',alignItems:'center'}}
                onPress={() => {
                  setAddchat(!addchat);
                  setMenu(false);
                }}
              >
                <MaterialCommunityIcons
                  name="chat-plus-outline"
                  color="white"
                  size={35}
                />
              </TouchableOpacity>
              <>
              <View style={bell_count?[styles.bell,{backgroundColor:!global.fc_flg?"red":"#574141"}]:{display:'none'}}>
                <Text Id="bell_text" style={styles.belltext} >{bell_count}</Text>
              </View>
              <TouchableOpacity
                style={{width:50,height:50,justifyContent:'center',alignItems:'center'}}
                onPress={() => {
                  setAddchat(false);
                  setMenu(!menu);
                }}
              >
                <Feather
                  name="menu"
                  color="white"
                  size={35}
                />
              </TouchableOpacity>
              </>
            </View>
        </View>
        <View style={styles.roommenu}>
          <View style={styles.roomblock}>
            <TouchableOpacity
              style={styles.roombtn}
              onPress={()=>{
                setAddchat(false);
                navigation.reset({
                  index: 0,
                  routes: [{
                    name: 'Staffs' ,
                    params: route.params,
                    websocket:route.websocket,
                    websocket2: route.websocket2,
                    profile:route.profile,
                    previous:'Company',
                    flg: 'room',
                  }],
                });
              }}
              activeOpacity={1}
            > 
            <MaterialCommunityIcons
              name="wechat"
              color={!global.fc_flg?"#6C9BCF":"#FF8F8F"}
              size={30}
            />
              <Text style={[styles.roomtext,{color:!global.fc_flg?"#6C9BCF":"#FF8F8F"}]}>チャット</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.roomblock}>
            <TouchableOpacity
              style={styles.roombtn}
              onPress={()=>{
                setAddchat(false);
                navigation.reset({
                  index: 0,
                  routes: [{
                    name: 'Staffs' ,
                    params: route.params,
                    websocket:route.websocket,
                    websocket2: route.websocket2,
                    profile:route.profile,
                    previous:'Company',
                    flg: 'group',
                  }],
                });
              }}
              activeOpacity={1}
            > 
            <MaterialCommunityIcons
              name="account-group"
              color={!global.fc_flg?"#6C9BCF":"#FF8F8F"}
              size={30}
            />
              <Text style={[styles.roomtext,{color:!global.fc_flg?"#6C9BCF":"#FF8F8F"}]}>グループ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <View style={[styles.container,{backgroundColor:bgc}]}>
        <Loading isLoading={isLoading} />
        <View style={[styles.inputview,{backgroundColor:bgc}]}>
          <TextInput
            ref={filteredRef}
            style={styles.searchInput}
            value={filteredStaffs}
            onChangeText={(text) => {
              filteredRef.current.value = text
              setFilteredStaffs(text);
              staffsSearch(text);
            }}
            placeholder="検索"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={{height:20,marginRight:10}}>
          <Text style={styles.sub_title}>{date}</Text>
        </View>
        {comList}
        <View style={{height:80}}>
        </View>
        <Footer
          onPress0={() => {
            navigation.reset({
              index: 0,
              routes: [{
                name: 'CommunicationHistory' ,
                params: route.params,
                websocket:route.websocket,
                websocket2: route.websocket2,
                profile:route.profile,
                previous:'Company',
                withAnimation: true
              }],
            });
          }}
          onPress1={() => {}}
          onPress2={() => {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Schedule",
                  params: route.params,
                  websocket: route.websocket,
                  websocket2: route.websocket2,
                  profile: route.profile,
                  previous:'Company',
                  withAnimation: true
                },
              ],
            });
          }}
          onPress3={() => {
            navigation.reset({
              index: 0,
              routes: [{
                name: 'TimeLine' ,
                params: route.params,
                websocket:route.websocket,
                websocket2: route.websocket2,
                profile:route.profile,
                previous:'Company',
                withAnimation: true
              }],
            });
          }}
          active={[false,true,false,false]}
        />
      </View>
    </SideMenu>
  </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  headertitle: {
    color:'#fff',
    fontWeight:'700',
    fontSize:20
  },
  header_img: {
    width: 150,
    height: 45,
  },
  container: {
    flex: 1,
  },
  inputview: {
    zIndex:999,
    padding:10,
    height:70
  },
  roomheader :{
    width:'100%',
    flexDirection:'row',
    alignItems:'center'
  },
  roommenu: {
    width:Width,
    backgroundColor:'#fff',
    flexDirection:'row',
  },
  roomblock: {
    width:Width*0.5,
    height: 75,
  },
  roombtn: {
    height: 50,
    width: Width*0.5,
    alignItems:'center',
    justifyContent: 'center',
    marginTop:5,
  },
  roomtext: {
    color:"#000",
    textAlign: 'center',
    fontSize: 12,
    fontWeight:'600',
    marginTop:5
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
  suggestText: {
    fontSize: 15,
    paddingTop: 5,
    paddingBottom: 5,
    margin: 2,
  },
  sub_title: {
    fontSize: 13,
    color: "#9B9B9B",
    marginLeft:'auto',
  },
  buttonContainer: {
    backgroundColor: "#b3b3b3",
    borderRadius: 4,
    alignSelf: "center",
    position: "absolute",
    right: 0,
  },
  buttonLabel: {
    fontSize: 16,
    lineHeight: 30,
    paddingVertical: 8,
    paddingHorizontal: 20,
    color: "#000000",
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
    height:80,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
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
    width:40,
    height:40,
    marginRight:10,
    justifyContent:"center",
    alignItems: "center",
  },
  shop: {
    fontSize: 12,
    width:'65%'
  },
  name: {
    fontSize: 16,
    marginBottom: 5,
    width:'65%'
  },
  date: {
    fontSize: Platform.OS === 'ios'? 10 : 12,
    color:'#999',
    position: "absolute",
    right: 0,
    top: 0,
  },
  message: {
    fontSize: 14,
    color: "#848484",
  },
  memoDelete: {
    padding: 8,
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
    right: 5,
    top:5,
    zIndex:999,
    width:20,
    height:20
  },
  bell2: {
    justifyContent:"center",
    alignItems: "center",
    color: "white",
    fontWeight: "bold",
    borderRadius: 10,
    paddingLeft: 5,
    paddingRight: 5,
    width:20,
    height:20,
    marginLeft:5
  },
  bell3: {
    justifyContent:"center",
    alignItems: "center",
    position: "absolute",
    color: "white",
    fontWeight: "bold",
    backgroundColor: "red",
    borderRadius: 10,
    paddingLeft: 5,
    paddingRight: 5,
    right: 0,
    bottom:0,
    zIndex:999,
    width:20,
    height:20
  },
  belltext: {
    color:'#fff',
    fontSize:9
  },
  menulist: {
    flexDirection:'row',
    marginLeft:10,
    marginVertical:10,
    alignItems:'center',
    height:40,
  },
  menutext: {
    fontSize:20,
    marginLeft:10
  },
});
