import React, { useState,useEffect } from "react";
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, BackHandler, AppState, KeyboardAvoidingView, ScrollView, FlatList,  Image, Linking, Platform, Button
} from "react-native";
import RadioButtonRN from 'radio-buttons-react-native';
import * as Notifications from 'expo-notifications';
import { Feather } from '@expo/vector-icons';
import GestureRecognizer from 'react-native-swipe-gestures';
import DropDownPicker from 'react-native-dropdown-picker';
import Modal from "react-native-modal";

import Loading from '../components/Loading';
import { db,db_write } from '../components/Databace';

import TagInput from 'react-native-tags-input';

import * as ImagePicker from 'expo-image-picker';

import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ローカルストレージ読み込み
const storage = new Storage({
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

let photo_path = domain + 'img/staff_img/';

// 画像用変数をグローバル変数にする
var photo_1 = "";
var photo_2 = "";
var photo_3 = "";

var nowDate = Date.now();
var save_profile_tag = "";

export default function Setting(props) {
  if (AppState.currentState === 'active') {
    Notifications.setBadgeCountAsync(0);
  }
  
  const { navigation, route } = props;
  
  const [isLoading, setLoading] = useState(false);
  
  navigation.setOptions({
    headerStyle: !global.fc_flg?{ backgroundColor: '#1d449a', height: 110}:{ backgroundColor: '#fd2c77', height: 110},
    headerTitleAlign: 'center',
    headerTitle: () =>
      !global.fc_flg?
      (<Image source={require('../../assets/logo.png')} />):
      (<Image source={require('../../assets/logo_onetop.png')} style={styles.header_img} />)
  });
  
  // スタッフ情報
  const [staffs, setStaffs] = useState(route.params);
  
  // 名前
  const [name_1, setName_1] = useState(route.params.name_1);
  const [name_2, setName_2] = useState(route.params.name_2);

  // パスワード
  const [password, setPassword] = useState(route.params.password);
  const [password_modal, setPassword_modal] = useState(false);
  const [old_password, setOld_password] = useState(null);
  const [new_password1, setNew_password1] = useState(null);
  const [new_password2, setNew_password2] = useState(null);
  
  // メールの表示名
  const [mail_name, setMail_name] = useState(route.params.mail_name);
  
  // 個人メールアドレス
  const [mail1, setMail1] = useState(route.params.mail1);
  const [mail2, setMail2] = useState(route.params.mail2);
  const [mail3, setMail3] = useState(route.params.mail3);
  const [mail_modal, setMail_modal] = useState(false);
  const [mail, setMail] = useState(null);
  
  const [contact, setContact] = useState(null);
  
  const radio = [
    {
      label: 'メール',
      value: '',
    },
    {
      label: 'アプリ',
      value: '9_1'
    }
  ];
  
  if (route.params.line_id) {
    radio.push(
      {
        label: 'LINE',
        value: '9'
      }
    )
  }
    
  // 設定2
  const [setting_list1, setSetting_list1] = useState(false);
  const [setting_list1_staff, setSetting_list1_staff] = useState('');
  const [open_setting_list1_staff, setOpen_setting_list1_staff] = useState(false);
  
  const [setting_list2, setSetting_list2] = useState(false);
  const [setting_list2_staff, setSetting_list2_staff] = useState('');
  const [open_setting_list2_staff, setOpen_setting_list2_staff] = useState(false);
  
  const [setting_list3, setSetting_list3] = useState(false);
  
  const [top_staff_list, setTop_staff_list] = useState(route.params.top_staff_list);
  const [open_top_staff_list, setOpen_top_staff_list] = useState(false);
  
  const [setting_list5, setSetting_list5] = useState(false);
  
  const [setting_list6_select, setSetting_list6_select] = useState('');
  const [open_setting_list6_select, setOpen_setting_list6_select] = useState(false);
  const [setting_list6_staff, setSetting_list6_staff] = useState('');
  const [open_setting_list6_staff, setOpen_setting_list6_staff] = useState(false);
  
  const [setting_list6, setSetting_list6] = useState(false);
  
  const [setting_list7, setSetting_list7] = useState(false);
  const [setting_list7_mail, setSetting_list7_mail] = useState(route.params.setting_list7_mail);
  
  const [setting_list8, setSetting_list8] = useState(false);
  const [setting_list10, setSetting_list10] = useState(false);
  
  const DoNotDo = [
    {label:'する',value:'1'},
    {label:'しない',value:''},
  ]
  
  const whole_individual = [
    {label:'個人',value:''},
    {label:'全体',value:'1'},
  ]
  
  const list6 = [
    {label:'7:00',value:'2'},
    {label:'8:00',value:'1'},
    {label:'9:00',value:''},
  ]
  
  const cus_list = [
    {label:'担当するお客様',value:''},
    {label:'店全体のお客様',value:'_a'},
  ]
  
  useEffect(() => {
    
    var setting_list = route.params.setting_list;
    console.log(setting_list)
    if(setting_list){
      
      // 通知設定
      if (setting_list.split(',').includes('9')) {
        setContact('9');
      }
      if (setting_list.split(',').includes('9_1')) {
        setContact('9_1');
      }
      
      // 設定2-1
      if (setting_list.split(',').includes('1_a')) {
        setSetting_list1_staff('_a');
      }
      if (setting_list.split(',').includes('1') || setting_list.split(',').includes('1_a')) {
        setSetting_list1('1');
      }
      
      // 設定2-2
      if (setting_list.split(',').includes('2_a')) {
        setSetting_list2_staff('_a');
      }
      if (setting_list.split(',').includes('2') || setting_list.split(',').includes('2_a')) {
        setSetting_list2('1');
      }
      
      // 設定2-3
      if (setting_list.split(',').includes('3')) {
        setSetting_list3('1');
      }
      
      // 設定2-4
      if (route.params.top_staff_list) {
        setTop_staff_list('1');
      } else {
        setTop_staff_list('');
      }
      
      // 設定2-5
      if (setting_list.split(',').includes('5')) {
        setSetting_list5('1');
      }
      
      // 設定2-6(時間)
      
      var setting6_flg = ''; // 時間設定の為チェックフラグ
      
      if (setting_list.split(',').includes('6_2') || setting_list.split(',').includes('6_2_a')) {
        setSetting_list6_select('2');
        setting6_flg = '1';
      }
      if (setting_list.split(',').includes('6_1') || setting_list.split(',').includes('6_1_a')) {
        setSetting_list6_select('1');
        setting6_flg = '1';
      }
      if (setting_list.split(',').includes('6') || setting_list.split(',').includes('6_a')) {
        setSetting_list6_select('');
        setting6_flg = '1';
      }
      
      // 設定2-6
      if (setting6_flg) {
        setSetting_list6('1');
      }
      
      if (setting_list.split(',').includes('6') || setting_list.split(',').includes('6_1') || setting_list.split(',').includes('6_2') || !setting6_flg) {
        setSetting_list6_staff('');
      }
      if (setting_list.split(',').includes('6_a') || setting_list.split(',').includes('6_1_a') || setting_list.split(',').includes('6_2_a')) {
        setSetting_list6_staff('1');
      }
      
      // 設定2-7
      if (setting_list.split(',').includes('7')) {
        setSetting_list7('1');
      }
      
      // 設定2-8
      if (setting_list.split(',').includes('8')) {
        setSetting_list8('1');
      }
      
      // 設定2-9
      if (setting_list.split(',').includes('10')) {
        setSetting_list10('1');
      }
      
    }
    
  }, []);
  
  // プロフィール
  const [profile, setprofile] = useState(route.profile[0]);

  // 代入用初期化
  var birthday = new Array();
  var buf_birthplace = "";
  var buf_profile_tag = new Array();

  var photo1_del_flg = true;
  var photo2_del_flg = true;
  var photo3_del_flg = true;
  var photo4_del_flg = true;

  if(typeof profile !== 'undefined'){
    buf_birthplace = profile.birthplace;

    if(typeof profile.birthday !== 'undefined' && profile.birthday != null){
      birthday = profile.birthday.split("-");
    }
    
    if(typeof profile.profile_tag !== 'undefined' 
      && profile.profile_tag != null 
    ){
      buf_profile_tag = profile.profile_tag.split(',');
    }

    if(typeof profile.staff_photo1 !== 'undefined' 
      && profile.staff_photo1 != null 
      && profile.staff_photo1 != ""
    ){
      var photo_1 = photo_path+profile.staff_photo1;
      // 削除ボタン表示
      //setphotoDisplay1(false);
      photo1_del_flg = false;
    }else{
      var photo_1 = "";
    }

    if(typeof profile.staff_photo2 !== 'undefined' 
      && profile.staff_photo2 != null
      && profile.staff_photo2 != ""
    ){
      var photo_2 = photo_path+profile.staff_photo2;
      // 削除ボタン表示
      //setphotoDisplay2(false);
      photo2_del_flg = false;
    }else{
      var photo_2 = "";
    }
    
    if(typeof profile.staff_photo3 !== 'undefined' 
      && profile.staff_photo3 != null
      && profile.staff_photo3 != ""
    ){
      var photo_3 = photo_path+profile.staff_photo3;
      // 削除ボタン表示
      //setphotoDisplay3(false);
      photo3_del_flg = false;
    }else{
      var photo_3 = "";
    }

    if(typeof profile.staff_photo4 !== 'undefined' 
      && profile.staff_photo4 != null
      && profile.staff_photo4 != ""
    ){
      var photo_4 = photo_path+profile.staff_photo4;
      // 削除ボタン表示
      //setphotoDisplay3(false);
      photo4_del_flg = false;
    }else{
      var photo_4 = "";
    }

  }

  // もしなかった場合
  if(!birthday.length){
    // 日付を分割したものを入れる
    birthday[0] = "";
    birthday[1] = "";
    birthday[2] = "";
  }

  const [staff_birthday_year, setstaff_birthday_year] = useState(birthday[0]);
  const [staff_birthday_month, setstaff_birthday_month] = useState(birthday[1]);
  const [staff_birthday_day, setstaff_birthday_day] = useState(birthday[2]);

  // 各テキストボックス
  const [birthplace, setbirthplace] = useState(buf_birthplace);

  // [NEW]20220408
  const [profile_tag, setprofile_tag] = useState({tags: {tag: '', tagsArray: buf_profile_tag}});
  // const [profile_tag, setprofile_tag] = useState(buf_profile_tag);
  // const [birthplace, setbirthplace] = useState([]);
  // const [profile_tag, setprofile_tag] = useState([]);

  // ファイル選択1
  const [filedata1,setFiledata1] = useState({'uri':photo_1});
  // ファイル選択2
  const [filedata2,setFiledata2] = useState({'uri':photo_2});
  // ファイル選択3
  const [filedata3,setFiledata3] = useState({'uri':photo_3});
  // ファイル選択4
  const [filedata4,setFiledata4] = useState({'uri':photo_4});


  // 表示非表示用【画像削除】(デフォルトは上記の「photo1_del_flg」次第)
  const [photoDisplay1, setphotoDisplay1] = useState(photo1_del_flg);
  // 表示非表示用【画像削除】(デフォルトは上記の「photo2_del_flg」次第)
  const [photoDisplay2, setphotoDisplay2] = useState(photo2_del_flg);
  // 表示非表示用【画像削除】(デフォルトは上記の「photo3_del_flg」次第)
  const [photoDisplay3, setphotoDisplay3] = useState(photo3_del_flg);
  // 表示非表示用【画像削除】(デフォルトは上記の「photo4_del_flg」次第)
  const [photoDisplay4, setphotoDisplay4] = useState(photo4_del_flg);

  const [photoData1, setphotoData1] = useState(photo_1);
  const [photoData2, setphotoData2] = useState(photo_2);
  const [photoData3, setphotoData3] = useState(photo_3);
  const [photoData4, setphotoData4] = useState(photo_4);



  // 表示非表示用【人気タグ一覧】
  const [tagDisplay, settagDisplay] = useState(true);

  // タグの表示非表示
  //const [DisplayStyle, setDisplayStyle] = useState({display: 'block'});

  // [NEW]20220408
  /****************************************************************
  * 機　能： タグの登録部分
  * 引　数： strDate = 入力された値と登録されたデータ(配列)
  ****************************************************************/
  const updateTagState = (state) => {
    setprofile_tag({tags: state})
  };


  /****************************************************************
  * 機　能： 写真登録
  * 引　数： img_no = 登録する写真NO
  // ※img_noは画像順番
  //【1：仕事イメージ】
  //【2：プライベート1】
  //【3：プライベート2】
  ****************************************************************/
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

	const pickImage = async (img_no) => {

    if (!await LibraryPermissionsCheck()) return;
    
	  let result = await ImagePicker.launchImageLibraryAsync({
		  mediaTypes: ImagePicker.MediaTypeOptions.Images,
		  allowsEditing: true,
		  quality: 1,
	  });
	  
	  if(result){
	      // キャンセルじゃなかった場合【ローディングを挟む】
	      if(!result["cancelled"]) setLoading(true);

        let filename = result.uri.split('/').pop();
  
        let match = /\.(\w+)$/.exec(filename);
        let type = match ? `image/${match[1]}` : `image`;
        
        //setFiledata1(result);

        // ※画像保存処理
        let formData = new FormData();
        formData.append('ID',route.params.account);
        formData.append('pass',route.params.password);
        formData.append('img_no',img_no);
        formData.append('act','save_staff_img');
        formData.append('formdata_flg',1);
        formData.append('file', { uri: result.uri, name: filename, type });
        formData.append('fc_flg',global.fc_flg);

          // サーバー上のDBを更新して返す。
        fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
      {
        method: 'POST',
        body: formData,
        header: {
          'content-type': 'multipart/form-data',
        },
      })
        .then((response) => response.json())
        .then((json) => {
        // 成功時？
        console.log(json);
        // ※上記の変数結合版
          // [setFiledata] + [1～3]
          //{'setFiledata'+img_no}(result);
          // 画像の時間を再更新
          nowDate = Date.now();
          
          // ※上記の変数結合版
          // [setFiledata] + [1～3]
          //{'setFiledata'+img_no}(result);
          // どの写真に登録するか判断
          if(img_no=="1"){
            // 写真ファイル名を変数に格納
            var photoData1_buf = route.params.account+"-1"+match[0];
            var photoData2_buf = photoData2;
            var photoData3_buf = photoData3;
            var photoData4_buf = photoData4;
            setphotoData1(photoData1_buf);
            // 写真1に登録した写真をセット
            setFiledata1(result);
            // 写真削除ボタンを表示
            setphotoDisplay1(false);
console.log("0:"+photoData1);

          }else if(img_no=="2"){
            // 写真ファイル名を変数に格納
            var photoData1_buf = photoData1;
            var photoData2_buf = route.params.account+"-2"+match[0];
            var photoData3_buf = photoData3;
            var photoData4_buf = photoData4;
            setphotoData2(photoData2_buf);
            // 写真2に登録した写真をセット
            setFiledata2(result);
            // 写真削除ボタンを表示
            setphotoDisplay2(false);
console.log("1:"+photoData2);

          }else if(img_no=="3"){
            // 写真ファイル名を変数に格納
            var photoData1_buf = photoData1;
            var photoData2_buf = photoData2;
            var photoData3_buf = route.params.account+"-3"+match[0];
            var photoData4_buf = photoData4;
            setphotoData3(photoData3_buf);
            // 写真3に登録した写真をセット
            setFiledata3(result);
            // 写真削除ボタンを表示
            setphotoDisplay3(false);
console.log("2:"+photoData3);

          }else if(img_no=="4"){
            // 写真ファイル名を変数に格納
            var photoData1_buf = photoData1;
            var photoData2_buf = photoData2;
            var photoData3_buf = photoData3;
            var photoData4_buf = route.params.account+"-4"+match[0];
            setphotoData4(photoData4_buf);
            // 写真3に登録した写真をセット
            setFiledata4(result);
            // 写真削除ボタンを表示
            setphotoDisplay4(false);
console.log("3:"+photoData4);
          }

          // ローカルDB更新処理
          db.transaction((tx) => {
            // プロフィール情報の更新
            tx.executeSql(
              'update staff_profile set staff_photo1 = ?, staff_photo2 = ?, staff_photo3 = ?, staff_photo4 = ? where (staff_id = ?);',
              [
                photoData1_buf.replace( photo_path, ""),
                photoData2_buf.replace( photo_path, ""),
                photoData3_buf.replace( photo_path, ""),
                photoData4_buf.replace( photo_path, ""),
                staffs.account
              ],
              // 変更成功
              (_, { rows }) => {
                // 更新成功時、プロフィール情報の変数を更新
                tx.executeSql(
                  `select * from staff_profile;`,
                  [],
                  (_, { rows }) => {
                    // プロフィール情報の変数を更新
                    route.profile = rows._array;
                  },
                  () => {
                    console.log("失敗");
                  }
                );
                
                console.log(route.profile);
                console.log('写真登録【DB変更】しました');
              },
              () => {
                // 変更失敗
                console.log('写真登録【DB変更】できなかったよ')
              }
            );
          });
          // ローディング終了
          setLoading(false);
        })
        .catch((error) => {
          // ローディング終了
          setLoading(false);
          console.log(error)
          const errorMsg = "写真ファイルをアップできませんでした";
          Alert.alert(errorMsg);
        })

	  }
	  
  };


  /****************************************************************
  * 機　能： 写真削除時
  * 引　数： img_no = 削除する写真NO
  ****************************************************************/
  const delImage = async (img_no) => {
    // 確認ダイアログ[こういう風にするらしい・・・。]
    Alert.alert('削除確認', '削除してよろしいですか？', [
      {
        text: 'はい', 
        onPress: () => {
          // *****************************
          // ダイアログ　「はい」選択時
          //  画像の削除処理開始！！！
          // *****************************
          // ※画像保存処理
          let formData = new FormData();
          formData.append('ID',route.params.account);
          formData.append('pass',route.params.password);
          formData.append('img_no',img_no);
          formData.append('act','del_staff_img');
          formData.append('formdata_flg',1);
          formData.append('fc_flg',global.fc_flg);

          // ローディング開始
          setLoading(true);

          // サーバー上のDBを更新して返す。
          fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
          {
            method: 'POST',
            body: formData,
            header: {
              'content-type': 'multipart/form-data',
            },
          })
          .then((response) => response.json())
          .then((json) => {
            // 成功時？
            //console.log(json);
            
            // ※上記の変数結合版
            // [setFiledata] + [1～3]
            //{'setFiledata'+img_no}(result);
            // どの写真を削除したか判断
            if(img_no=="1"){
              // 写真1の参照ファイルURLを消す
              setFiledata1({'uri':null});
              // 写真削除ボタンを非表示
              setphotoDisplay1(true);
              var photoData1_buf = "";
              var photoData2_buf = photoData2;
              var photoData3_buf = photoData3;
              var photoData4_buf = photoData4;

              // 写真1のファイル名が入っているグローバル変数の初期化
              setphotoData1(photoData1_buf);

            }else if(img_no=="2"){
              // 写真2の参照ファイルURLを消す
              setFiledata2({'uri':null});
              // 写真削除ボタンを非表示
              setphotoDisplay2(true);

              var photoData1_buf = photoData1;
              var photoData2_buf = "";
              var photoData3_buf = photoData3;
              var photoData4_buf = photoData4;

              // 写真2のファイル名が入っているグローバル変数の初期化
              setphotoData2(photoData2_buf);
    
            }else if(img_no=="3"){
              // 写真3の参照ファイルURLを消す
              setFiledata3({'uri':null});
              // 写真削除ボタンを非表示
              setphotoDisplay3(true);
              
              var photoData1_buf = photoData1;
              var photoData2_buf = photoData2;
              var photoData3_buf = "";
              var photoData4_buf = photoData4;

              // 写真3のファイル名が入っているグローバル変数の初期化
              setphotoData3(photoData3_buf);
              
            }else if(img_no=="4"){
              // 写真4の参照ファイルURLを消す
              setFiledata4({'uri':null});
              // 写真削除ボタンを非表示
              setphotoDisplay4(true);
              
              var photoData1_buf = photoData1;
              var photoData2_buf = photoData2;
              var photoData3_buf = photoData3;
              var photoData4_buf = "";

              // 写真4のファイル名が入っているグローバル変数の初期化
              setphotoData4(photoData4_buf);
            }
            
            console.log(photoData4);
    
            // ローカルDB更新処理
            db.transaction((tx) => {

              // プロフィール情報
              tx.executeSql(
                'update staff_profile set staff_photo1 = ?, staff_photo2 = ?, staff_photo3 = ?, staff_photo4 = ? where (staff_id = ?);',
                [
                  photoData1_buf.replace( photo_path, ""),
                  photoData2_buf.replace( photo_path, ""),
                  photoData3_buf.replace( photo_path, ""),
                  photoData4_buf.replace( photo_path, ""),
                  staffs.account
                ],
                // 変更成功
                (_, { rows }) => {
                  // 更新成功時、プロフィール情報の変数を更新
                  tx.executeSql(
                    `select * from staff_profile;`,
                    [],
                    (_, { rows }) => {
                      //console.log(rows._array);
                      // プロフィール情報の変数を更新
                      route.profile = rows._array;
                    },
                    () => {
                      console.log("画像削除(ローカルDB)に失敗しました。");
                    }
                  );
                  console.log('画像削除しました');
                },
                () => {
                  // 変更失敗
                  console.log('画像削除できなかったよ');
                }
              );
            });
            // ローディング終了
            setLoading(false);
          })
          .catch((error) => {
            // ローディング終了
            setLoading(false);
            console.log(error)
            const errorMsg = "ファイル削除できませんでした";
            Alert.alert(errorMsg);
          })
        }
      },
      {
        text: 'いいえ',
        onPress: () => {
          // *********************************
          // ダイアログ　「いいえ」選択時
          // *********************************
          console.log('cancel Pressed');
          return false;
        },
      },
    ]
    );
  }

  /****************************************************************
  * 機　能： 人気タグを押した時に登録する処理
  * 引　数： tag_name = 人気タグの名称
  ****************************************************************/
  const setTagData = async (tag_name) => {
    profile_tag.tags.tagsArray.push(tag_name);
    updateTagState(profile_tag.tags);
  }

  /****************************************************************
  * 機　能： 人気タグの枠の表示非表示
  * 引　数： tag_group = 人気タググループ
  ****************************************************************/
  const desplayTag = async (tag_group) => {
    if(tagDisplay){
      settagDisplay(false);
    }else{
      settagDisplay(true);
    }
  }

  // 端末の戻るボタン
  const backAction = () => {
    if (!isLoading) {
      navigation.reset({
        index: 0,
        routes: [
          {
            name: route.previous,
            params: route.params,
            websocket: route.websocket,
            websocket2: route.websocket2,
            profile: route.profile,
            previous: "Ranking",
          },],
      });
    }
    return true;
  };

  useEffect(() => {
    
    
    navigation.setOptions({
      headerLeft: () => (
        <Feather
          name='chevron-left'
          color='white'
          size={30}
          onPress={() => {
            if (!isLoading) {
              navigation.reset({
                index: 0,
                routes: [{
                  name: route.previous,
                  params: route.params,
                  websocket:route.websocket,
                  websocket2: route.websocket2,
                  profile:route.profile,
                  previous:'Setting'
                }],
              });
            }
          }}
          style={{paddingHorizontal:20,paddingVertical:10}}
        />
      ),
      headerRight: () => (
        <Feather
          name='log-out'
          color='white'
          size={30}
          onPress={() => {
            if (!isLoading) {
              logout()
            }
          }}
          style={{paddingHorizontal:20,paddingVertical:10}}
        />
      ),
    });
    
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );
    
    return () => backHandler.remove();
  }, [isLoading]);
  
  
