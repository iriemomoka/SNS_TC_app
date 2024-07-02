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
import { Feather } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { GestureHandlerRootView,PanGestureHandler } from 'react-native-gesture-handler';

import Loading from "../components/Loading";
import { GetDB,db_select,db_write,storage } from '../components/Databace';
import Footer from "../components/Footer";

const db = SQLite.openDatabase("db");

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

Notifications.setBadgeCountAsync(0);

const Width = Dimensions.get("window").width;

export default function Post(props) {

  const [isLoading, setLoading] = useState(false);

  var { navigation, route } = props;

  route = route.params;

  const [edit, setEdit] = useState(false);

  const [modal, setModal] = useState(false);

  // 1:返信 2:ありがとう
  const [modal_flg, setModal_flg] = useState("1");

  const [thank, setThank] = useState({
    "follow_user_id": "",
    "ins_dt": "",
    "send_date": "",
    "thank_id": "",
    "thank_message": "",
    "upd_dt": "",
    "user_id": "",
  });

  const [follow_my, setFollow_my] = useState({
    "follow_user_list": "",
    "follower_user_list": "",
    "upd_dt": "",
    "user_id": "",
  });
  const [follow_you, setFollow_you] = useState({
    "follow_user_list": "",
    "follower_user_list": "",
    "upd_dt": "",
    "user_id": "",
  });
  const [follow_flg, setFollow_flg] = useState(false);
  const [follower_flg, setFollower_flg] = useState(false);
  const [follow_len, setFollow_len] = useState([]);
  const [follower_len, setFollower_len] = useState([]);

  const [postCM, setPostCM] = useState('');
  const [postFav, setPostFav] = useState(route.post.fav);
  const [postCom, setPostCom] = useState(route.post.comment_all);
  const [postNiceall, setPostNiceall] = useState(route.post.nice_all);
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

    setLoading(true);

    const json = await getPost();

    if (json) {

      if (route.flg == 1) {
        setComment(json["comment"]);
      } else if (route.flg == 2) {

        if (json["post"] != null) {
          var posts = [...json["post"].filter(item => !Comment.some(item2 => item2.timeline_id === item.timeline_id)), ...Comment];
          posts.forEach(item => {
            item.name_1 = route.post.name_1;
            item.name_2 = route.post.name_2;
            item.shop_name = route.post.shop_name;
            item.staff_photo1 = route.post.staff_photo1;
          });
          setComment(posts);
        }
        
        if(json["challenge"]["challenge"]) {
          setChallenge(json["challenge"]["challenge"][0]);
        }

        
        if(json["thank"]) {
          setThank(json["thank"][0]);
        }
      }

      setFollow_my(json["follow_my"][0]);
      setFollow_you(json["follow_you"][0]);

      var follow_user = (json["follow_my"][0]["follow_user_list"]).split(",");
      setFollow_flg(follow_user.includes(route.post.user_id));

      var follower_user_you   = (json["follow_you"][0]["follow_user_list"]).split(",");
      follower_user_you = follower_user_you.filter(item => item !== "");

      var followerer_user_you = (json["follow_you"][0]["follower_user_list"]).split(",");
      followerer_user_you = followerer_user_you.filter(item => item !== "");

      setFollower_flg(follower_user_you.includes(route.params.account));

      setFollow_len(follower_user_you);
      setFollower_len(followerer_user_you);

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

  const getPost = useCallback((page = 0) => {
    
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
          post_data:route.post,
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

  const endRefreshPost = useCallback(async() => {

    if (Comment.length < 20) return;

    setLoading(true);

    const json = await getPost(Comment.length);
    
    if (json != false) {
      if (json["post"]) {
        var posts = [...Comment, ...json["post"].filter(item => !Comment.some(item2 => item2.timeline_id === item.timeline_id))];
        posts.forEach(item => {
          item.name_1 = route.post.name_1;
          item.name_2 = route.post.name_2;
          item.shop_name = route.post.shop_name;
          item.staff_photo1 = route.post.staff_photo1;
        });
        setComment(posts);
      }
    }

    setLoading(false);
  });

  const CommentList = useMemo(() => {

    return (
      <View style={[{paddingHorizontal:10,marginBottom:240},route.flg == 2&&{marginTop:10}]}>
        <FlatList
          onEndReached={()=>endRefreshPost()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async()=>{
                await onRefresh();
              }}
            />
          }
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
                    <View style={{flex:1}}>
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

  function setFollow_fetch() {

    setFollow_flg(!follow_flg);

    var newFollow_my  = follow_my;
    var newFollow_you = follow_you;
    
    var follow_my_list = newFollow_my["follow_user_list"]!=""?newFollow_my["follow_user_list"].split(","):[];
    var follower_you_list = newFollow_you["follower_user_list"]!=""?newFollow_you["follower_user_list"].split(","):[];

    if(!follow_flg) {
      // フォロー
      follow_my_list.push(route.post.user_id);
      newFollow_my["follow_user_list"] = follow_my_list.join(",");
      follower_you_list.push(route.params.account);
      newFollow_you["follower_user_list"] = follower_you_list.join(",");
    } else {
      //フォロー解除
      follow_my_list = follow_my_list.filter(item => item !== route.post.user_id);
      newFollow_my["follow_user_list"] = follow_my_list.join(",");
      follower_you_list = follower_you_list.filter(item => item !== route.params.account);
      newFollow_you["follower_user_list"] = follower_you_list.join(",");
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
        act: "post",
        fc_flg: global.fc_flg,
        flg:3,
        follow_flg:!follow_flg?1:"",
        post_data:route.post,
        follow:newFollow_my["follow_user_list"],
        follower:newFollow_you["follower_user_list"],
      }),
    })
    .then((response) => response.json())
    .then((json) => {
      setFollow_my(json["follow_my"][0]);
      setFollow_you(json["follow_you"][0]);
    })
    .catch((error) => {
      console.log(error);
      Alert.alert("フォローに失敗しました");
    });
    
  }

  const ChangeFavorite = (index,fav) => {

    if (index != "") {
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
      
      setFetch(route.flg,newlist[index]);
    } else {
      var newdata = route.post;
      setPostFav(!postFav);
      if (postFav) {
        if (postNiceall > 0) {
          var nice_list = newdata["nice_list"].split(",");
          newdata["nice_all"] = (nice_list.length) - 1;
          setPostNiceall((nice_list.length) - 1);
        } else {
          var nice_list = [];
          newdata["nice_all"] = 0;
          setPostNiceall(0);
        }
        const del_nice  = nice_list.filter(item => item !== route.params.account);
        const new_nice  = del_nice.join(",");
        newdata["nice_list"] = new_nice;
      } else {
        if (postNiceall > 0) {
          var nice_list = newdata["nice_list"].split(",");
          newdata["nice_all"] = (nice_list.length) + 1;
          setPostNiceall((nice_list.length) + 1);
        } else {
          var nice_list = [];
          newdata["nice_all"] = 1;
          setPostNiceall(1);
        }
        nice_list.push(route.params.account);
        const new_nice  = nice_list.join(",");
        newdata["nice_list"] = new_nice;
      }
      setFetch(2,newdata);
    }
  }

  const sendComment = async() => {
    if (postCM == "") {
      Alert.alert("エラー","コメントが未入力です");
      return;
    }

    var data = {
      timeline_id:route.post.timeline_id,
      comment_note:postCM,
    }

    setPostCom(Number(postCom) + 1);
    await setFetch(3,data);
    ModalClose();
    await onRefresh();
  }

  const sendThank = async() => {

    var data = {
      thank_id:thank.thank_id,
      user_id:route.post.user_id,
      thank_message:thanks,
    }

    await setFetch(4,data);
    ModalClose();
    await onRefresh();
  }

  const ClearThanks = async() => {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `確認`,
        `${route.post.name_1} ${route.post.name_2}さんへのありがとうを取り消しますか？`,
        [
          {text: "はい", onPress: () => {resolve(true);}},
          {text: "いいえ", onPress: () => {resolve(false);}, style: "cancel"},
        ]
      );
    });

    const thanks_check = await AsyncAlert();
    if (!thanks_check) return;

    var data = {
      thank_id:thank.thank_id,
    }

    setThank({
      "follow_user_id": "",
      "ins_dt": "",
      "send_date": "",
      "thank_id": "",
      "thank_message": "",
      "upd_dt": "",
      "user_id": "",
    });

    await setFetch(5,data);
    ModalClose();
    await onRefresh();
  }

  const ModalClose = async(check_flg = false) => {
    
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
    setModal_flg('1');
    setPostCM("");
    setThanks("");
    setEdit(false);
  }

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
      formData.append(key, data[key]);
    }

    if (flg == 1) { // コメントのいいね
      err = "コメントのいいね";
      formData.append('comment_fav_flg',1);
    } else if (flg == 2) { // いいね
      err = "いいね";
      formData.append('favorite_flg',1);
    } else if (flg == 3) { // コメント
      err = "コメント";
      formData.append('comment_flg',1);
    } else if (flg == 4) { // ありがとう
      err = "ありがとう";
      formData.append('thanks_flg',1);
    } else if (flg == 5) { // ありがとう取り消し
      err = "ありがとう取り消し";
      formData.append('thanks_clear_flg',1);
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
      }
    })
    .catch((error) => {
      console.log(error)
      Alert.alert(err+"に失敗しました");
    })

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

  const velocityThreshold = 0.3;
  const directionalOffsetThreshold = 80;

  const isValidSwipe = (velocity, directionalOffset) => {
    return (
      Math.abs(velocity) > velocityThreshold &&
      Math.abs(directionalOffset) < directionalOffsetThreshold
    );
  };

  const onPanGestureEvent = useCallback((event) => {
    const { velocityY, velocityX, translationX } = event.nativeEvent;
  
    if (Math.abs(velocityY) > 300) {
      return;
    }
  
    if (!isValidSwipe(velocityX, translationX)) {
      return;
    }
  
    if (velocityX > 0) {
      navigation.goBack();
    }
  }, []);

  return (
    <GestureHandlerRootView style={{flex:1}}>
      <PanGestureHandler onActivated={onPanGestureEvent} activeOffsetX={[-10, 10]} >
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
                    {route.params.account != route.post.user_id && (
                      <TouchableOpacity
                        style={[styles.follow,{backgroundColor:rsl}]}
                        onPress={()=>{setFollow_fetch()}}
                      >
                        <Text style={styles.follow_txt}>{follow_flg?"フォロー解除":"フォローする"}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.message,{fontSize:17,marginVertical:15}]}>
                    {route.post.timeline_note}
                  </Text>
                  {route.post.timeline_img&&(
                    <TouchableOpacity
                      onPress={async()=>{
                        const {imgWidth, imgHeight} = await new Promise((resolve) => {
                          Image.getSize(route.post.timeline_img, (width, height) => {
                            resolve({imgWidth: width, imgHeight: height});
                          });
                        });

                        setTLimg_size({width:imgWidth,height:imgHeight});
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
                        {postCom}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{flexDirection:'row'}}
                      activeOpacity={1}
                      onPress={()=>ChangeFavorite("",postFav)}
                    >
                      <MaterialCommunityIcons
                        name={postFav?"heart":"heart-outline"}
                        color={postFav?"#F23D3D":"#b3b3b3"}
                        size={18}
                      />
                      <Text style={styles.score_text}>
                        {postNiceall}
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
                          onPress={async()=>{
                            const {imgWidth, imgHeight} = await new Promise((resolve) => {
                              Image.getSize(domain+"img/staff_img/"+route.post.staff_photo1, (width, height) => {
                                resolve({imgWidth: width, imgHeight: height});
                              });
                            });
    
                            setTLimg_size({width:imgWidth,height:imgHeight});
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
                    <View style={{flex:1}}>
                      <View style={{flexDirection:'row',alignItems:'center'}}>
                        <View>
                          <Text style={styles.shop2}>
                            {route.post.shop_name}
                          </Text>
                          <Text style={styles.name2}>
                            {route.post.name_1}{route.post.name_2}
                          </Text>
                        </View>
                        {(route.params.account != route.post.user_id && follower_flg) &&(
                          <View style={{padding:3,backgroundColor:"#dbdbdb",borderRadius:5,marginLeft:'auto'}}>
                            <Text style={{color:'#999',fontSize:11}}>フォローされています</Text>
                          </View>
                        )}
                      </View>
                      {route.params.account != route.post.user_id && (
                        <>
                          <View style={{flexDirection:'row',marginTop:8}}>
                            <TouchableOpacity
                              style={[styles.follow2,{borderColor:rsl,backgroundColor:'#fff',borderWidth:1.5}]}
                              onPress={()=>{
                                setModal_flg("2")
                                setModal(true);
                                setThanks(thank.thank_id&&thank.thank_message);
                              }}
                            >
                              <Text style={[styles.follow2_txt,{color:rsl}]}>{thank.thank_id?"ありがとう送信済":"ありがとう送信"}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={[styles.follow2,{backgroundColor:rsl,marginLeft:5}]}
                              onPress={()=>{setFollow_fetch()}}
                            >
                              <Text style={styles.follow2_txt}>{follow_flg?"フォロー解除":"フォローする"}</Text>
                            </TouchableOpacity>
                          </View>
                          <TouchableOpacity
                            style={styles.follow3}
                            onPress={()=>{
                              navigation.navigate(
                                'ThanksPost',{
                                  name: 'ThanksPost' ,
                                  params: route.params,
                                  websocket:route.websocket,
                                  websocket2: route.websocket2,
                                  profile:route.profile,
                                  post:route.post,
                                  previous:'Post',
                                }
                              );
                            }}
                          >
                            <Text style={styles.follow3_txt}>ありがとう一覧</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      <View style={{flexDirection:'row',marginTop:8}}>
                        <TouchableOpacity
                          style={{}}
                          onPress={()=>{
                            navigation.navigate(
                              'Follow',{
                                name: 'Follow' ,
                                params: route.params,
                                websocket:route.websocket,
                                websocket2: route.websocket2,
                                profile:route.profile,
                                previous:'Post',
                                user_id:route.post.user_id,
                                name_1:route.post.name_1,
                                name_2:route.post.name_2,
                                flg:0,
                              }
                            );
                          }}
                        >
                          <Text style={{}}>
                            <Text style={{fontWeight:'700'}}>{follow_len.length}</Text>
                            フォロー中
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{}}
                          onPress={()=>{
                            navigation.navigate(
                              'Follow',{
                                name: 'Follow' ,
                                params: route.params,
                                websocket:route.websocket,
                                websocket2: route.websocket2,
                                profile:route.profile,
                                previous:'Post',
                                user_id:route.post.user_id,
                                name_1:route.post.name_1,
                                name_2:route.post.name_2,
                                flg:1,
                              }
                            );
                          }}
                        >
                          <Text style={{marginLeft:10}}>
                            <Text style={{fontWeight:'700'}}>{follower_len.length}</Text>
                            フォロワー
                          </Text>
                        </TouchableOpacity>
                      </View>
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
                keyboardStatus?Keyboard.dismiss():ModalClose(true)
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
                      onPress={()=>ModalClose(true)}
                    >
                      <Feather name='x-circle' color='gray' size={35} />
                    </TouchableOpacity>
                    <Text style={styles.modallabel}>{modal_flg=="1"?"コメント":`${route.post.name_1}${route.post.name_2}さんへありがとうを送る`}</Text>
                    <TextInput
                      onChangeText={(text) => {
                        if (text) setEdit(true);
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
                      onPress={()=>{
                        if (modal_flg=="1") { // コメント
                          sendComment();
                        } else { // ありがとう
                          sendThank();
                        }
                      }}
                      style={styles.submit}
                      >
                      <Text style={styles.submitText}>{modal_flg == "1"?"投　稿":"送　信"}</Text>
                    </TouchableOpacity>
                    {(modal_flg=="2"&&thank.thank_id)&&(
                    <TouchableOpacity
                      onPress={()=>{
                        ClearThanks();
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
                    withAnimation: true,
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
              onPress3={() => {
                navigation.goBack();
              }}
              active={[false,false,false,true]}
            />
          </View>
        </KeyboardAvoidingView>
      </PanGestureHandler>
    </GestureHandlerRootView>
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
  follow3: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 5,
    backgroundColor:'#fff',
    borderColor:'#999',
    borderWidth:2,
    width:245,
    height:30,
    shadowColor: "#999",
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity:1,
    shadowRadius:1.5,
    elevation:5,
    marginTop:8
  },
  follow3_txt: {
    fontSize:12,
    color:'#999',
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
