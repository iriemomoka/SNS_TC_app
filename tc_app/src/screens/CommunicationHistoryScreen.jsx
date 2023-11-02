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
  Button,
  ScrollView,
  RefreshControl,
  BackHandler,
  AppState,
  Platform,
  Keyboard,
  Image,
  Dimensions,
} from "react-native";
import DropDownPicker, { Item } from "react-native-dropdown-picker";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Permissions from "expo-permissions";
import SideMenu from 'react-native-side-menu-updated';
import * as SQLite from "expo-sqlite";

import Loading from "../components/Loading";
import { GetDB,db_select,db_write } from '../components/Databace';
import { set } from "react-native-reanimated";

import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ローカルストレージ読み込み
const storage = new Storage({
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

const db = SQLite.openDatabase("db");

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = "https://www.total-cloud.net/";

Notifications.setBadgeCountAsync(0);

export default function CommunicationHistoryScreen(props) {

  const [isLoading, setLoading] = useState(false);

  const { navigation, route } = props;

  const [memos, setMemos] = useState([]);

  const [name, setName] = useState("");

  const [open, setOpen] = useState(false);
  const [staff_value, setStaff_Value] = useState(null);
  const [staffs, setStaffs] = useState([]);

  const [bell_count, setBellcount] = useState(null);

  const [menu, setMenu] = useState(false);
  const deviceScreen = Dimensions.get('window');
  
  const listRef = useRef([]);
  
  // 参照データ取得日時
  const [date, setDate] = useState('');
  
  var staffList = useMemo(()=>{

    var items = [];

    for (var s=0;s<staffs.length;s++) {
      var item = staffs[s];
      if (item.account != "all") {
        var data = {
          label:item.name_1 + "　" + (item.name_2 ? item.name_2 : ""),
          value: item.account,
        }
        items.push(data);
      }
    }

    items.unshift({ label: "全員", value: "all" });
    items.unshift({ label: "担当無し", value: "" });

    return items;

  },[staffs]);
  
  useLayoutEffect(() => {

    if (AppState.currentState === "active") {
      Notifications.setBadgeCountAsync(0);
    }

    navigation.setOptions({
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#1d449a", height: 110 }
        : { backgroundColor: "#fd2c77", height: 110 },
      headerTitle: () =>
        !global.fc_flg ? (
          <Image source={require("../../assets/logo.png")} />
        ) : (
          <Image
            source={require("../../assets/logo_onetop.png")}
            style={styles.header_img}
          />
        ),
      headerRight: () => (
        <View style={{marginRight:15}}>
          <View style={bell_count?styles.bell:{display:'none'}}>
            <Text Id="bell_text" style={styles.belltext} >{bell_count}</Text>
          </View>
          <TouchableOpacity
            style={{width:60,height:60,justifyContent:'center',alignItems:'center'}}
            onPress={() => {
              setMenu(!menu);
            }}
          >
            <Feather
              name="menu"
              color="white"
              size={35}
            />
          </TouchableOpacity>
        </View>
      ),
    });

  },[bell_count]);

    
  useEffect(() => {

    console.log('--------------------------')

    // ログイン時のみサーバーDB見に行く
    if (route.previous == "LogIn") {

      navigation.setOptions({
        gestureDirection: "vertical-inverted",
      });

      Display(true);

    } else {

      Display(false);

    }

    // 通知をタップしたらお客様一覧 → トーク画面 (ログイン済)
    const notificationInteractionSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
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
                profile: route.profile,
                staff: staffs,
                cus_name: cus_data.name,
              },
            ],
          });
        }
      });

    return () => {
      BackHandler.addEventListener("hardwareBackPress", true).remove();
      notificationInteractionSubscription.remove();
    };

  }, []);

  useEffect(() => {
    if (route.notifications) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "TalkScreen",
            params: route.params,
            customer: route.notifications.customer_id,
            websocket: route.websocket,
            profile: route.profile,
            staff: staffs,
            cus_name: route.notifications.name,
          },
        ],
      });
    }
  }, []);

  // 更新
  const [refreshing, setRefreshing] = useState(false);

  async function Display(flg) {

    if (flg) {
      onRefresh(false);
    } else {
      storage.load({
        key : 'GET-DATA'
      })
      .then(data => {
    
        if (data) {
  
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
        }
      })
      .catch(err => {
        storage.save({
          key: 'GET-DATA',
          data: '',
        });
      })
    }

    var loadflg = false;

    var sql = `select count(*) as count from customer_mst;`;
    var customer = await db_select(sql);
    const cnt = customer[0]["count"];

    if (cnt == 0) loadflg = true;

    loadflg&&setLoading(true);

    // ローカルDB用スタッフリスト
    const staff_ = await Insert_staff_list_db("");

    // ローカルDB用お客様情報＋最新のコミュニケーション
    await Insert_customer_db("");
    
    await searchCustomer(staff_,true);

    await Insert_fixed_db("");

    await getBELL();

    loadflg&&setLoading(false);

  }

  // websocket通信(繋がった)
  route.websocket.onopen = (open) => {
    console.log("open");
  };

  // websocket通信(メール届いたら更新)
  route.websocket.onmessage = (message) => {
    // route.websocket.send(JSON.stringify( { "flg": 'hello' } ));
    let catchmail_flg = JSON.parse(message.data);
    console.log(catchmail_flg.message);
    onRefresh(true);
  };

  // websocket通信(切断したら再接続)
  route.websocket.onclose = (close) => {
    if (global.sp_token & global.sp_id) {
      console.log("closed");
      const WS_URL = "ws://54.168.20.149:8080/ws/" + route.params.shop_id + "/";
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "CommunicationHistory",
            params: route.params,
            websocket: new WebSocket(WS_URL),
          },
        ],
      });
    }
  };

  const onRefresh = useCallback(async(flg) => {

    const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    if (flg) setLoading(true);

    setDate('最新データ取得中');

    const startTime = Date.now(); // 開始時間

    const json = await getCOM();

    // ログアウトしてたら中断
    if(!global.sp_token && !global.sp_id) return;

    const endTime = Date.now(); // 終了時間
    const time = (endTime - startTime)/1000;
    console.log('onRefresh：'+time + '秒')

    if (json != false) {

      // ローカルDB用スタッフリスト
      const staff_ = await Insert_staff_list_db(json.staff);

      // ローカルDB用お客様情報＋最新のコミュニケーション
      await Insert_customer_db(json.search);
      await searchCustomer(staff_,true);

      // ローカルDB用定型文
      const fixed_mst_data = Object.entries(json.fixed_array).map(
        ([key, value]) => {
          return { key, value };
        }
      );

      // 登録用に一つ一つ配列化
      const fixed_mst = [];

      fixed_mst_data.map((f) => {
        if (!f.value.length) {
          fixed_mst.push({
            fixed_id: "",
            category: f.key,
            title: "",
            mail_title: "",
            note: "",
          });
        } else {
          f.value.map((v) => {
            fixed_mst.push({
              fixed_id: v.fixed_id,
              category: f.key,
              title: v.title,
              mail_title: v.note.substring(0, v.note.indexOf("<[@]>")),
              note: v.note.substr(v.note.indexOf("<[@]>") + 5),
            });
          });
        }
      });

      await Insert_fixed_db(fixed_mst);

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
        key: 'GET-DATA',
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

      var sql = `select count(*) as count from customer_mst;`;
      var customer = await db_select(sql);
      const cnt = customer[0]["count"];

      const errTitle = "ネットワークの接続に失敗しました";
      const errMsg   = "端末に保存された" + cnt + "件のメッセージのみ表示します";

      Alert.alert(errTitle, errMsg);

    }

    await getBELL();


    if (flg) setLoading(false);

    return;

  }, []);

  const endRefresh = useCallback(async() => {
    
    var sql = `select count(*) as count from customer_mst;`;
    var customer = await db_select(sql);
    const cnt = customer[0]["count"];
    
    if (cnt >= 500) return;

    setLoading(true);

    const json = await getCOMNEXT(cnt);

    // ログアウトしてたら中断
    if(!global.sp_token && !global.sp_id) return;
    
    if (json != false) {
      // ローカルDB用お客様情報＋最新のコミュニケーション
      await Insert_customer_db(json.search);
      await searchCustomer(staff_value,false);
    }

    setLoading(false);
  });
  
  const getCOM = useCallback(() => {
    
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
          act: "customer_list",
          fc_flg: global.fc_flg,
          page:0,
        }),
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

  const getCOMNEXT = useCallback((page) => {
    
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
          act: "customer_list",
          fc_flg: global.fc_flg,
          page:page,
        }),
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

  // スタッフリストデータベース登録
  async function Insert_staff_list_db(staff_list) {

    if (staff_list) {

      var sql = `select * from staff_list where (account != 'all');`;
      var stf = await db_select(sql);

      var check_flg = "";

      // ローカルDBのスタッフ情報
      var DBstf = [];
      if (stf != false) {
        DBstf = stf.map((s) => {
          if (s.check) check_flg = s.account;
          return s.account
        })
      }

      // 最新のスタッフ情報
      var APIstf = [];

      for (var s=0;s<staff_list.length;s++) {
        var staff = staff_list[s];
        var staff_insert = `insert or replace into staff_list values (?,?,?,?);`
        var staff_data = [staff.account, staff.name_1, staff.name_2, check_flg==staff.account?"1":""]
        await db_write(staff_insert,staff_data);
        APIstf.push(staff.account);
      }

      // 削除するスタッフ情報
      const DELstf = DBstf.filter(stf => !APIstf.includes(stf));
      
      for (var d=0;d<DELstf.length;d++) {
        var account = DELstf[d];
        var staff_delete = `delete from staff_list where ( account = ? );`;
        await db_write(staff_delete,[account]);
      }
    }
    
    // スタッフリストの中に「全員」を追加する
    var sql = `select * from staff_list where (account = 'all');`;
    var allcheck = await db_select(sql);
    if (allcheck == false) {
      var sql = `insert or replace into staff_list values ('all','','','');`;
      await db_write(sql,[]);
    }

    const sl = await GetDB('staff_list');
    var result = null;

    if (sl != false) {
      
      setStaffs(sl);

      for (var s=0;s<sl.length;s++) {
        if (sl[s].check) {
          result = sl[s].account;
          setStaff_Value(sl[s].account);
        }
      }
      
    } else {
      setStaffs([]);
    }

    return result;

  }

  // お客様情報＋最新のコミュニケーションデータベース登録
  async function Insert_customer_db(customer) {
    
    if (customer) {

      // 最新のお客様情報
      for (var c=0;c<customer.length;c++) {

        var cus = customer[c];

        if (
          cus.html_flg ||
          (cus.communication_title === "入居申込書" &&
            cus.communication_status === "その他")
        ) {
          cus.communication_note = cus.communication_note.replace(
            /<("[^"]*"|'[^']*'|[^'">])*>/g,
            ""
          );
        }

        let status = cus.status;

        if (status == "未対応" && cus.SENPUKI_autofollow) {
          status = "メールモンスター";
        } else if (!status) {
          status = "未対応";
        }

        // 賃貸のみ
        if (cus.category_number != "1") {

          var sql = `insert or replace into customer_mst values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`;

          var data = [
            cus.customer_user_id,
            cus.name,
            cus.kana,
            cus.communication_time,
            cus.communication_title,
            cus.line_note
              ? cus.line_note
              : cus.communication_note,
            cus.mail1,
            cus.mail2,
            cus.mail3,
            cus.line,
            cus.staff_name,
            cus.media,
            cus.article_url,
            cus.reverberation_user_id,
            cus.coming_user_id,
            cus.coming_day1,
            status,
          ];
          
          await db_write(sql,data);
        }

      }

      // 500件超えたら古いものから削除する
      var sql = `select count(*) as count from customer_mst;`;
      var customer = await db_select(sql);
      const cnt = customer[0]["count"];

      if (cnt > 500) {
        var delcus = `DELETE FROM customer_mst WHERE customer_id IN (SELECT customer_id FROM customer_mst ORDER BY time LIMIT (SELECT COUNT(*) - 500 FROM customer_mst));`;
        await db_write(delcus,[]);
      }

    }

  }

  // 定型文データベース登録
  async function Insert_fixed_db(fixed) {

    if (fixed) {

      const fixed_mst = await GetDB('fixed_mst');

      // ローカルDBの定型文情報
      var DBfix = [];
      if (fixed_mst != false) {
        DBstf = fixed_mst.map((f) => {
          return f.fixed_id
        })
      }

      // 最新の定型文情報
      var APIfix = [];

      for (var f=0;f<fixed.length;f++) {
        var fix_ = fixed[f];
        var fixed_insert = `insert or replace into fixed_mst values (?,?,?,?,?);`;
        var fixed_data = [fix_.fixed_id, fix_.category, fix_.title, fix_.mail_title, fix_.note];
        await db_write(fixed_insert,fixed_data);
        APIfix.push(fix_.fixed_id);
      }

      // 削除する定型文情報
      const DELfix = DBfix.filter(fix => !APIfix.includes(fix));
      
      for (var d=0;d<DELfix.length;d++) {
        var fixed_id = DELfix[d];
        var fixed_delete = `delete from fixed_mst where ( fixed_id = ? );`;
        await db_write(fixed_delete,[fixed_id]);
      }
    }

  }

  async function onSubmit() {

    Keyboard.dismiss();
    setLoading(true);
    await searchCustomer(staff_value);
    setLoading(false);
    
  }

  async function searchCustomer(staff,scrollTOP) {

    var customer_list = []; // 格納する顧客リスト
    var staff_check   = ""; // チェックするスタッフ

    // 一旦すべてチェック外す
    var check_null = `update staff_list set "check" = null;`;
    await db_write(check_null,[]);

    if (staff == "all" || staff == null) {

      var sql = `select * from customer_mst where (name||kana)  like '%${name}%' order by time desc;`;
      var customer_mst = await db_select(sql);

      if (customer_mst != false) {
        customer_list = customer_mst;
      }

      if (staff == "all") {
        staff_check = "all";
      }

    } else if (staff_value == "") {

      var sql = `select * from customer_mst where (name||kana)  like '%${name}%' and ((reverberation_user_id = '' or reverberation_user_id is null) and (coming_user_id = '' or coming_user_id is null)) order by time desc;`
      var customer_mst = await db_select(sql);

      if (customer_mst != false) {
        customer_list = customer_mst;
      }

    } else {
      
      var sql = `select * from customer_mst where (name||kana)  like '%${name}%' and ((reverberation_user_id = '${staff}') or (coming_user_id = '${staff}')) order by time desc;`;
      var customer_mst = await db_select(sql);

      if (customer_mst != false) {
        customer_list = customer_mst;
      }

      staff_check = staff;

    }

    setMemos(customer_list);

    if (customer_list.length > 0) {
      if (listRef.current != null && scrollTOP) {
        listRef.current.scrollToIndex({animated:true,index:0,viewPosition:0});
      }
    }

    if (staff_check) {
      var check = `update staff_list set "check" = '1' where ( account = ? );`;
      var data = [staff_check]
      await db_write(check,data);
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
    ]
    
    for (var d=0;d<dbList.length;d++) {
      var table = dbList[d];
      var delete_sql = `delete from ${table};`;
      const del_res = await db_write(delete_sql,[]);
      if (del_res) {
        console.log(`${table} 削除 成功`);
      } else {
        console.log(`${table} 削除 失敗`);
      }
    }
  
  }
    
  function logout() {
    
    Alert.alert(
        "ログアウトしますか？",
        "",
        [
          {
            text: "はい",
            onPress: async() => {
              
              storage.save({
                key: 'GET-DATA',
                data: '',
              });

              await Delete_staff_db();
              
              if(global.sp_token && global.sp_id){
                
                // サーバーに情報送信して、DBから削除
                await fetch(domain+'app/app_system/set_staff_app_token.php', {
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
                
              }
              
              if(global.fc_flg){
                
                let formData = new FormData();
                formData.append('fc_logout',1);
                
                await fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
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
              
              global.sp_token = ''; // スマホトークン
              global.sp_id = '';    // ログインID
              global.fc_flg = '';   // fcフラグ
              
              navigation.reset({
                index: 0,
                routes: [{ name: 'LogIn' }],
              });
            }
          },
          {
            text: "いいえ",
          },
        ]
      );
    
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
                  profile: route.profile,
                  staff: staffs,
                },
              ],
            });
          }}
        >
          <MaterialCommunityIcons
            name="bell"
            color={global.fc_flg?"#fd2c77":"#1d449a"}
            size={35}
          />
          <Text style={styles.menutext}>通知</Text>
          <View style={bell_count?styles.bell2:{display:'none'}}>
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
                  profile: route.profile,
                },
              ],
            });
          }}
        >
          <MaterialCommunityIcons
            name="account"
            color={global.fc_flg?"#fd2c77":"#1d449a"}
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
                  profile: route.profile,
                },
              ],
            });
          }}
        >
          <MaterialCommunityIcons
            name="crown"
            color={global.fc_flg?"#fd2c77":"#1d449a"}
            size={35}
          />
          <Text style={styles.menutext}>売上順位</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.menulist}
          onPress={() => logout()}
        >
          <MaterialCommunityIcons
            name="logout"
            color={global.fc_flg?"#fd2c77":"#1d449a"}
            size={35}
          />
          <Text style={styles.menutext}>ログアウト</Text>
        </TouchableOpacity>
      </View>
    )
  },[bell_count])

  const comList = useMemo(() => {
    if (memos.length == 0) {
      return (
        <View style={{width:'100%',height:'100%',marginTop:150}}>
          <TouchableOpacity style={styles.buttonReload} onPress={()=>onRefresh(true)}>
            <Text style={styles.buttonReloadLabel}>読　込</Text>
          </TouchableOpacity>
        </View>
      )
    } else {
      return (
        <FlatList
          ref={listRef}
          onEndReached={endRefresh}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async()=>{
                await onRefresh(true);
              }}
            />
          }
          initialNumToRender={10}
          data={memos}
          renderItem={({ item }) => {
            if (!item.del_flg) {
              return (
                <TouchableOpacity
                  style={styles.ListItem}
                  onPress={() => {
                    navigation.reset({
                      index: 0,
                      routes: [
                        {
                          name: "TalkScreen",
                          params: route.params,
                          customer: item.customer_id,
                          websocket: route.websocket,
                          profile: route.profile,
                          staff: staffs,
                          cus_name: item.name,
                        },
                      ],
                    });
                  }}
                >
                  <View style={styles.ListInner}>
                    <View style={{ flexDirection: "row" }}>
                      <Text
                        style={
                          item.status == "未対応"
                            ? { color: "red", fontSize: 18 }
                            : { display: "none" }
                        }
                      >
                        ●
                      </Text>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.name
                          ? item.name.length < 10
                            ? item.name
                            : item.name.substring(0, 10) + "..."
                          : ""}
                      </Text>
                    </View>
                    <Text style={styles.date}>
                      {item.time ? item.time.slice(0, -3) : ""}
                    </Text>
                    <Text style={styles.message} numberOfLines={1}>
                      {item.title === "スタンプ"
                        ? "スタンプを送信しました"
                        : !item.note
                        ? item.title
                        : item.note}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }
          }}
          keyExtractor={(item) => `${item.customer_id}`}
        />
      )
    }
  },[memos])

  return (
    <SideMenu
      menu={headerRight}
      isOpen={menu}
      onChange={isOpen => {
        setMenu(isOpen);
      }}
      menuPosition={'right'}
      openMenuOffset={deviceScreen.width * 0.5}
    >
      <View style={styles.container}>
        <Loading isLoading={isLoading} />
        <View style={styles.search}>
          <View style={styles.searchinner}>
            <TextInput
              style={styles.searchInput}
              value={name}
              onChangeText={(text) => {
                setName(text);
              }}
              placeholder="  お客様名検索"
              placeholderTextColor="#b3b3b3"
            />
            <TouchableOpacity style={styles.buttonContainer} onPress={onSubmit}>
              <Text style={styles.buttonLabel}>検　索</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={{zIndex: 500,flexDirection:'row'}}>
          <DropDownPicker
            style={styles.DropDown}
            dropDownContainerStyle={styles.dropDownContainer}
            open={open}
            value={staff_value}
            items={staffList}
            setOpen={setOpen}
            setValue={setStaff_Value}
            placeholder="▼　担当者"
            onSelectItem={(item) => searchCustomer(item.value,true)}
          />
          <Text style={styles.sub_title}>{date}</Text>
        </View>
        <View style={{zIndex: 100,paddingBottom:128}}>
          {comList}
        </View>
      </View>
    </SideMenu>
  );
}

