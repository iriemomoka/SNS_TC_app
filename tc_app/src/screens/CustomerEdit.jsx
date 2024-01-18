import React, { useState,useEffect,useMemo } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, BackHandler, AppState, KeyboardAvoidingView, ScrollView, FlatList,  Image, Linking, Platform, Button
} from "react-native";
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import RadioButtonRN from 'radio-buttons-react-native';

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
    { label: "18歳", value: "18" },
    { label: "19歳", value: "19" },
    { label: "20歳", value: "20" },
    { label: "21歳", value: "21" },
    { label: "22歳", value: "22" },
    { label: "23歳", value: "23" },
    { label: "24歳", value: "24" },
    { label: "25歳", value: "25" },
    { label: "26歳", value: "26" },
    { label: "27歳", value: "27" },
    { label: "28歳", value: "28" },
    { label: "29歳", value: "29" },
    { label: "30歳", value: "30" },
    { label: "31歳", value: "31" },
    { label: "32歳", value: "32" },
    { label: "33歳", value: "33" },
    { label: "34歳", value: "34" },
    { label: "35歳", value: "35" },
    { label: "36歳", value: "36" },
    { label: "37歳", value: "37" },
    { label: "38歳", value: "38" },
    { label: "39歳", value: "39" },
    { label: "40歳", value: "40" },
    { label: "41歳", value: "41" },
    { label: "42歳", value: "42" },
    { label: "43歳", value: "43" },
    { label: "44歳", value: "44" },
    { label: "45歳", value: "45" },
    { label: "46歳", value: "46" },
    { label: "47歳", value: "47" },
    { label: "48歳", value: "48" },
    { label: "49歳", value: "49" },
    { label: "50歳", value: "50" },
    { label: "51歳", value: "51" },
    { label: "52歳", value: "52" },
    { label: "53歳", value: "53" },
    { label: "54歳", value: "54" },
    { label: "55歳", value: "55" },
    { label: "56歳", value: "56" },
    { label: "57歳", value: "57" },
    { label: "58歳", value: "58" },
    { label: "59歳", value: "59" },
    { label: "60歳", value: "60" },
    { label: "61歳", value: "61" },
    { label: "62歳", value: "62" },
    { label: "63歳", value: "63" },
    { label: "64歳", value: "64" },
    { label: "65歳", value: "65" },
    { label: "66歳", value: "66" },
    { label: "67歳", value: "67" },
    { label: "68歳", value: "68" },
    { label: "69歳", value: "69" },
    { label: "70歳", value: "70" },
    { label: "71歳", value: "71" },
    { label: "72歳", value: "72" },
    { label: "73歳", value: "73" },
    { label: "74歳", value: "74" },
    { label: "75歳", value: "75" },
    { label: "76歳", value: "76" },
    { label: "77歳", value: "77" },
    { label: "78歳", value: "78" },
    { label: "79歳", value: "79" },
    { label: "80歳", value: "80" },
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
    { label: "本店", value: "1" },
    { label: "支店", value: "2" },
  ]

  const rental_type = [
    { label: "住居用", value: "1" },
    { label: "テナント", value: "2" },
  ]

  useEffect(() => {
    
    navigation.setOptions({
      headerStyle: !global.fc_flg?{ backgroundColor: '#1d449a', height: 110}:{ backgroundColor: '#fd2c77', height: 110},
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
                staff: route.staff,
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
            staff: route.staff,
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
        shop_type: cus.shop_type,
        rental_type: cus.rental_type,
      })
    }
    
  }, []);

  async function onSubmit() {

    var err = "";

		if(customer.mail1 && !(customer.mail1).match(/^[A-Za-z0-9.]+[\w\.-]+@[\w\.-]+$/)){
      err += `・【メールアドレス1】メールアドレスが正しい書式ではありません。\n`;
		}

		if(customer.mail2 && !(customer.mail2).match(/^[A-Za-z0-9.]+[\w\.-]+@[\w\.-]+$/)){
      err += `・【メールアドレス2】メールアドレスが正しい書式ではありません。\n`;
		}

		if(customer.mail3 && !(customer.mail3).match(/^[A-Za-z0-9.]+[\w\.-]+@[\w\.-]+$/)){
      err += `・【メールアドレス3】メールアドレスが正しい書式ではありません。\n`;
		}

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

    let CusKey = Object.keys(customer);

    for (var c in CusKey) {
      formData.append(`val[${CusKey[c]}]`,customer[CusKey[c]]);
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

  return (
    <>
    <Loading isLoading={isLoading} />
    <ScrollView
      style={{flex: 1}}
      showsHorizontalScrollIndicator={false}
    >
      <View style={styles.view}>
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
        <TouchableOpacity onPress={()=>{onSubmit()}} style={styles.submit}>
          <Text style={styles.submitText}>保　存</Text>
        </TouchableOpacity>
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
    marginBottom:35,
    marginHorizontal:'5%'
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
    paddingVertical:10,
    paddingHorizontal:5,
    backgroundColor:'#fff',
    borderColor: '#919191',
    fontSize:16,
    borderWidth: 1,
    borderRadius: 8,
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
  radio_box: {
    width:100,
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 5,
    paddingVertical: 0,
    marginTop: 0,
    backgroundColor:'transparent'
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
