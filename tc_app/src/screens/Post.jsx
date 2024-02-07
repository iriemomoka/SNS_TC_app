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
import { useHeaderHeight } from '@react-navigation/elements';
import Constants from 'expo-constants';
import { Feather } from "@expo/vector-icons";
import Modal from "react-native-modal";
import * as ImagePicker from 'expo-image-picker';

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

export default function Post(props) {

  const [isLoading, setLoading] = useState(false);

  const { navigation, route } = props;

  const [modal, setModal] = useState(false);

  // 1:返信 2:ありがとう
  const [modal_flg, setModal_flg] = useState("1");

  const [postCM, setPostCM] = useState('');
  const [thanks, setThanks] = useState('');

  const [Comment, setComment] = useState([]);

  const [TLimg_mdl, setTLimg_mdl] = useState(false);
  const [TLimg, setTLimg] = useState("");
  const [TLimg_size, setTLimg_size] = useState({width:Width,height:Width});
  
  const [checked, setChecked] = useState(true);
  
  const [challenge, setChallenge] = useState({
    challenge_id: "",
    user_id: "",
    challenge_dt: "",
    challenge_content: "",
    challenge_result: 0,
    feeling_today: "",
    word_count: "",
    del_flg: "",
    ins_dt: "",
    upd_dt: "",
  });

  const listRef = useRef([]);
  
  useLayoutEffect(() => {

    if (AppState.currentState === "active") {
      Notifications.setBadgeCountAsync(0);
    }

    navigation.setOptions({
      headerTitle: () => (
        <Text style={styles.headertitle}>{route.flg=="1"?"ポスト":"プロフィール"}</Text>
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
                name: 'TimeLine' ,
                params: route.params,
                websocket:route.websocket,
                websocket2: route.websocket2,
                profile:route.profile,
                previous:'Post',
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

    setLoading(true);

    const json = await getPost();

    if (json) {
      if (route.flg == 1) {
        setComment(json["comment"]);
      } else if (route.flg == 2) {
        var posts = json["post"];
        posts.forEach(item => {
          item.name_1 = route.post.name_1;
          item.name_2 = route.post.name_2;
          item.shop_name = route.post.shop_name;
          item.staff_photo1 = route.post.staff_photo1;
        });
        setComment(posts);
        
        if(json["challenge"]) {
          setChallenge(json["challenge"][0]);
        }
      }
    }

    setLoading(false);

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

  const getPost = useCallback(() => {
    
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
          act: "post",
          fc_flg: global.fc_flg,
          flg:route.flg,
          post_data:route.post
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

  const CommentList = useMemo(() => {

    return (
      <View style={[{paddingHorizontal:10,marginBottom:240},route.flg == 2&&{marginTop:10}]}>
        <FlatList
          ref={listRef}
          initialNumToRender={10}
          data={Comment}
          renderItem={({ item,index }) => {

            var nice_list = [];
            if (item.nice_list != "") {
              nice_list = item.nice_list.split(",");
            }

            const fav = nice_list.includes(route.params.account);

            if (!item.del_flg) {
              return (
                <>
                <TouchableOpacity
                  style={styles.ListItem}
                  onPress={()=>{}}
                  activeOpacity={1}
                >
                  <View style={styles.ListInner}>
                    {item.staff_photo1?
                      (
                        <Image
                          style={styles.icon}
                          source={{uri:domain+"img/staff_img/"+item.staff_photo1}}
                        />
                      ):(
                        <Image
                          style={styles.icon}
                          source={require('../../assets/photo4.png')}
                        />
                      )
                    }
                    <View>
                      <Text style={styles.name}>
                        {item.name_1}{item.name_2}
                      </Text>
                      <Text style={styles.message}>
                        {route.flg == 1?item.comment_note:item.timeline_note}
                      </Text>
                    </View>
                    <Text style={styles.date}>
                      {item.ins_dt?item.ins_dt:''}
                    </Text>
                  </View>
                  {route.flg == 2 && item.timeline_img&&(
                    <TouchableOpacity
                      onPress={()=>{
                        Image.getSize({uri:item.timeline_img}, (width, height) => {
                          setTLimg_size({width:width,height:height});
                        });
                        setTLimg(item.timeline_img);
                        setTLimg_mdl(true);
                      }}
                      activeOpacity={1}
                    >
                    <Image
                      style={styles.timeline_img}
                      source={{uri:item.timeline_img}}
                    />
                    </TouchableOpacity>
                  )}
                  <View style={styles.score}>
                    <TouchableOpacity
                      style={{flexDirection:'row'}}
                      activeOpacity={1}
                      onPress={()=>ChangeFavorite(index,fav)}
                    >
                      <MaterialCommunityIcons
                        name={fav?"heart":"heart-outline"}
                        color={fav?"#F23D3D":"#b3b3b3"}
                        size={18}
                      />
                      <Text style={styles.score_text}>
                        {item.nice_all}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
                </>
              );
            }
          }}
          keyExtractor={(item) => `${route.flg == 1?item.comment_id:item.timeline_id}`}
        />
      </View>
    )
  },[Comment,checked])

  const ChangeFavorite = (index,fav) => {

    let newlist = [...Comment];

    if (fav) {
      if (newlist[index].nice_list != "") {
        var nice_list = newlist[index].nice_list.split(",");
      } else {
        var nice_list = [];
      }
      const del_nice  = nice_list.filter(item => item !== route.params.account);
      const new_nice  = del_nice.join(",");
      newlist[index].nice_list = new_nice;

      const nice_all = newlist[index].nice_all;
      if (nice_all > 0) {
        newlist[index].nice_all = nice_all - 1;
      } else {
        newlist[index].nice_all = 1;
      }
    } else {
      if (newlist[index].nice_list != "") {
        var nice_list = newlist[index].nice_list.split(",");
      } else {
        var nice_list = [];
      }
      nice_list.push(route.params.account);
      const new_nice  = nice_list.join(",");
      newlist[index].nice_list = new_nice;

      const nice_all = newlist[index].nice_all;
      if (nice_all > 0) {
        newlist[index].nice_all = nice_all + 1;
      } else {
        newlist[index].nice_all = 1;
      }
    }

    setComment(newlist);
    setChecked(!checked);
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
  const rsl = !global.fc_flg?"#00A0F3":"#ff4f4f";

  const btn = !global.fc_flg?"#81aee6":"#e6c4f5";
  const bbc = !global.fc_flg?"#6c93c4":"#c4a3d4";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -50}
    >
      <View style={[styles.container,{backgroundColor:bgc}]}>
        <Loading isLoading={isLoading} />
        {route.flg == 1?(
          <>
          <View style={styles.post}>
            <View style={styles.postItem}>
              <View style={styles.ListInner}>
                {route.post.staff_photo1?
                  (
                    <Image
                      style={styles.icon}
                      source={{uri:domain+"img/staff_img/"+route.post.staff_photo1}}
                    />
                  ):(
                    <Image
                      style={styles.icon}
                      source={require('../../assets/photo4.png')}
                    />
                  )
                }
                <View>
                  <Text style={styles.shop}>
                    {route.post.shop_name}
                  </Text>
                  <Text style={styles.name}>
                    {route.post.name_1}{route.post.name_2}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.follow,{backgroundColor:rsl}]}
                  onPress={()=>{}}
                >
                  <Text style={styles.follow_txt}>フォローする</Text>
                </TouchableOpacity>
              </View>
              <Text style={[styles.message,{fontSize:17,marginVertical:15}]}>
                {route.post.timeline_note}
              </Text>
              {route.post.timeline_img&&(
                <TouchableOpacity
                  onPress={()=>{
                    Image.getSize({uri:route.post.timeline_img}, (width, height) => {
                      setTLimg_size({width:width,height:height});
                    });
                    setTLimg(route.post.timeline_img);
                    setTLimg_mdl(true);
                  }}
                  activeOpacity={1}
                >
                <Image
                  style={styles.timeline_img}
                  source={{uri:route.post.timeline_img}}
                />
                </TouchableOpacity>
              )}
              <View style={styles.score}>
                <TouchableOpacity
                  style={{flexDirection:'row'}}
                  activeOpacity={1}
                  onPress={()=>{
                    setModal_flg("1")
                    setModal(true);
                  }}
                >
                  <MaterialCommunityIcons
                    name="chat-outline"
                    color={"#b3b3b3"}
                    size={18}
                  />
                  <Text style={styles.score_text}>
                    {route.post.comment_all}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{flexDirection:'row'}}
                  activeOpacity={1}
                  onPress={()=>ChangeFavorite(index,route.post.fav)}
                >
                  <MaterialCommunityIcons
                    name={route.post.fav?"heart":"heart-outline"}
                    color={route.post.fav?"#F23D3D":"#b3b3b3"}
                    size={18}
                  />
                  <Text style={styles.score_text}>
                    {route.post.nice_all}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.date}>
                  {route.post.ins_dt?route.post.ins_dt:''}
                </Text>
              </View>
            </View>
          </View>
          </>
        ):(
          <View style={styles.post}>
            <View style={styles.postItem}>
              <View style={styles.ListInner}>
                {route.post.staff_photo1?
                  (
                    
                      <TouchableOpacity
                      onPress={()=>{
                        Image.getSize({uri:domain+"img/staff_img/"+route.post.staff_photo1}, (width, height) => {
                          setTLimg_size({width:width,height:height});
                        });
                        setTLimg(domain+"img/staff_img/"+route.post.staff_photo1);
                        setTLimg_mdl(true);
                      }}
                      activeOpacity={1}
                    >
                      <Image
                        style={styles.icon2}
                        source={{uri:domain+"img/staff_img/"+route.post.staff_photo1}}
                      />
                    </TouchableOpacity>
                  ):(
                    <Image
                      style={styles.icon2}
                      source={require('../../assets/photo4.png')}
                    />
                  )
                }
                <View>
                  <Text style={styles.shop2}>
                    {route.post.shop_name}
                  </Text>
                  <Text style={styles.name2}>
                    {route.post.name_1}{route.post.name_2}
                  </Text>
                  {route.params.account != route.post.user_id && (
                    <View style={{flexDirection:'row',justifyContent:'center',marginTop:8}}>
                      <TouchableOpacity
                        style={[styles.follow2,{borderColor:rsl,backgroundColor:'#fff',borderWidth:1.5}]}
                        onPress={()=>{
                          setModal_flg("2")
                          setModal(true);
                        }}
                      >
                        <Text style={[styles.follow2_txt,{color:rsl}]}>ありがとう送信</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.follow2,{backgroundColor:rsl,marginLeft:5}]}
                        onPress={()=>{}}
                      >
                        <Text style={styles.follow2_txt}>フォローする</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </View>
              <Text style={styles.label}>今日のチャレンジ</Text>
              <Text style={styles.challenge}>{challenge.challenge_content}</Text>
            </View>
          </View>
        )}
        {CommentList}
        <Modal
          isVisible={modal}
          backdropOpacity={0.5}
          animationInTiming={300}
          animationOutTiming={500}
          animationIn={'slideInDown'}
          animationOut={'slideOutUp'}
          onBackdropPress={()=>{
            keyboardStatus?Keyboard.dismiss():setModal(false)
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
                  onPress={()=>setModal(false)}
                >
                  <Feather name='x-circle' color='gray' size={35} />
                </TouchableOpacity>
                <Text style={styles.modallabel}>{modal_flg=="1"?"コメント":`${route.post.name_1}${route.post.name_2}さんへありがとうを送る`}</Text>
                <TextInput
                  onChangeText={(text) => {
                    modal_flg=="1"?
                    setPostCM(text):
                    setThanks(text);
                  }}
                  value={modal_flg=="1"?postCM:thanks}
                  style={styles.textarea}
                  multiline={true}
                  disableFullscreenUI={true}
                  numberOfLines={11}
                  placeholder={modal_flg=="1"?"返信をポスト":""}
                />
                <TouchableOpacity
                  onPress={()=>setModal(false)}
                  style={styles.submit}
                  >
                  <Text style={styles.submitText}>{modal_flg == "1"?"投　稿":"送　信"}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </Modal>
        <Modal
          isVisible={TLimg_mdl}
          swipeDirection={['up']}
          onSwipeComplete={()=>setTLimg_mdl(false)}
          backdropOpacity={1}
          animationInTiming={100}
          animationOutTiming={300}
          animationIn={'fadeIn'}
          animationOut={'fadeOut'}
          propagateSwipe={true}
          transparent={true}
          onBackdropPress={()=>setTLimg_mdl(false)}
          style={{alignItems:'center',zIndex:999}}
        >
          <TouchableOpacity
            style={styles.clsbtn}
            onPress={()=>setTLimg_mdl(false)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="close-circle"
              color="#999"
              size={30}
            />
          </TouchableOpacity>
          <View style={{width:Width,height:Width / (TLimg_size.width / TLimg_size.height)}}>
            <Image
              style={{width:"100%",height:"100%"}}
              source={{uri:TLimg}}
            />
          </View>
        </Modal>
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
                previous:'TimeLine',
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
                previous:'TimeLine',
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
                  previous:'TimeLine',
                  withAnimation: true
                },
              ],
            });
          }}
          onPress3={() => {}}
          active={[false,false,false,true]}
        />
      </View>
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
    flex: 1,
  },
  inputview: {
    zIndex:999,
    paddingVertical:10,
    height:70
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
  sub_title: {
    fontSize: 13,
    color: "#9B9B9B",
    marginLeft:'auto',
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
  post: {
    width:'100%',
    padding:5,
    shadowColor: "#999",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5,
    backgroundColor:'#fff',
    marginBottom:10
  },
  postItem: {
    width:'100%',
    backgroundColor: "#fff",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
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
    fontWeight:'500'
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
  ListItem: {
    width:'100%',
    backgroundColor: "#fff",
    marginBottom:5,
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderColor: "#dddddd",
    borderWidth: 1,
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
    fontSize: 10,
  },
  name: {
    fontSize: 13,
    fontWeight:'500'
  },
  icon2: {
    width:40,
    height:40,
    borderRadius:100,
    marginRight:10,
    backgroundColor:'#eee'
  },
  shop2: {
    fontSize: 12,
  },
  name2: {
    fontSize: 15,
    fontWeight:'500'
  },
  date: {
    fontSize: Platform.OS === 'ios'? 10 : 12,
    color:'#999',
    position: "absolute",
    right: 0,
    top: 0,
  },
  message: {
    fontSize: 14,
    color: "#333",
  },
  timeline_img: {
    width:'100%',
    height:150,
    borderRadius:5,
    marginTop:10
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
  score: {
    flexDirection:'row',
    marginTop:5,
    alignItems:'center',
  },
  score_text: {
    fontSize: 15,
    color:"#b3b3b3",
    marginLeft:3,
    marginRight:20
  },
  addbutton: {
    width:50,
    height:50,
    position:'absolute',
    bottom:100,
    right:20,
    zIndex:1000,
    borderRadius:100,
    alignItems:'center',
    justifyContent:'center',
    shadowColor: "#666",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5
  },
  image: {
    width:'100%',
    height:150,
    borderRadius:8,
    marginTop:10,
    borderWidth:0.5,
    borderColor:"#999"
  },
  imgclose: {
    position:'absolute',
    top:15,
    right:5,
    width:25,
    height:25,
    borderRadius:100,
    justifyContent:'center',
    alignItems:'center',
    backgroundColor:"rgba(0,0,0,0.7)",
  },
  follow: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginLeft:'auto',
    borderRadius: 100,
    width:100,
    height:25,
    shadowColor: "#999",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity:1,
    shadowRadius:1.5,
    elevation:5
  },
  follow_txt: {
    fontSize:12,
    color:'#fff',
    fontWeight:'500'
  },
  follow2: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 5,
    width:120,
    height:30,
    shadowColor: "#999",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity:1,
    shadowRadius:1.5,
    elevation:5
  },
  follow2_txt: {
    fontSize:12,
    color:'#fff',
    fontWeight:'500'
  },
  label: {
    color:"#666",
    marginTop: 10,
    marginBottom:5,
    fontSize:13,
    fontWeight:'500'
  },
  challenge: {
    color:"#333",
    fontSize:15,
    fontWeight:'700'
  },
  feeling: {
    width:'20%',
    justifyContent:'center',
    alignItems:'center'
  },
});