const styles = StyleSheet.create({
  header_img: {
    width: 150,
    height: 45,
  },
  container: {
    flex: 1,
    backgroundColor:'#f1f1f1'
  },
  search: {
    backgroundColor: "#f1f1f1",
  },
  searchinner: {
    margin: 10,
  },
  searchInput: {
    fontSize: 16,
    width: "75%",
    height: 48,
    paddingHorizontal: 10,
    borderColor: "#dddddd",
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  DropDown: {
    width: 200,
    fontSize: 16,
    height: 40,
    marginLeft: 10,
    marginBottom:20
  },
  dropDownContainer: {
    width: 200,
    marginLeft: 10,
  },
  sub_title: {
    fontSize: 13,
    color: "#9B9B9B",
    position: "absolute",
    right: 10,
    bottom:10
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
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingHorizontal: 19,
    alignItems: "center",
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
  },
  ListInner: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    marginBottom: 5,
  },
  date: {
    position: "absolute",
    right: 0,
    bottom: 30,
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
    backgroundColor: "red",
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
    backgroundColor: "red",
    borderRadius: 10,
    paddingLeft: 5,
    paddingRight: 5,
    width:20,
    height:20,
    marginLeft:5
  },
  belltext: {
    color:'#fff',
    fontSize:12
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
