import React, { useState,useEffect,useMemo } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, BackHandler, AppState, Keyboard, Platform, TouchableWithoutFeedback
} from "react-native";
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import RadioButtonRN from 'radio-buttons-react-native';
import Moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from "react-native-modal";
import { CheckBox } from 'react-native-elements';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'

import Loading from '../components/Loading';
import { db,db_write,GetDB } from '../components/Databace';

import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ローカルストレージ読み込み
const storage = new Storage({
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

export default function CustomerEdit(props) {

  if (AppState.currentState === 'active') {
    Notifications.setBadgeCountAsync(0);
  }
  
  const { navigation, route } = props;
  
  const [isLoading, setLoading] = useState(false);
  
  // 0：基本 1：反響 2：来店 3：契約
  const [form, setForm] = useState(0);

  // ----- 基本 START -----
  const [customer, setCustomer] = useState({
    id:"",
    name: "",
    kana: "",
    tel1: "",
    tel2: "",
    tel3: "",
    mail1: "",
    mail2: "",
    mail3: "",
    sex: "",
    age: "",
    work: "",
  });

  const sexList = [
    {label:"選択してください",value:""},
    {label:"男性",value:"男性"},
    {label:"女性",value:"女性"},
  ]

  const ageList = [
    { label: "選択してください", value: "" },
    { label: "17歳以下", value: "17" },
    ...Array.from({ length: 63 }, (v, i) => ({ label: `${i + 18}歳`, value: `${i + 18}` })),
    { label: "81歳以上", value: "81" },
  ];

  const workList = [
    { label: "選択してください", value: "" },
    { label: "会社員", value: "会社員" },
    { label: "会社役員", value: "会社役員" },
    { label: "自営業", value: "自営業" },
    { label: "専門職", value: "専門職" },
    { label: "公務員", value: "公務員" },
    { label: "学生", value: "学生" },
    { label: "専業主婦/主夫", value: "専業主婦/主夫" },
    { label: "パート・アルバイト・フリーター", value: "パート・アルバイト・フリーター" },
    { label: "無職・定年退職", value: "無職・定年退職" },
    { label: "その他", value: "その他" },
  ];

  const shop_type = [
    { label: "本店", value: 1 },
    { label: "支店", value: 2 },
  ]

  const rental_type = [
    { label: "住居用", value: 1 },
    { label: "テナント", value: 2 },
  ]
  // ----- 基本 END -----

  // ----- 反響 START -----
  const [reverberation, setReverberation] = useState({
    reverberation_name:"",
    reverberation_media: "",
    reverberation_inquiry_day: "",
    reverberation_ninzu: "",
    reverberation_move_time: "",
    reverberation_move_time2: "",
    article_data: "",
    reverberation_note: "",
  });

  const [staffs, setStaffs] = useState([]);
  var staffList = useMemo(()=>{
    var items = [];
    for (var s=0;s<staffs.length;s++) {
      var item = staffs[s];
      if (item.account != "all") {
        var data = {
          label:item.name_1 + "　" + (item.name_2 ? item.name_2 : ""),
          value: item.account,
        }
        items.push(data);
      }
    }
    items.unshift({ label: "選択してください", value: "" });
    return items;
  },[staffs]);

  const [media, setMedia] = useState([]);
  var mediaList = useMemo(()=>{
    var items = [];
    for (var m=0;m<media.length;m++) {
      var data = {
        label:media[m],
        value: media[m],
      }
      items.push(data);
    }
    items.unshift({ label: "選択してください", value: "" });
    return items;
  },[media]);

  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('date');

  const ninzuList = [
    { label: "選択してください", value: "" },
    ...Array.from({ length: 4 }, (v, i) => ({ label: `${i + 1}人`, value: `${i + 1}` })),
    { label: "5人以上", value: "5" },
  ]

  const move_time = [
    { label: "未定", value: "未定" },
    ...Array.from({ length: 12 }, (v, i) => ({ label: `${i + 1}月`, value: `${i + 1}月` }))
  ];

  const move_time2 = [
    { label: "-", value: "" },
    { label: "上旬", value: "上旬" },
    { label: "中旬", value: "中旬" },
    { label: "下旬", value: "下旬" },
    ...Array.from({ length: 31 }, (v, i) => ({ label: `${i + 1}日`, value: `${i + 1}日` }))
  ];
  // ----- 反響 END -----

  // ----- 来店 START -----
  const [coming, setComing] = useState({
    coming_name: "",
    coming_day1: "",
    coming_flg1: "",
    coming_local_flg1: "",
    coming_online_flg1: "",
    coming_reverberation: "",
    f_coming_reason: "",
    f_coming_campany_reason_note: "",
    coming_day2: "",
    coming_flg2: "",
    coming_local_flg2: "",
    coming_online_flg2: "",
    coming_day3: "",
    coming_flg3: "",
    coming_local_flg3: "",
    coming_online_flg3: "",
    coming_day4: "",
    coming_flg4: "",
    coming_local_flg4: "",
    coming_online_flg4: "",
    coming_note: "",
  });

  const [coming_day, setComing_day] = useState(1);

  const reverberationList = [
    { label: "選択してください", value: "" },
    { label: "反響", value: "反響" },
    { label: "飛び込み", value: "飛び込み" },
    { label: "キャッチ", value: "キャッチ" },
    { label: "紹介", value: "紹介" },
    { label: "リピーター", value: "リピーター" },
    { label: "法人紹介", value: "法人紹介" },
    { label: "その他", value: "その他" },
  ];

  const [reason, setReason] = useState([]);
  var reasonList = useMemo(()=>{
    var items = [];
    for (var r=0;r<reason.length;r++) {
      var data = {
        label:reason[r],
        value: reason[r],
      }
      items.push(data);
    }
    items.push({ label: "その他", value: "その他" });
    return items;
  },[reason]);
  
  // ----- 来店 END -----

  // ----- 契約 START -----
  const [contract, setContract] = useState({
    contract_name:"",
    contract_article_name: "",
    contract_room_no: "",
  });
  // ----- 契約 END -----

  async function settingCustomer() {

    if (route.customer_data.main) {
      const cus = route.customer_data.main;
      setCustomer({
        id: cus.customer_id,
        name: cus.name,
        kana: cus.kana,
        tel1: cus.tel1,
        tel2: cus.tel2,
        tel3: cus.tel3,
        mail1: cus.mail1,
        mail2: cus.mail2,
        mail3: cus.mail3,
        sex: cus.sex,
        age: cus.age,
        work: cus.work,
        shop_type: Number(cus.shop_type),
        rental_type: Number(cus.rental_type),
      })
    }

    const sl = await GetDB('staff_list');
    if (sl != false) {
      setStaffs(sl);
    } else {
      setStaffs([]);
    }

    if (route.customer_data.shop_choice) {
      if (route.customer_data.shop_choice.media_list) {
        const mediaArr = (route.customer_data.shop_choice.media_list).split(',');
        setMedia(mediaArr);
      }

      if(route.customer_data.shop_choice.reason_list) {
        const reasonArr = (route.customer_data.shop_choice.reason_list).split(',');
        setReason(reasonArr);
      }
    }

    if (route.customer_data.reverberation) {
      const rev = route.customer_data.reverberation;
      
      let moveTime = {kiboubi:"",kiboubi_day:""};
      let rmt = rev.move_time;
      if (rmt.includes('未定')) {
        moveTime["kiboubi"]     = '未定';
      } else if (rmt !== "" && !rmt.includes('未定')) {
        moveTime["kiboubi"]     = rmt.substring(0, rmt.indexOf("月") + 1);
        moveTime["kiboubi_day"] = rmt.substring(rmt.indexOf("月") + 1);
      }

      setReverberation({
        reverberation_name:rev.user_id,
        reverberation_media: rev.media,
        reverberation_inquiry_day: rev.inquiry_day?new Date(rev.inquiry_day):"",
        reverberation_ninzu: rev.ninzu?rev.ninzu:"",
        reverberation_move_time: moveTime["kiboubi"],
        reverberation_move_time2: moveTime["kiboubi_day"],
        article_data: rev.article_list,
        reverberation_note: rev.note,
      });
    }

    if (route.customer_data.coming) {
      const com = route.customer_data.coming;

      setComing({
        coming_name:com.user_id,
        coming_day1: com.coming_day1?new Date(com.coming_day1):"",
        coming_flg1: com.coming_flg1,
        coming_local_flg1: com.coming_local_flg1,
        coming_online_flg1: com.coming_online_flg1,
        coming_reverberation: com.campany_device,
        f_coming_reason: com.campany_reason,
        f_coming_campany_reason_note: com.campany_reason_note,
        coming_day2: com.coming_day2?new Date(com.coming_day2):"",
        coming_flg2: com.coming_flg2,
        coming_local_flg2: com.coming_local_flg2,
        coming_online_flg2: com.coming_online_flg2,
        coming_day3: com.coming_day3?new Date(com.coming_day3):"",
        coming_flg3: com.coming_flg3,
        coming_local_flg3: com.coming_local_flg3,
        coming_online_flg3: com.coming_online_flg3,
        coming_day4: com.coming_day4?new Date(com.coming_day4):"",
        coming_flg4: com.coming_flg4,
        coming_local_flg4: com.coming_local_flg4,
        coming_online_flg4: com.coming_online_flg4,
        coming_note: com.note,
      });

    }

    if (route.customer_data.contract) {
      const con = route.customer_data.contract;
      var room_no = "";
      if (route.customer_data.details) {
        const det = route.customer_data.details;
        room_no = det.room_no;
      }
      setContract({
        contract_name: con.user_id,
        contract_article_name: con.article_name,
        contract_room_no: room_no,
      });
    }
  }

  function Changecoming_day(selectedDate,flg) {

    var coming_day;

    if (flg == 1) {
      coming_day = coming.coming_day1;
    } else if (flg == 2) {
      coming_day = coming.coming_day2;
    } else if (flg == 3) {
      coming_day = coming.coming_day3;
    } else if (flg == 4) {
      coming_day = coming.coming_day4;
    }

    const currentDate = selectedDate || coming_day;
    
    if (flg == 1) {
      setComing(state => ({ ...state, coming_day1: currentDate }));
    } else if (flg == 2) {
      setComing(state => ({ ...state, coming_day2: currentDate }));
    } else if (flg == 3) {
      setComing(state => ({ ...state, coming_day3: currentDate }));
    } else if (flg == 4) {
      setComing(state => ({ ...state, coming_day4: currentDate }));
    }

  }

  function ClearDateTime(flg) {
    if (flg == 1) {
      setComing(state => ({ ...state, coming_day1: "" }));
    } else if (flg == 2) {
      setComing(state => ({ ...state, coming_day2: "" }));
    } else if (flg == 3) {
      setComing(state => ({ ...state, coming_day3: "" }));
    } else if (flg == 4) {
      setComing(state => ({ ...state, coming_day4: "" }));
    }
  }

  useEffect(() => {
    
    navigation.setOptions({
      headerStyle: !global.fc_flg?{ backgroundColor: '#6C9BCF', height: 110}:{ backgroundColor: '#FF8F8F', height: 110},
      headerTitle:() => (<Text style={styles.header_title}>お客様編集</Text>),
      headerLeft: () => (
        <Feather
          name='chevron-left'
          color='white'
          size={30}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{
                name: "TalkScreen",
                params: route.params,
                websocket:route.websocket,
                websocket2: route.websocket2,
                profile:route.profile,
                customer: route.customer,
                cus_name: route.cus_name,
                previous:'CustomerEdit',
                withAnimation2: true
              }],
            });
          }}
          style={{padding:10}}
        />
      ),
    });
    
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        navigation.reset({
          index: 0,
          routes: [{
            name: "TalkScreen",
            params: route.params,
            websocket:route.websocket,
            websocket2: route.websocket2,
            profile:route.profile,
            customer: route.customer,
            cus_name: route.cus_name,
            previous:'CustomerEdit',
            withAnimation2: true
          }],
        });
      }
    );
    
    return () => backHandler.remove();
  }, []);
  
  useEffect(() => {

    console.log('-----------------------------------------')

    settingCustomer();
    
    // 通知をタップしたらお客様一覧 → トーク画面 (ログイン済)
    const notificationInteractionSubscription =
      Notifications.addNotificationResponseReceivedListener(async(response) => {
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
                websocket2: route.websocket2,
                profile: route.profile,
                cus_name: cus_data.name,
              },
            ],
          });
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
                  room: room
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
      notificationInteractionSubscription.remove();
    };

  }, []);

  async function onSubmit() {

    const err = await ErrorCheck();

    if (err != "") {
      Alert.alert("エラー",err);
      return;
    }
    
    setLoading(true);

    let formData = new FormData();
    formData.append('ID',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act','customer_edit');
    formData.append('fc_flg',global.fc_flg);
    formData.append('formdata_flg',1);

    // ----- 基本 -----
    let CusKey = Object.keys(customer);
    for (var c in CusKey) {
      formData.append(`val[${CusKey[c]}]`,customer[CusKey[c]]);
    }
    // ----- 反響 -----
    let RevKey = Object.keys(reverberation);
    for (var r in RevKey) {
      var val = reverberation[RevKey[r]];
      if (RevKey[r] == "reverberation_inquiry_day" && val) {
        val = Moment(val).format("YYYY-MM-DD HH:mm:ss");
      }
      formData.append(`val[${RevKey[r]}]`,val);
    }
    // ----- 来店 -----
    let ComKey = Object.keys(coming);
    for (var cm in ComKey) {
      var val = coming[ComKey[cm]];
      if (ComKey[cm].startsWith('coming_day') && val) {
        val = Moment(val).format("YYYY-MM-DD HH:mm:ss");
      }
      if (ComKey[cm].startsWith('coming_flg') || ComKey[cm].startsWith('coming_local_flg') || ComKey[cm].startsWith('coming_online_flg')) {
        val = val?"1":"";
      }
      formData.append(`val[${ComKey[cm]}]`,val);
    }
    // ----- 契約 -----
    let ConKey = Object.keys(contract);
    for (var cn in ConKey) {
      formData.append(`val[${ConKey[cn]}]`,contract[ConKey[cn]]);
    }

    fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
    {
      method: 'POST',
      header: {
        'content-type': 'multipart/form-data',
      },
      body: formData,
    })
    .then((response) => response.json())
    .then((json) => {
      if(json != "false") {
        Alert.alert("登録にしました");
      } else {
        Alert.alert("登録に失敗しました");
      }
      setLoading(false);
    })
    .catch((error) => {
      console.log(error)
      Alert.alert("登録に失敗しました");
      setLoading(false);
    })

  }

  function ErrorCheck() {

    var err = "";

    // ----- 基本 -----
		if(customer.mail1 && !(customer.mail1).match(/^[A-Za-z0-9.]+[\w\.-]+@[\w\.-]+$/)){
      err += `・【基本】メールアドレス1が正しい書式ではありません。\n`;
		}

		if(customer.mail2 && !(customer.mail2).match(/^[A-Za-z0-9.]+[\w\.-]+@[\w\.-]+$/)){
      err += `・【基本】メールアドレス2が正しい書式ではありません。\n`;
		}

		if(customer.mail3 && !(customer.mail3).match(/^[A-Za-z0-9.]+[\w\.-]+@[\w\.-]+$/)){
      err += `・【基本】メールアドレス3が正しい書式ではありません。\n`;
		}

    // ----- 反響 -----
		if(reverberation.reverberation_media != "" && reverberation.reverberation_inquiry_day == ""){
      err += `・【反響】問合せ日を入力してください\n`;
		} else if (reverberation.reverberation_media == "" && reverberation.reverberation_inquiry_day != "") {
      err += `・【反響】媒体を選択してください\n`;
    }

    // ----- 来店 -----
    if (coming.coming_flg1 && coming.coming_day1 == "") {
      err += `・【来店】来店済チェックが入っていて、来店日が入っていません。\n`;
    }

    if (coming.coming_flg1 && coming.coming_name == "") {
      err += `・【来店】来店担当を選択してください。\n`;
    }

    if (!coming.coming_flg1 && coming.coming_reverberation) {
      err += `・【来店】来店済みにチェックされていません\n`;
    } else if (coming.coming_flg1 && coming.coming_reverberation == "") {
      err += `・【来店】来店方法を選択してください\n`;
    }

    if (coming.coming_flg1 && coming.f_coming_reason == "") {
      err += `・【来店】「会社を知った機会1」を選択してください\n`;
    }

    return err;

  }

  const BasicList = useMemo(() => {
    return (
      <>
        <View style={styles.input}>
          <Text style={styles.label}>名前</Text>
          <TextInput
            onChangeText={(text) => setCustomer(state => ({ ...state, name: text }))}
            value={customer["name"]}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>フリガナ</Text>
          <TextInput
            onChangeText={(text) => setCustomer(state => ({ ...state, kana: text }))}
            value={customer["kana"]}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>連絡先TEL1</Text>
          <TextInput
            onChangeText={(text) => setCustomer(state => ({ ...state, tel1: text }))}
            value={customer["tel1"]}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>連絡先TEL2</Text>
          <TextInput
            onChangeText={(text) => setCustomer(state => ({ ...state, tel2: text }))}
            value={customer["tel2"]}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>連絡先TEL3</Text>
          <TextInput
            onChangeText={(text) => setCustomer(state => ({ ...state, tel3: text }))}
            value={customer["tel3"]}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>メールアドレス1</Text>
          <TextInput
            onChangeText={(text) => setCustomer(state => ({ ...state, mail1: text }))}
            value={customer["mail1"]}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>メールアドレス2</Text>
          <TextInput
            onChangeText={(text) => setCustomer(state => ({ ...state, mail2: text }))}
            value={customer["mail2"]}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>メールアドレス3</Text>
          <TextInput
            onChangeText={(text) => setCustomer(state => ({ ...state, mail3: text }))}
            value={customer["mail3"]}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>性別</Text>
          <Dropdown
            style={styles.DropDown}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={customer["sex"]}
            data={sexList}
            placeholder="選択してください"
            onChange={(item) => setCustomer(state => ({ ...state, sex: item.value }))}
            labelField="label"
            valueField="value"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>年齢</Text>
          <Dropdown
            style={styles.DropDown}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={customer["age"]}
            data={ageList}
            placeholder="選択してください"
            onChange={(item) => setCustomer(state => ({ ...state, age: item.value }))}
            labelField="label"
            valueField="value"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>ご職業</Text>
          <Dropdown
            style={styles.DropDown}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={customer["work"]}
            data={workList}
            placeholder="選択してください"
            onChange={(item) => setCustomer(state => ({ ...state, work: item.value }))}
            labelField="label"
            valueField="value"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>本店・支店</Text>
          <RadioButtonRN
            data={shop_type}
            value={customer["shop_type"]}
            selectedBtn={(e) => setCustomer(state => ({ ...state, shop_type: e.value }))}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={customer["shop_type"]?customer["shop_type"]:1}
            boxStyle={styles.radio_box}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:16,marginLeft:10}}
            circleSize={13}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>住居用・テナント</Text>
          <RadioButtonRN
            data={rental_type}
            value={customer["rental_type"]}
            selectedBtn={(e) => setCustomer(state => ({ ...state, rental_type: e.value }))}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={customer["rental_type"]?customer["rental_type"]:1}
            boxStyle={styles.radio_box}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:16,marginLeft:10}}
            circleSize={13}
          />
        </View>
      </>
    )
  },[customer])

  const ReverberationList = useMemo(() => {
    return (
      <>
        <View style={styles.input}>
          <Text style={styles.label}>反響担当</Text>
          <Dropdown
            style={styles.DropDown}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={reverberation["reverberation_name"]}
            data={staffList}
            onChange={(item) => setReverberation(state => ({ ...state, reverberation_name: item.value }))}
            labelField="label"
            valueField="value"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>媒体</Text>
          <Dropdown
            style={styles.DropDown}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={reverberation["reverberation_media"]}
            data={mediaList}
            onChange={(item) => setReverberation(state => ({ ...state, reverberation_media: item.value }))}
            labelField="label"
            valueField="value"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>問合せ日時</Text>
          {Platform.OS === 'ios'? (
          <TouchableOpacity
            style={[styles.inputInner,{flexDirection:'row'}]}
            onPress={()=>setShow(true)}
          >
            <Text style={{alignSelf:'center'}}>{reverberation.reverberation_inquiry_day?Moment(reverberation.reverberation_inquiry_day).format("YYYY-MM-DD HH:mm"):""}</Text>
            <TouchableOpacity
              style={{alignSelf:'center',marginLeft:'auto'}}
              onPress={()=>{
                setReverberation(state => ({ ...state, reverberation_inquiry_day: "" }));
              }}
            >
              <Feather name='x-circle' color='#ccc' size={25} />
            </TouchableOpacity>
          </TouchableOpacity>
          ):(
            <View style={{flexDirection:'row'}}>
              <TouchableOpacity
                style={[styles.inputInner,{width:"48%",flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode("date");
                }}
              >
                <Text style={{alignSelf:'center'}}>{reverberation.reverberation_inquiry_day?Moment(reverberation.reverberation_inquiry_day).format("YYYY-MM-DD"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>{
                    setReverberation(state => ({ ...state, reverberation_inquiry_day: "" }));
                  }}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputInner,{width:"48%",marginLeft:'auto',flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode("time");
                }}
              >
                <Text style={{alignSelf:'center'}}>{reverberation.reverberation_inquiry_day?Moment(reverberation.reverberation_inquiry_day).format("HH:mm"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>{
                    setReverberation(state => ({ ...state, reverberation_inquiry_day: "" }));
                  }}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
          {(show && Platform.OS === 'android') && (
            <DateTimePicker
              value={
                reverberation.reverberation_inquiry_day?
                reverberation.reverberation_inquiry_day:
                new Date()
              }
              mode={mode}
              display="default"
              locale={'ja'}
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || reverberation.reverberation_inquiry_day;
                setReverberation(state => ({ ...state, reverberation_inquiry_day: currentDate }));
                setShow(false);
              }}
            />
          )}
          {Platform.OS === 'ios'&& (
            <Modal
              isVisible={show}
              swipeDirection={null}
              backdropOpacity={0.5}
              animationInTiming={300}
              animationOutTiming={500}
              animationIn={'slideInDown'}
              animationOut={'slideOutUp'}
              propagateSwipe={true}
              style={{alignItems: 'center'}}
              onBackdropPress={()=>setShow(false)}
            >
              <View style={styles.iosdate}>
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top:8,
                    right:10,
                    zIndex:999
                  }}
                  onPress={()=>setShow(false)}
                >
                  <Feather name='x-circle' color='#ccc' size={35} />
                </TouchableOpacity>
                <DateTimePicker
                  value={
                    reverberation.reverberation_inquiry_day?
                    reverberation.reverberation_inquiry_day:
                    new Date()
                  }
                  mode={'datetime'}
                  is24Hour={true}
                  display="spinner"
                  locale={'ja'}
                  onChange={(event, selectedDate) => {
                    const currentDate = selectedDate || reverberation.reverberation_inquiry_day;
                    setReverberation(state => ({ ...state, reverberation_inquiry_day: currentDate }));
                  }}
                  textColor="#fff"
                />
              </View>
            </Modal>
          )}
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>入居人数</Text>
          <Dropdown
            style={styles.DropDown}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={reverberation["reverberation_ninzu"]}
            data={ninzuList}
            onChange={(item) => setReverberation(state => ({ ...state, reverberation_ninzu: item.value }))}
            labelField="label"
            valueField="value"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>入居時期</Text>
          <View style={{flexDirection:'row'}}>
            <View style={{width:'48%'}}>
              <Dropdown
                style={styles.DropDown}
                containerStyle={styles.dropDownContainer}
                placeholderStyle={{fontSize:14}}
                selectedTextStyle={{fontSize:14}}
                itemTextStyle={{fontSize:14}}
                renderItem={(item)=>(
                  <View style={styles.dropItem}>
                    <Text style={styles.dropItemText}>{item.label}</Text>
                  </View>
                )}
                value={reverberation["reverberation_move_time"]}
                data={move_time}
                onChange={(item) => setReverberation(state => ({ ...state, reverberation_move_time: item.value }))}
                labelField="label"
                valueField="value"
              />
            </View>
            <View style={{width:'48%',marginLeft:'auto'}}>
              <Dropdown
                style={styles.DropDown}
                containerStyle={styles.dropDownContainer}
                placeholderStyle={{fontSize:14}}
                selectedTextStyle={{fontSize:14}}
                itemTextStyle={{fontSize:14}}
                renderItem={(item)=>(
                  <View style={styles.dropItem}>
                    <Text style={styles.dropItemText}>{item.label}</Text>
                  </View>
                )}
                value={reverberation["reverberation_move_time2"]}
                data={move_time2}
                onChange={(item) => setReverberation(state => ({ ...state, reverberation_move_time2: item.value }))}
                labelField="label"
                valueField="value"
              />
            </View>
          </View>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>問合せ物件</Text>
          <Text style={{lineHeight:20}}>{reverberation["article_data"]}</Text>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>反響備考</Text>
          <TextInput
            onChangeText={(text) => setReverberation(state => ({ ...state, reverberation_note: text }))}
            value={reverberation["reverberation_note"]}
            style={styles.textarea}
            multiline={true}
            disableFullscreenUI={true}
            numberOfLines={11}
          />
        </View>
      </>
    )
  },[reverberation,show,mode])

  const ComingList = useMemo(() => {
    return (
      <>
        <View style={styles.input}>
          <Text style={styles.label}>来店担当</Text>
          <Dropdown
            style={styles.DropDown}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={coming["coming_name"]}
            data={staffList}
            onChange={(item) => setComing(state => ({ ...state, coming_name: item.value }))}
            labelField="label"
            valueField="value"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>来店日</Text>
          {Platform.OS === 'ios'? (
          <TouchableOpacity
            style={[styles.inputInner,{flexDirection:'row'}]}
            onPress={()=>{
              setShow(true);
              setComing_day(1);
            }}
          >
            <Text style={{alignSelf:'center'}}>{coming.coming_day1?Moment(coming.coming_day1).format("YYYY-MM-DD HH:mm"):""}</Text>
            <TouchableOpacity
              style={{alignSelf:'center',marginLeft:'auto'}}
              onPress={()=>ClearDateTime(1)}
            >
              <Feather name='x-circle' color='#ccc' size={25} />
            </TouchableOpacity>
          </TouchableOpacity>
          ):(
            <View style={{flexDirection:'row'}}>
              <TouchableOpacity
                style={[styles.inputInner,{width:"48%",flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode("date");
                  setComing_day(1);
                }}
              >
                <Text style={{alignSelf:'center'}}>{coming.coming_day1?Moment(coming.coming_day1).format("YYYY-MM-DD"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>ClearDateTime(1)}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputInner,{width:"48%",marginLeft:'auto',flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode("time");
                  setComing_day(1);
                }}
              >
                <Text style={{alignSelf:'center'}}>{coming.coming_day1?Moment(coming.coming_day1).format("HH:mm"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>ClearDateTime(1)}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
          <View style={{flexDirection:'row',marginTop:5}}>
            <CheckBox
              checked={coming.coming_flg1}
              onPress={() => {
                setComing(state => ({ ...state, coming_flg1: !coming.coming_flg1 }));
                if (!coming.coming_flg1 && coming.coming_reverberation == "") {
                  setComing(state => ({ ...state, coming_reverberation: "反響" }));
                } else if (coming.coming_flg1) {
                  setComing(state => ({ ...state, coming_reverberation: "" }));
                }
              }}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="来店済"
            />
            <CheckBox
              checked={coming.coming_local_flg1}
              onPress={() => {setComing(state => ({ ...state, coming_local_flg1: !coming.coming_local_flg1 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="現地案内"
            />
            <CheckBox
              checked={coming.coming_online_flg1}
              onPress={() => {setComing(state => ({ ...state, coming_online_flg1: !coming.coming_online_flg1 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="オンライン"
            />
          </View>
        </View>
        <View>
          <Text style={styles.label}>来店方法</Text>
          <Dropdown
            style={styles.DropDown}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={coming["coming_reverberation"]}
            data={reverberationList}
            onChange={(item) => setComing(state => ({ ...state, coming_reverberation: item.value }))}
            labelField="label"
            valueField="value"
          />
        </View>
        <View>
          <View style={{flexDirection:'row'}}>
            <Text style={styles.label}>会社を知った機会1</Text>
            <Text style={[styles.label,{color:'red',marginLeft:10,fontSize:13,alignSelf:'center'}]}>※どれか必須</Text>
          </View>
          <Dropdown
            style={styles.DropDown}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={coming["f_coming_reason"]}
            data={reasonList}
            onChange={(item) => setComing(state => ({ ...state, f_coming_reason: item.value }))}
            labelField="label"
            valueField="value"
          />
          {coming["f_coming_reason"]=="その他"&&(
            <TextInput
              onChangeText={(text) => setComing(state => ({ ...state, f_coming_campany_reason_note: text }))}
              value={coming["f_coming_campany_reason_note"]}
              style={[styles.inputInner,{marginTop:5}]}
            />
          )}
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>再来(予定日1)</Text>
          {Platform.OS === 'ios'? (
          <TouchableOpacity
            style={[styles.inputInner,{flexDirection:'row'}]}
            onPress={()=>{
              setShow(true);
              setComing_day(2);
            }}
          >
            <Text style={{alignSelf:'center'}}>{coming.coming_day2?Moment(coming.coming_day2).format("YYYY-MM-DD HH:mm"):""}</Text>
            <TouchableOpacity
              style={{alignSelf:'center',marginLeft:'auto'}}
              onPress={()=>ClearDateTime(2)}
            >
              <Feather name='x-circle' color='#ccc' size={25} />
            </TouchableOpacity>
          </TouchableOpacity>
          ):(
            <View style={{flexDirection:'row'}}>
              <TouchableOpacity
                style={[styles.inputInner,{width:"48%",flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode("date");
                  setComing_day(2);
                }}
              >
                <Text style={{alignSelf:'center'}}>{coming.coming_day2?Moment(coming.coming_day2).format("YYYY-MM-DD"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>ClearDateTime(2)}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputInner,{width:"48%",marginLeft:'auto',flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode("time");
                  setComing_day(2);
                }}
              >
                <Text style={{alignSelf:'center'}}>{coming.coming_day2?Moment(coming.coming_day2).format("HH:mm"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>ClearDateTime(2)}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
          <View style={{flexDirection:'row',marginTop:5}}>
            <CheckBox
              checked={coming.coming_flg2}
              onPress={() => {setComing(state => ({ ...state, coming_flg2: !coming.coming_flg2 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="来店済"
            />
            <CheckBox
              checked={coming.coming_local_flg2}
              onPress={() => {setComing(state => ({ ...state, coming_local_flg2: !coming.coming_local_flg2 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="現地案内"
            />
            <CheckBox
              checked={coming.coming_online_flg2}
              onPress={() => {setComing(state => ({ ...state, coming_online_flg2: !coming.coming_online_flg2 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="オンライン"
            />
          </View>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>再来(予定日2)</Text>
          {Platform.OS === 'ios'? (
          <TouchableOpacity
            style={[styles.inputInner,{flexDirection:'row'}]}
            onPress={()=>{
              setShow(true);
              setComing_day(3);
            }}
          >
            <Text style={{alignSelf:'center'}}>{coming.coming_day3?Moment(coming.coming_day3).format("YYYY-MM-DD HH:mm"):""}</Text>
            <TouchableOpacity
              style={{alignSelf:'center',marginLeft:'auto'}}
              onPress={()=>ClearDateTime(3)}
            >
              <Feather name='x-circle' color='#ccc' size={25} />
            </TouchableOpacity>
          </TouchableOpacity>
          ):(
            <View style={{flexDirection:'row'}}>
              <TouchableOpacity
                style={[styles.inputInner,{width:"48%",flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode("date");
                  setComing_day(3);
                }}
              >
                <Text style={{alignSelf:'center'}}>{coming.coming_day3?Moment(coming.coming_day3).format("YYYY-MM-DD"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>ClearDateTime(3)}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputInner,{width:"48%",marginLeft:'auto',flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode("time");
                  setComing_day(3);
                }}
              >
                <Text style={{alignSelf:'center'}}>{coming.coming_day3?Moment(coming.coming_day3).format("HH:mm"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>ClearDateTime(3)}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
          <View style={{flexDirection:'row',marginTop:5}}>
            <CheckBox
              checked={coming.coming_flg3}
              onPress={() => {setComing(state => ({ ...state, coming_flg3: !coming.coming_flg3 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="来店済"
            />
            <CheckBox
              checked={coming.coming_local_flg3}
              onPress={() => {setComing(state => ({ ...state, coming_local_flg3: !coming.coming_local_flg3 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="現地案内"
            />
            <CheckBox
              checked={coming.coming_online_flg3}
              onPress={() => {setComing(state => ({ ...state, coming_online_flg3: !coming.coming_online_flg3 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="オンライン"
            />
          </View>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>再来(予定日3)</Text>
          {Platform.OS === 'ios'? (
          <TouchableOpacity
            style={[styles.inputInner,{flexDirection:'row'}]}
            onPress={()=>{
              setShow(true);
              setComing_day(4);
            }}
          >
            <Text style={{alignSelf:'center'}}>{coming.coming_day4?Moment(coming.coming_day4).format("YYYY-MM-DD HH:mm"):""}</Text>
            <TouchableOpacity
              style={{alignSelf:'center',marginLeft:'auto'}}
              onPress={()=>ClearDateTime(4)}
            >
              <Feather name='x-circle' color='#ccc' size={25} />
            </TouchableOpacity>
          </TouchableOpacity>
          ):(
            <View style={{flexDirection:'row'}}>
              <TouchableOpacity
                style={[styles.inputInner,{width:"48%",flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode("date");
                  setComing_day(4);
                }}
              >
                <Text style={{alignSelf:'center'}}>{coming.coming_day4?Moment(coming.coming_day4).format("YYYY-MM-DD"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>ClearDateTime(4)}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.inputInner,{width:"48%",marginLeft:'auto',flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode("time");
                  setComing_day(4);
                }}
              >
                <Text style={{alignSelf:'center'}}>{coming.coming_day4?Moment(coming.coming_day4).format("HH:mm"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>ClearDateTime(4)}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
          )}
          <View style={{flexDirection:'row',marginTop:5}}>
            <CheckBox
              checked={coming.coming_flg4}
              onPress={() => {setComing(state => ({ ...state, coming_flg4: !coming.coming_flg4 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="来店済"
            />
            <CheckBox
              checked={coming.coming_local_flg4}
              onPress={() => {setComing(state => ({ ...state, coming_local_flg4: !coming.coming_local_flg4 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="現地案内"
            />
            <CheckBox
              checked={coming.coming_online_flg4}
              onPress={() => {setComing(state => ({ ...state, coming_online_flg4: !coming.coming_online_flg4 }))}}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title="オンライン"
            />
          </View>
        </View>
        {(show && Platform.OS === 'android') && (
          <DateTimePicker
            value={
              coming_day==1?(coming.coming_day1?coming.coming_day1:new Date()):
              coming_day==2?(coming.coming_day2?coming.coming_day2:new Date()):
              coming_day==3?(coming.coming_day3?coming.coming_day3:new Date()):
              coming_day==4?(coming.coming_day4?coming.coming_day4:new Date()):
              new Date()
            }
            mode={mode}
            display="default"
            locale={'ja'}
            onChange={(event, selectedDate) => {
              Changecoming_day(selectedDate,coming_day);
              setShow(false);
            }}
          />
        )}
        {Platform.OS === 'ios'&& (
          <Modal
            isVisible={show}
            swipeDirection={null}
            backdropOpacity={0.5}
            animationInTiming={300}
            animationOutTiming={500}
            animationIn={'slideInDown'}
            animationOut={'slideOutUp'}
            propagateSwipe={true}
            style={{alignItems: 'center'}}
            onBackdropPress={()=>setShow(false)}
          >
            <View style={styles.iosdate}>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top:8,
                  right:10,
                  zIndex:999
                }}
                onPress={()=>setShow(false)}
              >
                <Feather name='x-circle' color='#ccc' size={35} />
              </TouchableOpacity>
              <DateTimePicker
                value={
                  coming_day==1?(coming.coming_day1?coming.coming_day1:new Date()):
                  coming_day==2?(coming.coming_day2?coming.coming_day2:new Date()):
                  coming_day==3?(coming.coming_day3?coming.coming_day3:new Date()):
                  coming_day==4?(coming.coming_day4?coming.coming_day4:new Date()):
                  new Date()
                }
                mode={'datetime'}
                is24Hour={true}
                display="spinner"
                locale={'ja'}
                onChange={(event, selectedDate) => {Changecoming_day(selectedDate,coming_day)}}
                textColor="#fff"
              />
            </View>
          </Modal>
        )}
        <View style={styles.input}>
          <Text style={styles.label}>来店備考</Text>
          <TextInput
            onChangeText={(text) => setComing(state => ({ ...state, coming_note: text }))}
            value={coming["coming_note"]}
            style={styles.textarea}
            multiline={true}
            disableFullscreenUI={true}
            numberOfLines={11}
          />
        </View>
      </>
    )
  },[coming,show,mode,coming_day])

  const ContractList = useMemo(() => {
    return (
      <>
        <View style={styles.input}>
          <Text style={styles.label}>契約担当</Text>
          <Dropdown
            style={styles.DropDown}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={contract["contract_name"]}
            data={staffList}
            onChange={(item) => setContract(state => ({ ...state, contract_name: item.value }))}
            labelField="label"
            valueField="value"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>物件名</Text>
          <TextInput
            onChangeText={(text) => setContract(state => ({ ...state, contract_article_name: text }))}
            value={contract["contract_article_name"]}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>号室</Text>
          <TextInput
            onChangeText={(text) => setContract(state => ({ ...state, contract_room_no: text }))}
            value={contract["contract_room_no"]}
            style={styles.inputInner}
          />
        </View>
        <View style={{flexDirection:'row',justifyContent:'center',marginVertical:20}}>
          <TouchableOpacity
            style={styles.conBtn}
            activeOpacity={0.7}
            onPress={()=>{
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: "ContractRegister",
                    params: route.params,
                    websocket: route.websocket,
                    websocket2: route.websocket2,
                    profile: route.profile,
                    hojin:false,
                    customer: route.customer,
                    cus_name:route.cus_name,
                    contract: route.contract,
                    previous:'CustomerEdit'
                  },
                ],
              });
            }}
          >
            <Text style={styles.conBtntxt}>契約進行表</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.conBtn}
            activeOpacity={0.7}
            onPress={()=>{
              navigation.reset({
                index: 0,
                routes: [
                  {
                    name: "ContractRegister",
                    params: route.params,
                    websocket: route.websocket,
                    websocket2: route.websocket2,
                    profile: route.profile,
                    hojin:true,
                    customer: route.customer,
                    cus_name:route.cus_name,
                    contract: route.contract,
                    previous:'CustomerEdit'
                  },
                ],
              });
            }}
          >
            <Text style={styles.conBtntxt}>契約進行表(法人)</Text>
          </TouchableOpacity>
        </View>
      </>
    )
  },[contract])

  return (
    <>
    <Loading isLoading={isLoading} />
    <KeyboardAwareScrollView
      style={{flex: 1}}
      showsHorizontalScrollIndicator={false}
    >
      <TouchableWithoutFeedback
        onPress={()=>Keyboard.dismiss()}
      >
        <View style={styles.view}>
          <View style={{flexDirection:'row',width:'100%'}}>
            <TouchableOpacity
              onPress={()=>{setForm(0)}}
              style={form==0?styles.active_tab:styles.inactivetab}
            >
              <Text style={styles.tab_txt}>基 本</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={()=>{setForm(1)}}
              style={form==1?styles.active_tab:styles.inactivetab}
            >
              <Text style={styles.tab_txt}>反 響</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={()=>{setForm(2)}}
              style={form==2?styles.active_tab:styles.inactivetab}
            >
              <Text style={styles.tab_txt}>来 店</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={()=>{setForm(3)}}
              style={form==3?styles.active_tab:styles.inactivetab}
            >
              <Text style={styles.tab_txt}>契 約</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.table}>
            {
              form==0?BasicList:
              form==1?ReverberationList:
              form==2?ComingList:
              form==3?ContractList:(<></>)
            }
          </View>
          <TouchableOpacity onPress={()=>{onSubmit()}} style={styles.submit}>
            <Text style={styles.submitText}>保　存</Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAwareScrollView>
    </>
  );
}

const chk = !global.fc_flg?"#81aee6":"#e6c4f5";
const spc = !global.fc_flg?"#dce6fc":"#ffe8f0";

const styles = StyleSheet.create({
  header_img: {
    width:150,
    height:45,
  },
  header_title: {
    color:'#ffffff',
    fontSize:18,
    fontWeight:'500'
  },
  header_name: {
    color:'#ffffff',
    fontSize:14,
    fontWeight:'400'
  },
  view: {
    width: "95%",
    marginTop:15,
    marginBottom:35,
    marginHorizontal:'2.5%'
  },
  active_tab: {
    width:"25%",
    height:50,
    justifyContent: 'center',
    alignItems:'center',
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
    backgroundColor:spc,
  },
  inactivetab: {
    width:"25%",
    height:50,
    justifyContent: 'center',
    alignItems:'center',
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
    backgroundColor:'#b8b8b8',
  },
  tab_txt: {
    fontSize:14,
    fontWeight:'700',
    color:'#333',
    letterSpacing: 3
  },
  table: {
    width:'100%',
    backgroundColor:spc,
    paddingHorizontal:12,
    paddingBottom:15
  },
  input: {
    marginBottom: 5,
    width:'100%',
  },
  label: {
    color:"#999",
    marginTop: 10,
    marginBottom:5,
    marginLeft:5,
    fontSize:16,
    fontWeight:'500'
  },
  inputInner: {
    height:45,
    paddingHorizontal:5,
    backgroundColor:'#fff',
    borderColor: '#919191',
    fontSize:16,
    borderWidth: 1,
    borderRadius: 8,
  },
  textarea: {
    height:150,
    paddingVertical:10,
    paddingHorizontal:5,
    backgroundColor:'#fff',
    borderColor: '#919191',
    fontSize:16,
    borderWidth: 1,
    borderRadius: 8,
    textAlignVertical: 'top'
  },
  DropDown: {
    fontSize: 16,
    height:45,
    borderRadius:8,
    backgroundColor:'#fff',
    borderWidth:1,
    borderColor: '#919191',
    paddingHorizontal:5,
  },
  dropDownContainer: {
    maxHeight:150,
    borderWidth:1,
    borderColor: '#919191',
  },
  dropItem: {
    padding:10,
  },
  dropItemText: {
    fontSize:14,
  },
  iosdate: {
    width:300,
    height:260,
    backgroundColor:'#333',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5
  },
  radio_box: {
    width:100,
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 5,
    paddingVertical: 0,
    marginTop: 0,
    backgroundColor:'transparent'
  },
  checkbox: {
    margin: 0,
    marginLeft:0,
    marginRight: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    height:30,
    backgroundColor:'transparent',
    alignItems:'center',
    justifyContent:'center',
  },
  conBtn: {
    width: "40%",
    height: 40,
    marginHorizontal:8,
    alignItems: "center",
    justifyContent:'center',
    borderRadius:5,
    shadowColor: "#000",
    shadowColor: "#a3a3a3",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5,
    backgroundColor:"#ededed",
  },
  conBtntxt: {
    color:"#999",
    fontSize:14,
    fontWeight:"700"
  },
  submit:{
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop:20,
    borderRadius: 8,
    width:100,
    height:40,
    backgroundColor:chk,
    shadowColor: "#a3a3a3",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5
  },
  submitText: {
    fontSize:16,
    fontWeight:'600',
    color:'#ffffff'
  },
});
