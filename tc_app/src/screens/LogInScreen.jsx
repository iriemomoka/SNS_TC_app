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

import Loading from '../components/Loading';
import { CreateDB, GetDB, db} from '../components/Databace';

// どうしようもない警告を非表示にしてます、あとから消します
LogBox.ignoreLogs([
  "[react-native-gesture-handler] Seems like you're using an old API with gesture components, check out new Gestures system!",
]);

// oishi グローバル変数
global.sp_token = ''; // スマホトークン
global.sp_id = '';    // ログインID

global.fc_flg = '';   // fcフラグ

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

export default function LogInScreen(props) {

  // アプリの最新バージョンを取得する実装
  const latestAppVersion = '2.2.4';
  
  // 現在利用しているアプリのバージョンを取得する
  const appVersion = VersionCheck.getCurrentVersion();
  
  if (AppState.currentState === 'active') {
    Notifications.setBadgeCountAsync(0);
  }

  const { navigation,route } = props;
  const cus_notifications = route.params;
  
  const [isLoading, setLoading] = useState(false);
  const [id, setID] = useState('');
  const [password, setPassword] = useState('');
  
  const [fc_flg,setFC_flg] = useState(false);
  
  const [station,setStation] = useState([]);
  const [address,setAddress] = useState([]);
  
  const [rocalDB,setRocalDB] = useState([]);
  const [rocalDBProfile,setRocalDBProfile] = useState([]);
  
  const[ExpoPushToken,setExpoPushToken] = useState(false);
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  
  useEffect(() => {
    navigation.setOptions({
      headerStyle: !fc_flg?{ backgroundColor: '#1d449a', height: 110}:{ backgroundColor: '#fd2c77', height: 110},
      headerTitle: () => 
        !fc_flg?
        (<Image source={require('../../assets/logo.png')} />):
        (<Image source={require('../../assets/logo_onetop.png')} style={styles.header_img} />)
    });
  }, [fc_flg]);

  useEffect(() => {
    
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
    
    // メッセージ受信時
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });
    
    // 通知をタップしたらログイン → お客様一覧 → トーク画面 (ログインしていなかったら)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      if (response.notification.request.content.data.customer && !global.sp_id) {
    
        const cus_data = response.notification.request.content.data.customer;
        
        navigation.navigate(
          'LogIn',
          {
            customer_id: cus_data.customer_id,
            name: cus_data.name,
          }
        );
        
      }
    })
    
    // 新しいバージョンのアプリがストアに配布されている場合は更新を促す
    if (appVersion != latestAppVersion) {
      
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
    
    // ローカルDBでログイン(同期処理)
    const execute = async() => {
      
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
        const station_ = await GetDB('station_mst');
        
        if (station_ == false) {
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
          setStation(station_);
        }
      }
      
      // エリア
      const set_area = async() => {
        const address_ = await GetDB('address_mst');

        if (address_ == false) {
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
          setAddress(address_);
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

      // プロフィール情報取得【ローカルDB】
      //await GetDB(rocalDBProfile,'staff_profile');
      
      setLoading(false);
    }
    execute();
    
  }, []);
  
  // 取得したトークンで自動ログイン
  useEffect(() => {
    
    if (station.length > 0 && address.length > 0) {
      if (rocalDB.length != 0) {
        
        if (rocalDB[0].fc_flg) {
          setFC_flg(true)
          global.fc_flg = 1;
        }
        
        // websocket通信
        const WS_URL = 'ws://54.168.20.149:8080/ws/'+rocalDB[0].shop_id+'/'
        
        // ログインデータ保持用
        global.sp_id = rocalDB.account;
        setLoading(false);
  
        // ローカルサーバーのデータを更新(サーバーから取得)
        getServerData(rocalDBProfile,rocalDB[0]);
  
        //GetDB(rocalDBProfile,'staff_profile');
  
        navigation.reset({
          index: 0,
          routes: [{
            name: 'CommunicationHistory',
            params: rocalDB[0],
            websocket:new WebSocket(WS_URL),
            station:station,
            address:address,
            profile:rocalDBProfile,
            flg:'ローカル',
            previous:'LogIn',
            notifications:cus_notifications?cus_notifications:null,
          }],
        });
  
      } else if (rocalDB.length == 0 && ExpoPushToken && !global.fc_flg) {
        // fcは使わない
        fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          // PHPに送るデータ
          body: JSON.stringify({
            sp_token : ExpoPushToken,
          })
        })
          .then((response) => response.json())
          .then((json) => {
            // 多分使ってない。
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
            const WS_URL = 'ws://54.168.20.149:8080/ws/'+json.staff.shop_id+'/'
            
            const staff = json.staff;
  
            const staff_data = [
              staff.account,
              staff.password,
              staff.shop_id,
              staff.name_1,
              staff.name_2,
              staff.name,
              staff.corporations_name,
              staff.setting_list,
              staff.app_token,
              staff.system_mail,
              staff.yahoomail,
              staff.gmail,
              staff.hotmail,
              staff.outlook,
              staff.softbank,
              staff.icloud,
              staff.original_mail,
              staff.line_id,
              staff.mail_name,
              staff.mail1,
              staff.mail2,
              staff.mail3,
              staff.top_staff_list,
              staff.setting_list7_mail,
              null
            ];
              
            Insert_staff_db(staff.account,staff.password,staff_data);
            
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
            console.log("profile_data02");
            Insert_profile_db(staff.account,profile_data);

            navigation.reset({
              index: 0,
              routes: [{
                name: 'CommunicationHistory',
                params: json.staff,
                websocket:new WebSocket(WS_URL),
                station:station,
                address:address,
                profile:profile,
                flg:'トークン',
                previous:'LogIn',
                notifications:cus_notifications?cus_notifications:null,
              }],
            });
        
          })
      }
    }
      
  }, [station,address,rocalDB]);
  
  function Insert_staff_db(account,pass,data){
    
    db.transaction((tx) => {
      
      tx.executeSql(
        `select * from staff_mst where (account = ? and password = ?);`,
        [account,pass],
        (_, { rows }) => {
          
          if (!rows._array.length) {
            tx.executeSql(
              `insert into staff_mst values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
              data,
              () => {console.log("insert staff_mst");},
              () => {console.log("staff_mst 失敗");}
            );
          } else {
            // console.log("localDB staff OK");
          }
        },
        () => {console.log("失敗");}
      );
      
    });
  
  }

// 臨時用テーブル自体を削除
function Drop_staff_db(){
    
  new Promise((resolve, reject)=>{
    db.transaction((tx) => {
      // スタッフプロフィール
      tx.executeSql(
        `drop table staff_profile;`,
        [],
        () => {console.log("staff_profile [drop]テーブル削除");},
        () => {console.log("staff_profile [drop]テーブル削除失敗");}
      );
      resolve();
    })
  });
}

// テーブルを空にする
function delete_db(){
    
  new Promise((resolve, reject)=>{
    db.transaction((tx) => {
      // スタッフ
      tx.executeSql(
        `delete from staff_mst;`,
        [],
        () => {console.log("staff_mst [delete]テーブル削除");},
        () => {console.log("staff_mst [delete]テーブル削除失敗");}
      );
      // スタッフプロフィール
      tx.executeSql(
        `delete from staff_profile;`,
        [],
        () => {console.log("staff_profile [delete]テーブル削除");},
        () => {console.log("staff_profile [delete]テーブル削除失敗");}
      );
      resolve();
    })
  });
}

  // プロフィール情報をsqlliteに登録
  function Insert_profile_db(account,data){
    
    db.transaction((tx) => {
      
      tx.executeSql(
        `select * from staff_profile where (staff_id = ?);`,
        [account],
        (_, { rows }) => {
          if (!rows._array.length) {
            tx.executeSql(
              `insert into staff_profile values (?,?,?,?,?,?,?,?);`,
              data,
              () => {console.log("insert staff_profile");},
              () => {console.log("staff_profile 失敗");}
            );
          } else {
            // console.log("localDB staff OK");
          }
        },
        () => {console.log("失敗");}
      );
      
    });
  
  }


  
  // 駅・沿線データベース登録
  function Insert_station_db(station){
    return new Promise((resolve, reject)=>{
      db.transaction((tx) => {
        
        tx.executeSql(
          `select * from station_mst;`,
          [],
          (_, { rows }) => {
            setLoading(true)
            if (!rows._array.length) {
              
              db.transaction((tx) => {
                Promise.all(station.map((s) => {
                  tx.executeSql(
                    `insert into station_mst values (?,?);`,
                    [s.id,s.name],
                    () => {
                      // console.log("insert station_mst");
                    },
                    () => {console.log("station_mst 失敗");}
                  );
                })).then(() => {
                  tx.executeSql(
                    `select * from station_mst;`,
                    [],
                    (_, { rows }) => {
                      setStation(rows._array);
                      resolve();
                    }
                  );
                });
              })
                
            }
            
            if (rows._array.length) {
              setStation(rows._array);
              resolve();
            }
          },
          () => {
            console.log("失敗b");
            resolve();
          }
        );
        
      });
    });
  }
  
  // エリアデータベース登録
  function Insert_area_db(address){
    return new Promise((resolve, reject)=>{
      db.transaction((tx) => {
        tx.executeSql(
          `select * from address_mst;`,
          [],
          (_, { rows }) => {
            setLoading(true)
            if (!rows._array.length) {
              
              db.transaction((tx) => {
                Promise.all(address.map((a) => {
                  tx.executeSql(
                    `insert into address_mst values (?,?);`,
                    [a.id,a.name],
                    () => {
                      // console.log("insert address_mst");
                    },
                    () => {console.log("address_mst 失敗");}
                  );
                })).then(() => {
                  tx.executeSql(
                    `select * from address_mst;`,
                    [],
                    (_, { rows }) => {
                      setAddress(rows._array);
                      resolve();
                    }
                  );
                });
              })
            }
            
            if (rows._array.length) {
              setAddress(rows._array);
              resolve(setLoading(false));
              
            }
          },
          () => {
            console.log("失敗");
            resolve();
          }
        );
        
      });
    });
  }
  
  // ID・PASS記入時のログイン処理
  function onSubmit(){
    
    setLoading(false);
    
    if (!id && !password) {
      Alert.alert('IDとパスワードを入力してください');
      return
    }
    if (!id) {
      Alert.alert('IDを入力してください');
      return
    } else if (!password) {
      Alert.alert('パスワードを入力してください');
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
      .then((json) => {
        
        // ログインデータ保持用
        global.sp_id = id;

        // トークン取得＆登録
        registerForPushNotificationsAsync().then(token => setExpoPushToken(token));
        
        // websocket通信
        const WS_URL = 'ws://54.168.20.149:8080/ws/'+json.staff.shop_id+'/'
        
        const staff = json.staff;
        
        const staff_data = [
          staff.account,
          staff.password,
          staff.shop_id,
          staff.name_1,
          staff.name_2,
          staff.name,
          staff.corporations_name,
          staff.setting_list,
          staff.app_token,
          staff.system_mail,
          staff.yahoomail,
          staff.gmail,
          staff.hotmail,
          staff.outlook,
          staff.softbank,
          staff.icloud,
          staff.original_mail,
          staff.line_id,
          staff.mail_name,
          staff.mail1,
          staff.mail2,
          staff.mail3,
          staff.top_staff_list,
          staff.setting_list7_mail,
          global.fc_flg
        ];
          
        Insert_staff_db(staff.account,staff.password,staff_data);
        
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

        // console.log(profile_data);

        console.log("profile_data01");
        Insert_profile_db(staff.account,profile_data);

        navigation.reset({
          index: 0,
          routes: [{
            name: 'CommunicationHistory',
            params: json.staff,
            websocket:new WebSocket(WS_URL),
            station:station,
            address:address,
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
      })
  };

  // サーバーからのデータを取得して、ローカルサーバーの中身を更新
  function getServerData(obj,staff){
    console.log(998877);
    // console.log(staff);
    // 
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
      .then((json) => {
        
        const staff = json.staff;
        
        // ログインデータ保持用
        global.sp_id = staff.account;

        console.log(665544);
        // console.log(json.staff);
        
        // テーブルの中身を空にする
        delete_db();
          
        // スタッフ情報をサーバーから取得
        const staff_data = [
          staff.account,
          staff.password,
          staff.shop_id,
          staff.name_1,
          staff.name_2,
          staff.name,
          staff.corporations_name,
          staff.setting_list,
          staff.app_token,
          staff.system_mail,
          staff.yahoomail,
          staff.gmail,
          staff.hotmail,
          staff.outlook,
          staff.softbank,
          staff.icloud,
          staff.original_mail,
          staff.line_id,
          staff.mail_name,
          staff.mail1,
          staff.mail2,
          staff.mail3,
          staff.top_staff_list,
          staff.setting_list7_mail,
          global.fc_flg
        ];
          
        Insert_staff_db(staff.account,staff.password,staff_data);

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

          // console.log(profile_data);
          console.log("[auto_login]profile_data");

          obj.push(profile[0]);

          // サーバーから取ってきたデータを挿入
          Insert_profile_db(staff.account,profile_data);

      })
      .catch((error) => {
        const errorMsg = "[※]自動ログインに失敗しました。";
        Alert.alert(errorMsg);
        console.log(error)
      })
    
  }


  // 20210826 端末トークン取得用(DBに端末情報保存)
  async function registerForPushNotificationsAsync() {
    let token;
    let experienceId = undefined;
    
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
      token = (await Notifications.getExpoPushTokenAsync()).data;
  
      // グローバル変数にトークンを格納
      global.sp_token = token;
      
      // トークン保存
      //alert("check1");
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
  
    }
    else {
      alert('この端末では、プッシュ通知が機能しません。');
    }
  
    return token;
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
      .then((response) => response.json())
      .then((json) => {
        console.log(json);
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
      .then((response) => response.json())
      .then((json) => {
        console.log(json);
      })
      .catch((error) => {
        console.log(error)
      })
      
    }
    
  }

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
          style={styles.buttonContainer}
          onPress={onSubmit}
          >
            <Image source={require('../../assets/btn_login.png')} resizeMode="cover" style={styles.button} />
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
          <Text style={[styles.onetop,{color:'#1d449a'}]}>TOTAL CLOUD はこちらから</Text>
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={() => Change_FC('')}
            >
              <Image source={require('../../assets/logo_login.png')} resizeMode="cover" style={styles.onetop_btn} />
          </TouchableOpacity>
        </>
        )}
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
    color:'#fd2c77',
    fontSize:16,
    fontWeight:'bold',
  },
  onetop_btn: {
    width:200,
    height:60
  }
});
