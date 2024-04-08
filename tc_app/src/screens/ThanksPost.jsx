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
import * as SQLite from "expo-sqlite";
import DropDownPicker, { Item } from "react-native-dropdown-picker";
import { Feather } from "@expo/vector-icons";
import Modal from "react-native-modal";
import Moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';

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

export default function ThanksPost(props) {

  const [isLoading, setLoading] = useState(false);

  var { navigation, route } = props;

  route = route.params;

  const [edit, setEdit] = useState(false);

  // 0：みんなへ 1：あなたへ
  const [form, setForm] = useState(route.flg?1:0);

  const [thank_my, setThank_my] = useState({
    "thank_month": "0",
    "thank_today": "0",
    "thank_yesterday": "0",
  });

  const [giveThanks, setGiveThanks] = useState([]); // 送ったありがとう
  const [getThanks, setGetThanks] = useState([]); // もらったありがとう

  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

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
  
  useLayoutEffect(() => {

    if (AppState.currentState === "active") {
      Notifications.setBadgeCountAsync(0);
    }

    navigation.setOptions({
      headerTitle: () => (
        <>
          <Text style={styles.headertitle}>ありがとう一覧</Text>
          <Text style={styles.headertitle2}>{route.post.name_1} {route.post.name_2}</Text>
        </>
      ),
      headerLeft: () => (
        <Feather
          name='chevron-left'
          color='white'
          size={30}
          onPress={() => {
            navigation.goBack();
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

    const json = await getThanksPost();

    if (json) {

      setThank_my(json["thank_my"]);

      if(json["thanks_post"]["give"]) {
        setGiveThanks(json["thanks_post"]["give"])
      } else {
        setGiveThanks([]);
      }

      if(json["thanks_post"]["get"]) {
        setGetThanks(json["thanks_post"]["get"])
      } else {
        setGetThanks([]);
      }
      
    }

    setLoading(false);

    return;

  }, [abortControllerRef]);

  const endRefresh = useCallback(async() => {

    if (giveThanks.length < 50 && getThanks.length < 50) return;

    setLoading(true);

    const json = await getThanksPost(giveThanks.length,getThanks.length);
    
    if (json != false) {
      if(json["thanks_post"]["give"]) {
        setGiveThanks(giveThanks => [...giveThanks, ...json["thanks_post"]["give"]]);
      }
      if(json["thanks_post"]["get"]) {
        setGetThanks(getThanks => [...getThanks, ...json["thanks_post"]["get"]]);
      }
    }

    setLoading(false);
  });

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
    await onRefresh();
  };

  const getThanksPost = useCallback((page1=0,page2=0) => {
    
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
          act: "thankspost",
          fc_flg: global.fc_flg,
          user_id:route.post.user_id,
          page1:page1,
          page2:page2,
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

  const ThanksList = useMemo(() => {

    return (
      <FlatList
        bounces={true}
        onEndReached={async()=>{await endRefresh()}}
        ref={listRef}
        initialNumToRender={10}
        data={form=="0"?giveThanks:getThanks}
        renderItem={({ item,index }) => {
          return (
            <>
            <View style={styles.ListItem}>
              <View style={styles.ListInner}>
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
                <View>
                  <Text style={styles.shop}>
                    {item.shop_name}
                  </Text>
                  <Text style={styles.name}>
                    {item.name_1}{item.name_2}
                  </Text>
                </View>
                <View style={styles.date_box}>
                  <Text style={styles.date}>
                    {item.ins_dt?item.send_date:''}
                  </Text>
                </View>
              </View>
            </View>
            </>
          );
        }}
        keyExtractor={(item) => `${item.thank_id}`}
      />
    )

  },[giveThanks,getThanks,form])

  const bgc = !global.fc_flg?"#E6F4F1":"#FFF6F5";
  const spc = !global.fc_flg?"#dce6fc":"#ffe8f0";

  return (
    <View style={{ flex: 1,backgroundColor:bgc }} >
      <Loading isLoading={isLoading} />
      <View style={styles.container} >
        <View style={styles.thanks}>
          <Text style={styles.thk_txt}>{route.post.name_1} {route.post.name_2}さんへの{"\n"}ありがとう</Text>
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
        <View style={{flexDirection:'row',width:'100%',zIndex:100}}>
          <TouchableOpacity
            onPress={()=>{setForm(0)}}
            style={form==0?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
            activeOpacity={0.8}
          >
            <Text style={styles.tab_txt}>おくったありがとう</Text>
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
            <Text style={styles.tab_txt}>もらったありがとう</Text>
            <MaterialCommunityIcons
              name={"hand-heart-outline"}
              color={form==1?"#d9376e":"#000"}
              size={20}
            />
          </TouchableOpacity>
        </View>
        <View style={{width:"100%",paddingHorizontal:10,paddingVertical:15,backgroundColor:spc,maxHeight:"75%"}}>
          {ThanksList}
        </View>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headertitle: {
    color:'#fff',
    fontWeight:'700',
    fontSize:18
  },
  headertitle2: {
    color:'#dbdbdb',
    fontWeight:'500',
    fontSize:14
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
    marginBottom:10,
    flexDirection:'row',
  },
  thk_txt: {
    fontSize:14,
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
    fontSize:14,
    fontWeight:'700',
    color:'#333',
  },
  ListItem: {
    width:'100%',
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderColor: "#dddddd",
    borderBottomWidth: 1,
  },
  ListInner: {
    width:'100%',
    flexDirection: "row",
  },
  icon: {
    width:30,
    height:30,
    borderRadius:100,
    marginRight:10,
    backgroundColor:'#eee'
  },
  shop: {
    fontSize: 12,
    fontWeight:'200'
  },
  name: {
    fontSize: 14,
    fontWeight:'500'
  },
  date_box: {
    position: "absolute",
    right: 0,
    top: 0,
    alignItems:'flex-end'
  },
  date: {
    fontSize: Platform.OS === 'ios'? 10 : 12,
    color:'#999',
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
});
