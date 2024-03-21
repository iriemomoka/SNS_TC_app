import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  useLayoutEffect,
  useContext,
} from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  AppState,
  Keyboard,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import Moment from "moment";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SideMenu from "react-native-side-menu-updated";
import * as SQLite from "expo-sqlite";

import Loading from "../components/Loading";
import { GetDB, db_select, db_write } from "../components/Databace";

import Storage from "react-native-storage";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ローカルストレージ読み込み
const storage = new Storage({
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

const db = SQLite.openDatabase("db");

let domain = "http://family.chinser.co.jp/irie/tc_app/";
// let domain = "https://www.total-cloud.net/";

export default function SurveyList(props) {
  const { navigation, route } = props;

  const [isLoading, setLoading] = useState(false);
  const [reload, setReload] = useState("");
  const [surveys, setSurveys] = useState([]);

  useLayoutEffect(() => {
    if (AppState.currentState === "active") {
      Notifications.setBadgeCountAsync(0);
    }

    navigation.setOptions({
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#6C9BCF", height: 110 }
        : { backgroundColor: "#FF8F8F", height: 110 },
      headerTitle: () => <Text style={styles.headerTitle}>アンケート一覧</Text>,
      headerLeft: () => (
        <Feather
          name="chevron-left"
          color="white"
          size={30}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [
                {
                  name: "CommunicationHistory",
                  params: route.params,
                  websocket: route.websocket,
                  websocket2: route.websocket2,
                  profile: route.profile,
                  previous: "SurveyList",
                  reload: reload,
                },
              ],
            });
          }}
          style={{ padding: 10 }}
        />
      ),
    });
  }, []);

  useEffect(() => {
    fetch(domain + "batch_app/api_system_app.php?" + Date.now(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: JSON.stringify({
        ID: route.params.account,
        pass: route.params.password,
        act: "get_survey",
        fc_flg: global.fc_flg,
      }),
    })
      .then((response) => response.json())
      .then((json) => {
        setSurveys(json);

        const today = Moment(new Date()).format("YYYY-MM-DD");
        let limit_flg = 0;

        json.map((value) => {
          if (value.answer_count < value.question_count) {
            let evaluation_end_day = value.evaluation_end_time.substring(0, 10);

            // 回答期限
            let date1 = new Date(evaluation_end_day);
            // 今日の日付
            let date2 = new Date(today);

            // 回答期限までの日数
            let msDiff = date1.getTime() - date2.getTime();
            let limit = Math.ceil(msDiff / (1000 * 60 * 60 * 24));

            if (limit < 2) {
              limit_flg = 1;
            }
          }
        });

        // 回答期限が明日になっているアンケートがあればプッシュ通知
        if (limit_flg) {
          Notifications.scheduleNotificationAsync({
            content: {
              body: "明日が回答期限のアンケートがあります。期限までに回答して下さい。",
            },
            trigger: {
              seconds: 1,
            },
          });
        }
      })
      .catch((error) => {
        console.log(error);
      });
  }, [route]);

  const surveyList = useMemo(() => {
    if (!surveys) {
      return (
        <View>
          <Text style={{ alignSelf: "center" }}>アンケートがありません</Text>
        </View>
      );
    } else if (surveys.length == 0) {
      return (
        <View style={{ marginTop: 150 }}>
          <TouchableOpacity
            style={styles.buttonReload}
            // onPress={() => onRefresh(true)}
          >
            <Text style={styles.buttonReloadLabel}>読　込</Text>
          </TouchableOpacity>
        </View>
      );
    } else {
      return (
        <FlatList
          bounces={true}
          // ref={listRef}
          // onEndReached={endRefresh}
          // refreshControl={
          //   date != "最新データ取得中" ? (
          //     <RefreshControl
          //       refreshing={refreshing}
          //       onRefresh={async () => {
          //         await onRefresh(true);
          //       }}
          //     />
          //   ) : (
          //     <></>
          //   )
          // }
          initialNumToRender={10}
          data={surveys}
          renderItem={({ item }) => {
            return (
              <TouchableOpacity
                style={[
                  styles.ListItem,
                  item.answer_count < item.question_count
                    ? ""
                    : { backgroundColor: "#b3b3b3" },
                ]}
                disabled={
                  item.answer_count < item.question_count ? false : true
                }
                onPress={() => {
                  navigation.reset({
                    index: 0,
                    routes: [
                      {
                        name: "SurveyAnswer",
                        params: route.params,
                        evaluation_no: item.evaluation_no,
                        websocket: route.websocket,
                        websocket2: route.websocket2,
                        profile: route.profile,
                        evaluation_title: item.evaluation_title,
                        evaluation_note: item.evaluation_note,
                        target_staff_id: item.target_staff_id,
                        full_name: item.name_1 + " " + item.name_2,
                        staff_photo1: item.staff_photo1,
                      },
                    ],
                  });
                }}
              >
                <View style={styles.ListInner}>
                  <View style={{ flexDirection: "row" }}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.evaluation_title
                        ? item.evaluation_title.length < 15
                          ? item.evaluation_title
                          : item.evaluation_title.substring(0, 15) + "..."
                        : ""}
                    </Text>
                  </View>
                  <Text style={styles.target_name}>
                    {"対象者：" + item.name_1 + " " + item.name_2}
                  </Text>
                  <Text style={styles.date}>
                    {item.evaluation_end_time
                      ? "【期限】" + item.evaluation_end_time.substring(0, 10)
                      : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
          keyExtractor={(item, index) => `${index}`}
        />
      );
    }
  }, [surveys]);

  return (
    <SideMenu menuPosition={"right"}>
      <View style={styles.container}>
        <Loading isLoading={isLoading} />
        {surveyList}
      </View>
    </SideMenu>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#f1f1f1",
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
    marginTop: 5,
  },
  target_name: {
    position: "absolute",
    left: 0,
    bottom: 30,
  },
  date: {
    position: "absolute",
    right: 0,
    bottom: 30,
  },
});
