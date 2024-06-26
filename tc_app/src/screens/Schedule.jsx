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
  StatusBar,
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
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SQLite from "expo-sqlite";
import Moment from 'moment';
import Modal from "react-native-modal";
import SideMenu from 'react-native-side-menu-updated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CalendarList, LocaleConfig,ExpandableCalendar, TimelineList, CalendarProvider } from 'react-native-calendars';
import dayjs from 'dayjs';
import ja from 'dayjs/locale/ja';
import WheelPickerExpo from 'react-native-wheel-picker-expo';
import { CheckBox } from 'react-native-elements';
import { useHeaderHeight } from '@react-navigation/elements';
import Constants from 'expo-constants';
import RadioButtonRN from 'radio-buttons-react-native';
import GestureRecognizer from 'react-native-swipe-gestures';
import Popover, { Rect } from 'react-native-popover-view';

LocaleConfig.locales.jp = {
  monthNames: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
  dayNames: ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'],
  dayNamesShort: ['月', '火', '水', '木', '金', '土', '日'],
};
LocaleConfig.defaultLocale = 'jp';

import Loading from "../components/Loading";
import { GetDB,db_select,db_write } from '../components/Databace';
import Footer from "../components/Footer";

import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { color } from "react-native-elements/dist/helpers";

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