function sleep(waitMsec) {
  var startMsec = new Date();

  // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
  while (new Date() - startMsec < waitMsec);
}

async function Delete_staff_db(){

  const dbList = [
    "staff_mst",
    "staff_list",
    "customer_mst",
    "communication_mst",
    "fixed_mst",
    "staff_profile",
    "ranking_mst",
    "black_sales_mst",
    "staff_all",
    "chat_room",
    "chat_message",
  ]
  
  for (var d=0;d<dbList.length;d++) {
    var table = dbList[d];
    var delete_sql = `DROP TABLE ${table};`;
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

  if (!await logoutCheck()) false;

  storage.save({
    key: 'GET-DATA',
    data: '',
  });

  storage.save({
    key: 'GET-DATA2',
    data: '',
  });
  
  await Delete_staff_db();
  
  if(global.sp_token && global.sp_id){
    
    const tokenDelete = async () => new Promise((resolve) => {
      // サーバーに情報送信して、DBから削除
      fetch(domain+'app/app_system/set_staff_app_token.php', {
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
      .then((response) => response.json())
      .then((json) => {resolve(true)})
      .catch((error) => {resolve(true)})
    })

    await tokenDelete();
    
  }
  
  if(global.fc_flg){
    
    const fc_logout = async () => new Promise((resolve) => {
      let formData = new FormData();
      formData.append('fc_logout',1);
      
      fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
      {
        method: 'POST',
        header: {
          'content-type': 'multipart/form-data',
        },
        body: formData
      })
      .then((response) => response.json())
      .then((json) => {resolve(true)})
      .catch((error) => {resolve(true)})
    })

    await fc_logout();
    
  }
  
  global.sp_token = ''; // スマホトークン
  global.sp_id = '';    // ログインID
  global.fc_flg = '';   // fcフラグ
  
  navigation.reset({
    index: 0,
    routes: [{ name: 'LogIn' }],
  });
  
}
  
/****************************************************************
* 機　能： 入力された値が日付でYYYY/MM/DD形式になっているか調べる
* 引　数： strDate = 入力された値
* 戻り値： 正 = true　不正 = false
****************************************************************/
function ckDate(strDate) {
    if(!strDate.match(/^\d{4}\/\d{2}\/\d{2}$/)){
        return false;
    }
    var y = strDate.split("/")[0];
    var m = strDate.split("/")[1] - 1;
    var d = strDate.split("/")[2];
    var date = new Date(y,m,d);
    if(date.getFullYear() != y || date.getMonth() != m || date.getDate() != d){
        return false;
    }
    return true;
}
  
function onSubmit() {
  // エラーチェック
  var error_message = "";
  // 生年月日が中途半端かチェック
  if(staff_birthday_year || staff_birthday_month || staff_birthday_day){
    // 年が入っていない場合
    if(!staff_birthday_year ){
      error_message += "・生年月日の年が記入されていません。\n";
    }
    
    if(!staff_birthday_month){
      error_message += "・生年月日の月が記入されていません。\n";
    }

    if(!staff_birthday_day){
      error_message += "・生年月日の日が記入されていません。\n";
    }
    
    birthday = staff_birthday_year;
    birthday += "/"+('00' + staff_birthday_month).slice(-2);
    birthday += "/"+('00' + staff_birthday_day).slice(-2);
    if(!ckDate(birthday)){
      error_message += "・入力された日付がおかしいです。\n";
    }
    
  }
  
  
  // エラーメッセージ表示
  if(error_message){
    error_message = "記入エラーがあります\n下記の情報を確認してください。\n\n"+error_message;
    Alert.alert("【エラー】",error_message);
    return false;
  }
  
  // ローディング開始
  setLoading(true);

// console.log("03"+photo_3);

  // タグの区切りを「,」で区切る
  // ※「空白系 全角「、」を「,」に変換」
  save_profile_tag = "";
  save_profile_tag = replaceElement(profile_tag["tags"]["tagsArray"],",","、");
  
  // setting_list形成
  var setting_list = '';
  
  // オプション1
  if (setting_list1) {
    if (setting_list) {
      setting_list += ',' + '1';
    } else {
      setting_list += '1';
    }
    setting_list += setting_list1_staff;
  }
  
  // オプション2
  if (setting_list2) {
    if (setting_list) {
      setting_list += ',' + '2';
    } else {
      setting_list += '2';
    }
    setting_list += setting_list2_staff;
  }
  
  // オプション3
  if (setting_list3) {
    if (setting_list) {
      setting_list += ',' + '3';
    } else {
      setting_list += '3';
    }
  }
  
  // オプション5
  if (setting_list5) {
    if (setting_list) {
      setting_list += ',' + '5';
    } else {
      setting_list += '5';
    }
  }
  
  // オプション6
  if (setting_list6) {
    if (setting_list) {
      if (setting_list6_select) {
        setting_list += ','+'6'+'_'+setting_list6_select;
      } else {
        setting_list += ','+'6';
      }
    } else {
      if (setting_list6_select) {
        setting_list += '6'+'_'+setting_list6_select;
      } else {
        setting_list += '6';
      }
    }
    setting_list += setting_list6_staff?'_a':'';
  }
  
  // オプション7
  if (setting_list7) {
    if (setting_list) {
      setting_list += ',' + '7';
    } else {
      setting_list += '7';
    }
  }
  
  // オプション8
  if (setting_list5) {
    if (setting_list) {
      setting_list += ',' + '8';
    } else {
      setting_list += '8';
    }
  }
  
  // オプション9(通知設定)
  if (contact) {
    if (setting_list) {
      setting_list += ',' + contact;
    } else {
      setting_list += contact;
    }
  }
  
  // オプション10
  if (setting_list10) {
    if (setting_list) {
      setting_list += ',' + '10';
    } else {
      setting_list += '10';
    }
  }
  
  // ローカルDB変更
  db.transaction((tx) => {
    tx.executeSql(
      'update staff_mst set mail_name = (?), setting_list = (?), top_staff_list = (?), setting_list7_mail = (?) where (account = ? and password = ?);',
      [mail_name,setting_list,top_staff_list,setting_list7_mail,staffs.account,staffs.password],
      // 変更成功
      (_, { rows }) => {
        tx.executeSql(
          `select * from staff_mst;`,
          [],
          (_, { rows }) => {
            route.params = rows._array[0];
            // console.log(rows._array);
          },
          () => {
            console.log("失敗");
          }
        );
        console.log('変更しました');
      },
      () => {
        // 変更失敗
        console.log('変更できなかったよ');
      }
    );
    
    var birthday_data = "";
    if(staff_birthday_year && staff_birthday_month && staff_birthday_day){
      birthday_data = staff_birthday_year +"-"+staff_birthday_month+"-"+staff_birthday_day;
    }

    // console.log(save_profile_tag.join(','));

    // プロフィール情報
    tx.executeSql(
      'update staff_profile set birthday = ?, birthplace = ?, profile_tag = ?, staff_photo1 = ?, staff_photo2 = ?, staff_photo3 = ?, staff_photo4 = ? where (staff_id = ?);',
      [
        birthday_data,
        birthplace,
        save_profile_tag.join(','),
        photoData1.replace( photo_path, ""),
        photoData2.replace( photo_path, ""),
        photoData3.replace( photo_path, ""),
        photoData4.replace( photo_path, ""),
        staffs.account
      ],
      // 変更成功
      (_, { rows }) => {
        tx.executeSql(
          `select * from staff_profile;`,
          [],
          (_, { rows }) => {
            // console.log(rows._array);
            route.profile = rows._array;
          },
          () => {
            console.log("失敗");
          }
        );
        console.log(photo_1);
        console.log('999変更しました');
        
        // ここに入れないといけないかも
        
        
        
        
        
        
        
      },
      () => {
        // 変更失敗
        console.log('999変更できなかったよ');
      }
    );

  });
  
  let formData = new FormData();
  formData.append('ID',route.params.account);
  formData.append('pass',route.params.password);
  formData.append('act','user_setting');
  formData.append('formdata_flg',1);
  formData.append('setting_flg',1);
  formData.append('mail_name',mail_name);
  formData.append('setting_list',setting_list);
  formData.append('top_staff_list',top_staff_list);
  formData.append('setting_list7_mail',setting_list7_mail);
    formData.append('fc_flg',global.fc_flg);

  // PHP側でドットがアンスコに変換されてしまうのでフォームで送信
    fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
  {
    method: 'POST',
    header: {
      'content-type': 'multipart/form-data',
    },
    body: formData
  })
    .then((response) => response.json())
    .then((json) => {
      console.log('OK');
    })
    .catch((error) => {
      console.log(error);
      Alert.alert("登録に失敗しました");
    })
  
  // プロフィール
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
        staff_address : birthplace,
        staff_birthday_year : staff_birthday_year,
        staff_birthday_month :staff_birthday_month,
        staff_birthday_day : staff_birthday_day,
        profile_tag : save_profile_tag.join(','),
        staff_photo1 : photoData1.replace( photo_path, ""),
        staff_photo2 : photoData2.replace( photo_path, ""),
        staff_photo3 : photoData3.replace( photo_path, ""),
        staff_photo4 : photoData4.replace( photo_path, ""),
        act:'user_setting',
        fc_flg: global.fc_flg
      })
    })
      .then((response) => response.json())
      .then((json) => {
        // ローディング終了
        setLoading(false);
        //console.log(photoData1);
        Alert.alert('設定を変更しました');
        //console.log(json);
      })
      .catch((error) => {
        // ローディング終了
        setLoading(false);
        const errorMsg = "設定の変更に失敗しました";
        Alert.alert(errorMsg);
      })
};


