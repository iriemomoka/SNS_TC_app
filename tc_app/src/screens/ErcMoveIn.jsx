import React, { useState,useEffect,useMemo,useCallback } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, BackHandler, AppState, Keyboard, Platform, TouchableWithoutFeedback, Image, Linking, Dimensions
} from "react-native";
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import RadioButtonRN from 'radio-buttons-react-native';
import Moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from "react-native-modal";
import { CheckBox } from 'react-native-elements';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from "expo-media-library";
import * as Clipboard from 'expo-clipboard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import JSZip from "jszip";

import Loading from '../components/Loading';
import { db,db_write,GetDB } from '../components/Databace';

import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ローカルストレージ読み込み
const storage = new Storage({
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

// let domain = 'http://tc.chinser.co.jp/';
let domain = 'https://www.total-cloud.net/';

const Width = Dimensions.get("window").width;

export default function ErcMoveIn(props) {

  if (AppState.currentState === 'active') {
    Notifications.setBadgeCountAsync(0);
  }
  
  const { navigation, route } = props;
  
  const [isLoading, setLoading] = useState(false);

  // 0：物件情報 1：申込情報１ 2:申込情報２
  const [form, setForm] = useState(0);

  const [change_flg, setChange_flg] = useState({
    "content": "",  // 入居申込書作成
    "article": "",  // 物件情報
    "customer": "", // 申込情報
  });

  // ----- 物件情報 START -----
  const [move_in, setMove_in] = useState({
    "address_building": "",
    "address_city": "",
    "address_kana": "",
    "address_number": "",
    "address_prefecture": "",
    "agree_timestamp": "",
    "article_kana": "",
    "article_name": "",
    "bicycle_parking_fee": "",
    "bike_parking_fee": "",
    "brokerage_shop_id": "",
    "check_flg": "",
    "customer_id": "",
    "del_flg": "",
    "deposit": "",
    "erc_send_flg": "",
    "erc_type": "",
    "guarantee_company": "",
    "initial_cost_type": "",
    "ins_dt": "",
    "joint_guarantor": "",
    "management_fee": "",
    "move_in_date": "",
    "other_fee": "",
    "other_fee2": "",
    "other_item": "",
    "other_item2": "",
    "parking_fee": "",
    "parking_no": "",
    "rent": "",
    "resident_type": "",
    "reward": "",
    "room_no": "",
    "save_flg": "",
    "town_fee": "",
    "upd_dt": "",
    "user_type": "",
    "water_fee": "",
    "zipcode": ""
  });

  const [move_in_err, setMove_in_err] = useState({
    "address_building": "",
    "address_city": "",
    "address_kana": "",
    "address_number": "",
    "address_prefecture": "",
    "agree_timestamp": "",
    "article_kana": "",
    "article_name": "",
    "bicycle_parking_fee": "",
    "bike_parking_fee": "",
    "brokerage_shop_id": "",
    "check_flg": "",
    "customer_id": "",
    "del_flg": "",
    "deposit": "",
    "erc_send_flg": "",
    "erc_type": "",
    "guarantee_company": "",
    "initial_cost_type": "",
    "ins_dt": "",
    "joint_guarantor": "",
    "management_fee": "",
    "move_in_date": "",
    "other_fee": "",
    "other_fee2": "",
    "other_item": "",
    "other_item2": "",
    "parking_fee": "",
    "parking_no": "",
    "rent": "",
    "resident_type": "",
    "reward": "",
    "room_no": "",
    "save_flg": "",
    "town_fee": "",
    "upd_dt": "",
    "user_type": "",
    "water_fee": "",
    "zipcode": ""
  });

  const [shop, setShop] = useState({
    "brokerage_shop_code": "",
    "corporations_name": "",
    "name": "",
    "shop_id": "",
  });

  const [QRlink_mdl, setQRlink_mdl] = useState(false);
  const [QRimg, setQRimg] = useState({
    "qr": "",
    "url": "",
  });
  
  const [incomplete, setIncomplete] = useState(false);
  const [reinput, setReinput] = useState(false);
  const [reinput_flg, setReinput_flg] = useState(false);

  const user_type_list = [
    { label: "個人", value: "2" },
    { label: "法人", value: "1" },
  ]

  const [disabled_joint_guarantor, setDisabled_joint_guarantor] = useState(false);

  const joint_guarantor_list = [
    { label: "あり", value: "1" },
    { label: "なし", value: "2" },
  ]

  const resident_type_list = [
    { label: "住居用/学生以外", value: "11" },
    { label: "住居用/学生", value: "12" },
    { label: "住居用/駐車場", value: "13" },
    { label: "店舗用", value: "14" },
  ]

  var guarantee_company_list = useMemo(()=>{
    var items = [];
    items.push({ label: "", value: "0" });
    if (!global.fc_flg) {
      items.push({ label: "えるく", value: "1" });
    }
    items.push({ label: "全保連", value: "2" });
    items.push({ label: "日本セーフティー", value: "3" });
    if ((route.options).includes('31')) {
      items.push({ label: "JID", value: "4" });
    }
    return items;
  },[]);

  const erc_type_list = [
    { label: "収納代行型", value: "1" },
    { label: "代位弁済型", value: "2" },
  ]

  const prefecture_list = [
    { label: "", value: "" },
    { label: "北海道", value: "北海道" },
    { label: "青森県", value: "青森県" },
    { label: "岩手県", value: "岩手県" },
    { label: "宮城県", value: "宮城県" },
    { label: "秋田県", value: "秋田県" },
    { label: "山形県", value: "山形県" },
    { label: "福島県", value: "福島県" },
    { label: "茨城県", value: "茨城県" },
    { label: "栃木県", value: "栃木県" },
    { label: "群馬県", value: "群馬県" },
    { label: "埼玉県", value: "埼玉県" },
    { label: "千葉県", value: "千葉県" },
    { label: "東京都", value: "東京都" },
    { label: "神奈川県", value: "神奈川県" },
    { label: "新潟県", value: "新潟県" },
    { label: "富山県", value: "富山県" },
    { label: "石川県", value: "石川県" },
    { label: "福井県", value: "福井県" },
    { label: "山梨県", value: "山梨県" },
    { label: "長野県", value: "長野県" },
    { label: "岐阜県", value: "岐阜県" },
    { label: "静岡県", value: "静岡県" },
    { label: "愛知県", value: "愛知県" },
    { label: "三重県", value: "三重県" },
    { label: "滋賀県", value: "滋賀県" },
    { label: "京都府", value: "京都府" },
    { label: "大阪府", value: "大阪府" },
    { label: "兵庫県", value: "兵庫県" },
    { label: "奈良県", value: "奈良県" },
    { label: "和歌山県", value: "和歌山県" },
    { label: "鳥取県", value: "鳥取県" },
    { label: "島根県", value: "島根県" },
    { label: "岡山県", value: "岡山県" },
    { label: "広島県", value: "広島県" },
    { label: "山口県", value: "山口県" },
    { label: "徳島県", value: "徳島県" },
    { label: "香川県", value: "香川県" },
    { label: "愛媛県", value: "愛媛県" },
    { label: "高知県", value: "高知県" },
    { label: "福岡県", value: "福岡県" },
    { label: "佐賀県", value: "佐賀県" },
    { label: "長崎県", value: "長崎県" },
    { label: "熊本県", value: "熊本県" },
    { label: "大分県", value: "大分県" },
    { label: "宮崎県", value: "宮崎県" },
    { label: "鹿児島県", value: "鹿児島県" },
    { label: "沖縄県", value: "沖縄県" }
  ]
  
  const [show, setShow] = useState(false);

  const initial_cost_type = [
    { label: "敷金・礼金", value: "1" },
    { label: "保証金・敷引", value: "2" },
  ]
  // ----- 物件情報 END -----

  // ----- 申込情報 START -----
  const [company_input, setCompany_Input] = useState({
    "company_address_building": "",
    "company_address_city": "",
    "company_address_number": "",
    "company_address_prefecture": "",
    "company_address_room": "",
    "company_annual_sales": "",
    "company_business": "",
    "company_capital": "",
    "company_employee": "",
    "company_establishment": "",
    "company_kana": "",
    "company_name": "",
    "company_tel": "",
    "company_zipcode": "",
    "contact_address_building": "",
    "contact_address_city": "",
    "contact_address_number": "",
    "contact_address_prefecture": "",
    "contact_address_room": "",
    "contact_annual_income": "",
    "contact_birthday": "",
    "contact_family_kana": "",
    "contact_family_name": "",
    "contact_first_kana": "",
    "contact_first_name": "",
    "contact_gender": "",
    "contact_mobile": "",
    "contact_relationship": "",
    "contact_relationship_type": "",
    "contact_residential_type": "",
    "contact_tel": "",
    "contact_workplace": "",
    "contact_zipcode": "",
    "customer_id": "",
    "guarantor_address_building": "",
    "guarantor_address_city": "",
    "guarantor_address_number": "",
    "guarantor_address_prefecture": "",
    "guarantor_address_room": "",
    "guarantor_annual_income": "",
    "guarantor_belongs_building": "",
    "guarantor_belongs_city": "",
    "guarantor_belongs_kana": "",
    "guarantor_belongs_name": "",
    "guarantor_belongs_number": "",
    "guarantor_belongs_period": "",
    "guarantor_belongs_prefecture": "",
    "guarantor_belongs_room": "",
    "guarantor_belongs_tel": "",
    "guarantor_belongs_zipcode": "",
    "guarantor_birthday": "",
    "guarantor_department": "",
    "guarantor_domicile": "",
    "guarantor_employment": "",
    "guarantor_family_kana": "",
    "guarantor_family_name": "",
    "guarantor_first_kana": "",
    "guarantor_first_name": "",
    "guarantor_gender": "",
    "guarantor_industry": "",
    "guarantor_mobile": "",
    "guarantor_monthly_income": "",
    "guarantor_occupation": "",
    "guarantor_position": "",
    "guarantor_relationship": "",
    "guarantor_relationship_type": "",
    "guarantor_residential_type": "",
    "guarantor_residential_type_text": "",
    "guarantor_tel": "",
    "guarantor_workplace": "",
    "guarantor_zipcode": "",
    "ins_dt": "",
    "representative_address_building": "",
    "representative_address_city": "",
    "representative_address_number": "",
    "representative_address_prefecture": "",
    "representative_address_room": "",
    "representative_birthday": "",
    "representative_family_kana": "",
    "representative_family_name": "",
    "representative_first_kana": "",
    "representative_first_name": "",
    "representative_gender": "",
    "representative_tel": "",
    "representative_zipcode": "",
    "staff_application_reason": "",
    "staff_department": "",
    "staff_division": "",
    "staff_family_name": "",
    "staff_first_name": "",
    "staff_tel": "",
    "upd_dt": ""
  });

  const [person_input, setPerson_Input] = useState({
    "contact_address_building": "",
    "contact_address_city": "",
    "contact_address_number": "",
    "contact_address_prefecture": "",
    "contact_address_room": "",
    "contact_annual_income": "",
    "contact_birthday": "",
    "contact_family_kana": "",
    "contact_family_name": "",
    "contact_first_kana": "",
    "contact_first_name": "",
    "contact_gender": "",
    "contact_mobile": "",
    "contact_relationship": "",
    "contact_relationship_type": "",
    "contact_residential_type": "",
    "contact_tel": "",
    "contact_workplace": "",
    "contact_zipcode": "",
    "customer_id": "",
    "guarantor_address_building": "",
    "guarantor_address_city": "",
    "guarantor_address_number": "",
    "guarantor_address_prefecture": "",
    "guarantor_address_room": "",
    "guarantor_annual_income": "",
    "guarantor_belongs_building": "",
    "guarantor_belongs_city": "",
    "guarantor_belongs_name": "",
    "guarantor_belongs_number": "",
    "guarantor_belongs_period": "",
    "guarantor_belongs_prefecture": "",
    "guarantor_belongs_room": "",
    "guarantor_belongs_tel": "",
    "guarantor_belongs_zipcode": "",
    "guarantor_birthday": "",
    "guarantor_employment": "",
    "guarantor_family_kana": "",
    "guarantor_family_name": "",
    "guarantor_first_kana": "",
    "guarantor_first_name": "",
    "guarantor_gender": "",
    "guarantor_industry": "",
    "guarantor_mobile": "",
    "guarantor_monthly_income": "",
    "guarantor_nationality": "",
    "guarantor_occupation": "",
    "guarantor_relationship": "",
    "guarantor_relationship_type": "",
    "guarantor_residential_type": "",
    "guarantor_residential_type_text": "",
    "guarantor_tel": "",
    "guarantor_workplace": "",
    "guarantor_zipcode": "",
    "ins_dt": "",
    "person_address_building": "",
    "person_address_city": "",
    "person_address_number": "",
    "person_address_prefecture": "",
    "person_address_room": "",
    "person_annual_income": "",
    "person_belongs_building": "",
    "person_belongs_city": "",
    "person_belongs_name": "",
    "person_belongs_number": "",
    "person_belongs_period": "",
    "person_belongs_prefecture": "",
    "person_belongs_room": "",
    "person_belongs_tel": "",
    "person_belongs_zipcode": "",
    "person_bicycle_units": "",
    "person_bike_cc": "",
    "person_bike_units": "",
    "person_birthday": "",
    "person_car_model": "",
    "person_employment": "",
    "person_family_kana": "",
    "person_family_name": "",
    "person_first_kana": "",
    "person_first_name": "",
    "person_gender": "",
    "person_health_insurance": "",
    "person_industry": "",
    "person_japanese_qualification": "",
    "person_mobile": "",
    "person_monthly_income": "",
    "person_move_in_reason": "",
    "person_nationality": "",
    "person_occupation": "",
    "person_residence_status": "",
    "person_residential_type": "",
    "person_residential_type_text": "",
    "person_resident_total1": "",
    "person_resident_total2": "",
    "person_spouse": "",
    "person_stay_period": "",
    "person_tel": "",
    "person_workplace": "",
    "person_zipcode": "",
    "upd_dt": ""
  });

  const [resident, setResident] = useState([]);

  const [company_err, setCompany_Err] = useState({
    "company_name": "",
    "company_kana": "",
    "company_zipcode": "",
    "company_address_prefecture": "",
    "company_address_city": "",
    "company_address_number": "",
    "company_tel": "",
    "representative_family_name": "",
    "representative_first_name": "",
    "representative_family_kana": "",
    "representative_first_kana": "",
    "representative_tel": "",
    "representative_zipcode": "",
    "staff_tel": "",
  });

  const [person_err, setPerson_Err] = useState({
    "person_family_name": "",
    "person_first_name": "",
    "person_family_kana": "",
    "person_first_kana": "",
    "person_gender": "",
    "person_birthday": "",
    "person_tel": "",
    "person_mobile": "",
    "person_zipcode": "",
    "person_address_prefecture": "",
    "person_address_city": "",
    "person_address_number": "",
    "person_workplace": "",
    "person_belongs_name": "",
    "person_belongs_zipcode": "",
    "person_belongs_prefecture": "",
    "person_belongs_city": "",
    "person_belongs_number": "",
    "person_annual_income": "",
  });

  const [resident_err, setResident_Err] = useState([
    {
      "resident_family_kana": "",
      "resident_family_name": "",
      "resident_first_kana": "",
      "resident_first_name": "",
      "resident_mobile": "",
      "resident_belongs_zipcode": "",
      "resident_belongs_tel": "",
    },
    {
      "resident_family_kana": "",
      "resident_family_name": "",
      "resident_first_kana": "",
      "resident_first_name": "",
      "resident_mobile": "",
      "resident_belongs_zipcode": "",
      "resident_belongs_tel": "",
    },
    {
      "resident_family_kana": "",
      "resident_family_name": "",
      "resident_first_kana": "",
      "resident_first_name": "",
      "resident_mobile": "",
      "resident_belongs_zipcode": "",
      "resident_belongs_tel": "",
    },
    {
      "resident_family_kana": "",
      "resident_family_name": "",
      "resident_first_kana": "",
      "resident_first_name": "",
      "resident_mobile": "",
      "resident_belongs_zipcode": "",
      "resident_belongs_tel": "",
    },
  ]);

  const [image, setImage] = useState([]);

  const [filedata1,setFiledata1] = useState(null);
  const [filedata2,setFiledata2] = useState(null);
  
  const [img_mdl, setImg_mdl] = useState(false);
  const [img, setImg] = useState("");
  const [img_size, setImg_size] = useState({width:Width,height:Width});

  const [disabled_flg, setDisabled_flg] = useState(false);

  const company_employee = [
    { label: "", value: "" },
    { label: "10人未満", value: "1" },
    { label: "30人未満", value: "2" },
    { label: "100人未満", value: "3" },
    { label: "1000人未満", value: "4" },
    { label: "1000人以上", value: "5" }
  ];

  const company_business = [
    { label: "", value: "" },
    { label: "製造業", value: "1" },
    { label: "金融・証券・保険", value: "2" },
    { label: "農林水産業", value: "3" },
    { label: "建設業", value: "4" },
    { label: "卸売・小売・貿易", value: "5" },
    { label: "不動産", value: "6" },
    { label: "運輸・運送", value: "7" },
    { label: "サービス", value: "8" },
    { label: "設備工事業", value: "9" },
    { label: "医療", value: "10" },
    { label: "公務員", value: "11" },
    { label: "飲食業", value: "12" },
    { label: "遊興飲食業", value: "13" },
    { label: "情報通信", value: "14" },
    { label: "教育", value: "15" },
    { label: "福祉・介護", value: "16" },
    { label: "各種団体", value: "17" },
    { label: "未分類", value: "88" }
  ];

  const staff_application_reason1 = [
    { label: "", value: "" },
    { label: "就職・入学", value: "1" },
    { label: "結婚・同棲", value: "2" },
    { label: "転勤・転職", value: "3" },
    { label: "別居・離婚", value: "4" },
    { label: "セカンドルーム", value: "5" },
    { label: "生保受給・申請", value: "6" },
    { label: "その他", value: "9" },
  ];

  const staff_application_reason2 = [
    { label: "", value: "" },
    { label: "新規", value: "1" },
    { label: "増店", value: "2" },
    { label: "移転", value: "3" }
  ];

  const gender_list = [
    { label: "男性", value: "1" },
    { label: "女性", value: "2" },
  ]

  const person_health_insurance  = [
    { label: "社会保険", value: "1" },
    { label: "国民保険", value: "2" },
    { label: "なし", value: "9" },
  ]
  
  // 0:設立年月日 1:生年月日(会社代表者) ==> 法人
  // 2:生年月日 ==> 個人
  // 3:生年月日(入居者) 4:生年月日(連帯保証人) ==> 共通
  const [mode, setMode] = useState(0);
  const [date_index, setDate_index] = useState(0);


  const person_nationality = [
    { label: "日本", value: "1" },
    { label: "日本以外", value: "2" },
  ]

  const spouse_list = [
    { label: "あり", value: "1" },
    { label: "なし", value: "2" },
  ]

  const residential_type = [
    { label: "", value: "" },
    { label: "自己所有", value: "1" },
    { label: "家族所有", value: "2" },
    { label: "借家", value: "3" },
    { label: "アパート", value: "4" },
    { label: "マンション(賃貸)", value: "5" },
    { label: "公団住宅", value: "6" },
    { label: "社宅・官舎", value: "7" },
    { label: "寮", value: "8" },
    { label: "その他(住込・間貸等)", value: "9" }
  ];

  const [person_bike_units_radio, setPerson_bike_units_radio] = useState(0);
  const [person_bicycle_units_radio, setPerson_bicycle_units_radio] = useState(0);
  const person_bi_list = [
    { label: "あり", value: "1" },
    { label: "なし", value: "2" },
  ]

  const person_move_in_reason = [
    { label: "", value: "" },
    { label: "就職・入学", value: "1" },
    { label: "結婚・同棲", value: "2" },
    { label: "転勤・転職", value: "3" },
    { label: "別居・離婚", value: "4" },
    { label: "セカンドルーム", value: "5" },
    { label: "生保受給・申請", value: "6" },
    { label: "その他", value: "9" }
  ];

  const workplace_list = [
    { label: "", value: "" },
    { label: "あり", value: "1" },
    { label: "無職", value: "2" },
    { label: "生活保護", value: "3" },
    { label: "年金", value: "4" }
  ];

  const industry_list = [
    { label: "", value: "" },
    { label: "製造業", value: "1" },
    { label: "金融・証券・保険", value: "2" },
    { label: "農林水産業", value: "3" },
    { label: "建設業", value: "4" },
    { label: "卸売・小売・貿易", value: "5" },
    { label: "不動産", value: "6" },
    { label: "運輸・運送", value: "7" },
    { label: "サービス", value: "8" },
    { label: "設備工事業", value: "9" },
    { label: "医療", value: "10" },
    { label: "公務員", value: "11" },
    { label: "飲食業", value: "12" },
    { label: "遊興飲食業", value: "13" },
    { label: "情報通信業", value: "14" },
    { label: "教育", value: "15" },
    { label: "福祉・介護", value: "16" },
    { label: "各種団体", value: "17" },
    { label: "未分類", value: "88" }
  ];

  const employment_list = [
    { label: "", value: "" },
    { label: "正社員", value: "1" },
    { label: "派遣・契約社員", value: "2" },
    { label: "公務員", value: "3" },
    { label: "自営業", value: "4" },
    { label: "パート・アルバイト", value: "5" },
    { label: "水商売（風俗含）", value: "6" },
    { label: "会社役員", value: "7" },
    { label: "学生", value: "8" },
    { label: "年金", value: "9" },
    { label: "福祉受給", value: "10" },
    { label: "無職", value: "11" },
    { label: "その他", value: "12" },
    { label: "不明・未記入", value: "99" }
  ];

  const relationship_list = [
    { label: "", value: "" },
    { label: "本人", value: "" },
    { label: "父", value: "1" },
    { label: "母", value: "1" },
    { label: "義父", value: "2" },
    { label: "義母", value: "2" },
    { label: "配偶者", value: "3" },
    { label: "兄弟", value: "4" },
    { label: "姉妹", value: "4" },
    { label: "子(義含)", value: "5" },
    { label: "その他親族", value: "6" },
    { label: "友人・知人", value: "7" },
    { label: "会社関係", value: "8" },
    { label: "その他", value: "9" },
    { label: "不明・未記入", value: "99" }
  ];
  // ----- 申込情報 END -----

  useEffect(() => {
    
    navigation.setOptions({
      headerStyle: !global.fc_flg?{ backgroundColor: '#6C9BCF', height: 110}:{ backgroundColor: '#FF8F8F', height: 110},
      headerTitle:() => (<Text style={styles.header_title}>入居申込書作成</Text>),
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
                previous:'ErcMoveIn',
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
            previous:'ErcMoveIn',
            withAnimation2: true
          }],
        });
      }
    );
    
    return () => backHandler.remove();
  }, []);
  
  useEffect(() => {

    console.log('-----------------------------------------')

    Display();
    
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

  async function Display() {
    
    setLoading(true);

    const json = await getErcData();

    // ログアウトしてたら中断
    if(!global.sp_token && !global.sp_id) {
      setLoading(false);
      return;
    }

    if (json != false) {

      const QRimg_data = await getQRCode();
      if (QRimg_data) {
        setQRimg(QRimg_data);
      }

      const MI = json.data;
      if (MI != false) {
        setIncomplete(MI.save_flg=="1"?true:false);
        setReinput(MI.agree_timestamp?true:false);
        setMove_in({
          "address_building": MI.address_building,
          "address_city": MI.address_city,
          "address_kana": MI.address_kana,
          "address_number": MI.address_number,
          "address_prefecture": MI.address_prefecture,
          "agree_timestamp": MI.agree_timestamp,
          "article_kana": MI.article_kana,
          "article_name": MI.article_name,
          "bicycle_parking_fee": MI.bicycle_parking_fee,
          "bike_parking_fee": MI.bike_parking_fee,
          "brokerage_shop_id": MI.brokerage_shop_id,
          "check_flg": MI.check_flg=="1"?true:false,
          "customer_id": MI.customer_id,
          "del_flg": MI.del_flg,
          "deposit": MI.deposit,
          "erc_send_flg": MI.erc_send_flg,
          "erc_type": Number(MI.erc_type),
          "guarantee_company": MI.guarantee_company,
          "initial_cost_type": MI.initial_cost_type,
          "ins_dt": MI.ins_dt,
          "joint_guarantor": Number(MI.joint_guarantor),
          "management_fee": MI.management_fee,
          "move_in_date": MI.move_in_date&&MI.move_in_date!="0000-00-00"?new Date(MI.move_in_date):"",
          "other_fee": MI.other_fee,
          "other_fee2": MI.other_fee2,
          "other_item": MI.other_item,
          "other_item2": MI.other_item2,
          "parking_fee": MI.parking_fee,
          "parking_no": MI.parking_no,
          "rent": MI.rent,
          "resident_type": MI.resident_type,
          "reward": MI.reward,
          "room_no": MI.room_no,
          "save_flg": MI.save_flg,
          "town_fee": MI.town_fee,
          "upd_dt": MI.upd_dt,
          "user_type": Number(MI.user_type),
          "water_fee": MI.water_fee,
          "zipcode": MI.zipcode
        });
      }

      const SP = json.shop;
      setShop({
        "brokerage_shop_code": SP.brokerage_shop_code,
        "corporations_name": SP.corporations_name,
        "name": SP.name,
        "shop_id": SP.shop_id,
      });

      const IP = json.input;
      if (!Array.isArray(IP)) {
        if (IP.customer_id) {
          setDisabled_flg(true);
          setDisabled_joint_guarantor(true);
        }
        if (MI.user_type == "1") {
          setCompany_Input({
            "company_address_building": IP.company_address_building,
            "company_address_city": IP.company_address_city,
            "company_address_number": IP.company_address_number,
            "company_address_prefecture": IP.company_address_prefecture,
            "company_address_room": IP.company_address_room,
            "company_annual_sales": IP.company_annual_sales,
            "company_business": IP.company_business,
            "company_capital": IP.company_capital,
            "company_employee": IP.company_employee,
            "company_establishment": IP.company_establishment&&IP.company_establishment!="0000-00-00"?new Date(IP.company_establishment):"",
            "company_kana": IP.company_kana,
            "company_name": IP.company_name,
            "company_tel": IP.company_tel,
            "company_zipcode": IP.company_zipcode,
            "contact_address_building": IP.contact_address_building,
            "contact_address_city": IP.contact_address_city,
            "contact_address_number": IP.contact_address_number,
            "contact_address_prefecture": IP.contact_address_prefecture,
            "contact_address_room": IP.contact_address_room,
            "contact_annual_income": String(Number(IP.contact_annual_income)/10000),
            "contact_birthday": IP.contact_birthday,
            "contact_family_kana": IP.contact_family_kana,
            "contact_family_name": IP.contact_family_name,
            "contact_first_kana": IP.contact_first_kana,
            "contact_first_name": IP.contact_first_name,
            "contact_gender": IP.contact_gender,
            "contact_mobile": IP.contact_mobile,
            "contact_relationship": IP.contact_relationship,
            "contact_relationship_type": IP.contact_relationship_type,
            "contact_residential_type": IP.contact_residential_type,
            "contact_tel": IP.contact_tel,
            "contact_workplace": IP.contact_workplace,
            "contact_zipcode": IP.contact_zipcode,
            "customer_id": IP.customer_id,
            "guarantor_address_building": IP.guarantor_address_building,
            "guarantor_address_city": IP.guarantor_address_city,
            "guarantor_address_number": IP.guarantor_address_number,
            "guarantor_address_prefecture": IP.guarantor_address_prefecture,
            "guarantor_address_room": IP.guarantor_address_room,
            "guarantor_annual_income": String(Number(IP.guarantor_annual_income)/10000),
            "guarantor_belongs_building": IP.guarantor_belongs_building,
            "guarantor_belongs_city": IP.guarantor_belongs_city,
            "guarantor_belongs_kana": IP.guarantor_belongs_kana,
            "guarantor_belongs_name": IP.guarantor_belongs_name,
            "guarantor_belongs_number": IP.guarantor_belongs_number,
            "guarantor_belongs_period": IP.guarantor_belongs_period,
            "guarantor_belongs_prefecture": IP.guarantor_belongs_prefecture,
            "guarantor_belongs_room": IP.guarantor_belongs_room,
            "guarantor_belongs_tel": IP.guarantor_belongs_tel,
            "guarantor_belongs_zipcode": IP.guarantor_belongs_zipcode,
            "guarantor_birthday": IP.guarantor_birthday&&IP.guarantor_birthday!="0000-00-00"?new Date(IP.guarantor_birthday):"",
            "guarantor_department": IP.guarantor_department,
            "guarantor_domicile": IP.guarantor_domicile,
            "guarantor_employment": IP.guarantor_employment,
            "guarantor_family_kana": IP.guarantor_family_kana,
            "guarantor_family_name": IP.guarantor_family_name,
            "guarantor_first_kana": IP.guarantor_first_kana,
            "guarantor_first_name": IP.guarantor_first_name,
            "guarantor_gender": IP.guarantor_gender,
            "guarantor_industry": IP.guarantor_industry,
            "guarantor_mobile": IP.guarantor_mobile,
            "guarantor_monthly_income": String(Number(IP.guarantor_monthly_income)/10000),
            "guarantor_occupation": IP.guarantor_occupation,
            "guarantor_position": IP.guarantor_position,
            "guarantor_relationship": IP.guarantor_relationship,
            "guarantor_relationship_type": IP.guarantor_relationship_type,
            "guarantor_residential_type": IP.guarantor_residential_type,
            "guarantor_residential_type_text": IP.guarantor_residential_type_text,
            "guarantor_tel": IP.guarantor_tel,
            "guarantor_workplace": IP.guarantor_workplace,
            "guarantor_zipcode": IP.guarantor_zipcode,
            "ins_dt": IP.ins_dt,
            "representative_address_building": IP.representative_address_building,
            "representative_address_city": IP.representative_address_city,
            "representative_address_number": IP.representative_address_number,
            "representative_address_prefecture": IP.representative_address_prefecture,
            "representative_address_room": IP.representative_address_room,
            "representative_birthday": IP.representative_birthday&&IP.representative_birthday!="0000-00-00"?new Date(IP.representative_birthday):"",
            "representative_family_kana": IP.representative_family_kana,
            "representative_family_name": IP.representative_family_name,
            "representative_first_kana": IP.representative_first_kana,
            "representative_first_name": IP.representative_first_name,
            "representative_gender": IP.representative_gender,
            "representative_tel": IP.representative_tel,
            "representative_zipcode": IP.representative_zipcode,
            "staff_application_reason": IP.staff_application_reason,
            "staff_department": IP.staff_department,
            "staff_division": IP.staff_division,
            "staff_family_name": IP.staff_family_name,
            "staff_first_name": IP.staff_first_name,
            "staff_tel": IP.staff_tel,
            "upd_dt": IP.upd_dt
          });
        } else if (MI.user_type == "2") {
          setPerson_Input({
            "contact_address_building": IP.contact_address_building,
            "contact_address_city": IP.contact_address_city,
            "contact_address_number": IP.contact_address_number,
            "contact_address_prefecture": IP.contact_address_prefecture,
            "contact_address_room": IP.contact_address_room,
            "contact_annual_income": String(Number(IP.contact_annual_income)/10000),
            "contact_birthday": IP.contact_birthday&&IP.contact_birthday!="0000-00-00"?new Date(IP.contact_birthday):"",
            "contact_family_kana": IP.contact_family_kana,
            "contact_family_name": IP.contact_family_name,
            "contact_first_kana": IP.contact_first_kana,
            "contact_first_name": IP.contact_first_name,
            "contact_gender": IP.contact_gender,
            "contact_mobile": IP.contact_mobile,
            "contact_relationship": IP.contact_relationship,
            "contact_relationship_type": IP.contact_relationship_type,
            "contact_residential_type": IP.contact_residential_type,
            "contact_tel": IP.contact_tel,
            "contact_workplace": IP.contact_workplace,
            "contact_zipcode": IP.contact_zipcode,
            "customer_id": IP.customer_id,
            "guarantor_address_building": IP.guarantor_address_building,
            "guarantor_address_city": IP.guarantor_address_city,
            "guarantor_address_number": IP.guarantor_address_number,
            "guarantor_address_prefecture": IP.guarantor_address_prefecture,
            "guarantor_address_room": IP.guarantor_address_room,
            "guarantor_annual_income": String(Number(IP.guarantor_annual_income)/10000),
            "guarantor_belongs_building": IP.guarantor_belongs_building,
            "guarantor_belongs_city": IP.guarantor_belongs_city,
            "guarantor_belongs_name": IP.guarantor_belongs_name,
            "guarantor_belongs_number": IP.guarantor_belongs_number,
            "guarantor_belongs_period": IP.guarantor_belongs_period,
            "guarantor_belongs_prefecture": IP.guarantor_belongs_prefecture,
            "guarantor_belongs_room": IP.guarantor_belongs_room,
            "guarantor_belongs_tel": IP.guarantor_belongs_tel,
            "guarantor_belongs_zipcode": IP.guarantor_belongs_zipcode,
            "guarantor_birthday": IP.guarantor_birthday&&IP.guarantor_birthday!="0000-00-00"?new Date(IP.guarantor_birthday):"",
            "guarantor_employment": IP.guarantor_employment,
            "guarantor_family_kana": IP.guarantor_family_kana,
            "guarantor_family_name": IP.guarantor_family_name,
            "guarantor_first_kana": IP.guarantor_first_kana,
            "guarantor_first_name": IP.guarantor_first_name,
            "guarantor_gender": IP.guarantor_gender,
            "guarantor_industry": IP.guarantor_industry,
            "guarantor_mobile": IP.guarantor_mobile,
            "guarantor_monthly_income": String(Number(IP.guarantor_monthly_income)/10000),
            "guarantor_nationality": IP.guarantor_nationality,
            "guarantor_occupation": IP.guarantor_occupation,
            "guarantor_relationship": IP.guarantor_relationship,
            "guarantor_relationship_type": IP.guarantor_relationship_type,
            "guarantor_residential_type": IP.guarantor_residential_type,
            "guarantor_residential_type_text": IP.guarantor_residential_type_text,
            "guarantor_tel": IP.guarantor_tel,
            "guarantor_workplace": IP.guarantor_workplace,
            "guarantor_zipcode": IP.guarantor_zipcode,
            "ins_dt": IP.ins_dt,
            "person_address_building": IP.person_address_building,
            "person_address_city": IP.person_address_city,
            "person_address_number": IP.person_address_number,
            "person_address_prefecture": IP.person_address_prefecture,
            "person_address_room": IP.person_address_room,
            "person_annual_income": String(Number(IP.person_annual_income)/10000),
            "person_belongs_building": IP.person_belongs_building,
            "person_belongs_city": IP.person_belongs_city,
            "person_belongs_name": IP.person_belongs_name,
            "person_belongs_number": IP.person_belongs_number,
            "person_belongs_period": IP.person_belongs_period,
            "person_belongs_prefecture": IP.person_belongs_prefecture,
            "person_belongs_room": IP.person_belongs_room,
            "person_belongs_tel": IP.person_belongs_tel,
            "person_belongs_zipcode": IP.person_belongs_zipcode,
            "person_bicycle_units": IP.person_bicycle_units,
            "person_bike_cc": IP.person_bike_cc,
            "person_bike_units": IP.person_bike_units,
            "person_birthday": IP.person_birthday&&IP.person_birthday!="0000-00-00"?new Date(IP.person_birthday):"",
            "person_car_model": IP.person_car_model,
            "person_employment": IP.person_employment,
            "person_family_kana": IP.person_family_kana,
            "person_family_name": IP.person_family_name,
            "person_first_kana": IP.person_first_kana,
            "person_first_name": IP.person_first_name,
            "person_gender": IP.person_gender,
            "person_health_insurance": IP.person_health_insurance,
            "person_industry": IP.person_industry,
            "person_japanese_qualification": IP.person_japanese_qualification,
            "person_mobile": IP.person_mobile,
            "person_monthly_income": String(Number(IP.person_monthly_income)/10000),
            "person_move_in_reason": IP.person_move_in_reason,
            "person_nationality": IP.person_nationality?IP.person_nationality:1,
            "person_occupation": IP.person_occupation,
            "person_residence_status": IP.person_residence_status,
            "person_residential_type": IP.person_residential_type,
            "person_residential_type_text": IP.person_residential_type_text,
            "person_resident_total1": IP.person_resident_total1?IP.person_resident_total1:"",
            "person_resident_total2": IP.person_resident_total2?IP.person_resident_total2:"",
            "person_spouse": IP.person_spouse,
            "person_stay_period": IP.person_stay_period,
            "person_tel": IP.person_tel,
            "person_workplace": IP.person_workplace,
            "person_zipcode": IP.person_zipcode,
            "upd_dt": IP.upd_dt
          });
          setPerson_bike_units_radio(IP.person_bike_units>0?1:2);
          setPerson_bicycle_units_radio(IP.person_bicycle_units>0?1:2);
        }
      }
      
      const RD = json.resident;
      if (RD != false) {
        if (RD.length > 1) {
          const newRD = RD.map((val) =>{
            val["resident_annual_income"] = String(Number(val.resident_annual_income)/10000)
            val["resident_birthday"] = val.resident_birthday&&val.resident_birthday!="0000-00-00"?new Date(val.resident_birthday):"";
            return val;
          })
          setResident(newRD);
        } else {
          setResident([RD]);
        }

      }

      const IM = json.image;
      if (IM.length > 0) {
        setImage(IM);
      }

      setLoading(false);
    } else {
      setLoading(false);
    }
  }

  // ----- fetch通信 START -----
  const getErcData = useCallback(() => {
    
    let formData = new FormData();
    formData.append('shop_id',route.params.shop_id);
    formData.append('customer_id',route.customer);
    formData.append('act', "getErcData");
    formData.append('app_flg', "1");

    return new Promise((resolve, reject)=>{
      fetch(domain+'php/ajax/erc_move_in.php',
      {
        method: 'POST',
        body: formData,
        header: {
          'content-type': 'multipart/form-data',
        },
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

  const getQRCode = useCallback(() => {
    
    let formData = new FormData();
    formData.append('shop_id',route.params.shop_id);
    formData.append('customer_id',route.customer);
    formData.append('act', "getQRCode");

    return new Promise((resolve, reject)=>{
      fetch(domain+'php/ajax/erc_move_in.php',
      {
        method: 'POST',
        body: formData,
        header: {
          'content-type': 'multipart/form-data',
        },
      })
      .then((response) => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        resolve(false);
      });
    })

  });

  const getErcDataAddress = useCallback((flg,data) => {
    
    let formData = new FormData();

    if (flg == "zip") {
      formData.append('act', "searchAddress");
      formData.append('zipcode', data);
    } else if (flg == "add") {
      formData.append('act', "searchZipcode");
      formData.append('address', data);
    }

    return new Promise((resolve, reject)=>{
      fetch(domain+'erc/php/ajax/user_form.php',
      {
        method: 'POST',
        body: formData,
        header: {
          'content-type': 'multipart/form-data',
        },
      })
      .then((response) => response.json())
      .then((json) => {
        resolve(json);
      })
      .catch((error) => {
        resolve(false);
      });
    })

  });

  const setErcMoveInFetch = useCallback((act) => {
    
    let formData = new FormData();
    formData.append('customer_id',route.customer);
    formData.append('act', act);
    formData.append('app_flg', "1");

    if (act == "setCheckData") {
      let check = !move_in.check_flg ? 1 : 0;
      formData.append('check', check);
    }

    return new Promise((resolve, reject)=>{
      fetch(domain+'php/ajax/erc_move_in.php',
      {
        method: 'POST',
        body: formData,
        header: {
          'content-type': 'multipart/form-data',
        },
      })
      .then((response) => response.json())
      .then((json) => {
        resolve(true);
      })
      .catch((error) => {
        resolve(false);
      });
    })

  });
  // ----- fetch通信 END -----

  // ----- 入力内容 START -----
  // 物件情報
  const Move_inList = useMemo(() => {
    return (
      <>
        <View style={styles.input}>
          <Text style={styles.label}>物件名<Text style={styles.required}> ※</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, article_name: text }));
            }}
            value={move_in.article_name}
            style={[styles.inputInner,move_in_err.article_name]}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>物件名 フリガナ<Text style={styles.required}> ※</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, article_kana: text }));
            }}
            value={move_in.article_kana}
            style={[styles.inputInner,move_in_err.article_kana]}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>号室<Text style={styles.required}> ※</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, room_no: text }));
            }}
            value={move_in.room_no}
            style={[styles.inputInner,move_in_err.room_no]}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>物件住所[郵便番号]<Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></Text>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, article: 1 }));
                setMove_in(state => ({ ...state, zipcode: text }));
              }}
              value={move_in.zipcode}
              style={[styles.inputInner,{width:"55%"},move_in_err.zipcode]}
              placeholder="郵便番号 ハイフンあり"
              placeholderTextColor="#b3b3b3"
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
            />
            <TouchableOpacity
              onPress={async()=>{
                const GA = await GetAddress("zip",move_in.zipcode);
                if (GA) {
                  setChange_flg(state => ({ ...state, article: 1 }));
                  setMove_in(state => ({ ...state, address_prefecture: GA.prefecture }));
                  setMove_in(state => ({ ...state, address_city: GA.address }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>物件住所[都道府県]<Text style={styles.required}> ※</Text></Text>
          <View style={{flexDirection:'row'}}>
            <Dropdown
              style={[styles.DropDown,{width:"55%"},move_in_err.address_prefecture]}
              containerStyle={styles.dropDownContainer}
              placeholderStyle={{fontSize:14}}
              selectedTextStyle={{fontSize:14}}
              itemTextStyle={{fontSize:14}}
              renderItem={(item)=>(
                <View style={styles.dropItem}>
                  <Text style={styles.dropItemText}>{item.label}</Text>
                </View>
              )}
              value={move_in.address_prefecture}
              data={prefecture_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, article: 1 }));
                setMove_in(state => ({ ...state, address_prefecture: item.value }));
              }}
              labelField="label"
              valueField="value"
            />
            <TouchableOpacity
              onPress={async()=>{
                let address = move_in.address_prefecture + move_in.address_city;
                const GA = await GetAddress("add",address);
                if (GA) {
                  setChange_flg(state => ({ ...state, article: 1 }));
                  setMove_in(state => ({ ...state, zipcode: GA[0].zipcode }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>住所から検索</Text>
            </TouchableOpacity>
            </View>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>物件住所[市区町村]<Text style={styles.required}> ※</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, address_city: text }));
            }}
            value={move_in.address_city}
            style={[styles.inputInner,move_in_err.address_city]}
            placeholder="市区町村"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>物件住所[丁目・番地・建物名]<Text style={styles.required}> ※</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, address_number: text }));
            }}
            value={move_in.address_number}
            style={[styles.inputInner,move_in_err.address_number]}
            placeholder="丁目・番地・建物名"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>物件住所[フリガナ]<Text style={styles.required}> ※</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, address_kana: text }));
            }}
            value={move_in.address_kana}
            style={[styles.inputInner,move_in_err.address_kana]}
            placeholder="フリガナ"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>入居希望日</Text>
          <TouchableOpacity
            style={[styles.inputInner,{width:"48%",flexDirection:'row'}]}
            onPress={()=>{setShow(true)}}
          >
            <Text style={{alignSelf:'center'}}>{move_in.move_in_date&&move_in.move_in_date!="0000-00-00"?Moment(move_in.move_in_date).format("YYYY-MM-DD"):""}</Text>
            <TouchableOpacity
              style={{alignSelf:'center',marginLeft:'auto'}}
              onPress={()=>{
                setChange_flg(state => ({ ...state, article: 1 }));
                setMove_in(state => ({ ...state, move_in_date: "" }));
              }}
            >
              <Feather name='x-circle' color='#ccc' size={25} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
        {(show && Platform.OS === 'android') && (
          <DateTimePicker
            value={
              mode==0?(move_in.move_in_date&&move_in.move_in_date!="0000-00-00"?move_in.move_in_date:new Date()):
              new Date()
            }
            mode={"date"}
            display="default"
            locale={'ja'}
            onChange={(event, selectedDate) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              const currentDate = selectedDate || move_in.move_in_date;
              setMove_in(state => ({ ...state, move_in_date: currentDate }));
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
                  mode==0?(move_in.move_in_date&&move_in.move_in_date!="0000-00-00"?move_in.move_in_date:new Date()):
                  new Date()
                }
                mode={"date"}
                is24Hour={true}
                display="spinner"
                locale={'ja'}
                onChange={(event, selectedDate) => {
                  setChange_flg(state => ({ ...state, article: 1 }));
                  const currentDate = selectedDate || move_in.move_in_date;
                  setMove_in(state => ({ ...state, move_in_date: currentDate }));
                }}
                textColor="#fff"
              />
            </View>
          </Modal>
        )}
        <View style={styles.input}>
          <Text style={styles.label}>家賃<Text style={styles.required}> ※</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, rent: text }));
            }}
            value={move_in.rent}
            style={[styles.inputInner,move_in_err.rent]}
            placeholder="(例)15000"
            placeholderTextColor="#b3b3b3"
            keyboardType={"numeric"}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>共益費<Text style={styles.required}> ※</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, management_fee: text }));
            }}
            value={move_in.management_fee}
            style={[styles.inputInner,move_in_err.management_fee]}
            placeholder="(例)15000"
            placeholderTextColor="#b3b3b3"
            keyboardType={"numeric"}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>駐輪場代</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, bicycle_parking_fee: text }));
            }}
            value={move_in.bicycle_parking_fee}
            style={[styles.inputInner,move_in_err.bicycle_parking_fee]}
            placeholder="(例)15000"
            keyboardType={"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>町会費</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, town_fee: text }));
            }}
            value={move_in.town_fee}
            style={[styles.inputInner,move_in_err.town_fee]}
            placeholder="(例)15000"
            keyboardType={"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>水道代(定額)</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, water_fee: text }));
            }}
            value={move_in.water_fee}
            style={[styles.inputInner,move_in_err.water_fee]}
            placeholder="(例)15000"
            keyboardType={"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>バイク駐輪代<Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>えるく非連携</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, bike_parking_fee: text }))
            }}
            value={move_in.bike_parking_fee}
            style={[styles.inputInner,move_in_err.bike_parking_fee]}
            placeholder="(例)15000"
            keyboardType={"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>駐車場番号</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, parking_no: text }));
            }}
            value={move_in.parking_no}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>駐車場</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, parking_fee: text }));
            }}
            value={move_in.parking_fee}
            style={[styles.inputInner,move_in_err.parking_fee]}
            placeholder="(例)15000"
            keyboardType={"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>その他1</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, other_item: text }));
            }}
            value={move_in.other_item}
            style={[styles.inputInner,move_in_err.other_item]}
            placeholder="その他1 名目"
            placeholderTextColor="#b3b3b3"
          />
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, other_fee: text }));
            }}
            value={move_in.other_fee}
            style={[styles.inputInner,{marginTop:5},move_in_err.other_fee]}
            placeholder="(例)15000"
            keyboardType={"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>その他2</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, other_item2: text }));
            }}
            value={move_in.other_item2}
            style={[styles.inputInner,move_in_err.other_item2]}
            placeholder="その他2 名目"
            placeholderTextColor="#b3b3b3"
          />
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, other_fee2: text }));
            }}
            value={move_in.other_fee2}
            style={[styles.inputInner,{marginTop:5},move_in_err.other_fee2]}
            placeholder="(例)15000"
            keyboardType={"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>初期費用</Text>
          <RadioButtonRN
            data={initial_cost_type}
            value={move_in.initial_cost_type}
            selectedBtn={(e) => {
              setMove_in(state => ({ ...state, initial_cost_type: e.value }));
            }}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={move_in.initial_cost_type?move_in.initial_cost_type:1}
            boxStyle={[styles.radio_box,{width:130}]}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:14,marginLeft:10}}
            circleSize={11}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>{move_in.initial_cost_type=="2"?"保証金":"敷金"}</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, deposit: text }));
            }}
            value={move_in.deposit}
            style={[styles.inputInner,move_in_err.deposit]}
            placeholder="(例)15000"
            keyboardType={"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>{move_in.initial_cost_type=="2"?"敷引":"礼金"}</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, article: 1 }));
              setMove_in(state => ({ ...state, reward: text }));
            }}
            value={move_in.reward}
            style={[styles.inputInner,move_in_err.reward]}
            placeholder="(例)15000"
            keyboardType={"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={{flexDirection:'row',alignSelf: 'center'}}>
          <TouchableOpacity onPress={()=>{erc_data_create_btn()}} style={styles.submit}>
            <Text style={styles.submitText}>登　録</Text>
          </TouchableOpacity>
        </View>
      </>
    )
  },[move_in,show,mode,move_in_err,change_flg]);

  // 申込情報１：基本情報(法人)
  const CompanyInputList = useMemo(() => {
    return (
      <>
        {(QRimg.qr&&QRimg.url)&&(
          <View style={{alignItems:'center',marginTop:20}}>
            <TouchableOpacity style={{}} activeOpacity={1} onLongPress={() => {QR_dl(QRimg.qr)}}>
              <Image
                style={{width:150,height:150}}
                source={{uri:QRimg.qr}}
              />
            </TouchableOpacity>
            <Text style={{marginTop:5,color:'#999'}}>※長押しで保存できます</Text>
            <TouchableOpacity style={{}} onPress={() => {setQRlink_mdl(true)}}>
              <Text style={styles.qr_link}>{QRimg.url}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.input}>
          {incomplete&&(
            <Text style={styles.incomplete_msg}>◆ 以下の申込情報は一時保存中です ◆</Text>
          )}
          {reinput&&(
            <CheckBox
              checked={reinput_flg}
              onPress={() => setReInput_fetch()}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title={"申込内容の再入力をお客様に許可する\n（一時保存の状態になります）"}
            />
          )}
          <CheckBox
            checked={move_in.check_flg}
            onPress={() => setCheckFlg()}
            containerStyle={styles.checkbox}
            checkedColor={chk}
            size={28}
            iconType="material-community"
            checkedIcon="checkbox-marked"
            uncheckedIcon="checkbox-blank-outline"
            title={"申込内容を確認したらチェックしてください\n（対応が必要なお客様から消えます）"}
          />
        </View>
        <Text style={styles.title}>━━━  基本情報  ━━━</Text>
        <View style={styles.input}>
          <Text style={styles.label}>会社名<Text style={styles.required}> ※</Text></Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, company_name: text }));
              }}
              value={company_input.company_name}
              style={[styles.inputInner,company_err.company_name]}
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>会社名 フリガナ<Text style={styles.required}> ※</Text></Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, company_kana: text }));
              }}
              value={company_input.company_kana}
              style={[styles.inputInner,company_err.company_kana]}
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>物件住所<Text style={styles.required}> ※</Text></Text>
          <View style={{flexDirection:'row'}}><Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></View>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, company_zipcode: text }));
              }}
              value={company_input.company_zipcode}
              style={[styles.inputInner,{width:"55%"},company_err.company_zipcode]}
              placeholder="郵便番号 ハイフンあり"
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholderTextColor="#b3b3b3"
            />
            <TouchableOpacity
              onPress={async()=>{
                const GA = await GetAddress("zip",company_input.company_zipcode);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setCompany_Input(state => ({ ...state, company_address_prefecture: GA.prefecture }));
                  setCompany_Input(state => ({ ...state, company_address_city: GA.address }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.input}>
          <View style={{flexDirection:'row'}}>
            <Dropdown
              style={[styles.DropDown,{width:"55%"},company_err.company_address_prefecture]}
              containerStyle={styles.dropDownContainer}
              placeholderStyle={{fontSize:14}}
              selectedTextStyle={{fontSize:14}}
              itemTextStyle={{fontSize:14}}
              renderItem={(item)=>(
                <View style={styles.dropItem}>
                  <Text style={styles.dropItemText}>{item.label}</Text>
                </View>
              )}
              value={company_input.company_address_prefecture}
              data={prefecture_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, company_address_prefecture: item.value }));
              }}
              labelField="label"
              valueField="value"
              placeholder=""
            />
            <TouchableOpacity
              onPress={async()=>{
                let address = company_input.company_address_prefecture + company_input.company_address_city;
                const GA = await GetAddress("add",address);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setCompany_Input(state => ({ ...state, company_zipcode: GA[0].zipcode }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>住所から検索</Text>
            </TouchableOpacity>
            </View>
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, company_address_city: text }));
            }}
            value={company_input.company_address_city}
            style={[styles.inputInner,company_err.company_address_city]}
            placeholder="市区町村"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, company_address_number: text }));
            }}
            value={company_input.company_address_number}
            style={[styles.inputInner,company_err.company_address_number]}
            placeholder="丁目・番地"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, company_address_building: text }));
            }}
            value={company_input.company_address_building}
            style={styles.inputInner}
            placeholder="建物名"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, company_address_room: text }));
            }}
            value={company_input.company_address_room}
            style={styles.inputInner}
            placeholder="号室"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>本社電話番号</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, company_tel: text }));
              }}
              value={company_input.company_tel}
              style={[styles.inputInner,company_err.company_tel]}
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>設立年月日</Text>
          <TouchableOpacity
            style={[styles.inputInner,{flexDirection:'row'}]}
            onPress={()=>{
              setShow(true);
              setMode(0);
            }}
          >
            <Text style={{alignSelf:'center'}}>{company_input.company_establishment?Moment(company_input.company_establishment).format("YYYY-MM-DD"):""}</Text>
            <TouchableOpacity
              style={{alignSelf:'center',marginLeft:'auto'}}
              onPress={()=>ClearDateTime(0)}
            >
              <Feather name='x-circle' color='#ccc' size={25} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>資本金</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, company_capital: text }));
              }}
              value={company_input.company_capital}
              style={styles.inputInner}
              keyboardType={"numeric"}
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>年商</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, company_annual_sales: text }));
              }}
              value={company_input.company_annual_sales}
              style={styles.inputInner}
              keyboardType={"numeric"}
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>従業員数</Text>
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
            value={company_input.company_employee}
            data={company_employee}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, company_employee: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>事業内容</Text>
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
            value={company_input.company_business}
            data={company_business}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, company_business: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <Text style={styles.title}>━━━  会社代表者  ━━━</Text>
        <View style={styles.input}>
          <Text style={styles.label}>氏名<Text style={styles.required}> ※</Text></Text>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, representative_family_name: text }));
              }}
              value={company_input.representative_family_name}
              style={[styles.inputInner,{width:'48%'},company_err.representative_family_name]}
              placeholder="性"
              placeholderTextColor="#b3b3b3"
            />
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, representative_first_name: text }));
              }}
              value={company_input.representative_first_name}
              style={[styles.inputInner,{width:'48%',marginLeft:'auto'},company_err.representative_first_name]}
              placeholder="名"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={{flexDirection:'row',marginTop:5}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, representative_family_kana: text }));
              }}
              value={company_input.representative_family_kana}
              style={[styles.inputInner,{width:'48%'},company_err.representative_family_kana]}
              placeholder="セイ"
              placeholderTextColor="#b3b3b3"
            />
            <TextInput
              onChangeText={(text) => setCompany_Input(state => ({ ...state, representative_first_kana: text }))}
              value={company_input.representative_first_kana}
              style={[styles.inputInner,{width:'48%',marginLeft:'auto'},company_err.representative_first_kana]}
              placeholder="メイ"
              placeholderTextColor="#b3b3b3"
            />
          </View>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>性別</Text>
          <RadioButtonRN
            data={gender_list}
            value={company_input.representative_gender}
            selectedBtn={(e) => setCompany_Input(state => ({ ...state, representative_gender: e.value }))}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={company_input.representative_gender?company_input.representative_gender:-1}
            boxStyle={[styles.radio_box,{width:100}]}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:14,marginLeft:10}}
            circleSize={11}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>生年月日</Text>
          <TouchableOpacity
            style={[styles.inputInner,{flexDirection:'row'}]}
            onPress={()=>{
              setShow(true);
              setMode(1);
            }}
          >
            <Text style={{alignSelf:'center'}}>{company_input.representative_birthday?Moment(company_input.representative_birthday).format("YYYY-MM-DD"):""}</Text>
            <TouchableOpacity
              style={{alignSelf:'center',marginLeft:'auto'}}
              onPress={()=>ClearDateTime(1)}
            >
              <Feather name='x-circle' color='#ccc' size={25} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>携帯電話番号</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, representative_tel: text }));
              }}
              value={company_input.representative_tel}
              style={[styles.inputInner,company_err.representative_tel]}
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholder="ハイフンあり"
              placeholderTextColor="#b3b3b3"
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>現住所</Text>
          <View style={{flexDirection:'row'}}><Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></View>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, representative_zipcode: text }));
              }}
              value={company_input.representative_zipcode}
              style={[styles.inputInner,{width:"55%"},company_err.representative_zipcode]}
              placeholder="郵便番号 ハイフンあり"
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholderTextColor="#b3b3b3"
            />
            <TouchableOpacity
              onPress={async()=>{
                const GA = await GetAddress("zip",company_input.representative_zipcode);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setCompany_Input(state => ({ ...state, representative_address_prefecture: GA.prefecture }));
                  setCompany_Input(state => ({ ...state, representative_address_city: GA.address }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.input}>
          <View style={{flexDirection:'row'}}>
            <Dropdown
              style={[styles.DropDown,{width:"55%"}]}
              containerStyle={styles.dropDownContainer}
              placeholderStyle={{fontSize:14}}
              selectedTextStyle={{fontSize:14}}
              itemTextStyle={{fontSize:14}}
              renderItem={(item)=>(
                <View style={styles.dropItem}>
                  <Text style={styles.dropItemText}>{item.label}</Text>
                </View>
              )}
              value={company_input.representative_address_prefecture}
              data={prefecture_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, representative_address_prefecture: item.value }));
              }}
              labelField="label"
              valueField="value"
              placeholder=""
            />
            <TouchableOpacity
              onPress={async()=>{
                let address = company_input.representative_address_prefecture + company_input.representative_address_city;
                const GA = await GetAddress("add",address);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setCompany_Input(state => ({ ...state, representative_zipcode: GA[0].zipcode }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>住所から検索</Text>
            </TouchableOpacity>
            </View>
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, representative_address_city: text }));
            }}
            value={company_input.representative_address_city}
            style={styles.inputInner}
            placeholder="市区町村"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, representative_address_number: text }));
            }}
            value={company_input.representative_address_number}
            style={styles.inputInner}
            placeholder="丁目・番地"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, representative_address_building: text }));
            }}
            value={company_input.representative_address_building}
            style={styles.inputInner}
            placeholder="建物名"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, representative_address_room: text }));
            }}
            value={company_input.representative_address_room}
            style={styles.inputInner}
            placeholder="号室"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <Text style={styles.title}>━━━  担当者  ━━━</Text>
        <View style={styles.input}>
          <Text style={styles.label}>氏名</Text>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, staff_family_name: text }));
              }}
              value={company_input.staff_family_name}
              style={[styles.inputInner,{width:'48%'}]}
              placeholder="性"
              placeholderTextColor="#b3b3b3"
            />
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, staff_first_name: text }));
              }}
              value={company_input.staff_first_name}
              style={[styles.inputInner,{width:'48%',marginLeft:'auto'}]}
              placeholder="名"
              placeholderTextColor="#b3b3b3"
            />
          </View>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>携帯電話番号</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, staff_tel: text }));
              }}
              value={company_input.staff_tel}
              style={[styles.inputInner,company_err.staff_tel]}
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholder="ハイフンあり"
              placeholderTextColor="#b3b3b3"
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>申込理由</Text>
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
            value={company_input.staff_application_reason}
            data={move_in.guarantee_company=="1"||move_in.user_type=="2"?staff_application_reason1:staff_application_reason2}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, staff_application_reason: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>部署</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, staff_department: text }));
              }}
              value={company_input.staff_department}
              style={styles.inputInner}
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>課</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, staff_division: text }));
              }}
              value={company_input.staff_division}
              style={styles.inputInner}
            />
        </View>
        {move_in.erc_send_flg != "1"&&(
          <View style={{flexDirection:'row',alignSelf: 'center'}}>
            <TouchableOpacity onPress={()=>{erc_customer_update_btn("1")}} style={styles.submit}>
              <Text style={styles.submitText}>保　存</Text>
            </TouchableOpacity>
            {move_in.guarantee_company != "1" || !move_in.erc_type || !move_in.agree_timestamp?(
              <></>
            ):(
              <TouchableOpacity onPress={()=>{erc_customer_send_btn("1")}} style={[styles.submit,{marginLeft:10}]}>
                <Text style={styles.submitText}>えるく送信</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    )
  },[move_in,company_input,show,mode,reinput_flg,QRimg,incomplete,reinput,company_err,change_flg]);

  // 申込情報１：基本情報(個人)
  const PersonInputList = useMemo(() => {
    return (
      <>
        {(QRimg.qr&&QRimg.url)&&(
          <View style={{alignItems:'center',marginTop:20}}>
            <TouchableOpacity style={{}} activeOpacity={1} onLongPress={() => {QR_dl(QRimg.qr)}}>
              <Image
                style={{width:150,height:150}}
                source={{uri:QRimg.qr}}
              />
            </TouchableOpacity>
            <Text style={{marginTop:5,color:'#999'}}>※長押しで保存できます</Text>
            <TouchableOpacity style={{}} onPress={() => {setQRlink_mdl(true)}}>
              <Text style={styles.qr_link}>{QRimg.url}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.input}>
          {incomplete&&(
            <Text style={styles.incomplete_msg}>◆ 以下の申込情報は一時保存中です ◆</Text>
          )}
          {reinput&&(
            <CheckBox
              checked={reinput_flg}
              onPress={() => setReInput_fetch()}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title={"申込内容の再入力をお客様に許可する\n（一時保存の状態になります）"}
            />
          )}
          <CheckBox
            checked={move_in.check_flg}
            onPress={() => setCheckFlg()}
            containerStyle={styles.checkbox}
            checkedColor={chk}
            size={28}
            iconType="material-community"
            checkedIcon="checkbox-marked"
            uncheckedIcon="checkbox-blank-outline"
            title={"申込内容を確認したらチェックしてください\n（対応が必要なお客様から消えます）"}
          />
        </View>
        <Text style={styles.title}>━━━  基本情報  ━━━</Text>
        <View style={styles.input}>
          <Text style={styles.label}>氏名<Text style={styles.required}> ※</Text></Text>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_family_name: text }));
              }}
              value={person_input.person_family_name}
              style={[styles.inputInner,{width:'48%'},person_err.person_family_name]}
              placeholder="性"
              placeholderTextColor="#b3b3b3"
            />
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_first_name: text }));
              }}
              value={person_input.person_first_name}
              style={[styles.inputInner,{width:'48%',marginLeft:'auto'},person_err.person_first_name]}
              placeholder="名"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={{flexDirection:'row',marginTop:5}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_family_kana: text }));
              }}
              value={person_input.person_family_kana}
              style={[styles.inputInner,{width:'48%'},person_err.person_family_kana]}
              placeholder="セイ"
              placeholderTextColor="#b3b3b3"
            />
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_first_kana: text }));
              }}
              value={person_input.person_first_kana}
              style={[styles.inputInner,{width:'48%',marginLeft:'auto'},person_err.person_first_kana]}
              placeholder="メイ"
              placeholderTextColor="#b3b3b3"
            />
          </View>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>性別<Text style={styles.required}> ※</Text></Text>
          <RadioButtonRN
            data={gender_list}
            value={person_input.person_gender}
            selectedBtn={(e) => setPerson_Input(state => ({ ...state, person_gender: e.value }))}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={person_input.person_gender?person_input.person_gender:-1}
            boxStyle={[styles.radio_box,{width:100},person_err.person_gender]}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:14,marginLeft:10}}
            circleSize={11}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>生年月日<Text style={styles.required}> ※</Text></Text>
          <TouchableOpacity
            style={[styles.inputInner,{flexDirection:'row'},person_err.person_birthday]}
            onPress={()=>{
              setShow(true);
              setMode(2);
            }}
          >
            <Text style={{alignSelf:'center'}}>{person_input.person_birthday?Moment(person_input.person_birthday).format("YYYY-MM-DD"):""}</Text>
            <TouchableOpacity
              style={{alignSelf:'center',marginLeft:'auto'}}
              onPress={()=>ClearDateTime(2)}
            >
              <Feather name='x-circle' color='#ccc' size={25} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
        {move_in.guarantee_company=="3"&&( // 日本セーフティ
          <View style={styles.input}>
            <Text style={styles.label}>健康保険</Text>
            <RadioButtonRN
              data={person_health_insurance}
              value={person_input.person_health_insurance}
              selectedBtn={(e) => setPerson_Input(state => ({ ...state, person_health_insurance: e.value }))}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              initial={
                person_input.person_health_insurance == 1?1:
                person_input.person_health_insurance == 2?2:
                person_input.person_health_insurance == 9?3:-1}
              boxStyle={[styles.radio_box,{width:100}]}
              style={{flexDirection:'row',marginVertical:5}}
              textStyle={{fontSize:14,marginLeft:10}}
              circleSize={11}
            />
          </View>
        )}
        <View style={styles.input}>
          <Text style={styles.label}>国籍</Text>
          <RadioButtonRN
            data={person_nationality}
            value={person_input.person_nationality}
            selectedBtn={(e) => {
              setPerson_Input(state => ({ ...state, person_nationality: e.value }));
              if (e.value == "1") {
                setPerson_Input(state => ({
                  ...state,
                  person_residence_status: "",
                  person_stay_period: "",
                  person_japanese_qualification: "",
                  person_resident_total1: "",
                  person_resident_total2: "",
                }));
              }
            }}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={person_input.person_nationality?person_input.person_nationality:-1}
            boxStyle={[styles.radio_box,{width:100}]}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:14,marginLeft:10}}
            circleSize={11}
          />
        </View>
        {person_input.person_nationality=="2"&&(
          <>
          <View style={styles.input}>
            <Text style={styles.label}>在留資格</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_residence_status: text }));
              }}
              value={person_input.person_residence_status}
              style={styles.inputInner}
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>在留期間</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_stay_period: text }));
              }}
              value={person_input.person_stay_period}
              style={styles.inputInner}
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>日本語検定資格</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_japanese_qualification: text }));
              }}
              value={person_input.person_japanese_qualification}
              style={styles.inputInner}
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>日本での合計在住年数</Text>
            <View style={{flexDirection:'row',marginTop:5}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, person_resident_total1: text }));
                }}
                value={person_input.person_resident_total1}
                style={[styles.inputInner,{width:'30%'}]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              />
              <Text style={{marginHorizontal:5,alignSelf:'center'}}>年</Text>
              <TextInput
                onChangeText={(text) => setPerson_Input(state => ({ ...state, person_resident_total2: text }))}
                value={person_input.person_resident_total2}
                style={[styles.inputInner,{width:'30%'}]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              />
              <Text style={{marginHorizontal:5,alignSelf:'center'}}>ヵ月</Text>
            </View>
          </View>
          </>
        )}
        <View style={styles.input}>
          <Text style={styles.label}>配偶者</Text>
          <RadioButtonRN
            data={spouse_list}
            value={person_input.person_spouse}
            selectedBtn={(e) => setPerson_Input(state => ({ ...state, person_spouse: e.value }))}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={person_input.person_spouse?person_input.person_spouse:-1}
            boxStyle={[styles.radio_box,{width:100}]}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:14,marginLeft:10}}
            circleSize={11}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>自宅電話番号<Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>自宅/携帯のどちらか必須</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_tel: text }));
            }}
            value={person_input.person_tel}
            style={[styles.inputInner,person_err.person_tel]}
            keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
            placeholder="ハイフンあり"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>携帯電話番号<Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>自宅/携帯のどちらか必須</Text></Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_mobile: text }));
            }}
            value={person_input.person_mobile}
            style={[styles.inputInner,person_err.person_mobile]}
            keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
            placeholder="ハイフンあり"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>現住所<Text style={styles.required}> ※</Text></Text>
          <View style={{flexDirection:'row'}}><Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></View>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_zipcode: text }));
              }}
              value={person_input.person_zipcode}
              style={[styles.inputInner,{width:"55%"},person_err.person_zipcode]}
              placeholder="郵便番号 ハイフンあり"
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholderTextColor="#b3b3b3"
            />
            <TouchableOpacity
              onPress={async()=>{
                const GA = await GetAddress("zip",person_input.person_zipcode);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, person_address_prefecture: GA.prefecture }));
                  setPerson_Input(state => ({ ...state, person_address_city: GA.address }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.input}>
          <View style={{flexDirection:'row'}}>
            <Dropdown
              style={[styles.DropDown,{width:"55%"},person_err.person_address_prefecture]}
              containerStyle={styles.dropDownContainer}
              placeholderStyle={{fontSize:14}}
              selectedTextStyle={{fontSize:14}}
              itemTextStyle={{fontSize:14}}
              renderItem={(item)=>(
                <View style={styles.dropItem}>
                  <Text style={styles.dropItemText}>{item.label}</Text>
                </View>
              )}
              value={person_input.person_address_prefecture}
              data={prefecture_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_address_prefecture: item.value }));
              }}
              labelField="label"
              valueField="value"
            />
            <TouchableOpacity
              onPress={async()=>{
                let address = person_input.person_address_prefecture + person_input.person_address_city;
                const GA = await GetAddress("add",address);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, person_zipcode: GA[0].zipcode }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>住所から検索</Text>
            </TouchableOpacity>
            </View>
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_address_city: text }));
            }}
            value={person_input.person_address_city}
            style={[styles.inputInner,person_err.person_address_city]}
            placeholder="市区町村"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_address_number: text }));
            }}
            value={person_input.person_address_number}
            style={[styles.inputInner,person_err.person_address_number]}
            placeholder="丁目・番地"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_address_building: text }));
            }}
            value={person_input.person_address_building}
            style={styles.inputInner}
            placeholder="建物名"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_address_room: text }));
            }}
            value={person_input.person_address_room}
            style={styles.inputInner}
            placeholder="号室"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>住宅種別</Text>
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
            value={person_input.person_residential_type}
            data={residential_type}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_residential_type: item.value }));
            }}
            labelField="label"
            valueField="value"
          />
          {person_input.person_residential_type=="9"&&(
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_residential_type_text: text }));
              }}
              value={person_input.person_residential_type_text}
              style={[styles.inputInner,{marginTop:5}]}
              placeholder="その他の内容を入力してください"
              placeholderTextColor="#b3b3b3"
            />
          )}
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>車種</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_car_model: text }));
            }}
            value={person_input.person_car_model}
            style={styles.inputInner}
            placeholder="アルファード等"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>バイク駐輪/排気量</Text>
          <RadioButtonRN
            data={person_bi_list}
            value={person_bike_units_radio}
            selectedBtn={(e) => setPerson_bike_units_radio(e.value)}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={person_bike_units_radio?person_bike_units_radio:-1}
            boxStyle={[styles.radio_box,{width:100}]}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:14,marginLeft:10}}
            circleSize={11}
          />
          {person_bike_units_radio==1&&(
            <View style={{flexDirection:'row',marginTop:5}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, person_bike_units: text }));
                }}
                value={String(person_input.person_bike_units)}
                style={[styles.inputInner,{width:'30%'}]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              />
              <Text style={{marginHorizontal:5,alignSelf:'center'}}>台</Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, person_bike_cc: text }));
                }}
                value={person_input.person_bike_cc}
                style={[styles.inputInner,{width:'30%'}]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              />
              <Text style={{marginHorizontal:5,alignSelf:'center'}}>CC</Text>
            </View>
          )}
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>自転車駐輪</Text>
          <RadioButtonRN
            data={person_bi_list}
            value={person_bicycle_units_radio}
            selectedBtn={(e) => setPerson_bicycle_units_radio(e.value)}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={person_bicycle_units_radio?person_bicycle_units_radio:-1}
            boxStyle={[styles.radio_box,{width:100}]}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:14,marginLeft:10}}
            circleSize={11}
          />
          {person_bicycle_units_radio==1&&(
            <View style={{flexDirection:'row',marginTop:5}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, person_bicycle_units: text }));
                }}
                value={String(person_input.person_bicycle_units)}
                style={[styles.inputInner,{width:'30%'}]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              />
              <Text style={{marginHorizontal:5,alignSelf:'center'}}>台</Text>
            </View>
          )}
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>転居の理由</Text>
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
            value={person_input.person_move_in_reason}
            data={person_move_in_reason}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_move_in_reason: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>勤務先有無<Text style={styles.required}> ※</Text></Text>
          <Dropdown
            style={[styles.DropDown,person_err.person_workplace]}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={person_input.person_workplace}
            data={workplace_list}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_workplace: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>業種</Text>
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
            value={person_input.person_industry}
            data={industry_list}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_industry: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>職種</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_occupation: text }));
            }}
            value={person_input.person_occupation}
            style={styles.inputInner}
            placeholder="営業、事務、技術など"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>職業</Text>
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
            value={person_input.person_employment}
            data={employment_list}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_employment: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>
            勤務先/学校 名称
            {person_input.person_workplace=="1"&&(<Text style={styles.required}> ※</Text>)}
          </Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_belongs_name: text }));
            }}
            value={person_input.person_belongs_name}
            style={[styles.inputInner,person_err.person_belongs_name]}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>勤務先電話番号</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_belongs_tel: text }));
            }}
            value={person_input.person_belongs_tel}
            style={[styles.inputInner,person_err.person_belongs_tel]}
            placeholder="ハイフンあり"
            keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>勤務先所在地
          {person_input.person_workplace=="1"&&(<Text style={styles.required}> ※</Text>)}
          </Text>
          <View style={{flexDirection:'row'}}><Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></View>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_belongs_zipcode: text }));
              }}
              value={person_input.person_belongs_zipcode}
              style={[styles.inputInner,{width:"55%"},person_err.person_belongs_zipcode]}
              placeholder="郵便番号 ハイフンあり"
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholderTextColor="#b3b3b3"
            />
            <TouchableOpacity
              onPress={async()=>{
                const GA = await GetAddress("zip",person_input.person_belongs_zipcode);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, person_belongs_prefecture: GA.prefecture }));
                  setPerson_Input(state => ({ ...state, person_belongs_city: GA.address }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.input}>
          <View style={{flexDirection:'row'}}>
            <Dropdown
              style={[styles.DropDown,{width:"55%"},person_err.person_belongs_prefecture]}
              containerStyle={styles.dropDownContainer}
              placeholderStyle={{fontSize:14}}
              selectedTextStyle={{fontSize:14}}
              itemTextStyle={{fontSize:14}}
              renderItem={(item)=>(
                <View style={styles.dropItem}>
                  <Text style={styles.dropItemText}>{item.label}</Text>
                </View>
              )}
              value={person_input.person_belongs_prefecture}
              data={prefecture_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_belongs_prefecture: item.value }));
              }}
              labelField="label"
              valueField="value"
            />
            <TouchableOpacity
              onPress={async()=>{
                let address = person_input.person_belongs_prefecture + person_input.person_belongs_city;
                const GA = await GetAddress("add",address);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, person_belongs_zipcode: GA[0].zipcode }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>住所から検索</Text>
            </TouchableOpacity>
            </View>
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_belongs_city: text }));
            }}
            value={person_input.person_belongs_city}
            style={[styles.inputInner,person_err.person_belongs_city]}
            placeholder="市区町村"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_belongs_number: text }));
            }}
            value={person_input.person_belongs_number}
            style={[styles.inputInner,person_err.person_belongs_number]}
            placeholder="丁目・番地"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_belongs_building: text }));
            }}
            value={person_input.person_belongs_building}
            style={styles.inputInner}
            placeholder="建物名"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_belongs_room: text }));
            }}
            value={person_input.person_belongs_room}
            style={styles.inputInner}
            placeholder="号室"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>勤続年数/在学年数</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setPerson_Input(state => ({ ...state, person_belongs_period: text }));
            }}
            value={person_input.person_belongs_period}
            style={styles.inputInner}
            keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>年収<Text style={styles.required}> ※</Text></Text>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, person_annual_income: text }));
              }}
              value={person_input.person_annual_income}
              style={[styles.inputInner,{width:'50%'},person_err.person_annual_income]}
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
            />
            <Text style={{marginHorizontal:5,alignSelf:'center'}}>万円</Text>
          </View>
        </View>
        {move_in.guarantee_company=="3"&&( // 日本セーフティ
          <View style={styles.input}>
            <Text style={styles.label}>月収</Text>
            <View style={{flexDirection:'row'}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, person_monthly_income: text }));
                }}
                value={person_input.person_monthly_income}
                style={[styles.inputInner,{width:'50%'}]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              />
              <Text style={{marginHorizontal:5,alignSelf:'center'}}>万円</Text>
            </View>
          </View>
        )}
        {move_in.erc_send_flg != "1"&&(
          <View style={{flexDirection:'row',alignSelf: 'center'}}>
            <TouchableOpacity onPress={()=>{erc_customer_update_btn("2")}} style={styles.submit}>
              <Text style={styles.submitText}>保　存</Text>
            </TouchableOpacity>
            {move_in.guarantee_company != "1" || !move_in.erc_type || !move_in.agree_timestamp?(
              <></>
            ):(
              <TouchableOpacity onPress={()=>{erc_customer_send_btn("2")}} style={[styles.submit,{marginLeft:10}]}>
                <Text style={styles.submitText}>えるく送信</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    )
  },[move_in,person_input,show,mode,person_bike_units_radio,person_bicycle_units_radio,reinput_flg,QRimg,incomplete,reinput,person_err,change_flg]);

  // 申込情報２：入居者、本人確認
  const InputList = useMemo(() => {
    return (
      <>
        {(QRimg.qr&&QRimg.url)&&(
          <View style={{alignItems:'center',marginTop:20}}>
            <TouchableOpacity style={{}} activeOpacity={1} onLongPress={() => {QR_dl(QRimg.qr)}}>
              <Image
                style={{width:150,height:150}}
                source={{uri:QRimg.qr}}
              />
            </TouchableOpacity>
            <Text style={{marginTop:5,color:'#999'}}>※長押しで保存できます</Text>
            <TouchableOpacity style={{}} onPress={() => {setQRlink_mdl(true)}}>
              <Text style={styles.qr_link}>{QRimg.url}</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.input}>
          {incomplete&&(
            <Text style={styles.incomplete_msg}>◆ 以下の申込情報は一時保存中です ◆</Text>
          )}
          {reinput&&(
            <CheckBox
              checked={reinput_flg}
              onPress={() => setReInput_fetch()}
              containerStyle={styles.checkbox}
              checkedColor={chk}
              size={28}
              iconType="material-community"
              checkedIcon="checkbox-marked"
              uncheckedIcon="checkbox-blank-outline"
              title={"申込内容の再入力をお客様に許可する\n（一時保存の状態になります）"}
            />
          )}
          <CheckBox
            checked={move_in.check_flg}
            onPress={() => setCheckFlg()}
            containerStyle={styles.checkbox}
            checkedColor={chk}
            size={28}
            iconType="material-community"
            checkedIcon="checkbox-marked"
            uncheckedIcon="checkbox-blank-outline"
            title={"申込内容を確認したらチェックしてください\n（対応が必要なお客様から消えます）"}
          />
        </View>
        {resident.map((res, index) => {
          var title = "入居者";
          if (res.no == "1") title += "①";
          else if (res.no == "2") title += "②";
          else if (res.no == "3") title += "③";
          else if (res.no == "4") title += "④";
          return (
          <View  key={res.no}>
            <Text style={styles.title}>━━━  {title}  ━━━</Text>
            <View style={styles.input}>
              <Text style={styles.label}>氏名</Text>
              <View style={{flexDirection:'row'}}>
                <TextInput
                  onChangeText={(text) => {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setResident(state => [...state.slice(0, index), { ...state[index], resident_family_name: text }, ...state.slice(index + 1)]);
                  }}
                  value={res.resident_family_name}
                  style={[styles.inputInner,{width:'48%'},resident_err[index].resident_family_name]}
                  placeholder="性"
                  placeholderTextColor="#b3b3b3"
                />
                <TextInput
                  onChangeText={(text) => {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setResident(state => [...state.slice(0, index), { ...state[index], resident_first_name: text }, ...state.slice(index + 1)]);
                  }}
                  value={res.resident_first_name}
                  style={[styles.inputInner,{width:'48%',marginLeft:'auto'},resident_err[index].resident_first_name]}
                  placeholder="名"
                  placeholderTextColor="#b3b3b3"
                />
              </View>
              <View style={{flexDirection:'row',marginTop:5}}>
                <TextInput
                  onChangeText={(text) => {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setResident(state => [...state.slice(0, index), { ...state[index], resident_family_kana: text }, ...state.slice(index + 1)]);
                  }}
                  value={res.resident_family_kana}
                  style={[styles.inputInner,{width:'48%'},resident_err[index].resident_family_kana]}
                  placeholder="セイ"
                  placeholderTextColor="#b3b3b3"
                />
                <TextInput
                  onChangeText={(text) => {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setResident(state => [...state.slice(0, index), { ...state[index], resident_first_kana: text }, ...state.slice(index + 1)]);
                  }}
                  value={res.resident_first_kana}
                  style={[styles.inputInner,{width:'48%',marginLeft:'auto'},resident_err[index].resident_first_kana]}
                  placeholder="メイ"
                  placeholderTextColor="#b3b3b3"
                />
              </View>
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>性別</Text>
              <RadioButtonRN
                data={gender_list}
                value={res.resident_gender}
                selectedBtn={(e) => setResident(state => [...state.slice(0, index), { ...state[index], resident_gender: e.value }, ...state.slice(index + 1)])}
                animationTypes={['rotate']}
                activeColor={'#191970'}
                initial={res.resident_gender?res.resident_gender:-1}
                boxStyle={[styles.radio_box,{width:100}]}
                style={{flexDirection:'row',marginVertical:5}}
                textStyle={{fontSize:14,marginLeft:10}}
                circleSize={11}
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>生年月日</Text>
              <TouchableOpacity
                style={[styles.inputInner,{flexDirection:'row'}]}
                onPress={()=>{
                  setShow(true);
                  setMode(3);
                  setDate_index(index);
                }}
              >
                <Text style={{alignSelf:'center'}}>{res.resident_birthday?Moment(res.resident_birthday).format("YYYY-MM-DD"):""}</Text>
                <TouchableOpacity
                  style={{alignSelf:'center',marginLeft:'auto'}}
                  onPress={()=>ClearDateTime(3,index)}
                >
                  <Feather name='x-circle' color='#ccc' size={25} />
                </TouchableOpacity>
              </TouchableOpacity>
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>配偶者</Text>
              <RadioButtonRN
                data={spouse_list}
                value={res.resident_spouse}
                selectedBtn={(e) => setResident(state => [...state.slice(0, index), { ...state[index], resident_spouse: e.value }, ...state.slice(index + 1)])}
                animationTypes={['rotate']}
                activeColor={'#191970'}
                initial={res.resident_spouse?res.resident_spouse:-1}
                boxStyle={[styles.radio_box,{width:100}]}
                style={{flexDirection:'row',marginVertical:5}}
                textStyle={{fontSize:14,marginLeft:10}}
                circleSize={11}
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>続柄</Text>
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
                value={res.resident_relationship}
                data={relationship_list}
                onChange={(item) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setResident(state => [...state.slice(0, index), { ...state[index], resident_relationship: item.value }, ...state.slice(index + 1)]);
                }}
                labelField="label"
                valueField="value"
                placeholder=""
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>携帯電話番号</Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setResident(state => [...state.slice(0, index), { ...state[index], resident_mobile: text }, ...state.slice(index + 1)]);
                }}
                value={res.resident_mobile}
                style={[styles.inputInner,resident_err[index].resident_mobile]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                placeholder="ハイフンあり"
                placeholderTextColor="#b3b3b3"
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>勤務先/学校 名称</Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setResident(state => [...state.slice(0, index), { ...state[index], resident_belongs_name: text }, ...state.slice(index + 1)]);
                }}
                value={res.resident_belongs_name}
                style={styles.inputInner}
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>勤務先所在地</Text>
              <View style={{flexDirection:'row'}}><Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></View>
              <View style={{flexDirection:'row'}}>
                <TextInput
                  onChangeText={(text) => {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setResident(state => [...state.slice(0, index), { ...state[index], resident_belongs_zipcode: text }, ...state.slice(index + 1)]);
                  }}
                  value={res.resident_belongs_zipcode}
                  style={[styles.inputInner,{width:"55%"},resident_err[index].resident_belongs_zipcode]}
                  placeholder="郵便番号 ハイフンあり"
                  keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                  placeholderTextColor="#b3b3b3"
                />
                <TouchableOpacity
                  onPress={async()=>{
                    const GA = await GetAddress("zip",res.resident_belongs_zipcode);
                    if (GA) {
                      setChange_flg(state => ({ ...state, customer: 1 }));
                      setResident(state => ({ ...state, resident_belongs_prefecture: GA.prefecture }));
                      setResident(state => ({ ...state, resident_belongs_city: GA.address }));
                    }
                  }}
                  style={styles.addressBtn}
                >
                  <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.input}>
              <View style={{flexDirection:'row'}}>
                <Dropdown
                  style={[styles.DropDown,{width:"55%"}]}
                  containerStyle={styles.dropDownContainer}
                  placeholderStyle={{fontSize:14}}
                  selectedTextStyle={{fontSize:14}}
                  itemTextStyle={{fontSize:14}}
                  renderItem={(item)=>(
                    <View style={styles.dropItem}>
                      <Text style={styles.dropItemText}>{item.label}</Text>
                    </View>
                  )}
                  value={res.resident_belongs_prefecture}
                  data={prefecture_list}
                  onChange={(item) => {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setResident(state => [...state.slice(0, index), { ...state[index], resident_belongs_prefecture: item.value }, ...state.slice(index + 1)]);
                  }}
                  labelField="label"
                  valueField="value"
                  placeholder=""
                />
                <TouchableOpacity
                  onPress={async()=>{
                    let address = res.resident_belongs_prefecture + res.resident_belongs_city;
                    const GA = await setResident("add",address);
                    if (GA) {
                      setChange_flg(state => ({ ...state, customer: 1 }));
                      setResident(state => ({ ...state, resident_belongs_zipcode: GA[0].zipcode }));
                    }
                  }}
                  style={styles.addressBtn}
                >
                  <Text style={styles.addressBtntxt}>住所から検索</Text>
                </TouchableOpacity>
                </View>
            </View>
            <View style={styles.input}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setResident(state => [...state.slice(0, index), { ...state[index], resident_belongs_city: text }, ...state.slice(index + 1)]);
                }}
                value={res.resident_belongs_city}
                style={styles.inputInner}
                placeholder="市区町村"
                placeholderTextColor="#b3b3b3"
              />
            </View>
            <View style={styles.input}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setResident(state => [...state.slice(0, index), { ...state[index], resident_belongs_number: text }, ...state.slice(index + 1)]);
                }}
                value={res.resident_belongs_number}
                style={styles.inputInner}
                placeholder="丁目・番地"
                placeholderTextColor="#b3b3b3"
              />
            </View>
            <View style={styles.input}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setResident(state => [...state.slice(0, index), { ...state[index], resident_belongs_building: text }, ...state.slice(index + 1)]);
                }}
                value={res.resident_belongs_building}
                style={styles.inputInner}
                placeholder="建物名"
                placeholderTextColor="#b3b3b3"
              />
            </View>
            <View style={styles.input}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setResident(state => [...state.slice(0, index), { ...state[index], resident_belongs_room: text }, ...state.slice(index + 1)]);
                }}
                value={res.resident_belongs_room}
                style={styles.inputInner}
                placeholder="号室"
                placeholderTextColor="#b3b3b3"
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>勤務先電話番号</Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setResident(state => [...state.slice(0, index), { ...state[index], resident_belongs_tel: text }, ...state.slice(index + 1)]);
                }}
                value={res.resident_belongs_tel}
                style={[styles.inputInner,resident_err[index].resident_belongs_tel]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                placeholder="ハイフンあり"
                placeholderTextColor="#b3b3b3"
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>所属部署/役職</Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setResident(state => [...state.slice(0, index), { ...state[index], resident_department: text }, ...state.slice(index + 1)]);
                }}
                value={res.resident_department}
                style={styles.inputInner}
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>業種</Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setResident(state => [...state.slice(0, index), { ...state[index], resident_industry: text }, ...state.slice(index + 1)]);
                }}
                value={res.resident_industry}
                style={styles.inputInner}
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>年収</Text>
              <View style={{flexDirection:'row'}}>
                <TextInput
                  onChangeText={(text) => {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setResident(state => [...state.slice(0, index), { ...state[index], resident_annual_income: text }, ...state.slice(index + 1)]);
                  }}
                  value={res.resident_annual_income}
                  style={[styles.inputInner,{width:'50%'}]}
                  keyboardType={"numeric"}
                  placeholder="数字のみで入力"
                  placeholderTextColor="#b3b3b3"
                />
                <Text style={{marginHorizontal:5,alignSelf:'center'}}>万円</Text>
              </View>
            </View>
          </View>
          )
        })}
        <Text style={styles.title}>━━━  本人確認書類<Text style={styles.required}>  ※</Text>  ━━━</Text>
        <View style={[styles.input,{marginTop:10}]}>
          {image.length>0?(
            <>
              <View style={{flexDirection:'row'}}>
                <TouchableOpacity
                  onPress={async()=>await settingImage(image[0])}
                >
                  <Text style={styles.img_link}>【表】画像参照</Text>
                </TouchableOpacity>
                {image.length>1&&(
                  <TouchableOpacity
                    onPress={async()=>await settingImage(image[1])}
                  >
                    <Text style={[styles.img_link,{marginLeft:20}]}>【裏】画像参照</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TouchableOpacity
                onPress={()=>ClearImage()}
                style={styles.img_change}
              >
                <Text style={styles.img_change_btn}>画像変更</Text>
              </TouchableOpacity>
            </>
          ):(
            <View style={{flexDirection:'row'}}>
              {filedata1?(
                <View style={{flexDirection:'row'}}>
                  <TouchableOpacity onPress={async()=>await settingImage(filedata1.assets[0].uri)}>
                    <Text style={[styles.img_link,{marginRight:10}]}>【表】画像１</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={()=>setFiledata1(null)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      color="#999"
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
              ):(
                <TouchableOpacity
                  onPress={async()=>await pickImage("1")}
                >
                  <Text style={styles.img_link}>【表】ファイルを選択</Text>
                </TouchableOpacity>
              )}
              {filedata2?(
                <View style={{flexDirection:'row'}}>
                  <TouchableOpacity onPress={async()=>await settingImage(filedata2.assets[0].uri)}>
                    <Text style={[styles.img_link,{marginLeft:20,marginRight:10}]}>【裏】画像２</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={()=>setFiledata2(null)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name="close-circle"
                      color="#999"
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
              ):(
                <TouchableOpacity
                  onPress={async()=>await pickImage("2")}
                >
                  <Text style={[styles.img_link,{marginLeft:20}]}>【裏】ファイルを選択</Text>
                </TouchableOpacity>
              )}
              </View>
          )}
        </View>
        <Modal
          isVisible={img_mdl}
          swipeDirection={['up']}
          onSwipeComplete={()=>setImg_mdl(false)}
          backdropOpacity={1}
          animationInTiming={100}
          animationOutTiming={300}
          animationIn={'fadeIn'}
          animationOut={'fadeOut'}
          propagateSwipe={true}
          transparent={true}
          onBackdropPress={()=>setImg_mdl(false)}
          style={{alignItems:'center',zIndex:999}}
        >
          <TouchableOpacity
            style={styles.clsbtn}
            onPress={()=>setImg_mdl(false)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="close-circle"
              color="#999"
              size={30}
            />
          </TouchableOpacity>
          <View style={{width:Width,height:Width / (img_size.width / img_size.height)}}>
            <Image
              style={{width:"100%",height:"100%"}}
              source={{uri:img}}
            />
          </View>
        </Modal>
      </>
    )
  },[move_in,resident,image,show,mode,img_mdl,img,img_size,filedata1,filedata2,reinput_flg,QRimg,incomplete,reinput,resident_err,change_flg]);

  // 申込情報２：連帯保証人(法人)
  const CompanyGuarantorList = useMemo(() => {
    return (
      <>
        <Text style={styles.title}>━━━  連帯保証人  ━━━</Text>
        <View style={styles.input}>
          <Text style={styles.label}>氏名<Text style={styles.required}> ※</Text></Text>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_family_name: text }));
              }}
              value={company_input.guarantor_family_name}
              style={[styles.inputInner,{width:'48%'},company_err.guarantor_family_name]}
              placeholder="性"
              placeholderTextColor="#b3b3b3"
            />
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_first_name: text }));
              }}
              value={company_input.guarantor_first_name}
              style={[styles.inputInner,{width:'48%',marginLeft:'auto'},company_err.guarantor_first_name]}
              placeholder="名"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={{flexDirection:'row',marginTop:5}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_family_kana: text }));
              }}
              value={company_input.guarantor_family_kana}
              style={[styles.inputInner,{width:'48%'},company_err.guarantor_family_kana]}
              placeholder="セイ"
              placeholderTextColor="#b3b3b3"
            />
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_first_kana: text }));
              }}
              value={company_input.guarantor_first_kana}
              style={[styles.inputInner,{width:'48%',marginLeft:'auto'},company_err.guarantor_first_kana]}
              placeholder="メイ"
              placeholderTextColor="#b3b3b3"
            />
          </View>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>性別<Text style={styles.required}> ※</Text></Text>
          <RadioButtonRN
            data={gender_list}
            value={company_input.guarantor_gender}
            selectedBtn={(e) => setCompany_Input(state => ({ ...state, guarantor_gender: e.value }))}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={company_input.guarantor_gender?company_input.guarantor_gender:-1}
            boxStyle={[styles.radio_box,{width:100},company_err.guarantor_gender]}
            style={{flexDirection:'row',marginVertical:5}}
            textStyle={{fontSize:14,marginLeft:10}}
            circleSize={11}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>生年月日<Text style={styles.required}> ※</Text></Text>
          <TouchableOpacity
            style={[styles.inputInner,{flexDirection:'row'},company_err.guarantor_birthday]}
            onPress={()=>{
              setShow(true);
              setMode(4);
            }}
          >
            <Text style={{alignSelf:'center'}}>{company_input.guarantor_birthday?Moment(company_input.guarantor_birthday).format("YYYY-MM-DD"):""}</Text>
            <TouchableOpacity
              style={{alignSelf:'center',marginLeft:'auto'}}
              onPress={()=>ClearDateTime(4)}
            >
              <Feather name='x-circle' color='#ccc' size={25} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>本籍</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_domicile: text }));
              }}
              value={company_input.guarantor_domicile}
              style={styles.inputInner}
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>続柄</Text>
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
            value={company_input.guarantor_relationship}
            data={relationship_list}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_relationship: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>自宅電話番号<Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>自宅/携帯のどちらか必須</Text></Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_tel: text }));
              }}
              value={company_input.guarantor_tel}
              style={[styles.inputInner,company_err.guarantor_tel]}
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholder="ハイフンあり"
              placeholderTextColor="#b3b3b3"
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>携帯電話番号<Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>自宅/携帯のどちらか必須</Text></Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_mobile: text }));
              }}
              value={company_input.guarantor_mobile}
              style={[styles.inputInner,company_err.guarantor_mobile]}
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholder="ハイフンあり"
              placeholderTextColor="#b3b3b3"
            />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>現住所<Text style={styles.required}> ※</Text></Text>
          <View style={{flexDirection:'row'}}><Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></View>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_zipcode: text }));
              }}
              value={company_input.guarantor_zipcode}
              style={[styles.inputInner,{width:"55%"},company_err.guarantor_zipcode]}
              placeholder="郵便番号 ハイフンあり"
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholderTextColor="#b3b3b3"
            />
            <TouchableOpacity
              onPress={async()=>{
                const GA = await GetAddress("zip",company_input.guarantor_zipcode);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setCompany_Input(state => ({ ...state, guarantor_address_prefecture: GA.prefecture }));
                  setCompany_Input(state => ({ ...state, guarantor_address_city: GA.address }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.input}>
          <View style={{flexDirection:'row'}}>
            <Dropdown
              style={[styles.DropDown,{width:"55%"},company_err.guarantor_address_prefecture]}
              containerStyle={styles.dropDownContainer}
              placeholderStyle={{fontSize:14}}
              selectedTextStyle={{fontSize:14}}
              itemTextStyle={{fontSize:14}}
              renderItem={(item)=>(
                <View style={styles.dropItem}>
                  <Text style={styles.dropItemText}>{item.label}</Text>
                </View>
              )}
              value={company_input.guarantor_address_prefecture}
              data={prefecture_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_address_prefecture: item.value }));
              }}
              labelField="label"
              valueField="value"
            />
            <TouchableOpacity
              onPress={async()=>{
                let address = company_input.guarantor_address_prefecture + company_input.guarantor_address_city;
                const GA = await GetAddress("add",address);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setCompany_Input(state => ({ ...state, guarantor_zipcode: GA[0].zipcode }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>住所から検索</Text>
            </TouchableOpacity>
            </View>
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_address_city: text }));
            }}
            value={company_input.guarantor_address_city}
            style={[styles.inputInner,company_err.guarantor_address_city]}
            placeholder="市区町村"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_address_number: text }));
            }}
            value={company_input.guarantor_address_number}
            style={[styles.inputInner,company_err.guarantor_address_number]}
            placeholder="丁目・番地"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_address_building: text }));
            }}
            value={company_input.guarantor_address_building}
            style={styles.inputInner}
            placeholder="建物名"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_address_room: text }));
            }}
            value={company_input.guarantor_address_room}
            style={styles.inputInner}
            placeholder="号室"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>住宅種別</Text>
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
            value={company_input.guarantor_residential_type}
            data={residential_type}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_residential_type: item.value }));
            }}
            labelField="label"
            valueField="value"
          />
          {company_input.guarantor_residential_type=="9"&&(
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_residential_type_text: text }));
              }}
              value={person_input.guarantor_residential_type_text}
              style={[styles.inputInner,{marginTop:5}]}
              placeholder="その他の内容を入力してください"
              placeholderTextColor="#b3b3b3"
            />
          )}
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>勤務先有無<Text style={styles.required}> ※</Text></Text>
          <Dropdown
            style={[styles.DropDown,company_err.guarantor_workplace]}
            containerStyle={styles.dropDownContainer}
            placeholderStyle={{fontSize:14}}
            selectedTextStyle={{fontSize:14}}
            itemTextStyle={{fontSize:14}}
            renderItem={(item)=>(
              <View style={styles.dropItem}>
                <Text style={styles.dropItemText}>{item.label}</Text>
              </View>
            )}
            value={company_input.guarantor_workplace}
            data={workplace_list}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_workplace: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>業種</Text>
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
            value={company_input.guarantor_industry}
            data={industry_list}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_industry: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>職種</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_occupation: text }));
            }}
            value={company_input.guarantor_occupation}
            style={styles.inputInner}
            placeholder="営業、事務、技術など"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>職業</Text>
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
            value={company_input.guarantor_employment}
            data={employment_list}
            onChange={(item) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_employment: item.value }));
            }}
            labelField="label"
            valueField="value"
            placeholder=""
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>所属部署</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_department: text }));
            }}
            value={company_input.guarantor_department}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>役職</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_position: text }));
            }}
            value={company_input.guarantor_position}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>勤務先 名称</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_belongs_name: text }));
            }}
            value={company_input.guarantor_belongs_name}
            style={styles.inputInner}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>勤務先電話番号</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_belongs_tel: text }));
            }}
            value={company_input.guarantor_belongs_tel}
            style={[styles.inputInner,company_err.guarantor_belongs_tel]}
            placeholder="ハイフンあり"
            keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>勤務先所在地</Text>
          <View style={{flexDirection:'row'}}><Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></View>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_belongs_zipcode: text }));
              }}
              value={company_input.guarantor_belongs_zipcode}
              style={[styles.inputInner,{width:"55%"},company_err.guarantor_belongs_zipcode]}
              placeholder="郵便番号 ハイフンあり"
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholderTextColor="#b3b3b3"
            />
            <TouchableOpacity
              onPress={async()=>{
                const GA = await GetAddress("zip",company_input.guarantor_belongs_zipcode);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setCompany_Input(state => ({ ...state, guarantor_belongs_prefecture: GA.prefecture }));
                  setCompany_Input(state => ({ ...state, guarantor_belongs_city: GA.address }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.input}>
          <View style={{flexDirection:'row'}}>
            <Dropdown
              style={[styles.DropDown,{width:"55%"},company_err.guarantor_belongs_prefecture]}
              containerStyle={styles.dropDownContainer}
              placeholderStyle={{fontSize:14}}
              selectedTextStyle={{fontSize:14}}
              itemTextStyle={{fontSize:14}}
              renderItem={(item)=>(
                <View style={styles.dropItem}>
                  <Text style={styles.dropItemText}>{item.label}</Text>
                </View>
              )}
              value={company_input.guarantor_belongs_prefecture}
              data={prefecture_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_belongs_prefecture: item.value }));
              }}
              labelField="label"
              valueField="value"
              placeholder=""
            />
            <TouchableOpacity
              onPress={async()=>{
                let address = company_input.guarantor_belongs_prefecture + company_input.guarantor_belongs_city;
                const GA = await GetAddress("add",address);
                if (GA) {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setCompany_Input(state => ({ ...state, guarantor_belongs_zipcode: GA[0].zipcode }));
                }
              }}
              style={styles.addressBtn}
            >
              <Text style={styles.addressBtntxt}>住所から検索</Text>
            </TouchableOpacity>
            </View>
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_belongs_city: text }));
            }}
            value={company_input.guarantor_belongs_city}
            style={[styles.inputInner,company_err.guarantor_belongs_city]}
            placeholder="市区町村"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_belongs_number: text }));
            }}
            value={company_input.guarantor_belongs_number}
            style={[styles.inputInner,company_err.guarantor_belongs_number]}
            placeholder="丁目・番地"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_belongs_building: text }));
            }}
            value={company_input.guarantor_belongs_building}
            style={styles.inputInner}
            placeholder="建物名"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_belongs_room: text }));
            }}
            value={company_input.guarantor_belongs_room}
            style={styles.inputInner}
            placeholder="号室"
            placeholderTextColor="#b3b3b3"
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>勤続年数</Text>
          <TextInput
            onChangeText={(text) => {
              setChange_flg(state => ({ ...state, customer: 1 }));
              setCompany_Input(state => ({ ...state, guarantor_belongs_period: text }));
            }}
            value={company_input.guarantor_belongs_period}
            style={styles.inputInner}
            keyboardType={"numeric"}
          />
        </View>
        <View style={styles.input}>
          <Text style={styles.label}>年収<Text style={styles.required}> ※</Text></Text>
          <View style={{flexDirection:'row'}}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setCompany_Input(state => ({ ...state, guarantor_annual_income: text }));
              }}
              value={company_input.guarantor_annual_income}
              style={[styles.inputInner,{width:'50%'},company_err.guarantor_annual_income]}
              keyboardType={"numeric"}
              placeholder="数字のみで入力"
              placeholderTextColor="#b3b3b3"
            />
            <Text style={{marginHorizontal:5,alignSelf:'center'}}>万円</Text>
          </View>
        </View>
        {move_in.guarantee_company=="3"&&( // 日本セーフティ
          <View style={styles.input}>
            <Text style={styles.label}>月収</Text>
            <View style={{flexDirection:'row'}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setCompany_Input(state => ({ ...state, guarantor_monthly_income: text }));
                }}
                value={company_input.guarantor_monthly_income}
                style={[styles.inputInner,{width:'50%'}]}
                keyboardType={"numeric"}
              />
              <Text style={{marginHorizontal:5,alignSelf:'center'}}>万円</Text>
            </View>
          </View>
        )}
        {move_in.erc_send_flg != "1"&&(
          <View style={{flexDirection:'row',alignSelf: 'center'}}>
            <TouchableOpacity onPress={()=>{erc_customer_update_btn("1")}} style={styles.submit}>
              <Text style={styles.submitText}>保　存</Text>
            </TouchableOpacity>
            {move_in.guarantee_company != "1" || !move_in.erc_type || !move_in.agree_timestamp?(
              <></>
            ):(
              <TouchableOpacity onPress={()=>{erc_customer_send_btn("1")}} style={[styles.submit,{marginLeft:10}]}>
                <Text style={styles.submitText}>えるく送信</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </>
    )
  },[move_in,company_input,show,mode,company_err,change_flg]);

  // 申込情報２：連帯保証人or緊急連絡先(個人)
  const PersonGuarantorList = useMemo(() => {
    if (move_in.joint_guarantor=="1") {
      return (
        <>
          <Text style={styles.title}>━━━  連帯保証人  ━━━</Text>
          <View style={styles.input}>
            <Text style={styles.label}>氏名<Text style={styles.required}> ※</Text></Text>
            <View style={{flexDirection:'row'}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_family_name: text }));
                }}
                value={person_input.guarantor_family_name}
                style={[styles.inputInner,{width:'48%'},person_err.guarantor_family_name]}
                placeholder="性"
                placeholderTextColor="#b3b3b3"
              />
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_first_name: text }));
                }}
                value={person_input.guarantor_first_name}
                style={[styles.inputInner,{width:'48%',marginLeft:'auto'},person_err.guarantor_first_name]}
                placeholder="名"
                placeholderTextColor="#b3b3b3"
              />
            </View>
            <View style={{flexDirection:'row',marginTop:5}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_family_kana: text }));
                }}
                value={person_input.guarantor_family_kana}
                style={[styles.inputInner,{width:'48%'},person_err.guarantor_family_kana]}
                placeholder="セイ"
                placeholderTextColor="#b3b3b3"
              />
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_first_kana: text }));
                }}
                value={person_input.guarantor_first_kana}
                style={[styles.inputInner,{width:'48%',marginLeft:'auto'},person_err.guarantor_first_kana]}
                placeholder="メイ"
                placeholderTextColor="#b3b3b3"
              />
            </View>
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>性別<Text style={styles.required}> ※</Text></Text>
            <RadioButtonRN
              data={gender_list}
              value={person_input.guarantor_gender}
              selectedBtn={(e) => setPerson_Input(state => ({ ...state, guarantor_gender: e.value }))}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              initial={person_input.guarantor_gender?person_input.guarantor_gender:-1}
              boxStyle={[styles.radio_box,{width:100},person_err.guarantor_gender]}
              style={{flexDirection:'row',marginVertical:5}}
              textStyle={{fontSize:14,marginLeft:10}}
              circleSize={11}
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>生年月日<Text style={styles.required}> ※</Text></Text>
            <TouchableOpacity
              style={[styles.inputInner,{flexDirection:'row'},person_err.guarantor_birthday]}
              onPress={()=>{
                setShow(true);
                setMode(4);
              }}
            >
              <Text style={{alignSelf:'center'}}>{person_input.guarantor_birthday?Moment(person_input.guarantor_birthday).format("YYYY-MM-DD"):""}</Text>
              <TouchableOpacity
                style={{alignSelf:'center',marginLeft:'auto'}}
                onPress={()=>ClearDateTime(4)}
              >
                <Feather name='x-circle' color='#ccc' size={25} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>本籍</Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_domicile: text }));
                }}
                value={person_input.guarantor_domicile}
                style={styles.inputInner}
              />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>続柄</Text>
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
              value={person_input.guarantor_relationship}
              data={relationship_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_relationship: item.value }));
              }}
              labelField="label"
              valueField="value"
              placeholder=""
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>自宅電話番号<Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>自宅/携帯のどちらか必須</Text></Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_tel: text }));
                }}
                value={person_input.guarantor_tel}
                style={[styles.inputInner,person_err.guarantor_tel]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                placeholder="ハイフンあり"
                placeholderTextColor="#b3b3b3"
              />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>携帯電話番号<Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>自宅/携帯のどちらか必須</Text></Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_mobile: text }));
                }}
                value={person_input.guarantor_mobile}
                style={[styles.inputInner,person_err.guarantor_mobile]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                placeholder="ハイフンあり"
                placeholderTextColor="#b3b3b3"
              />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>現住所<Text style={styles.required}> ※</Text></Text>
            <View style={{flexDirection:'row'}}><Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></View>
            <View style={{flexDirection:'row'}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_zipcode: text }));
                }}
                value={person_input.guarantor_zipcode}
                style={[styles.inputInner,{width:"55%"},person_err.guarantor_zipcode]}
                placeholder="郵便番号 ハイフンあり"
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                placeholderTextColor="#b3b3b3"
              />
              <TouchableOpacity
                onPress={async()=>{
                  const GA = await GetAddress("zip",person_input.guarantor_zipcode);
                  if (GA) {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setPerson_Input(state => ({ ...state, guarantor_address_prefecture: GA.prefecture }));
                    setPerson_Input(state => ({ ...state, guarantor_address_city: GA.address }));
                  }
                }}
                style={styles.addressBtn}
              >
                <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.input}>
            <View style={{flexDirection:'row'}}>
              <Dropdown
                style={[styles.DropDown,{width:"55%"},person_err.guarantor_address_prefecture]}
                containerStyle={styles.dropDownContainer}
                placeholderStyle={{fontSize:14}}
                selectedTextStyle={{fontSize:14}}
                itemTextStyle={{fontSize:14}}
                renderItem={(item)=>(
                  <View style={styles.dropItem}>
                    <Text style={styles.dropItemText}>{item.label}</Text>
                  </View>
                )}
                value={person_input.guarantor_address_prefecture}
                data={prefecture_list}
                onChange={(item) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_address_prefecture: item.value }));
                }}
                labelField="label"
                valueField="value"
              />
              <TouchableOpacity
                onPress={async()=>{
                  let address = person_input.guarantor_address_prefecture + person_input.guarantor_address_city;
                  const GA = await GetAddress("add",address);
                  if (GA) {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setPerson_Input(state => ({ ...state, guarantor_zipcode: GA[0].zipcode }));
                  }
                }}
                style={styles.addressBtn}
              >
                <Text style={styles.addressBtntxt}>住所から検索</Text>
              </TouchableOpacity>
              </View>
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_address_city: text }));
              }}
              value={person_input.guarantor_address_city}
              style={[styles.inputInner,person_err.guarantor_address_city]}
              placeholder="市区町村"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_address_number: text }));
              }}
              value={person_input.guarantor_address_number}
              style={[styles.inputInner,person_err.guarantor_address_number]}
              placeholder="丁目・番地"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_address_building: text }));
              }}
              value={person_input.guarantor_address_building}
              style={styles.inputInner}
              placeholder="建物名"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_address_room: text }));
              }}
              value={person_input.guarantor_address_room}
              style={styles.inputInner}
              placeholder="号室"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>住宅種別</Text>
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
              value={person_input.guarantor_residential_type}
              data={residential_type}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_residential_type: item.value }));
              }}
              labelField="label"
              valueField="value"
            />
            {person_input.guarantor_residential_type=="9"&&(
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_residential_type_text: text }));
                }}
                value={person_input.guarantor_residential_type_text}
                style={[styles.inputInner,{marginTop:5}]}
                placeholder="その他の内容を入力してください"
                placeholderTextColor="#b3b3b3"
              />
            )}
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>勤務先有無<Text style={styles.required}> ※</Text></Text>
            <Dropdown
              style={[styles.DropDown,person_err.guarantor_workplace]}
              containerStyle={styles.dropDownContainer}
              placeholderStyle={{fontSize:14}}
              selectedTextStyle={{fontSize:14}}
              itemTextStyle={{fontSize:14}}
              renderItem={(item)=>(
                <View style={styles.dropItem}>
                  <Text style={styles.dropItemText}>{item.label}</Text>
                </View>
              )}
              value={person_input.guarantor_workplace}
              data={workplace_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_workplace: item.value }));
              }}
              labelField="label"
              valueField="value"
              placeholder=""
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>業種</Text>
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
              value={person_input.guarantor_industry}
              data={industry_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_industry: item.value }));
              }}
              labelField="label"
              valueField="value"
              placeholder=""
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>職種</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_occupation: text }));
              }}
              value={person_input.guarantor_occupation}
              style={styles.inputInner}
              placeholder="営業、事務、技術など"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>職業</Text>
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
              value={person_input.guarantor_employment}
              data={employment_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_employment: item.value }));
              }}
              labelField="label"
              valueField="value"
              placeholder=""
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>所属部署</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_department: text }));
              }}
              value={person_input.guarantor_department}
              style={styles.inputInner}
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>役職</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_position: text }));
              }}
              value={person_input.guarantor_position}
              style={styles.inputInner}
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>勤務先 名称</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_belongs_name: text }));
              }}
              value={person_input.guarantor_belongs_name}
              style={styles.inputInner}
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>勤務先電話番号</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_belongs_tel: text }));
              }}
              value={person_input.guarantor_belongs_tel}
              style={[styles.inputInner,person_err.guarantor_belongs_tel]}
              placeholder="ハイフンあり"
              keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>勤務先所在地</Text>
            <View style={{flexDirection:'row'}}><Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></View>
            <View style={{flexDirection:'row'}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_belongs_zipcode: text }));
                }}
                value={person_input.guarantor_belongs_zipcode}
                style={[styles.inputInner,{width:"55%"},person_err.guarantor_belongs_zipcode]}
                placeholder="郵便番号 ハイフンあり"
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                placeholderTextColor="#b3b3b3"
              />
              <TouchableOpacity
                onPress={async()=>{
                  const GA = await GetAddress("zip",person_input.guarantor_belongs_zipcode);
                  if (GA) {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setPerson_Input(state => ({ ...state, guarantor_belongs_prefecture: GA.prefecture }));
                    setPerson_Input(state => ({ ...state, guarantor_belongs_city: GA.address }));
                  }
                }}
                style={styles.addressBtn}
              >
                <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.input}>
            <View style={{flexDirection:'row'}}>
              <Dropdown
                style={[styles.DropDown,{width:"55%"}]}
                containerStyle={styles.dropDownContainer}
                placeholderStyle={{fontSize:14}}
                selectedTextStyle={{fontSize:14}}
                itemTextStyle={{fontSize:14}}
                renderItem={(item)=>(
                  <View style={styles.dropItem}>
                    <Text style={styles.dropItemText}>{item.label}</Text>
                  </View>
                )}
                value={person_input.guarantor_belongs_prefecture}
                data={prefecture_list}
                onChange={(item) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_belongs_prefecture: item.value }));
                }}
                labelField="label"
                valueField="value"
              />
              <TouchableOpacity
                onPress={async()=>{
                  let address = person_input.guarantor_belongs_prefecture + person_input.guarantor_belongs_city;
                  const GA = await GetAddress("add",address);
                  if (GA) {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setPerson_Input(state => ({ ...state, guarantor_belongs_zipcode: GA[0].zipcode }));
                  }
                }}
                style={styles.addressBtn}
              >
                <Text style={styles.addressBtntxt}>住所から検索</Text>
              </TouchableOpacity>
              </View>
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_belongs_city: text }));
              }}
              value={person_input.guarantor_belongs_city}
              style={styles.inputInner}
              placeholder="市区町村"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_belongs_number: text }));
              }}
              value={person_input.guarantor_belongs_number}
              style={styles.inputInner}
              placeholder="丁目・番地"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_belongs_building: text }));
              }}
              value={person_input.guarantor_belongs_building}
              style={styles.inputInner}
              placeholder="建物名"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_belongs_room: text }));
              }}
              value={person_input.guarantor_belongs_room}
              style={styles.inputInner}
              placeholder="号室"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>勤続年数</Text>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, guarantor_belongs_period: text }));
              }}
              value={person_input.guarantor_belongs_period}
              style={styles.inputInner}
              keyboardType={"numeric"}
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>年収<Text style={styles.required}> ※</Text></Text>
            <View style={{flexDirection:'row'}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, guarantor_annual_income: text }));
                }}
                value={person_input.guarantor_annual_income}
                style={[styles.inputInner,{width:'50%'},person_err.guarantor_annual_income]}
                keyboardType={"numeric"}
                placeholder="数字のみで入力"
                placeholderTextColor="#b3b3b3"
              />
              <Text style={{marginHorizontal:5,alignSelf:'center'}}>万円</Text>
            </View>
          </View>
          {move_in.guarantee_company=="3"&&( // 日本セーフティ
            <View style={styles.input}>
              <Text style={styles.label}>月収</Text>
              <View style={{flexDirection:'row'}}>
                <TextInput
                  onChangeText={(text) => {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setPerson_Input(state => ({ ...state, guarantor_monthly_income: text }));
                  }}
                  value={person_input.guarantor_monthly_income}
                  style={[styles.inputInner,{width:'50%'}]}
                  keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                />
                <Text style={{marginHorizontal:5,alignSelf:'center'}}>万円</Text>
              </View>
            </View>
          )}
          {move_in.erc_send_flg != "1"&&(
            <View style={{flexDirection:'row',alignSelf: 'center'}}>
              <TouchableOpacity onPress={()=>{erc_customer_update_btn("2")}} style={styles.submit}>
                <Text style={styles.submitText}>保　存</Text>
              </TouchableOpacity>
              {move_in.guarantee_company != "1" || !move_in.erc_type || !move_in.agree_timestamp?(
                <></>
              ):(
                <TouchableOpacity onPress={()=>{erc_customer_send_btn("2")}} style={[styles.submit,{marginLeft:10}]}>
                  <Text style={styles.submitText}>えるく送信</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )
    } else if  (move_in.joint_guarantor=="2") {
      return (
        <>
          <Text style={styles.title}>━━━  緊急連絡先  ━━━</Text>
          <View style={styles.input}>
            <Text style={styles.label}>氏名<Text style={styles.required}> ※</Text></Text>
            <View style={{flexDirection:'row'}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, contact_family_name: text }));
                }}
                value={person_input.contact_family_name}
                style={[styles.inputInner,{width:'48%'},person_err.contact_family_name]}
                placeholder="性"
                placeholderTextColor="#b3b3b3"
              />
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, contact_first_name: text }));
                }}
                value={person_input.contact_first_name}
                style={[styles.inputInner,{width:'48%',marginLeft:'auto'},person_err.contact_first_name]}
                placeholder="名"
                placeholderTextColor="#b3b3b3"
              />
            </View>
            <View style={{flexDirection:'row',marginTop:5}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, contact_family_kana: text }));
                }}
                value={person_input.contact_family_kana}
                style={[styles.inputInner,{width:'48%'},person_err.contact_family_kana]}
                placeholder="セイ"
                placeholderTextColor="#b3b3b3"
              />
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, contact_first_kana: text }));
                }}
                value={person_input.contact_first_kana}
                style={[styles.inputInner,{width:'48%',marginLeft:'auto'},person_err.contact_first_kana]}
                placeholder="メイ"
                placeholderTextColor="#b3b3b3"
              />
            </View>
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>性別<Text style={styles.required}> ※</Text></Text>
            <RadioButtonRN
              data={gender_list}
              value={person_input.contact_gender}
              selectedBtn={(e) => setPerson_Input(state => ({ ...state, contact_gender: e.value }))}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              initial={person_input.contact_gender?person_input.contact_gender:-1}
              boxStyle={[styles.radio_box,{width:100},person_err.contact_gender]}
              style={{flexDirection:'row',marginVertical:5}}
              textStyle={{fontSize:14,marginLeft:10}}
              circleSize={11}
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>生年月日<Text style={styles.required}> ※</Text></Text>
            <TouchableOpacity
              style={[styles.inputInner,{flexDirection:'row'},person_err.contact_birthday]}
              onPress={()=>{
                setShow(true);
                setMode(5);
              }}
            >
              <Text style={{alignSelf:'center'}}>{person_input.contact_birthday?Moment(person_input.contact_birthday).format("YYYY-MM-DD"):""}</Text>
              <TouchableOpacity
                style={{alignSelf:'center',marginLeft:'auto'}}
                onPress={()=>ClearDateTime(5)}
              >
                <Feather name='x-circle' color='#ccc' size={25} />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>続柄</Text>
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
              value={person_input.contact_relationship}
              data={relationship_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, contact_relationship: item.value }));
              }}
              labelField="label"
              valueField="value"
              placeholder=""
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>自宅電話番号<Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>自宅/携帯のどちらか必須</Text></Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, contact_tel: text }));
                }}
                value={person_input.contact_tel}
                style={[styles.inputInner,person_err.contact_tel]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                placeholder="ハイフンあり"
                placeholderTextColor="#b3b3b3"
              />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>携帯電話番号<Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>自宅/携帯のどちらか必須</Text></Text>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, contact_mobile: text }));
                }}
                value={person_input.contact_mobile}
                style={[styles.inputInner,person_err.contact_mobile]}
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                placeholder="ハイフンあり"
                placeholderTextColor="#b3b3b3"
              />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>現住所<Text style={styles.required}> ※</Text></Text>
            <View style={{flexDirection:'row'}}><Text style={styles.required}> ※</Text><Text style={{color:'red',fontSize:12}}>ハイフンありで入力してください</Text></View>
            <View style={{flexDirection:'row'}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, contact_zipcode: text }));
                }}
                value={person_input.contact_zipcode}
                style={[styles.inputInner,{width:"55%"},person_err.contact_zipcode]}
                placeholder="郵便番号 ハイフンあり"
                keyboardType={Platform.OS === 'ios'?"numbers-and-punctuation":"numeric"}
                placeholderTextColor="#b3b3b3"
              />
              <TouchableOpacity
                onPress={async()=>{
                  const GA = await GetAddress("zip",person_input.contact_zipcode);
                  if (GA) {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setPerson_Input(state => ({ ...state, contact_address_prefecture: GA.prefecture }));
                    setPerson_Input(state => ({ ...state, contact_address_city: GA.address }));
                  }
                }}
                style={styles.addressBtn}
              >
                <Text style={styles.addressBtntxt}>郵便番号から検索</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.input}>
            <View style={{flexDirection:'row'}}>
              <Dropdown
                style={[styles.DropDown,{width:"55%"},person_err.contact_address_prefecture]}
                containerStyle={styles.dropDownContainer}
                placeholderStyle={{fontSize:14}}
                selectedTextStyle={{fontSize:14}}
                itemTextStyle={{fontSize:14}}
                renderItem={(item)=>(
                  <View style={styles.dropItem}>
                    <Text style={styles.dropItemText}>{item.label}</Text>
                  </View>
                )}
                value={person_input.contact_address_prefecture}
                data={prefecture_list}
                onChange={(item) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, contact_address_prefecture: item.value }));
                }}
                labelField="label"
                valueField="value"
              />
              <TouchableOpacity
                onPress={async()=>{
                  let address = person_input.contact_address_prefecture + person_input.contact_address_city;
                  const GA = await GetAddress("add",address);
                  if (GA) {
                    setChange_flg(state => ({ ...state, customer: 1 }));
                    setPerson_Input(state => ({ ...state, contact_zipcode: GA[0].zipcode }));
                  }
                }}
                style={styles.addressBtn}
              >
                <Text style={styles.addressBtntxt}>住所から検索</Text>
              </TouchableOpacity>
              </View>
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, contact_address_city: text }));
              }}
              value={person_input.contact_address_city}
              style={[styles.inputInner,person_err.contact_address_city]}
              placeholder="市区町村"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, contact_address_number: text }));
              }}
              value={person_input.contact_address_number}
              style={[styles.inputInner,person_err.contact_address_number]}
              placeholder="丁目・番地"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, contact_address_building: text }));
              }}
              value={person_input.contact_address_building}
              style={styles.inputInner}
              placeholder="建物名"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <TextInput
              onChangeText={(text) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, contact_address_room: text }));
              }}
              value={person_input.contact_address_room}
              style={styles.inputInner}
              placeholder="号室"
              placeholderTextColor="#b3b3b3"
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>住宅種別</Text>
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
              value={person_input.contact_residential_type}
              data={residential_type}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, contact_residential_type: item.value }));
              }}
              labelField="label"
              valueField="value"
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>勤務先有無<Text style={styles.required}> ※</Text></Text>
            <Dropdown
              style={[styles.DropDown,person_err.contact_workplace]}
              containerStyle={styles.dropDownContainer}
              placeholderStyle={{fontSize:14}}
              selectedTextStyle={{fontSize:14}}
              itemTextStyle={{fontSize:14}}
              renderItem={(item)=>(
                <View style={styles.dropItem}>
                  <Text style={styles.dropItemText}>{item.label}</Text>
                </View>
              )}
              value={person_input.contact_workplace}
              data={workplace_list}
              onChange={(item) => {
                setChange_flg(state => ({ ...state, customer: 1 }));
                setPerson_Input(state => ({ ...state, contact_workplace: item.value }));
              }}
              labelField="label"
              valueField="value"
              placeholder=""
            />
          </View>
          <View style={styles.input}>
            <Text style={styles.label}>年収<Text style={styles.required}> ※</Text></Text>
            <View style={{flexDirection:'row'}}>
              <TextInput
                onChangeText={(text) => {
                  setChange_flg(state => ({ ...state, customer: 1 }));
                  setPerson_Input(state => ({ ...state, contact_annual_income: text }));
                }}
                value={person_input.contact_annual_income}
                style={[styles.inputInner,{width:'50%'},person_err.contact_annual_income]}
                keyboardType={"numeric"}
                placeholder="数字のみで入力"
                placeholderTextColor="#b3b3b3"
              />
              <Text style={{marginHorizontal:5,alignSelf:'center'}}>万円</Text>
            </View>
          </View>
          {move_in.erc_send_flg != "1"&&(
            <View style={{flexDirection:'row',alignSelf: 'center'}}>
              <TouchableOpacity onPress={()=>{erc_customer_update_btn("2")}} style={styles.submit}>
                <Text style={styles.submitText}>保　存</Text>
              </TouchableOpacity>
              {move_in.guarantee_company != "1" || !move_in.erc_type || !move_in.agree_timestamp?(
                <></>
              ):(
                <TouchableOpacity onPress={()=>{erc_customer_send_btn("2")}} style={[styles.submit,{marginLeft:10}]}>
                  <Text style={styles.submitText}>えるく送信</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </>
      )
    }

  },[move_in,person_input,show,mode,person_err,resident,resident_err,filedata1,filedata2,change_flg]);
  // ----- 入力内容 END -----

  // ----- 登録系関数 START -----
  // 物件情報登録
  async function erc_data_create_btn() {

    let error_text = error_check();
    if(error_text != ""){
      let msg = "▼ 以下のエラーが発生しています";
      Alert.alert("",msg + error_text);
      return false;
    }

    let input_data = {};

    input_data["user_type"]           = move_in.user_type;
    input_data["resident_type"]       = move_in.resident_type;
    input_data["joint_guarantor"]     = move_in.joint_guarantor;
    input_data["guarantee_company"]   = move_in.guarantee_company;
    input_data["erc_type"]            = move_in.erc_type;
    
    input_data["article_name"]        = move_in.article_name;
    input_data["article_kana"]        = move_in.article_kana;
    input_data["room_no"]             = move_in.room_no;
    input_data["zipcode"]             = move_in.zipcode;
    input_data["address_prefecture"]  = move_in.address_prefecture;
    input_data["address_city"]        = move_in.address_city;
    input_data["address_number"]      = move_in.address_number;
    input_data["address_kana"]        = move_in.address_kana;
    input_data["move_in_date"]        = move_in.move_in_date;
    
    input_data["rent"]                = !move_in.rent ? "null" : move_in.rent;
    input_data["management_fee"]      = !move_in.management_fee ? "null" : move_in.management_fee;
    input_data["bicycle_parking_fee"] = !move_in.bicycle_parking_fee ? "null" : move_in.bicycle_parking_fee;
    input_data["town_fee"]            = !move_in.town_fee ? "null" : move_in.town_fee;
    input_data["water_fee"]           = !move_in.water_fee ? "null" : move_in.water_fee;
    input_data["bike_parking_fee"]    = !move_in.bike_parking_fee ? "null" : move_in.bike_parking_fee;
    input_data["parking_no"]          = move_in.parking_no;
    input_data["parking_fee"]         = !move_in.parking_fee ? "null" : move_in.parking_fee;
    
    input_data["other_item"]          = move_in.other_item;
    input_data["other_fee"]           = !move_in.other_fee ? "null" : move_in.other_fee;
    input_data["other_item2"]         = move_in.other_item2;
    input_data["other_fee2"]          = !move_in.other_fee2 ? "null" : move_in.other_fee2;
    
    input_data["initial_cost_type"]   = move_in.initial_cost_type;
    input_data["deposit"]             = !move_in.deposit ? "null" : move_in.deposit;
    input_data["reward"]              = !move_in.reward ? "null" : move_in.reward;

    let formData = new FormData();
    formData.append('shop_id',route.params.shop_id);
    formData.append('customer_id',route.customer);
    formData.append('act', "setErcData");
    formData.append('app_flg', "1");
    formData.append('data', JSON.stringify(input_data));

    const setErcData = (data) => {
      return new Promise((resolve, reject)=>{
        fetch(domain+'php/ajax/erc_move_in.php',
        {
          method: 'POST',
          body: data,
          header: {
            'content-type': 'multipart/form-data',
          },
        })
        .then((response) => response.json())
        .then((json) => {
          resolve(true);
        })
        .catch((error) => {
          resolve(false);
        });
      })
    }

    if (await setErcData(formData)) {
      Alert.alert('','登録が完了しました')
    } else {
      Alert.alert('','登録に失敗しました')
    }

    setChange_flg(state => ({ ...state, content: "", article: "" }));

    return;

  }

  // 物件情報エラーチェック
  function error_check() {

    // 【正規表現】 数字のみ
    let pattern_number = /^([1-9]\d*|0)$/;
    
    // 【正規表現】 郵便番号
    let regex_zipcode = /^\d{3}-\d{4}$/;
    
    let error_text = "";

    const resetError = Object.keys(move_in_err).reduce((mie, key) => {
      mie[key] = "";
      return mie;
    }, {});

    setMove_in_err(resetError);

    // 契約種別
    if (!move_in.user_type) {
      setMove_in_err(state => ({ ...state, user_type: {backgroundColor:'pink'} }));
      error_text += "\n・「個人」か「法人」のどちらかにチェックをしてください";
    }

    // 連帯保証人
    if (!move_in.joint_guarantor) {
      setMove_in_err(state => ({ ...state, joint_guarantor: {backgroundColor:'pink'} }));
      error_text += "\n・連帯保証人のチェックをしてください";
    }

    // 住居用途
    if (!move_in.resident_type) {
      setMove_in_err(state => ({ ...state, resident_type: {backgroundColor:'pink'} }));
      error_text += "\n・住居用途を選択してください";
    }

    // えるく審査申込
    if (move_in.guarantee_company == "1" && !move_in.erc_type) {
      setMove_in_err(state => ({ ...state, erc_type: {backgroundColor:'pink'} }));
      error_text += "\n・「えるく」と連携させる場合は型を選択してください";
    }

    // 物件名
    if (move_in.article_name == "") {
      setMove_in_err(state => ({ ...state, article_name: {backgroundColor:'pink'} }));
      error_text += "\n・物件名を入力してください";
    }

    // 物件名 フリガナ
    if (move_in.article_kana == "") {
      setMove_in_err(state => ({ ...state, article_kana: {backgroundColor:'pink'} }));
      error_text += "\n・物件名 フリガナを入力してください";
    }

    // 号室
    if (move_in.room_no == "") {
      setMove_in_err(state => ({ ...state, room_no: {backgroundColor:'pink'} }));
      error_text += "\n・号室を入力してください";
    }

    // 郵便番号
    if (move_in.zipcode == "") {
      setMove_in_err(state => ({ ...state, zipcode: {backgroundColor:'pink'} }));
      error_text += "\n・郵便番号を入力してください";
    } else if (!(move_in.zipcode).match(regex_zipcode)){
      setMove_in_err(state => ({ ...state, zipcode: {backgroundColor:'pink'} }));
      error_text += "\n・郵便番号が正しい形式で入力されていません";
    }

    // 物件住所
    let address_check = 0;
    if(move_in.address_prefecture == ""){
      setMove_in_err(state => ({ ...state, address_prefecture: {backgroundColor:'pink'} }));
      address_check = 1;
    }
    if(move_in.address_city == ""){
      setMove_in_err(state => ({ ...state, address_city: {backgroundColor:'pink'} }));
      address_check = 1;
    }
    if(move_in.address_number == ""){
      setMove_in_err(state => ({ ...state, address_number: {backgroundColor:'pink'} }));
      address_check = 1;
    }
    if(move_in.address_kana == ""){
      setMove_in_err(state => ({ ...state, address_kana: {backgroundColor:'pink'} }));
      address_check = 1;
    }
    if(address_check == 1){
      error_text += "\n・物件住所を入力してください";
    }

    // 家賃
    if (move_in.rent == "") {
      setMove_in_err(state => ({ ...state, rent: {backgroundColor:'pink'} }));
      error_text += "\n・家賃を入力してください";
    } else if(move_in.rent && !(move_in.rent).match(pattern_number)){
      setMove_in_err(state => ({ ...state, rent: {backgroundColor:'pink'} }));
      error_text += "\n・家賃は 0 以上の数値で入力してください";
    }

    // 共益費
    if (move_in.management_fee == "") {
      setMove_in_err(state => ({ ...state, management_fee: {backgroundColor:'pink'} }));
      error_text += "\n・共益費を入力してください";
    } else if(move_in.management_fee && !(move_in.management_fee).match(pattern_number)){
      setMove_in_err(state => ({ ...state, management_fee: {backgroundColor:'pink'} }));
      error_text += "\n・共益費は 0 以上の数値で入力してください";
    }

    // 駐輪場代
    if(move_in.bicycle_parking_fee && !(move_in.bicycle_parking_fee).match(pattern_number)){
      setMove_in_err(state => ({ ...state, bicycle_parking_fee: {backgroundColor:'pink'} }));
      error_text += "\n・駐輪場代は 0 以上の数値で入力してください";
    }

    // 町会費
    if(move_in.town_fee && !(move_in.town_fee).match(pattern_number)){
      setMove_in_err(state => ({ ...state, town_fee: {backgroundColor:'pink'} }));
      error_text += "\n・町会費は 0 以上の数値で入力してください";
    }

    // 水道代
    if(move_in.water_fee && !(move_in.water_fee).match(pattern_number)){
      setMove_in_err(state => ({ ...state, water_fee: {backgroundColor:'pink'} }));
      error_text += "\n・水道代は 0 以上の数値で入力してください";
    }

    // バイク駐輪代
    if(move_in.bike_parking_fee && !(move_in.bike_parking_fee).match(pattern_number)){
      setMove_in_err(state => ({ ...state, bike_parking_fee: {backgroundColor:'pink'} }));
      error_text += "\n・バイク駐輪代は 0 以上の数値で入力してください";
    }

    // 駐車場
    if(move_in.parking_fee && !(move_in.parking_fee).match(pattern_number)){
      setMove_in_err(state => ({ ...state, parking_fee: {backgroundColor:'pink'} }));
      error_text += "\n・駐車場は 0 以上の数値で入力してください";
    }

    // その他費用
    if(move_in.other_item != "" && move_in.other_fee == ""){
      setMove_in_err(state => ({ ...state, other_fee: {backgroundColor:'pink'} }));
      error_text += "\n・"+move_in.other_item+"の金額を入力してください";
    }else if(move_in.other_item == "" && move_in.other_fee != "" && move_in.other_fee != null){
      setMove_in_err(state => ({ ...state, other_item: {backgroundColor:'pink'} }));
      error_text += "\n・「その他1 名目」を入力してください";
    }else if(move_in.other_fee && !(move_in.other_fee).match(pattern_number)){
      setMove_in_err(state => ({ ...state, other_fee: {backgroundColor:'pink'} }));
      error_text += "\n・その他1の金額は 0 以上の数値で入力してください";
    }

    // その他費用2
    if(move_in.other_item2 != "" && move_in.other_fee2 == ""){
      setMove_in_err(state => ({ ...state, other_fee2: {backgroundColor:'pink'} }));
      error_text += "\n・"+move_in.other_item2+"の金額を入力してください";
    }else if(move_in.other_item2 == "" && move_in.other_fee2 != "" && move_in.other_fee2 != null){
      setMove_in_err(state => ({ ...state, other_item2: {backgroundColor:'pink'} }));
      error_text += "\n・「その他2 名目」を入力してください";
    }else if(move_in.other_fee2 && !(move_in.other_fee2).match(pattern_number)){
      setMove_in_err(state => ({ ...state, other_fee2: {backgroundColor:'pink'} }));
      error_text += "\n・その他2の金額は 0 以上の数値で入力してください";
    }

    // 敷金・保証金
    let deposit_text = move_in.initial_cost_type == "1" ? "敷金" : "保証金";
    if(move_in.deposit && !(move_in.deposit).match(pattern_number)){
      setMove_in_err(state => ({ ...state, deposit: {backgroundColor:'pink'} }));
      error_text += "\n・" + deposit_text + "は 0 以上の数値で入力してください";
    }

    // 礼金・敷引
    let reward_text = move_in.initial_cost_type == "1" ? "礼金" : "敷引";
    if(move_in.reward && !(move_in.reward).match(pattern_number)){
      setMove_in_err(state => ({ ...state, reward: {backgroundColor:'pink'} }));
      error_text += "\n・" + reward_text + "は 0 以上の数値で入力してください";
    }

    return error_text;

  }

  // 申込情報登録
  async function erc_customer_update_btn(user_type) {

    let error_text = erc_error_check(user_type);
    if(error_text != ""){
      let msg = "▼ 以下のエラーが発生しています";
      Alert.alert("",msg + error_text);
      return false;
    }

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        ``,
        "申込情報を保存します\nよろしいですか？",
        [
          {
            text: "はい",
            onPress:() => {resolve(true);}
          },
          {
            text: "いいえ",
            style: "cancel",
            onPress:() => {resolve(false);}
          }
        ]
      );
    });

    if (!await AsyncAlert()) {
      return;
    }
    
    let inputdata1 = {};
    if (user_type == "1") { // 法人 
      inputdata1 = company_input;
    } else if (user_type == "2") { // 個人
      inputdata1 = person_input;
    }

    let registration = {};
    let registration2 = {};
    let type = user_type == "1" ? "company" : "person";

    // 入居者以外
    Object.keys(inputdata1).forEach(function (key) {

      if (key == "customer_id" || key == "ins_dt" || key == "upd_dt") return;

      var val = inputdata1[key] == null || inputdata1[key] == "null" ? "" : inputdata1[key];

      // 日付系変換
      if (val != "" && (key == "person_birthday" || key == "guarantor_birthday" || key == "contact_birthday" || key == "company_establishment" || key == "representative_birthday" || key == "guarantor_birthday")) {
        val = Moment(val).format("YYYY-MM-DD");
      }
      
      // 万単位で入力された数値の単位を戻す
      if (val != "" && (key == "person_annual_income" || key == "person_monthly_income" || key == "guarantor_annual_income" || key == "guarantor_monthly_income" || key == "contact_annual_income")) {
        val = Number(val) * 10000;
      }

      registration[key] = val;

    });

    // 入居者
    resident.forEach((resi, index) => {
      registration2[index + 1] = {};
      
      for (let key in resi) {
    
        if (key === "customer_id" || key === "type" || key === "no") continue;
    
        let val = resi[key] == null || resi[key] == "null" ? "" : resi[key];
    
        if (val !== "" && key === "resident_birthday") {
          val = Moment(val).format("YYYY-MM-DD");
        }

        if (val !== "" && key === "resident_annual_income") {
          val = Number(val) * 10000;
        }
    
        registration2[index+1][key] = val;
      }
    });

    // 申込情報
    let formData = new FormData();
    formData.append('act', "setErcData");
    formData.append('customer_id',route.customer);
    formData.append('type', type);
    formData.append('registration', JSON.stringify(registration));
    formData.append('resident', JSON.stringify(registration2));
    formData.append('app_flg', "1");
    
    // 本人確認書類(画像)を保存
    let formData2 = new FormData();
    formData2.append('act', "setErcImage");
    formData2.append('customer_id',route.customer);
    formData2.append('app_flg', "1");

    if (filedata1) {
      let filename = filedata1.assets[0].uri.split('/').pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      formData2.append('images[]', { uri: filedata1.assets[0].uri, name: filename, type });
    }

    if (filedata2) {
      let filename = filedata2.assets[0].uri.split('/').pop();
      let match = /\.(\w+)$/.exec(filename);
      let type = match ? `image/${match[1]}` : `image`;
      formData2.append('images[]', { uri: filedata2.assets[0].uri, name: filename, type });
    }

    // 更新
    const setErcData = (data) => {
      return new Promise((resolve, reject)=>{
        fetch(domain+'erc/php/ajax/user_form.php',
        {
          method: 'POST',
          body: data,
          header: {
            'content-type': 'multipart/form-data',
          },
        })
        .then((response) => response.json())
        .then((json) => {
          resolve(true);
        })
        .catch((error) => {
          resolve(false);
        });
      })
    }

    if (await setErcData(formData)) {
      if (await setErcData(formData2)) {
        Alert.alert('','登録が完了しました')
      } else {
        Alert.alert('','登録に失敗しました')
      }
    } else {
      Alert.alert('','登録に失敗しました')
    }

    setChange_flg(state => ({ ...state, customer: "" }));

    await Display();

  }

  // えるく送信
  async function erc_customer_send_btn(user_type) {

    let article_check = error_check();
    let check_result = erc_error_check(user_type);
    if(article_check || check_result){
      let msg = "▼ 以下のエラーが発生しています";
      Alert.alert("",msg + article_check + check_result);
      return false;
    }

    //  入力値が変更されている場合は送信確認前にもう一つ確認を入れる
    var change_text = "";
    var change_btn1 = "";
    var change_btn2 = "";

    if (change_flg.content != "") {
      change_text += "【入居申込書作成】";
      change_btn1 = "『登録』";
    }
    if (change_flg.article != "") {
      change_text += "【物件情報】";
      change_btn1 = "『登録』";
    }
    if (change_flg.customer != "") {
      change_text += "【申込情報】";
      change_btn2 = "『保存』";
    }

    if(change_text){
      let change_btn = change_btn1 + change_btn2;
      change_text += "で入力されている内容が保存されずに変更されている可能性があるため、" + change_btn + "ボタンを押して保存してから再度送信してください";
      change_text = "送信エラーが発生しました\n\n" + change_text;
      Alert.alert("",change_text);
      return false;
    }

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        ``,
        "えるくに申込情報を送信します\nよろしいですか？",
        [
          {
            text: "はい",
            onPress:() => {resolve(true);}
          },
          {
            text: "いいえ",
            style: "cancel",
            onPress:() => {resolve(false);}
          }
        ]
      );
    });

    if (!await AsyncAlert()) {
      return;
    }

    setLoading(true);

    let type = user_type == "1" ? "company" : "person";

    let formData = new FormData();
    formData.append('shop_id',route.params.shop_id);
    formData.append('customer_id',route.customer);
    formData.append('act', "sendErc");
    formData.append('type', type);
    formData.append('app_flg', "1");

    const sendErc = (data) => {
      return new Promise((resolve, reject)=>{
        fetch(domain+'php/ajax/erc_move_in.php',
        {
          method: 'POST',
          body: data,
          header: {
            'content-type': 'multipart/form-data',
          },
        })
        .then((response) => response.json())
        .then((json) => {
          resolve(json);
        })
        .catch((error) => {
          resolve(false);
        });
      })
    }

    let rslt = await sendErc(formData);

    if (rslt["resultCd"] == "OK") {

      let filename = "ident" + rslt["mosiNo"];
      
      // 画像があればZIP圧縮する
      let send_zip = "";
      if(rslt["images"].length > 0){

        let zip = new JSZip();
        let img = zip.folder(filename);

        rslt["images"].forEach((img_data,i)=>{
          img.file("ident" + ("00" + (Number(i)+1)).slice(-2) + ".jpg", img_data, {base64: true});
        })

        zip.generateAsync({type:"base64"}).then(async function(content){
          send_zip = content;
          
          // ZIP送信
          let FD = new FormData();
          FD.append('act', "sendImageErc");
          FD.append("data", JSON.stringify(rslt));
          FD.append('zip', send_zip);
          FD.append('app_flg', "1");

          await sendErc(FD);

          // 送信に成功したら送信済フラグを登録する
          let FD2 = new FormData();
          FD2.append('act', "inputEnd");
          FD2.append('customer_id',route.customer);
          FD2.append('erc_flg', 0);
          FD2.append('app_flg', "1");

          const inputEnd = await sendErc(FD2);

          if (inputEnd != false) {
            Alert.alert('','送信が完了しました');
            setLoading(false);
            await Display();
          } else {
            Alert.alert('','送信に失敗しました');
            setLoading(false);
          }

        })

      } else {
        Alert.alert('','本人確認書類の送信に失敗しました');
        setLoading(false);
      }

    } else {
      Alert.alert('','送信に失敗しました');
      setLoading(false);
    }
  }

  // 申込情報エラーチェック
  function erc_error_check(user_type) {
    
    // 【正規表現】 電話番号
    let regex_tel = /^\d{1,5}-\d{1,4}-\d{4,5}$/;
    
    // 【正規表現】 郵便番号
    let regex_zipcode = /^\d{3}-\d{4}$/;

    let error_text = "";

    const resetErrorCompany = Object.keys(company_err).reduce((ce, key) => {
      ce[key] = "";
      return ce;
    }, {});
    setCompany_Err(resetErrorCompany);

    const resetErrorPerson = Object.keys(person_err).reduce((pe, key) => {
      pe[key] = "";
      return pe;
    }, {});
    setPerson_Err(resetErrorPerson);

    var resetErrorResident = resident_err.map((resi)=> {
      return Object.keys(resi).reduce((re, key) => {
        re[key] = "";
        return re;
      }, {});
    })

    if (user_type == "1") { // [基本情報：法人]

      // 【基本情報】会社名
      if (company_input.company_name == "") {
        setCompany_Err(state => ({ ...state, company_name: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】会社名を入力してください";
      }

      // 【基本情報】会社名 フリガナ
      if (company_input.company_kana == "") {
        setCompany_Err(state => ({ ...state, company_kana: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】会社名 フリガナを入力してください";
      }

      // 【基本情報】物件住所:郵便番号
      if (company_input.company_zipcode == "") {
        setCompany_Err(state => ({ ...state, company_zipcode: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】物件住所:郵便番号を入力してください";
      } else if (!(company_input.company_zipcode).match(regex_zipcode)) {
        setCompany_Err(state => ({ ...state, company_zipcode: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】物件住所:郵便番号が正しい形式で入力されていません";
      }

      // 【基本情報】物件住所:都道府県
      if (company_input.company_address_prefecture == "") {
        setCompany_Err(state => ({ ...state, company_address_prefecture: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】物件住所:都道府県を入力してください";
      }
      
      // 【基本情報】物件住所:市区町村
      if (company_input.company_address_city == "") {
        setCompany_Err(state => ({ ...state, company_address_city: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】物件住所:市区町村を入力してください";
      }
      
      // 【基本情報】物件住所:丁目・番地
      if (company_input.company_address_number == "") {
        setCompany_Err(state => ({ ...state, company_address_number: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】物件住所:丁目・番地を入力してください";
      }

      // 【基本情報】本社電話番号
      if (company_input.company_tel != "" && !(company_input.company_tel).match(regex_tel)) {
        setCompany_Err(state => ({ ...state, company_tel: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】本社電話番号が正しい形式で入力されていません";
      }

      // 【会社代表者】氏名:姓
      if (company_input.representative_family_name == "") {
        setCompany_Err(state => ({ ...state, representative_family_name: {backgroundColor:'pink'} }));
        error_text += "\n・【会社代表者】氏名:姓を入力してください";
      }

      // 【会社代表者】氏名:名
      if (company_input.representative_first_name == "") {
        setCompany_Err(state => ({ ...state, representative_first_name: {backgroundColor:'pink'} }));
        error_text += "\n・【会社代表者】氏名:名を入力してください";
      }
      
      // 【会社代表者】氏名:セイ
      if (company_input.representative_family_kana == "") {
        setCompany_Err(state => ({ ...state, representative_family_kana: {backgroundColor:'pink'} }));
        error_text += "\n・【会社代表者】氏名:セイを入力してください";
      }

      // 【会社代表者】氏名:メイ
      if (company_input.representative_first_kana == "") {
        setCompany_Err(state => ({ ...state, representative_first_kana: {backgroundColor:'pink'} }));
        error_text += "\n・【会社代表者】氏名:メイを入力してください";
      }

      // 【会社代表者】携帯電話番号
      if (company_input.representative_tel != "" && !(company_input.representative_tel).match(regex_tel)) {
        setCompany_Err(state => ({ ...state, representative_tel: {backgroundColor:'pink'} }));
        error_text += "\n・【会社代表者】携帯電話番号が正しい形式で入力されていません";
      }

      // 【会社代表者】現住所:郵便番号
      if (company_input.representative_zipcode != null && company_input.representative_zipcode != "" && !(company_input.representative_zipcode).match(regex_zipcode)) {
        setCompany_Err(state => ({ ...state, representative_zipcode: {backgroundColor:'pink'} }));
        error_text += "\n・【会社代表者】現住所:郵便番号が正しい形式で入力されていません";
      }

      // 【担当者】携帯電話番号
      if (company_input.staff_tel != "" && !(company_input.staff_tel).match(regex_tel)) {
        setCompany_Err(state => ({ ...state, staff_tel: {backgroundColor:'pink'} }));
        error_text += "\n・【担当者】携帯電話番号が正しい形式で入力されていません";
      }

    } else if (user_type == "2") { // [基本情報：個人]

      // 【基本情報】氏名:姓
      if (person_input.person_family_name == "") {
        setPerson_Err(state => ({ ...state, person_family_name: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】氏名:姓を入力してください";
      }

      // 【基本情報】氏名:名
      if (person_input.person_first_name == "") {
        setPerson_Err(state => ({ ...state, person_first_name: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】氏名:名を入力してください";
      }

      // 【基本情報】氏名:セイ
      if (person_input.person_family_kana == "") {
        setPerson_Err(state => ({ ...state, person_family_kana: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】氏名:セイを入力してください";
      }

      // 【基本情報】氏名:メイ
      if (person_input.person_first_kana == "") {
        setPerson_Err(state => ({ ...state, person_first_kana: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】氏名:メイを入力してください";
      }

      // 【基本情報】性別
      if (person_input.person_gender == null || person_input.person_gender == "") {
        setPerson_Err(state => ({ ...state, person_gender: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】性別を入力してください";
      }

      // 【基本情報】生年月日
      if (person_input.person_birthday == "") {
        setPerson_Err(state => ({ ...state, person_birthday: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】生年月日を入力してください";
      }

      // 【基本情報】自宅電話番号/携帯電話番号
      if (person_input.person_tel == "" && person_input.person_mobile == "") {
        setPerson_Err(state => ({
          ...state,
          person_tel: {backgroundColor:'pink'},
          person_mobile: {backgroundColor:'pink'},
        }));
        error_text += "\n・【基本情報】自宅/携帯 電話番号のどちらかは必須入力です";
      } else if (person_input.person_tel != "" && !(person_input.person_tel).match(regex_tel)) {
        // 【基本情報】自宅電話番号
        setPerson_Err(state => ({ ...state, person_tel: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】自宅電話番号が正しい形式で入力されていません";
      } else if (person_input.person_mobile != "" && !(person_input.person_mobile).match(regex_tel)) {
        // 【基本情報】携帯電話番号
        setPerson_Err(state => ({ ...state, person_mobile: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】携帯電話番号が正しい形式で入力されていません";
      }
      
      // 【基本情報】現住所:郵便番号
      if (person_input.person_zipcode == "") {
        setPerson_Err(state => ({ ...state, person_zipcode: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】現住所:郵便番号を入力してください";
      } else if (!(person_input.person_zipcode).match(regex_zipcode)) {
        setPerson_Err(state => ({ ...state, person_zipcode: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】現住所:郵便番号が正しい形式で入力されていません";
      }

      // 【基本情報】現住所:都道府県
      if (person_input.person_address_prefecture == "") {
        setPerson_Err(state => ({ ...state, person_address_prefecture: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】現住所:都道府県を入力してください";
      }
      
      // 【基本情報】現住所:市区町村
      if (person_input.person_address_city == "") {
        setPerson_Err(state => ({ ...state, person_address_city: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】現住所:市区町村を入力してください";
      }
      
      // 【基本情報】現住所:丁目・番地
      if (person_input.person_address_number == "") {
        setPerson_Err(state => ({ ...state, person_address_number: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】現住所:丁目・番地を入力してください";
      }
      
      // 【基本情報】勤務先有無
      if (person_input.person_workplace == "") {
        setPerson_Err(state => ({ ...state, person_workplace: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】勤務先有無を入力してください";
      }
      
      // 【基本情報】勤務先/学校 名称
      if (person_input.person_workplace == "1" && person_input.person_belongs_name == "") {
        setPerson_Err(state => ({ ...state, person_belongs_name: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】勤務先/学校 名称を入力してください";
      }
      
      // 【基本情報】勤務先:郵便番号
      if (person_input.person_workplace == "1" && person_input.person_belongs_zipcode == "") {
        setPerson_Err(state => ({ ...state, person_belongs_zipcode: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】勤務先:郵便番号を入力してください";
      } else if (person_input.person_workplace == "1" && !(person_input.person_belongs_zipcode).match(regex_zipcode)) {
        setPerson_Err(state => ({ ...state, person_belongs_zipcode: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】勤務先:郵便番号が正しい形式で入力されていません";
      }

      // 【基本情報】勤務先:都道府県
      if (person_input.person_workplace == "1" && person_input.person_belongs_prefecture == "") {
        setPerson_Err(state => ({ ...state, person_belongs_prefecture: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】勤務先:都道府県を入力してください";
      }
      
      // 【基本情報】勤務先:市区町村
      if (person_input.person_workplace == "1" && person_input.person_belongs_city == "") {
        setPerson_Err(state => ({ ...state, person_belongs_city: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】勤務先:市区町村を入力してください";
      }
      
      // 【基本情報】勤務先:丁目・番地
      if (person_input.person_workplace == "1" && person_input.person_belongs_number == "") {
        setPerson_Err(state => ({ ...state, person_belongs_number: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】勤務先:丁目・番地を入力してください";
      }

      // 【基本情報】年収
      if (person_input.person_annual_income == "") {
        setPerson_Err(state => ({ ...state, person_annual_income: {backgroundColor:'pink'} }));
        error_text += "\n・【基本情報】年収を入力してください";
      }

    }

    // [入居者]

    //================================================================
    // 
    // 入居者のデータが一つでも入っていれば名前、フリガナをエラーにする
    // 
    //================================================================
    
    for (var i=0;i<resident.length;i++) {

      var resi = resident[i];

      let resident_error_check_flg = 0;
  
      // 【入力チェック】 氏名
      if(resi.resident_family_name || resi.resident_first_name){
        resident_error_check_flg = 1;
      }
  
      // 【入力チェック】 氏名フリガナ
      if(resi.resident_family_kana || resi.resident_first_kana){
        resident_error_check_flg = 1;
      }
  
      // 【入力チェック】 生年月日
      if(resi.resident_birthday){
        resident_error_check_flg = 1;
      }
      
      // 【入力チェック】 続柄
      if(resi.resident_relationship){
        resident_error_check_flg = 1;
      }
      
      // 【入力チェック】 携帯電話番号
      if(resi.resident_mobile){
        resident_error_check_flg = 1;
      }
      
      // 【入力チェック】 勤務先/学校 名称
      if(resi.resident_belongs_name){
        resident_error_check_flg = 1;
      }
      
      // 【入力チェック】 勤務先所在地
      if(resi.resident_zipcode || resi.resident_prefecture || resi.resident_city || resi.resident_number || resi.resident_building || resi.resident_room){
        resident_error_check_flg = 1;
      }
      
      // 【入力チェック】 勤務先電話番号
      if(resi.resident_belongs_tel){
        resident_error_check_flg = 1;
      }
      
      // 【入力チェック】 所属部署/役職
      if(resi.resident_department){
        resident_error_check_flg = 1;
      }
      
      // 【入力チェック】 業種
      if(resi.resident_industry){
        resident_error_check_flg = 1;
      }
      
      //----------------------------------------------------------------
      // 
      // いずれかの項目で入力があったためエラーチェックを行う
      // 
      //----------------------------------------------------------------
      
      var title = "入居者";
      if (i == 0) title += "①";
      else if (i == 1) title += "②";
      else if (i == 2) title += "③";
      else if (i == 3) title += "④";

      var name_flg = 0;

      // 【入居者】氏名(性)
      if(resident_error_check_flg == 1 && !resi.resident_family_name){
        resetErrorResident = resetErrorResident.map((r,index) => {
          if (index == i) {
            return {...r,resident_family_name: {backgroundColor:'pink'}}
          }
          return r;
        })
        name_flg = 1;
      }
  
      // 【入居者】氏名(名)
      if(resident_error_check_flg == 1 && !resi.resident_first_name){
        resetErrorResident = resetErrorResident.map((r,index) => {
          if (index == i) {
            return {...r,resident_first_name: {backgroundColor:'pink'}}
          }
          return r;
        })
        name_flg = 1;
      }
  
      // 【入居者】氏名フリガナ(性)
      if(resident_error_check_flg == 1 && !resi.resident_family_kana){
        resetErrorResident = resetErrorResident.map((r,index) => {
          if (index == i) {
            return {...r,resident_family_kana: {backgroundColor:'pink'}}
          }
          return r;
        })
        name_flg = 1;
      }
  
      // 【入居者】氏名フリガナ(名)
      if(resident_error_check_flg == 1 && !resi.resident_first_kana){
        resetErrorResident = resetErrorResident.map((r,index) => {
          if (index == i) {
            return {...r,resident_first_kana: {backgroundColor:'pink'}}
          }
          return r;
        })
        name_flg = 1;
      }

      if (name_flg == 1) {
        error_text += `\n・【${title}】氏名を入力してください`;
      }
  
      // 【入居者】携帯電話番号
      if (resi.resident_mobile != "" && !(resi.resident_mobile).match(regex_tel)) {
        resetErrorResident = resetErrorResident.map((r,index) => {
          if (index == i) {
            return {...r,resident_mobile: {backgroundColor:'pink'}}
          }
          return r;
        })
        error_text += `\n・【${title}】携帯電話番号が正しい形式で入力されていません`;
      }
  
      // 【入居者】勤務先:郵便番号
      if (resi.resident_belongs_zipcode != null && resi.resident_belongs_zipcode != "" && !(resi.resident_belongs_zipcode).match(regex_zipcode)) {
        resetErrorResident = resetErrorResident.map((r,index) => {
          if (index == i) {
            return {...r,resident_belongs_zipcode: {backgroundColor:'pink'}}
          }
          return r;
        })
        error_text += `\n・【${title}】勤務先:郵便番号が正しい形式で入力されていません`;
      }
  
      // 【入居者】勤務先電話番号
      if (resi.resident_belongs_tel != "" && !(resi.resident_belongs_tel).match(regex_tel)) {
        resetErrorResident = resetErrorResident.map((r,index) => {
          if (index == i) {
            return {...r,resident_belongs_tel: {backgroundColor:'pink'}}
          }
          return r;
        })
        error_text += `\n・【${title}】勤務先電話番号が正しい形式で入力されていません`;
      }

      setResident_Err(resetErrorResident);
    }

    // 本人確認書類
    if (image.length == 0) {
      if (!filedata1 && !filedata2) {
        error_text += "\n・【本人確認書類】ファイルを選択してください";
      }
    }

    if (user_type == "1") { // [連帯保証人：法人]

      // 【連帯保証人】氏名:姓
      if (company_input.guarantor_family_name == "") {
        setCompany_Err(state => ({ ...state, guarantor_family_name: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】氏名:姓を入力してください";
      }

      // 【連帯保証人】氏名:名
      if (company_input.guarantor_first_name == "") {
        setCompany_Err(state => ({ ...state, guarantor_first_name: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】氏名:名を入力してください";
      }
      
      // 【連帯保証人】氏名:セイ
      if (company_input.guarantor_family_kana == "") {
        setCompany_Err(state => ({ ...state, guarantor_family_kana: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】氏名:セイを入力してください";
      }

      // 【連帯保証人】氏名:メイ
      if (company_input.guarantor_first_kana == "") {
        setCompany_Err(state => ({ ...state, guarantor_first_kana: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】氏名:メイを入力してください";
      }

      // 【連帯保証人】性別
      if (company_input.guarantor_gender == null || company_input.guarantor_gender == "") {
        setCompany_Err(state => ({ ...state, guarantor_gender: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】性別を入力してください";
      }

      // 【連帯保証人】生年月日
      if (company_input.guarantor_birthday == "") {
        setCompany_Err(state => ({ ...state, guarantor_birthday: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】生年月日を入力してください";
      }

      // 【連帯保証人】自宅電話番号/携帯電話番号
      if (company_input.guarantor_tel == "" && company_input.guarantor_mobile == "") {
        setCompany_Err(state => ({
          ...state,
          guarantor_tel: {backgroundColor:'pink'},
          guarantor_mobile: {backgroundColor:'pink'},
        }));
        error_text += "\n・【連帯保証人】自宅/携帯 電話番号のどちらかは必須入力です";
      } else if (company_input.guarantor_tel != "" && !(company_input.guarantor_tel).match(regex_tel)) {
        // 【連帯保証人】自宅電話番号
        setCompany_Err(state => ({ ...state, guarantor_tel: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】自宅電話番号が正しい形式で入力されていません";
      } else if (company_input.guarantor_mobile != "" && !(company_input.guarantor_mobile).match(regex_tel)) {
        // 【連帯保証人】携帯電話番号
        setCompany_Err(state => ({ ...state, guarantor_mobile: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】携帯電話番号が正しい形式で入力されていません";
      }

      // 【連帯保証人】現住所:郵便番号
      if (company_input.guarantor_zipcode == "") {
        setCompany_Err(state => ({ ...state, guarantor_zipcode: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】現住所:郵便番号を入力してください";
      } else if (!(company_input.guarantor_zipcode).match(regex_zipcode)) {
        setCompany_Err(state => ({ ...state, guarantor_zipcode: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】現住所:郵便番号が正しい形式で入力されていません";
      }

      // 【連帯保証人】現住所:都道府県
      if (company_input.guarantor_address_prefecture == "") {
        setCompany_Err(state => ({ ...state, guarantor_address_prefecture: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】現住所:都道府県を入力してください";
      }
      
      // 【連帯保証人】現住所:市区町村
      if (company_input.guarantor_address_city == "") {
        setCompany_Err(state => ({ ...state, guarantor_address_city: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】現住所:市区町村を入力してください";
      }
      
      // 【連帯保証人】現住所:丁目・番地
      if (company_input.guarantor_address_number == "") {
        setCompany_Err(state => ({ ...state, guarantor_address_number: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】現住所:丁目・番地を入力してください";
      }

      // 【連帯保証人】勤務先有無
      if (company_input.guarantor_workplace == "") {
        setCompany_Err(state => ({ ...state, guarantor_workplace: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】勤務先有無を入力してください";
      }

      // 【連帯保証人】勤務先電話番号
      if (company_input.guarantor_belongs_tel != "" && !(company_input.guarantor_belongs_tel).match(regex_tel)) {
        setCompany_Err(state => ({ ...state, guarantor_belongs_tel: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】勤務先電話番号が正しい形式で入力されていません";
      }

      // 【連帯保証人】勤務先:郵便番号
      if (company_input.guarantor_belongs_zipcode != "" && !(company_input.guarantor_belongs_zipcode).match(regex_zipcode)) {
        setCompany_Err(state => ({ ...state, guarantor_belongs_zipcode: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】勤務先:郵便番号が正しい形式で入力されていません";
      }

      // 【連帯保証人】年収
      if (company_input.guarantor_annual_income == "") {
        setCompany_Err(state => ({ ...state, guarantor_annual_income: {backgroundColor:'pink'} }));
        error_text += "\n・【連帯保証人】年収を入力してください";
      }

    
    } else if (user_type == "2") { // [連帯保証人/緊急連絡先：個人]

      if (move_in.joint_guarantor=="1") { // 連帯保証人

        // 【連帯保証人】氏名:姓
        if (person_input.guarantor_family_name == "") {
          setPerson_Err(state => ({ ...state, guarantor_family_name: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】氏名:姓を入力してください";
        }

        // 【連帯保証人】氏名:名
        if (person_input.guarantor_first_name == "") {
          setPerson_Err(state => ({ ...state, guarantor_first_name: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】氏名:名を入力してください";
        }
        
        // 【連帯保証人】氏名:セイ
        if (person_input.guarantor_family_kana == "") {
          setPerson_Err(state => ({ ...state, guarantor_family_kana: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】氏名:セイを入力してください";
        }

        // 【連帯保証人】氏名:メイ
        if (person_input.guarantor_first_kana == "") {
          setPerson_Err(state => ({ ...state, guarantor_first_kana: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】氏名:メイを入力してください";
        }

        // 【連帯保証人】性別
        if (person_input.guarantor_gender == null || person_input.guarantor_gender == "") {
          setPerson_Err(state => ({ ...state, guarantor_gender: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】性別を入力してください";
        }

        // 【連帯保証人】生年月日
        if (person_input.guarantor_birthday == "") {
          setPerson_Err(state => ({ ...state, guarantor_birthday: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】生年月日を入力してください";
        }

        // 【連帯保証人】自宅電話番号/携帯電話番号
        if (person_input.guarantor_tel == "" && person_input.guarantor_mobile == "") {
          setPerson_Err(state => ({
            ...state,
            guarantor_tel: {backgroundColor:'pink'},
            guarantor_mobile: {backgroundColor:'pink'},
          }));
          error_text += "\n・【連帯保証人】自宅/携帯 電話番号のどちらかは必須入力です";
        } else if (person_input.guarantor_tel != "" && !(person_input.guarantor_tel).match(regex_tel)) {
          // 【連帯保証人】自宅電話番号
          setPerson_Err(state => ({ ...state, guarantor_tel: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】自宅電話番号が正しい形式で入力されていません";
        } else if (person_input.guarantor_mobile != "" && !(person_input.guarantor_mobile).match(regex_tel)) {
          // 【連帯保証人】携帯電話番号
          setPerson_Err(state => ({ ...state, guarantor_mobile: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】携帯電話番号が正しい形式で入力されていません";
        }

        // 【連帯保証人】現住所:郵便番号
        if (person_input.guarantor_zipcode == "") {
          setPerson_Err(state => ({ ...state, guarantor_zipcode: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】現住所:郵便番号を入力してください";
        } else if (!(person_input.guarantor_zipcode).match(regex_zipcode)) {
          setPerson_Err(state => ({ ...state, guarantor_zipcode: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】現住所:郵便番号が正しい形式で入力されていません";
        }

        // 【連帯保証人】現住所:都道府県
        if (person_input.guarantor_address_prefecture == "") {
          setPerson_Err(state => ({ ...state, guarantor_address_prefecture: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】現住所:都道府県を入力してください";
        }
        
        // 【連帯保証人】現住所:市区町村
        if (person_input.guarantor_address_city == "") {
          setPerson_Err(state => ({ ...state, guarantor_address_city: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】現住所:市区町村を入力してください";
        }
        
        // 【連帯保証人】現住所:丁目・番地
        if (person_input.guarantor_address_number == "") {
          setPerson_Err(state => ({ ...state, guarantor_address_number: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】現住所:丁目・番地を入力してください";
        }

        // 【連帯保証人】勤務先有無
        if (person_input.guarantor_workplace == "") {
          setPerson_Err(state => ({ ...state, guarantor_workplace: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】勤務先有無を入力してください";
        }

        // 【連帯保証人】勤務先電話番号
        if (person_input.guarantor_belongs_tel != "" && !(person_input.guarantor_belongs_tel).match(regex_tel)) {
          setPerson_Err(state => ({ ...state, guarantor_belongs_tel: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】勤務先電話番号が正しい形式で入力されていません";
        }

        // 【連帯保証人】勤務先:郵便番号
        if (person_input.guarantor_belongs_zipcode != "" && !(person_input.guarantor_belongs_zipcode).match(regex_zipcode)) {
          setPerson_Err(state => ({ ...state, guarantor_belongs_zipcode: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】勤務先:郵便番号が正しい形式で入力されていません";
        }

        // 【連帯保証人】年収
        if (person_input.guarantor_annual_income == "") {
          setPerson_Err(state => ({ ...state, guarantor_annual_income: {backgroundColor:'pink'} }));
          error_text += "\n・【連帯保証人】年収を入力してください";
        }

      } else if (move_in.joint_guarantor=="2") { // 緊急連絡先

        // 【緊急連絡先】氏名:姓
        if (person_input.contact_family_name == "") {
          setPerson_Err(state => ({ ...state, contact_family_name: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】氏名:姓を入力してください";
        }

        // 【緊急連絡先】氏名:名
        if (person_input.contact_first_name == "") {
          setPerson_Err(state => ({ ...state, contact_first_name: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】氏名:名を入力してください";
        }
        
        // 【緊急連絡先】氏名:セイ
        if (person_input.contact_family_kana == "") {
          setPerson_Err(state => ({ ...state, contact_family_kana: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】氏名:セイを入力してください";
        }

        // 【緊急連絡先】氏名:メイ
        if (person_input.contact_first_kana == "") {
          setPerson_Err(state => ({ ...state, contact_first_kana: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】氏名:メイを入力してください";
        }

        // 【緊急連絡先】性別
        if (person_input.contact_gender == null || person_input.contact_gender == "") {
          setPerson_Err(state => ({ ...state, contact_gender: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】性別を入力してください";
        }

        // 【緊急連絡先】生年月日
        if (person_input.contact_birthday == "") {
          setPerson_Err(state => ({ ...state, contact_birthday: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】生年月日を入力してください";
        }

        // 【緊急連絡先】自宅電話番号/携帯電話番号
        if (person_input.contact_tel == "" && person_input.contact_mobile == "") {
          setPerson_Err(state => ({
            ...state,
            contact_tel: {backgroundColor:'pink'},
            contact_mobile: {backgroundColor:'pink'},
          }));
          error_text += "\n・【緊急連絡先】自宅/携帯 電話番号のどちらかは必須入力です";
        } else if (person_input.contact_tel != "" && !(person_input.contact_tel).match(regex_tel)) {
          // 【緊急連絡先】自宅電話番号
          setPerson_Err(state => ({ ...state, contact_tel: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】自宅電話番号が正しい形式で入力されていません";
        } else if (person_input.contact_mobile != "" && !(person_input.contact_mobile).match(regex_tel)) {
          // 【緊急連絡先】携帯電話番号
          setPerson_Err(state => ({ ...state, contact_mobile: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】携帯電話番号が正しい形式で入力されていません";
        }

        // 【緊急連絡先】現住所:郵便番号
        if (person_input.contact_zipcode == "") {
          setPerson_Err(state => ({ ...state, contact_zipcode: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】現住所:郵便番号を入力してください";
        } else if (!(person_input.contact_zipcode).match(regex_zipcode)) {
          setPerson_Err(state => ({ ...state, contact_zipcode: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】現住所:郵便番号が正しい形式で入力されていません";
        }

        // 【緊急連絡先】現住所:都道府県
        if (person_input.contact_address_prefecture == "") {
          setPerson_Err(state => ({ ...state, contact_address_prefecture: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】現住所:都道府県を入力してください";
        }
        
        // 【緊急連絡先】現住所:市区町村
        if (person_input.contact_address_city == "") {
          setPerson_Err(state => ({ ...state, contact_address_city: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】現住所:市区町村を入力してください";
        }
        
        // 【緊急連絡先】現住所:丁目・番地
        if (person_input.contact_address_number == "") {
          setPerson_Err(state => ({ ...state, contact_address_number: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】現住所:丁目・番地を入力してください";
        }

        // 【緊急連絡先】勤務先有無
        if (person_input.contact_workplace == "") {
          setPerson_Err(state => ({ ...state, contact_workplace: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】勤務先有無を入力してください";
        }

        // 【緊急連絡先】年収
        if (person_input.contact_annual_income == "") {
          setPerson_Err(state => ({ ...state, contact_annual_income: {backgroundColor:'pink'} }));
          error_text += "\n・【緊急連絡先】年収を入力してください";
        }

      }

    }

    return error_text;

  }
  // ----- 登録系関数 END -----

  // ----- その他関数 START -----
  // 申込内容の再入力をお客様に許可する
  async function setReInput_fetch() {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        ``,
        "許可してもよろしいですか？",
        [
          {
            text: "はい",
            onPress:() => {resolve(true);}
          },
          {
            text: "いいえ",
            style: "cancel",
            onPress:() => {resolve(false);}
          }
        ]
      );
    });

    if (!await AsyncAlert()) {
      setReinput_flg(false);
      return;
    }

    setLoading(true);
    if (!await setErcMoveInFetch("setReInput")) {
      Alert.alert('','許可に失敗しました');
    }

    setReinput_flg(true);
    setIncomplete(true);
    setReinput(false);
    setLoading(false);
    
  }

  // 申込内容の確認チェック
  async function setCheckFlg() {
    setLoading(true);
    if (!await setErcMoveInFetch("setCheckData")) {
      Alert.alert('','申込内容の確認チェックに失敗しました');
    }

    setMove_in(state => ({ ...state, check_flg: !move_in.check_flg }));
    setLoading(false);
  }

  // 郵便番号、住所取得
  async function GetAddress(flg,data) {

    if (flg == "zip") {
      if (!data) {
        Alert.alert("","郵便番号を入力してください");
        return;
      }
    } else if (flg == "add") {
      if (!data) {
        Alert.alert("","住所を入力してください");
        return;
      }
    }

    const result = await getErcDataAddress(flg,data);

    if (result) {
      return result;
    } else {
      if (flg == "zip") {
        Alert.alert("","入力された郵便番号では見つかりませんでした");
      } else if (flg == "add") {
        Alert.alert("","入力された住所では見つかりませんでした");
      }
      return "";
    }

  }

  // 日付ピッカー
  function ChangeBirthday(selectedDate,flg) {

    var birthdays;

    if (flg == 0) {
      birthday = company_input.company_establishment;
    } else if (flg == 1) {
      birthday = company_input.representative_birthday;
    } else if (flg == 2) {
      birthday = person_input.person_birthday;
    } else if (flg == 3) {
      birthday = resident[date_index].resident_birthday;
    } else if (flg == 4) {
      if (move_in.user_type=="1") {
        birthday = company_input.guarantor_birthday;
      } else if (move_in.user_type=="2") {
        birthday = person_input.guarantor_birthday;
      }
    } else if (flg == 5) {
      birthday = person_input.contact_birthday;
    }

    const currentDate = selectedDate || birthdays;
    
    if (flg == 0) {
      setPerson_Input(state => ({ ...state, company_establishment: currentDate }));
    } else if (flg == 1) {
      setPerson_Input(state => ({ ...state, representative_birthday: currentDate }));
    } else if (flg == 2) {
      setPerson_Input(state => ({ ...state, person_birthday: currentDate }));
    } else if (flg == 3) {
      setResident(state => [...state.slice(0, date_index), { ...state[date_index], resident_birthday: currentDate }, ...state.slice(date_index + 1)]);
    } else if (flg == 4) {
      if (move_in.user_type=="1") {
        setCompany_Input(state => ({ ...state, guarantor_birthday: currentDate }));
      } else if (move_in.user_type=="2") {
        setPerson_Input(state => ({ ...state, guarantor_birthday: currentDate }));
      }
    } else if (flg == 5) {
      setPerson_Input(state => ({ ...state, contact_birthday: currentDate }));
    }

    setChange_flg(state => ({ ...state, customer: 1 }));

  }

  // 日付クリア
  function ClearDateTime(flg,index=0) {
    if (flg == 0) {
      setPerson_Input(state => ({ ...state, company_establishment: "" }));
    } else if (flg == 1) {
      setPerson_Input(state => ({ ...state, representative_birthday: "" }));
    } else if (flg == 2) {
      setPerson_Input(state => ({ ...state, person_birthday: "" }));
    } else if (flg == 3) {
      setResident(state => [...state.slice(0, index), { ...state[index], resident_birthday: "" }, ...state.slice(index + 1)]);
    } else if (flg == 4) {
      if (move_in.user_type=="1") {
        setCompany_Input(state => ({ ...state, guarantor_birthday: "" }));
      } else if (move_in.user_type=="2") {
        setPerson_Input(state => ({ ...state, guarantor_birthday: "" }));
      }
    } else if (flg == 5) {
      setPerson_Input(state => ({ ...state, contact_birthday: "" }));
    }
  }

  // QRコード保存
  function QR_dl(url) {

    Alert.alert(
      "",
      "QRコードの画像を保存しますか？",
      [
        {
          text: "はい",
          onPress: async() => {

            if (!await MediaLibraryPermissionsCheck()) return;

            const dl_dir = FileSystem.documentDirectory + 'create_qr.png'
        
            const uri = await FileSystem.downloadAsync(
              url,
              dl_dir
            )
        
            await MediaLibrary.saveToLibraryAsync(uri.uri);

            await FileSystem.deleteAsync(dl_dir, {idempotent:true});

            Alert.alert("","保存しました。");
        
          }
        },
        {
          text: "いいえ",
        },
      ]
    );

  }

  // ライブラリ許可
  const MediaLibraryPermissionsCheck = async() => {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `デバイス内の写真やメディアへのアクセスが無効です。`,
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

	  // ライブラリに写真追加許可を付与
    if (Platform.OS !== 'web') {
      const permission = await MediaLibrary.getPermissionsAsync();
      
      if (permission.canAskAgain && permission.status !== 'granted') {
        const permissionResponse = await MediaLibrary.requestPermissionsAsync();
        if (permissionResponse.status !== "granted") {
          return await AsyncAlert();
        } else {
          return true;
        }
      } else {
        return true;
      }
    }

  }

  const QRsend = async(flg) => {
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
        previous:'ErcMoveIn',
        withAnimation2: true,
        erc_send:{
          flg:flg,
          url:QRimg.url
        }
      }],
    });
  }

  // 申込情報URLコピー
  const QR_copy = () => {
    Alert.alert(
      "",
      "URLをコピーしますか？",
      [
        {
          text: "はい",
          onPress: async() => {
            await Clipboard.setStringAsync(QRimg.url);
          }
        },
        {
          text: "いいえ",
        },
      ]
    );
  }

  // 画像参照
  const settingImage = async(uri) => {
    
    const {imgWidth, imgHeight} = await new Promise((resolve) => {
      Image.getSize(uri, (width, height) => {
        resolve({imgWidth: width, imgHeight: height});
      },
      (err)=>{
        console.log(err)
        resolve({imgWidth: Width, imgHeight: Width});
      });
    });

    setImg_size({width:imgWidth,height:imgHeight});

    setImg(uri);
    setImg_mdl(true);
  }

  // 本人確認書類クリア
  const ClearImage = () => {
    Alert.alert(
      "",
      "本人確認書類の画像を変更しますか？",
      [
        {
          text: "はい",
          onPress: () => {
            setImage([]);
          }
        },
        {
          text: "いいえ",
        },
      ]
    );
  }

  // カメラロール許可
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
  
  // カメラロールから画像を選択
	const pickImage = async (flg) => {
    
    if (!await LibraryPermissionsCheck()) return;
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.cancelled) {
      if(flg == "1") {
        setFiledata1(result);
      } else {
        setFiledata2(result);
      }
    }
  };
  // ----- その他関数 END -----

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
          <View style={styles.mainTable}>
            <View style={styles.tr}>
              <View style={styles.th}>
                <Text style={styles.th_txt}>
                  仲介店舗コード
                  <Text style={styles.required}> ※</Text>
                </Text>
              </View>
              <View style={styles.td}>
                <Text>{shop.brokerage_shop_code}</Text>
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.th}>
                <Text style={styles.th_txt}>
                  契約種別
                  <Text style={styles.required}> ※</Text>
                </Text>
              </View>
              <View style={styles.td} pointerEvents={disabled_flg ? "none" : "auto"}>
                <RadioButtonRN
                  data={user_type_list}
                  value={move_in.user_type}
                  selectedBtn={(e) => {
                    setMove_in(state => ({ ...state, user_type: e.value }));
                    if (e.value == "1") {
                      setMove_in(state => ({ ...state, joint_guarantor: "1" }));
                      setDisabled_joint_guarantor(true);
                    } else {
                      setDisabled_joint_guarantor(false);
                    }
                  }}
                  animationTypes={['rotate']}
                  activeColor={disabled_flg?'#b3b3b3':'#191970'}
                  initial={move_in.user_type==1?2:move_in.user_type==2?1:-1}
                  boxStyle={[styles.radio_box,move_in_err.user_type]}
                  style={{flexDirection:'row',marginVertical:5}}
                  textStyle={{fontSize:14,marginLeft:5}}
                  circleSize={10}
                />
              </View>
            </View>
            <View style={[styles.tr,{height:50}]}>
              <View style={[styles.th,{height:50}]}>
                <Text style={styles.th_txt}>
                  連帯保証人
                  <Text style={styles.required}> ※</Text>
                </Text>
              </View>
              <View style={[styles.td,{height:50}]} pointerEvents={disabled_joint_guarantor ? "none" : "auto"}>
                <RadioButtonRN
                  data={joint_guarantor_list}
                  value={move_in.joint_guarantor}
                  selectedBtn={(e) => {
                    setMove_in(state => ({ ...state, joint_guarantor: e.value }));
                  }}
                  animationTypes={['rotate']}
                  activeColor={disabled_joint_guarantor?'#b3b3b3':'#191970'}
                  initial={move_in.joint_guarantor>0?move_in.joint_guarantor:-1}
                  boxStyle={[styles.radio_box,move_in_err.joint_guarantor]}
                  style={{flexDirection:'row',marginVertical:5}}
                  textStyle={{fontSize:14,marginLeft:5}}
                  circleSize={10}
                />
                <Text style={styles.required_txt}>　※法人の場合、連帯保証人は必須です</Text>
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.th}>
                <Text style={styles.th_txt}>
                  住居用途
                  <Text style={styles.required}> ※</Text>
                </Text>
              </View>
              <View style={styles.td}>
                <Dropdown
                  style={[styles.DropDown,{height:30,width:"80%"},move_in_err.resident_type]}
                  containerStyle={styles.dropDownContainer}
                  placeholderStyle={{fontSize:14}}
                  selectedTextStyle={[{fontSize:14},disabled_flg&&{color:'#e2e2e2'}]}
                  itemTextStyle={{fontSize:14}}
                  renderItem={(item)=>(
                    <View style={styles.dropItem}>
                      <Text style={styles.dropItemText}>{item.label}</Text>
                    </View>
                  )}
                  value={move_in.resident_type}
                  data={resident_type_list}
                  onChange={(item) => {
                    setChange_flg(state => ({ ...state, content: 1 }));
                    setMove_in(state => ({ ...state, resident_type: item.value }))
                  }}
                  labelField="label"
                  valueField="value"
                  placeholder=""
                  disable={disabled_flg}
                />
              </View>
            </View>
            <View style={styles.tr}>
              <View style={styles.th}>
                <Text style={styles.th_txt}>保証会社</Text>
              </View>
              <View style={styles.td}>
                <Dropdown
                  style={[styles.DropDown,{height:30,width:"80%"}]}
                  containerStyle={styles.dropDownContainer}
                  placeholderStyle={{fontSize:14}}
                  selectedTextStyle={[{fontSize:14},disabled_flg&&{color:'#e2e2e2'}]}
                  itemTextStyle={{fontSize:14}}
                  renderItem={(item)=>(
                    <View style={styles.dropItem}>
                      <Text style={styles.dropItemText}>{item.label}</Text>
                    </View>
                  )}
                  value={move_in.guarantee_company}
                  data={guarantee_company_list}
                  onChange={(item) => {
                    setChange_flg(state => ({ ...state, content: 1 }));
                    setMove_in(state => ({ ...state, guarantee_company: item.value }))
                  }}
                  labelField="label"
                  valueField="value"
                  placeholder=""
                  disable={disabled_flg}
                />
              </View>
            </View>
            {!global.fc_flg&&(
              <View style={[styles.tr,{height:70}]}>
                <View style={[styles.th,{height:70}]}>
                  <Text style={styles.th_txt}>えるく審査申込</Text>
                </View>
                <View style={[styles.td,{height:70}]} pointerEvents={disabled_flg ? "none" : "auto"}>
                  <RadioButtonRN
                    data={erc_type_list}
                    value={move_in.erc_type}
                    selectedBtn={(e) => {
                      setMove_in(state => ({ ...state, erc_type: e.value }));
                    }}
                    animationTypes={['rotate']}
                    activeColor={disabled_flg?'#b3b3b3':'#191970'}
                    initial={move_in.erc_type>0?move_in.erc_type:-1}
                    boxStyle={[styles.radio_box,{width:110},move_in_err.erc_type]}
                    style={{flexDirection:'row',marginVertical:5}}
                    textStyle={{fontSize:14,marginLeft:5}}
                    circleSize={10}
                  />
                  <Text style={styles.required_txt}>　※保証会社に「えるく」が選択されている場合は必須です</Text>
                </View>
              </View>
            )}
          </View>
          <View style={{flexDirection:'row',width:'100%'}}>
            <TouchableOpacity
              onPress={()=>{setForm(0)}}
              style={form==0?styles.active_tab:styles.inactivetab}
            >
              <Text style={styles.tab_txt}>物件情報</Text>
            </TouchableOpacity>
            {(company_input.customer_id||person_input.customer_id)&&(
              <>
                <TouchableOpacity
                  onPress={()=>{setForm(1)}}
                  style={[form==1?styles.active_tab:styles.inactivetab,{width:'33.5%'}]}
                >
                  <Text style={styles.tab_txt}>申込情報①</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={()=>{setForm(2)}}
                  style={[form==2?styles.active_tab:styles.inactivetab,{width:'33.5%'}]}
                >
                  <Text style={styles.tab_txt}>申込情報②</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <View style={styles.table}>
            {
              form==0?Move_inList:
              form==1?
                (
                  move_in.user_type=="1"?CompanyInputList:
                  move_in.user_type=="2"?PersonInputList:(<></>)
                ):
              form==2?(
                <>
                  {InputList}
                  {
                    move_in.user_type=="1"?CompanyGuarantorList:
                    move_in.user_type=="2"?PersonGuarantorList:(<></>)
                  }
                </>
              ) : null
            }
            <Modal
              isVisible={QRlink_mdl}
              swipeDirection={['up']}
              onSwipeComplete={()=>setQRlink_mdl(false)}
              backdropOpacity={0.5}
              animationInTiming={300}
              animationOutTiming={500}
              animationIn={'slideInDown'}
              animationOut={'slideOutUp'}
              propagateSwipe={true}
              style={{alignItems: 'center'}}
              onBackdropPress={()=>setQRlink_mdl(false)}
            >
              <View style={styles.QRlink_mdl}>
                <TouchableOpacity
                  style={{
                    position: 'absolute',
                    top:8,
                    right:10,
                    zIndex:999
                  }}
                  onPress={()=>setQRlink_mdl(false)}
                >
                  <Feather name='x-circle' color='gray' size={35} />
                </TouchableOpacity>
                <View style={{justifyContent: 'center',flexDirection: 'row'}}>
                  <TouchableOpacity style={styles.menuBox} onPress={()=>{QRsend('mail')}}>
                    <MaterialCommunityIcons name='email-outline' color='#1f2d53' size={28} />
                    <Text style={styles.iconText}>メール送信</Text>
                  </TouchableOpacity>
                  {route.line_flg&&(
                    <TouchableOpacity style={styles.menuBox} onPress={()=>{QRsend('line')}}>
                      <MaterialCommunityIcons name='chat-outline' color='#1f2d53' size={28} />
                      <Text style={styles.iconText}>LINE送信</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.menuBox} onPress={()=>{QR_copy()}}>
                    <MaterialCommunityIcons name='content-copy' color='#1f2d53' size={28} />
                    <Text style={styles.iconText}>URLコピー</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            {(show && Platform.OS === 'android') && (
              <DateTimePicker
                value={
                  mode==0?(company_input.company_establishment?company_input.company_establishment:new Date()):
                  mode==1?(company_input.representative_birthday?company_input.representative_birthday:new Date()):
                  mode==2?(person_input.person_birthday?person_input.person_birthday:new Date()):
                  mode==3?(resident[date_index].resident_birthday?resident[date_index].resident_birthday:new Date()):
                  mode==4?
                    (move_in.user_type=="1"?
                    (company_input.guarantor_birthday?company_input.guarantor_birthday:new Date()):
                    move_in.user_type=="2"?
                    (person_input.guarantor_birthday?person_input.guarantor_birthday:new Date()):
                    new Date()):
                  mode==5?(person_input.contact_birthday?person_input.contact_birthday:new Date()):
                  new Date()
                }
                mode={"date"}
                display="default"
                locale={'ja'}
                onChange={(event, selectedDate) => {
                  ChangeBirthday(selectedDate,mode);
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
                      mode==0?(company_input.company_establishment?company_input.company_establishment:new Date()):
                      mode==1?(company_input.representative_birthday?company_input.representative_birthday:new Date()):
                      mode==2?(person_input.person_birthday?person_input.person_birthday:new Date()):
                      mode==3?(resident[date_index].resident_birthday?resident[date_index].resident_birthday:new Date()):
                      mode==4?
                        (move_in.user_type=="1"?
                        (company_input.guarantor_birthday?company_input.guarantor_birthday:new Date()):
                        move_in.user_type=="2"?
                        (person_input.guarantor_birthday?person_input.guarantor_birthday:new Date()):
                        new Date()):
                      mode==5?(person_input.contact_birthday?person_input.contact_birthday:new Date()):
                      new Date()
                    }
                    mode={'date'}
                    is24Hour={true}
                    display="spinner"
                    locale={'ja'}
                    onChange={(event, selectedDate) => {ChangeBirthday(selectedDate,mode)}}
                    textColor="#fff"
                  />
                </View>
              </Modal>
            )}
          </View>
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
  mainTable: {
    marginBottom:15,
    borderWidth:3,
    borderColor: "#bfbfbf",
    backgroundColor:'#fff'
  },
  tr: {
    flexDirection:'row',
    height:40,
    alignItems:'center'
  },
  th : {
    height:40,
    width:"35%",
    borderWidth:0.5,
    borderColor: "#bfbfbf",
    backgroundColor: "#eaeaea",
    justifyContent:'center',
    alignItems:'center',
    flexDirection:'row'
  },
  th_txt: {
    fontWeight:'bold'
  },
  td: {
    minHeight:40,
    width:"65%",
    borderWidth:0.5,
    borderColor: "#bfbfbf",
    justifyContent:'center',
    paddingLeft:10
  },
  required: {
    color:'red',
    fontSize:16,
  },
  required_txt: {
    color:'red',
    fontSize:10,
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
  title: {
    marginTop:10,
    fontSize:18,
    textAlign:'center',
    fontWeight:'700',
    color:"#999",
  },
  label: {
    color:"#999",
    marginVertical: 3,
    marginLeft:5,
    fontSize:16,
    fontWeight:'500'
  },
  incomplete_msg: {
    fontSize:16,
    marginVertical:20,
    color:'red',
    textAlign:'center'
  },
  inputInner: {
    height:40,
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
    width:80,
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
    height:40,
    backgroundColor:'transparent',
    marginTop:10,
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
  addressBtn: {
    width:"40%",
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    height:30,
    paddingHorizontal:10,
    backgroundColor:"#cfcfcf",
    marginLeft:'auto'
  },
  addressBtntxt:{
    fontSize:14,
    color:'#666'
  },
  QRlink_mdl: {
    backgroundColor: "#ffffff",
    width:'90%',
    height:160,
    padding:15,
    justifyContent: 'center',
  },
  menuBox: {
    width:80,
    height:80,
    backgroundColor:'#edf2ff',
    borderWidth:2,
    borderColor:'#1f2d53',
    borderRadius:20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:30,
    marginHorizontal:10,
  },
  iconText: {
    fontSize:12,
    fontWeight:'600',
    color:'#1f2d53',
    marginTop:5,
    textAlign:'center',
  },
  qr_link: {
    marginTop:10,
    color:'blue',
    textDecorationLine: 'underline',
  },
  img_link: {
    fontSize:16,
    color:'blue',
    textDecorationLine: 'underline',
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
  img_change: {
    width:100,
    paddingHorizontal:5,
    paddingVertical:3,
    backgroundColor:'#e3e3e3',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth:0.5,
    borderColor:'"999',
    borderRadius:8,
    marginTop:10
  },
  img_change_btn: {
    fontSize:16,
    color: '#666'
  },
  submit:{
    justifyContent: 'center',
    alignItems: 'center',
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
