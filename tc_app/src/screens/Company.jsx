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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Autocomplete from 'react-native-autocomplete-input';
import SideMenu from 'react-native-side-menu-updated';
import * as SQLite from "expo-sqlite";

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

export default function Company(props) {

  const [isLoading, setLoading] = useState(false);

  const { navigation, route } = props;

  const [shop_staffs, setShop_staffs] = useState([]);

  const [staffs, setStaffs] = useState([]);
  const [filteredStaffs, setFilteredStaffs] = useState([]);

  const [bell_count, setBellcount] = useState(null);

  const [menu, setMenu] = useState(false);
  const deviceScreen = Dimensions.get('window');
  
  const listRef = useRef([]);
  
  // 参照データ取得日時
  const [date, setDate] = useState('');
  
  useLayoutEffect(() => {

    if (AppState.currentState === "active") {
      Notifications.setBadgeCountAsync(0);
    }

    navigation.setOptions({
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#1d449a", height: 110 }
        : { backgroundColor: "#fd2c77", height: 110 },
      headerTitle: () => (
        <Text style={styles.headertitle}>社内チャット</Text>
      ),
      headerRight: () => (
        <View style={{marginRight:15}}>
          <View style={bell_count?styles.bell:{display:'none'}}>
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

    Display();

    // 通知をタップしたらお客様一覧 → トーク画面 (ログイン済)
    const notificationInteractionSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
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
                profile: route.profile,
                staff: staffs,
                cus_name: cus_data.name,
              },
            ],
          });
        }
      });

    return () => {
      BackHandler.addEventListener("hardwareBackPress", true).remove();
      notificationInteractionSubscription.remove();
    };

  }, []);

  useEffect(() => {
    if (route.notifications) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "TalkScreen",
            params: route.params,
            customer: route.notifications.customer_id,
            websocket: route.websocket,
            profile: route.profile,
            staff: staffs,
            cus_name: route.notifications.name,
          },
        ],
      });
    }
  }, []);

  // 更新
  const [refreshing, setRefreshing] = useState(false);

  async function Display() {

    onRefresh(false);

  }

  // websocket通信(繋がった)
  route.websocket.onopen = (open) => {
    console.log("open");
  };

  // websocket通信(メール届いたら更新)
  route.websocket.onmessage = (message) => {
    // route.websocket.send(JSON.stringify( { "flg": 'hello' } ));
    let catchmail_flg = JSON.parse(message.data);
    console.log(catchmail_flg.message);
    onRefresh(true);
  };

  // websocket通信(切断したら再接続)
  route.websocket.onclose = (close) => {
    if (global.sp_token & global.sp_id) {
      console.log("closed");
      const WS_URL = "ws://54.168.20.149:8080/ws/" + route.params.shop_id + "/";
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "CommunicationHistory",
            params: route.params,
            websocket: new WebSocket(WS_URL),
          },
        ],
      });
    }
  };

  const onRefresh = useCallback(async(flg) => {

    const _sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    setLoading(true);

    setDate('最新データ取得中');

    const startTime = Date.now(); // 開始時間

    const json = await getCOM();

    // ログアウトしてたら中断
    if(!global.sp_token && !global.sp_id) return;

    const endTime = Date.now(); // 終了時間
    const time = (endTime - startTime)/1000;
    console.log('onRefresh：'+time + '秒');

    if (json == 'AbortError') {
      return;
    }

    if (json != false) {

      await Insert_staff_all_db(json);

      function addZero(num, length) {
        var minus = "";
        var zero = ('0'.repeat(length)).slice(-length);
        if (parseInt(num) < 0) {
          // マイナス値の場合
          minus = "-";
          num = -num;
          zero = zero.slice(-(length - 1 - String(num).length));	// -の1桁+数値の桁数分引く
        }
      
        return (minus + zero + num).slice(-length);
      }

      // データ取得日時
      var date = new Date();
      var date_ = (date.getFullYear()).toString() + "-" 
      + addZero((date.getMonth() + 1).toString(),2) + "-" 
      + addZero((date.getDate()).toString(),2) + "-" 
      + addZero((date.getHours()).toString(),2) + "-" 
      + addZero((date.getMinutes()).toString(),2) + "-" 
      + addZero((date.getSeconds()).toString(),2);

      storage.save({
        key: 'GET-DATA',
        data: date_,
      });

      var parts = date_.split(/-|:/);
        
      // 年、月、日、時、分を取得
      var year = parts[0];
      var month = parts[1];
      var day = parts[2];
      var hour = parts[3];
      var minute = parts[4];
      
      // 新しいフォーマットの日付文字列を作成
      var newDate = year + "-" + month + "-" + day + " " + hour + ":" + minute;

      setDate(newDate+' 時点');

    } else {
      
      setDate('');

      var sql = `select count(*) as count from customer_mst;`;
      var customer = await db_select(sql);
      const cnt = customer[0]["count"];

      const errTitle = "ネットワークの接続に失敗しました";
      const errMsg   = "端末に保存された" + cnt + "件のメッセージのみ表示します";

      Alert.alert(errTitle, errMsg);

      setLoading(false);

    }

    await getBELL();

    setLoading(false);

    return;

  }, [abortControllerRef]);

  const endRefresh = useCallback(async() => {
    
    var sql = `select count(*) as count from customer_mst;`;
    var customer = await db_select(sql);
    const cnt = customer[0]["count"];
    
    if (cnt >= 500) return;

    setLoading(true);

    const json = await getCOMNEXT(cnt);

    // ログアウトしてたら中断
    if(!global.sp_token && !global.sp_id) return;
    
    if (json != false) {
      // ローカルDB用お客様情報＋最新のコミュニケーション
      await Insert_customer_db(json.search);
      await searchCustomer(staff_value,false);
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
    console.log('バックグラウンドになりました2');
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
          page:0,
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

  const getCOMNEXT = useCallback((page) => {
    
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
          act: "customer_list",
          fc_flg: global.fc_flg,
          page:page,
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

  });

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

  // スタッフリストデータベース登録
  async function Insert_staff_all_db(staff_all) {

    if (staff_all) {

      var sql = `select * from staff_list where (account != 'all');`;
      var stf = await db_select(sql);

      // ローカルDBのスタッフ情報
      var DBstf = [];
      if (stf != false) {
        DBstf = stf.map((s) => {
          return s.account
        })
      }

      // 最新のスタッフ情報
      var APIstf = [];

      for (var s=0;s<staff_all.length;s++) {
        var staff = staff_all[s];
        var staff_insert = `insert or replace into staff_all values (?,?,?,?,?,?);`
        var staff_data = [staff.account, staff.shop_id, staff.name, staff.name_1, staff.name_2, staff.staff_photo1];
        await db_write(staff_insert,staff_data);
        APIstf.push(staff.account);
      }

      // 削除するスタッフ情報
      const DELstf = DBstf.filter(stf => !APIstf.includes(stf));
      
      for (var d=0;d<DELstf.length;d++) {
        var account = DELstf[d];
        var staff_delete = `delete from staff_all where ( account = ? );`;
        await db_write(staff_delete,[account]);
      }
    }

    const sl = await GetDB('staff_all');

    if (sl != false) {
      setStaffs(sl);
      
      var sql = `select * from staff_all where shop_id = '${route.params.shop_id}';`;
      var shop_staff = await db_select(sql);

      if (shop_staff != false) {
        setShop_staffs(shop_staff);
      } else {
        setShop_staffs([]);
      }

    } else {
      setStaffs([]);
    }

  }

  // お客様情報＋最新のコミュニケーションデータベース登録
  async function Insert_customer_db(customer) {
    
    if (customer) {

      // 最新のお客様情報
      for (var c=0;c<customer.length;c++) {

        var cus = customer[c];

        if (
          cus.html_flg ||
          (cus.communication_title === "入居申込書" &&
            cus.communication_status === "その他")
        ) {
          cus.communication_note = cus.communication_note.replace(
            /<("[^"]*"|'[^']*'|[^'">])*>/g,
            ""
          );
        }

        let status = cus.status;

        if (status == "未対応" && cus.SENPUKI_autofollow) {
          status = "メールモンスター";
        } else if (!status) {
          status = "未対応";
        }

        // 賃貸のみ
        if (cus.category_number != "1") {

          var sql = `insert or replace into customer_mst values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`;

          var data = [
            cus.customer_user_id,
            cus.name,
            cus.kana,
            cus.communication_time,
            cus.communication_title,
            cus.line_note
              ? cus.line_note
              : cus.communication_note,
            cus.mail1,
            cus.mail2,
            cus.mail3,
            cus.line,
            cus.staff_name,
            cus.media,
            cus.article_url,
            cus.reverberation_user_id,
            cus.coming_user_id,
            cus.coming_day1,
            status,
          ];
          
          await db_write(sql,data);
        }

      }

      // 500件超えたら古いものから削除する
      var sql = `select count(*) as count from customer_mst;`;
      var customer = await db_select(sql);
      const cnt = customer[0]["count"];

      if (cnt > 500) {
        var delcus = `DELETE FROM customer_mst WHERE customer_id IN (SELECT customer_id FROM customer_mst ORDER BY time LIMIT (SELECT COUNT(*) - 500 FROM customer_mst));`;
        await db_write(delcus,[]);
      }

    }

  }

  async function Delete_staff_db(){

    const dbList = [
      "staff_mst",
      "staff_all",
      "customer_mst",
      "communication_mst",
      "fixed_mst",
      "staff_profile",
      "ranking_mst",
      "black_sales_mst",
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
                  profile: route.profile,
                  staff: staffs,
                  previous:'Company'
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
          <View style={bell_count?styles.bell2:{display:'none'}}>
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
                  profile: route.profile,
                  previous:'Company'
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
                  profile: route.profile,
                  previous:'Company'
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

  const comList = useMemo(() => {
    if (shop_staffs.length == 0) {
      return (
        <View style={{marginTop:150}}>
          <TouchableOpacity style={styles.buttonReload} onPress={()=>onRefresh(true)}>
            <Text style={styles.buttonReloadLabel}>読　込</Text>
          </TouchableOpacity>
        </View>
      )
    } else {
      return (
        <FlatList
          bounces={true}
          ref={listRef}
          // onEndReached={endRefresh}
          refreshControl={
            date != '最新データ取得中' ?
            <RefreshControl
              refreshing={refreshing}
              onRefresh={async()=>{
                await onRefresh(true);
              }}
            />
            :<></>
          }
          initialNumToRender={10}
          data={shop_staffs}
          renderItem={({ item }) => {
            if (!item.del_flg) {
              return (
                <TouchableOpacity
                  style={styles.ListItem}
                  onPress={() => {
                  }}
                >
                  {item.staff_photo1?
                  (
                    <Image
                      style={styles.icon}
                      source={{uri:"https://www.total-cloud.net/img/staff_img/"+item.staff_photo1}}
                    />
                  ):(
                    <Image
                      style={styles.icon}
                      source={require('../../assets/photo4.png')}
                    />
                  )
                  }
                  <View style={styles.ListInner}>
                    <Text style={styles.shop} numberOfLines={1}>
                      {item.shop_name}
                    </Text>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.name_1}{item.name_2}
                    </Text>
                    <Text style={styles.date}>
                      0000/00/00
                    </Text>
                    <Text style={styles.message} numberOfLines={1}>
                      abcdefgijklmnopqrstuvwxyz
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }
          }}
          keyExtractor={(item) => `${item.account}`}
        />
      )
    }
  },[shop_staffs,date])

  const bgc = !global.fc_flg?"#fff4b3":"#f5d3df";

  const findStaff = (query) => {
    if (staffs.length > 0 && query.length > 0) {
      const regex = new RegExp(`${query.trim()}`, 'i');
      setFilteredStaffs(
        staffs.filter((staff) => {
          const name1Match = staff.name_1 && staff.name_1.search(regex) >= 0;
          const name2Match = staff.name_2 && staff.name_2.search(regex) >= 0;
          const shopNameMatch = staff.shop_name && staff.shop_name.search(regex) >= 0;
      
          return name1Match || name2Match || shopNameMatch;
        })
      );
    } else {
      setFilteredStaffs([]);
    }
  };

  async function addStaff(item) {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `確認`,
        `${item.name_1}${item.name_2}さん(${item.shop_name})を連絡先登録しますか？\n登録すると相手側にも通知がいきます`,
        [
          {
            text: "いいえ",
            style: "cancel",
            onPress:() => {resolve(false);}
          },
          {
            text: "はい",
            onPress: () => {resolve(true);}
          }
        ]
      );
    });

    if (!await AsyncAlert()) return;

    setShop_staffs([item, ...shop_staffs])
    setFilteredStaffs([]);
  }

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
      <View style={[styles.container,{backgroundColor:bgc}]}>
        <Loading isLoading={isLoading} />
        <View style={{backgroundColor:bgc,zIndex:999,padding:10}}>
          <Autocomplete
            data={filteredStaffs}
            placeholder="店舗名、名前が検索できます"
            placeholderTextColor="#b3b3b3"
            onChangeText={(text) => findStaff(text)}
            style={styles.searchInput}
            flatListProps={{
              style:{maxHeight:200},
              keyExtractor: (item) => `${item.account}`,
              renderItem: ({ item }) =>
              <TouchableOpacity
                onPress={() => {
                  addStaff(item);
                }}>
                <Text style={styles.suggestText}>
                {item.shop_name}：{item.name_1}{item.name_2}
                </Text>
              </TouchableOpacity>,
            }}
          />
        </View>
        <View style={{height:20,marginRight:10}}>
          <Text style={styles.sub_title}>{date}</Text>
        </View>
        {comList}
        <View style={{height:80}}>
        </View>
        <Footer
          onPress0={() => {
            navigation.reset({
              index: 0,
              routes: [{
                name: 'CommunicationHistory' ,
                params: route.params,
                websocket:route.websocket,
                profile:route.profile,
                previous:'Company',
                withAnimation: true
              }],
            });
          }}
          onPress1={() => {}}
          onPress2={() => {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "Schedule",
                  params: route.params,
                  websocket: route.websocket,
                  profile: route.profile,
                  withAnimation: true
                },
              ],
            });
          }}
          active={[false,true,false]}
        />
      </View>
    </SideMenu>
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
  searchInput: {
    fontSize: 16,
    width: "100%",
    height: 48,
    paddingHorizontal: 10,
    borderColor: "#dddddd",
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  suggestText: {
    fontSize: 15,
    paddingTop: 5,
    paddingBottom: 5,
    margin: 2,
  },
  sub_title: {
    fontSize: 13,
    color: "#9B9B9B",
    marginLeft:'auto',
  },
  buttonContainer: {
    backgroundColor: "#b3b3b3",
    borderRadius: 4,
    alignSelf: "center",
    position: "absolute",
    right: 0,
  },
  buttonLabel: {
    fontSize: 16,
    lineHeight: 30,
    paddingVertical: 8,
    paddingHorizontal: 20,
    color: "#000000",
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
  ListItem: {
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
    width:50,
    height:50,
    borderRadius:100,
    marginRight:10,
  },
  shop: {
    fontSize: 12,
  },
  name: {
    fontSize: 16,
    marginBottom: 5,
  },
  date: {
    position: "absolute",
    right: 0,
    top: 0,
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
    backgroundColor: "red",
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
    backgroundColor: "red",
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
});
