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
import DateTimePicker from '@react-native-community/datetimepicker';
import * as SQLite from "expo-sqlite";
import Moment from 'moment';
import Modal from "react-native-modal";
import SideMenu from 'react-native-side-menu-updated';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
let domain = "https://www.total-cloud.net/";

Notifications.setBadgeCountAsync(0);

export default function Schedule(props) {

  const [isLoading, setLoading] = useState(false);

  const { navigation, route } = props;

  const [schedule, setSchedules] = useState([]);
  const [sub, setSub] = useState({
    "customer_id": "",
    "customer_select": "",
    "send_check": "",
    "start_day": "",
    "title": "",
  });
  const [lists, setLists] = useState([]);
  const [modal, setModal] = useState(false);

  const [name, setName] = useState("");

  const [open, setOpen] = useState(false);
  const [staff_value, setStaff_Value] = useState('');
  const [staffs, setStaffs] = useState([]);

  const [bell_count, setBellcount] = useState(null);

  const [menu, setMenu] = useState(false);
  const deviceScreen = Dimensions.get('window');
  
  const listRef = useRef([]);
  
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  var staffList = useMemo(()=>{

    var items = [];

    for (var s=0;s<staffs.length;s++) {
      var item = staffs[s];
      if (item.account != "all") {
        var label = route.params.account == item.account ? '個人' :item.name_1 + "　" + (item.name_2 ? item.name_2 : "");
        var data = {
          label:label,
          value: label=='個人'?'':item.account,
        }
        items.push(data);
      }
    }

    items.unshift({ label: "全体", value: "1" });
    
    return items;

  },[staffs]);
  
  useLayoutEffect(() => {

    navigation.setOptions({
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#1d449a", height: 110 }
        : { backgroundColor: "#fd2c77", height: 110 },
      headerTitle:() => (<Text style={styles.header_name}>スケジュール</Text>),
      headerRight: () => (
        <View style={{marginRight:15}}>
          <View style={bell_count?[styles.bell,{backgroundColor:!global.fc_flg?"red":"blueviolet"}]:{display:'none'}}>
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

          const sl = await GetDB('staff_list');

          if (sl != false) {
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
                  staff: sl,
                  cus_name: cus_data.name,
                  previous:'Schedule'
                },
              ],
            });
          }
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
      });

    return () => {
      BackHandler.addEventListener("hardwareBackPress", true).remove();
      notificationInteractionSubscription.remove();
    };

  }, []);

  async function Display() {

    // ローカルDB用スタッフリスト
    await Insert_staff_list_db();

    await onRefresh();

    await getBELL();

  }

  const onRefresh = useCallback(async() => {

    const startTime = Date.now(); // 開始時間

    const ymd = Moment(date).format("YYYY-MM-DD");
    const schedule = await getSchedule();

    const endTime = Date.now(); // 終了時間
    const time = (endTime - startTime)/1000;
    console.log('onRefreshschedule：'+time + '秒')
    
    if (schedule == false) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    var customer = schedule[0]["customer"];

    var list = {};

    customer :for (const key in customer) {
      if(!customer[key]) {
        delete customer[key];
        continue customer;
      }
      var schedule_list = customer[key];
      schedule_list: for (const key2 in schedule_list) {
        const ymd2 = schedule_list[key2]["start_day"].split(" ")[0];+1
        if (ymd == ymd2) {
          list[key] = schedule_list;
        }
      }
    }

    const newArray = [];

    for (const customerId in list) {
      const customerData = Object.entries(list[customerId]).map(([key, value]) => ({
        key,
        ...value,
      }));
      
      newArray.push({ [customerId]: customerData });
    }
    
    setSchedules(newArray);
    setLoading(false);

  }, [date,staff_value]);
  
  const getSchedule = useCallback(() => {
    
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
          select_day:Moment(date).format("YYYY-MM-DD"),
          customer_flg:staff_value,
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

  }, [date,staff_value]);

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

  // スタッフリスト取得
  async function Insert_staff_list_db() {

    const sl = await GetDB('staff_list');

    if (sl != false) {
      
      setStaffs(sl);
      setStaff_Value('');
      
    } else {
      setStaffs([]);
    }

  }

  const comList = useMemo(() => {

    // 【個人ID】設定No8.同じお客様のスケジュールはまとめて表示制御部分
    var option = false;
    if (((route.params.setting_list).split(",")).includes('8')) {
      option = true;
    }

    if (schedule.length == 0) {
      return (
        <View style={styles.noschedule}>
          <Text style={styles.buttonReloadLabel}>スケジュールはありません</Text>
        </View>
      )
    } else {

      const ymd = Moment(date).format("YYYY-MM-DD");

      var array = [];
      for (const key in schedule) {
        var cus = schedule[key];
        customer: for (const key2 in cus) {
          const data = cus[key2];
          
          for (var c=0;c<data.length;c++) {
            const ymd2 = data[c]["start_day"].split(" ")[0];
            if (ymd == ymd2) {
              array.push(data[c]);
              if (option) continue customer;
            }
          }
        }
      }

      if (array.length == 0) {
        return (
          <View style={styles.noschedule}>
            <Text style={styles.buttonReloadLabel}>スケジュールはありません</Text>
          </View>
        )
      }

      // 時間でソートする
      const sortStartDay = (a, b) => new Date(a.start_day) - new Date(b.start_day);
      array = array.sort(sortStartDay);

      return (
        <FlatList
          ref={listRef}
          initialNumToRender={10}
          data={array}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={styles.ListItem}
                onPress={() => {
                  
                  var array2 = [];
                  for (const key in schedule) {
                    var cus = schedule[key];
                    for (const key2 in cus) {
                      if (key2 == item.customer_id) {
                        const data = cus[key2];
                        for (var c=0;c<data.length;c++) {
                          if (item.title != data[c]["title"] && data[c]["send_check"] != '1') {
                            array2.push(data[c]);
                          }
                        }
                      }
                    }
                  }

                  // 時間でソートする
                  if (array2.length > 0) {
                    const sortStartDay = (a, b) => new Date(a.start_day) - new Date(b.start_day);
                    array2 = array2.sort(sortStartDay);
                  }

                  getName(item.customer_id,item.title);
                  setSub(item);
                  setLists(array2);
                  setModal(true);
                }}
              >
                <View style={styles.ListInner}>
                  <Text style={[{fontSize:16},item.send_check=='1'?{width:'57%'}:{width:'65%'}]}>{item.title}</Text>
                  <Text style={{color:'red',fontSize:14}}>{item.send_check=='1'&&'[済]'}</Text>
                  <Text style={styles.date}>{item.start_day}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item) => `${item.title}`}
        />
      )
    }
  },[schedule])

  const scheduleList = useMemo(() => {

    // 【個人ID】設定No8.同じお客様のスケジュールはまとめて表示制御部分
    var option = false;
    if (((route.params.setting_list).split(",")).includes('8')) {
      option = true;
    }

    return (
      <View style={option?styles.listmodal:styles.listmodal2}>
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
        <View style={{width:'90%',height:'90%',justifyContent:'center'}}>
          <View style={{width:'85%'}}>
            <Text style={{fontSize:16,fontWeight:'500'}}>{sub.title}</Text>
            <Text style={{fontSize:13}}>{sub.start_day}</Text>
          </View>
          <View style={{flexDirection:'row',justifyContent:'center'}}>
            <TouchableOpacity style={styles.buttonContainer2} onPress={()=>check_customer_on_off_db(sub)}>
              <Text style={styles.buttonLabel}>{sub.send_check=='1'?'未完了にする':'完了にする'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.buttonContainer2,{marginLeft:10}]}
              onPress={()=>{
                setModal(false);
                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "TalkScreen",
                      params: route.params,
                      customer: sub.customer_id,
                      websocket: route.websocket,
                      websocket2: route.websocket2,
                      profile: route.profile,
                      staff: staffs,
                      cus_name: name,
                    },
                  ],
                });
              }}
            >
              <Text style={styles.buttonLabel}>トーク画面</Text>
            </TouchableOpacity>
          </View>
          {option&&lists.length>0?(
            <FlatList
              initialNumToRender={10}
              data={lists}
              renderItem={({ item,index }) => {
                return (
                  <View style={[styles.datalist,index==0&&{borderTopWidth:1}]}>
                    <Text style={styles.title}>{item.title}</Text>
                    <Text style={styles.start_day}>{item.start_day}</Text>
                  </View>
                )
              }}
              keyExtractor={(item) => `${item.title}`}
            />
          ):option&&lists.length==0?(
            <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
              <Text style={{color:'#999'}}>他のスケジュールはありません</Text>
            </View>
          )
          :(<></>)}
        </View>
      </View>
    )
  },[lists,name])

  async function getName(id,title) {
    var sql = `select name from customer_mst where customer_id = '${id}';`;
    var customer = await db_select(sql);

    var name_ = '';
    
    if (customer != false) {
      name_ = customer[0]["name"];
    } else {
      name_ = title.split(":")[1];
      if (name_.indexOf('(担当者') != -1) {
        name_ = name_.split("(担当者")[0];
      }
      if (name_.indexOf('【') != -1) {
        name_ = name_.split("【")[0];
      }
    }

    setName(name_);
  }

  async function check_customer_on_off_db(sub) {
    
    const AsyncAlert = async (txt) => new Promise((resolve) => {
      Alert.alert(
        '確認',
        `${sub["title"]}を【${txt}】にしてよろしいですか？`,
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

    var flg = sub.send_check == '1' ? '' : '1';

    let formData = new FormData();
    formData.append('ID',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act','customer_check');
    formData.append('val[app_flg]',1);
    formData.append('val[id]',sub.customer_id);
    formData.append('val[selecter]',sub.customer_select);
    formData.append('val[key]',sub.key);
    formData.append('val[flg]',flg);
    
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
      setLoading(true);
      await onRefresh();
    })
    .catch((error) => {
      console.log(error);
      Alert.alert('エラー','完了に失敗しました');
      setModal(false);
      onRefresh();
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
                  staff: staffs,
                  previous:'Schedule',
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
          <View style={bell_count?[styles.bell2,{backgroundColor:!global.fc_flg?"red":"blueviolet"}]:{display:'none'}}>
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
        <View style={{zIndex: 500,flexDirection:'row'}}>
          <View>
            <DropDownPicker
              style={styles.DropDown}
              dropDownContainerStyle={styles.dropDownContainer}
              open={open}
              value={staff_value}
              items={staffList}
              setOpen={setOpen}
              setValue={setStaff_Value}
              placeholder="▼　担当者"
            />
          </View>
          <TouchableOpacity style={styles.Datebtn} onPress={()=>setShow(true)}>
            <Text style={styles.Datebtn_text}>{Moment(date).format("YYYY-MM-DD")}</Text>
          </TouchableOpacity>
          {(show && Platform.OS === 'android') && (
            <DateTimePicker
              value={date}
              mode={'date'}
              display="default"
              locale={'ja'}
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || date;
                setDate(currentDate);
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
                  value={date}
                  mode={'date'}
                  display="spinner"
                  locale={'ja'}
                  onChange={(event, selectedDate) => {
                    const currentDate = selectedDate || date;
                    setDate(currentDate);
                  }}
                  textColor="#fff"
                />
              </View>
            </Modal>
          )}
          <TouchableOpacity
            style={styles.buttonContainer}
            onPress={()=>{
              setLoading(true);
              onRefresh();
            }}
          >
            <Text style={styles.buttonLabel}>表　示</Text>
          </TouchableOpacity>
        </View>
        <View style={{zIndex: 100,flex:1}}>
          {comList}
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
          active={[false,false,true]}
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
          style={{alignItems: 'center'}}
          onBackdropPress={()=>setModal(false)}
        >
          {scheduleList}
        </Modal>
      </View>
    </SideMenu>
  );
}

const styles = StyleSheet.create({
  header_name: {
    color:'#ffffff',
    fontSize:18,
    fontWeight:'500'
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
    width: 150,
    fontSize: 16,
    height: 40,
    marginLeft: 10,
    marginTop:10,
    marginBottom:20,
  },
  dropDownContainer: {
    width: 150,
    marginLeft: 10,
  },
  Datebtn: {
    width: 100,
    height: 50,
    marginTop:10,
    marginLeft: 10,
    marginBottom:20,
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
    height: 45,
    backgroundColor: "#b3b3b3",
    borderRadius: 4,
    alignSelf: "center",
    marginTop:10,
    marginLeft: 'auto',
    marginRight:10,
    marginBottom:20,
  },
  buttonContainer2: {
    height: 45,
    backgroundColor: "#b3b3b3",
    borderRadius: 4,
    alignSelf: "center",
    marginVertical:10,
  },
  buttonLabel: {
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
    height:300,
    backgroundColor:'#fff',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5
  },
  listmodal2: {
    width:300,
    height:150,
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
  title: {
    fontSize:14,
    color:'#555'
  },
  start_day: {
    fontSize:12,
    color:'#777'
  }
});
