import React, { useState,useEffect,useMemo,useCallback } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, BackHandler, AppState, KeyboardAvoidingView, ScrollView, FlatList,  Image, Linking, Platform, Button
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import Moment from 'moment';
import Modal from "react-native-modal";
import { CheckBox } from 'react-native-elements';
import { Dropdown } from 'react-native-element-dropdown';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

import Loading from '../components/Loading';
import { db,db_write,GetDB,storage } from '../components/Databace';

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

export default function ContractRegister(props) {

  if (AppState.currentState === 'active') {
    Notifications.setBadgeCountAsync(0);
  }
  
  const { navigation, route } = props;
  
  const [isLoading, setLoading] = useState(false);
  
  const [open, setOpen] = useState(false);
  const [staffs, setStaffs] = useState([]);

  // 通常:false 法人:true
  const [hojin, setHojin] = useState(route.hojin);

  // 0：申込手続き 1：契約準備 3：契約
  const [form, setForm] = useState(0);

  const [Keiyaku1, setKeiyaku1] = useState([
    [
      {label:"斡旋依頼取得",value:"mediation_request_",date:"",time:"",checked:false,user_id:""},
      {label:"申込書受理送付",value:"application_",date:"",time:"",checked:false,user_id:""},
      {label:"登記要約書",value:"registration_",date:"",time:"",checked:false,user_id:""},
      {label:"重説作成",value:"important_matter_",date:"",time:"",checked:false,user_id:""},
      {label:"重要事項説明",value:"important_",date:"",time:"",checked:false,user_id:""},
      {label:"重説渡し",value:"important_pass_",date:"",time:"",checked:false,user_id:""},
      {label:"取引台帳",value:"ledger_",date:"",time:"",checked:false,user_id:""},
      {label:"申込金受理",value:"registration_fee_",date:"",time:"",checked:false,user_id:""},
      {label:"契約明細説明発行",value:"specification_create_",date:"",time:"",checked:false,user_id:""},
      {label:"(アクア少短申込)",value:"aqua_",date:"",time:"",checked:false,user_id:""},
    ],
    [
      {label:"入居審査",value:"judging_",date:"",time:"",checked:false,user_id:""},
      {label:"(手付金振込)",value:"earnest_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書発行作成",value:"contract_create_",date:"",time:"",checked:false,user_id:""},
      {label:"仲介印",value:"intermediary_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書渡し送付",value:"pass_",date:"",time:"",checked:false,user_id:""},
      {label:"斡旋提出",value:"mediation_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書書類受理",value:"received_",date:"",time:"",checked:false,user_id:""},
      {label:"契約決済金受理",value:"received_settlement_",date:"",time:"",checked:false,user_id:""},
    ],
    [
      {label:"決済金振込出し",value:"settlement_",date:"",time:"",checked:false,user_id:""},
      {label:"広告料受領",value:"ad_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書類提出",value:"out_",date:"",time:"",checked:false,user_id:""},
      {label:"鍵受領",value:"key_",date:"",time:"",checked:false,user_id:""},
      {label:"ルームチェック",value:"room_check_",date:"",time:"",checked:false,user_id:""},
      {label:"(殺虫手配)",value:"disinfection_",date:"",time:"",checked:false,user_id:""},
      {label:"鍵・書類渡し(鍵受領書発行)",value:"key_pass_",date:"",time:"",checked:false,user_id:""},
      {label:"入居日",value:"move_in_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書返却",value:"agreement_",date:"",time:"",checked:false,user_id:""},
      {label:"入居後のフォロー",value:"follow_",date:"",time:"",checked:false,user_id:""},
    ]
  ]);
  const [Keiyaku2, setKeiyaku2] = useState([
    [
      {label:"斡旋依頼取得", value:"mediation_request_",date:"",time:"",checked:false,user_id:""},
      {label:"申込手続き (web・メール・FAX)", value:"application_",date:"",time:"",checked:false,user_id:""},
      {label:"申込書押印 (借主法人)", value:"application_seal_",date:"",time:"",checked:false,user_id:""},
      {label:"物件決定連絡 (借主法人へ)", value:"property_decision_contact_",date:"",time:"",checked:false,user_id:""},
      {label:"決定物件案内 (入居者へ)", value:"property_decision_guidance_",date:"",time:"",checked:false,user_id:""},
    ],
    [
      {label:"契約書ひな形・明細発行依頼 (貸主へ)", value:"contract_details_issuance_request_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書ひな形・明細到着 (貸主から)", value:"contract_details_issuance_arrival_",date:"",time:"",checked:false,user_id:""},
      {label:"重説作成", value:"important_matter_",date:"",time:"",checked:false,user_id:""},
      {label:"謄本取得", value:"acquisition_certified_",date:"",time:"",checked:false,user_id:""},
      {label:"ハザードマップ作成", value:"hazard_map_",date:"",time:"",checked:false,user_id:""},
      {label:"請求書作成", value:"invoicing_",date:"",time:"",checked:false,user_id:""},
      {label:"稟議申請 (借主法人へ)", value:"request_approval_",date:"",time:"",checked:false,user_id:""},
      {label:"稟議承認通知 (借主法人から)", value:"approval_notice_",date:"",time:"",checked:false,user_id:""},
      {label:"承認通知・原本発行依頼・決済金支払い予定日連絡(貸主へ)", value:"scheduled_contact_",date:"",time:"",checked:false,user_id:""},
      {label:"承認通知 (入居者へ)", value:"approval_notification_",date:"",time:"",checked:false,user_id:""},
      {label:"ライフライン通知 (入居者へ)", value:"lifeline_notification_",date:"",time:"",checked:false,user_id:""},
      {label:"個人負担費用・必要書類通知 (入居者へ)", value:"notification_required_",date:"",time:"",checked:false,user_id:""},
      {label:"鍵渡し日時持ち物通知 (入居者へ)", value:"inventory_notification_",date:"",time:"",checked:false,user_id:""},
      {label:"火災保険手続き案内 (入居者or借主法人)", value:"fire_insurance_",date:"",time:"",checked:false,user_id:""},
      {label:"重要事項説明", value:"important_",date:"",time:"",checked:false,user_id:""},
      {label:"重説渡し (入居者へコピー)", value:"important_pass_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書類原本渡し (借主)", value:"pass_",date:"",time:"",checked:false,user_id:""},
      {label:"鍵手配", value:"key_arrangement_",date:"",time:"",checked:false,user_id:""},
      {label:"鍵受領", value:"key_",date:"",time:"",checked:false,user_id:""},
      {label:"ルームチェック", value:"room_check_",date:"",time:"",checked:false,user_id:""},
      {label:"殺虫手配", value:"disinfection_",date:"",time:"",checked:false,user_id:""},
      {label:"鍵引渡", value:"key_handover_",date:"",time:"",checked:false,user_id:""},
      {label:"入居日", value:"move_in_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書類原本回収 (借主から)", value:"received_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書類原本提出 (貸主へ)", value:"out_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書類原本回収 (貸主から)", value:"collection_original_contract_landlord_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書類スキャン・イエセレ登録", value:"contract_scan_",date:"",time:"",checked:false,user_id:""},
      {label:"契約書お控え渡し (借主へ)", value:"hand_copy_contract_",date:"",time:"",checked:false,user_id:""},
      {label:"入居後のフォロー", value:"follow_",date:"",time:"",checked:false,user_id:""},
    ],
    [
      {label:"取引台帳作成", value:"ledger_",date:"",time:"",checked:false,user_id:""},
      {label:"決済金受理 (法人)", value:"acceptance_payment_corporation_",date:"",time:"",checked:false,user_id:""},
      {label:"決済金受理 (個人)", value:"acceptance_payment_individual_",date:"",time:"",checked:false,user_id:""},
      {label:"アクア少短申込", value:"aqua_",date:"",time:"",checked:false,user_id:""},
      {label:"決済金振込出し", value:"settlement_",date:"",time:"",checked:false,user_id:""},
      {label:"広告料請求書作成", value:"advertising_bill_",date:"",time:"",checked:false,user_id:""},
      {label:"広告料受領", value:"ad_",date:"",time:"",checked:false,user_id:""},
      {label:"広告料領収証作成", value:"advertising_receipt_",date:"",time:"",checked:false,user_id:""},
      {label:"依頼元紹介料支払", value:"requester_introduction_",date:"",time:"",checked:false,user_id:""},
      {label:"CJSコーポレートサービス紹介料支払", value:"cjs_referral_",date:"",time:"",checked:false,user_id:""},
    ]
  ]);

  const [contract_sms, setContract_sms] = useState(null);
  
  // 1:鍵渡し 2:契約書返却
  const [sms_send_flg, setSms_send_flg] = useState("1");
  const [sms_send, setSms_send] = useState(false);

  const [date, setDate] = useState(new Date());
  const [date_index, setDate_index] = useState(0);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('date');
  const [reroad, setReroad] = useState(true); // リスト更新用

  const [customer_only, setCustomer_only] = useState(null);
  const [cus_not_flg, setCus_not_flg] = useState(false);

  const [sms_send_tel, setSms_send_tel] = useState(null);

  const [key_sms, setKey_sms] = useState([
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
  ]);

  const [agreement_sms, setAgreement_sms] = useState([
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
    {"document_room_no":"","document_key_maker":"","document_name":"","document_quantity":"","document_note":""},
  ]);

  const [key_btn, setKey_btn] = useState(false);
  const [agreement_btn, setAgreement_btn] = useState(false);

  const [filename,setFilename] = useState('');
  const [filedata,setFiledata] = useState(null);

  var cusTelMailList = useMemo(()=>{

    if (!customer_only) return [];

    var items = [];
    
	  for(var i_buf=1;i_buf<=3;i_buf++){
      // 電話番号が入ってない場合、次のループへ
      if(!customer_only["tel"+i_buf]) continue;
      var data = {
        label: customer_only["tel"+i_buf],
        value: customer_only["tel"+i_buf],
      }
      items.push(data);
    }

	  for(var i_buf=1;i_buf<=3;i_buf++){
      // メールが入ってない場合、次のループへ
      if(!customer_only["mail"+i_buf]) continue;
      var data = {
        label: customer_only["mail"+i_buf],
        value: customer_only["mail"+i_buf],
      }
      items.push(data);
    }

    setSms_send_tel(items[0].value);

    return items;

  },[customer_only]);

  useEffect(() => {
    
    GetDB('staff_list').then(staff_list=>staff_list!=false&&setStaffs(staff_list));
    
    navigation.setOptions({
      headerStyle: !global.fc_flg?{ backgroundColor: '#6C9BCF', height: 110}:{ backgroundColor: '#FF8F8F', height: 110},
      headerTitle:() => (
        <>
        <Text style={styles.header_title}>契約進行表{route.hojin&&"(法人)"}</Text>
        <Text style={styles.header_name}>{route.cus_name}</Text>
        </>
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
                name: "TalkScreen",
                params: route.params,
                websocket:route.websocket,
                websocket2: route.websocket2,
                profile:route.profile,
                customer: route.customer,
                cus_name: route.cus_name,
                previous:'ContractRegister',
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
            previous:'ContractRegister',
            withAnimation2: true
          }],
        });
      }
    );
    
    return () => backHandler.remove();
  }, []);
  
  useEffect(() => {

    console.log('-----------------------------------------')

    setContract_sms(route.contract_sms);
    setCustomer_only(route.customer_data.main);

    const c_o = route.customer_data.main;

    if (!c_o.tel1 && !c_o.tel2 && !c_o.tel3 && !c_o.mail1 && !c_o.mail2 && !c_o.mail3) {
      setCus_not_flg(true);
    }

    if (route.contract != null) {
      var Keiyaku_ = !route.hojin?Keiyaku1:Keiyaku2;
  
      for (const key in Keiyaku_) {
        for (var k=0;k<Keiyaku_[key].length;k++) {
          var keiyaku = Keiyaku_[key][k];

          if (route.contract[keiyaku["value"]+"date"] != null) {

            var date_ = route.contract[keiyaku["value"]+"date"];
            var ymd   = date_.slice(0, 10);
            var hhmm  = date_.slice(11, 19);
            
            keiyaku["date"] = ymd;
            keiyaku["time"] = hhmm;

          }

          if (route.contract[keiyaku["value"]+"flg"] == "1") {
            keiyaku["checked"] = true;
          }

          if (route.contract[keiyaku["value"]+"user_id"] != "") {
            keiyaku["user_id"] = route.contract[keiyaku["value"]+"user_id"];
          }

        }
      }

      if (!route.hojin) {
        setKeiyaku1(Keiyaku_);
      } else {
        setKeiyaku2(Keiyaku_);
      }

    }
    
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

    items.unshift({ label: "▼ 選択", value: "" });
    return items;

  },[staffs]);

  const ChangeData = (date_,index_ = date_index,mode_ = mode) => {

    var Keiyaku_ = !hojin?Keiyaku1[form]:Keiyaku2[form];

    if (mode_ == "open") {
      for (var k=0;k<Keiyaku_.length;k++) {
        Keiyaku_[k]["open"] = false;
      }
    }

    Keiyaku_[index_][mode_] = date_;

    if (mode_ == "checked" && Keiyaku_[index_]["date"] == "" && date_) {
      Keiyaku_[index_]["date"] = Moment(new Date()).format("YYYY-MM-DD");
    }

    var newKeiyaku   = !hojin?Keiyaku1:Keiyaku2;
    newKeiyaku[form] = Keiyaku_;
    
    if (!hojin) {
      setKeiyaku1(newKeiyaku);
    } else {
      setKeiyaku2(newKeiyaku);
    }

    setReroad(!reroad);

  }
  
  const ClearData = () => {

    var Keiyaku_ = !hojin?Keiyaku1[form]:Keiyaku2[form];

    for (var k=0;k<Keiyaku_.length;k++) {
      Keiyaku_[k]["date"]    = "";
      Keiyaku_[k]["time"]    = "";
      Keiyaku_[k]["checked"] = false;
      Keiyaku_[k]["user_id"] = false;
      Keiyaku_[k]["open"] = false;
    }

    var newKeiyaku   = !hojin?Keiyaku1:Keiyaku2;
    newKeiyaku[form] = Keiyaku_;
    
    if (!hojin) {
      setKeiyaku1(newKeiyaku);
    } else {
      setKeiyaku2(newKeiyaku);
    }

    setReroad(!reroad);

  }

  const ChangeDateTime = (date_,time_) => {
    
    var dateParts = date_.split("-");
    var year = dateParts[0] ? parseInt(dateParts[0], 10) : new Date().getFullYear();
    var month = dateParts[1] ? parseInt(dateParts[1] - 1, 10) : new Date().getMonth();
    var day = dateParts[2] ? parseInt(dateParts[2], 10) : new Date().getDate();

    var timeParts = time_.split(":");
    var hour = timeParts[0] ? parseInt(timeParts[0], 10) : new Date().getHours();
    var minute = timeParts[1] ? parseInt(timeParts[1], 10) : new Date().getMinutes();
    var second = timeParts[2] ? parseInt(timeParts[2], 10) : new Date().getSeconds();

    // 新しいDateオブジェクトを作成
    var newDate = new Date(year, month, day, hour, minute, second);

    return newDate;
  }

	const pickDocument = async () => {
    var result = await DocumentPicker.getDocumentAsync({});

    if (result) {

      const file = result.assets[0];

      if(file.size > 3000000) {
        Alert.alert('','手書き受領証のサイズは【3メガ】までにしてください。');
      }else{
        setFilename(file.name);
        setFiledata(file);
      }
      
    }
  };

  function onSubmit() {

    var err = "";

    var DataArr = !hojin?Keiyaku1:Keiyaku2;

    for (var k=0;k<=2;k++) {
      var Keiyaku_ = DataArr[k];
      for (var k2=0;k2<Keiyaku_.length;k2++) {
        const label   = Keiyaku_[k2]["label"];
        const date    = Keiyaku_[k2]["date"];
        const time    = Keiyaku_[k2]["time"];
        const checked = Keiyaku_[k2]["checked"];
  
        if (!hojin && date == "" && time != "") {
          err += `・${label}の時間を指定していますが、日付を指定していません。\n`;
        }
  
      }
    }

    if (err != "") {
      Alert.alert("エラー",err);
      return;
    }
    
    setLoading(true);
    
    let formData = new FormData();
    formData.append('ID',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act',!hojin?'contract':'cjs_contract');
    formData.append('fc_flg',global.fc_flg);
    formData.append('val[app_flg]',1);
    formData.append('val[id]',route.customer);
    formData.append('val[shop_id]',route.params.shop_id);

    if (!hojin) {
      formData.append('val[flg]',route.contract != null?"1":"");
    }

    for (var k=0;k<=2;k++) {
      var Keiyaku_ = DataArr[k];
      for (var k2=0;k2<Keiyaku_.length;k2++) {
        
        const value   = Keiyaku_[k2]["value"];
        const date    = Keiyaku_[k2]["date"];
        const time    = Keiyaku_[k2]["time"];
        const checked = Keiyaku_[k2]["checked"];
        const user_id = Keiyaku_[k2]["user_id"];

        var datetime = date + ' ' + time;

        if ((hojin && date != "") || ( date != "" && time == "" )) {
          datetime = date + ' 00:00:00';
        } else if (date == "" && time != "") {
          datetime = "";
        }

        formData.append(`val[${value}date]`,datetime);
        formData.append(`val[${value}flg]`,checked.toString());

        if (hojin) {
          formData.append(`val[${value}user_id]`,user_id);
        }
  
      }
    }

    fetch(domain+'php/ajax/update.php',
    {
      method: 'POST',
      body: formData,
      header: {
        'content-type': 'multipart/form-data',
      },
    })
    .then((response) => response.json())
    .then(async(json) => {
      // console.log(json);
      setLoading(false);
      Alert.alert('','保存しました。');
    })
    .catch((error) => {
      console.log(error);
      Alert.alert('エラー','保存に失敗しました。');
      setLoading(false);
    })

  }

  function formatDate(dateString) {
    
    const [datePart, timePart] = dateString.split(' ');
    const [year, month, day] = datePart.split('-');
    const [hours, minutes] = timePart.split(':');

    const formattedDate = `${year}年${month}月${day}日 ${hours}時${minutes}分`;

    return formattedDate;
  }

  async function contract_sms_file(download_name,file_name) {

    const pdfURL = domain + "receipt_sign/upload/handwritten/" + file_name;

    const dl_dir = FileSystem.documentDirectory + download_name + '.pdf';

    await FileSystem.downloadAsync(pdfURL,dl_dir);

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(dl_dir);
    } else {
      Alert.alert('エラー', 'このデバイスではファイルの共有がサポートされていません。');
    }

  }

  async function get_contract_sms_pdf(send_category) {

    const pdfData = await getFetch("1",send_category);

    if (pdfData == false) {
      Alert.alert('エラー','PDFの取得に失敗しました。\nインターネット接続を確認してください。');
      return;
    }

    const pdfUri = `${FileSystem.documentDirectory}contract_sms.pdf`;

    await FileSystem.writeAsStringAsync(pdfUri, pdfData, { encoding: FileSystem.EncodingType.Base64 });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(pdfUri);
    } else {
      Alert.alert('エラー', 'このデバイスではファイルの共有がサポートされていません。');
    }
    
  }

  async function pop_up_sms_send(send_category) {

    const Data = await getFetch("",send_category);

    if (Data == false) {
      Alert.alert('エラー','PDFの取得に失敗しました。\nインターネット接続を確認してください。');
      return;
    }

    if (Data != null) {
      if (send_category == "1") {
        var key_sms_arr = key_sms;
        for (var i_buf=1;i_buf<=6;i_buf++) {
          if (!Data[i_buf]) continue;
          key_sms_arr[i_buf-1]["document_room_no"]   = Data[i_buf]["document_room_no"];
          key_sms_arr[i_buf-1]["document_key_maker"] = Data[i_buf]["document_key_maker"];
          key_sms_arr[i_buf-1]["document_name"]      = Data[i_buf]["document_name"];
          key_sms_arr[i_buf-1]["document_quantity"]  = Data[i_buf]["document_quantity"];
          key_sms_arr[i_buf-1]["document_note"]      = Data[i_buf]["document_note"];
        }
        setKey_sms(key_sms_arr);
      } else if (send_category == "2") {
        var agreement_sms_arr = agreement_sms;
        for (var i_buf=1;i_buf<=6;i_buf++) {
          if (!Data[i_buf]) continue;
          agreement_sms_arr[i_buf-1]["document_name"]     = Data[i_buf]["document_name"];
          agreement_sms_arr[i_buf-1]["document_quantity"] = Data[i_buf]["document_quantity"];
          agreement_sms_arr[i_buf-1]["document_note"]     = Data[i_buf]["document_note"];
        }
        setAgreement_sms(agreement_sms_arr);
      }
    }

    setSms_send_flg(send_category);
    setSms_send(true);
  }

  const getFetch = useCallback((get_pdf,send_category) => {
    
    return new Promise((resolve, reject)=>{
      fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
      {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: JSON.stringify({
          ID : route.params.account,
          pass : route.params.password,
          act:'get_contract_sms',
          customer_id:route.customer,
          send_category: send_category,
          get_pdf:get_pdf
        })
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

	async function save_sms_data(send_date_flg){

    setSms_send(false);
    setLoading(true);

    let formData = new FormData();
    formData.append('act','save_sms_data');
    formData.append('ID',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('fc_flg',global.fc_flg);
    formData.append('val[id]',route.customer);
    formData.append('val[category_key]',sms_send_flg);
    formData.append('val[sms_send_tel]',sms_send_tel);
    formData.append('val[shop_id]',route.params.shop_id);
    formData.append('val[send_date_flg]',send_date_flg);
    formData.append('val[app_flg]',1);

    for (var i_buf=1;i_buf<=6;i_buf++) {
      if (sms_send_flg == "1") {
        formData.append(`val[${i_buf}][document_room_no]`,key_sms[i_buf-1]["document_room_no"]);
        formData.append(`val[${i_buf}][document_key_maker]`,key_sms[i_buf-1]["document_key_maker"]);
        formData.append(`val[${i_buf}][document_name]`,key_sms[i_buf-1]["document_name"]);
        formData.append(`val[${i_buf}][document_quantity]`,key_sms[i_buf-1]["document_quantity"]);
        formData.append(`val[${i_buf}][document_note]`,key_sms[i_buf-1]["document_note"]);
      } else if (sms_send_flg == "2") {
        formData.append(`val[${i_buf}][document_room_no]`,agreement_sms[i_buf-1]["document_room_no"]);
        formData.append(`val[${i_buf}][document_key_maker]`,agreement_sms[i_buf-1]["document_key_maker"]);
        formData.append(`val[${i_buf}][document_name]`,agreement_sms[i_buf-1]["document_name"]);
        formData.append(`val[${i_buf}][document_quantity]`,agreement_sms[i_buf-1]["document_quantity"]);
        formData.append(`val[${i_buf}][document_note]`,agreement_sms[i_buf-1]["document_note"]);
      }
    }

    const result = await sendFetch(formData,"1");

    if (!result) {
      Alert.alert('エラー','保存に失敗しました。');
      setLoading(false);
      return;
    } else {
      if (!send_date_flg) {
        Alert.alert('','保存しました。');
        setLoading(false);
        return;
      }
    }

    // 送信処理
    let formData2 = new FormData();
    formData2.append('act','send_sms_contract');
    formData2.append('ID',route.params.account);
    formData2.append('pass',route.params.password);
    formData2.append('shop_id',route.params.shop_id);
    formData2.append('customer_id',route.customer);
    formData2.append('category_key',sms_send_flg);
    formData2.append('tel',sms_send_tel);
    formData2.append('app_flg',1);
    formData.append('fc_flg',global.fc_flg);

    const result2 = await sendFetch(formData2,"2");

    if (!result2) {
      Alert.alert('エラー','送信に失敗しました。');
      setLoading(false);
      return;
    }

    await set_Contract_sms();

    setFilename('');
    setFiledata(null);

    Alert.alert('','送信しました。');
    setLoading(false);
    setReroad(!reroad);

    return;
  }

  async function send_file_data() {
    
    if (!filedata) {
      Alert.alert('エラー','手書き受領証を添付してください。');
      return;
    }

    setSms_send(false);
    setLoading(true);
    
    let formData = new FormData();
    formData.append('act','save_sms_file_data');
    formData.append('ID',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('fc_flg',global.fc_flg);
    formData.append('val[id]',route.customer);
    formData.append('val[category_key]',sms_send_flg);
    formData.append('val[shop_id]',route.params.shop_id);
    formData.append('val[app_flg]',1);

    let filename = filedata.uri.split('/').pop();

    let match = /\.(\w+)$/.exec(filename);
    let type = match ? `image/${match[1]}` : `image`;
    formData.append('handwritten_file', { uri: filedata.uri, name: filename, type });

    const result = await sendFetch(formData,"1");

    if (!result) {
      Alert.alert('エラー','手書き受領証登録に失敗しました。');
      setLoading(false);
      return;
    }

    await set_Contract_sms();

    // 送信情報のテキストに送信情報を入れる
    var keiyaku = Keiyaku1;
    if (sms_send_flg == "1") {
      keiyaku[2].forEach(item => {
        if (item.value === "key_pass_") {
          item.date    = Moment(new Date()).format("YYYY-MM-DD");
          item.time    = Moment(new Date()).format("HH:mm:ss");
          item.checked = true;
        }
      });
    } else if (sms_send_flg == "2") {
      keiyaku[2].forEach(item => {
        if (item.value === "agreement_") {
          item.date    = Moment(new Date()).format("YYYY-MM-DD");
          item.time    = Moment(new Date()).format("HH:mm:ss");
          item.checked = true;
        }
      });
    }

    if (sms_send_flg == "1") {
      setKey_btn(true);
    } else if (sms_send_flg == "2") {
      setAgreement_btn(true);
    }
    
    setFilename('');
    setFiledata(null);

    setKeiyaku1(keiyaku);

    Alert.alert('','送信しました。');
    setLoading(false);
    setReroad(!reroad);

    return;

  }

  const set_Contract_sms = () => {

    const now = Moment(new Date()).format("YYYY-MM-DD HH:mm:ss");

    var data = {};

    if (contract_sms != null) {
      if (contract_sms[sms_send_flg]) {
        data = contract_sms;
        data[sms_send_flg]["send_date"] = now;
      } else {
        data = contract_sms;
        var data_sub = {
          [sms_send_flg]:{
            "customer_id": "1766798",
            "send_category": sms_send_flg,
            "send_date": now,
            "send_tel": sms_send_tel,
            "shop_id": route.params.shop_id,
            "staff_id": route.params.account,
          }
        }
        Object.assign(data, data_sub);
      }
    } else {
      data = {
        [sms_send_flg]:{
          "customer_id": "1766798",
          "send_category": sms_send_flg,
          "send_date": now,
          "send_tel": sms_send_tel,
          "shop_id": route.params.shop_id,
          "staff_id": route.params.account,
        }
      }
    }

    setContract_sms(data);

  }

  const sendFetch = useCallback((formData,flg) => {

    const url = flg == "1"?domain+'php/ajax/update.php':domain+'php/ajax/mail_sms.php';
    
    return new Promise((resolve, reject)=>{
      fetch(url,
      {
        method: 'POST',
        body: formData,
        header: {
          'content-type': 'multipart/form-data',
        },
      })
      .then((response) => response.json())
      .then(async(json) => {
        resolve(json);
      })
      .catch((error) => {
        console.log(error);
        resolve(false);
      })
    })

  });

  const ContractList = useMemo(() => {

    var Keiyaku_ = !hojin?Keiyaku1[form]:Keiyaku2[form];

    return (
      <FlatList
        bounces={false}
        initialNumToRender={10}
        data={Keiyaku_}
        renderItem={({ item,index }) => {

          var key_pass = null;
          var agreement = null;

          if (route.options.includes('30')) {
            // 鍵・書類渡し
            if (item.value == "key_pass_") {

              key_pass = {
                "flg": "0",
                "txt": "",
                "file": ""
              }
              if (contract_sms != null && contract_sms["1"]) {

                // 0:未送信(未受領) 1:手書き受領証 2:受領済
                if (contract_sms["1"]["receipt_date"] && item.checked) {
                  if (contract_sms["1"]["file_name"]) {
                    key_pass["flg"] = "1";
                    key_pass["file"] = contract_sms["1"]["file_name"];
                  } else {
                    key_pass["flg"] = "2";
                  }
                }

                if (contract_sms["1"]["send_date"]) {
                  key_pass["txt"] = formatDate(contract_sms["1"]["send_date"]);
                  if (contract_sms["1"]["send_tel"]) {
                    key_pass["txt"] += `【${contract_sms["1"]["send_tel"]}】に送信`;
                  } else {
                    key_pass["txt"] += ` 手書き受領証登録`;
                  }
                }
              }
            }
            
            // 契約書返却送信チェック
            if (item.value == "agreement_") {

              agreement = {
                "flg": "0",
                "txt": "",
                "file": ""
              }

              if (contract_sms != null && contract_sms["2"]) {

                // 0:未送信(未受領) 1:手書き受領証 2:受領済
                if (contract_sms["2"]["receipt_date"] && item.checked) {
                  if (contract_sms["2"]["file_name"]) {
                    agreement["flg"] = "1";
                    agreement["file"] = contract_sms["2"]["file_name"];
                  } else {
                    agreement["flg"] = "2";
                  }
                }

                if (contract_sms["2"]["send_date"]) {
                  agreement["txt"] = formatDate(contract_sms["2"]["send_date"]);
                  if (contract_sms["2"]["send_tel"]) {
                    agreement["txt"] += `【${contract_sms["2"]["send_tel"]}】に送信`;
                  } else {
                    agreement["txt"] += ` 手書き受領証登録`;
                  }
                }
              }
            }
          }

          return (
              <View style={[styles.contractList,index==(Keiyaku_.length-1)&&{borderBottomWidth:0}]} index={index} {...props}>
              <Text style={styles.contract}>{item.label}</Text>
              <View style={{flexDirection:'row'}}>
                <TouchableOpacity
                  style={styles.Datebtn}
                  onPress={()=>{
                    setDate_index(index);
                    setDate(ChangeDateTime(item.date,item.time));
                    setMode('date');
                    setShow(true);
                  }}
                >
                  <Text style={styles.Datebtn_text}>{item.date}</Text>
                  <TouchableOpacity
                    style={styles.date_del}
                    onPress={()=>{
                      ChangeData("",index,"date");
                    }}
                  >
                    <Feather name='x-circle' color='#6b6b6b' size={20} />
                  </TouchableOpacity>
                </TouchableOpacity>
                {
                  !hojin&&item.value!="move_in_"&&
                  (
                    <TouchableOpacity
                      style={[styles.Datebtn,{width:100}]}
                      onPress={()=>{
                        setDate_index(index);
                        setDate(ChangeDateTime(item.date,item.time));
                        setMode('time');
                        setShow(true);
                      }}
                    >
                      <Text style={styles.Datebtn_text}>{item.time.slice(0, 5)}</Text>
                      <TouchableOpacity
                        style={styles.date_del}
                        onPress={()=>{
                          ChangeData("",index,"time");
                        }}
                      >
                        <Feather name='x-circle' color='#6b6b6b' size={20} />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  )
                }
                {
                  hojin&&
                  (
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
                      value={item.user_id}
                      data={staffList}
                      placeholder="▼ 選択"
                      onChange={(item) => ChangeData(item.value,index,"user_id")}
                      labelField="label"
                      valueField="value"
                    />
                  )
                }
                <CheckBox
                  checked={item.checked}
                  onPress={() => ChangeData(!item.checked,index,"checked")}
                  containerStyle={styles.checkbox}
                  checkedColor={chk}
                  size={28}
                  />
              </View>
              {(key_pass!=null && item.value == "key_pass_")&&(
                <View style={{marginTop:5}} >
                  <TouchableOpacity
                    style={[styles.Datebtn,{backgroundColor:'#e3e3e3'}]}
                    onPress={()=>{
                      if (key_pass.flg == "1") {
                        contract_sms_file("鍵受領証",key_pass.file);
                      } else if (key_pass.flg == "2") {
                        get_contract_sms_pdf('1');
                      } else {
                        pop_up_sms_send("1");
                      }
                    }}
                    disabled={key_btn}
                  >
                    <Text>{key_pass.flg=="0"?"確認依頼送信":'受領証'}</Text>
                  </TouchableOpacity>
                  {key_pass.txt&&(
                    <Text style={{fontSize:12,marginTop:3}}>{key_pass.txt}</Text>
                  )}
                </View>
              )}
              {(agreement!=null && item.value == "agreement_")&&(
                <View style={{marginTop:5}} >
                  <TouchableOpacity
                    style={[styles.Datebtn,{backgroundColor:'#e3e3e3'}]}
                    onPress={()=>{
                      if (agreement.flg == "1") {
                        contract_sms_file("契約書受領証",agreement.file);
                      } else if (agreement.flg == "2") {
                        get_contract_sms_pdf('2')
                      } else {
                        pop_up_sms_send("2");
                      }
                    }}
                    disabled={agreement_btn}
                  >
                    <Text>{agreement.flg=="0"?"確認依頼送信":'受領証'}</Text>
                  </TouchableOpacity>
                  {agreement.txt&&(
                    <Text style={{fontSize:12,marginTop:3}}>{agreement.txt}</Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
        keyExtractor={(item) => `${item.label}`}
        extraData={reroad}
      />
    )
    
  },[form,Keiyaku1,Keiyaku2,reroad,staffs,contract_sms,key_btn,agreement_btn])

  const chk = !global.fc_flg?"#81aee6":"#e6c4f5";
  const spc = !global.fc_flg?"#dce6fc":"#ffe8f0";

  return (
    <>
    <Loading isLoading={isLoading} />
    <ScrollView
      style={{flex: 1}}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.view}>
        <View style={{flexDirection:'row',width:'100%'}}>
          <TouchableOpacity
            onPress={()=>{setForm(0)}}
            style={form==0?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>申込手続き</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(1)}}
            style={form==1?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>契約準備</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(2)}}
            style={form==2?[styles.active_tab,{backgroundColor:spc}]:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>契 約</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.table,{backgroundColor:spc}]}>
          {ContractList}
          {(show && Platform.OS === 'android') && (
            <DateTimePicker
              value={date}
              mode={mode}
              display="default"
              locale={'ja'}
              onChange={(event, selectedDate) => {
                const currentDate = selectedDate || date;
                const ymd = Moment(currentDate).format(mode=="date"?"YYYY-MM-DD":"HH:mm");
                ChangeData(ymd);
                setShow(false);
                setDate(new Date());
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
                  onPress={()=>{
                    setShow(false);
                    setDate(new Date());
                  }}
                >
                  <Feather name='x-circle' color='#ccc' size={35} />
                </TouchableOpacity>
                <DateTimePicker
                  value={date}
                  mode={mode}
                  display="spinner"
                  locale={'ja'}
                  onChange={(event, selectedDate) => {
                    const currentDate = selectedDate || date;
                    const ymd = Moment(currentDate).format(mode=="date"?"YYYY-MM-DD":"HH:mm:00");
                    ChangeData(ymd);
                  }}
                  textColor="#fff"
                />
              </View>
            </Modal>
          )}
          {customer_only!=null&&(
            <Modal
              isVisible={sms_send}
              swipeDirection={null}
              backdropOpacity={0.5}
              animationInTiming={300}
              animationOutTiming={500}
              animationIn={'slideInDown'}
              animationOut={'slideOutUp'}
              propagateSwipe={true}
              style={{alignItems: 'center'}}
              onBackdropPress={()=>setSms_send(false)}
            >
              <View style={cus_not_flg?styles.sms_modal_no:styles.sms_modal}>
                <TouchableOpacity
                  style={{position: 'absolute',top:8,right:10,zIndex:999}}
                  onPress={()=>setSms_send(false)}
                >
                  <Feather name='x-circle' color='#ccc' size={35} />
                </TouchableOpacity>
                {cus_not_flg?(
                    <Text style={{textAlign:'center'}}>電話番号・メールが入っていないため{"\n"}使用できません。</Text>
                  ):(
                    <>
                    <View style={{flexDirection:'row',alignItems:'center'}}>
                      <Text>送信先：</Text>
                      <Dropdown
                        style={[styles.DropDown,{width:200}]}
                        containerStyle={[styles.dropDownContainer,{width:200}]}
                        placeholderStyle={{fontSize:14}}
                        selectedTextStyle={{fontSize:12}}
                        itemTextStyle={{fontSize:14}}
                        renderItem={(item)=>(
                          <View style={styles.dropItem}>
                            <Text style={styles.dropItemText}>{item.label}</Text>
                          </View>
                        )}
                        value={sms_send_tel}
                        data={cusTelMailList}
                        onChange={(item) => setSms_send_tel(item.value)}
                        labelField="label"
                        valueField="value"
                      />
                    </View>
                    <ScrollView horizontal>
                      <View style={styles.table_wrapper}>
                        {sms_send_flg=="1"?(
                          <View style={styles.tr}>
                            <View style={[styles.th,{borderLeftWidth:1,width:'5%'}]}>
                              <Text>No</Text>
                            </View>
                            <View style={[styles.th,{width:'10%'}]}>
                              <Text>号室</Text>
                            </View>
                            <View style={[styles.th,{width:'20%'}]}>
                              <Text>メーカー</Text>
                            </View>
                            <View style={[styles.th,{width:'20%'}]}>
                              <Text>鍵番号</Text>
                            </View>
                            <View style={[styles.th,{width:'10%'}]}>
                              <Text>本数</Text>
                            </View>
                            <View style={[styles.th,{width:'35%'}]}>
                              <Text>備考</Text>
                            </View>
                          </View>
                        ):(
                          <View style={styles.tr}>
                            <View style={[styles.th,{borderLeftWidth:1,width:'5%'}]}>
                              <Text>No</Text>
                            </View>
                            <View style={[styles.th,{width:'40%'}]}>
                              <Text>書類名</Text>
                            </View>
                            <View style={[styles.th,{width:'10%'}]}>
                              <Text>数量</Text>
                            </View>
                            <View style={[styles.th,{width:'45%'}]}>
                              <Text>備考</Text>
                            </View>
                          </View>
                        )}
                        {sms_send_flg=="1"?(
                          key_sms.map((s,index) => {
                            return (
                              <View style={styles.tr} key={index}>
                                <View style={[styles.td,{borderLeftWidth:1,width:'5%'}]}>
                                  <Text>{index+1}</Text>
                                </View>
                                <View style={[styles.td,{width:'10%'}]}>
                                  <TextInput
                                    style={styles.td_input}
                                    value={key_sms[index]["document_room_no"]}
                                    onChangeText={(text) => setKey_sms(state => state.map((item, i) => i === index ? { ...item, document_room_no: text } : item))}
                                  />
                                </View>
                                <View style={[styles.td,{width:'20%'}]}>
                                  <TextInput
                                    style={styles.td_input}
                                    value={key_sms[index]["document_key_maker"]}
                                    onChangeText={(text) => setKey_sms(state => state.map((item, i) => i === index ? { ...item, document_key_maker: text } : item))}
                                  />
                                </View>
                                <View style={[styles.td,{width:'20%'}]}>
                                  <TextInput
                                    style={styles.td_input}
                                    value={key_sms[index]["document_name"]}
                                    onChangeText={(text) => setKey_sms(state => state.map((item, i) => i === index ? { ...item, document_name: text } : item))}
                                  />
                                </View>
                                <View style={[styles.td,{width:'10%'}]}>
                                  <TextInput
                                    style={styles.td_input}
                                    value={key_sms[index]["document_quantity"]}
                                    onChangeText={(text) => setKey_sms(state => state.map((item, i) => i === index ? { ...item, document_quantity: text } : item))}
                                  />
                                </View>
                                <View style={[styles.td,{width:'35%'}]}>
                                  <TextInput
                                    style={styles.td_input}
                                    value={key_sms[index]["document_note"]}
                                    onChangeText={(text) => setKey_sms(state => state.map((item, i) => i === index ? { ...item, document_note: text } : item))}
                                  />
                                </View>
                              </View>
                            )
                          })):(
                          agreement_sms.map((a,index) => {
                            return (
                              <View style={styles.tr} key={index}>
                                <View style={[styles.td,{borderLeftWidth:1,width:'5%'}]}>
                                  <Text>{index+1}</Text>
                                </View>
                                <View style={[styles.td,{width:'40%'}]}>
                                  <TextInput
                                    style={styles.td_input}
                                    value={agreement_sms[index]["document_name"]}
                                    onChangeText={(text) => setAgreement_sms(state => state.map((item, i) => i === index ? { ...item, document_name: text } : item))}
                                  />
                                </View>
                                <View style={[styles.td,{width:'10%'}]}>
                                  <TextInput
                                    style={styles.td_input}
                                    value={agreement_sms[index]["document_quantity"]}
                                    onChangeText={(text) => setAgreement_sms(state => state.map((item, i) => i === index ? { ...item, document_quantity: text } : item))}
                                  />
                                </View>
                                <View style={[styles.td,{width:'45%'}]}>
                                  <TextInput
                                    style={styles.td_input}
                                    value={agreement_sms[index]["document_note"]}
                                    onChangeText={(text) => setAgreement_sms(state => state.map((item, i) => i === index ? { ...item, document_note: text } : item))}
                                  />
                                </View>
                              </View>
                            )
                          }))
                        }
                      </View>
                    </ScrollView>
                    <View style={{flexDirection: 'row',alignSelf: 'center',marginTop:20}}>
                      <TouchableOpacity onPress={()=>{save_sms_data("1")}} style={styles.Datebtn}>
                        <Text>送　信</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={()=>{save_sms_data("")}} style={styles.Datebtn}>
                        <Text>保　存</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.tegaki}>
                      <Text style={{fontSize:12}}>手書きでの受領書を保存する場合はこちらから</Text>
                      <View style={{flexDirection:'row',alignItems:'center',marginTop:10}}>
                        <TouchableOpacity
                          onPress={pickDocument}
                          style={[styles.Datebtn,{backgroundColor:'#e3e3e3'}]}
                        >
                          <Text>ファイル添付</Text>
                        </TouchableOpacity>
                        <Text style={{fontSize:12}}>{filename}</Text>
                      </View>
                      <View style={{alignItems: 'center',marginTop:10}}>
                        <TouchableOpacity onPress={()=>{send_file_data()}} style={[styles.Datebtn,{width:150}]}>
                          <Text>手書き受領証登録</Text>
                        </TouchableOpacity>
                        <Text style={{fontSize:12,marginTop:5,color:'#666'}}>※手書き受領証を登録すると、完了状態になります。</Text>
                      </View>
                    </View>
                    </>
                  )
                }
              </View>
            </Modal>
          )}
          <View style={{flexDirection: 'row',alignSelf: 'center'}}>
            <TouchableOpacity onPress={()=>{onSubmit()}} style={[styles.submit,{backgroundColor:chk}]}>
              <Text style={styles.submitText}>保　存</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={()=>{ClearData()}} style={styles.clear}>
              <Text style={styles.clearText}>クリア</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
    </>
  );
}

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
    width: "90%",
    marginTop:15,
    marginBottom:80,
    marginHorizontal:'5%'
  },
  active_tab: {
    width:"33%",
    height:50,
    justifyContent: 'center',
    alignItems:'center',
    borderTopLeftRadius:10,
    borderTopRightRadius:10,
  },
  inactivetab: {
    width:"33%",
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
    width:'99%',
    paddingHorizontal:5,
    paddingBottom:15
  },
  contractList: {
    width:'100%',
    paddingVertical:7,
    justifyContent:'center',
    borderBottomWidth:1,
    borderBottomColor:"#fff",
  },
  contract: {
    fontSize: 14,
    fontWeight:'700',
    marginBottom:3
  },
  Datebtn: {
    width: 120,
    height: 30,
    backgroundColor:'#fff',
    borderRadius:5,
    borderWidth:1,
    justifyContent:'center',
    alignItems:'center',
    flexDirection:'row',
    marginRight:10
  },
  Datebtn_text: {
    width:'75%',
    fontSize: 14,
    paddingLeft:5
  },
  iosdate: {
    width:300,
    height:260,
    backgroundColor:'#333',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5
  },
  date_del: {
    width:'25%',
    height:30,
    justifyContent:'center',
    alignItems:'flex-end',
    paddingRight:3
  },
  DropDown: {
    width: 150,
    fontSize: 16,
    height: 30,
    borderRadius:5,
    backgroundColor:'#fff',
    borderWidth:1,
    paddingHorizontal:5,
  },
  dropDownContainer: {
    width: 150,
    maxHeight:150,
    borderWidth:1,
    marginTop:0
  },
  dropItem: {
    padding:10,
  },
  dropItemText: {
    fontSize:14,
  },
  checkbox: {
    margin: 0,
    marginLeft: "auto",
    marginRight: 0,
    padding: 0,
    borderWidth: 0,
    borderRadius: 0,
    height:30,
    backgroundColor:'transparent',
    alignItems:'center',
    justifyContent:'center',
  },
  submit:{
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop:15,
    borderRadius: 8,
    width:100,
    height:40,
    shadowColor: "#a3a3a3",
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity:1,
    shadowRadius:2,
    elevation:5
  },
  clear:{
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop:15,
    borderRadius: 8,
    width:100,
    height:40,
    marginLeft:10,
    backgroundColor:'#bfbfbf',
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
  clearText: {
    fontSize:16,
    fontWeight:'600',
    color:'#666'
  },
  sms_modal_no: {
    backgroundColor:'#fff',
    borderRadius:5,
    paddingH:20,
    justifyContent:'center',
    alignItems:'center'
  },
  sms_modal: {
    width:'100%',
    backgroundColor:'#fff',
    borderRadius:5,
    padding:15,
  },
  table_wrapper: {
    width:700,
    marginTop:10
  },
  tr: {
    backgroundColor:'#fff',
    flexDirection: 'row',
  },
  th: {
    borderWidth:1,
    borderLeftWidth:0,
    borderColor:'#333',
    height:35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  td: {
    borderWidth:1,
    borderLeftWidth:0,
    borderTopWidth:0,
    borderColor:'#333',
    height:35,
    justifyContent: 'center',
    alignItems: 'center',
  },
  td_input: {
    width:'90%',
    height:'85%',
    borderWidth:0.5,
    borderColor:'#666',
    borderRadius:5,
    paddingLeft:5
  },
  tegaki: {
    paddingVertical:10,
    borderTopWidth:1,
    marginTop:20
  }
});
