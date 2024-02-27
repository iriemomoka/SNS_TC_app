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
  Keyboard,
  Dimensions,
  TouchableWithoutFeedback,
  Image,
  ScrollView
} from "react-native";
import * as Notifications from "expo-notifications";
import { MaterialCommunityIcons,Ionicons,Octicons } from '@expo/vector-icons';
import SideMenu from 'react-native-side-menu-updated';
import * as SQLite from "expo-sqlite";
import DropDownPicker, { Item } from "react-native-dropdown-picker";
import { Feather } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { CheckBox } from 'react-native-elements';

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

let domain = 'http://family.chinser.co.jp/irie/tc_app/';
// let domain = 'https://www.total-cloud.net/';

Notifications.setBadgeCountAsync(0);

const Width = Dimensions.get("window").width;

export default function Thanks(props) {

  const [isLoading, setLoading] = useState(false);

  const { navigation, route } = props;

  const [edit, setEdit] = useState(false);

  // 0：みんなへ 1：あなたへ
  const [form, setForm] = useState(route.flg?1:0);

  const [thank_my, setThank_my] = useState({
    "thank_month": "0",
    "thank_today": "0",
    "thank_yesterday": "0",
  });

  const [thanks_all, setThanks_all] = useState([]); // 全件格納用
  const [thanks, setThanks] = useState([]); // 表示用

  const [staffs, setStaffs] = useState([]); // 全件格納用
  const [staff_list, setStaff_list] = useState([]); // 表示用

  const [modal, setModal] = useState(false);
  const [toStaff, setToStaff] = useState(null);
  const [thanks_txt, setThanks_txt] = useState("");

  const [name, setName] = useState("");

  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState(['1']);

  const filterList = [
    {label: '自分の店舗のスタッフを表示', value: '1'},
    {label: 'ありがとうを送った人を表示', value: '2'},
  ]

  const [img_mdl, setimg_mdl] = useState(false);
  const [img, setimg] = useState("");
  const [img_size, setimg_size] = useState({width:Width,height:Width});
  
  const [checked, setChecked] = useState(true);

  const listRef = useRef([]);
  const listRef2 = useRef([]);
  
  useLayoutEffect(() => {

    if (AppState.currentState === "active") {
      Notifications.setBadgeCountAsync(0);
    }

    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headertitle}>ありがとう</Text>
      ),
      headerLeft: () => (
        <Feather
          name='chevron-left'
          color='white'
          size={30}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{
                name: route.previous,
                params: route.params,
                websocket:route.websocket,
                websocket2: route.websocket2,
                profile:route.profile,
                previous:'Thanks',
              }],
            });
          }}
          style={{paddingHorizontal:15,paddingVertical:10}}
        />
      ),
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#6C9BCF", height: 110}
        : { backgroundColor: "#FF8F8F", height: 110},
    });

  },[]);
    
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
                  previous:'Timeline'
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
                  previous:'Timeline'
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

    await onRefresh();

    setLoading(false);
  }

  const onRefresh = useCallback(async() => {

    const json = await getThanks();

    if (json) {

      setThank_my(json["thank_my"]);

      var sl = json["thanks_all"];
      sl.forEach(value => value.thanks = value.thank_id ? true : false);
      setStaffs(sl);
  
      var onlyShop = sl.filter((item) => item.shop_id == route.params.shop_id );
      setStaff_list(onlyShop);

      if (json["thank_to_me"] != null) {

        var tm = json["thank_to_me"];

        tm.forEach(obj => {
          obj.thank_message_to_me = obj.thank_message;
          obj.thank_id_to_me = obj.thank_id;
          delete obj.thank_message;
          delete obj.thank_id;
        });

        tm_list: for (var m=0;m<tm.length;m++) {
          var tmItem = tm[m];
          for (var s=0;s<sl.length;s++) {
            var slItem = sl[s];
            if (slItem.account == tmItem.account) {
              tmItem.thanks = slItem.thanks;
              tmItem.thank_message = slItem.thank_message;
              tmItem.thank_id = slItem.thank_id;
              continue tm_list;
            } else {
              tmItem.thanks = false;
              tmItem.thank_message = "";
              tmItem.thank_id = "";
            }
          }
        }

        setThanks_all(tm);
        setThanks(tm);
      }
    }

    setLoading(false);

    return;

  }, [abortControllerRef]);

  useEffect(() => {

    if (form == "0") {
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
  
      const staff_list = name?filteredStaffs:staffs;
      var newStaffList = [];
  
      if (filter.includes('1')) {
        newStaffList = staff_list.filter((item) => item.shop_id == route.params.shop_id );
      } else {
        newStaffList = staff_list;
      }

      if (filter.includes('2')) {
        const newStaffList2 = newStaffList.filter((item) => item.thanks == true );
        setStaff_list(newStaffList2);
      } else {
        setStaff_list(newStaffList);
      }

    } else {

      var filteredStaffs = thanks_all.filter(function(item) {
        return (
          (item.name_1 && item.name_1.includes(name)) ||
          (item.name_2 && item.name_2.includes(name)) ||
          (item.shop_name && item.shop_name.includes(name))
        );
      });
  
      const thanks_list = name?filteredStaffs:thanks_all;
      var newThankList = [];

      if (filter.includes('1')) {
        newThankList = thanks_list.filter((item) => item.shop_id == route.params.shop_id );
      } else {
        newThankList = thanks_list
      }

      if (filter.includes('2')) {
        var newThankList2 = newThankList.filter((item) => item.thanks == true );
        setThanks(newThankList2);
      } else {
        setThanks(newThankList);
      }

    }

  }, [name,form,filter,staffs,thanks_all]);

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
    console.log('バックグラウンドになりました3');
    abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
  };

  const resumeFetchWithDelay = async() => {
    await onRefresh(false);
  };

  const getThanks = useCallback(() => {
    
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
          act: "thanks",
          fc_flg: global.fc_flg,
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

  const SendList = useMemo(() => {

    return (
      <FlatList
        scrollEnabled={false}
        scrollIndicatorInsets={{ right: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        ref={listRef}
        initialNumToRender={10}
        data={staff_list}
        renderItem={({ item,index }) => {
          return (
            <View style={styles.ListItem}>
              {item.staff_photo1?
                (
                  <TouchableOpacity
                    onPress={async()=>{
                      const {imgWidth, imgHeight} = await new Promise((resolve) => {
                        Image.getSize(domain+"img/staff_img/"+item.staff_photo1, (width, height) => {
                          resolve({imgWidth: width, imgHeight: height});
                        });
                      });

                      setimg_size({width:imgWidth,height:imgHeight});
                      setimg(domain+"img/staff_img/"+item.staff_photo1);
                      setimg_mdl(true);
                    }}
                    activeOpacity={1}
                  >
                    <Image
                      style={styles.icon}
                      source={{uri:domain+"img/staff_img/"+item.staff_photo1}}
                    />
                  </TouchableOpacity>
                ):(
                  <Image
                    style={styles.icon}
                    source={require('../../assets/photo4.png')}
                  />
                )
              }
              <View style={styles.ListInner}>
                <Text style={[styles.shop,item.invisible&&{color:"#999"}]} numberOfLines={1}>
                  {item.shop_name}
                </Text>
                <Text style={[styles.name,item.invisible&&{color:"#999"}]} numberOfLines={1}>
                  {item.name_1}{item.name_2}
                </Text>
              </View>
              <TouchableOpacity
                style={{flexDirection:'row'}}
                activeOpacity={1}
                onPress={()=>{
                  setToStaff(item);
                  setModal(true);
                  setThanks_txt(item?item.thank_message:"");
                }}
              >
                <MaterialCommunityIcons
                  name={item.thanks?"heart":"heart-outline"}
                  color={item.thanks?"#F23D3D":"#b3b3b3"}
                  size={30}
                />
              </TouchableOpacity>
            </View>
          );
        }}
        keyExtractor={(item) => `${item.account}`}
      />
    )
  },[staff_list,checked])

  const ThanksList = useMemo(() => {

    if (thanks == null || thanks.length == 0) {
      return (
        <View style={{flex:1,height:150,justifyContent:'center',alignItems:'center'}}>
          <Text style={{color:"#999"}}>あなたへのありがとうはまだありません</Text>
        </View>
      )
    } else {
      return (
        <FlatList
          scrollEnabled={false}
          bounces={false}
          ref={listRef2}
          initialNumToRender={10}
          data={thanks}
          renderItem={({ item,index }) => {
            return (
              <>
              <TouchableOpacity
                style={styles.ListItem2}
                onPress={()=>{
                  setToStaff(item);
                  setModal(true);
                  setThanks_txt(item?item.thank_message:"");
                }}
                activeOpacity={0.8}
              >
                <View style={styles.ListInner2}>
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
                  <View>
                    <Text style={styles.shop2}>
                      {item.shop_name}
                    </Text>
                    <Text style={styles.name2}>
                      {item.name_1}{item.name_2}
                    </Text>
                  </View>
                  <View style={styles.date2_box}>
                    <Text style={styles.date2}>
                      {item.ins_dt?item.send_date:''}
                    </Text>
                    <Text style={[styles.thanks2,{color:item.thanks?"#999":'#f59898'}]}>
                      {item.thanks?"ありがとう送信済":"ありがとう未送信"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.message2}>
                  {item.thank_message_to_me}
                </Text>
              </TouchableOpacity>
              </>
            );
          }}
          keyExtractor={(item) => `${item.follow_user_id}`}
        />
      )
    }

  },[thanks])

  const ChangeFavorite = (item) => {

    fetch(domain + "batch_app/api_system_app.php?" + Date.now(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        ID: route.params.account,
        pass: route.params.password,
        act: "thanks",
        fc_flg: global.fc_flg,
        thanks_flg:1,
        thank_id:item.thank_id,
        user_id:item.account,
        thank_message:thanks_txt,
      }),
    })
    .then((response) => response.json())
    .then((json) => {
      if (json) {
        var sl = json["thanks_all"];
        sl.forEach(value => value.thanks = value.thank_id ? true : false);
        setStaffs(sl);

        if (json["thank_to_me"] != null) {
  
          var tm = json["thank_to_me"];
  
          tm.forEach(obj => {
            obj.thank_message_to_me = obj.thank_message;
            obj.thank_id_to_me = obj.thank_id;
            delete obj.thank_message;
            delete obj.thank_id;
          });
  
          tm_list: for (var m=0;m<tm.length;m++) {
            var tmItem = tm[m];
            for (var s=0;s<sl.length;s++) {
              var slItem = sl[s];
              if (slItem.account == tmItem.account) {
                tmItem.thanks = slItem.thanks;
                tmItem.thank_message = slItem.thank_message;
                tmItem.thank_id = slItem.thank_id;
                continue tm_list;
              } else {
                tmItem.thanks = false;
                tmItem.thank_message = "";
                tmItem.thank_id = "";
              }
            }
          }
          setThanks_all(tm);
        }
      }
    })
    .catch((error) => {
      console.log(error);
      Alert.alert("ありがとうに失敗しました");
    });
    
    setChecked(!checked);

  }

  const ClearFavorite = async(item) => {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `確認`,
        `${item.name_1} ${item.name_2}さんへのありがとうを取り消しますか？`,
        [
          {text: "はい", onPress: () => {resolve(true);}},
          {text: "いいえ", onPress: () => {resolve(false);}, style: "cancel"},
        ]
      );
    });

    const thanks_check = await AsyncAlert();
    if (!thanks_check) return;

    fetch(domain + "batch_app/api_system_app.php?" + Date.now(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        ID: route.params.account,
        pass: route.params.password,
        act: "thanks",
        fc_flg: global.fc_flg,
        thanks_clear_flg:1,
        thank_id:item.thank_id,
      }),
    })
    .then((response) => response.json())
    .then((json) => {
      if (json) {
        var sl = json["thanks_all"];
        sl.forEach(value => value.thanks = value.thank_id ? true : false);
        setStaffs(sl);

        if (json["thank_to_me"] != null) {

          var tm = json["thank_to_me"];

          tm.forEach(obj => {
            obj.thank_message_to_me = obj.thank_message;
            obj.thank_id_to_me = obj.thank_id;
            delete obj.thank_message;
            delete obj.thank_id;
          });

          tm_list: for (var m=0;m<tm.length;m++) {
            var tmItem = tm[m];
            for (var s=0;s<sl.length;s++) {
              var slItem = sl[s];
              if (slItem.account == tmItem.account) {
                tmItem.thanks = slItem.thanks;
                tmItem.thank_message = slItem.thank_message;
                tmItem.thank_id = slItem.thank_id;
                continue tm_list;
              } else {
                tmItem.thanks = false;
                tmItem.thank_message = "";
                tmItem.thank_id = "";
              }
            }
          }

          setThanks_all(tm);
        }
      }
      closeModal();
    })
    .catch((error) => {
      console.log(error);
      Alert.alert("ありがとう取消に失敗しました");
      closeModal();
    });
    
    setChecked(!checked);

  }

  const closeModal = async(check_flg = false) => {
    
    if (check_flg && edit) {
      const AsyncAlert = async () => new Promise((resolve) => {
        Alert.alert(
          `確認`,
          `入力した内容を保存せずに閉じていいですか？`,
          [
            {text: "はい", onPress: () => {resolve(true);}},
            {text: "いいえ", onPress: () => {resolve(false);}, style: "cancel"},
          ]
        );
      });
  
      const modal_check = await AsyncAlert();
      if (!modal_check) return;
    }

    setModal(false);
    setThanks_txt("");
    setEdit(false);
  }

  const [keyboardStatus, setKeyboardStatus] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardStatus(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardStatus(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const bgc = !global.fc_flg?"#E6F4F1":"#FFF6F5";
  const spc = !global.fc_flg?"#dce6fc":"#ffe8f0";
  const chk = !global.fc_flg?"#81aee6":"#e6c4f5";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1,backgroundColor:bgc }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -50}
    >
      <Loading isLoading={isLoading} />
      <ScrollView
        style={styles.container}
        showsHorizontalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
      >
        <Text style={styles.label}>あなたのチャレンジや仕事を助けてくれたり、元気を与えてくれたり、安心させてくれた人へメッセージを添えて「ありがとう」を伝えましょう。</Text>
        <View style={styles.thanks}>
          <Text style={styles.thk_txt}>あなたへのありがとう</Text>
          <View style={{marginHorizontal:10,marginLeft:'auto'}}>
            <Text style={styles.label1}>昨日</Text>
            <Text style={styles.thk_num}>{thank_my.thank_yesterday}</Text>
          </View>
          <View style={{marginHorizontal:10}}>
            <Text style={styles.label1}>今日</Text>
            <Text style={styles.thk_num}>{thank_my.thank_today}</Text>
          </View>
          <View style={{marginHorizontal:10}}>
            <Text style={styles.label1}>今月</Text>
            <Text style={styles.thk_num}>{thank_my.thank_month}</Text>
          </View>
        </View>
        <TextInput
          style={styles.searchInput}
          value={name}
          onChangeText={(text) => {
            setName(text);
          }}
          placeholder="店舗名、名前が検索できます"
          placeholderTextColor="#b3b3b3"
        />
        <DropDownPicker
          style={styles.DropDown}
          dropDownContainerStyle={styles.dropDownContainer}
          open={open}
          value={filter}
          items={filterList}
          setOpen={setOpen}
          setValue={setFilter}
          placeholder="フィルター"
          multipleText="フィルター"
          multiple={true}
          TickIconComponent={()=><MaterialCommunityIcons name={"check-circle"} color={chk} size={20} />}
          disableBorderRadius={false}
        />
        <View style={{flexDirection:'row',width:'100%'}}>
          <TouchableOpacity
            onPress={()=>{setForm(0)}}
            style={form==0?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
            activeOpacity={0.8}
          >
            <Text style={styles.tab_txt}>みんなへ</Text>
            <MaterialCommunityIcons
              name={"mother-heart"}
              color={form==0?"#d9376e":"#000"}
              size={20}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(1)}}
            style={form==1?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
            activeOpacity={0.8}
          >
            <Text style={styles.tab_txt}>あなたへ</Text>
            <MaterialCommunityIcons
              name={"hand-heart-outline"}
              color={form==1?"#d9376e":"#000"}
              size={20}
            />
          </TouchableOpacity>
        </View>
        <View style={{width:"100%",paddingHorizontal:10,paddingVertical:15,backgroundColor:spc}}>
          {form=="0"?SendList:ThanksList}
        </View>
        <Modal
          isVisible={modal}
          backdropOpacity={0.5}
          animationInTiming={300}
          animationOutTiming={500}
          animationIn={'slideInDown'}
          animationOut={'slideOutUp'}
          onBackdropPress={()=>{
            keyboardStatus?Keyboard.dismiss():closeModal(true)
          }}
          style={{zIndex:999}}
        >
          <KeyboardAvoidingView behavior={"position"} keyboardVerticalOffset={30}>
            <TouchableWithoutFeedback
              onPress={()=>Keyboard.dismiss()}
            >
              <View style={styles.modal}>
                <TouchableOpacity
                  style={styles.close}
                  onPress={()=>closeModal(true)}
                >
                  <Feather name='x-circle' color='gray' size={35} />
                </TouchableOpacity>
                <Text style={styles.modallabel}>{`${toStaff&&toStaff.name_1+" "+toStaff.name_2}さんへありがとうと一緒にメッセージを送りましょう`}</Text>
                <TextInput
                  onChangeText={(text) => {
                    if (text) setEdit(true);
                    setThanks_txt(text);
                  }}
                  value={thanks_txt}
                  style={styles.textarea}
                  multiline={true}
                  disableFullscreenUI={true}
                  numberOfLines={11}
                  placeholder={""}
                />
                <TouchableOpacity
                  onPress={()=>{
                    ChangeFavorite(toStaff)
                    closeModal();
                  }}
                  style={styles.submit}
                  >
                  <Text style={styles.submitText}>送　信</Text>
                </TouchableOpacity>
                {(toStaff&&toStaff.thanks)&&(
                <TouchableOpacity
                  onPress={()=>{
                    ClearFavorite(toStaff);
                  }}
                  style={[styles.submit,{backgroundColor:"#a6a6a6",borderBottomColor:"#8c8c8c",marginTop:5}]}
                  >
                  <Text style={styles.submitText}>取り消す</Text>
                </TouchableOpacity>
                )}
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
        <Modal
          isVisible={img_mdl}
          swipeDirection={['up']}
          onSwipeComplete={()=>setimg_mdl(false)}
          backdropOpacity={1}
          animationInTiming={100}
          animationOutTiming={300}
          animationIn={'fadeIn'}
          animationOut={'fadeOut'}
          propagateSwipe={true}
          transparent={true}
          onBackdropPress={()=>setimg_mdl(false)}
          style={{alignItems:'center',zIndex:999}}
        >
          <TouchableOpacity
            style={styles.clsbtn}
            onPress={()=>setimg_mdl(false)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="close-circle"
              color="#999"
              size={30}
            />
          </TouchableOpacity>
          <View style={{width:Width,height:Width / (img_size.width / img_size.height)}}>
            <Image
              style={{width:"100%",height:"100%"}}
              source={{uri:img}}
            />
          </View>
        </Modal>
        <View style={{height:80}}>
        </View>
      </ScrollView>
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
    padding:10
  },
  label: {
    color:"#666",
    marginTop: 10,
    marginBottom:5,
    marginLeft:5,
    fontSize:14,
    fontWeight:'500'
  },
  thanks: {
    width:"100%",
    minHeight:70,
    paddingHorizontal:10,
    paddingVertical:15,
    backgroundColor:"#FFAB76",
    borderRadius:10,
    alignItems:'center',
    shadowColor: "#666",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5,
    marginVertical:10,
    flexDirection:'row',
  },
  thk_txt: {
    fontSize:16,
    color:'#fff',
    fontWeight:'500'
  },
  label1: {
    fontSize:12,
    color:'#fff',
    textAlign:'center',
    fontWeight:'500',
  },
  thk_num: {
    fontSize:25,
    color:'#fff',
    fontWeight:'700',
    textAlign:'center'
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
  check: {
    flexDirection:'row',
    width:'100%',
    marginBottom:5,
    alignItems:'center',
  },
  checkbox: {
    margin: 0,
    marginLeft: 5,
    marginRight: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    height:30,
    justifyContent:'center',
    backgroundColor:'transparent',
  },
  checktxt: {
    color:"#666",
    fontSize:12,
    fontWeight:'500',
    marginLeft:3
  },
  DropDown: {
    width: 130,
    fontSize: 16,
    minHeight: 35,
    marginVertical:5,
    marginLeft:'auto',
    backgroundColor:'#ededed',
    borderColor:'#bfbfbf'
  },
  dropDownContainer: {
    width: 250,
    position:'absolute',
    right:0,
    top:45,
    borderColor:'#999'
  },
  active_tab: {
    width:"50%",
    height:50,
    justifyContent: 'center',
    alignItems:'center',
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
    flexDirection:'row'
  },
  inactivetab: {
    width:"50%",
    height:50,
    justifyContent: 'center',
    alignItems:'center',
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
    backgroundColor:'#b8b8b8',
    flexDirection:'row'
  },
  tab_txt: {
    fontSize:16,
    fontWeight:'700',
    color:'#333',
    letterSpacing: 3
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
  shop: {
    fontSize: 12,
  },
  name: {
    fontSize: 16,
  },
  ListItem2: {
    width:'100%',
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderColor: "#dddddd",
    borderBottomWidth: 1,
  },
  ListInner2: {
    width:'100%',
    flexDirection: "row",
  },
  icon2: {
    width:30,
    height:30,
    borderRadius:100,
    marginRight:10,
    backgroundColor:'#eee'
  },
  shop2: {
    fontSize: 10,
    fontWeight:'200'
  },
  name2: {
    fontSize: 11,
    fontWeight:'500'
  },
  date2_box: {
    position: "absolute",
    right: 0,
    top: 0,
    alignItems:'flex-end'
  },
  thanks2: {
    fontSize: 10,
    fontWeight:'400',
  },
  date2: {
    fontSize: Platform.OS === 'ios'? 10 : 12,
    color:'#999',
  },
  message2: {
    marginTop:10,
    fontSize: 14,
    color: "#333",
  },
  clsbtn: {
    position:'absolute',
    top:20,
    left:-20,
    width:60,
    height:60,
    justifyContent:'center',
    alignItems:'center',
  },
  modal: {
    justifyContent: 'center',
    backgroundColor: "#ffffff",
    width:'100%',
    padding:10,
    paddingTop:20,
    borderRadius: 5,
  },
  modallabel: {
    color:"#666",
    marginBottom:10,
    marginLeft:5,
    fontSize:14,
    fontWeight:'500',
    maxWidth:250
  },
  textarea: {
    width:'100%',
    height:200,
    padding:8,
    borderColor: '#999',
    fontSize:16,
    borderWidth: 1,
    borderRadius: 8,
    textAlignVertical: 'top'
  },
  close: {
    position: 'absolute',
    top:0,
    right:0,
    width:50,
    height:50,
    justifyContent:'center',
    alignItems:'center',
    zIndex:1000
  },
  submit:{
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop:10,
    borderRadius: 8,
    width:"100%",
    height:40,
    backgroundColor:"#81aee6",
    borderBottomColor:"#6c93c4",
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
  submitText: {
    fontSize:16,
    color:'#ffffff',
    fontWeight:"600"
  },
});