export default function Schedule(props) {

  const [isLoading, setLoading] = useState(false);
  const [end, setEnd] = useState(true);

  const { navigation, route } = props;

  const [events, setEvents] = useState([]);
  const [sub, setSub] = useState({
    "note": "",
    "day": "",
    "send_check": "",
    "customer_select": "",
    "event_id": "",
    "name": "",
    "user_id": "",
  });
  
  const [holidays, setHolidays] = useState([]);

  const [modal, setModal] = useState(false);

  const [options, setOptions] = useState([]);

  const [staff_value, setStaff_Value] = useState("");
  const [staffs, setStaffs] = useState([]);

  const [bell_count, setBellcount] = useState(null);

  const [addchat, setAddchat] = useState(false);
  const [menu, setMenu] = useState(false);
  const deviceScreen = Dimensions.get('window');
  
  var headerHeight = useHeaderHeight();
  const statusBarHeight = Constants.statusBarHeight;

  if (Platform.OS === 'android') {
    headerHeight = headerHeight - StatusBar.currentHeight;
  }
  
  const [search_flg, setSearch_flg] = useState("2");
  const [categorty, setCategorty] = useState("賃貸");

  const [date_, setDate_] = useState(new Date());
  const [date_select, setDate_select] = useState(new Date());

  const [date_y, setDate_y] = useState(new Date().getFullYear());
  const [date_m, setDate_m] = useState(new Date().getMonth());
  const [show, setShow] = useState(false);

  const [month_events, setMonth_events] = useState([]);
  const [month_events_date, setMonth_events_date] = useState(Moment(new Date()).format("YYYY-MM-DD"));
  const [show_month_events, setShow_month_events] = useState(false);

  const [schedule_flg1, setSchedule_flg1] = useState(true); // 問合せ
  const [schedule_flg2, setSchedule_flg2] = useState(true); // 来店
  const [schedule_flg3, setSchedule_flg3] = useState(true); // 契約
  const [schedule_flg4, setSchedule_flg4] = useState(true); // その他フリー

  const search_flg_list = [
    { label: "一日", value: "1" },
    { label: "一週間", value: "2" },
    { label: "一か月", value: "3" },
  ]

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

    items.unshift({ label: "全員", value: "" });
    
    return items;

  },[staffs]);

  var categortyList = [
    {label: "賃貸", value: "賃貸"},
    {label: "売買", value: "売買"},
    {label: "全て", value: "全て"},
  ]

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

  const [showPopover, setShowPopover] = useState(false);
  
  // スケジュールの操作通知を一回だけ表示する
  useEffect(() => {
    storage.load({
      key : 'SCHEDULE-FLG'
    })
    .then(data => {
      if (!data) {
        setShowPopover(true);
      }
    })
    .catch(err => {
      setShowPopover(true);
      storage.save({
        key: 'SCHEDULE-FLG',
        data: false,
      });
    })
  }, []);

  const closePopover = () => {
    setShowPopover(false);
    storage.save({
      key: 'SCHEDULE-FLG',
      data: true,
    });
  }

  useLayoutEffect(() => {

    navigation.setOptions({
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#6C9BCF", height: 110 }
        : { backgroundColor: "#FF8F8F", height: 110 },
      headerTitle:() => (<Text style={styles.headertitle}>スケジュール</Text>),
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
              name="calendar-search"
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
                previous:'Schedule'
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

    // ローカルDB用スタッフリスト
    await Insert_staff_list_db();

    const holidaysData = await getHoliday();

    if (holidaysData) {
      const currentMonthHolidays = Object.entries(holidaysData).map(([date, name]) => ({ date, name }));

      setHolidays(currentMonthHolidays);
    }

    // 検索条件
    storage.load({
      key : 'SCHEDULE-SEARCH'
    })
    .then(data => {
      if (data) {
        setSearch_flg(data.search_flg);
        setStaff_Value(data.staff_value);
        setCategorty(data.categorty);
        setSchedule_flg1(data.schedule_flg1);
        setSchedule_flg2(data.schedule_flg2);
        setSchedule_flg3(data.schedule_flg3);
        setSchedule_flg4(data.schedule_flg4);
        onRefresh(null,data);
      }
    })
    .catch(err => {
      storage.save({
        key: 'SCHEDULE-SEARCH',
        data: {
          search_flg: search_flg,
          staff_value:staff_value,
          categorty: categorty,
          schedule_flg1: schedule_flg1,
          schedule_flg2: schedule_flg2,
          schedule_flg3: schedule_flg3,
          schedule_flg4: schedule_flg4,
        }
      });
      onRefresh(null,null);
    })

    await getBELL();

  }

  const onRefresh = useCallback(async(sendDate,search) => {

    if (!sendDate) sendDate = date_;

    const loadflg = await Insert_schedule_db();

    if (loadflg) setLoading(true);

    const startTime = Date.now(); // 開始時間

    const schedule = await getSchedule(sendDate,search);

    const endTime = Date.now(); // 終了時間
    const time = (endTime - startTime)/1000;
    console.log('onRefreshschedule：'+time + '秒');

    setEnd(false);

    if (schedule) {
      if (!schedule["schedule"]) {
        setEvents([]);
      } else {
        var eventList = schedule["schedule"];
        eventList.sort((a, b) => new Date(a.day) - new Date(b.day));

        const updatedData = eventList.map(event => {
          if (event.customer_select === "0") {
            if (event.schedule_id) {
              event.event_id = event.schedule_id;
            }
          } else {
            if (event.customer_id) {
              event.event_id = event.customer_id;
            }
          }
          delete event.schedule_id;
          delete event.customer_id;
          return event;
        });
        
        setEvents(updatedData);
        setLoading(false);
        await Insert_schedule_db(updatedData);
      }

      setOptions(schedule["shop_option_list"])
    }

    setLoading(false);
    return;

  }, [search_flg,staff_value,categorty,schedule_flg1,schedule_flg2,schedule_flg3,schedule_flg4,date_]);
  
  const getSchedule = useCallback((sendDate,search) => {

    if (!search) {
      search = {
        search_flg: search_flg,
        staff_value:staff_value,
        categorty: categorty,
        schedule_flg1: schedule_flg1,
        schedule_flg2: schedule_flg2,
        schedule_flg3: schedule_flg3,
        schedule_flg4: schedule_flg4,
      }
    }
    
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
          act: "schedule",
          fc_flg: global.fc_flg,
          search_flg:search.search_flg,
          user_id:search.staff_value,
          categorty:search.categorty,
          select_day:Moment(sendDate).format("YYYY-MM-DD"),
          schedule_flg1:search.schedule_flg1?"1":"",
          schedule_flg2:search.schedule_flg2?"1":"",
          schedule_flg3:search.schedule_flg3?"1":"",
          schedule_flg4:search.schedule_flg4?"1":"",
          new: "1",
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

  }, [search_flg,staff_value,categorty,schedule_flg1,schedule_flg2,schedule_flg3,schedule_flg4,date_]);

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

  // スケジュール取得
  async function Insert_schedule_db(schedule) {

    if (schedule) {

      const startTime = Date.now(); // 開始時間
      for (var s=0;s<schedule.length;s++) {
        
        var sch = schedule[s];

        var sql = `insert or replace into schedule_mst values (?,?,?,?,?,?,?,?);`;

        var data = [
          sch.event_id,
          sch.customer_select,
          sch.day,
          sch.flg,
          sch.name,
          sch.note,
          sch.send_check,
          sch.user_id,
        ];
        
        await db_write(sql,data);
      }
      const endTime = Date.now(); // 終了時間
      const time = (endTime - startTime)/1000;
      console.log('Insert_schedule_db：'+time + '秒');

    } else {

      const S_S = await storage.load({key : 'SCHEDULE-SEARCH'});
      
      var sql = "select * from schedule_mst where 1 = 1 ";
  
      if (S_S.search_flg == "1") { // 一日
        sql += ` and day like '${Moment(date_).format("YYYY-MM-DD")}%' `;
      } else if (S_S.search_flg == "2") { // 週
        var startOfWeek = Moment(date_).format("YYYY-MM-DD 00:00:00");
        var endOfWeek = Moment(date_).add(7, 'days').format("YYYY-MM-DD 23:59:59");
        sql += ` AND day >= '${startOfWeek}' AND day <= '${endOfWeek}'`;
      } else if (S_S.search_flg == "3") { // 月
        sql += ` and day like '${Moment(date_).format("YYYY-MM")}%' `;
      }
  
      if (S_S.staff_value) {
        sql += ` and user_id = '${S_S.staff_value}' `;
      }
  
      var schedule_flg = false;
  
      
      for (var i=1;i<=4;i++) {
        if (S_S[`schedule_flg${i}`]) {
          schedule_flg = true;
        }
      }
  
      if (schedule_flg) {
  
        var arr = [];
        if (S_S.schedule_flg1) {
          arr.push("customer_select = '1'");
        }
        if (S_S.schedule_flg2) {
          arr.push("customer_select = '2'");
        }
        if (S_S.schedule_flg3) {
          arr.push("customer_select = '3'");
        }
        if (S_S.schedule_flg4) {
          arr.push("customer_select = '0'");
        }
  
        sql += ` and ( ${arr.join(" or ")} ) `;
  
      }
  
      var sc = await db_select(sql);
  
      if (sc != false) {
        setEvents(sc);
        return false;
      } else {
        setEvents([]);
        return true;
      }

    }
    
  }

  // スタッフリスト取得
  async function Insert_staff_list_db() {

    const sl = await GetDB('staff_list');

    if (sl != false) {
      setStaffs(sl);
    } else {
      setStaffs([]);
    }

  }

  async function check_on_off_db(sub) {

    const AsyncAlert = async (txt) => new Promise((resolve) => {
      Alert.alert(
        '確認',
        `${sub["note"]}を【${txt}】にしてよろしいですか？`,
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

    var txt = sub.send_check == '1' ? '未完了' : '完了';

    if (!await AsyncAlert(txt)) return;

    setLoading(true);

    var flg = sub.send_check == '1' ? '' : '1';

    let formData = new FormData();

    if (sub.customer_select == "0") {
      formData.append('val[app_flg]',1);
      formData.append('act','check');
      formData.append('val[id]',sub.event_id);
      formData.append('val[flg]',flg);
    } else {
      formData.append('ID',route.params.account);
      formData.append('pass',route.params.password);
      formData.append('act','customer_check');
      formData.append('val[app_flg]',1);
      formData.append('val[id]',sub.event_id);
      formData.append('val[selecter]',sub.customer_select);
      formData.append('val[key]',sub.flg);
      formData.append('val[flg]',flg);
    }

    fetch(domain+'php/ajax/update.php',
    {
      method: 'POST',
      body: formData,
      header: {
        'content-type': 'multipart/form-data',
      },
    })
    .then((response) => response.json())
    .then(async(json) => {
      setModal(false);
      setShow_month_events(false);
      await onRefresh(null,null);
    })
    .catch((error) => {
      console.log(error);
      Alert.alert('エラー','完了に失敗しました');
      setModal(false);
      setShow_month_events(false);
      onRefresh(null,null);
    })
    
    setModal(false);

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

    storage.remove({key:'SCHEDULE-SEARCH'});
    
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
                  previous:'Schedule',
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
                  previous:'Schedule',
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
                  previous:'Schedule',
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
                  previous:'Schedule',
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

  const scheduleList = useMemo(() => {

    const staff = staffList.find(stf => stf.value == sub.user_id);

    return (
      <View style={styles.listmodal}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top:8,
            right:10,
            zIndex:999
          }}
          onPress={()=>setModal(false)}
        >
          <Feather name='x-circle' color='#ccc' size={35} />
        </TouchableOpacity>
        <View style={{width:'90%',justifyContent:'center'}}>
          <View style={{width:'85%'}}>
            <View style={{flexDirection:'row'}}>
              <Text style={{fontSize:15,fontWeight:'700'}}>
                {sub.send_check=="1"&&(<Text style={{fontSize:15,fontWeight:'700',color:'red'}}>【済】</Text>)}
                {sub.note}
              </Text>
            </View>
            {sub.customer_select!="0"&&(
              <Text style={{fontSize:13}}>お客様名：{sub.name}</Text>
            )}
            <Text style={{fontSize:13}}>担当：{staff?staff.label:"なし"}</Text>
            <Text style={{fontSize:13}}>{sub.day}</Text>
          </View>
          <View style={{flexDirection:'row',justifyContent:'center'}}>
            {sub.customer_select!="1"&&(
              <TouchableOpacity style={styles.buttonContainer2} onPress={()=>check_on_off_db(sub)}>
                <Text style={styles.buttonLabel}>{sub.send_check=='1'?'未完了にする':'完了にする'}</Text>
              </TouchableOpacity>
            )}
            {sub.customer_select!="0"&&(
              <TouchableOpacity
                style={[styles.buttonContainer2,sub.customer_select!="1"&&{marginLeft:10}]}
                onPress={()=>{
                  setModal(false);
                  navigation.reset({
                    index: 0,
                    routes: [
                      {
                        name: "TalkScreen",
                        params: route.params,
                        customer: sub.event_id,
                        websocket: route.websocket,
                        websocket2: route.websocket2,
                        profile: route.profile,
                        cus_name: sub.name,
                      },
                    ],
                  });
                }}
              >
                <Text style={styles.buttonLabel}>トーク画面</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    )
  },[sub])

  /* ------------------------------------- */
  //                 月表示
  /* ------------------------------------- */
  const dateFormat = (date) => dayjs(date).locale(ja).format('YYYY-MM-DD');

  const COLORS = ['#FF9EAA', '#BFEA7C', '#FFBB64', '#FFFC9B'];

  const eventItems = useMemo(() => {
    const result = new Map();

    if (events.length == 0) return result;

    events.forEach((event, i) => {
      const dayKey = dateFormat(event.day);
      const diff = dayjs(event.day).diff(event.day, 'day') + 1;

      if (diff === 1) {
        const currentData = result.get(dayKey);
        const maxIndex = currentData?.reduce((p, c) => Math.max(p, c.index), 0);
        result.set(dayKey, [
          ...(currentData ?? []),
          {
            id: i,
            index: maxIndex !== undefined ? maxIndex + 1 : 0,
            color: COLORS[event.customer_select],
            note: event.note,
            type: 'all',
            event_id: event.event_id,
            customer_select: event.customer_select,
            name: event.name,
            day: event.day,
            flg: event.flg,
            send_check: event.send_check,
            user_id: event.user_id,
          },
        ]);
      } else {
        let index = null;

        Array(diff)
          .fill(null)
          .forEach((_, i) => {
            const date = dateFormat(dayjs(new Date(dayKey)).add(i, 'day').toDate());
            const currentData = result.get(date);
            if (index === null) index = currentData?.length ?? 0;

            result.set(date, [
              ...(currentData ?? []),
              {
                id: i,
                index,
                color: COLORS[event.customer_select],
                note: event.note,
                type: i === 0 ? 'start' : i === diff - 1 ? 'end' : 'between',
                event_id: event.event_id,
                customer_select: event.customer_select,
                name: event.name,
                day: event.day,
                flg: event.flg,
                send_check: event.send_check,
                user_id: event.user_id,
              },
            ]);
          });
      }
    });

    return result;
  }, [events]);
  
  const [height, setHeight] = useState(0);

  const theme = useColorScheme();
  const cellMinHeight = 90;

  // カレンダーのテーマを定義
  const calendarTheme = useMemo(
    () => ({
      monthTextColor: '#000',
      textMonthFontWeight: 'bold',
      calendarBackground: 'transparent',
      arrowColor: '#0000ff',
      'stylesheet.calendar.header': {
        header: {
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingLeft: 10,
          paddingRight: 10,
          alignItems: 'center',
          height:40
        },
        dayTextAtIndex5: {
          color: 'blue'
        },
        dayTextAtIndex6: {
          color: 'red'
        },
        week: {
          flexDirection: 'row',
          justifyContent: 'space-between'
        }
      },
      'stylesheet.calendar.main' : {
        week: {
          flexDirection: 'row',
          justifyContent: 'space-around'
        },
      }
    }),
    [theme],
  );

  const CELL_HEIGHT = 13.5;
  const MAX_EVENTS = 5;
  const CELL_ITEM_PADDING = 2;
  const CELL_RADIUS = 3;
  
  const GoogleCalendarDayItem = (props) => {
    const { date, eventItems: dayItems, children, state, cellMinHeight } = props;
  
    const events = useMemo(
      () => (dayItems.get(date?.dateString ?? '') ?? []).sort((a, b) => b.index - a.index),
      [date, dayItems],
    );

    const openMonthDayEvent = (item,date) => {
      setMonth_events_date(date.dateString);
      item.sort((a, b) => new Date(a.day) - new Date(b.day));
      setMonth_events(item);
      setShow_month_events(true);
    };


    const holiday_text = () => {
      
      const currentMonth = date_.getMonth() + 1;
      const currentYear  = date_.getFullYear();
      const currentDay   = children;

      const result = holidays.filter(val => {
        const holidayDate = new Date(val.date);
        return (
          holidayDate.getFullYear() === currentYear &&
          holidayDate.getMonth() + 1 === currentMonth &&
          holidayDate.getDate() === currentDay
        );
      });

      if (result.length > 0) {
        return (
          <Text style={styles.holiday}>{result[0].name}</Text>
        )
      }

    }

    const holiday_flg = (currentDay) => {
      
      const currentMonth = date_.getMonth() + 1;
      const currentYear  = date_.getFullYear();

      const result = holidays.filter(val => {
        const holidayDate = new Date(val.date);
        return (
          holidayDate.getFullYear() === currentYear &&
          holidayDate.getMonth() + 1 === currentMonth &&
          holidayDate.getDate() === currentDay
        );
      });

      if (result.length > 0) {
        return true;
      } else {
        return false;
      }

    }
  
    return (
      <TouchableOpacity
        style={[
          styles.cell,
          {
            minHeight: cellMinHeight,
            maxWidth: MAX_EVENTS * CELL_HEIGHT + CELL_ITEM_PADDING,
            opacity: state === 'disabled' ? 0.4 : 1,
          },
        ]}
        onPress={()=>openMonthDayEvent(events,date)}
        key={children}
      >
        <Text style={[styles.dayText, state === 'today' && styles.todayText, holiday_flg(children) && {color:"red"}]}>{children}</Text>
        {holiday_text()}
        <View>
          {events.slice().reverse().map((event, i) => (
            <React.Fragment key={i}>
              {renderEvent(event, i)}
            </React.Fragment>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  const onEventPress = (item) => {
    setSub(item);
    setModal(true);
  };

  const renderEvent = useCallback((v, i) => {

    // 三つ以上は表示しない
    if (i > 3) {
      return (<></>);
    }

    if (i == 3) {
      return (
        <View
          style={[
            styles.event,
            {
              backgroundColor: 'transparent',
              top: v.index * (CELL_HEIGHT + CELL_ITEM_PADDING),
              borderTopLeftRadius: borderLeft,
              borderBottomLeftRadius: borderLeft,
              borderTopRightRadius: borderRight,
              borderBottomRightRadius: borderRight,
            },
          ]}
          key={i}
        >
          <Text style={{fontSize:10,textAlign:'center'}}>︙</Text>
        </View>
      )
    }

    const borderLeft = v.type === 'start' || v.type === 'all' ? CELL_RADIUS : 0;
    const borderRight = v.type === 'end' || v.type === 'all' ? CELL_RADIUS : 0;
    return (
      <TouchableOpacity
        key={`${v.id}-${i}`}
        style={[
          styles.event,
          {
            backgroundColor: v.color,
            top: v.index * (CELL_HEIGHT + CELL_ITEM_PADDING),
            borderTopLeftRadius: borderLeft,
            borderBottomLeftRadius: borderLeft,
            borderTopRightRadius: borderRight,
            borderBottomRightRadius: borderRight,
          },
        ]}
        onPress={() => onEventPress(v)}
      >
        {v.type === 'start' || v.type === 'all' ? (
          <View style={styles.eventRow}>
            <Text style={styles.eventText} numberOfLines={1}>
              {v.send_check=="1"&&(
                <Text style={[styles.eventText,{color:'red'}]}>
                  済:
                </Text>
              )}
              {v.note}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  }, [onEventPress]);

  /* ------------------------------------- */
  //                 週表示
  /* ------------------------------------- */

  const getWeekDates = () => {
    const week = [];
    for (let i = 0; i < 7; i++) {
      var day_add = new Date(date_);
      day_add.setDate(day_add.getDate() + i);
      week.push(day_add);
    }
    return week;
  };

  const onSwipeLeft = async () => {
    const selectDate = Moment(date_).add(7, 'days').toDate();
    setDate_(selectDate);
    setDate_select(selectDate);
    await onRefresh(selectDate,null);
  };

  const onSwipeRight = async () => {
    const selectDate = Moment(date_).subtract(7, 'days').toDate();
    setDate_(selectDate);
    setDate_select(selectDate);
    await onRefresh(selectDate,null);
  };

  const weekHeight = (Height - useHeaderHeight() - 80 - 40)/7;

  const getSchedulesForDate = (date) => {
    return events.filter(e => Moment(e.day).isSame(date, 'day'));
  };

  function get_youbi(weekNo) {
    var w = ["日","月","火","水","木","金","土"];
    return w[weekNo];
  }

  /* ------------------------------------- */
  //                 一日表示
  /* ------------------------------------- */

  const eventItemsDay = useMemo(() => {

    const result = [];
    var today = Moment(date_).format("YYYY-MM-DD");

    if (events.length == 0) return [];

    events.forEach((event, i) => {

      var eventDay = Moment(event.day);

      // 時間部分を取得
      var hour = eventDay.hour();
      var minute = eventDay.minute();
      var second = eventDay.second();

      if (hour === 0 && minute === 0 && second === 0) {
          eventDay.hour(22).minute(0).second(0);  // 00:00は22時に設定
      } else if (hour >= 0 && hour < 9) {
          eventDay.hour(8).minute(0).second(0);   // 0:01〜8:59は8時に設定
      } else if (hour >= 21 && hour < 24) {
          eventDay.hour(22).minute(0).second(0);  // 21:00〜23:59は22時に設定
      }

      var start_ = eventDay.format('YYYY-MM-DD HH:00:00');
      var end_   = eventDay.add(1, 'hour').format('YYYY-MM-DD HH:00:00');

      today = Moment(event.day).format("YYYY-MM-DD");

      const data = {
        id: i,
        start: start_,
        end: end_,
        note: event.note,
        color:COLORS[event.customer_select],
        event_id: event.event_id,
        customer_select: event.customer_select,
        name: event.name,
        day: event.day,
        flg: event.flg,
        send_check: event.send_check,
        user_id: event.user_id,
      }

      result.push(data);

    });

    return {[today]:result};

  }, [events,date_]);

  const onDateChanged = async(date) => {
    const today = Moment(date_).format("YYYY-MM-DD");
    if (today != date) {
      const selectDate = new Date(date);
      setDate_select(selectDate);
      setDate_(selectDate);
      await onRefresh(selectDate,null);
    }
  };

  const onDateChanged2 = (date) => {
    const today = Moment(date_).format("YYYY-MM-DD");
    if (today != date) {
      const selectDate = new Date(date);
      setDate_select(selectDate);
    }
  };

  const renderEventDay = (item) => {
    return (
      <TouchableOpacity
        style={{ backgroundColor: item.color, padding: 5 }}
        onPress={()=>{
          setSub(item);
          setModal(true);
        }}
      >
        <Text style={styles.day_event}>
          {item.send_check=="1"&&(
            <Text style={[styles.day_event,{color:'red'}]}>
              【済】
            </Text>
          )}
          {item.note}
        </Text>
        {item.name&&(<Text style={styles.day_event_name}>{item.name}様</Text>)}
        <Text style={styles.day_event_date}>{Moment(item.day).format("HH:mm")}</Text>
      </TouchableOpacity>
    )
  };

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
        <Text style={[styles.headertitle,{marginLeft:16}]}>スケジュール</Text>
        
        <View style={{marginRight:5,flexDirection:'row',marginLeft:'auto'}}>
          <TouchableOpacity
            style={{width:50,height:50,justifyContent:'center',alignItems:'center'}}
            onPress={() => {
              setAddchat(!addchat);
              setMenu(false);
            }}
          >
            <MaterialCommunityIcons
              name="calendar-search"
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
        <Text style={styles.title}>表示方法</Text>
        <View style={{marginTop:5}}>
          <RadioButtonRN
            data={search_flg_list}
            value={search_flg}
            selectedBtn={(e) => {

              storage.load({
                key : 'SCHEDULE-SEARCH'
              })
              .then(data => {
                if (data) {
                  storage.save({
                    key: 'SCHEDULE-SEARCH',
                    data: {
                      ...data,
                      search_flg: e.value,
                    }
                  });
                }
              })

              setSearch_flg(e.value);
            }}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={Number(search_flg)}
            boxStyle={styles.radio_box}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:14,marginLeft:5}}
            circleSize={10}
          />
        </View>
        <Text style={styles.title}>検索条件</Text>
        <View style={{flexDirection:'row',marginTop:10}}>
          <Text style={[styles.searchLabel,{width:"40%"}]}>スタッフ</Text>
          {options.includes('8')&&(
            <Text style={[styles.searchLabel,{width:"18%",marginLeft:"2%"}]}>種別</Text>
          )}
          <Text style={[styles.searchLabel,{width:"38%",marginLeft:"2%"}]}>日付選択</Text>
        </View>
        <View style={{flexDirection:'row',marginTop:5}}>
          <Dropdown
            style={[styles.DropDown,{width:"40%"}]}
            containerStyle={{width:"40%"}}
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
            onChange={(item) => setStaff_Value(item.value)}
          />
          {options.includes('8')&&(
            <Dropdown
              style={[styles.DropDown,{width:"18%",marginLeft:"2%"}]}
              containerStyle={{width:"18%"}}
              placeholderStyle={{fontSize:14}}
              selectedTextStyle={{fontSize:14}}
              itemTextStyle={{fontSize:14}}
              renderItem={(item)=>(
                <View style={styles.dropItem}>
                  <Text style={styles.dropItemText}>{item.label}</Text>
                </View>
              )}
              value={categorty}
              data={categortyList}
              setValue={setCategorty}
              placeholder="▼　種別"
              labelField="label"
              valueField="value"
              onChange={(item) => setCategorty(item.value)}
            />
          )}
          <TouchableOpacity style={styles.Datebtn} onPress={()=>setShow(true)}>
            <Text style={styles.Datebtn_text}>
              {search_flg!="3"?
              Moment(date_select).format("YYYY年MM月DD日"):
              Moment(date_select).format("YYYY年MM月")}
              </Text>
          </TouchableOpacity>
          {search_flg!="3"?(
          <>
          {(show && Platform.OS === 'android') && (
            <DateTimePicker
              value={date_select}
              mode={"date"}
              display="default"
              locale={'ja'}
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || date_select;
                setDate_select(currentDate);
                setShow(false);
              }}
            />
          )}
          {Platform.OS === 'ios'&& (
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
              onBackdropPress={()=>setShow(false)}
            >
              <View style={styles.iosdate}>
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top:8,
                    right:10,
                    zIndex:999
                  }}
                  onPress={()=>setShow(false)}
                >
                  <Feather name='x-circle' color='#ccc' size={35} />
                </TouchableOpacity>
                <DateTimePicker
                  value={date_select}
                  mode={"date"}
                  is24Hour={true}
                  display="spinner"
                  locale={'ja'}
                  onChange={(event, selectedDate) => {
                    const currentDate = selectedDate || date_select;
                    setDate_select(currentDate);
                  }}
                  textColor="#fff"
                />
              </View>
            </Modal>
          )}
          </>):(
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
              setShow(false);
              setDate_select(new Date(date_y,date_m,date_.getDate()));
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
                  setShow(false);
                  setDate_select(new Date(date_y,date_m,date_.getDate()));
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
          )}
        </View>
        <View style={{flexDirection:'row',marginTop:15}}>
          <CheckBox
            title='問合せ'
            checked={schedule_flg1}
            onPress={() => setSchedule_flg1(!schedule_flg1)}
            containerStyle={[styles.checkbox,{borderColor:'#BFEA7C'}]}
            iconType="material-community"
            checkedIcon="checkbox-marked"
            uncheckedIcon="checkbox-blank-outline"
            checkedColor="#BFEA7C"
          />
          <CheckBox
            title='来店'
            checked={schedule_flg2}
            onPress={() => setSchedule_flg2(!schedule_flg2)}
            containerStyle={[styles.checkbox,{borderColor:'#FFBB64',marginLeft:"2%"}]}
            iconType="material-community"
            checkedIcon="checkbox-marked"
            uncheckedIcon="checkbox-blank-outline"
            checkedColor="#FFBB64"
          />
          <CheckBox
            title='契約'
            checked={schedule_flg3}
            onPress={() => setSchedule_flg3(!schedule_flg3)}
            containerStyle={[styles.checkbox,{borderColor:'#FFFC9B',marginLeft:"2%"}]}
            iconType="material-community"
            checkedIcon="checkbox-marked"
            uncheckedIcon="checkbox-blank-outline"
            checkedColor="#FFFC9B"
          />
          <CheckBox
            title={"その他\nフリー"}
            checked={schedule_flg4}
            onPress={() => setSchedule_flg4(!schedule_flg4)}
            containerStyle={[styles.checkbox,{borderColor:'#FF9EAA',marginLeft:"2%"}]}
            iconType="material-community"
            checkedIcon="checkbox-marked"
            uncheckedIcon="checkbox-blank-outline"
            checkedColor="#FF9EAA"
            textStyle={{fontSize:10}}
          />
        </View>
        <TouchableOpacity
          style={styles.buttonContainer}
          onPress={async()=>{
            
            storage.save({
              key: 'SCHEDULE-SEARCH',
              data: {
                search_flg: search_flg,
                staff_value:staff_value,
                categorty: categorty,
                schedule_flg1: schedule_flg1,
                schedule_flg2: schedule_flg2,
                schedule_flg3: schedule_flg3,
                schedule_flg4: schedule_flg4,
              }
            });

            setAddchat(false);
            setLoading(true);
            setDate_(date_select);
            await onRefresh(date_select,null);
          }}
        >
          <Text style={styles.buttonLabel}>表　示</Text>
        </TouchableOpacity>
      </View>
      </Modal>
      <View style={styles.container}>
        <Loading isLoading={isLoading} />
        <Popover from={new Rect(Width-85,110)} isVisible={showPopover} onRequestClose={() => closePopover()}>
          <View style={{width:180,height:60,justifyContent:'center'}}>
            <Text style={{textAlign:'center'}}>表示方法や検索条件は{"\n"}コチラから</Text>
          </View>
        </Popover>
        <View
          style={{zIndex: 100,flex:1}}
          onLayout={(event) => {
            const { height } = event.nativeEvent.layout;
            setHeight(height);
          }}
        >
          {search_flg=="1"?
            (
            <View style={{height:Height - useHeaderHeight() - 80}}>
              <CalendarProvider
                date={Moment(date_).format("YYYY-MM-DD")}
                onDateChanged={(date)=>{onDateChanged(date)}}
                disabledOpacity={0.6}
              >
                <ExpandableCalendar
                  firstDay={1}
                  onDayPress={(date)=>{onDateChanged2(date.dateString)}}
                />
                <TimelineList
                  events={eventItemsDay}
                  timelineProps={{
                    format24h: true,
                    overlapEventsSpacing: 7,
                    rightEdgeSpacing: 24,
                    start: 8,
                    end: 23,
                    renderEvent:((item)=>renderEventDay(item))
                  }}
                />
              </CalendarProvider>
            </View>
            ):
            search_flg=="2"?
            (
              <>
              <View style={styles.week_month}>
                <TouchableOpacity
                  style={{marginRight:'auto',paddingHorizontal:15}}
                  onPress={onSwipeRight}
                >
                  <MaterialCommunityIcons
                    name="menu-left"
                    color="#999"
                    size={40}
                  />
                </TouchableOpacity>
                <Text style={styles.week_month_text}>{Moment(date_).format('YYYY年 M月')}</Text>
                <TouchableOpacity
                  style={{marginLeft:'auto',paddingHorizontal:15}}
                  onPress={onSwipeLeft}
                >
                  <MaterialCommunityIcons
                    name="menu-right"
                    color="#999"
                    size={40}
                  />
                </TouchableOpacity>
              </View>
              {/* <GestureRecognizer
                onSwipeLeft={onSwipeLeft}
                onSwipeRight={onSwipeRight}
                config={{ velocityThreshold: 0.3, directionalOffsetThreshold: 80 }}
                style={styles.week_wrapper}
              > */}
              <View style={styles.week_wrapper}>
                <FlatList
                  scrollEnabled={false}
                  data={getWeekDates()}
                  renderItem={({ item,index }) => {
                    const event = getSchedulesForDate(item);
                    return (
                      <View style={[styles.week_container,{height:weekHeight},index==6&&{borderBottomWidth:0}]}>
                        <View style={{alignItems:'center',marginRight:20,width:'15%'}}>
                          <Text style={styles.week_day}>{Moment(item).format('DD')}</Text>
                          <Text style={styles.week_youbi}>{get_youbi(item.getDay())}曜日</Text>
                        </View>
                        {event.length > 0 && (
                          <ScrollView
                            showsVerticalScrollIndicator={true}
                            scrollEnabled={event.length>3?true:false}
                            style={{maxHeight:weekHeight-10}}
                            persistentScrollbar={true}
                            indicatorStyle={'black'}
                          >
                            {event.map((e,i) => (
                              <TouchableOpacity
                                style={styles.week_event}
                                onPress={()=>{
                                  setSub(e);
                                  setModal(true);
                                }}
                                key={i}
                                activeOpacity={0.6}
                              >
                                <View style={{width:'20%',flexDirection:'row',alignItems:'center'}}>
                                  <View style={[styles.week_event_tag,{backgroundColor:COLORS[e.customer_select]},e.name&&{height:30}]}></View>
                                  <Text style={styles.week_event_time}>{Moment(e.day).format('HH:mm')}</Text>
                                </View>
                                <View style={{width:'80%'}}>
                                  <Text style={styles.week_event_text}>
                                    {e.send_check=="1"&&(
                                      <Text style={[styles.week_event_text,{color:'red'}]}>
                                        【済】
                                      </Text>
                                    )}
                                    {e.note}
                                  </Text>
                                  {e.name&&(<Text style={styles.week_event_time}>{e.name}様</Text>)}
                                </View>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        )}
                      </View>
                    );
                  }}
                  keyExtractor={(item) => item}
                  pagingEnabled
                />
              </View>
              {/* </GestureRecognizer> */}
              </>
            ):
            search_flg=="3"?
            (
              <>
              <CalendarList
                date={date_}
                key={theme}
                pastScrollRange={12}
                futureScrollRange={12}
                hideExtraDays={true}
                monthFormat="yyyy年 M月"
                dayComponent={(d,i) => <GoogleCalendarDayItem {...d} eventItems={eventItems} cellMinHeight={cellMinHeight} key={i}/>}
                markingType="custom"
                theme={calendarTheme}
                horizontal={true}
                hideArrows={false}
                pagingEnabled={true}
                weekVerticalMargin={0}
                onVisibleMonthsChange={async(months) => {
                  if (!end) {
                    const selectDate = new Date(date_.getFullYear(),(months[0].month)-1,date_.getDate());
                    setDate_(selectDate);
                    setDate_select(selectDate);
                    await onRefresh(selectDate,null);
                  }
                }}
              />
              <Modal
                isVisible={show_month_events}
                swipeDirection={null}
                backdropOpacity={0.5}
                animationInTiming={300}
                animationOutTiming={500}
                animationIn={'slideInDown'}
                animationOut={'slideOutUp'}
                propagateSwipe={true}
                style={{alignItems: 'center',zIndex:888}}
                onBackdropPress={()=>setShow_month_events(false)}
              >
                <Modal
                  isVisible={modal}
                  swipeDirection={null}
                  backdropOpacity={0.5}
                  animationInTiming={300}
                  animationOutTiming={500}
                  animationIn={'slideInDown'}
                  animationOut={'slideOutUp'}
                  propagateSwipe={true}
                  style={{alignItems: 'center',zIndex:999}}
                  onBackdropPress={()=>setModal(false)}
                >
                  {scheduleList}
                </Modal>
                <View style={styles.month_events}>
                  <TouchableOpacity
                    style={{
                      position: 'absolute',
                      top:8,
                      right:10,
                      zIndex:999
                    }}
                    onPress={()=>setShow_month_events(false)}
                  >
                    <Feather name='x-circle' color='#ccc' size={35} />
                  </TouchableOpacity>
                  <Text style={styles.month_events_date}>{month_events_date}</Text>
                  <ScrollView
                    showsVerticalScrollIndicator={true}
                    persistentScrollbar={true}
                    indicatorStyle={'black'}
                  >
                    {month_events.map((e,i) => (
                      <TouchableOpacity
                        style={styles.week_event}
                        onPress={()=>{
                          setSub(e);
                          setModal(true);
                        }}
                        key={i}
                        activeOpacity={0.6}
                      >
                        <View style={{width:'20%',flexDirection:'row',alignItems:'center'}}>
                          <View style={[styles.week_event_tag,{backgroundColor:COLORS[e.customer_select]},e.name&&{height:30}]}></View>
                          <Text style={styles.week_event_time}>{Moment(e.day).format('HH:mm')}</Text>
                        </View>
                        <View style={{width:'80%'}}>
                          <Text style={styles.week_event_text} numberOfLines={1}>
                            {e.send_check=="1"&&(
                              <Text style={[styles.week_event_text,{color:'red'}]}>
                                【済】
                              </Text>
                            )}
                            {e.note}
                          </Text>
                          {e.name&&(<Text style={styles.week_event_time}>{e.name}様</Text>)}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </Modal>
              </>
            ):(<></>)
          }
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
                previous:'Schedule',
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
                previous:'Schedule',
                withAnimation: true
              }],
            });
          }}
          onPress2={() => {}}
          onPress3={() => {
            navigation.reset({
              index: 0,
              routes: [{
                name: 'TimeLine' ,
                params: route.params,
                websocket:route.websocket,
                websocket2: route.websocket2,
                profile:route.profile,
                previous:'Schedule',
                withAnimation: true
              }],
            });
          }}
          active={[false,false,true,false]}
        />
        <Modal
          isVisible={modal}
          swipeDirection={null}
          backdropOpacity={0.5}
          animationInTiming={300}
          animationOutTiming={500}
          animationIn={'slideInDown'}
          animationOut={'slideOutUp'}
          propagateSwipe={true}
          style={{alignItems: 'center',zIndex:999}}
          onBackdropPress={()=>setModal(false)}
        >
          {scheduleList}
        </Modal>
      </View>
    </SideMenu>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor:'#f1f1f1'
  },
  noschedule :{
    flex:1,
    justifyContent:'center',
    alignItems:'center'
  },
  buttonReloadLabel : {
    fontSize: 16,
    justifyContent:'center',
    alignItems:'center',
    color: "#000000",
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
  sub_title: {
    fontSize: 13,
    color: "#9B9B9B",
    position: "absolute",
    right: 10,
    bottom:10
  },
  buttonContainer: {
    height: 35,
    backgroundColor: "#b3b3b3",
    borderRadius: 4,
    alignSelf: "center",
    justifyContent:'center',
    marginVertical:20
  },
  buttonContainer2: {
    backgroundColor: "#b3b3b3",
    borderRadius: 4,
    marginVertical:10,
  },
  buttonLabel: {
    fontSize: 14,
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
    flexDirection:'row',
    alignItems:'center'
  },
  date: {
    color:'#999',
    fontSize: 14,
    marginLeft:'auto'
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
  date_mdl: {
    width:250,
    height:230,
    backgroundColor:'#fff',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5
  },
  iosdate: {
    width:300,
    height:260,
    backgroundColor:'#333',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5
  },
  listmodal: {
    width:300,
    paddingVertical:20,
    backgroundColor:'#fff',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5
  },
  datalist: {
    backgroundColor:'#fff',
    borderWidth:1,
    borderTopWidth:0,
    borderColor:'#999',
    justifyContent:'center',
    padding:5
  },
  start_day: {
    fontSize:12,
    color:'#777'
  },
  cell: {
    width: '100%',
    borderBottomWidth:1,
    borderColor:'#bfbfbf'
  },
  dayText: {
    textAlign: 'center',
    marginBottom: 2,
  },
  todayText: {
    color: 'blue',
    fontWeight: 'bold',
  },
  event: {
    width: '99%',
    height: 13.5,
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    zIndex: 2,
    justifyContent: 'center',
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventText: {
    color: '#000',
    fontSize: 9,
    fontWeight: '500',
    paddingLeft: 2,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 2,
    shadowOpacity: 0.2,
  },
  holiday: {
    fontSize:8,
    color:'#bfbfbf',
    textAlign:'center'
  },
  checkbox: {
    height:40,
    width: "23.5%",
    borderWidth:2,
    margin: 0,
    marginRight: 0,
    paddingLeft: 10,
    paddingVertical:5,
    borderRadius: 5,
    backgroundColor:'#fff',
    alignItems:'center',
    justifyContent:'center',
    marginLeft:0
  },
  roomheader :{
    width:'100%',
    flexDirection:'row',
    alignItems:'center'
  },
  roommenu: {
    width:Width,
    backgroundColor:'#fff',
    paddingHorizontal:15
  },
  title: {
    fontSize:16,
    color:'#384955',
    fontWeight:'bold',
    marginTop: 20,
  },
  searchLabel: {
    fontSize:12,
    color:'#999'
  },
  radio_box: {
    width:80,
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 5,
    paddingVertical: 0,
    marginTop: 0,
    backgroundColor:'transparent'
  },
  week_month: {
    height:40,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:'#dcdcdc',
    flexDirection:'row'
  },
  week_month_text: {
    fontSize:16,
    textAlign:'center',
    fontWeight:'700'
  },
  week_wrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  week_container: {
    width:Width,
    borderBottomWidth:0.8,
    borderColor:'#999',
    backgroundColor:'#fff',
    alignItems: 'center',
    flexDirection:'row',
    paddingLeft:20,
    paddingRight:10
  },
  week_day: {
    fontSize: 35,
    fontWeight: '800',
    color:'#333'
  },
  week_youbi: {
    fontSize: 12,
    fontWeight: 'bold',
    color:'#999'
  },
  week_event: {
    marginBottom: 7,
    flexDirection:'row',
    alignItems:'center'
  },
  week_event_tag: {
    width:8,
    height:18,
    marginRight:5
  },
  week_event_text: {
    fontSize: 12,
  },
  week_event_time: {
    fontSize:12,
    color:'#999',
  },
  day_event: {
    fontSize:14,
    fontWeight:'700'
  },
  day_event_name: {
    fontSize:12,
  },
  day_event_date :{
    fontSize:12,
    color:'#999'
  },
  month_events: {
    width:"90%",
    backgroundColor:'#fff',
    paddingHorizontal:20,
    paddingBottom:10,
    borderRadius:10,
    maxHeight:600
  },
  month_events_date: {
    paddingTop:20,
    marginBottom:15,
    fontSize:18,
    fontWeight:'700'
  }
});
