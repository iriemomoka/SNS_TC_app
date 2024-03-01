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
import Toast from 'react-native-root-toast';

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

export default function TimeLine(props) {

  const [isLoading, setLoading] = useState(false);

  const { navigation, route } = props;

  const [edit, setEdit] = useState(false);

  const [challenge, setChallenge] = useState({
    challenge_id: "",
    user_id: "",
    challenge_dt: "",
    challenge_content: "",
    challenge_result: 0,
    challenge_comment:"",
    feeling_today: "",
    del_flg: "",
    ins_dt: "",
    upd_dt: "",
  });

  const [challenge_tl, setChallenge_tl] = useState({
    nice_all: 0,
    comment_all: 0,
  });

  const [challenge_result, setChallenge_result] = useState({
    challenge_id: "",
    user_id: "",
    challenge_dt: "",
    challenge_content: "",
    challenge_result: 0,
    challenge_comment:"",
    feeling_today: "",
    del_flg: "",
    ins_dt: "",
    upd_dt: "",
  });

  const [modal, setModal] = useState(false);

  // 1:今日のチャレンジ 2:TL投稿 3:コメント 4: 今日のチャレンジ未入力 5:完了
  // 6:前日のチャレンジ結果未入力 7:昨日の完了
  const [modal_flg, setModal_flg] = useState("1");
  const [challenge_content, setChallenge_content] = useState("");
  const [challenge_comment, setChallenge_comment] = useState("");
  const [thank_send, setThank_send] = useState(0);

  const [star, setStar] = useState(0);

  const [staff_list, setStaff_list] = useState([]);
  const [toStaff, setToStaff] = useState(null);
  const [thanks_mdl, setThanks_mdl] = useState(false);
  const [thanks_txt, setThanks_txt] = useState("");

  const [TL, setTL] = useState([]); // 表示用
  const [TL_all, setTL_all] = useState([]); // 全件
  const [TLimg_mdl, setTLimg_mdl] = useState(false);
  const [TLimg, setTLimg] = useState("");
  const [TLimg_size, setTLimg_size] = useState({width:Width,height:Width});

  const [timeline_note, setTimeline_note] = useState("");
  const [comment, setComment] = useState("");
  const [comment_index, setComment_index] = useState("");
  const [image, setImage] = useState(null);
  
  const [checked, setChecked] = useState(true);
  const [checked2, setChecked2] = useState(true);

  const [search, setSearch] = useState("");

  const [bell_count, setBellcount] = useState(null);

  const [menu, setMenu] = useState(false);
  const deviceScreen = Dimensions.get('window');
  
  const listRef = useRef([]);
  const listRef2 = useRef([]);
  const searchRef = useRef([]);
  
  // 参照データ取得日時
  const [date, setDate] = useState('');

  var headerHeight = useHeaderHeight();
  const statusBarHeight = Constants.statusBarHeight;

  if (Platform.OS === 'android') {
    headerHeight = headerHeight - StatusBar.currentHeight;
  }
  
  useLayoutEffect(() => {

    if (AppState.currentState === "active") {
      Notifications.setBadgeCountAsync(0);
    }

    navigation.setOptions({
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#6C9BCF", height: 110}
        : { backgroundColor: "#FF8F8F", height: 110},
      headerTitle: () => (
        <Text style={styles.headertitle}>タイムライン</Text>
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

    await getBELL();
    setLoading(false);
  }

  const onRefresh = useCallback(async() => {

    const json = await getTL();
    
    if(json) {
      
      setLoading(true);

      if (json["timeline"]) {
        setTL(TL_all => [ ...json["timeline"].filter(item => !TL_all.some(item2 => item2.timeline_id === item.timeline_id)),...TL_all]);
        setTL_all(TL_all => [ ...json["timeline"].filter(item => !TL_all.some(item2 => item2.timeline_id === item.timeline_id)),...TL_all]);
      }
      
      setThank_send(json["thanks"]["thank_send"]);
  
      if (json["thanks_shop"]) {
        var sl = json["thanks_shop"];
        sl.forEach(value => value.thanks = value.thank_id ? true : false);
        setStaff_list(sl);
      }
  
      if (json["challenge"]["challenge"]) {
        setChallenge(json["challenge"]["challenge"][0]);
    
        setStar(json["challenge"]["challenge"][0]["challenge_result"]);
        setChallenge_comment(json["challenge"]["challenge"][0]["challenge_comment"]);

        if (json["challenge"]["challenge_tl"]) {
          const c_tl = json["challenge"]["challenge_tl"][0];
          setChallenge_tl({nice_all: c_tl["nice_all"],comment_all: c_tl["comment_all"]});
        }
        
      } else {
        setModal(true);
        setModal_flg("4");
      }

      if (json["challenge_result"]) {
        const challenge_result = json["challenge_result"][0];
        setChallenge_result(challenge_result);
        if (challenge_result["challenge_result"] == 0) {
          setModal(true);
          setModal_flg("6");
        }
      }

    }

    setLoading(false);

    await getBELL();

    return;

  }, [abortControllerRef]);

  const endRefresh = useCallback(async() => {

    if (TL_all.length < 20) return;

    setLoading(true);

    const json = await getTL(TL_all.length);
    
    if (json != false) {
      if (json["timeline"]) {
        setTL(TL_all => [...TL_all, ...json["timeline"].filter(item => !TL_all.some(item2 => item2.timeline_id === item.timeline_id))]);
        setTL_all(TL_all => [...TL_all, ...json["timeline"].filter(item => !TL_all.some(item2 => item2.timeline_id === item.timeline_id))]);
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
    await onRefresh(false);
  };

  const getTL = useCallback((page = 0) => {
    
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
          act: "timeline",
          fc_flg: global.fc_flg,
          page:page
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

  function setFetch(flg,data) {

    var err = "";

    let formData = new FormData();
    formData.append('ID',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act',"timeline");
    formData.append('fc_flg',global.fc_flg);
    formData.append('formdata_flg',1);
    formData.append('page',0);
    
    for (const key in data) {
      if (key != 'timeline_img') {
        formData.append(key, data[key]);
      }
    }

    if (flg == "1") { // 今日のチャレンジ or 昨日のチャレンジ
      err = "登録";
      formData.append('challenge_flg',1);
    } else if (flg == "2") { // 投稿
      err = "投稿";
      formData.append('timeline_note',data["timeline_note"]);
      formData.append('timeline_up',1);
  
      if (data["timeline_img"]) {
        formData.append('file',data["timeline_img"]);
      }
    } else if (flg == "3") { // コメント
      err = "コメント";
      formData.append('comment_flg',1);
    } else if (flg == "4") { // いいね
      err = "いいね";
      formData.append('favorite_flg',1);
    }
    
    fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
    {
      method: 'POST',
      headers: {
        'content-type': 'multipart/form-data',
      },
      body: formData,
    })
    .then((response) => response.json())
    .then((json) => {
      if(!json) {
        Alert.alert(err+"に失敗しました");
      } else {
        
        if (!json["challenge"]["challenge"]) {
          setModal(true);
          setModal_flg("4");
        }

        if (flg == "1" || flg == "2") {
          setTL(TL_all => [ ...json["timeline"].filter(item => !TL_all.some(item2 => item2.timeline_id === item.timeline_id)),...TL_all]);
          setTL_all(TL_all => [ ...json["timeline"].filter(item => !TL_all.some(item2 => item2.timeline_id === item.timeline_id)),...TL_all]);
        }
      }
    })
    .catch((error) => {
      console.log(error)
      Alert.alert(err+"に失敗しました");
    })

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
                  previous:'TimeLine'
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
                  previous:'TimeLine'
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
                  previous:'TimeLine'
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
                previous:'TimeLine',
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

  const ChallengeView = useMemo(()=>{
    return (
      <View style={styles.challenge}>
        <View style={styles.input}>
          <Text style={styles.label}>今日の気分</Text>
          <View style={{flexDirection:'row'}}>
            <TouchableOpacity
              style={styles.feeling}
              onPress={()=>{ChangeFeeling("4")}}
            >
              <Ionicons
                name="flash-outline"
                color={challenge.feeling_today=="4"?"#054BA6":"#c7c7c7"}
                size={40}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feeling}
              onPress={()=>{ChangeFeeling("3")}}
            >
              <Ionicons
                name="rainy-outline"
                color={challenge.feeling_today=="3"?"#05C7F2":"#c7c7c7"}
                size={40}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feeling}
              onPress={()=>{ChangeFeeling("2")}}
            >
              <Ionicons
                name="cloud-outline"
                color={challenge.feeling_today=="2"?"#04BF9D":"#c7c7c7"}
                size={40}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feeling}
              onPress={()=>{ChangeFeeling("1")}}
            >
              <Ionicons
                name="partly-sunny-outline"
                color={challenge.feeling_today=="1"?"#F2B705":"#c7c7c7"}
                size={40}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feeling}
              onPress={()=>{ChangeFeeling("0")}}
            >
              <Ionicons
                name="sunny-outline"
                color={challenge.feeling_today=="0"?"#F24405":"#c7c7c7"}
                size={40}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.label}>今日のチャレンジ</Text>
          <View style={{flexDirection:'row',justifyContent:'center'}}>
            <TouchableOpacity
              style={styles.content}
              onPress={()=>{
                setModal(true);
                setModal_flg("1");
                setChallenge_content(challenge.challenge_content);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.content_text}>{challenge.challenge_content!=""?challenge.challenge_content:"未設定"}</Text>
              <MaterialCommunityIcons
                name="pencil-outline"
                color={"#fff"}
                size={20}
                style={styles.content_pen}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.result}
              onPress={()=>{
                if (challenge.challenge_content == "") {
                  Alert.alert('','今日のチャレンジが入力されていません！')
                } else {
                  setModal(true);
                  setModal_flg("5");
                }
              }}
              activeOpacity={1}
            >
              <Image
                style={{width:35,height:35}}
                source={
                  challenge.challenge_result==1?
                  require('../../assets/star1.png'):
                  challenge.challenge_result==2?
                  require('../../assets/star2.png'):
                  challenge.challenge_result==3?
                  require('../../assets/star3.png'):
                  challenge.challenge_result==4?
                  require('../../assets/star4.png'):
                  challenge.challenge_result==5?
                  require('../../assets/star5.png'):
                  require('../../assets/star0.png')
                }
              />
              <Text style={[styles.result_text,{color:challenge.challenge_result>0?rsl:"#c7c7c7"}]}>完了</Text>
            </TouchableOpacity>
          </View>
          <View style={{flexDirection:'row',marginBottom:3,marginTop:10}}>
            <Text style={styles.label}>今日のチャレンジへのいいね</Text>
            <Text style={styles.thank}>{String(challenge_tl.nice_all)}</Text>
            <Text style={styles.label}>件</Text>
          </View>
          <View style={{flexDirection:'row',marginVertical:3}}>
            <Text style={styles.label}>今日のチャレンジへのコメント</Text>
            <Text style={styles.thank}>{String(challenge_tl.comment_all)}</Text>
            <Text style={styles.label}>件</Text>
          </View>
          <View style={{flexDirection:'row',marginVertical:3}}>
            <Text style={styles.label}>今日送ったありがとう件数</Text>
            <Text style={styles.thank}>{String(thank_send)}</Text>
            <Text style={styles.label}>件</Text>
          </View>
        </View>
      </View>
    )
  },[challenge,thank_send,checked,challenge_tl]);

  const TLList = useMemo(() => {

    if ((challenge_result.user_id && challenge_result.challenge_result == 0) || challenge.challenge_content == "") {
      return (
        <>
          {ChallengeView}
          <View style={{alignSelf:'center'}}>
            <Text style={{color:'#666',textAlign:'center',marginTop:130}}>チャレンジを入力すると{"\n"}タイムラインが表示されます</Text>
          </View>
        </>
      )
    }

    if (TL.length == 0) {
      return (
        <>
          {ChallengeView}
          <View style={{marginTop:150}}>
            <TouchableOpacity style={styles.buttonReload} onPress={()=>onRefresh(true)}>
              <Text style={styles.buttonReloadLabel}>読　込</Text>
            </TouchableOpacity>
          </View>
        </>
      )
    } else {
      return (
        <FlatList
          onEndReached={async()=>{await endRefresh()}}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async()=>{await onRefresh()}}
            />
          }
          scrollEnabled={true}
          bounces={true}
          ref={listRef}
          initialNumToRender={10}
          data={TL}
          renderItem={({ item,index }) => {

            var nice_list = [];
            if (item.nice_list != "") {
              nice_list = item.nice_list.split(",");
            }

            const fav = nice_list.includes(route.params.account);

            if (!item.del_flg) {
              return (
                <>
                {index==0&&(ChallengeView)}
                <TouchableOpacity
                  style={styles.ListItem}
                  onPress={()=>{
                    const item2 = { ...item, fav:fav};
                    navigation.navigate(
                      'Post',{
                        name: 'Post' ,
                        params: route.params,
                        websocket:route.websocket,
                        websocket2: route.websocket2,
                        profile:route.profile,
                        previous:'TimeLine',
                        post: item2,
                        flg:1,
                      }
                    );
                  }}
                  activeOpacity={1}
                >
                  <TouchableOpacity
                    style={styles.ListInner}
                    onPress={()=>{
                      const item2 = { ...item, fav:fav};
                      navigation.navigate(
                        'Post',{
                          name: 'Post' ,
                          params: route.params,
                          websocket:route.websocket,
                          websocket2: route.websocket2,
                          profile:route.profile,
                          previous:'TimeLine',
                          post: item2,
                          flg:2,
                        }
                      );
                    }}
                    activeOpacity={1}
                  >
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
                      <Text style={styles.shop}>
                        {item.shop_name}
                      </Text>
                      <Text style={styles.name}>
                        {item.name_1}{item.name_2}
                      </Text>
                    </View>
                    <Text style={styles.date}>
                      {item.ins_dt?item.ins_dt:''}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.message}>
                    {item.timeline_note}
                  </Text>
                  {item.timeline_img&&(
                    <TouchableOpacity
                      onPress={async()=>{

                        const {imgWidth, imgHeight} = await new Promise((resolve) => {
                          Image.getSize(item.timeline_img, (width, height) => {
                            resolve({imgWidth: width, imgHeight: height});
                          });
                        });

                        setTLimg_size({width:imgWidth,height:imgHeight});

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
                      onPress={()=>{
                        setModal(true);
                        setModal_flg("3")
                        setComment_index(index);
                      }}
                    >
                      <MaterialCommunityIcons
                        name="chat-outline"
                        color={"#b3b3b3"}
                        size={18}
                      />
                      <Text style={styles.score_text}>
                        {item.comment_all}
                      </Text>
                    </TouchableOpacity>
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
          keyExtractor={(item) => `${item.timeline_id}`}
        />
      )
    }
  },[TL,challenge,challenge_result,thank_send,checked])

  const SendList = useMemo(() => {

    return (
      <View style={{marginBottom:20}}>
        <FlatList
          scrollEnabled={false}
          scrollIndicatorInsets={{ right: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          ref={listRef2}
          initialNumToRender={10}
          data={staff_list}
          renderItem={({ item,index }) => {
            return (
              <View style={styles.ListItem2}>
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
                <View style={styles.ListInner2}>
                  <Text style={[styles.shop2,item.invisible&&{color:"#999"}]} numberOfLines={1}>
                    {item.shop_name}
                  </Text>
                  <Text style={[styles.name2,item.invisible&&{color:"#999"}]} numberOfLines={1}>
                    {item.name_1}{item.name_2}
                  </Text>
                </View>
                <TouchableOpacity
                  style={{flexDirection:'row'}}
                  activeOpacity={1}
                  onPress={()=>{
                    const newItem = { ...item,index:index}
                    setToStaff(newItem);
                    setThanks_mdl(true);
                    setThanks_txt(newItem?newItem.thank_message:"");
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
      </View>
    )
  },[staff_list,checked2])

  function TLSearch(text) {
    
    var filteredTL = TL_all.filter(function(item) {
      return (
        (item.name_1 && item.name_1.includes(text)) ||
        (item.name_2 && item.name_2.includes(text)) ||
        (item.shop_name && item.shop_name.includes(text)) ||
        (item.timeline_note && item.timeline_note.includes(text))
      );
    });

    setTL(text?filteredTL:TL_all);

  }

  const ModalClose = async(edit_flg = edit) => {

    if (edit_flg) {
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
    setModal_flg('1');
    setChallenge_content("");
    setStar(0);
    setTimeline_note("");
    setComment("");
    setComment_index("");
    setImage(null);
    setChallenge_comment("");
    setEdit(false);
  }

  const ChangeFeeling = (flg) => {
    
    if (challenge.challenge_content == "") {
      Alert.alert('','今日のチャレンジが入力されていません！')
      return;
    }

    setChallenge(state => ({ ...state, feeling_today: flg }));
    const data = { ...challenge, feeling_today: flg }
    setFetch("1",data);
  }

  const ChangeContent = async() => {

    if (challenge_content == "") {
      Alert.alert("エラー","今日のチャレンジが未入力です");
      return;
    }

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `確認`,
        "今日のチャレンジは完了していますが編集しますか？\n※チャレンジ結果とコメントがリセットされます",
        [
          {text: "はい", onPress: () => {resolve(true);}},
          {text: "いいえ", onPress: () => {resolve(false);}, style: "cancel"},
        ]
      );
    });

    if (challenge.challenge_result > 0) {
      const result_check = await AsyncAlert();
      if (!result_check) return;
    }
    
    setChallenge(state => ({ ...state, challenge_content: challenge_content, challenge_result: "0", challenge_comment: "" }));

    const data = { ...challenge, challenge_content: challenge_content, challenge_result: "0", challenge_comment: "" }
    setFetch("1",data);

    setStar(0);
    setChallenge_comment("")

    setModal(false);
    setChallenge_content("");
    setEdit(false);

  }

  const ChangeStar = (num) => {
    if (star == num) {
      setStar(0);
    } else {
      setStar(num);
    }
  }

  const ChangeResult = (flg) => {

    var err = "";

    if (star == 0) {
      if (flg) {
        err += "・昨日のチャレンジの結果を選択してください\n";
      } else {
        err += "・今日のチャレンジの結果を選択してください\n";
      }
    }

    if (challenge_comment == "") {
      err += "・結果コメントが未入力です";
    }

    if (err) {
      Alert.alert("エラー",err);
      return;
    }

    var data = {}

    if (flg) {
      setChallenge_result(state => ({ ...state, challenge_result: star, challenge_comment: challenge_comment }));

      data = { ...challenge_result, challenge_result: star, challenge_comment: challenge_comment };
    } else {
      setChallenge(state => ({ ...state, challenge_result: star, challenge_comment: challenge_comment }));

      data = { ...challenge, challenge_result: star, challenge_comment: challenge_comment };
    }

    setFetch("1",data);
    ModalClose(false);

  }

  const ChangeFavorite = (index,fav) => {

    let newlist = [...TL];

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
        newlist[index].nice_all = Number(nice_all) - 1;
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
        newlist[index].nice_all = Number(nice_all) + 1;
      } else {
        newlist[index].nice_all = 1;
      }
    }

    setTL(newlist);
    setChecked(!checked);

    setFetch("4",newlist[index]);
    
  }
  
  const ChangeThanks = (index) => {

    let newlist = [...staff_list];

    newlist[index].thanks = !newlist[index].thanks;

    newlist[index].thank_message = thanks_txt;

    fetch(domain + "batch_app/api_system_app.php?" + Date.now(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        ID: route.params.account,
        pass: route.params.password,
        act: "timeline",
        fc_flg: global.fc_flg,
        thanks_flg:1,
        thank_id:newlist[index].thank_id,
        user_id:newlist[index].account,
        thank_message:thanks_txt,
      }),
    })
    .then((response) => response.json())
    .then((json) => {
      if (json) {
        if (json["thanks_shop"]) {
          var sl = json["thanks_shop"];
          sl.forEach(value => value.thanks = value.thank_id ? true : false);
          setStaff_list(sl);
        }
        setThank_send(json["thanks"]["thank_send"]);
      }
    })
    .catch((error) => {
      console.log(error);
      Alert.alert("ありがとうに失敗しました");
    });
    
    setChecked(!checked);

  }

  const ClearThanks = async(index) => {

    let newlist = [...staff_list];

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `確認`,
        `${newlist[index].name_1} ${newlist[index].name_2}さんへのありがとうを取り消しますか？`,
        [
          {text: "はい", onPress: () => {resolve(true);}},
          {text: "いいえ", onPress: () => {resolve(false);}, style: "cancel"},
        ]
      );
    });

    const thanks_check = await AsyncAlert();
    if (!thanks_check) return;

    newlist[index].thanks = false;
    newlist[index].thank_message = "";

    fetch(domain + "batch_app/api_system_app.php?" + Date.now(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        ID: route.params.account,
        pass: route.params.password,
        act: "timeline",
        fc_flg: global.fc_flg,
        thanks_clear_flg:1,
        thank_id:newlist[index].thank_id,
      }),
    })
    .then((response) => response.json())
    .then((json) => {
      if (json) {
        var sl = json["thanks_shop"];
        if (json["thanks_shop"]) {
          sl.forEach(value => value.thanks = value.thank_id ? true : false);
          setStaff_list(sl);
        }
        setThank_send(json["thanks"]["thank_send"]);
      }
      setThanks_mdl(false);
      setThanks_txt("");
      setEdit(false);
    })
    .catch((error) => {
      console.log(error);
      Alert.alert("ありがとう取消に失敗しました");
      setThanks_mdl(false);
      setThanks_txt("");
      setEdit(false);
    });
    
    setChecked(!checked);

  }

  const SetTimeline = async() => {

    if (timeline_note == "" && image == null) {
      Alert.alert("エラー","投稿内容を入力してください");
      return;
    }

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `確認`,
        "投稿内容が入力されていませんが、よろしいですか？",
        [
          {text: "はい", onPress: () => {resolve(true);}},
          {text: "いいえ", onPress: () => {resolve(false);}, style: "cancel"},
        ]
      );
    });

    if (timeline_note == "" && image != null) {
      const result_check = await AsyncAlert();
      if (!result_check) return;
    }

    const data = {
      timeline_note: timeline_note,
      timeline_img: image?image:""
    }

    setFetch("2",data);
    
    ModalClose(false);
  }

  const SetTLComment = async() => {

    if (comment == "") {
      Alert.alert("エラー","コメントを入力してください");
      return;
    }

    let newlist = [...TL];

    var data = {
      timeline_id: newlist[comment_index]["timeline_id"],
      comment_note:comment
    }

    newlist[comment_index].comment_all = Number(newlist[comment_index].comment_all) + 1;

    setTL(newlist);

    Toast.show('コメントを送信しました', {
      duration: Toast.durations.SHORT,
      position: 120,
      shadow: true,
      animation: true,
      backgroundColor:'#333333',
      opacity:0.6,
    });

    setFetch("3",data);
    
    ModalClose(false);
  }

  const LibraryPermissionsCheck = async() => {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `カメラロールへのアクセスが無効になっています`,
        "設定画面へ移動しますか？",
        [
          {
            text: "キャンセル",
            style: "cancel",
            onPress:() => {resolve(false)}
          },
          {
            text: "設定する",
            onPress: () => {
              Linking.openSettings();
              resolve(false)
            }
          }
        ]
      );
    });

	  // カメラロールのアクセス許可を付与
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        await AsyncAlert();
        return false;
      } else {
        return true;
      }
    }

  }
  
  // カメラロールから画像またはビデオを選択
  const pickImage = async () => {
    
    if (!await LibraryPermissionsCheck()) return;
      
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    
    if (!result.canceled) {

      var Image_ = result.assets[0];
      
      let filename = Image_.uri.split('/').pop();

      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;

      setImage({ uri: Image_.uri, name: filename, type });
    }
	};

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
  
  const isCloseToBottom = ({layoutMeasurement, contentOffset, contentSize}) => {
    const paddingToBottom = 20;
    return layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -50}
    >
    <Loading isLoading={isLoading} />
    <SideMenu
      menu={headerRight}
      isOpen={menu}
      onChange={isOpen => {
        setMenu(isOpen);
      }}
      menuPosition={'right'}
      openMenuOffset={deviceScreen.width * 0.5}
    >
      <View style={[styles.container,{backgroundColor:bgc}]}>
        <View style={[styles.inputview,{backgroundColor:bgc}]}>
          <TextInput
            ref={searchRef}
            style={styles.searchInput}
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              TLSearch(text);
            }}
            placeholder="検索"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        {TLList}
        <Modal
          isVisible={modal}
          backdropOpacity={0.5}
          animationInTiming={300}
          animationOutTiming={500}
          animationIn={'slideInDown'}
          animationOut={'slideOutUp'}
          onBackdropPress={()=>{
            keyboardStatus?Keyboard.dismiss():ModalClose()
          }}
          style={{zIndex:999}}
        >
          
          {modal_flg == "4"||modal_flg == "6"?(
            <View style={styles.popup}>
              {modal_flg == "4"?(
                <Text style={styles.noChallenge}>今日のチャレンジを入力しましょう！</Text>
              ):(
                <Text style={styles.noChallenge}>昨日のチャレンジの結果が未入力です！</Text>
              )}
              <View style={{flexDirection:'row'}} >
                <TouchableOpacity
                  style={styles.popup_btn}
                  activeOpacity={0.7}
                  onPress={()=>{
                    if (modal_flg == "4") {
                      setModal_flg("1");
                      setChallenge_content(challenge.challenge_content);
                    } else {
                      setModal_flg("7");
                    }
                    setModal(true);
                  }}
                >
                  <Text style={styles.popup_btn_txt}>入力する</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.popup_btn,{backgroundColor:"#a6a6a6",borderBottomColor:"#8c8c8c"}]}
                  activeOpacity={0.7}
                  onPress={async()=>{
                    await ModalClose()
                    if (modal_flg == "6" && !challenge.challenge_content) {
                      setModal(true);
                      setModal_flg("4");
                    }
                  }}
                >
                  <Text style={styles.popup_btn_txt}>閉じる</Text>
                </TouchableOpacity>
              </View>
            </View>
          ):modal_flg == "5"?(
            <TouchableWithoutFeedback onPress={()=>Keyboard.dismiss()} >
              <View style={[styles.modal,{maxHeight:"85%"}]}>
                <TouchableOpacity
                  style={styles.close}
                  onPress={()=>ModalClose()}
                >
                  <Feather name='x-circle' color='gray' size={35} />
                </TouchableOpacity>
                <ScrollView keyboardShouldPersistTaps="always">
                  <Text style={styles.modallabel}>今日のチャレンジ</Text>
                  <Text style={styles.modaltext}>{challenge.challenge_content}</Text>
                  <Text style={styles.modallabel}>今日のチャレンジの結果</Text>
                  <View style={{flexDirection:'row',marginVertical:10,justifyContent:'center'}} >
                    <TouchableOpacity
                      style={{marginHorizontal:10}}
                      onPress={()=>{ChangeStar(1)}}
                    >
                      <Octicons
                        name={star>=1?"star-fill":"star"}
                        color={star>=1?"#ffe633":"#c7c7c7"}
                        size={35}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{marginHorizontal:10}}
                      onPress={()=>{ChangeStar(2)}}
                    >
                      <Octicons
                        name={star>=2?"star-fill":"star"}
                        color={star>=2?"#ffe633":"#c7c7c7"}
                        size={35}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{marginHorizontal:10}}
                      onPress={()=>{ChangeStar(3)}}
                    >
                      <Octicons
                        name={star>=3?"star-fill":"star"}
                        color={star>=3?"#ffe633":"#c7c7c7"}
                        size={35}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{marginHorizontal:10}}
                      onPress={()=>{ChangeStar(4)}}
                    >
                      <Octicons
                        name={star>=4?"star-fill":"star"}
                        color={star>=4?"#ffe633":"#c7c7c7"}
                        size={35}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{marginHorizontal:10}}
                      onPress={()=>{ChangeStar(5)}}
                    >
                      <Octicons
                        name={star>=5?"star-fill":"star"}
                        color={star>=5?"#ffe633":"#c7c7c7"}
                        size={35}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.modallabel}>結果コメント</Text>
                  <TextInput
                    onChangeText={(text) => {
                      if (text) setEdit(true);
                      setChallenge_comment(text);
                    }}
                    value={challenge_comment}
                    style={[styles.textarea,{marginBottom:10}]}
                    multiline={true}
                    disableFullscreenUI={true}
                    numberOfLines={11}
                  />
                  {staff_list.length>0&&(
                    <>
                      <Text style={styles.modallabel}>ありがとうを送る</Text>
                      {SendList}
                      <Modal
                        isVisible={thanks_mdl}
                        backdropOpacity={0.5}
                        animationInTiming={300}
                        animationOutTiming={500}
                        animationIn={'slideInDown'}
                        animationOut={'slideOutUp'}
                        onBackdropPress={async()=>{
                          if (keyboardStatus) {
                            Keyboard.dismiss()
                          } else {

                            if (edit) {
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

                            setThanks_mdl(false);
                            setThanks_txt("");
                            setEdit(false);
                          }
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
                                onPress={async()=>{

                                  if (edit) {
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

                                  setThanks_mdl(false);
                                  setThanks_txt("");
                                  setEdit(false);
                                }}
                              >
                                <Feather name='x-circle' color='gray' size={35} />
                              </TouchableOpacity>
                              <Text style={[styles.modallabel,{maxWidth:250}]}>{`${toStaff&&toStaff.name_1+" "+toStaff.name_2}さんへありがとうと一緒にメッセージを送りましょう`}</Text>
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
                                  ChangeThanks(toStaff&&toStaff.index)
                                  setThanks_mdl(false);
                                  setThanks_txt("");
                                  setEdit(false);
                                }}
                                style={styles.submit}
                                >
                                <Text style={styles.submitText}>送　信</Text>
                              </TouchableOpacity>
                              {(toStaff&&toStaff.thanks)&&(
                              <TouchableOpacity
                                onPress={()=>{
                                  ClearThanks(toStaff&&toStaff.index);
                                  setEdit(false);
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
                    </>
                  )}
                  <View style={{flexDirection:'row',justifyContent:'center',marginBottom:10}} >
                    <TouchableOpacity
                      style={styles.popup_btn}
                      activeOpacity={0.7}
                      onPress={()=>{ChangeResult(false)}}
                    >
                      <Text style={styles.popup_btn_txt}>完了</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.popup_btn,{backgroundColor:"#a6a6a6",borderBottomColor:"#8c8c8c"}]}
                      activeOpacity={0.7}
                      onPress={()=>{ModalClose()}}
                    >
                      <Text style={styles.popup_btn_txt}>閉じる</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          ):modal_flg == "7"?(
            <KeyboardAvoidingView behavior={"position"} keyboardVerticalOffset={30}>
              <TouchableWithoutFeedback onPress={()=>Keyboard.dismiss()} >
                <View style={styles.modal}>
                  <TouchableOpacity
                    style={styles.close}
                    onPress={()=>ModalClose()}
                  >
                    <Feather name='x-circle' color='gray' size={35} />
                  </TouchableOpacity>
                  <ScrollView keyboardShouldPersistTaps="always">
                    <Text style={styles.modallabel}>昨日のチャレンジ</Text>
                    <Text style={styles.modaltext}>{challenge_result.challenge_content}</Text>
                    <Text style={styles.modallabel}>昨日のチャレンジの結果</Text>
                    <View style={{flexDirection:'row',marginVertical:10,justifyContent:'center'}} >
                      <TouchableOpacity
                        style={{marginHorizontal:10}}
                        onPress={()=>{ChangeStar(1)}}
                      >
                        <Octicons
                          name={star>=1?"star-fill":"star"}
                          color={star>=1?"#ffe633":"#c7c7c7"}
                          size={35}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{marginHorizontal:10}}
                        onPress={()=>{ChangeStar(2)}}
                      >
                        <Octicons
                          name={star>=2?"star-fill":"star"}
                          color={star>=2?"#ffe633":"#c7c7c7"}
                          size={35}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{marginHorizontal:10}}
                        onPress={()=>{ChangeStar(3)}}
                      >
                        <Octicons
                          name={star>=3?"star-fill":"star"}
                          color={star>=3?"#ffe633":"#c7c7c7"}
                          size={35}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{marginHorizontal:10}}
                        onPress={()=>{ChangeStar(4)}}
                      >
                        <Octicons
                          name={star>=4?"star-fill":"star"}
                          color={star>=4?"#ffe633":"#c7c7c7"}
                          size={35}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={{marginHorizontal:10}}
                        onPress={()=>{ChangeStar(5)}}
                      >
                        <Octicons
                          name={star>=5?"star-fill":"star"}
                          color={star>=5?"#ffe633":"#c7c7c7"}
                          size={35}
                        />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.modallabel}>結果コメント</Text>
                    <TextInput
                      onChangeText={(text) => {
                        if (text) setEdit(true);
                        setChallenge_comment(text);
                      }}
                      value={challenge_comment}
                      style={[styles.textarea,{marginBottom:10}]}
                      multiline={true}
                      disableFullscreenUI={true}
                      numberOfLines={11}
                    />
                    <View style={{flexDirection:'row',justifyContent:'center',marginBottom:10}} >
                      <TouchableOpacity
                        style={styles.popup_btn}
                        activeOpacity={0.7}
                        onPress={()=>{ChangeResult(true)}}
                      >
                        <Text style={styles.popup_btn_txt}>完了</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.popup_btn,{backgroundColor:"#a6a6a6",borderBottomColor:"#8c8c8c"}]}
                        activeOpacity={0.7}
                        onPress={()=>{ModalClose()}}
                      >
                        <Text style={styles.popup_btn_txt}>閉じる</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          ):(
            <KeyboardAvoidingView behavior={"position"} keyboardVerticalOffset={30}>
              <TouchableWithoutFeedback
                onPress={()=>Keyboard.dismiss()}
              >
                <View style={styles.modal}>
                  <TouchableOpacity
                    style={styles.close}
                    onPress={()=>ModalClose()}
                  >
                    <Feather name='x-circle' color='gray' size={35} />
                  </TouchableOpacity>
                  <Text style={styles.modallabel}>
                    {
                      modal_flg == "1"?"今日のチャレンジ":
                      modal_flg == "2"?"投稿":"コメント"
                    }
                  </Text>
                  <TextInput
                    onChangeText={(text) => {
                      if (text) setEdit(true);

                      if (modal_flg == "1") {
                        setChallenge_content(text);
                      } else if (modal_flg == "2") {
                        setTimeline_note(text);
                      } else if (modal_flg == "3") {
                        setComment(text);
                      }
                    }}
                    value={modal_flg == "1"?challenge_content:modal_flg == "2"?timeline_note:comment}
                    style={styles.textarea}
                    multiline={true}
                    disableFullscreenUI={true}
                    numberOfLines={11}
                    placeholder={modal_flg == "2"?"いまどうしてる？":modal_flg == "3"?"返信をポスト":""}
                  />
                  {modal_flg === "2" && (
                    image == null ? (
                      <TouchableOpacity
                        style={{marginTop:10,marginLeft:'auto'}}
                        activeOpacity={0.8}
                        onPress={()=>pickImage()}
                      >
                        <MaterialCommunityIcons
                          name={"camera-plus-outline"}
                          color={"#666"}
                          size={30}
                        />
                      </TouchableOpacity>
                    ):(
                      <View>
                        <Image
                          style={styles.image}
                          source={{uri:image.uri}}
                        />
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.imgclose}
                          onPress={() => {
                            setImage(null);
                          }}
                        >
                          <MaterialCommunityIcons
                            name={"close-thick"}
                            color={"#fff"}
                            size={15}
                          />
                        </TouchableOpacity>
                      </View>
                    )
                  )}
                  <TouchableOpacity
                    onPress={()=>{
                      if (modal_flg == "1") {
                        ChangeContent();
                      } else if (modal_flg == "2") {
                        SetTimeline();
                      } else if (modal_flg == "3") {
                        SetTLComment();
                      }
                    }}
                    style={styles.submit}
                    >
                    <Text style={styles.submitText}>{modal_flg == "1"?"登　録":"投　稿"}</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          )}
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
        <View style={{height:80}}>
        </View>
        {challenge.challenge_content != "" && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.addbutton,{backgroundColor:rsl}]}
            onPress={() => {
              setModal(true);
              setModal_flg("2");
            }}
          >
            <MaterialCommunityIcons
              name={"plus-thick"}
              color={"#fff"}
              size={25}
            />
          </TouchableOpacity>
        )}
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
    </SideMenu>
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
    paddingHorizontal:10,
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
  popup: {
    justifyContent: 'center',
    alignItems:'center',
    backgroundColor: "#ffffff",
    width:'100%',
    padding:10,
    borderRadius: 5,
  },
  noChallenge: {
    fontSize: 16,
    lineHeight: 30,
    fontWeight:'700',
    textAlign:'center',
    color: "#666",
    marginVertical:30
  },
  popup_btn: {
    width: "40%",
    height: 40,
    marginHorizontal:5,
    alignItems: "center",
    justifyContent:'center',
    backgroundColor:"#81aee6",
    borderBottomColor:"#6c93c4",
    borderRadius:5,
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
  popup_btn_txt: {
    color:"#fff",
    fontSize:16,
    fontWeight:"700"
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
  challenge: {
    width:'100%',
    padding:5,
    shadowColor: "#999",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5,
    marginBottom:10,
    backgroundColor:'#fff',
  },
  input: {
    marginBottom: 5,
    width:'100%',
  },
  label: {
    color:"#666",
    marginTop: 10,
    marginBottom:5,
    marginLeft:5,
    fontSize:13,
    fontWeight:'500'
  },
  feeling: {
    width:'20%',
    justifyContent:'center',
    alignItems:'center'
  },
  content: {
    width:"80%",
    minHeight:80,
    paddingHorizontal:10,
    paddingVertical:15,
    backgroundColor:"#FFAB76",
    borderRadius:10,
    justifyContent:'center',
    shadowColor: "#666",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5,
  },
  content_text: {
    color:"#fff",
    fontSize:16,
    fontWeight:"500"
  },
  content_pen: {
    position:'absolute',
    bottom:10,
    right:10
  },
  result: {
    width:"20%",
    justifyContent:'center',
    alignItems:'center'
  },
  result_text: {
    fontSize:13,
    fontWeight:"500",
    marginTop:5
  },
  thank: {
    fontSize:25,
    fontWeight:"700",
    marginLeft:10,
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
    fontSize:16,
    fontWeight:'500'
  },
  modaltext: {
    color:"#999",
    marginBottom:10,
    marginLeft:5,
    fontSize:16,
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
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.15)",
    borderColor: "#dddddd",
    borderWidth: 1,
  },
  ListInner: {
    width:'100%',
    flexDirection: "row",
    alignItems: "center",
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
  },
  date: {
    fontSize: Platform.OS === 'ios'? 10 : 12,
    color:'#999',
    position: "absolute",
    right: 0,
    top: 0,
  },
  message: {
    fontSize: 15,
    color: "#333",
    marginTop:5,
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
    marginTop:10,
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
  ListItem2: {
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
  ListInner2: {
    flex: 1,
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
    fontSize: 16,
  },
});
