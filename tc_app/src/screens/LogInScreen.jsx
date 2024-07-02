import React, { useState, useEffect, useRef } from 'react';
import {
   View, Text, StyleSheet,Image, TouchableOpacity, Alert,TextInput,Platform ,AppState,Linking,LogBox,ImageBackground
} from 'react-native';
import { FloatingLabelInput } from 'react-native-floating-label-input';
import { Feather } from '@expo/vector-icons';
import Toast from 'react-native-root-toast';
import VersionCheck from 'react-native-version-check-expo'
import * as SQLite from "expo-sqlite";
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';
import { LinearGradient } from 'expo-linear-gradient';

import Loading from '../components/Loading';
import { CreateDB, GetDB,db_select,db_write,storage} from '../components/Databace';

const db = SQLite.openDatabase("db");

// どうしようもない警告を非表示にしてます、あとから消します
LogBox.ignoreLogs([
  "[react-native-gesture-handler] Seems like you're using an old API with gesture components, check out new Gestures system!",
]);

// oishi グローバル変数
global.sp_token = ''; // スマホトークン
global.sp_id = '';    // ログインID

global.fc_flg = '';   // fcフラグ

global.testShop_flg = '';   // テスト店舗フラグ

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

export default function LogInScreen(props) {
  
  // 現在利用しているアプリのバージョンを取得する
  const appVersion = VersionCheck.getCurrentVersion();
  
  if (AppState.currentState === 'active') {
    Notifications.setBadgeCountAsync(0);
  }

  const { navigation,route } = props;
  const [cus_notifications, setCus_notifications] = useState(null);
  const [chat_notifications, setChat_notifications] = useState(null);
  const [post_notifications, setPost_notifications] = useState(null);
  const [thank_notifications, setThank_notifications] = useState(null);
  
  const [isLoading, setLoading] = useState(false);
  const [id, setID] = useState('');
  const [password, setPassword] = useState('');
  
  const [fc_flg,setFC_flg] = useState(false);
  
  const [station,setStation] = useState(false);
  const [address,setAddress] = useState(false);
  
  const [rocalDB,setRocalDB] = useState([]);
  const [rocalDBProfile,setRocalDBProfile] = useState([]);
  
  const[ExpoPushToken,setExpoPushToken] = useState(false);
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    navigation.setOptions({
      headerStyle: !fc_flg?{ backgroundColor: '#6C9BCF', height: 110}:{ backgroundColor: '#FF8F8F', height: 110},
      headerTitle: () => 
        !fc_flg?
        (<Image source={require('../../assets/logo.png')} />):
        (<Image source={require('../../assets/logo_onetop.png')} style={styles.header_img} />),
        headerTitleAlign: 'center'
    });
  }, [fc_flg]);

  useEffect(() => {
    
    registerForPushNotificationsAsync();
    
    // メッセージ受信時
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });
    
    // 通知をタップしたらログイン → お客様一覧 → トーク画面 (ログインしていなかったら)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (response.notification.request.content.data.customer && !global.sp_id) {
    
        const cus_data = response.notification.request.content.data.customer;
        setCus_notifications(cus_data);
        
      }
      if (response.notification.request.content.data.room_id && !global.sp_id) {
    
        const room_id = response.notification.request.content.data.room_id;
        setChat_notifications(room_id);
        
      }
      if (response.notification.request.content.data.timeline && !global.sp_id) {
        const tl_data = response.notification.request.content.data.timeline;
        setPost_notifications(tl_data);
      }
      if (response.notification.request.content.data.thank && !global.sp_id) {
        setThank_notifications(true);
      }
    })

    fetch(domain+'js/appversion.json')
    .then((response) => response.json())
    .then((json) => {
      
      var latestAppVersion = json.version;
      
      // 新しいバージョンのアプリがストアに配布されている場合は更新を促す
      if (appVersion < latestAppVersion) {
        
        Alert.alert("更新情報", "新しいバージョンが利用可能です。最新版にアップデートしてご利用ください。", [
          { text: "後で通知", style: "cancel" },
          { text: "アップデート", onPress: () => {
            // iOSとAndroidでストアのURLが違うので分岐する
            if (Platform.OS === "ios") {
              const appId = 1559136330; // AppStoreのURLから確認できるアプリ固有の数値
              const itunesURLScheme = `itms-apps://itunes.apple.com/jp/app/id${appId}?mt=8`;
              const itunesURL = `https://itunes.apple.com/jp/app/id${appId}?mt=8`;
          
              Linking.canOpenURL(itunesURLScheme).then(supported => {
                // AppStoreアプリが開ける場合はAppStoreアプリで開く。開けない場合はブラウザで開く。
                if (supported) {
                  Linking.openURL(itunesURLScheme);
                } else {
                  Linking.openURL(itunesURL);
                }
              });
            } else {
              const appId = "com.totalcloud.totalcloud"; // PlayストアのURLから確認できるid=?の部分
              const playStoreURLScheme = `market://details?id=${appId}`;
              const playStoreURL = `https://play.google.com/store/apps/details?id=${appId}`;
          
              Linking.canOpenURL(playStoreURLScheme).then(supported => {
                // Playストアアプリが開ける場合はPlayストアアプリで開く。開けない場合はブラウザで開く。
                if (supported) {
                  Linking.openURL(playStoreURLScheme);
                } else {
                  Linking.openURL(playStoreURL);
                }
              });
            }
          }}
        ]);
        
      }
    })
    
    // ローカルDBでログイン(同期処理)
    const execute = async() => {
      
      console.log('--------------------------------')

      setLoading(true);

      const toast = (text) => Toast.show(text, {
        duration: Toast.durations.LONG,
        position: 0,
        shadow: true,
        animation: true,
        backgroundColor:'#333333',
        opacity:0.6,
      });

      // 駅・沿線
      const set_station = async() => {
        var station_ = await db_select(`select count(*) as cnt from station_mst;`);
        var cnt = station_[0]["cnt"];
        
        if (cnt == 0) {
          function getStation(){
            return new Promise((resolve, reject)=>{
              fetch(domain+'js/data/reins.json')
              .then((response) => response.json())
              .then((json) => {
                resolve(json);
              })
              .catch((error) => {
                const errorMsg = "失敗駅・沿線";
                Alert.alert(errorMsg);
                resolve(false);
              })
            })
          }
          toast('データベース更新中\n少々お待ちください');
          const GS = await getStation();
          if (GS) await Insert_station_db(GS);
        } else {
          setStation(true);
        }
      }
      
      // エリア
      const set_area = async() => {
        var address_ = await db_select(`select count(*) as cnt from address_mst;`);
        var cnt = address_[0]["cnt"];

        if (cnt == 0) {
          function getAddress(){
            return new Promise((resolve, reject)=>{
              fetch(domain+'js/data/address.json')
              .then((response) => response.json())
              .then((json) => {
                resolve(json);
              })
              .catch((error) => {
                const errorMsg = "失敗エリア";
                Alert.alert(errorMsg);
                resolve(false);
              })
            })
          }

          const GA = await getAddress();
          if (GA) await Insert_area_db(GA);
        } else {
          setAddress(true);
        }
      }

      await CreateDB();
      await set_station();
      await set_area();
      
      // ※ログイン制御の為、最後に処理
      const staff_mst = await GetDB('staff_mst');
      if (staff_mst != false) {
        
        let toast = Toast.show('自動ログインしています', {
          duration: Toast.durations.SHORT,
          position: 200,
          shadow: true,
          animation: true,
          backgroundColor:'#333333',
        });

        setRocalDB(staff_mst);
      }
      
      setLoading(false);
    }
    execute();
    
  }, []);
  
  // ローカルDBまたは取得したトークンで自動ログイン
  useEffect(() => {
    
    if (station && address) {
      if (rocalDB.length != 0) {
        
        if (rocalDB[0].fc_flg) {
          setFC_flg(true)
          global.fc_flg = 1;
        }

        CheckTestShop(rocalDB[0].shop_id);
        
        // websocket通信
        const WS_URL  = 'ws://54.168.20.149:8080/ws/'+rocalDB[0].shop_id+'/'
        const WS_URL2 = 'ws://54.168.20.149:8080/ws/'+rocalDB[0].account+'/'
        
        // ログインデータ保持用
        global.sp_id = rocalDB[0].account;
        setLoading(false);
  
        // ローカルサーバーのデータを更新(サーバーから取得)
        getServerData(rocalDBProfile,rocalDB[0])
        .then((result) => {
          if (result) {
            navigation.reset({
              index: 0,
              routes: [{
                name: 'CommunicationHistory',
                params: rocalDB[0],
                websocket:new WebSocket(WS_URL),
                websocket2:new WebSocket(WS_URL2),
                profile:rocalDBProfile,
                flg:'ローカル',
                previous:'LogIn',
                notifications:cus_notifications?cus_notifications:null,
                notifications2:chat_notifications?chat_notifications:null,
                notifications3:post_notifications?post_notifications:null,
                notifications4:thank_notifications?thank_notifications:null,
              }],
            });
          }
        })
  
      } else if (rocalDB.length == 0 && ExpoPushToken && !global.fc_flg) {

        // ※fcは使わない
        fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: JSON.stringify({
            sp_token : ExpoPushToken,
          })
        })
        .then((response) => response.json())
        .then(async(json) => {
          
          let toast = Toast.show('自動ログインしています', {
            duration: Toast.durations.SHORT,
            position: 200,
            shadow: true,
            animation: true,
            backgroundColor:'#333333',
          });
          
          // ログインデータ保持用
          global.sp_id = json.staff.account;
          
          // // websocket通信
          const WS_URL  = 'ws://54.168.20.149:8080/ws/'+json.staff.shop_id+'/'
          const WS_URL2 = 'ws://54.168.20.149:8080/ws/'+json.staff.account+'/'
          
          const staff = json.staff;
          const shops = json.shops2;

          const staff_data = [
            staff.account,
            staff.password,
            staff.shop_id,
            staff.name_1,
            staff.name_2,
            staff.name,
            shops.corporations_name,
            staff.setting_list,
            staff.app_token,
            shops.system_mail,
            shops.yahoomail,
            shops.gmail,
            shops.hotmail,
            shops.outlook,
            shops.softbank,
            shops.icloud,
            shops.original_mail,
            staff.line_id,
            staff.mail_name,
            staff.mail1,
            staff.mail2,
            staff.mail3,
            staff.top_staff_list,
            staff.setting_list7_mail,
            global.fc_flg,
            shops.option_list
          ];
            
          await Insert_staff_db(staff.account,staff.password,staff_data);
          
          // プロフィール情報をサーバーから取得
          const profile = json.profile;
          const profile_data = [
            profile.staff_id,
            profile.birthplace,
            profile.birthday,
            profile.profile_tag,
            profile.staff_photo1,
            profile.staff_photo2,
            profile.staff_photo3,
            profile.staff_photo4,
          ];
          
          await Insert_profile_db(staff.account,profile_data);

          const staff_list = json.staff_list;
          await Insert_staff_all_db(staff_list);

          navigation.reset({
            index: 0,
            routes: [{
              name: 'CommunicationHistory',
              params: json.staff,
              websocket:new WebSocket(WS_URL),
              websocket2:new WebSocket(WS_URL2),
              profile:profile,
              flg:'トークン',
              previous:'LogIn',
              notifications:cus_notifications?cus_notifications:null,
              notifications2:chat_notifications?chat_notifications:null,
              notifications3:post_notifications?post_notifications:null,
              notifications4:thank_notifications?thank_notifications:null,
            }],
          });
      
        })
      }
    }
      
  }, [station,address,rocalDB,cus_notifications,post_notifications,chat_notifications,thank_notifications]);
  
  async function Insert_staff_db(account,pass,data){

    var sql = `select * from staff_mst where (account = '${account}' and password = '${pass}');`;
    var staff_mst = await db_select(sql);

    if (staff_mst == false) {
      var insert_staff = `insert into staff_mst values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`;
      await db_write(insert_staff,data);
    }
  
  }

  // プロフィール情報をsqlliteに登録
  async function Insert_profile_db(account,data){
    
    var sql = `select * from staff_profile where (staff_id = '${account}');`;
    var staff_profile = await db_select(sql);

    if (staff_profile == false) {
      var insert_profile = `insert into staff_profile values (?,?,?,?,?,?,?,?);`;
      await db_write(insert_profile,data);
    }
  
  }

  // スタッフリストデータベース登録
  async function Insert_staff_all_db(staff_all) {

    setLoading(true);

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
    
    setLoading(false);
  }
  
  // 駅・沿線データベース登録
  async function Insert_station_db(station){

    var sql = `select * from station_mst;`;
    var station_mst = await db_select(sql);

    if (station_mst == false) {
      var insert_station = `insert into station_mst values `;
      for (var s=0;s<station.length;s++) {
        insert_station += `('${station[s]["id"]}','${station[s]["name"]}'),`;
      }
      insert_station = insert_station.substring(0, insert_station.length-1); // 最後のコンマ消す
      await db_write(insert_station,[]);
    }

  }
  
  // エリアデータベース登録
  async function Insert_area_db(address){

    var sql = `select * from address_mst;`;
    var address_mst = await db_select(sql);

    if (address_mst == false) {
      var insert_address = `insert into address_mst values `;
      for (var a=0;a<address.length;a++) {
        insert_address += `('${address[a]["id"]}','${address[a]["name"]}'),`;
      }
      insert_address = insert_address.substring(0, insert_address.length-1); // 最後のコンマ消す
      await db_write(insert_address,[]);
    }
  }
  
  // ID・PASS記入時のログイン処理
  function onSubmit(){
    
    setLoading(true);
    
    if (!id && !password) {
      Alert.alert('IDとパスワードを入力してください');
      setLoading(false);
      return
    }
    if (!id) {
      Alert.alert('IDを入力してください');
      setLoading(false);
      return
    } else if (!password) {
      Alert.alert('パスワードを入力してください');
      setLoading(false);
      return
    }
    
    let formData = new FormData();
    formData.append('ID',id);
    formData.append('pass',password);
    formData.append('formdata_flg',1);
    formData.append('fc_flg',global.fc_flg);
    
    fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
    {
      method: 'POST',
      header: {
        'content-type': 'multipart/form-data',
      },
      body: formData
    })
    .then((response) => response.json())
    .then(async(json) => {
      
      // ログインデータ保持用
      global.sp_id = id;

      // トークン取得＆登録
      await registerForPushNotificationsAsync();
      
      // websocket通信
      const WS_URL  = 'ws://54.168.20.149:8080/ws/'+json.staff.shop_id+'/'
      const WS_URL2 = 'ws://54.168.20.149:8080/ws/'+json.staff.account+'/'
      
      const staff = json.staff;
      const shops = json.shops2;

      const staff_data = [
        staff.account,
        staff.password,
        staff.shop_id,
        staff.name_1,
        staff.name_2,
        staff.name,
        shops.corporations_name,
        staff.setting_list,
        staff.app_token,
        shops.system_mail,
        shops.yahoomail,
        shops.gmail,
        shops.hotmail,
        shops.outlook,
        shops.softbank,
        shops.icloud,
        shops.original_mail,
        staff.line_id,
        staff.mail_name,
        staff.mail1,
        staff.mail2,
        staff.mail3,
        staff.top_staff_list,
        staff.setting_list7_mail,
        global.fc_flg,
        shops.option_list
      ];
        
      await Insert_staff_db(staff.account,staff.password,staff_data);
      
      CheckTestShop(staff.shop_id);

      // プロフィール情報をサーバーから取得
      const profile = json.profile;
      const profile_data = [
        profile[0].staff_id,
        profile[0].birthplace,
        profile[0].birthday,
        profile[0].profile_tag,
        profile[0].staff_photo1,
        profile[0].staff_photo2,
        profile[0].staff_photo3,
        profile[0].staff_photo4,
      ];

      await Insert_profile_db(staff.account,profile_data);

      const staff_list = json.staff_list;
      await Insert_staff_all_db(staff_list);

      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{
          name: 'CommunicationHistory',
          params: json.staff,
          websocket:new WebSocket(WS_URL),
          websocket2:new WebSocket(WS_URL2),
          profile:profile,
          flg:'入力',
          previous:'LogIn'
        }],
      });
      
    })
    .catch((error) => {
      const errorMsg = "IDまたはパスワードが違います";
      Alert.alert(errorMsg);
      console.log(error)
      setLoading(false);
    })
  };

  // サーバーからのデータを取得して、ローカルサーバーの中身を更新
  function getServerData(obj,staff){

    return new Promise((resolve, reject)=>{
      fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        // PHPに送るデータ
        body: JSON.stringify({
          ID : staff.account,
          pass : staff.password,
          fc_flg: global.fc_flg
        })
      })
      .then((response) => response.json())
      .then(async(json) => {
        
        const staff = json.staff;
        const shops = json.shops2;
        
        // ログインデータ保持用
        global.sp_id = staff.account;

        // テーブルを空にする
        await db_write(`delete from staff_mst;`,[]);     // スタッフ
        await db_write(`delete from staff_profile;`,[]); // スタッフプロフィール

        // スタッフ情報をサーバーから取得
        const staff_data = [
          staff.account,
          staff.password,
          staff.shop_id,
          staff.name_1,
          staff.name_2,
          staff.name,
          shops.corporations_name,
          staff.setting_list,
          staff.app_token,
          shops.system_mail,
          shops.yahoomail,
          shops.gmail,
          shops.hotmail,
          shops.outlook,
          shops.softbank,
          shops.icloud,
          shops.original_mail,
          staff.line_id,
          staff.mail_name,
          staff.mail1,
          staff.mail2,
          staff.mail3,
          staff.top_staff_list,
          staff.setting_list7_mail,
          global.fc_flg,
          shops.option_list
        ];
          
        await Insert_staff_db(staff.account,staff.password,staff_data);

        // プロフィール情報をサーバーから取得
        const profile = json.profile;
        const profile_data = [
          profile[0].staff_id,
          profile[0].birthplace,
          profile[0].birthday,
          profile[0].profile_tag,
          profile[0].staff_photo1,
          profile[0].staff_photo2,
          profile[0].staff_photo3,
          profile[0].staff_photo4,
        ];

        obj.push(profile[0]);

        await Insert_profile_db(staff.account,profile_data);

        const staff_list = json.staff_list;
        await Insert_staff_all_db(staff_list);

        resolve(true);

      })
      .catch((error) => {
        const errorMsg = "[※]自動ログインに失敗しました。";
        Alert.alert(errorMsg);
        console.log(error)
        resolve(false);
      })
    });
    
  }


  // 20210826 端末トークン取得用(DBに端末情報保存)
  async function registerForPushNotificationsAsync() {

    let token;
    
    if (Platform.OS === 'ios') {
      const { status } = await requestTrackingPermissionsAsync();
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert(
          `プッシュ通知が無効になっています`,
          "設定画面へ移動しますか？",
          [
            {
              text: "キャンセル",
              style: "cancel",
              onPress:() => {return}
            },
            {
              text: "設定する",
              onPress: () => {
                Linking.openURL("app-settings:");
              }
            }
          ]
        );
        return;
      }
      
      // 【重要】端末別のトークン取得
      token = (await Notifications.getExpoPushTokenAsync({projectId:"17f9fbe4-117d-4572-aaf6-39347ef9f85d"})).data;
  
      // グローバル変数にトークンを格納
      global.sp_token = token;
      
      // グローバル変数に、tokenとログインIDがある場合
      if(global.sp_token && global.sp_id){
        
        // サーバーに情報送信して、DBに書き込み
        await fetch(domain+'app/app_system/set_staff_app_token.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: global.sp_id,
            token: global.sp_token,
            fc_flg: global.fc_flg
          }),
        })
      }
  
    } else {
      alert('この端末では、プッシュ通知が機能しません。');
    }

    setExpoPushToken(token);

    return;
  }
  
  // Cookieの関係で切り替え処理を先入れる
  function Change_FC(fc) {
    
    if (!fc) {
      setFC_flg(false)
      global.fc_flg = '';
      
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
      .catch((error) => {
        console.log(error)
      })
      
    } else {
      
      setFC_flg(true)
      global.fc_flg = 1;
      
      let formData = new FormData();
      formData.append('fc_flg',1);
      
      fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
      {
        method: 'POST',
        header: {
          'content-type': 'multipart/form-data',
        },
        body: formData
      })
      .catch((error) => {
        console.log(error)
      })
      
    }
    
  }

  function CheckTestShop(shop_id) {
    
    const testShopIdArray = [
      "00001",
      "00002",
      "12345",
      "99999",
      "feides",
      "99998",
    ]

    if(testShopIdArray.includes(shop_id)){
      global.testShop_flg = 1;
    } else {
      global.testShop_flg = '';
    }

  }

  const bgc = !global.fc_flg?['#00A0F3', '#00C4F7', '#00E2E3']:['#FF4F4F', '#FCB2AA'];

  return (
    <View style={styles.container}>
      <Loading isLoading={isLoading} />
      <View style={styles.inner}>
        <View style={styles.input}>
          <FloatingLabelInput
            label={"ID"}
            value={id}
            onChangeText={(text) => { setID(text); }}
            containerStyles={styles.inputInner}
            labelStyles={styles.inputLabel}
            inputStyles={{
              fontSize: 20,
            }}
          />
        </View>
        <View style={styles.input}>
          <FloatingLabelInput
            label={"パスワード"}
            value={password}
            isPassword
            customShowPasswordComponent={
              <Feather
                name='eye'
                size={20}
                color='#1f2d53'
              />
            }
            customHidePasswordComponent={
              <Feather
                name='eye-off'
                size={20}
                color='#1f2d53'
              />
            }
            onChangeText={(text) => { setPassword(text); }}
            containerStyles={styles.inputInner}
            labelStyles={styles.inputLabel}
            inputStyles={{
              fontSize: 20,
            }}
          />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={onSubmit}
          activeOpacity={0.8}
          >
            <LinearGradient
              colors={bgc}
              style={styles.login}
              >
              <Text style={styles.login_text}>ロ グ イ ン</Text>
            </LinearGradient>
        </TouchableOpacity>
        {!fc_flg?(
        <>
          <Text style={styles.onetop}>ONE TOP HOUSE はこちらから</Text>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => Change_FC(1)}
            >
              <Image source={require('../../assets/logo_onetop.png')} resizeMode="cover" style={styles.onetop_btn} />
          </TouchableOpacity>
        </>
        ):(
        <>
          <Text style={[styles.onetop,{color:'#00A0F3'}]}>TOTAL CLOUD はこちらから</Text>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => Change_FC('')}
            >
              <Image source={require('../../assets/logo_login.png')} resizeMode="cover" style={styles.onetop_btn} />
          </TouchableOpacity>
        </>
        )}
        <Text style={styles.version}>var {appVersion}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header_img: {
    width:150,
    height:45
  },
  container: {
    flex: 1,
    backgroundColor: '#f9fafd',
  },
  inner: {
    paddingHorizontal: 25,
    marginBottom: 25,
    marginTop: 50,
    flex:1,
  },
  form: {
    width: "100%"
  },
  input: {
    marginBottom: 35,
  },
  inputInner: {
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical:15,
    backgroundColor: '#fff',
    borderColor: '#191970',
    borderRadius: 8,
    fontSize:20,
  },
  buttonContainer: {
    alignSelf: 'center',
  },
  button: {
    width:200,
    height:51
  },
  errors: {
    color: 'red',
    marginBottom:5,
  },
  onetop: {
    marginTop:50,
    marginBottom:10,
    textAlign:'center',
    color:'#ff4f4f',
    fontSize:16,
    fontWeight:'bold',
  },
  onetop_btn: {
    width:200,
    height:60
  },
  version :{
    position:'absolute',
    bottom:0,
    right:15
  },
  button:{
    alignSelf: 'center',
    width:200,
    height:50,
    shadowColor: "#999",
    shadowOffset: { width: 1, height: 5 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5
  },
  login: {
    width:200,
    height:50,
    justifyContent:'center',
    alignItems:'center',
    borderRadius:10,
  },
  login_text: {
    fontSize:23,
    fontWeight:'600',
    color:'#fff',
    textAlign:'center'
  }
});
