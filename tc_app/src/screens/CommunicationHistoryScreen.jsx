import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useLayoutEffect,
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
  Linking,
  Image,
  Dimensions,
} from "react-native";
import DropDownPicker, { Item } from "react-native-dropdown-picker";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Permissions from "expo-permissions";
import SideMenu from 'react-native-side-menu-updated';

import Loading from "../components/Loading";
import { db } from '../components/Databace';

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = "https://www.total-cloud.net/";

Notifications.setBadgeCountAsync(0);


export default function CommunicationHistoryScreen(props) {
  if (AppState.currentState === "active") {
    Notifications.setBadgeCountAsync(0);
  }

  const [isLoading, setLoading] = useState(false);

  const { navigation, route } = props;

  const [memos, setMemos] = useState([]);

  const [name, setName] = useState("");

  const [open, setOpen] = useState(false);
  const [staff_value, setStaff_Value] = useState(null);
  const [staffs, setStaffs] = useState([]);

  const [bell_count, setBellcount] = useState(null);

  const responseListener = useRef();

  const [menu, setMenu] = useState(false);
  const deviceScreen = Dimensions.get('window');

  const items = staffs.map((item) => {
    return {
      label:
        item.account != "all"
          ? item.name_1 + "　" + (item.name_2 ? item.name_2 : "")
          : "全員",
      value: item.account,
      key: item.account,
    };
  });
  items.unshift({ label: "担当無し", value: "" });

  const [a, setA] = useState(false);

  const [staff_db, setStaff_db] = useState(false);
  const [fixed, setFixed] = useState(false);

  const [cus_list, setCus_list] = useState([]);

  navigation.setOptions({
    headerStyle: !global.fc_flg
      ? { backgroundColor: "#1d449a", height: 110 }
      : { backgroundColor: "#fd2c77", height: 110 },
    headerTitle: () =>
      !global.fc_flg ? (
        <Image source={require("../../assets/logo.png")} />
      ) : (
        <Image
          source={require("../../assets/logo_onetop.png")}
          style={styles.header_img}
        />
      ),
  });

  useEffect(() => {
    // ※【ヘッダー移転元【変数代入効かないから移動】】※

    // ログイン時のみサーバーDB見に行く
    if (route.previous == "LogIn") {
      navigation.setOptions({
        gestureDirection: "vertical-inverted",
      });

      setLoading(true);
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
        }),
      })
        .then((response) => response.json())
        .then((json) => {
          // ローカルDB用スタッフリスト
          Insert_staff_list_db(json.staff);

          // ローカルDB用お客様情報＋最新のコミュニケーション
          Insert_customer_db(json.search);

          // ローカルDB用定型文
          const fixed_mst_data = Object.entries(json.fixed_array).map(
            ([key, value]) => {
              return { key, value };
            }
          );

          // 登録用に一つ一つ配列化
          const fixed_mst = [];

          fixed_mst_data.map((f) => {
            if (!f.value.length) {
              fixed_mst.push({
                fixed_id: "",
                category: f.key,
                title: "",
                mail_title: "",
                note: "",
              });
            } else {
              f.value.map((v) => {
                fixed_mst.push({
                  fixed_id: v.fixed_id,
                  category: f.key,
                  title: v.title,
                  mail_title: v.note.substring(0, v.note.indexOf("<[@]>")),
                  note: v.note.substr(v.note.indexOf("<[@]>") + 5),
                });
              });
            }
          });

          Insert_fixed_db(fixed_mst);

          setLoading(false);
        })
        .catch((error) => {
          // オフラインの場合ローカルDBを使用
          db.transaction((tx) => {
            tx.executeSql(
              `select * from staff_list;`,
              [],
              (_, { rows }) => {
                setStaffs(rows._array);
              },
              () => {
                console.log("失敗");
              }
            );

            tx.executeSql(
              `select * from fixed_mst;`,
              [],
              (_, { rows }) => {
                setFixed(rows._array);
              },
              () => {
                console.log("失敗");
              }
            );

            // コミュニケーション履歴が保存されているお客様のみ表示
            tx.executeSql(
              `select distinct customer_id from communication_mst;`,
              [],
              (_, { rows }) => {
                const cus_offline_list = rows._array.map((r) => {
                  return r.customer_id;
                });
                const cus_offline_list_id = cus_offline_list.join();

                tx.executeSql(
                  `select * from customer_mst where customer_id in (` +
                    cus_offline_list_id +
                    `) order by time desc;`,
                  [],
                  (_, { rows }) => {
                    setMemos(rows._array);
                  },
                  () => {
                    console.log("失敗");
                  }
                );

                const cus_count = cus_offline_list.length;

                const errTitle = "ネットワークの接続に失敗しました";
                const errMsg =
                  "端末に保存された" +
                  cus_count +
                  "件のメッセージのみ表示します";
                Alert.alert(errTitle, errMsg);
              },
              () => {
                console.log("失敗");
              }
            );
          });

          setLoading(false);
        });
    } else {
      setLoading(true);
      // ローカルDB用スタッフリスト
      Insert_staff_list_db("");

      // ローカルDB用お客様情報＋最新のコミュニケーション
      Insert_customer_db("");

      Insert_fixed_db("");
      setLoading(false);
    }

    //alert(1);
    // 20220613 新着件数を変数に格納
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
        console.log("19:" + json.bell_count.cnt);
        if (json.bell_count.cnt != "0") {
          setBellcount(json.bell_count.cnt);
        } else {
          setBellcount("");
        }
      })
      .catch((error) => {
        setBellcount("");
      });

    // 通知をタップしたらお客様一覧 → トーク画面 (ログイン済)
    const notificationInteractionSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        if (
          response.notification.request.content.data.customer &&
          global.sp_id
        ) {
          const cus_data = response.notification.request.content.data.customer;

          db.transaction((tx) => {
            tx.executeSql(
              `select * from fixed_mst;`,
              // `delete from fixed_mst;`,
              [],
              (_, { rows }) => {
                var noti_fixed = "";

                if (rows._array.length) {
                  noti_fixed = rows._array;
                }

                navigation.reset({
                  index: 0,
                  routes: [
                    {
                      name: "TalkScreen",
                      params: route.params,
                      customer: cus_data.customer_id,
                      websocket: route.websocket,
                      station: route.station,
                      address: route.address,
                      profile: route.profile,
                      staff: staffs,
                      fixed: noti_fixed,
                      cus_name: cus_data.name,
                    },
                  ],
                });
              },
              () => {
                console.log("通知をタップ失敗");
              }
            );
          });
        }
      });

    return () => {
      BackHandler.addEventListener("hardwareBackPress", true).remove();
      notificationInteractionSubscription.remove();
    };
  }, []);

  
  // ハンバーガーメニュー
  navigation.setOptions({
    headerRight: () => (
      <View style={{marginRight:15}}>
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

  useEffect(() => {
    if (route.notifications && fixed) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "TalkScreen",
            params: route.params,
            customer: route.notifications.customer_id,
            websocket: route.websocket,
            station: route.station,
            address: route.address,
            profile: route.profile,
            staff: staffs,
            fixed: fixed,
            cus_name: route.notifications.name,
          },
        ],
      });
    }
  }, [fixed]);

  // 更新
  const [refreshing, setRefreshing] = useState(false);

  // websocket通信(繋がった)
  route.websocket.onopen = (open) => {
    console.log("open");
  };

  // websocket通信(メール届いたら更新)
  route.websocket.onmessage = (message) => {
    // route.websocket.send(JSON.stringify( { "flg": 'hello' } ));
    let catchmail_flg = JSON.parse(message.data);
    console.log(catchmail_flg.message);
    onRefresh();
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
            station: route.station,
            address: route.address,
          },
        ],
      });
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);

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
      }),
    })
      .then((response) => response.json())
      .then((json) => {
        setRefreshing(false);

        console.log(json.search[1].tel1);
        // ローカルDB用スタッフリスト
        Insert_staff_list_db(json.staff);

        // ローカルDB用お客様情報＋最新のコミュニケーション
        Insert_customer_db(json.search);

        // ローカルDB用定型文
        const fixed_mst_data = Object.entries(json.fixed_array).map(
          ([key, value]) => {
            return { key, value };
          }
        );

        // 登録用に一つ一つ配列化
        const fixed_mst = [];

        fixed_mst_data.map((f) => {
          if (!f.value.length) {
            fixed_mst.push({
              fixed_id: "",
              category: f.key,
              title: "",
              mail_title: "",
              note: "",
            });
          } else {
            f.value.map((v) => {
              fixed_mst.push({
                fixed_id: v.fixed_id,
                category: f.key,
                title: v.title,
                mail_title: v.note.substring(0, v.note.indexOf("<[@]>")),
                note: v.note.substr(v.note.indexOf("<[@]>") + 5),
              });
            });
          }
        });

        Insert_fixed_db(fixed_mst);
      })
      .catch((error) => {
        setRefreshing(false);

        // オフラインの場合ローカルDBを使用
        db.transaction((tx) => {
          tx.executeSql(
            `select * from staff_list;`,
            [],
            (_, { rows }) => {
              setStaffs(rows._array);
            },
            () => {
              console.log("失敗");
            }
          );

          tx.executeSql(
            `select * from fixed_mst;`,
            [],
            (_, { rows }) => {
              setFixed(rows._array);
            },
            () => {
              console.log("失敗");
            }
          );

          // コミュニケーション履歴が保存されているお客様のみ表示
          tx.executeSql(
            `select distinct customer_id from communication_mst;`,
            [],
            (_, { rows }) => {
              const cus_offline_list = rows._array.map((r) => {
                return r.customer_id;
              });
              const cus_offline_list_id = cus_offline_list.join();

              tx.executeSql(
                `select * from customer_mst where customer_id in (` +
                  cus_offline_list_id +
                  `) order by time desc;`,
                [],
                (_, { rows }) => {
                  setMemos(rows._array);
                },
                () => {
                  console.log("失敗");
                }
              );

              const cus_count = cus_offline_list.length;

              const errTitle = "ネットワークの接続に失敗しました";
              const errMsg =
                "端末に保存された" + cus_count + "件のメッセージのみ表示します";
              Alert.alert(errTitle, errMsg);
            },
            () => {
              console.log("失敗");
            }
          );
        });
      });

    // 20220613 新着件数を変数に格納
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
        //      console.log("2:"+json.bell_count.cnt);
        if (json.bell_count.cnt != "0") {
          setBellcount(json.bell_count.cnt);
        } else {
          setBellcount("");
        }
      })
      .catch((error) => {
        setBellcount("");
      });
  }, []);

  // スタッフリストデータベース登録
  function Insert_staff_list_db(staff_list) {
    db.transaction((tx) => {
      if (staff_list) {
        tx.executeSql(
          `select * from staff_list;`,
          [],
          (_, { rows }) => {
            if (!rows._array.length) {
              db.transaction((tx) => {
                Promise.all(
                  staff_list.map((sl) => {
                    tx.executeSql(
                      `insert into staff_list values (?,?,?,?);`,
                      [sl.account, sl.name_1, sl.name_2, ""],
                      () => {
                        // console.log("insert staff_list");
                      },
                      () => {
                        console.log("staff_list 失敗");
                      }
                    );
                  })
                ).then(() => {
                  tx.executeSql(
                    `select * from staff_list;`,
                    [],
                    (_, { rows }) => {
                      setStaffs(rows._array);
                    }
                  );
                });
              });
            }

            // 最新の情報に書き換える + 新しいスタッフ追加 + 削除
            if (rows._array.length) {
              const rocal = rows._array;

              // 書き換え
              rocal.map((r) => {
                staff_list.map((s_l) => {
                  if (s_l.account === r.account) {
                    if (s_l.name_1 != r.name_1 || s_l.name_2 != r.name_2) {
                      db.transaction((tx) => {
                        tx.executeSql(
                          `update staff_list set name_1 = (?), name_2 = (?) where ( account = ? );`,
                          [s_l.name_1, s_l.name_2, s_l.account],
                          () => {
                            tx.executeSql(
                              `select * from staff_list;`,
                              [],
                              (_, { rows }) => {
                                if (rows._array.length) {
                                  setStaffs(rows._array);
                                }
                              },
                              () => {
                                console.log("失敗");
                              }
                            );
                          }
                          // () => {console.log(s_l.name_1+"のデータ更新 失敗");}
                        );
                      });
                    }
                  }
                });
              });

              // 追加
              const local_staff_list = rocal.map((r) => {
                return r.account;
              });

              const server_staff_list = staff_list.map((s_l) => {
                return s_l.account;
              });

              const add_staff_list = server_staff_list.filter(
                (c) => local_staff_list.indexOf(c) == -1
              );

              staff_list.map((s_l) => {
                add_staff_list.map((add) => {
                  if (s_l.account === add) {
                    db.transaction((tx) => {
                      tx.executeSql(
                        `insert into staff_list values (?,?,?,?);`,
                        [s_l.account, s_l.name_1, s_l.name_2, ""],
                        () => {
                          tx.executeSql(
                            `select * from staff_list;`,
                            [],
                            (_, { rows }) => {
                              if (rows._array.length) {
                                setStaffs(rows._array);
                              }
                            },
                            () => {
                              console.log("失敗");
                            }
                          );
                        },
                        () => {
                          // console.log(s_l.name_1+"のデータ追加 失敗");
                        }
                      );
                    });
                  }
                });
              });

              // 削除
              const del_staff_list = local_staff_list.filter(
                (c) => server_staff_list.indexOf(c) == -1
              );

              rocal.map((r) => {
                del_staff_list.map((del) => {
                  if (r.account === del && r.account != "all") {
                    db.transaction((tx) => {
                      tx.executeSql(
                        `delete from staff_list where ( account = ? );`,
                        [r.account],
                        () => {
                          tx.executeSql(
                            `select * from staff_list;`,
                            [],
                            (_, { rows }) => {
                              if (rows._array.length) {
                                setStaffs(rows._array);
                              }
                            },
                            () => {
                              console.log("失敗");
                            }
                          );
                        },
                        () => {
                          // console.log(r.name_1+"のデータ削除 失敗");
                        }
                      );
                    });
                  }
                });
              });
            }
          },
          () => {
            console.log("失敗");
          }
        );
      }

      tx.executeSql(
        `select * from staff_list where (account = 'all');`,
        [],
        (_, { rows }) => {
          if (rows._array.length == 0) {
            tx.executeSql(
              `insert into staff_list values ('all','','','');`,
              [],
              () => {
                console.log("all OK");
              },
              () => {
                console.log("all 失敗");
              }
            );
          }
        },
        () => {
          console.log("失敗");
        }
      );

      tx.executeSql(
        `select * from staff_list;`,
        // `delete from staff_list;`,
        [],
        (_, { rows }) => {
          if (rows._array.length) {
            setStaffs(rows._array);

            rows._array.map((s) => {
              if (s.check) {
                setStaff_Value(s.account);
              }
            });
          }
        },
        () => {
          console.log("失敗");
        }
      );
    });
  }

  // お客様情報＋最新のコミュニケーションデータベース登録
  function Insert_customer_db(customer) {
    db.transaction((tx) => {
      if (customer) {
        tx.executeSql(
          `select * from customer_mst;`,
          [],
          (_, { rows }) => {
            // ひとつもなかったらinsert
            if (!rows._array.length) {
              db.transaction((tx) => {
                Promise.all(
                  customer.map((cus) => {
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
                      tx.executeSql(
                        `insert into customer_mst values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
                        [
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
                        ],
                        () => {
                          // console.log("insert customer_mst");
                        },
                        () => {
                          console.log("customer_mst 失敗");
                        }
                      );
                    }
                  })
                ).then(() => {
                  tx.executeSql(
                    `select * from customer_mst order by time desc;`,
                    [],
                    (_, { rows }) => {
                      setMemos(rows._array);
                    }
                  );
                });
              });
            }

            // 最新の情報に書き換える + 新しいお客様追加 + 削除
            if (rows._array.length) {
              const rocal = rows._array;

              // 書き換え
              rocal.map((r) => {
                customer.map((cus) => {
                  if (
                    cus.customer_user_id === r.customer_id &&
                    cus.category_number != "1"
                  ) {
                    if (
                      cus.communication_time != r.time ||
                      cus.communication_note != r.note ||
                      cus.name != r.name
                    ) {
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

                      if (!cus.communication_note && cus.line_note) {
                        cus.communication_note = cus.line_note;
                      }

                      db.transaction((tx) => {
                        //console.log(cus)
                        let status = cus.status;

                        if (status == "未対応" && cus.SENPUKI_autofollow) {
                          status = "メールモンスター";
                        } else if (!status) {
                          status = "未対応";
                        }

                        tx.executeSql(
                          `update customer_mst set name = (?), kana = (?), time = (?), title = (?), note = (?), mail1 = (?), mail2 = (?), mail3 = (?), line = (?), staff_name = (?), media = (?), article_url = (?), status = (?) where ( customer_id = ? );`,
                          [
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
                            status,
                            cus.customer_user_id,
                          ],
                          () => {
                            tx.executeSql(
                              `select * from customer_mst order by time desc;`,
                              [],
                              (_, { rows }) => {
                                if (rows._array.length) {
                                  setMemos(rows._array);
                                }
                              }
                            );
                          }
                          // () => {console.log(cus.name+"のデータ更新 失敗");}
                        );
                      });
                    }
                  }
                });
              });

              // 追加
              const local_cus_id = rocal.map((r) => {
                return r.customer_id;
              });

              const server_cus_id = customer.map((c) => {
                return c.customer_user_id;
              });

              const add_customer = server_cus_id.filter(
                (c) => local_cus_id.indexOf(c) == -1
              );

              customer.map((cus) => {
                add_customer.map((add) => {
                  if (
                    cus.customer_user_id === add &&
                    cus.category_number != "1"
                  ) {
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

                    if (!cus.communication_note && cus.line_note) {
                      cus.communication_note = cus.line_note;
                    }

                    let status = cus.status;

                    if (status == "未対応" && cus.SENPUKI_autofollow) {
                      status = "メールモンスター";
                    } else if (!status) {
                      status = "未対応";
                    }

                    db.transaction((tx) => {
                      tx.executeSql(
                        `insert into customer_mst values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`,
                        [
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
                        ],
                        () => {
                          tx.executeSql(
                            `select * from customer_mst order by time desc;`,
                            [],
                            (_, { rows }) => {
                              if (rows._array.length) {
                                setMemos(rows._array);
                              }
                            }
                          );
                        },
                        () => {
                          // console.log(cus.name+"のデータ追加 失敗");
                        }
                      );
                    });
                  }
                });
              });

              // 削除
              const del_customer = local_cus_id.filter(
                (c) => server_cus_id.indexOf(c) == -1
              );

              rocal.map((r) => {
                del_customer.map((del) => {
                  if (r.customer_id === del) {
                    db.transaction((tx) => {
                      tx.executeSql(
                        `delete from customer_mst where ( customer_id = ? );`,
                        [r.customer_id],
                        () => {
                          tx.executeSql(
                            `select * from customer_mst order by time desc;`,
                            [],
                            (_, { rows }) => {
                              if (rows._array.length) {
                                setMemos(rows._array);
                              }
                            }
                          );
                        },
                        () => {
                          // console.log(r.name+"のデータ削除 失敗");
                        }
                      );
                    });
                  }
                });
              });
            }
          },
          () => {
            console.log("失敗1");
          }
        );
      }

      tx.executeSql(
        `select * from customer_mst order by time desc;`,
        // `select * from customer_mst where ( customer_id = ? );`,
        // `delete from customer_mst;`,
        // ['27'],
        [],
        (_, { rows }) => {
          if (rows._array.length) {
            setMemos(rows._array);
            setA("a");
          }
        },
        () => {
          console.log("失敗");
        }
      );
    });
  }

  // 定型文データベース登録
  function Insert_fixed_db(fixed) {
    db.transaction((tx) => {
      if (fixed) {
        tx.executeSql(
          `select * from fixed_mst;`,
          [],
          (_, { rows }) => {
            if (!rows._array.length) {
              db.transaction((tx) => {
                Promise.all(
                  fixed.map((f) => {
                    tx.executeSql(
                      `insert into fixed_mst values (?,?,?,?,?);`,
                      [f.fixed_id, f.category, f.title, f.mail_title, f.note],
                      () => {
                        // console.log("insert staff_list");
                      },
                      () => {
                        console.log("fixed_mst 失敗");
                      }
                    );
                  })
                ).then(() => {
                  tx.executeSql(
                    `select * from fixed_mst;`,
                    [],
                    (_, { rows }) => {
                      setFixed(rows._array);
                    }
                  );
                });
              });
            }

            // 最新の定型文に書き換える + 新しい定型文追加 + 削除
            if (rows._array.length) {
              const rocal = rows._array;

              // 書き換え
              rocal.map((r) => {
                fixed.map((f) => {
                  if (f.fixed_id && r.fixed_id) {
                    if (f.fixed_id === r.fixed_id) {
                      if (
                        f.category != r.category ||
                        f.title != r.title ||
                        f.mail_title != r.mail_title ||
                        f.note != r.note
                      ) {
                        db.transaction((tx) => {
                          tx.executeSql(
                            `update fixed_mst set category = (?), title = (?), mail_title = (?), note = (?) where ( fixed_id = ? );`,
                            [
                              f.category,
                              f.title,
                              f.mail_title,
                              f.note,
                              f.fixed_id,
                            ],
                            () => {
                              tx.executeSql(
                                `select * from fixed_mst;`,
                                [],
                                (_, { rows }) => {
                                  if (rows._array.length) {
                                    setFixed(rows._array);
                                  }
                                }
                              );
                            },
                            () => {
                              console.log("定型文のデータ更新 失敗");
                            }
                          );
                        });
                      }
                    }
                  }
                });
              });

              // 追加
              const local_fixed_list = rocal.map((r) => {
                return r.fixed_id;
              });

              const server_fixed_list = fixed.map((s_l) => {
                return s_l.fixed_id;
              });

              const add_fixed_list = server_fixed_list.filter(
                (c) => local_fixed_list.indexOf(c) == -1
              );

              fixed.map((f) => {
                add_fixed_list.map((add) => {
                  if (f.fixed_id === add) {
                    db.transaction((tx) => {
                      tx.executeSql(
                        `insert into fixed_mst values (?,?,?,?,?);`,
                        [f.fixed_id, f.category, f.title, f.mail_title, f.note],
                        () => {
                          tx.executeSql(
                            `select * from fixed_mst;`,
                            [],
                            (_, { rows }) => {
                              if (rows._array.length) {
                                setFixed(rows._array);
                              }
                            }
                          );
                        },
                        () => {
                          console.log(f.title + "のデータ追加 失敗");
                        }
                      );
                    });
                  }
                });
              });

              // 削除
              const del_fixed_list = local_fixed_list.filter(
                (c) => server_fixed_list.indexOf(c) == -1
              );

              rocal.map((r) => {
                del_fixed_list.map((del) => {
                  if (r.fixed_id === del) {
                    db.transaction((tx) => {
                      tx.executeSql(
                        `delete from fixed_mst where ( fixed_id = ? );`,
                        [r.fixed_id],
                        () => {
                          tx.executeSql(
                            `select * from fixed_mst;`,
                            [],
                            (_, { rows }) => {
                              if (rows._array.length) {
                                setFixed(rows._array);
                              }
                            }
                          );
                        },
                        () => {
                          console.log(r.title + "のデータ削除 失敗");
                        }
                      );
                    });
                  }
                });
              });
            }
          },
          () => {
            console.log("失敗");
          }
        );
      }

      tx.executeSql(
        `select * from fixed_mst;`,
        // `delete from fixed_mst;`,
        [],
        (_, { rows }) => {
          setFixed(rows._array);
        },
        () => {
          console.log("失敗");
        }
      );
    });
  }

  function onSubmit() {
    setLoading(true);

    db.transaction((tx) => {
      tx.executeSql(
        `select * from customer_mst where (name||kana)  like '%` +
          name +
          `%' order by time desc;`,
        [],
        (_, { rows }) => {
          if (rows._array.length) {
            setMemos(rows._array);
          }
        },
        () => {
          console.log("失敗");
        }
      );
    });

    setLoading(false);
  }

  if (a) {
    setLoading(true);

    db.transaction((tx) => {
      if (staff_value == "all") {
        tx.executeSql(
          `select * from customer_mst order by time desc;`,
          [],
          (_, { rows }) => {
            if (rows._array.length) {
              setMemos(rows._array);
            }
          },
          () => {
            console.log("失敗1");
          }
        );

        tx.executeSql(
          `update staff_list set "check" = null;`,
          [],
          (_, { rows }) => {},
          () => {
            console.log("失敗1");
          }
        );
        tx.executeSql(
          `update staff_list set "check" = '1' where ( account = 'all' );`,
          [],
          (_, { rows }) => {},
          () => {
            console.log("失敗1");
          }
        );
      } else if (staff_value == "") {
        tx.executeSql(
          `select * from customer_mst where (reverberation_user_id = '' or reverberation_user_id is null) and (coming_user_id = '' or coming_user_id is null) order by time desc;`,
          [],
          (_, { rows }) => {
            if (rows._array.length) {
              setMemos(rows._array);
            } else {
              setMemos([]);
            }
          },
          () => {
            console.log("失敗2");
          }
        );

        tx.executeSql(
          `update staff_list set "check" = null;`,
          [],
          (_, { rows }) => {},
          () => {
            console.log("失敗1");
          }
        );
      } else {
        tx.executeSql(
          `select * from customer_mst where (reverberation_user_id = ?) or (coming_user_id = ?) order by time desc;`,
          [staff_value],
          (_, { rows }) => {
            if (rows._array.length) {
              setMemos(rows._array);
            }
          },
          () => {
            console.log("失敗2");
          }
        );

        tx.executeSql(
          `update staff_list set "check" = null;`,
          [],
          (_, { rows }) => {},
          () => {
            console.log("失敗1");
          }
        );
        tx.executeSql(
          `update staff_list set "check" = '1' where ( account = ? );`,
          [staff_value],
          (_, { rows }) => {},
          () => {
            console.log("失敗1");
          }
        );
      }
    });

    setLoading(false);
    setA(false);
  }

  function headerRight() {
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
                  station: route.station,
                  address: route.address,
                  profile: route.profile,
                  staff: staffs,
                  fixed: fixed,
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
                  station: route.station,
                  address: route.address,
                  profile: route.profile,
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
                  station: route.station,
                  address: route.address,
                  profile: route.profile,
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
      </View>
    )
  }

  return (
    <SideMenu
      menu={headerRight()}
      isOpen={menu}
      onChange={isOpen => {
        setMenu(isOpen);
      }}
      menuPosition={'right'}
      openMenuOffset={deviceScreen.width * 0.5}
    >
      <View style={styles.container}>
        <View style={menu&&styles.container2}></View>
        <Loading isLoading={isLoading} />
        <View style={styles.search}>
          <View style={styles.searchinner}>
            <TextInput
              style={styles.searchInput}
              value={name}
              onChangeText={(text) => {
                setName(text);
              }}
              placeholder="  お客様名検索"
              placeholderTextColor="#b3b3b3"
            />
            <TouchableOpacity style={styles.buttonContainer} onPress={onSubmit}>
              <Text style={styles.buttonLabel}>検　索</Text>
            </TouchableOpacity>
          </View>
        </View>
        <DropDownPicker
          style={styles.DropDown}
          dropDownContainerStyle={styles.dropDownContainer}
          open={open}
          value={staff_value}
          items={items}
          setOpen={setOpen}
          setValue={setStaff_Value}
          placeholder="▼　担当者"
          zIndex={999}
          onClose={() => {
            setA("a");
          }}
        />
        <FlatList
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          initialNumToRender={10}
          data={memos}
          renderItem={({ item }) => {
            if (!item.del_flg) {
              return (
                <TouchableOpacity
                  style={styles.ListItem}
                  onPress={() => {
                    navigation.reset({
                      index: 0,
                      routes: [
                        {
                          name: "TalkScreen",
                          params: route.params,
                          customer: item.customer_id,
                          websocket: route.websocket,
                          station: route.station,
                          address: route.address,
                          profile: route.profile,
                          staff: staffs,
                          fixed: fixed,
                          cus_name: item.name,
                        },
                      ],
                    });
                  }}
                >
                  <View style={styles.ListInner}>
                    <View style={{ flexDirection: "row" }}>
                      <Text
                        style={
                          item.status == "未対応"
                            ? { color: "red", fontSize: 18 }
                            : { display: "none" }
                        }
                      >
                        ●
                      </Text>
                      <Text style={styles.name} numberOfLines={1}>
                        {item.name
                          ? item.name.length < 10
                            ? item.name
                            : item.name.substring(0, 10) + "..."
                          : ""}
                      </Text>
                    </View>
                    <Text style={styles.date}>
                      {item.time ? item.time.slice(0, -3) : ""}
                    </Text>
                    <Text style={styles.message} numberOfLines={1}>
                      {item.title === "スタンプ"
                        ? "スタンプを送信しました"
                        : !item.note
                        ? item.title
                        : item.note}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }
          }}
          keyExtractor={(item) => `${item.customer_id}`}
        />
      </View>
    </SideMenu>
  );
}

const styles = StyleSheet.create({
  header_img: {
    width: 150,
    height: 45,
  },
  container: {
    flex: 1,
    backgroundColor:'#f1f1f1'
  },
  container2: {
    flex: 1,
    position: "absolute",
    width: "100%",
    height: "100%",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    zIndex: 1000,
  },
  search: {
    zIndex: 100,
    backgroundColor: "#f1f1f1",
    height: 120,
  },
  searchinner: {
    margin: 10,
  },
  searchInput: {
    fontSize: 16,
    width: "75%",
    height: 48,
    paddingHorizontal: 10,
    marginBottom: 10,
    borderColor: "#dddddd",
    borderWidth: 1,
    backgroundColor: "#ffffff",
  },
  DropDown: {
    position: "absolute",
    top: -60,
    width: 200,
    fontSize: 16,
    height: 40,
    margin: 10,
  },
  dropDownContainer: {
    width: 200,
    position: "absolute",
    top: -22,
    margin: 10,
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
  },
  name: {
    fontSize: 18,
    marginBottom: 5,
  },
  date: {
    position: "absolute",
    right: 0,
    bottom: 30,
  },
  message: {
    fontSize: 14,
    color: "#848484",
  },
  memoDelete: {
    padding: 8,
  },
  belltext: {
    alignItems: "center",
    position: "absolute",
    color: "white",
    fontWeight: "bold",
    backgroundColor: "red",
    borderRadius: 5,
    paddingLeft: 5,
    paddingRight: 5,
    left: 30,
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
