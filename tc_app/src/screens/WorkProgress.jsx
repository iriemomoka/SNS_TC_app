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
  TextInput,
  BackHandler,
  Platform,
  useColorScheme,
  Dimensions,
  FlatList,
  ScrollView,
} from "react-native";
import { Dropdown } from 'react-native-element-dropdown';
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import * as SQLite from "expo-sqlite";
import Moment from 'moment';
import Modal from "react-native-modal";
import SideMenu from 'react-native-side-menu-updated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import WheelPickerExpo from 'react-native-wheel-picker-expo';
import DateTimePicker from '@react-native-community/datetimepicker';
import { CheckBox } from 'react-native-elements';

import Loading from "../components/Loading";
import { GetDB,db_select,db_write,storage } from '../components/Databace';
import Footer from "../components/Footer";

const db = SQLite.openDatabase("db");

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

Notifications.setBadgeCountAsync(0);

const Width = Dimensions.get("window").width;
const Height = Dimensions.get("window").height;
const deviceScreen = Dimensions.get('window');

export default function WorkProgress(props) {

  const { navigation, route } = props;

  const [isLoading, setLoading] = useState(false);
  const [menu, setMenu] = useState(false);
  const [bell_count, setBellcount] = useState(null);
  
  const [shop_options, setShop_options] = useState([]);

  const [staff_value, setStaff_Value] = useState("");
  const [staffs, setStaffs] = useState([]);

  const [date_select, setDate_select] = useState(new Date());

  const [date_y, setDate_y] = useState(new Date().getFullYear());
  const [date_m, setDate_m] = useState(new Date().getMonth());
  const [show, setShow] = useState(false);

  // 0：来店 1：再来 2：物担 3:繰越 4:他業者 5:付帯
  const [form, setForm] = useState(0);

  var staffList = useMemo(()=>{

    var items = [];

    for (var s=0;s<staffs.length;s++) {
      var item = staffs[s];
      if (item.account != "all") {
        var label = item.name_1 + "　" + (item.name_2 ? item.name_2 : "");
        var data = {
          label:label,
          value:item.account,
        }
        items.push(data);
      }
    }
    
    return items;

  },[staffs]);

  var staffList2 = useMemo(()=>{

    var items = [];

    items.push({ label: "", value: "" });

    for (var s=0;s<staffs.length;s++) {
      var item = staffs[s];
      if (item.account != "all") {
        var label = item.name_1 + "　" + (item.name_2 ? item.name_2 : "");
        var data = {
          label:label,
          value:item.account,
        }
        items.push(data);
      }
    }
    
    return items;

  },[staffs]);

  var yearList = useMemo(()=>{
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = -1; i <= 1; i++) {
      const year = currentYear + i;
      years.push({ label: `${year}年`, value: year });
    }
    return years;
  },[]);
  
  var monthList = useMemo(()=>{
    const months = [];
    for (let i = 1; i <= 12; i++) {
      months.push({ label: `${i}月`, value: i-1 });
    }
    return months;
  },[]);

  /* --- 業務進捗表データ --- */
  const [scopeData_C, setScopeData_C] = useState(null); // 業務進捗データ(顧客情報)を保持する

  const [modal, setModal] = useState(false);
  const [customer_id, setCustomer_id] = useState("");
  const [name, setName] = useState("");
  const [change_flg, setChange_flg] = useState(false);
  const [details, setDetails] = useState({
    "ad_date": "",
    "ad_flg": "",
    "ad_rate": "",
    "aircon_agreement_flg": "",
    "aircon_description_flg": "",
    "aircon_fee": "",
    "aircon_payment": "",
    "aircon_sales": "",
    "aircon_sales_agreement_flg": "",
    "aircon_sales_description_flg": "",
    "aircon_sales_payment": "",
    "application_date": "",
    "application_flg": "",
    "aqua": "",
    "aqua_agreement_flg": "",
    "aqua_description_flg": "",
    "aqua_payment": "",
    "article_manager_fee": "",
    "article_manager_staff": "",
    "article_name": "",
    "article_type": "",
    "brokerage": "",
    "fitech": "",
    "fitech_agreement_flg": "",
    "fitech_description_flg": "",
    "fitech_payment": "",
    "focus": "",
    "focus_agreement_flg": "",
    "focus_description_flg": "",
    "focus_payment": "",
    "garage_monthly_cost": "",
    "grasupo": "",
    "grasupo_agreement_flg": "",
    "grasupo_description_flg": "",
    "grasupo_payment": "",
    "guarantee": "",
    "guarantee_agreement_flg": "",
    "guarantee_description_flg": "",
    "guarantee_payment": "",
    "important_date": "",
    "important_flg": "",
    "jcom": "",
    "jcom_agreement_flg": "",
    "jcom_description_flg": "",
    "jcom_payment": "",
    "key_exchange": "",
    "key_exchange_agreement_flg": "",
    "key_exchange_description_flg": "",
    "key_exchange_payment": "",
    "key_pass_date": "",
    "key_pass_flg": "",
    "life": "",
    "life_agreement_flg": "",
    "life_description_flg": "",
    "life_payment": "",
    "mirable": "",
    "mirable_agreement_flg": "",
    "mirable_description_flg": "",
    "mirable_payment": "",
    "move_in_date": "",
    "move_in_flg": "",
    "moving": "",
    "moving_agreement_flg": "",
    "moving_description_flg": "",
    "moving_payment": "",
    "net": "",
    "net_agreement_flg": "",
    "net_description_flg": "",
    "net_payment": "",
    "nhk": "",
    "nhk_agreement_flg": "",
    "nhk_description_flg": "",
    "nhk_payment": "",
    "pesticide": "",
    "pesticide_agreement_flg": "",
    "pesticide_description_flg": "",
    "pesticide_payment": "",
    "prepayment_date": "",
    "received_settlement_date": "",
    "received_settlement_flg": "",
    "referral_fee": "",
    "room_check_date": "",
    "room_check_flg": "",
    "room_no": "",
  });

  const type_list = {
    "ad_date": "contract",
    "ad_flg": "contract",
    "ad_rate": "detail",
    "aircon_agreement_flg": "detail",
    "aircon_description_flg": "detail",
    "aircon_fee": "detail",
    "aircon_payment": "detail",
    "aircon_sales": "detail",
    "aircon_sales_agreement_flg": "detail",
    "aircon_sales_description_flg": "detail",
    "aircon_sales_payment": "detail",
    "application_date": "contract",
    "application_flg": "contract",
    "aqua": "detail",
    "aqua_agreement_flg": "detail",
    "aqua_description_flg": "detail",
    "aqua_payment": "detail",
    "article_manager_fee": "detail",
    "article_manager_staff": "detail",
    "article_name": "contract",
    "article_type": "detail",
    "brokerage": "detail",
    "fitech": "detail",
    "fitech_agreement_flg": "detail",
    "fitech_description_flg": "detail",
    "fitech_payment": "detail",
    "focus": "detail",
    "focus_agreement_flg": "detail",
    "focus_description_flg": "detail",
    "focus_payment": "detail",
    "garage_monthly_cost": "detail",
    "grasupo": "detail",
    "grasupo_agreement_flg": "detail",
    "grasupo_description_flg": "detail",
    "grasupo_payment": "detail",
    "guarantee": "detail",
    "guarantee_agreement_flg": "detail",
    "guarantee_description_flg": "detail",
    "guarantee_payment": "detail",
    "important_date": "contract",
    "important_time": "contract",
    "important_flg": "contract",
    "jcom": "detail",
    "jcom_agreement_flg": "detail",
    "jcom_description_flg": "detail",
    "jcom_payment": "detail",
    "key_exchange": "detail",
    "key_exchange_agreement_flg": "detail",
    "key_exchange_description_flg": "detail",
    "key_exchange_payment": "detail",
    "key_pass_date": "contract",
    "key_pass_time": "contract",
    "key_pass_flg": "contract",
    "life": "detail",
    "life_agreement_flg": "detail",
    "life_description_flg": "detail",
    "life_payment": "detail",
    "mirable": "detail",
    "mirable_agreement_flg": "detail",
    "mirable_description_flg": "detail",
    "mirable_payment": "detail",
    "move_in_date": "contract",
    "move_in_flg": "contract",
    "moving": "detail",
    "moving_agreement_flg": "detail",
    "moving_description_flg": "detail",
    "moving_payment": "detail",
    "net": "detail",
    "net_agreement_flg": "detail",
    "net_description_flg": "detail",
    "net_payment": "detail",
    "nhk": "detail",
    "nhk_agreement_flg": "detail",
    "nhk_description_flg": "detail",
    "nhk_payment": "detail",
    "pesticide": "detail",
    "pesticide_agreement_flg": "detail",
    "pesticide_description_flg": "detail",
    "pesticide_payment": "detail",
    "prepayment_date": "detail",
    "received_settlement_date": "contract",
    "received_settlement_flg": "contract",
    "referral_fee": "detail",
    "room_check_date": "contract",
    "room_check_flg": "contract",
    "room_no": "detail",
  }

  const [mode, setMode] = useState("date");
  const [show_ymd, setShow_ymd] = useState(false);
  const [mode_date, setMode_date] = useState(0);

  const article_type_list = [
    { label: "選択してください", value: "" },
    { label: "専任", value: "1" },
    { label: "業物", value: "2" },
    { label: "直物", value: "3" },
    { label: "AZ", value: "4" },
    { label: "UB", value: "5" },
    { label: "CJS", value: "6" },
  ]
  
  const [article_manager_count, setArticle_manager_count] = useState(0);

  const hutai_list = [
    {label: "消毒", value:"pesticide"},
    {label: "エアコン清掃", value:"aircon"},
    {label: "エアコン販売", value:"aircon_sales"},
    {label: "賃貸保証", value:"guarantee"},
    {label: "鍵交換", value:"key_exchange"},
    {label: "グラサポ", value:"grasupo"},
    {label: "アクア", value:"aqua"},
    {label: "引越", value:"moving"},
    {label: "J:COM", value:"jcom"},
    {label: "ネット", value:"net"},
    {label: "フォーカス", value:"focus"},
    {label: "管理料", value:"life"},
    {label: "リフォーム", value:"nhk"},
    {label: "ファイテック", value:"fitech"},
    {label: "ミラブル", value:"mirable"},
  ];

  const hutai_flg_list = [
    { label: "0件", value: "" },
    { label: "1件", value: "1" },
    { label: "2件", value: "2" },
    { label: "3件", value: "3" },
    { label: "4件", value: "4" },
    { label: "5件", value: "5" },
    { label: "6件", value: "6" },
    { label: "7件", value: "7" },
    { label: "8件", value: "8" },
    { label: "9件", value: "9" },
  ];

  useLayoutEffect(() => {

    navigation.setOptions({
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#6C9BCF", height: 110 }
        : { backgroundColor: "#FF8F8F", height: 110 },
      headerTitle: () => (
        <Text style={styles.headertitle}>業務進捗表</Text>
      ),
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
                  name: route.previous!="TalkScreen"&&route.previous!="SupportChat"?route.previous:"CommunicationHistory",
                  params: route.params,
                  websocket:route.websocket,
                  websocket2: route.websocket2,
                  profile:route.profile,
                  previous:'WorkProgress'
                }],
              });
            }
          }}
          style={{paddingHorizontal:20,paddingVertical:10}}
        />
      ),
      headerRight: () => (
        <View style={{marginRight:15}}>
          <View style={bell_count?[styles.bell,{backgroundColor:!global.fc_flg?"red":"#574141"}]:{display:'none'}}>
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
    
    Display(true);

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
                previous:'WorkProgress'
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
                  previous:'Schedule'
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

  async function Display() {

    const staff_mst = await GetDB('staff_mst');
    if (staff_mst != false) setShop_options(staff_mst[0].shop_option_list.split(","));

    await Insert_staff_list_db();

    // 検索条件
    storage.load({
      key : 'WORKPROGRESS-SEARCH'
    })
    .then(data => {
      if (data) {
        setDate_select(new Date(data.date));
        setStaff_Value(data.staff_value);
        onRefresh(new Date(data.date));
      }
    })
    .catch(err => {
      storage.save({
        key: 'WORKPROGRESS-SEARCH',
        data: {
          date: date_select,
          staff_value:route.params.account,
        }
      });
      setStaff_Value(route.params.account);
      onRefresh();
    })

    await getBELL();

  }
  
  const onRefresh = useCallback(async(date = date_select) => {

    setLoading(true);

    const startTime = Date.now(); // 開始時間

    const work_progress = await getWorkProgress(date);

    const endTime = Date.now(); // 終了時間
    const time = (endTime - startTime)/1000;
    console.log('onRefreshWorkProgress：'+time + '秒');

    if (work_progress) {
      setScopeData_C(work_progress.customer);
    }

    setLoading(false);

  }, []);

  const getWorkProgress = useCallback((date) => {

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
          act: "work_progress",
          fc_flg: global.fc_flg,
          month: Moment(date).format("YYYY-MM")
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

  }, []);

  const getDetailsData = useCallback((customer_id) => {

    let formData = new FormData();
    formData.append('customer_id',customer_id);
    formData.append('act','getDetailsData');
    formData.append('app_flg',1);
    formData.append('fc_flg',global.fc_flg);

    return new Promise((resolve, reject)=>{
      fetch(domain + "php/ajax/work_progress.php",
      {
        method: 'POST',
        body: formData,
        header: {
          'content-type': 'multipart/form-data',
        },
      })
      .then((response) => response.json())
      .then((json) => {
        var data = json;
        for (let key in data) {
          if (data[key] == "0" || data[key] == null ||  data[key] == "0000-00-00 00:00:00" ||  data[key] == "0000-00-00") {
            data[key] = "";
          }

          if (key.indexOf("article_manager_") > -1) {
            if (data[key] != "") {
              data[key] = data[key].split('<@@@>');
              setArticle_manager_count(data[key].length-1);
            } else {
              data[key] = ["","",""];
            }

            if (data[key].length == 1) {
              data[key].push("");
            }

            if (data[key].length == 2) {
              data[key].push("");
            }
          }
        }
        delete data.user_id;
        setDetails(data);
        setModal(true);
      })
      .catch((error) => {
        console.log(error);
        resolve(false);
      });
    })

  }, []);

  // スタッフリスト取得
  async function Insert_staff_list_db() {

    const sl = await GetDB('staff_list');

    if (sl != false) {
      setStaffs(sl);
    } else {
      setStaffs([]);
    }

  }

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
      "schedule_mst",
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

    await storage.remove({key:'SCHEDULE-SEARCH'});
    await storage.remove({key:'WORKPROGRESS-SEARCH'});
    
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
                  previous:'WorkProgress',
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
                  previous:'WorkProgress',
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
                  previous:'WorkProgress',
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
                  previous:'WorkProgress',
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
        {!global.fc_flg&&(
          <TouchableOpacity
            style={styles.menulist}
            onPress={() => {
              navigation.reset({
                index: 0,
                routes: [{
                  name: 'SupportChat' ,
                  params: route.params,
                  websocket:route.websocket,
                  websocket2: route.websocket2,
                  profile:route.profile,
                  previous:'WorkProgress',
                }],
              });
            }}
          >
            <MaterialCommunityIcons
              name="face-agent"
              color={global.fc_flg?"#FF8F8F":"#6C9BCF"}
              size={35}
            />
            <Text style={[styles.menutext,{fontSize:16}]}>サポートチャット</Text>
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

  const ins_staffTable = useMemo(() => {

    var result = {
      coming: [],     // 来店状況
      recoming: [],   // 再来
      article: [],    // 物担
      over: [],       // 繰越
      other: [],      // 他業者
      incidental: [], // 付帯
    };

    const key = staff_value;

    if (!scopeData_C || !staff_value) return [];
    if (Object.keys(scopeData_C).indexOf(key) == -1) return [];

		var c_data;
    Object.keys(scopeData_C[key]).forEach(function (i) {

      // 物件獲得と看板はスルー
      if(i == "mediation") return;
      if(i == "signboard") return;

      var type = i;
      c_data = scopeData_C[key][type];

      if (c_data) {
        for (var c in c_data) {
          const v = c_data[c];

          var name = v["name"]; // 名前
          if(v["memo"]){
            name += v["memo"];
          }
          
          var details_btn = ["coming","recoming","article","over"];
          var link_flg = false;
          if(details_btn.indexOf(type) > -1){
            link_flg = true;
          }

          var statuses = ""; // 状況
          if(v["important_flg"] != ""){
            statuses = "決定";
          }else{
            var subscType = v["subscription"];
            switch(subscType){
              case "申込":
              case "再来予定":
              case "追客中":
              case "他決":
                statuses = v["subscription"];
                break;
              case "連絡とれず":
                statuses = "追客不可";
                break;
              case "引越辞める":
              case "その他(追客終了)":
                statuses = "キャンセル";
                break;
              case "その他(追客中)":
              default:
                statuses = "追客中";
                break;
            }
          }
          
          // 【他業者】の「状況」は空にする
          if(type == "other" || type == "incidental"){
            statuses = "";
          }
          
          const data = {
            ...v,
            name: name,
            link_flg: link_flg,
            statuses: statuses,
          }

          result[type].push(data);

        }
      }

    });

    var type = {
      "0": "coming",
      "1": "recoming",
      "2": "article",
      "3": "over",
      "4": "other",
      "5": "incidental",
    };

    return result[type[form]];

  },[scopeData_C,staff_value,form]);

  // 日付クリア
  function ClearDateTime(flg) {
    if (flg == 0) {
      setDetails(state => ({ ...state, application_date: "" }));
    } else if (flg == 1) {
      setDetails(state => ({ ...state, important_date: "" }));
    } else if (flg == 2) {
      setDetails(state => ({ ...state, received_settlement_date: "" }));
    } else if (flg == 3) {
      setDetails(state => ({ ...state, ad_date: "" }));
    } else if (flg == 4) {
      setDetails(state => ({ ...state, prepayment_date: "" }));
    } else if (flg == 5) {
      setDetails(state => ({ ...state, key_pass_date: "" }));
    } else if (flg == 6) {
      setDetails(state => ({ ...state, move_in_date: "" }));
    } else if (flg == 7) {
      setDetails(state => ({ ...state, room_check_date: "" }));
    } else if (flg > 7) {
      setDetails(state => ({ ...state, [hutai_list[flg-8]["value"]+"_payment"]: "" }));
    }
  }

  // 日付ピッカー
  function ChangeDate(selectedDate,flg) {

    var day;

    if (flg == 0) {
      day = details.application_date;
    } else if (flg == 1) {
      day = details.important_date;
    } else if (flg == 2) {
      day = details.received_settlement_date;
    } else if (flg == 3) {
      day = details.ad_date;
    } else if (flg == 4) {
      day = details.prepayment_date;
    } else if (flg == 5) {
      day = details.key_pass_date;
    } else if (flg == 6) {
      day = details.move_in_date;
    } else if (flg == 7) {
      day = details.room_check_date;
    } else if (flg > 7) {
      day = details[hutai_list[flg-8]["value"]+"_payment"];
    }

    const currentDate = selectedDate || day;
    
    if (flg == 0) {
      setDetails(state => ({ ...state, application_date: currentDate }));
    } else if (flg == 1) {
      setDetails(state => ({ ...state, important_date: currentDate }));
    } else if (flg == 2) {
      setDetails(state => ({ ...state, received_settlement_date: currentDate }));
    } else if (flg == 3) {
      setDetails(state => ({ ...state, ad_date: currentDate }));
    } else if (flg == 4) {
      setDetails(state => ({ ...state, prepayment_date: currentDate }));
    } else if (flg == 5) {
      setDetails(state => ({ ...state, key_pass_date: currentDate }));
    } else if (flg == 6) {
      setDetails(state => ({ ...state, move_in_date: currentDate }));
    } else if (flg == 7) {
      setDetails(state => ({ ...state, room_check_date: currentDate }));
    } else if (flg > 7) {
      setDetails(state => ({ ...state, [hutai_list[flg-8]["value"]+"_payment"]: currentDate }));
    }

    setChange_flg(true);

  }

  async function onSubmit() {

    const err = await wp_error_chk();

    if (err != "") {
      Alert.alert("エラー",err);
      return;
    }

    var result = details;

    // 日付チェック
    var date_data = [
      "application_date",
      "important_date",
      "received_settlement_date",
      "ad_date",
      "prepayment_date",
      "key_pass_date",
      "move_in_date",
      "room_check_date",
      "pesticide_payment",
      "aircon_payment",
      "aircon_sales_payment",
      "guarantee_payment",
      "key_exchange_payment",
      "grasupo_payment",
      "aqua_payment",
      "moving_payment",
      "jcom_payment",
      "net_payment",
      "focus_payment",
      "life_payment",
      "nhk_payment",
      "fitech_payment",
      "mirable_payment"
    ];

    var return_data = {};
    var important_date = details["important_date"];
    var key_pass_date  = details["key_pass_date"];

    for (var key in type_list) {

      const type = type_list[key];

			if(!return_data[type]){
				return_data[type] = {};
			}

      if (key.indexOf("article_manager_") > -1) {
        const nerArr = result[key].filter(v => v !== '');
        result[key] = nerArr.join('<@@@>')
      }

      if (result[key] == true || result[key] == false) {
        result[key] = result[key]?"1":"";
      }

      if (key == "important_time") {
        if (important_date) {
          result[key] = Moment(important_date).format("HH:mm");
        }
      } else if (key == "key_pass_time") {
        if (key_pass_date) {
          result[key] = Moment(key_pass_date).format("HH:mm");
        }
      }

      if (date_data.indexOf(key) > -1) {
        if (result[key]) {
          result[key] = Moment(result[key]).format("YYYY-MM-DD");
        }
      }

      return_data[type][key] = result[key];

    }

    let formData = new FormData();
    formData.append('act','wp_save');
    formData.append('customer_id',customer_id);
    formData.append('user_id',route.params.account);
    formData.append('data',JSON.stringify(return_data));
    formData.append('app_flg',1);
    formData.append('fc_flg',global.fc_flg);

    const save = () => {
      return new Promise((resolve, reject)=>{
        fetch(domain + "php/ajax/customer_edit_work.php",
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
    }

    if (!await save()) {
      Alert.alert("エラー","保存に失敗しました");
    }

    setModal(false);
    setArticle_manager_count(0);
    setChange_flg(false);

  }

  function wp_error_chk() {

    var err = "";

    // ----- 物担価格 -----
    for (var am in details.article_manager_fee) {
      if (details.article_manager_fee[am] && !details.article_manager_staff[am]) {
        var err_txt = "\n ・物担金額を入力している場合はスタッフを選択してください";
        if(err.indexOf(err_txt) == -1){
          err += err_txt;
        }
      }
      
      if (!details.article_manager_fee[am] && details.article_manager_staff[am]) {
        var err_txt = "\n ・スタッフを選択している場合は物担金額を入力してください";
        if(err.indexOf(err_txt) == -1){
          err += err_txt;
        }
      }
    }

    return err;

  }
  
  async function close_chk() {

    if (change_flg) {
      
      const AsyncAlert = async () => new Promise((resolve) => {
        Alert.alert(
          '確認',
          `変更された内容が保存されていませんが閉じますか？`,
          [
            {
              text: 'はい',
              onPress: () => {
                resolve(true);
              },
            },
            {
              text: "いいえ",
              onPress: async() => {
                resolve(false);
              },
              style: "cancel"
            },
          ],
        );
      });

      if (!await AsyncAlert()) return;

    }

    setModal(false);
    setArticle_manager_count(0);
    setChange_flg(false);

  }

  const chk = !global.fc_flg?"#81aee6":"#e6c4f5";
  const spc = !global.fc_flg?"#dce6fc":"#ffe8f0";
  
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
      <Loading isLoading={isLoading} />
      <ScrollView style={styles.container}>
        <View style={{flexDirection:'row',marginTop:10}}>
          <Text style={[styles.searchLabel,{width:"60%"}]}>スタッフ</Text>
          <Text style={[styles.searchLabel,{width:"38%",marginLeft:"2%"}]}>年月選択</Text>
        </View>
        <View style={{flexDirection:'row',marginTop:5,marginBottom:10}}>
          <Dropdown
            style={[styles.DropDown,{width:"60%"}]}
            containerStyle={{width:"60%"}}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={staff_value}
            data={staffList}
            setValue={setStaff_Value}
            placeholder="▼　担当者"
            labelField="label"
            valueField="value"
            onChange={(item) => {
              storage.save({
                key: 'WORKPROGRESS-SEARCH',
                data: {
                  date: date_select,
                  staff_value:item.value,
                }
              });
              setStaff_Value(item.value)
            }}
          />
          <TouchableOpacity style={styles.Datebtn} onPress={()=>setShow(true)}>
            <Text style={styles.Datebtn_text}>
              {Moment(date_select).format("YYYY年MM月")}
              </Text>
          </TouchableOpacity>
          <Modal
            isVisible={show}
            swipeDirection={null}
            backdropOpacity={0.5}
            animationInTiming={300}
            animationOutTiming={500}
            animationIn={'slideInDown'}
            animationOut={'slideOutUp'}
            propagateSwipe={true}
            style={{alignItems: 'center'}}
            onBackdropPress={()=>{
              storage.save({
                key: 'WORKPROGRESS-SEARCH',
                data: {
                  date: new Date(date_y,date_m,date_select.getDate()),
                  staff_value:staff_value,
                }
              });

              setShow(false);
              setDate_select(new Date(date_y,date_m,date_select.getDate()));
              onRefresh(new Date(date_y,date_m,date_select.getDate()))
            }}
          >
            <View style={styles.date_mdl}>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top:8,
                  right:10,
                  zIndex:999
                }}
                onPress={()=>{
                  storage.save({
                    key: 'WORKPROGRESS-SEARCH',
                    data: {
                      date: new Date(date_y,date_m,date_select.getDate()),
                      staff_value:staff_value,
                    }
                  });

                  setShow(false);
                  setDate_select(new Date(date_y,date_m,date_select.getDate()));
                  onRefresh(new Date(date_y,date_m,date_select.getDate()))
                }}
              >
                <Feather name='x-circle' color='#ccc' size={35} />
              </TouchableOpacity>
              <View style={{flexDirection:'row'}}>
                <WheelPickerExpo
                  width={80}
                  items={yearList}
                  onChange={ ({ item }) => {setDate_y(item.value)}}
                  initialSelectedIndex={1}
                />
                <WheelPickerExpo
                  width={80}
                  items={monthList}
                  onChange={ ({ item }) => {setDate_m(item.value)}}
                  initialSelectedIndex={date_m}
                />
              </View>
            </View>
          </Modal>
        </View>
        <View style={{flexDirection:'row',width:'100%'}}>
          <TouchableOpacity
            onPress={()=>{setForm(0)}}
            style={form==0?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>来店</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(1)}}
            style={form==1?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>再来</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(2)}}
            style={form==2?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>物担</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(3)}}
            style={form==3?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>繰越</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(4)}}
            style={[form==4?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab,{width:"17%"}]}
          >
            <Text style={styles.tab_txt}>他業者</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(5)}}
            style={form==5?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>付帯</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.table}>
          <ScrollView horizontal>
            <View>
              <View style={styles.tr}>
                <View style={[styles.th,{borderLeftWidth:1,width:50}]}>
                  <Text style={styles.th_text}>来店日</Text>
                </View>
                <View style={[styles.th,{width:250}]}>
                  <Text style={styles.th_text}>顧客名</Text>
                </View>
                <View style={[styles.th,{width:80}]}>
                  <Text style={styles.th_text}>状況</Text>
                </View>
                <View style={[styles.th,{width:250}]}>
                  <Text style={styles.th_text}>物件名</Text>
                </View>
              </View>
              {ins_staffTable.map((item,index)=> {
                return (
                  <View style={styles.tr} key={index}>
                    <View style={[styles.td,{borderLeftWidth:1,width:50,alignItems:'center'}]}>
                      <Text>{item.coming_day}</Text>
                    </View>
                    <View style={[styles.td,{width:250}]}>
                      <TouchableOpacity
                        onPress={()=>{
                          setCustomer_id(item.customer_id);
                          setName(item.name);
                          getDetailsData(item.customer_id);
                        }}
                      >
                        <Text style={[styles.td_text,{color:'blue',textDecorationLine: 'underline',width:200}]} numberOfLines={1}>{item.name}</Text>
                      </TouchableOpacity>
                      {item.link_flg&&(
                        <TouchableOpacity
                          style={styles.talkBtn}
                          onPress={()=>{
                            navigation.reset({
                              index: 0,
                              routes: [
                                {
                                  name: "TalkScreen",
                                  params: route.params,
                                  customer: item.customer_id,
                                  websocket: route.websocket,
                                  websocket2: route.websocket2,
                                  profile: route.profile,
                                  cus_name: item.name,
                                  previous:'WorkProgress'
                                },
                              ],
                            });
                          }}
                        >
                          <Text style={styles.talkBtn_txt}>詳 細</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <View style={[styles.td,{width:80,alignItems:'center'}]}>
                      <Text style={styles.td_text}>{item.statuses}</Text>
                    </View>
                    <View style={[styles.td,{width:250}]}>
                      <Text style={styles.td_text}>{item.article_name}</Text>
                    </View>
                  </View>
                )
              })}
              <Modal
                isVisible={modal}
                swipeDirection={null}
                backdropOpacity={0.5}
                animationInTiming={300}
                animationOutTiming={500}
                animationIn={'slideInDown'}
                animationOut={'slideOutUp'}
                propagateSwipe={true}
                style={{alignItems: 'center'}}
                onBackdropPress={()=>close_chk()}
              >
                <View style={styles.modal}>
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top:8,
                    right:10,
                    zIndex:999
                  }}
                  onPress={()=>close_chk()}
                >
                  <Feather name='x-circle' color='#ccc' size={35} />
                </TouchableOpacity>
                <Text style={styles.modal_title}>業務進捗表【{name}】</Text>
                <ScrollView>
                  <Text style={styles.modal_title2}>基本情報</Text>
                  <View style={styles.input}>
                    <Text style={styles.label}>物件名</Text>
                    <TextInput
                      onChangeText={(text) => {
                        setChange_flg(true);
                        setDetails(state => ({ ...state, article_name: text }));
                      }}
                      value={details.article_name}
                      style={styles.inputInner}
                    />
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>号室</Text>
                    <TextInput
                      onChangeText={(text) => {
                        setChange_flg(true);
                        setDetails(state => ({ ...state, room_no: text }));
                      }}
                      value={details.room_no}
                      style={styles.inputInner}
                    />
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>種別</Text>
                    <Dropdown
                      style={[styles.inputInner,{width:"100%"}]}
                      placeholderStyle={{fontSize:14}}
                      selectedTextStyle={{fontSize:14}}
                      itemTextStyle={{fontSize:14}}
                      renderItem={(item)=>(
                        <View style={styles.dropItem}>
                          <Text style={styles.dropItemText}>{item.label}</Text>
                        </View>
                      )}
                      value={details.article_type}
                      data={article_type_list}
                      labelField="label"
                      valueField="value"
                      onChange={(item) => {
                        setChange_flg(true);
                        setDetails(state => ({ ...state, article_type: item.value }));
                      }}
                    />
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>申込書受理 送付</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TouchableOpacity
                        style={[styles.inputInner,{flexDirection:'row',width:"50%"}]}
                        onPress={()=>{
                          setShow_ymd(true);
                          setMode("date");
                          setMode_date(0);
                        }}
                      >
                        <Text style={{alignSelf:'center'}}>{details.application_date?Moment(details.application_date).format("YYYY-MM-DD"):""}</Text>
                        <TouchableOpacity
                          style={{alignSelf:'center',marginLeft:'auto'}}
                          onPress={()=>ClearDateTime(0)}
                        >
                          <Feather name='x-circle' color='#ccc' size={25} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      <CheckBox
                        checked={details.application_flg}
                        onPress={() => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, application_flg: !details.application_flg }));
                        }}
                        containerStyle={styles.checkbox}
                        checkedColor={chk}
                        size={28}
                        iconType="material-community"
                        checkedIcon="checkbox-marked"
                        uncheckedIcon="checkbox-blank-outline"
                        title="完了"
                      />
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>重要事項説明</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TouchableOpacity
                        style={[styles.inputInner,{flexDirection:'row',width:"40%"}]}
                        onPress={()=>{
                          setShow_ymd(true);
                          setMode("date");
                          setMode_date(1);
                        }}
                      >
                        <Text style={{alignSelf:'center'}}>{details.important_date?Moment(details.important_date).format("YYYY-MM-DD"):""}</Text>
                        <TouchableOpacity
                          style={{alignSelf:'center',marginLeft:'auto'}}
                          onPress={()=>ClearDateTime(1)}
                        >
                          <Feather name='x-circle' color='#ccc' size={25} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.inputInner,{flexDirection:'row',width:"30%",marginLeft:10}]}
                        onPress={()=>{
                          setShow_ymd(true);
                          setMode("time");
                          setMode_date(1);
                        }}
                      >
                        <Text style={{alignSelf:'center'}}>{details.important_date?Moment(details.important_date).format("HH:mm"):""}</Text>
                        <TouchableOpacity
                          style={{alignSelf:'center',marginLeft:'auto'}}
                          onPress={()=>ClearDateTime(1)}
                        >
                          <Feather name='x-circle' color='#ccc' size={25} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      <CheckBox
                        checked={details.important_flg}
                        onPress={() => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, important_flg: !details.important_flg }));
                        }}
                        containerStyle={styles.checkbox}
                        checkedColor={chk}
                        size={28}
                        iconType="material-community"
                        checkedIcon="checkbox-marked"
                        uncheckedIcon="checkbox-blank-outline"
                        title="完了"
                      />
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>決済日</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TouchableOpacity
                        style={[styles.inputInner,{flexDirection:'row',width:"50%"}]}
                        onPress={()=>{
                          setShow_ymd(true);
                          setMode("date");
                          setMode_date(2);
                        }}
                      >
                        <Text style={{alignSelf:'center'}}>{details.received_settlement_date?Moment(details.received_settlement_date).format("YYYY-MM-DD"):""}</Text>
                        <TouchableOpacity
                          style={{alignSelf:'center',marginLeft:'auto'}}
                          onPress={()=>ClearDateTime(2)}
                        >
                          <Feather name='x-circle' color='#ccc' size={25} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      <CheckBox
                        checked={details.received_settlement_flg}
                        onPress={() => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, received_settlement_flg: !details.received_settlement_flg }));
                        }}
                        containerStyle={styles.checkbox}
                        checkedColor={chk}
                        size={28}
                        iconType="material-community"
                        checkedIcon="checkbox-marked"
                        uncheckedIcon="checkbox-blank-outline"
                        title="入金済み"
                      />
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>仲介手数料</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TextInput
                        onChangeText={(text) => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, brokerage: text }));
                        }}
                        value={details.brokerage}
                        style={[styles.inputInner,{width:"90%"}]}
                        keyboardType={Platform.OS === 'android'?"numeric":"numbers-and-punctuation"}
                      />
                      <Text style={styles.yen}>円</Text>
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>ガレージ売上</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TextInput
                        onChangeText={(text) => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, garage_monthly_cost: text }));
                        }}
                        value={details.garage_monthly_cost}
                        style={[styles.inputInner,{width:"90%"}]}
                        keyboardType={Platform.OS === 'android'?"numeric":"numbers-and-punctuation"}
                      />
                      <Text style={styles.yen}>円</Text>
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>
                      紹介料
                      <Text style={{fontSize:10,color:'#bfbfbf'}}>　※支払う場合はマイナス入力</Text>
                    </Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TextInput
                        onChangeText={(text) => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, referral_fee: text }));
                        }}
                        value={details.referral_fee}
                        style={[styles.inputInner,{width:"90%"}]}
                        keyboardType={Platform.OS === 'android'?"numeric":"numbers-and-punctuation"}
                      />
                      <Text style={styles.yen}>円</Text>
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>
                      物担金額
                      <Text style={{fontSize:10,color:'#bfbfbf'}}>　※支払う場合はマイナス入力</Text>
                    </Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TextInput
                        onChangeText={(text) => {
                          setChange_flg(true);
                          var arr = details.article_manager_fee;
                          arr[0] = text;
                          setDetails(state => ({ ...state, article_manager_fee: arr }));
                        }}
                        value={details.article_manager_fee[0]}
                        style={[styles.inputInner,{width:"25%"}]}
                        keyboardType={Platform.OS === 'android'?"numeric":"numbers-and-punctuation"}
                      />
                      <Text style={styles.yen}>円</Text>
                      <Dropdown
                        style={[styles.inputInner,{width:"45%",marginLeft:10}]}
                        containerStyle={{width:"45%"}}
                        placeholderStyle={{fontSize:14}}
                        selectedTextStyle={{fontSize:14}}
                        itemTextStyle={{fontSize:14}}
                        renderItem={(item)=>(
                          <View style={styles.dropItem}>
                            <Text style={styles.dropItemText}>{item.label}</Text>
                          </View>
                        )}
                        value={details.article_manager_staff[0]}
                        data={staffList2}
                        labelField="label"
                        valueField="value"
                        onChange={(item) => {
                          setChange_flg(true);
                          var arr = details.article_manager_staff;
                          arr[0] = item.value;
                          setDetails(state => ({ ...state, article_manager_staff: arr }));
                        }}
                      />
                      {article_manager_count<2&&(
                        <TouchableOpacity
                        style={styles.add_btn}
                        onPress={()=>{
                            if (article_manager_count < 2) {
                              setArticle_manager_count(article_manager_count+1);
                            }
                        }}
                        >
                          <Text style={styles.add_btn_txt}>追 加</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    {article_manager_count>0||details.article_manager_fee[1]?(
                      <View style={{flexDirection:'row',alignItems:'center',marginTop:10}}>
                        <TextInput
                          onChangeText={(text) => {
                            setChange_flg(true);
                            var arr = details.article_manager_fee;
                            arr[1] = text;
                            setDetails(state => ({ ...state, article_manager_fee: arr }));
                          }}
                          value={details.article_manager_fee[1]}
                          style={[styles.inputInner,{width:"25%"}]}
                          keyboardType={Platform.OS === 'android'?"numeric":"numbers-and-punctuation"}
                        />
                        <Text style={styles.yen}>円</Text>
                        <Dropdown
                          style={[styles.inputInner,{width:"45%",marginLeft:10}]}
                          containerStyle={{width:"45%"}}
                          placeholderStyle={{fontSize:14}}
                          selectedTextStyle={{fontSize:14}}
                          itemTextStyle={{fontSize:14}}
                          renderItem={(item)=>(
                            <View style={styles.dropItem}>
                              <Text style={styles.dropItemText}>{item.label}</Text>
                            </View>
                          )}
                          value={details.article_manager_staff[1]}
                          data={staffList2}
                          labelField="label"
                          valueField="value"
                          onChange={(item) => {
                            setChange_flg(true);
                            var arr = details.article_manager_staff;
                            arr[1] = item.value;
                            setDetails(state => ({ ...state, article_manager_staff: arr }));
                          }}
                        />
                      </View>
                    ):(<></>)}
                    {article_manager_count>1||details.article_manager_fee[2]?(
                      <View style={{flexDirection:'row',alignItems:'center',marginTop:10}}>
                        <TextInput
                          onChangeText={(text) => {
                            setChange_flg(true);
                            var arr = details.article_manager_fee;
                            arr[2] = text;
                            setDetails(state => ({ ...state, article_manager_fee: arr }));
                          }}
                          value={details.article_manager_fee[2]}
                          style={[styles.inputInner,{width:"25%"}]}
                          keyboardType={Platform.OS === 'android'?"numeric":"numbers-and-punctuation"}
                        />
                        <Text style={styles.yen}>円</Text>
                        <Dropdown
                          style={[styles.inputInner,{width:"45%",marginLeft:10}]}
                          containerStyle={{width:"45%"}}
                          placeholderStyle={{fontSize:14}}
                          selectedTextStyle={{fontSize:14}}
                          itemTextStyle={{fontSize:14}}
                          renderItem={(item)=>(
                            <View style={styles.dropItem}>
                              <Text style={styles.dropItemText}>{item.label}</Text>
                            </View>
                          )}
                          value={details.article_manager_staff[2]}
                          data={staffList2}
                          labelField="label"
                          valueField="value"
                          onChange={(item) => {
                            setChange_flg(true);
                            var arr = details.article_manager_staff;
                            arr[2] = item.value;
                            setDetails(state => ({ ...state, article_manager_staff: arr }));
                          }}
                        />
                      </View>
                    ):(<></>)}
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>広告料受領日</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TouchableOpacity
                        style={[styles.inputInner,{flexDirection:'row',width:"50%"}]}
                        onPress={()=>{
                          setShow_ymd(true);
                          setMode("date");
                          setMode_date(3);
                        }}
                      >
                        <Text style={{alignSelf:'center'}}>{details.ad_date?Moment(details.ad_date).format("YYYY-MM-DD"):""}</Text>
                        <TouchableOpacity
                          style={{alignSelf:'center',marginLeft:'auto'}}
                          onPress={()=>ClearDateTime(3)}
                        >
                          <Feather name='x-circle' color='#ccc' size={25} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      <CheckBox
                        checked={details.ad_flg}
                        onPress={() => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, ad_flg: !details.ad_flg }));
                        }}
                        containerStyle={styles.checkbox}
                        checkedColor={chk}
                        size={28}
                        iconType="material-community"
                        checkedIcon="checkbox-marked"
                        uncheckedIcon="checkbox-blank-outline"
                        title="入金済み"
                      />
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>先上げ日</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TouchableOpacity
                        style={[styles.inputInner,{flexDirection:'row',width:"50%"}]}
                        onPress={()=>{
                          setShow_ymd(true);
                          setMode("date");
                          setMode_date(4);
                        }}
                      >
                        <Text style={{alignSelf:'center'}}>{details.prepayment_date?Moment(details.prepayment_date).format("YYYY-MM-DD"):""}</Text>
                        <TouchableOpacity
                          style={{alignSelf:'center',marginLeft:'auto'}}
                          onPress={()=>ClearDateTime(4)}
                        >
                          <Feather name='x-circle' color='#ccc' size={25} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>広告料</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TextInput
                        onChangeText={(text) => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, ad_rate: text }));
                        }}
                        value={details.ad_rate}
                        style={[styles.inputInner,{width:"90%"}]}
                        keyboardType={Platform.OS === 'android'?"numeric":"numbers-and-punctuation"}
                      />
                      <Text style={styles.yen}>円</Text>
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>鍵渡し日</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TouchableOpacity
                        style={[styles.inputInner,{flexDirection:'row',width:"40%"}]}
                        onPress={()=>{
                          setShow_ymd(true);
                          setMode("date");
                          setMode_date(5);
                        }}
                        disabled={!details.key_pass_flg?false:true}
                      >
                        <Text style={{alignSelf:'center'}}>{details.key_pass_date?Moment(details.key_pass_date).format("YYYY-MM-DD"):""}</Text>
                        <TouchableOpacity
                          style={{alignSelf:'center',marginLeft:'auto'}}
                          onPress={()=>ClearDateTime(5)}
                          disabled={!details.key_pass_flg?false:true}
                        >
                          <Feather name='x-circle' color='#ccc' size={25} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.inputInner,{flexDirection:'row',width:"30%",marginLeft:10}]}
                        onPress={()=>{
                          setShow_ymd(true);
                          setMode("time");
                          setMode_date(5);
                        }}
                        disabled={!details.key_pass_flg?false:true}
                      >
                        <Text style={{alignSelf:'center'}}>{details.key_pass_date?Moment(details.key_pass_date).format("HH:mm"):""}</Text>
                        <TouchableOpacity
                          style={{alignSelf:'center',marginLeft:'auto'}}
                          onPress={()=>ClearDateTime(5)}
                          disabled={!details.key_pass_flg?false:true}
                        >
                          <Feather name='x-circle' color='#ccc' size={25} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      <CheckBox
                        checked={details.key_pass_flg}
                        onPress={() => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, key_pass_flg: !details.key_pass_flg }));
                        }}
                        containerStyle={styles.checkbox}
                        checkedColor={chk}
                        size={28}
                        iconType="material-community"
                        checkedIcon="checkbox-marked"
                        uncheckedIcon="checkbox-blank-outline"
                        title="完了"
                        disabled={shop_options.includes('30')}
                      />
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>入居日</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TouchableOpacity
                        style={[styles.inputInner,{flexDirection:'row',width:"50%"}]}
                        onPress={()=>{
                          setShow_ymd(true);
                          setMode("date");
                          setMode_date(6);
                        }}
                      >
                        <Text style={{alignSelf:'center'}}>{details.move_in_date?Moment(details.move_in_date).format("YYYY-MM-DD"):""}</Text>
                        <TouchableOpacity
                          style={{alignSelf:'center',marginLeft:'auto'}}
                          onPress={()=>ClearDateTime(6)}
                        >
                          <Feather name='x-circle' color='#ccc' size={25} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      <CheckBox
                        checked={details.move_in_flg}
                        onPress={() => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, move_in_flg: !details.move_in_flg }));
                        }}
                        containerStyle={styles.checkbox}
                        checkedColor={chk}
                        size={28}
                        iconType="material-community"
                        checkedIcon="checkbox-marked"
                        uncheckedIcon="checkbox-blank-outline"
                        title="入居済み"
                      />
                    </View>
                  </View>
                  <View style={styles.input}>
                    <Text style={styles.label}>ルームチェック日</Text>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <TouchableOpacity
                        style={[styles.inputInner,{flexDirection:'row',width:"50%"}]}
                        onPress={()=>{
                          setShow_ymd(true);
                          setMode("date");
                          setMode_date(7);
                        }}
                      >
                        <Text style={{alignSelf:'center'}}>{details.room_check_date?Moment(details.room_check_date).format("YYYY-MM-DD"):""}</Text>
                        <TouchableOpacity
                          style={{alignSelf:'center',marginLeft:'auto'}}
                          onPress={()=>ClearDateTime(7)}
                        >
                          <Feather name='x-circle' color='#ccc' size={25} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                      <CheckBox
                        checked={details.room_check_flg}
                        onPress={() => {
                          setChange_flg(true);
                          setDetails(state => ({ ...state, room_check_flg: !details.room_check_flg }));
                        }}
                        containerStyle={styles.checkbox}
                        checkedColor={chk}
                        size={28}
                        iconType="material-community"
                        checkedIcon="checkbox-marked"
                        uncheckedIcon="checkbox-blank-outline"
                        title="確認済み"
                      />
                    </View>
                  </View>
                  <Text style={styles.modal_title2}>付帯情報１</Text>
                  {hutai_list.map((hutai,index)=>{
                    return (
                      <View style={styles.input} key={index}>
                        <Text style={styles.label}>{hutai.label}</Text>
                        <View style={{flexDirection:'row',alignItems:'center'}}>
                          <Dropdown
                            style={[styles.inputInner,{width:"25%"}]}
                            containerStyle={{width:"25%"}}
                            placeholderStyle={{fontSize:14}}
                            selectedTextStyle={{fontSize:14}}
                            itemTextStyle={{fontSize:14}}
                            renderItem={(item)=>(
                              <View style={styles.dropItem}>
                                <Text style={styles.dropItemText}>{item.label}</Text>
                              </View>
                            )}
                            value={details[hutai.value+"_agreement_flg"]}
                            data={hutai_flg_list}
                            labelField="label"
                            valueField="value"
                            onChange={(item) => {
                              setChange_flg(true);
                              setDetails(state => ({ ...state, [hutai.value+"_agreement_flg"]: item.value }));
                            }}
                          />
                          <TextInput
                            onChangeText={(text) => {
                              setChange_flg(true);
                              setDetails(state => ({ ...state, [hutai.value]: text }));
                            }}
                            value={details[hutai.value]}
                            style={[styles.inputInner,{width:"25%",marginLeft:10}]}
                            keyboardType={Platform.OS === 'android'?"numeric":"numbers-and-punctuation"}
                          />
                          <Text style={styles.yen}>円</Text>
                          <CheckBox
                            checked={details[`${hutai.value}_description_flg`] === "1"}
                            onPress={() => {
                              setChange_flg(true);
                              setDetails(state => ({
                                ...state,
                                [`${hutai.value}_description_flg`]: state[`${hutai.value}_description_flg`] === "1" ? "0" : "1"
                              }));
                            }}
                            containerStyle={styles.checkbox}
                            checkedColor={chk}
                            size={28}
                            iconType="material-community"
                            checkedIcon="checkbox-marked"
                            uncheckedIcon="checkbox-blank-outline"
                            title="説明"
                          />
                        </View>
                        <View style={{flexDirection:'row',alignItems:'center',marginTop:10,borderBottomWidth:0.8,borderColor:'#bfbfbf',paddingBottom:10}}>
                          <Text style={styles.nyukin}>入金日</Text>
                          <TouchableOpacity
                            style={[styles.inputInner,{flexDirection:'row',width:"50%"}]}
                            onPress={()=>{
                              setShow_ymd(true);
                              setMode("date");
                              setMode_date(7+(index+1));
                            }}
                          >
                            <Text style={{alignSelf:'center'}}>{details[hutai.value+"_payment"]?Moment(details[hutai.value+"_payment"]).format("YYYY-MM-DD"):""}</Text>
                            <TouchableOpacity
                              style={{alignSelf:'center',marginLeft:'auto'}}
                              onPress={()=>ClearDateTime(7+(index+1))}
                            >
                              <Feather name='x-circle' color='#ccc' size={25} />
                            </TouchableOpacity>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )
                  })}
                  <TouchableOpacity onPress={()=>{onSubmit()}} style={[styles.submit,{backgroundColor:chk}]}>
                    <Text style={styles.submitText}>保　存</Text>
                  </TouchableOpacity>
                </ScrollView>
                </View>
                {(show_ymd && Platform.OS === 'android') && (
                  <DateTimePicker
                    value={
                      mode_date==0?(details.application_date?new Date(details.application_date):new Date()):
                      mode_date==1?(details.important_date?new Date(details.important_date):new Date()):
                      mode_date==2?(details.received_settlement_date?new Date(details.received_settlement_date):new Date()):
                      mode_date==3?(details.ad_date?new Date(details.ad_date):new Date()):
                      mode_date==4?(details.prepayment_date?new Date(details.prepayment_date):new Date()):
                      mode_date==5?(details.key_pass_date?new Date(details.key_pass_date):new Date()):
                      mode_date==6?(details.move_in_date?new Date(details.move_in_date):new Date()):
                      mode_date==7?(details.room_check_date?new Date(details.room_check_date):new Date()):
                      mode_date>7?(details[hutai_list[mode_date-8]["value"]+"_payment"]?new Date(details[hutai_list[mode_date-8]["value"]+"_payment"]):new Date()):
                      new Date()
                    }
                    mode={mode}
                    display="default"
                    locale={'ja'}
                    onChange={(event, selectedDate) => {
                      ChangeDate(selectedDate,mode_date);
                      setShow_ymd(false);
                    }}
                  />
                )}
                {Platform.OS === 'ios'&& (
                  <Modal
                    isVisible={show_ymd}
                    swipeDirection={null}
                    backdropOpacity={0.5}
                    animationInTiming={300}
                    animationOutTiming={500}
                    animationIn={'slideInDown'}
                    animationOut={'slideOutUp'}
                    propagateSwipe={true}
                    style={{alignItems: 'center'}}
                    onBackdropPress={()=>setShow_ymd(false)}
                  >
                    <View style={styles.iosdate}>
                      <TouchableOpacity
                        style={{
                          position: 'absolute',
                          top:8,
                          right:10,
                          zIndex:999
                        }}
                        onPress={()=>setShow_ymd(false)}
                      >
                        <Feather name='x-circle' color='#ccc' size={35} />
                      </TouchableOpacity>
                      <DateTimePicker
                        value={
                          mode_date==0?(details.application_date?new Date(details.application_date):new Date()):
                          mode_date==1?(details.important_date?new Date(details.important_date):new Date()):
                          mode_date==2?(details.received_settlement_date?new Date(details.received_settlement_date):new Date()):
                          mode_date==3?(details.ad_date?new Date(details.ad_date):new Date()):
                          mode_date==4?(details.prepayment_date?new Date(details.prepayment_date):new Date()):
                          mode_date==5?(details.key_pass_date?new Date(details.key_pass_date):new Date()):
                          mode_date==6?(details.move_in_date?new Date(details.move_in_date):new Date()):
                          mode_date==7?(details.room_check_date?new Date(details.room_check_date):new Date()):
                          mode_date>7?(details[hutai_list[mode_date-8]["value"]+"_payment"]?new Date(details[hutai_list[mode_date-8]["value"]+"_payment"]):new Date()):
                          new Date()
                        }
                        mode={mode}
                        is24Hour={true}
                        display="spinner"
                        locale={'ja'}
                        onChange={(event, selectedDate) => {ChangeDate(selectedDate,mode_date)}}
                        textColor="#fff"
                      />
                    </View>
                  </Modal>
                )}
              </Modal>
              {ins_staffTable.length>14&&(
                <View style={styles.tr}>
                  <View style={[styles.th,{borderLeftWidth:1,width:50,borderTopWidth:0}]}>
                    <Text style={styles.th_text}>来店日</Text>
                  </View>
                  <View style={[styles.th,{width:200,borderTopWidth:0}]}>
                    <Text style={styles.th_text}>顧客名</Text>
                  </View>
                  <View style={[styles.th,{width:80,borderTopWidth:0}]}>
                    <Text style={styles.th_text}>状況</Text>
                  </View>
                  <View style={[styles.th,{width:250,borderTopWidth:0}]}>
                    <Text style={styles.th_text}>物件名</Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </ScrollView>
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
              previous:'WorkProgress',
              withAnimation: true
            }],
          });
        }}
        onPress1={() => {
          navigation.reset({
            index: 0,
            routes: [{
              name: 'Company' ,
              params: route.params,
              websocket:route.websocket,
              websocket2: route.websocket2,
              profile:route.profile,
              previous:'WorkProgress',
              withAnimation: true
            }],
          });
        }}
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
                previous:'WorkProgress',
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
              previous:'WorkProgress',
              withAnimation: true
            }],
          });
        }}
        active={[false,false,false,false]}
      />
    </SideMenu>
  );
}

