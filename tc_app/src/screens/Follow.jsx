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

export default function Follow(props) {

  const [isLoading, setLoading] = useState(false);

  var { navigation, route } = props;

  route = route.params;
  
  // 0：フォロー中 1：フォロワー
  const [form, setForm] = useState(route.flg?1:0);

  const [follow_my, setFollow_my] = useState({
    "follow_user_list": "",
    "follower_user_list": "",
    "upd_dt": "",
    "user_id": "",
  });

  const [follow_all, setFollow_all] = useState([]); // 全件格納用
  const [follow_list, setFollow_list] = useState([]); // 表示用

  const [follower_all, setFollower_all] = useState([]); // 全件格納用
  const [follower_list, setFollower_list] = useState([]); // 表示用

  const [name, setName] = useState("");

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
      headerTitleAlign: 'center',
      headerTitle: () => (
        <Text style={styles.headertitle}>{route.name_1}{route.name_2}</Text>
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

    const json = await getFollow();

    setFollow_data(json);

    return;

  }, [abortControllerRef]);

  function setFollow_data(json) {
    setFollow_my(json["follow_my"][0]);

    var follow_user_list   = json["follow_my"][0]["follow_user_list"].split(',');
    follow_user_list = follow_user_list.filter(item => item !== "");
    var follower_user_list = json["follow_my"][0]["follower_user_list"].split(',');
    follower_user_list = follower_user_list.filter(item => item !== "");

    var follow_all_follow   = json["follow_all"]["follow"];
    var follow_all_follower = json["follow_all"]["follower"];

    follow_all_follow.forEach(value => 
      value.follow_flg = follow_user_list.includes(value.user_id) ? true : false
    );
    
    follow_all_follower.forEach(value => 
      value.follow_flg = follow_user_list.includes(value.user_id) ? true : false
    );

    setFollow_all(follow_all_follow);
    setFollow_list(follow_all_follow);
    
    setFollower_all(follow_all_follower);
    setFollower_list(follow_all_follower);
  }

  const getFollow = useCallback(() => {
    
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
          act: "follow",
          fc_flg: global.fc_flg,
          user_id:route.user_id,
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

  useEffect(() => {

    if (form == "0") {
      
      var filteredFollow = follow_all.filter(function(item) {
        return (
          (item.name_1 && item.name_1.includes(name)) ||
          (item.name_2 && item.name_2.includes(name)) ||
          (item.shop_name && item.shop_name.includes(name))
        );
      });

  
      setFollow_list(name?filteredFollow:follow_all);

    } else {

      var filteredFollower = follower_all.filter(function(item) {
        return (
          (item.name_1 && item.name_1.includes(name)) ||
          (item.name_2 && item.name_2.includes(name)) ||
          (item.shop_name && item.shop_name.includes(name))
        );
      });
  
      setFollower_list(name?filteredFollower:follower_all);

    }

  }, [name,form]);

  const FollowList = useMemo(() => {

    return (
      <FlatList
        scrollEnabled={false}
        scrollIndicatorInsets={{ right: 1 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
        ref={listRef}
        initialNumToRender={10}
        data={follow_list}
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
              {route.params.account != item.user_id && (
                <TouchableOpacity
                  style={styles.follow}
                  onPress={()=>{setFollow_fetch(1,index)}}
                >
                  <Text style={styles.follow_txt}>{item.follow_flg?"フォロー中":"フォローする"}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        keyExtractor={(item) => `${item.user_id}`}
      />
    )
  },[follow_list,checked])

  const FollowerList = useMemo(() => {

    return (
      <FlatList
        scrollEnabled={false}
        bounces={false}
        ref={listRef2}
        initialNumToRender={10}
        data={follower_list}
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
              {route.params.account != item.user_id && (
                <TouchableOpacity
                  style={styles.follow}
                  onPress={()=>{setFollow_fetch(2,index)}}
                >
                  <Text style={styles.follow_txt}>{item.follow_flg?"フォロー中":"フォローする"}</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        keyExtractor={(item) => `${item.user_id}`}
      />
    )

  },[follower_list])

  async function setFollow_fetch(flg,index) {

    var newList = [];

    if (flg == 1) { // フォロー中
      var newList = [...follow_list];
    } else { // フォロワー
      var newList = [...follower_list];
    }

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `確認`,
        `${newList[index].name_1} ${newList[index].name_2}さんのフォローを解除しますか？`,
        [
          {text: "はい", onPress: () => {resolve(true);}},
          {text: "いいえ", onPress: () => {resolve(false);}, style: "cancel"},
        ]
      );
    });

    if (newList[index]["follow_flg"]) {
      const kaijyo_check = await AsyncAlert();
      if (!kaijyo_check) return;
    }

    newList[index]["follow_flg"] = !newList[index]["follow_flg"];

    if (flg == 1) { // フォロー中
      setFollow_list(newList);
    } else { // フォロワー
      setFollower_list(newList);
    }

    var follow_user_list = follow_my["follow_user_list"].split(',');
    follow_user_list = follow_user_list.filter(item => item !== "");

    var follow_ = "";

    if(newList[index]["follow_flg"]) {
      // フォロー解除
      follow_user_list.push(newList[index]["user_id"]);
      follow_ = follow_user_list.join(",");
    } else {
      //フォロー
      follow_user_list = follow_user_list.filter(item => item !== newList[index]["user_id"]);
      follow_ = follow_user_list.join(",");
    }
    
    fetch(domain + "batch_app/api_system_app.php?" + Date.now(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        ID: route.params.account,
        pass: route.params.password,
        act: "follow",
        fc_flg: global.fc_flg,
        user_id:route.user_id,
        user_id_follower:newList[index]["user_id"],
        upd_flg:1,
        follow:follow_,
        follow_flg:newList[index]["follow_flg"]?1:"",
      }),
    })
    .then((response) => response.json())
    .then((json) => {
      setFollow_data(json);
    })
    .catch((error) => {
      console.log(error);
      Alert.alert("フォローに失敗しました");
    });
    
  }

  const bgc = !global.fc_flg?"#E6F4F1":"#FFF6F5";
  const spc = !global.fc_flg?"#dce6fc":"#ffe8f0";

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
        <TextInput
          style={styles.searchInput}
          value={name}
          onChangeText={(text) => {
            setName(text);
          }}
          placeholder="店舗名、名前が検索できます"
          placeholderTextColor="#b3b3b3"
        />
        <View style={{flexDirection:'row',width:'100%'}}>
          <TouchableOpacity
            onPress={()=>{setForm(0)}}
            style={form==0?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
            activeOpacity={0.8}
          >
            <Text style={styles.tab_txt}>フォロー中</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(1)}}
            style={form==1?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
            activeOpacity={0.8}
          >
            <Text style={styles.tab_txt}>フォロワー</Text>
          </TouchableOpacity>
        </View>
        <View style={{width:"100%",paddingHorizontal:10,paddingVertical:15,backgroundColor:spc}}>
          {form=="0"?FollowList:FollowerList}
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
      </ScrollView>
  </KeyboardAvoidingView>
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
    marginBottom:10,
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
  follow: {
    backgroundColor:'#fff',
    borderWidth:1,
    borderColor:'#999',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginLeft:'auto',
    borderRadius: 100,
    width:90,
    height:25,
    shadowColor: "#999",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity:1,
    shadowRadius:1.5,
    elevation:5
  },
  follow_txt: {
    fontSize:12,
    color:'#999',
    fontWeight:'500'
  },
});
