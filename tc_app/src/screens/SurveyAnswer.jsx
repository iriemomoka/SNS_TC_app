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
  Alert,
  FlatList,
  RefreshControl,
  AppState,
  Keyboard,
  Image,
  ScrollView,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import SideMenu from "react-native-side-menu-updated";
import RadioButtonRN from "radio-buttons-react-native";
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

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

export default function SurveyAnswer(props) {
  const { navigation, route } = props;

  const [isLoading, setLoading] = useState(false);
  const [reload, setReload] = useState("");
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);

  const radioEvaluation = [
    { label: 1, value: "1" },
    { label: 2, value: "2" },
    { label: 3, value: "3" },
    { label: 4, value: "4" },
    { label: 5, value: "5" },
  ];

  // ラジオボタンの値
  const handleRadioChange = (index, value, question_no, target_staff_id) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [`evaluation_stage ${index}`]: value,
      [`question_no ${index}`]: question_no,
      [`target_staff_id ${index}`]: target_staff_id,
    }));
  };

  // テキストエリアの値
  const handleTextChange = (index, text, question_no, target_staff_id) => {
    setAnswers((prevAnswers) => ({
      ...prevAnswers,
      [`evaluation_answer ${index}`]: text,
      [`question_no ${index}`]: question_no,
      [`target_staff_id ${index}`]: target_staff_id,
    }));
  };

  // 各テキストエリアとラジオボタンの値を登録用のオブジェクトに変換
  function transformObject(answers) {
    const resultArray = [];
    const tempObj = {};

    Object.keys(answers).forEach((key) => {
      const [prefix, suffix] = key.split(/\s+/);

      tempObj[suffix] = tempObj[suffix] || {};

      const cleanPrefix = prefix.replace(/_\d+$/, "");
      tempObj[suffix][cleanPrefix] = answers[key];
    });

    Object.keys(tempObj)
      .sort()
      .forEach((suffix) => {
        resultArray.push(tempObj[suffix]);
      });

    return resultArray;
  }

  // アンケート回答の登録
  const onSubmit = () => {
    setLoading(true);

    const registerObject = {
      evaluation_no: route.evaluation_no,
      shop_id: route.params.shop_id,
      answer_staff_id: route.params.account,
    };

    let answerObject = transformObject(answers);

    // 質問に対する回答が全て入力されていない場合は登録しない。
    if (questions.length > answerObject.length) {
      Alert.alert("【登録エラー】", "未入力の項目があります");
      setLoading(false);
      return false;
    }

    // 登録に必要なカラムの値を追加する
    answerObject = answerObject.map((obj) => {
      return { ...obj, ...registerObject };
    });

    let formData = new FormData();
    formData.append("ID", route.params.account);
    formData.append("pass", route.params.password);
    formData.append("act", "survey_register");
    formData.append("fc_flg", global.fc_flg);
    formData.append("answer_object", JSON.stringify(answerObject));
    formData.append("formdata_flg", 1);

    fetch(domain + "batch_app/api_system_app.php?" + Date.now(), {
      method: "POST",
      headers: {
        "content-type": "multipart/form-data",
      },
      body: formData,
    })
      .then((response) => response.json())
      .then((json) => {
        setLoading(false);
        // console.log(json);
        if (json) {
          Alert.alert("アンケートを登録しました");

          navigation.reset({
            index: 0,
            routes: [
              {
                name: "SurveyList",
                params: route.params,
                websocket: route.websocket,
                websocket2: route.websocket2,
                profile: route.profile,
                previous: "SurveyAnswer",
                reload: reload,
              },
            ],
          });
        } else {
          Alert.alert("登録に失敗しました");
        }
      })
      .catch((error) => {
        setLoading(false);
        // console.log(error);
        Alert.alert("登録に失敗しました");
      });
  };

  useLayoutEffect(() => {
    if (AppState.currentState === "active") {
      Notifications.setBadgeCountAsync(0);
    }

    navigation.setOptions({
      headerStyle: !global.fc_flg
        ? { backgroundColor: "#6C9BCF", height: 110 }
        : { backgroundColor: "#FF8F8F", height: 110 },
      headerTitle: () => (
        <Text style={styles.headerTitle}>{route.evaluation_title}</Text>
      ),
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
                  name: "SurveyList",
                  params: route.params,
                  websocket: route.websocket,
                  websocket2: route.websocket2,
                  profile: route.profile,
                  previous: "SurveyAnswer",
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
        act: "get_survey_detail",
        fc_flg: global.fc_flg,
        evaluation_no: route.evaluation_no,
      }),
    })
      .then((response) => response.json())
      .then((json) => {
        setQuestions(json["question_list"]);
      })
      .catch((error) => {
        console.log(error);
      });
  }, [route]);

  const surveyDetail = useMemo(() => {
    if (!questions) {
      return (
        <View>
          <Text style={{ alignSelf: "center" }}>質問がありません</Text>
        </View>
      );
    } else if (questions.length == 0) {
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
        <>
          <View style={styles.staffProfile}>
            {route.staff_photo1 ? (
              <Image
                style={styles.icon}
                source={{ uri: domain + "img/staff_img/" + route.staff_photo1 }}
              />
            ) : (
              <Image
                style={styles.icon}
                source={require("../../assets/photo4.png")}
              />
            )}
            <Text style={styles.targetStaff}>
              【
              {route.params.account == route.target_staff_id
                ? "自己評価"
                : route.full_name}
              】
            </Text>
          </View>
          {questions.map((q, index) => (
            <View key={`question-${index}`}>
              <Text style={styles.questionTitle}>{q.question_note}</Text>
              {q.question_kinds === "記述式" ? (
                <TextInput
                  style={styles.textarea}
                  multiline={true}
                  numberOfLines={11}
                  onChangeText={(text) =>
                    handleTextChange(
                      index,
                      text,
                      q.question_no,
                      route.target_staff_id
                    )
                  }
                />
              ) : (
                <RadioButtonRN
                  data={radioEvaluation}
                  box={false}
                  circleSize={16}
                  style={styles.radioGroup}
                  boxStyle={styles.radioBox}
                  textStyle={styles.radioText}
                  activeColor={"blue"}
                  selectedBtn={(e) =>
                    handleRadioChange(
                      index,
                      e.value,
                      q.question_no,
                      route.target_staff_id
                    )
                  }
                />
              )}
            </View>
          ))}

          <TouchableOpacity
            style={styles.submit}
            onPress={() => {
              onSubmit();
            }}
          >
            <Text style={styles.submitLabel}>登　録</Text>
          </TouchableOpacity>
        </>
      );
    }
  }, [questions, answers]);

  return (
    <SideMenu menuPosition={"right"}>
      <ScrollView style={styles.container}>
        <Loading isLoading={isLoading} />
        <Text style={styles.title}>アンケート内容</Text>
        <Text style={styles.contents}>{route.evaluation_note}</Text>
        {surveyDetail}
      </ScrollView>
    </SideMenu>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "500",
  },
  container: {
    flex: 1,
    backgroundColor: "#f1f1f1",
    width: "90%",
    alignSelf: "center",
  },
  title: {
    fontSize: 20,
    color: "#384955",
    fontWeight: "bold",
    marginTop: 20,
  },
  contents: {
    fontSize: 16,
    marginTop: 10,
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
  questionTitle: {
    fontSize: 18,
    color: "#384955",
    fontWeight: "bold",
    marginTop: 20,
  },
  radioGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
    marginRight: 18,
    marginLeft: 5,
  },
  radioText: {
    color: "#000000",
    fontWeight: "bold",
    position: "absolute",
    marginLeft: 20,
  },
  radioBox: {
    alignItems: "center",
    padding: 10,
  },
  textarea: {
    height: 200,
    paddingVertical: 10,
    paddingHorizontal: 5,
    borderColor: "#1f2d53",
    fontSize: 16,
    borderWidth: 1.5,
    borderRadius: 8,
    textAlignVertical: "top",
    marginTop: 10,
    backgroundColor: "#ffffff",
  },
  submit: {
    marginTop: 30,
    marginBottom: 50,
    backgroundColor: "#384955",
    borderRadius: 8,
    alignSelf: "center",
  },
  submitLabel: {
    fontSize: 20,
    lineHeight: 32,
    paddingVertical: 8,
    paddingHorizontal: 32,
    color: "#ffffff",
  },
  staffProfile: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 50,
    height: 50,
    borderRadius: 100,
    marginRight: 10,
  },
  targetStaff: {
    fontSize: 18,
    color: "#384955",
    fontWeight: "bold",
  },
});