const styles = StyleSheet.create({
  bell: {
    justifyContent:"center",
    alignItems: "center",
    position: "absolute",
    color: "white",
    fontWeight: "bold",
    borderRadius: 10,
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
    width:20,
    height:20,
    marginLeft:5
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
  headertitle: {
    color:'#fff',
    fontWeight:'700',
    fontSize:16
  },
  header_img: {
    width: 150,
    height: 45,
  },
  container: {
    flex: 1,
    backgroundColor:'#f1f1f1',
    paddingHorizontal:10,
    marginBottom:80,
  },
  searchLabel: {
    fontSize:12,
    color:'#999'
  },
  DropDown: {
    fontSize: 16,
    height: 35,
    borderRadius:5,
    backgroundColor:'#fff',
    borderWidth:1,
    paddingHorizontal:5,
  },
  dropItem: {
    padding:10,
  },
  dropItemText: {
    fontSize:14,
  },
  Datebtn: {
    width: "38%",
    height: 35,
    marginLeft: "2%",
    backgroundColor:'#fff',
    borderRadius:8,
    borderWidth:1,
    justifyContent:'center',
    alignItems:'center'
  },
  Datebtn_text: {
    fontSize: 14,
  },
  date_mdl: {
    width:250,
    height:230,
    backgroundColor:'#fff',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5
  },
  active_tab: {
    width:"16.6%",
    height:35,
    justifyContent: 'center',
    alignItems:'center',
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
  },
  inactivetab: {
    width:"16.6%",
    height:35,
    justifyContent: 'center',
    alignItems:'center',
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
    backgroundColor:'#b8b8b8',
  },
  tab_txt: {
    fontSize:12,
    fontWeight:'700',
    color:'#666',
    letterSpacing: 3
  },
  table: {
    width:'100%',
    paddingHorizontal:10,
    paddingVertical:15,
    marginBottom:10
  },
  tr: {
    backgroundColor:'#fff',
    flexDirection: 'row',
  },
  th: {
    borderWidth:1,
    borderLeftWidth:0,
    borderColor:'#333',
    height:40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor:'#D9D9D9'
  },
  th_text: {
    fontSize:12,
    fontWeight:'700'
  },
  td: {
    borderWidth:1,
    borderLeftWidth:0,
    borderTopWidth:0,
    borderColor:'#333',
    height:40,
    justifyContent: 'center',
    paddingHorizontal:5,
    flexDirection:'row',
    alignItems:'center'
  },
  td_text: {
    fontSize:14
  },
  talkBtn: {
    paddingHorizontal:8,
    paddingVertical:5,
    borderRadius:8,
    justifyContent:'center',
    alignContent:'center',
    marginLeft:'auto',
    backgroundColor:'#D9D9D9',
  },
  talkBtn_txt: {
    color:'#333',
    fontSize:12
  },
  modal: {
    width:'100%',
    maxHeight:"95%",
    backgroundColor:'#fff',
    paddingHorizontal:15,
    borderRadius:5,
  },
  modal_title: {
    fontSize:18,
    fontWeight:'700',
    marginTop:20,
    marginBottom:10,
    width:"85%",
  },
  modal_title2: {
    fontSize:16,
    fontWeight:'500',
    marginBottom:5
  },
  input: {
    marginBottom: 5,
    width:'100%',
  },
  label: {
    color:"#999",
    marginVertical: 3,
    marginLeft:5,
    fontSize:16,
    fontWeight:'500'
  },
  inputInner: {
    height:40,
    paddingHorizontal:5,
    backgroundColor:'#fff',
    borderColor: '#919191',
    fontSize:16,
    borderWidth: 1,
    borderRadius: 8,
  },
  iosdate: {
    width:300,
    height:260,
    backgroundColor:'#333',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5
  },
  checkbox: {
    margin: 0,
    marginLeft: 10,
    marginRight: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    height:30,
    backgroundColor:'transparent',
    alignItems:'center',
    justifyContent:'center',
  },
  yen: {
    fontSize:16,
    paddingLeft:10
  },
  add_btn: {
    height:40,
    width:"15%",
    borderRadius:8,
    justifyContent:'center',
    alignContent:'center',
    marginLeft:'auto',
    backgroundColor:'#D9D9D9',
  },
  add_btn_txt: {
    color:'#333',
    fontSize:14,
    textAlign:'center'
  },
  nyukin: {
    fontSize:14,
    marginRight:10,
    color:'red'
  },
  submit:{
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical:20,
    borderRadius: 8,
    width:100,
    height:40,
    shadowColor: "#a3a3a3",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5
  },
  submitText: {
    fontSize:16,
    fontWeight:'600',
    color:'#ffffff'
  },
});
