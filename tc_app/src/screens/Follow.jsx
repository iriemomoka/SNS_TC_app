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

  const [follow_all, setFollow_all] = useState([]); // 全件格納用
  const [follow_list, setFollow_list] = useState([]); // 表示用

  const [follower_all, setFollower_all] = useState([]); // 全件格納用
  const [follower_list, setFollower_list] = useState([]); // 表示用

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
      headerTitleAlign: 'center',
      headerTitle: () => (
        <Text style={styles.headertitle}>{route.params.name_1}{route.params.name_2}</Text>
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
          navigation.reset({
            index: 0,
            routes: [{
              name: 'TimeLine' ,
              params: route.params,
              websocket:route.websocket,
              websocket2: route.websocket2,
              profile:route.profile,
              withAnimation: true
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

    var follow_where = (route.follow.follow).map(item => ` account = '${item}' `).join('or');
    var follower_where = (route.follow.follower).map(item => ` account = '${item}' `).join('or');

    var sql = `select * from staff_all where ${follow_where};`;
    var follow = await db_select(sql);
    setFollow_all(follow);
    setFollow_list(follow);

    var sql = `select * from staff_all where ${follower_where};`;
    var follower = await db_select(sql);
    setFollower_all(follower);
    setFollower_list(follower);

    return;

  }, [abortControllerRef]);

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
            </View>
          );
        }}
        keyExtractor={(item) => `${item.account}`}
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
            </View>
          );
        }}
        keyExtractor={(item) => `${item.account}`}
      />
    )

  },[follower_list])

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
