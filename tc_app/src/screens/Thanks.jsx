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

  // 0：申込手続き 1：契約準備 3：契約
  const [form, setForm] = useState(0);

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

    // const json = await getCOM();

    var sql = `select * from staff_all `;

    const testShop = [
      "00001",
      "00002",
      "12345",
      "99999",
      "feides",
    ]

    if (!testShop.includes(route.params.shop_id)) {
      sql += ` where shop_id != '00001' and shop_id != '00002' and shop_id != '12345' and shop_id != '99999' and shop_id != 'feides' ;`;
    }

    var sl = await db_select(sql);
    
    if (sl != false) {

      setLoading(true);

      // thanks:falseを初期値として代入
      sl.forEach(value => value.thanks = false);

      // thank_message:""を初期値として代入
      sl.forEach(value => value.thank_message = "");

      for (var s2=0;s2<sl.length;s2++) {
        var value = sl[s2];
        if (value["staff_photo1"]) {
          const imageUrl = domain+"img/staff_img/"+value["staff_photo1"];
          value["staff_photo1"] = imageUrl;
        }
      }

      setStaffs(sl);

      var onlyShop = sl.filter((item) => item.shop_id == route.params.shop_id );
      setStaff_list(onlyShop);

    }

    const testThanks = [
      {
        name_1: "スタッフ1",
        name_2: "太郎",
        staff_photo1: "",
        shop_name: "賃貸住宅サービスJR東京店",
        shop_id: "00001",
        user_id: "demotc01",
        follow_user_id: "test1",
        send_date: "2024-01-13 15:35:00",
        thank_message: "まじで感謝",
        ins_dt: "2024-01-13 15:35:00",
        upd_dt: "2024-01-13 15:35:00",
      },
      {
        name_1: "スタッフ2",
        name_2: "次郎",
        staff_photo1: "https://www.total-cloud.net/img/staff_img/demotc01-1.jpg",
        shop_name: "賃貸住宅サービスJR東京店",
        shop_id: "99999",
        user_id: "demotc01",
        follow_user_id: "test2",
        send_date: "2024-01-13 15:35:00",
        thank_message: "",
        ins_dt: "2024-01-13 15:35:00",
        upd_dt: "2024-01-13 15:35:00",
      },
      {
        name_1: "スタッフ3",
        name_2: "三郎",
        staff_photo1: "",
        shop_name: "賃貸住宅サービスJR東京店",
        shop_id: "99999",
        user_id: "demotc01",
        follow_user_id: "test3",
        send_date: "2024-01-13 15:35:00",
        thank_message: "コマウォヨ~~~~~~~",
        ins_dt: "2024-01-13 15:35:00",
        upd_dt: "2024-01-13 15:35:00",
      },
    ]

    setThanks_all(testThanks);

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

      if (filter.includes('1')) {
        var onlyShop = thanks_list.filter((item) => item.shop_id == route.params.shop_id );
        setThanks(onlyShop);
      } else {
        setThanks(thanks_list);
      }

    }

  }, [name,form,filter]);

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

  const getCOM = useCallback(() => {
    
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
                    onPress={()=>{
                      Image.getSize({uri:item.staff_photo1}, (width, height) => {
                        setimg_size({width:width,height:height});
                      });
                      setimg(item.staff_photo1);
                      setimg_mdl(true);
                    }}
                    activeOpacity={1}
                  >
                    <Image
                      style={styles.icon}
                      source={{uri:item.staff_photo1}}
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
                  const newItem = { ...item,index:index}
                  setToStaff(newItem);
                  setModal(true);
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
              onPress={()=>{}}
              activeOpacity={1}
            >
              <View style={styles.ListInner2}>
                {item.staff_photo1?
                  (
                    <Image
                      style={styles.icon2}
                      source={{uri:item.staff_photo1}}
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
                  <Text style={styles.message2}>
                    {item.thank_message}
                  </Text>
                </View>
                <Text style={styles.date2}>
                  {item.ins_dt?item.ins_dt:''}
                </Text>
              </View>
            </TouchableOpacity>
            </>
          );
        }}
        keyExtractor={(item) => `${item.follow_user_id}`}
      />
    )
  },[thanks])

  const ChangeFavorite = (index) => {

    let newlist = [...staff_list];

    newlist[index].thanks = !newlist[index].thanks;

    newlist[index].thank_message = thanks_txt;

    setStaff_list(newlist);
    setChecked(!checked);

  }

  const ClearFavorite = (index) => {

    let newlist = [...staff_list];

    newlist[index].thanks = false;
    newlist[index].thank_message = "";

    setStaff_list(newlist);
    setChecked(!checked);

  }

  const closeModal = () => {
    setModal(false);
    setThanks_txt("");
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
      >
        <Text style={styles.label}>あなたのチャレンジや仕事を助けてくれたり、元気を与えてくれたり、安心させてくれた人へメッセージを添えて「ありがとう」を伝えましょう。</Text>
        <View style={styles.thanks}>
          <Text style={styles.thk_txt}>あなたへのありがとう</Text>
          <View style={{marginHorizontal:10,marginLeft:'auto'}}>
            <Text style={styles.label1}>昨日</Text>
            <Text style={styles.thk_num}>4</Text>
          </View>
          <View style={{marginHorizontal:10}}>
            <Text style={styles.label1}>今日</Text>
            <Text style={styles.thk_num}>2</Text>
          </View>
          <View style={{marginHorizontal:10}}>
            <Text style={styles.label1}>今月</Text>
            <Text style={styles.thk_num}>37</Text>
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
            keyboardStatus?Keyboard.dismiss():closeModal()
          }}
          style={{zIndex:999}}
        >
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <TouchableWithoutFeedback
              onPress={()=>Keyboard.dismiss()}
            >
              <View style={styles.modal}>
                <TouchableOpacity
                  style={styles.close}
                  onPress={()=>closeModal()}
                >
                  <Feather name='x-circle' color='gray' size={35} />
                </TouchableOpacity>
                <Text style={styles.modallabel}>{`${toStaff&&toStaff.name_1+" "+toStaff.name_2}さんへありがとうと一緒にメッセージを送りましょう`}</Text>
                <TextInput
                  onChangeText={(text) => setThanks_txt(text)}
                  value={(toStaff&&toStaff.thanks)?toStaff.thank_message:thanks_txt}
                  style={styles.textarea}
                  multiline={true}
                  disableFullscreenUI={true}
                  numberOfLines={11}
                  placeholder={""}
                />
                <TouchableOpacity
                  onPress={()=>{
                    ChangeFavorite(toStaff&&toStaff.index)
                    closeModal();
                  }}
                  style={styles.submit}
                  >
                  <Text style={styles.submitText}>送　信</Text>
                </TouchableOpacity>
                {(toStaff&&toStaff.thanks)&&(
                <TouchableOpacity
                  onPress={()=>{
                    ClearFavorite(toStaff&&toStaff.index);
                    closeModal();
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
    width: 120,
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
  date2: {
    fontSize: Platform.OS === 'ios'? 10 : 12,
    color:'#999',
    position: "absolute",
    right: 0,
    top: 0,
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