// 配列内のデータ置き換え(現在スタッフタグ用)
function replaceElement(array, before, after) {
  for(var i=0; i<array.length; i++){
    array[i] = array[i].replace(before, after);
  }
  return array;
}
  
  // パスワードのモーダルを閉じる
  function passwordClose() {
    
    setOld_password(null);
    setNew_password1(null);
    setNew_password2(null);
    setPassword_modal(false);
    
  }

  // パスワード変更
  function passwordSubmit() {
    
    // ローディング開始
    setLoading(true);
    
    var err = '';
    
    if (password != old_password) {
      err += '\n・元のパスワードが間違っています';
    }
    
    if (new_password1 !== new_password2) {
      err += '\n・新しいパスワードと再入力パスワードが違います';
    }
    
    const ratz = /[a-z]/, rAtZ = /[A-Z]/, r0t9 = /[0-9]/;
    
    if(rAtZ.test(new_password1) && ratz.test(new_password1)) {
      ;
    } else {
      err += '\n・英大文字と小文字を含めてください';
    }
    
    if(r0t9.test(new_password1)) {
      ;
    } else {
      err += '\n・数字を含めてください';
    }
    
    if(new_password1 && new_password1.length >= 8) {
      ;
    } else {
      err += '\n・パスワードは8文字以上入力してください';
    }
    
    if (err) {
      // ローディング終了
      setLoading(false);
      Alert.alert('以下のエラーが出ました',err);
      return
    }
    
    // ローカルDB変更
    db.transaction((tx) => {
      tx.executeSql(
        'update staff_mst set password = (?) where (account = ? and password = ?);',
        [new_password1,staffs.account,staffs.password],
        // 変更成功
        (_, { rows }) => {
          tx.executeSql(
            `select * from staff_mst;`,
            [],
            (_, { rows }) => {
              route.params = rows._array[0];
              console.log(rows._array[0])
            },
            () => {
              console.log("失敗");
            }
          );
          console.log('変更しました');
        },
        () => {
          // 変更失敗
          console.log('変更できなかったよ');
        }
      );
  
    });
    
    setPassword(new_password1);
    
    let formData = new FormData();
    formData.append('ID',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act','user_setting');
    formData.append('formdata_flg',1);
    formData.append('password',new_password1);
    formData.append('fc_flg',global.fc_flg);

    // PHP側でドットがアンスコに変換されてしまうのでフォームで送信
      fetch(domain+'batch_app/api_system_app.php?'+Date.now(),
    {
      method: 'POST',
      header: {
        'content-type': 'multipart/form-data',
      },
      body: formData
    })
      .then((response) => response.json())
      .then((json) => {
        // ローディング終了
        setLoading(false);
        Alert.alert('パスワードを変更しました');
        passwordClose();
      })
      .catch((error) => {
        // ローディング終了
        setLoading(false);
        const errorMsg = "パスワードの変更に失敗しました";
        Alert.alert(errorMsg);
        passwordClose();
      })
      
  }

  // 個人メールアドレスのモーダル閉じる
  function mailClose() {
    setMail(null);
    setMail_modal(false);
  }

  // 個人メールアドレス登録
  function mailSubmit() {
    
    // ローディング開始
    setLoading(true);
    
    var err = '';
    
    if (!mail.match(/^([a-zA-Z0-9])+([a-zA-Z0-9\._-])*@([a-zA-Z0-9_-])+([a-zA-Z0-9\._-]+)+$/)) {
      err += 'メールアドレスの形式が間違っています';
    }
    
    if (err) {
      Alert.alert('以下のエラーが出ました',err);
      return
    }
    
    mailClose()
    
    var mail_select = '';
    
    if (mail_modal == 1) {
      mail_select = 'mail1';
    } else if (mail_modal == 2) {
      mail_select = 'mail2';
    } else if (mail_modal == 3) {
      mail_select = 'mail3';
    }
    
    let formData = new FormData();
    formData.append('val[id]',route.params.account);
    formData.append('val[pass]',route.params.password);
    formData.append('val[app_flg]',1);
    formData.append('act','email_preprocessing_setting');
    formData.append('val[mail_address]',mail);
    formData.append('val[mail_select]',mail_select);
    formData.append('fc_flg',global.fc_flg);

    // PHP側でドットがアンスコに変換されてしまうのでフォームで送信
      fetch(domain+'php/ajax/select.php',
    {
      method: 'POST',
      header: {
        'content-type': 'multipart/form-data',
      },
      body: formData
    })
      .then((response) => response.json())
      .then((json) => {
        // ローディング終了
        setLoading(false);
        console.log(json)
        if (json == 'true') {
          Alert.alert('','確認メールをお送りしました\n登録されたアドレスの受信メールをご確認頂き、リンクをクリックしてください');
          mailClose();
          
          if (mail_modal == 1) {
            setMail1(mail);
          } else if (mail_modal == 2) {
            setMail2(mail);
          } else if (mail_modal == 3) {
            setMail3(mail);
          }
          
          // ローカルDB変更
          db.transaction((tx) => {
            tx.executeSql(
              'update staff_mst set '+mail_select+' = (?) where (account = ? and password = ?);',
              [mail,staffs.account,staffs.password],
              // 変更成功
              (_, { rows }) => {
                tx.executeSql(
                  `select * from staff_mst;`,
                  [],
                  (_, { rows }) => {
                    route.params = rows._array[0];
                    // console.log(rows._array[0])
                  },
                  () => {
                    console.log("失敗");
                  }
                );
                console.log('変更しました');
              },
              () => {
                // 変更失敗
                console.log('変更できなかったよ');
              }
            );
        
          });
          
        } else {
          Alert.alert('','確認のメールアドレスを送れませんでした\nメールアドレスを再度確認してください');
          mailClose()
        }
      })
      .catch((error) => {
        // ローディング終了
        setLoading(false);
        const errorMsg = "確認メール送信に失敗しました";
        Alert.alert(errorMsg);
        mailClose();
      })
    
  }
  
  // 個人メールアドレス削除
  function mail_delete(num) {
    
    var mail_select = '';
    
    if (num == 1) {
      mail_select = 'mail1';
    } else if (num == 2) {
      mail_select = 'mail2';
    } else if (num == 3) {
      mail_select = 'mail3';
    }
    
    Alert.alert(
      "",
      "メールアドレスを削除しますか？",
      [
        {
          text: "はい",
          onPress: () => {
            
            // ローディング開始
            setLoading(true);
            
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
                  act:'staff_delete_mail',
                  mail_select:mail_select,
                  fc_flg:global.fc_flg
                })
              })
              .then((response) => response.json())
              .then((json) => {
                
                // ローカルDB変更
                db.transaction((tx) => {
                  tx.executeSql(
                    'update staff_mst set '+mail_select+' = null where (account = ? and password = ?);',
                    [staffs.account,staffs.password],
                    // 変更成功
                    (_, { rows }) => {
                      tx.executeSql(
                        `select * from staff_mst;`,
                        [],
                        (_, { rows }) => {
                          route.params = rows._array[0];
                          // console.log(rows._array[0])
                        },
                        () => {
                          console.log("失敗");
                        }
                      );
                      console.log('変更しました');
                    },
                    () => {
                      // 変更失敗
                      console.log('変更できなかったよ');
                    }
                  );
              
                });
                
                if (num == 1) {
                  setMail1(null);
                } else if (num == 2) {
                  setMail2(null);
                } else if (num == 3) {
                  setMail3(null);
                }
          
                // ローディング終了
                setLoading(false);
                console.log(json);
                Alert.alert("削除しました");
              })
              .catch((error) => {
                console.log(error);
                Alert.alert("メールアドレス削除に失敗しました");
              })
          }
        },
        {
          text: "いいえ",
        },
      ]
    );
  }


  return (
    <>
    <KeyboardAvoidingView style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'position' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 70}
    >
      <Loading isLoading={isLoading} />
      {/* <ScrollView contentContainerStyle={styles.form}> */}
      <FlatList
        style={styles.form}
        data={[(
        <GestureRecognizer
          onSwipeRight={()=>{backAction()}}
          style={{flex: 1}}
        >
          <Text style={styles.title}>個人ID 設定1</Text>
          <View style={{flexDirection: 'row'}}>
            <View style={styles.input}>
              <Text style={styles.label}>氏名(姓)</Text>
              <TextInput
                value={name_1}
                onChangeText={(text) => {setName_1(text)}}
                style={styles.inputInner}
                editable={false}
              />
            </View>
            <View style={styles.input}>
              <Text style={styles.label}>氏名(名)</Text>
              <TextInput
                value={name_2}
                onChangeText={(text) => {setName_2(text)}}
                style={styles.inputInner}
                editable={false}
              />
            </View>
          </View>
          
          <View style={{flexDirection:'row'}}>
            <Text style={styles.label}>パスワード</Text>
            <View style={styles.btn_wrap}>
              <TouchableOpacity onPress={() => {setPassword_modal(true)}} style={styles.btn}>
                <Text style={styles.btn_text}>変　更</Text>
              </TouchableOpacity>
            </View>
          </View>
          <TextInput
            value={password}
            onChangeText={(text) => {setPassword(text)}}
            style={styles.inputInner}
            editable={false}
            secureTextEntry={true}
          />
          <Modal
            isVisible={password_modal}
            onBackdropPress={() => {passwordClose()}}
            swipeDirection={['up']}
            onSwipeComplete={() => {passwordClose()}}
            backdropOpacity={0.5}
            animationInTiming={300}
            animationOutTiming={500}
            animationIn={'slideInDown'}
            animationOut={'slideOutUp'}
            propagateSwipe={true}
            style={{alignItems: 'center'}}
          >
            <KeyboardAvoidingView  style={styles.password_modal} behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top:8,
                  right:10,
                  zIndex:999
                }}
                onPress={() => {passwordClose()}}
              >
                <Feather name='x-circle' color='gray' size={35} />
              </TouchableOpacity>
              <Text>パスワードの条件：{"\n"}・英大文字と小文字を含む{"\n"}・数字を含む{"\n"}・８文字以上</Text>
              <Text style={styles.modal_label}>元のパスワード</Text>
              <TextInput
                value={old_password}
                onChangeText={(text) => {setOld_password(text)}}
                style={styles.inputInner}
                keyboardType={'email-address'}
              />
              <Text style={styles.modal_label}>新しいパスワード</Text>
              <TextInput
                value={new_password1}
                onChangeText={(text) => {setNew_password1(text)}}
                style={styles.inputInner}
                secureTextEntry={true}
              />
              <Text style={styles.modal_label}>【再入力】新しいパスワード</Text>
              <TextInput
                value={new_password2}
                onChangeText={(text) => {setNew_password2(text)}}
                style={styles.inputInner}
                secureTextEntry={true}
              />
              <TouchableOpacity
                onPress={passwordSubmit}
                style={styles.moddal_submit}
              >
                <Text style={styles.submitLabel}>変　更</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Modal>
          
          <Text style={[styles.label,{marginBottom:0}]}>メールの表示名</Text>
          <Text style={styles.label_text}>※お客様側でメールを受信したとき表示される送信元名です{"\n"}未設定の場合は店舗名が表示されます</Text>
          <TextInput
            value={mail_name}
            onChangeText={(text) => {setMail_name(text)}}
            style={styles.inputInner}
          />
          
          <View style={{flexDirection:'row'}}>
            <Text style={styles.label}>個人メールアドレス1</Text>
            {mail1?(
            <View style={styles.btn_wrap}>
              <TouchableOpacity
                onPress={() => {
                  setMail_modal(1)
                  setMail(mail1);
                }}
                style={styles.btn}
              >
                <Text style={styles.btn_text}>変　更</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {mail_delete(1)}} style={[styles.btn,styles.delbtn]}>
                <Text style={styles.delbtn_text}>削　除</Text>
              </TouchableOpacity>
            </View>
            ):(
            <View style={styles.btn_wrap}>
              <TouchableOpacity onPress={() => {setMail_modal(1)}} style={styles.btn}>
                <Text style={styles.btn_text}>追　加</Text>
              </TouchableOpacity>
            </View>
            )}
            
          </View>
          <TextInput
            value={mail1}
            onChangeText={(text) => {setMail1(text)}}
            style={styles.inputInner}
            editable={false}
          />
          
          <View style={{flexDirection:'row'}}>
            <Text style={styles.label}>個人メールアドレス2</Text>
            {mail2?(
            <View style={styles.btn_wrap}>
              <TouchableOpacity
                onPress={() => {
                  setMail_modal(2)
                  setMail(mail2);
                }}
                style={styles.btn}
              >
                <Text style={styles.btn_text}>変　更</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {mail_delete(2)}} style={[styles.btn,styles.delbtn]}>
                <Text style={styles.delbtn_text}>削　除</Text>
              </TouchableOpacity>
            </View>
            ):(
            <View style={styles.btn_wrap}>
              <TouchableOpacity onPress={() => {setMail_modal(2)}} style={styles.btn}>
                <Text style={styles.btn_text}>追　加</Text>
              </TouchableOpacity>
            </View>
            )}
            
          </View>
          <TextInput
            value={mail2}
            onChangeText={(text) => {setMail2(text)}}
            style={styles.inputInner}
            editable={false}
          />
          
          <View style={{flexDirection:'row'}}>
            <Text style={styles.label}>個人メールアドレス3</Text>
            {mail3?(
            <View style={styles.btn_wrap}>
              <TouchableOpacity
                onPress={() => {
                  setMail_modal(3);
                  setMail(mail3);
                }}
                style={styles.btn}
              >
                <Text style={styles.btn_text}>変　更</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {mail_delete(3)}} style={[styles.btn,styles.delbtn]}>
                <Text style={styles.delbtn_text}>削　除</Text>
              </TouchableOpacity>
            </View>
            ):(
            <View style={styles.btn_wrap}>
              <TouchableOpacity onPress={() => {setMail_modal(3)}} style={styles.btn}>
                <Text style={styles.btn_text}>追　加</Text>
              </TouchableOpacity>
            </View>
            )}
            
          </View>
          <TextInput
            value={mail3}
            onChangeText={(text) => {setMail3(text)}}
            style={styles.inputInner}
            editable={false}
          />
          
          <Modal
            isVisible={mail_modal}
            onBackdropPress={() => {mailClose()}}
            swipeDirection={['up']}
            onSwipeComplete={() => {mailClose()}}
            backdropOpacity={0.5}
            animationInTiming={300}
            animationOutTiming={500}
            animationIn={'slideInDown'}
            animationOut={'slideOutUp'}
            propagateSwipe={true}
            style={{alignItems: 'center'}}
          >
            <KeyboardAvoidingView style={styles.password_modal} behavior={Platform.OS === "ios" ? "padding" : "height"}>
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top:8,
                  right:10,
                  zIndex:999
                }}
                onPress={() => {mailClose()}}
              >
                <Feather name='x-circle' color='gray' size={35} />
              </TouchableOpacity>
              <Text style={styles.modal_label}>個人メールアドレス{mail_modal}</Text>
              <TextInput
                value={mail}
                onChangeText={(text) => {setMail(text)}}
                style={styles.inputInner}
                keyboardType={'email-address'}
              />
              <TouchableOpacity
                onPress={mailSubmit}
                style={styles.moddal_submit}
              >
                <Text style={styles.submitLabel}>確認メール送信</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          </Modal>
          
          <Text style={styles.label}>通知方法</Text>
          <View >
            <RadioButtonRN
              data={radio}
              value={contact}
              selectedBtn={(e) => {setContact(e.value)}}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              initial={!contact?1:contact==='9_1'?2:contact==='9'?3:2}
            />
            
          </View>
          
          <Text style={styles.title}>個人ID 設定2</Text>
          
          <View style={[styles.setting2,{zIndex:999}]}>
            <View style={{width:'70%'}}>
              <View style={[{flexDirection:'row',zIndex:999,marginBottom:15}]}>
                <Text style={styles.label2}>1.</Text>
                <DropDownPicker
                  style={styles.dropDown}
                  containerStyle={{width:160}}
                  dropDownContainerStyle={styles.dropDownContainer}
                  open={open_setting_list1_staff}
                  value={setting_list1_staff}
                  items={cus_list}
                  setOpen={setOpen_setting_list1_staff}
                  setValue={setSetting_list1_staff}
                  zIndex={900}
                  dropDownDirection={'BOTTOM'}
                />
              </View>
              <Text style={styles.dropDownlabel}>からメールがあった時に、個人携帯に通知</Text>
            </View>
            <RadioButtonRN
              data={DoNotDo}
              value={setting_list1}
              selectedBtn={(e) => {
                setSetting_list1(e.value);
              }}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              box={true}
              boxStyle={styles.radio_box}
              textStyle={{marginLeft:10,fontSize:16}}
              style={{flex:1}}
              initial={setting_list1?1:2}
            />
          </View>
          
          <View style={[styles.setting2,{zIndex:998}]}>
            <View style={{width:'70%'}}>
              <View style={{flexDirection:'row',zIndex:998,marginBottom:15}}>
                <Text style={styles.label2}>2.</Text>
                <DropDownPicker
                  style={styles.dropDown}
                  containerStyle={{width:160}}
                  dropDownContainerStyle={styles.dropDownContainer}
                  open={open_setting_list2_staff}
                  value={setting_list2_staff}
                  items={cus_list}
                  setOpen={setOpen_setting_list2_staff}
                  setValue={setSetting_list2_staff}
                  zIndex={900}
                  dropDownDirection={'BOTTOM'}
                />
              </View>
              <Text style={styles.dropDownlabel}>が物件を閲覧したときに、個人携帯に通知</Text>
            </View>
            <RadioButtonRN
              data={DoNotDo}
              value={setting_list2}
              selectedBtn={(e) => {
                setSetting_list2(e.value);
              }}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              box={true}
              boxStyle={styles.radio_box}
              textStyle={{marginLeft:10,fontSize:16}}
              style={{flex:1}}
              initial={setting_list2?1:2}
            />
          </View>
          
          <View style={[styles.setting2]}>
            <View style={{width:'70%',alignSelf:'center'}}>
              <Text style={styles.dropDownlabel}>3.最初反響が入った時に、個人携帯に通知</Text>
            </View>
            <RadioButtonRN
              data={DoNotDo}
              value={setting_list3}
              selectedBtn={(e) => {
                setSetting_list3(e.value);
              }}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              box={true}
              boxStyle={styles.radio_box}
              textStyle={{marginLeft:10,fontSize:16}}
              style={{flex:1}}
              initial={setting_list3?1:2}
            />
          </View>
          
          <View style={[styles.setting2,{zIndex:997}]}>
            <View style={{width:'70%',alignSelf:'center'}}>
              <Text style={styles.dropDownlabel}>4.TOPページの表示の初期設定</Text>
            </View>
            <DropDownPicker
              style={[styles.dropDown,{width:100}]}
              containerStyle={{flex:1}}
              dropDownContainerStyle={[styles.dropDownContainer,{width:100}]}
              open={open_top_staff_list}
              value={top_staff_list}
              items={whole_individual}
              setOpen={setOpen_top_staff_list}
              setValue={setTop_staff_list}
              zIndex={900}
              dropDownDirection={'BOTTOM'}
            />
          </View>
          
          <View style={[styles.setting2]}>
            <View style={{width:'70%',alignSelf:'center'}}>
              <Text style={styles.dropDownlabel}>5.担当するお客様が設定リンク先を閲覧した時に、個人携帯に通知</Text>
            </View>
            <RadioButtonRN
              data={DoNotDo}
              value={setting_list5}
              selectedBtn={(e) => {
                setSetting_list5(e.value);
              }}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              box={true}
              boxStyle={styles.radio_box}
              textStyle={{marginLeft:10,fontSize:16}}
              style={{flex:1}}
              initial={setting_list5?1:2}
            />
          </View>
          
          <View style={[styles.setting2,{zIndex:996}]}>
            <View style={{width:'70%',alignSelf:'center'}}>
              <View style={{flexDirection:'row',zIndex:996,marginBottom:15}}>
                <Text style={styles.label2}>6.AM</Text>
                <DropDownPicker
                  style={styles.dropDown}
                  containerStyle={{width:160}}
                  dropDownContainerStyle={styles.dropDownContainer}
                  open={open_setting_list6_select}
                  value={setting_list6_select}
                  items={list6}
                  setOpen={setOpen_setting_list6_select}
                  setValue={setSetting_list6_select}
                  zIndex={900}
                  dropDownDirection={'BOTTOM'}
                />
              </View>
              <View style={{width:'70%'}}>
                <Text style={styles.dropDownlabel}>に本日の予定を個人携帯に通知</Text>
              </View>
            </View>
            <View>
              <RadioButtonRN
                data={DoNotDo}
                value={setting_list6}
                selectedBtn={(e) => {
                  setSetting_list6(e.value);
                }}
                animationTypes={['rotate']}
                activeColor={'#191970'}
                box={true}
                boxStyle={styles.radio_box}
                textStyle={{marginLeft:10,fontSize:16}}
                style={{flex:1}}
                initial={setting_list6?1:2}
              />
              <DropDownPicker
                style={[styles.dropDown,{width:100}]}
                containerStyle={{flex:1}}
                dropDownContainerStyle={[styles.dropDownContainer,{width:100}]}
                open={open_setting_list6_staff}
                value={setting_list6_staff}
                items={whole_individual}
                setOpen={setOpen_setting_list6_staff}
                setValue={setSetting_list6_staff}
                zIndex={900}
                dropDownDirection={'BOTTOM'}
              />
            </View>
          </View>
          
          <View style={[styles.setting2]}>
            <View style={{width:'70%',alignSelf:'center'}}>
              <Text style={styles.dropDownlabel}>7.メールを送信する際、{"\n"}下記のメールアドレスにも送信</Text>
              <TextInput
                value={setting_list7_mail==='null'?'':setting_list7_mail}
                onChangeText={(text) => {setSetting_list7_mail(text)}}
                style={[styles.inputInner,{margin:0,height:40}]}
              />
            </View>
            <RadioButtonRN
              data={DoNotDo}
              value={setting_list7}
              selectedBtn={(e) => {
                setSetting_list7(e.value);
              }}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              box={true}
              boxStyle={styles.radio_box}
              textStyle={{marginLeft:10,fontSize:16}}
              style={{flex:1}}
              initial={setting_list7?1:2}
            />
          </View>
          
          <View style={[styles.setting2]}>
            <View style={{width:'70%',alignSelf:'center'}}>
              <Text style={styles.dropDownlabel}>8.【TOPページ】同じお客様のスケジュールはまとめて表示</Text>
            </View>
            <RadioButtonRN
              data={DoNotDo}
              value={setting_list8}
              selectedBtn={(e) => {
                setSetting_list8(e.value);
              }}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              box={true}
              boxStyle={styles.radio_box}
              textStyle={{marginLeft:10,fontSize:16}}
              style={{flex:1}}
              initial={setting_list8?1:2}
            />
          </View>
          
          <View style={[styles.setting2]}>
            <View style={{width:'70%',alignSelf:'center'}}>
              <Text style={styles.dropDownlabel}>9.一人のお客さんに対して閲覧通知の上限を1通/日にする</Text>
            </View>
            <RadioButtonRN
              data={DoNotDo}
              value={setting_list10}
              selectedBtn={(e) => {
                setSetting_list10(e.value);
              }}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              box={true}
              boxStyle={styles.radio_box}
              textStyle={{marginLeft:10,fontSize:16}}
              style={{flex:1}}
              initial={setting_list10?1:2}
            />
          </View>
          
          <Text style={styles.title}>プロフィール</Text>
          
          <Text style={styles.label}>写真</Text>
          <View style={{ flexDirection: 'row',alignSelf:'center' }}>
            <View style={{ width: "48%"}}>
              <View style={{ alignItems: 'center', }}>
                <Text style={styles.labelsub}>仕事イメージ </Text>
              </View>
              <Image
                style={styles.propertyPhoto}
                resizeMode='contain'
                source={{uri: filedata1? filedata1.uri+"?"+nowDate: null}}
              />
              <TouchableOpacity onPress={() => pickImage('1')} style={styles.photoAdd}>
                <Text style={styles.photoAddImg} >写真登録</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => delImage('1')} style={photoDisplay1 ? styles.hide_view : styles.photoDel}>
                <Text style={styles.photoDelImg} >写真削除</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ width: "48%",marginLeft:10, }}>
              <View style={{ alignItems: 'center', }}>
                <Text style={styles.labelsub}>上半身写真 </Text>
              </View>
              <Image
                style={styles.propertyPhoto}
                resizeMode='contain'
                source={filedata4.uri?{uri: filedata4.uri+"?"+nowDate}:require('../../assets/photo4.png')}
              />
              <TouchableOpacity onPress={() => pickImage('4')} style={styles.photoAdd}>
                <Text style={styles.photoAddImg} >写真登録</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => delImage('4')} style={photoDisplay4 ? styles.hide_view : styles.photoDel}>
                <Text style={styles.photoDelImg} >写真削除</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={{ flexDirection: 'row',marginTop:20,alignSelf:'center' }}>
    
            <View style={{ width: "45%"}}>
              <View style={{ alignItems: 'center', }}>
                <Text style={styles.labelsub}>プライベート1</Text>
              </View>
              <Image
                style={styles.propertyPhoto}
                resizeMode='contain'
                source={{
                    uri: filedata2? filedata2.uri+"?"+nowDate: null,
                  }}
              />
              <TouchableOpacity onPress={() => pickImage('2')} style={styles.photoAdd}>
                <Text style={styles.photoAddImg} >写真登録</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => delImage('2')} style={photoDisplay2 ? styles.hide_view : styles.photoDel}>
                <Text style={styles.photoDelImg} >写真削除</Text>
              </TouchableOpacity>
            </View>
      
            <View style={{ width: "48%", marginLeft:10, }}>
              <View style={{ alignItems: 'center', }}>
                <Text style={styles.labelsub}>プライベート2</Text>
              </View>
              <Image
                style={styles.propertyPhoto}
                resizeMode='contain'
                source={{
                    uri: filedata3? filedata3.uri+"?"+nowDate: null,
                  }}
              />
              <TouchableOpacity onPress={() => pickImage('3')} style={styles.photoAdd}>
                <Text style={styles.photoAddImg} >写真登録</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => delImage('3')} style={photoDisplay3 ? styles.hide_view : styles.photoDel}>
                <Text style={styles.photoDelImg} >写真削除</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <Text style={styles.label}>出身市区</Text>
          <TextInput
            value={birthplace}
            onChangeText={(text) => {setbirthplace(text)}}
            style={styles.inputInner}
            editable={true}
          />
          
          <Text style={styles.label}>生年月日</Text>
          <View style={{ flexDirection: 'row' }}>
            <TextInput
              value={staff_birthday_year}
              onChangeText={(text) => {setstaff_birthday_year(isNaN(text) ? staff_birthday_year : text)}}
              keyboardType={"number-pad"}
              style={styles.inputInnerbirthday}
              editable={true}
            />
            <Text style={styles.label}>年</Text>
            
            <TextInput
              value={staff_birthday_month}
              style={styles.inputInnerbirthday}
              editable={true}
              keyboardType={"number-pad"}
              onChangeText={(text) => {
                setstaff_birthday_month(isNaN(text) ? staff_birthday_month : text);
              }}
            />
            <Text style={styles.label}>月</Text>
            
            <TextInput
              value={staff_birthday_day}
              onChangeText={(text) => {setstaff_birthday_day(isNaN(text) ? staff_birthday_day : text)}}
              keyboardType={"number-pad"}
              style={styles.inputInnerbirthday}
              editable={true}
            />
            <Text style={styles.label}>日</Text>
          </View>
          
          <Text style={styles.label}>タグ</Text>
    
          <TagInput
            updateState={updateTagState}
            tags={profile_tag.tags}
            style={styles.tagArea}
            tagStyle={styles.tagData}
            tagTextStyle={styles.tagTextArea}
          />
    
          <Text onPress={() => desplayTag('')} style={styles.labeltag}>人気のタグ</Text>
          <View className="tag_all" style={tagDisplay ? styles.hide_view : {}} >
            <Text style={styles.tagTitle}>〇不動産</Text>
            <View className="tag_fudosan">
              <View style={{ flexDirection: 'row', }}>
                <Text>　</Text>
                <Text onPress={() => setTagData('宅建取引士')} style={styles.labeltag}>宅建取引士</Text>
                <Text onPress={() => setTagData('不動産歴10年以上')} style={styles.labeltag}>不動産歴10年以上</Text>
                <Text onPress={() => setTagData('物件知識豊富')} style={styles.labeltag}>物件知識豊富</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Text>　</Text>
                <Text onPress={() => setTagData('運転得意')} style={styles.labeltag}>運転得意</Text>
                <Text onPress={() => setTagData('マンション管理士')} style={styles.labeltag}>マンション管理士</Text>
                <Text onPress={() => setTagData('売買')} style={styles.labeltag}>売買</Text>
                <Text onPress={() => setTagData('テナント')} style={styles.labeltag}>テナント</Text>
              </View>
            </View>
      
            <Text className="tag_all" style={styles.tagTitle}>〇スポーツ</Text>
            <View className="tag_sports">
              <View style={{ flexDirection: 'row', }}>
                <Text>　</Text>
                <Text onPress={() => setTagData('ゴルフ')} style={styles.labeltag}>ゴルフ</Text>
                <Text onPress={() => setTagData('サッカー')} style={styles.labeltag}>サッカー</Text>
                <Text onPress={() => setTagData('野球')} style={styles.labeltag}>野球</Text>
                <Text onPress={() => setTagData('バスケット')} style={styles.labeltag}>バスケット</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Text>　</Text>
                <Text onPress={() => setTagData('ダンス')} style={styles.labeltag}>ダンス</Text>
                <Text onPress={() => setTagData('スポーツ観戦')} style={styles.labeltag}>スポーツ観戦</Text>
              </View>
            </View>
      
            <Text  className="tag_all" style={styles.tagTitle}>〇趣味</Text>
            <View className="tag_hobby">
              <View style={{ flexDirection: 'row', }}>
                <Text>　</Text>
                <Text onPress={() => setTagData('美味しいお店')} style={styles.labeltag}>美味しいお店</Text>
                <Text onPress={() => setTagData('美味しいお酒')} style={styles.labeltag}>美味しいお酒</Text>
                <Text onPress={() => setTagData('写真')} style={styles.labeltag}>写真</Text>
                <Text onPress={() => setTagData('音楽')} style={styles.labeltag}>音楽</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Text>　</Text>
                <Text onPress={() => setTagData('ジャズ')} style={styles.labeltag}>ジャズ</Text>
                <Text onPress={() => setTagData('演奏')} style={styles.labeltag}>演奏</Text>
                <Text onPress={() => setTagData('ピアノ')} style={styles.labeltag}>ピアノ</Text>
                <Text onPress={() => setTagData('ギター')} style={styles.labeltag}>ギター</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Text>　</Text>
                <Text onPress={() => setTagData('コレクション')} style={styles.labeltag}>コレクション</Text>
                <Text onPress={() => setTagData('ワイン')} style={styles.labeltag}>ワイン</Text>
                <Text onPress={() => setTagData('ビール')} style={styles.labeltag}>ビール</Text>
                <Text onPress={() => setTagData('焼酎')} style={styles.labeltag}>焼酎</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Text>　</Text>
                <Text onPress={() => setTagData('カクテル')} style={styles.labeltag}>カクテル</Text>
                <Text onPress={() => setTagData('サウナ')} style={styles.labeltag}>サウナ</Text>
                <Text onPress={() => setTagData('アニメ')} style={styles.labeltag}>アニメ</Text>
              </View>
            </View>
      
            <Text className="tag_all" style={styles.tagTitle}>〇性格</Text>
            <View className="tag_personality">
              <View style={{ flexDirection: 'row' }}>
                <Text>　</Text>
                <Text onPress={() => setTagData('明るい')} style={styles.labeltag}>明るい</Text>
                <Text onPress={() => setTagData('真面目')} style={styles.labeltag}>真面目</Text>
                <Text onPress={() => setTagData('会話が好き')} style={styles.labeltag}>会話が好き</Text>
                <Text onPress={() => setTagData('コツコツ')} style={styles.labeltag}>コツコツ</Text>
              </View>
            </View>
      
            <Text className="tag_all" style={styles.tagTitle}>〇エリア</Text>
            <View className="tag_area">
              <View style={{ flexDirection: 'row' }}>
                <Text>　</Text>
                <Text onPress={() => setTagData('大阪市')} style={styles.labeltag}>大阪市</Text>
                <Text onPress={() => setTagData('堺市')} style={styles.labeltag}>堺市</Text>
                <Text onPress={() => setTagData('豊中市')} style={styles.labeltag}>豊中市</Text>
                <Text onPress={() => setTagData('吹田市')} style={styles.labeltag}>吹田市</Text>
                <Text onPress={() => setTagData('京都市')} style={styles.labeltag}>京都市</Text>
              </View>
            </View>
          </View>
    
          <TouchableOpacity
            onPress={onSubmit}
            style={styles.submit}
          >
            <Text style={styles.submitLabel}>確　定</Text>
          </TouchableOpacity>
          
        </GestureRecognizer>
        )]}
        renderItem={({ item }) => (
          <>{item}</>
        )}
      />
      {/* </ScrollView> */}
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  header_img: {
    width:150,
    height:45,
  },
  form: {
    width: "90%",
    alignSelf:'center'
  },
  title: {
    fontSize:20,
    color:'#1d449a',
    fontWeight:'bold',
    marginTop: 20,
  },
  setting2:{
    flexDirection:'row',
    marginTop: 20
  },
  label: {
    marginTop: 20,
    marginBottom:10,
    marginLeft:5,
    fontSize:16,
  },
  label2: {
    alignSelf:'center',
    marginRight:10,
    marginLeft:5,
    fontSize:16,
  },
  label_text: {
    fontSize:12,
    color:'#999999',
    marginBottom:5,
  },
  labeltag: {
    marginTop: 10,
    marginBottom:10,
    marginLeft:10,
    fontSize:16,
    paddingTop:5,
    paddingLeft:5,
    paddingRight:5,
    paddingBottom:5,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: '#FFF',
  },
  tagTitle: {
    fontSize:16,
  },
  input: {
    marginBottom: 10,
    width:'50%',
  },
  inputInner: {
    marginHorizontal:5,
    padding:10,
    backgroundColor: '#fff',
    borderColor: '#191970',
    fontSize:16,
    borderWidth: 1.5,
    borderRadius: 8,
    color:'#000000'
  },
  inputInnerbirthday: {
    marginHorizontal:5,
    padding:10,
    backgroundColor: '#fff',
    borderColor: '#191970',
    fontSize:16,
    borderWidth: 1.5,
    borderRadius: 8,
    textAlign: 'right',
    width:'20%',
    color:'#000000'
  },
  tagArea: {
    height:40,
    width:'100%',
    marginHorizontal:5,
    padding:10,
    backgroundColor: '#fff',
    borderColor: '#191970',
    fontSize:16,
    borderWidth: 1.5,
    borderRadius: 8,
    color:'#000000'
  },
  tagTextArea: {
    color:'#000000',
  },

  tagData: {
    height:40,
    backgroundColor: '#e0ffff'
  },
  radioLabel: {
    fontSize: 16,
  },
  labelsub: {
    fontSize: 16,
    marginBottom:10
  },
  error: {
    color: 'red'
  },
  submit: {
    marginTop:30,
    marginBottom:50,
    backgroundColor: '#47a9ce',
    borderRadius: 8,
    alignSelf: 'center',
  },
  submitLabel: {
    fontSize: 20,
    lineHeight: 32,
    paddingVertical: 8,
    paddingHorizontal: 32,
    color: '#ffffff',
  },
  propertyPhoto: {
    height:120,
    width:'100%',
    marginRight:5,
  },
  photoAdd: {
    height:35,
    marginTop: 15,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#47a9ce',
    backgroundColor: '#47a9ce',
    justifyContent: 'center',
  },
  photoDel: {
    height:35,
    marginTop: 5,
    borderWidth: 1,
    borderRadius: 8,
    borderColor: '#696969',
    backgroundColor: '#696969',
    justifyContent: 'center',
  },
  photoAddImg: {
    marginRight:5,
    color:'#ffffff',
    textAlign:'center',
  },
  photoDelImg: {
    marginRight:5,
    textAlign:'center',
    color:'#ffffff',
  },
  hide_view: {
    display: "none"
  },
  btn_wrap: {
    flexDirection:'row',
    marginLeft: 'auto'
  },
  btn:{
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    width:80,
    height:35,
    backgroundColor:'#1f2d53',
  },
  delbtn:{
    backgroundColor:'transparent',
    borderWidth:1,
    borderColor:'#1f2d53',
    marginLeft:10,
  },
  btn_text: {
    color:'#ffffff'
  },
  radio_box: {
    height:40,
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingVertical: 0,
    paddingLeft:20,
    marginTop: 0,
    marginBottom:5,
    marginLeft:0
  },
  dropDown: {
    height:40,
    width:160,
    backgroundColor: '#fff',
    borderColor: '#191970',
    borderWidth: 1.5,
    borderRadius: 8,
  },
  dropDownContainer: {
    width:160,
    borderColor: '#191970',
    borderWidth: 1.5,
    zIndex:998,
  },
  dropDownlabel: {
    color:'#000',
    fontSize:16,
  },
  password_modal: {
    backgroundColor: "#ffffff",
    width:'90%',
    padding:15,
  },
  modal_label: {
    marginTop: 10,
    marginBottom:5,
    marginLeft:5,
    fontSize:16,
  },
  moddal_submit: {
    marginVertical:20,
    backgroundColor: '#47a9ce',
    borderRadius: 8,
    alignSelf: 'center',
  },
});
