import React, { useState,useEffect,useMemo } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, BackHandler, AppState, KeyboardAvoidingView, ScrollView, FlatList,  Image, Linking, Platform, Button
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import Moment from 'moment';
import Modal from "react-native-modal";
import { CheckBox } from 'react-native-elements';
import DropDownPicker, { Item } from "react-native-dropdown-picker";
import { Dropdown } from 'react-native-element-dropdown';

import Loading from '../components/Loading';
import { db,db_write,GetDB } from '../components/Databace';

import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ローカルストレージ読み込み
const storage = new Storage({
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

let domain = 'http://family.chinser.co.jp/irie/tc_app/';
// let domain = 'https://www.total-cloud.net/';

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
      {label:"契約書返還",value:"agreement_",date:"",time:"",checked:false,user_id:""},
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

  const [date, setDate] = useState(new Date());
  const [date_index, setDate_index] = useState(0);
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState('date');
  const [reroad, setReroad] = useState(true); // リスト更新用

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

  const ContractList = useMemo(() => {

    var Keiyaku_ = !hojin?Keiyaku1[form]:Keiyaku2[form];

    return (
      <FlatList
        bounces={false}
        initialNumToRender={10}
        data={Keiyaku_}
        renderItem={({ item,index }) => {
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
            </View>
          );
        }}
        keyExtractor={(item) => `${item.label}`}
        extraData={reroad}
      />
    )
    
  },[form,Keiyaku1,Keiyaku2,reroad,staffs])

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
            style={form==0?styles.active_tab:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>申込手続き</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(1)}}
            style={form==1?styles.active_tab:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>契約準備</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={()=>{setForm(2)}}
            style={form==2?styles.active_tab:styles.inactivetab}
          >
            <Text style={styles.tab_txt}>契 約</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.table}>
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
          <View style={{flexDirection: 'row',alignSelf: 'center'}}>
            <TouchableOpacity onPress={()=>{onSubmit()}} style={styles.submit}>
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
    backgroundColor:spc,
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
    backgroundColor:spc,
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
    backgroundColor:chk,
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
});
