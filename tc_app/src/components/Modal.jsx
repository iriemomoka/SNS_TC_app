import React,{ useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  StyleSheet, TouchableOpacity, Text, View, TextInput, Switch, Alert, Platform, Button, Image, ScrollView, FlatList, LogBox, KeyboardAvoidingView, TouchableWithoutFeedback, Linking, Keyboard, Dimensions
} from 'react-native';
import Modal from "react-native-modal";
import DropDownPicker from 'react-native-dropdown-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Moment from 'moment';
import * as ImagePicker from 'expo-image-picker';
import { Feather, MaterialIcons } from 'react-native-vector-icons';
import { Collapse, CollapseHeader, CollapseBody } from 'accordion-collapse-react-native';
import { CheckBox } from 'react-native-elements';
import MaterialChip from "react-native-material-chip";
import Autocomplete from 'react-native-autocomplete-input';
import * as DocumentPicker from 'expo-document-picker';
import axios from 'axios';
import RadioButtonRN from 'radio-buttons-react-native';
import * as SQLite from "expo-sqlite";
import * as Permissions from "expo-permissions";
import { Camera } from 'expo-camera';
import { Audio } from 'expo-av';
import RenderHtml from 'react-native-render-html';
import { actions, RichEditor, RichToolbar } from 'react-native-pell-rich-editor';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import ColorPicker from 'react-native-color-picker-ios-android'
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Popover, { Rect } from 'react-native-popover-view';
import Storage from 'react-native-storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ローカルストレージ読み込み
const storage = new Storage({
  storageBackend: AsyncStorage,
  defaultExpires: null,
});

import Loading from '../components/Loading';

// DB接続
import { db,db_select } from './Databace';

// let domain = 'http://family.chinser.co.jp/irie/tc_app/';
let domain = 'https://www.total-cloud.net/';

LogBox.ignoreAllLogs();

export function MyModal0(props){
  
  const { isVisible,onSwipeComplete,onPress,send_image,pickDocument } = props;
  
  return (
    <Modal
      isVisible={isVisible}
      swipeDirection={['up']}
      onSwipeComplete={onSwipeComplete}
      backdropOpacity={0.5}
      animationInTiming={300}
      animationOutTiming={500}
      animationIn={'slideInDown'}
      animationOut={'slideOutUp'}
      propagateSwipe={true}
      style={{alignItems: 'center'}}
      onBackdropPress={onPress}
    >
      <View style={styles.line}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top:8,
            right:10,
            zIndex:999
          }}
          onPress={onPress}
        >
          <Feather name='x-circle' color='gray' size={35} />
        </TouchableOpacity>
        <View style={{justifyContent: 'center',flexDirection: 'row'}}>
          <TouchableOpacity style={styles.menuBox} onPress={send_image}>
            <Feather name='image' color='#1f2d53' size={28} />
            <Text style={styles.iconText}>画像送信</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuBox} onPress={pickDocument}>
            <Feather name='file' color='#1f2d53' size={28} />
            <Text style={styles.iconText}>ファイル{"\n"}送信</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function MyModal1(props) {
  
  const { route,isVisible,onSwipeComplete,reservation,shop_mail,cus_mail,subject,note_ret,onSend,property,inquiry,station_list,address,c_d,fixed,comment,hensu,mail_online,mail_set,options,options2,send_mail } = props;

  const [res,setRes] = useState(props.reservation);
  const editorRef = useRef();

  useEffect(() => {
    setRes(props.reservation);
  }, [props.reservation])
  
  const [con_flg,setCon_flg] = useState(false);
  
  const [res_id, setRes_id] = useState(null);
  const [draft, setDraft] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (note_ret != "") {
      setNote(note?note+"\n"+note_ret:note_ret);
    }
  }, [note_ret])
  
  const [open, setOpen] = useState(false);
  const [cus_value, setCus_Value] = useState('');
  
  useEffect(() => {
    // 宛先
    if (cus_mail.length>0) {
      if (send_mail != "") {
        if (cus_mail.includes(send_mail)) {
          setCus_Value(send_mail);
        } else {
          setCus_Value(cus_mail[0]);
        }
      } else {
        setCus_Value(cus_mail[0]);
      }
    }
  }, [cus_mail,send_mail])

  const [inputCursorPosition, setInputCursorPosition] = useState(null);
  
  const items1 = cus_mail.filter(Boolean).map((item) => {
    return ({
      label: item,
      value: item,
    });
  });
  
  const [open2, setOpen2] = useState(false);
  const [shop_value, setShop_Value] = useState('');
  
  const items2 = shop_mail.filter(Boolean).map((item,key) => {
    return ({
      label: key==0?item.replace('@','_s@'):item,
      value: item,
    });
  });
  
  const [open3, setOpen3] = useState(false);
  const [mail_format, setMail_Format] = useState('0');
  
  const items3 = [
    { label: 'テキスト', value: '0' },
    { label: 'HTML', value: '1' }
  ];

  const [filteredFixed, setFilteredFixed] = useState([]);
  const [filteredComment, setFilteredComment] = useState([]);

  // リストからHTMLの定型文をフィルタリング
  const filterFixedByCategory = () => {
    const filtered = fixed.filter((obj) => obj.html_flg != '1');
    setFilteredFixed(filtered);
  }

  // リストからHTMLの一言コメントをフィルタリング
  const filteredCommentByCategory = () => {
    const filtered = comment.filter((obj) => obj.html_flg != '1');
    setFilteredComment(filtered);
  }

  useEffect(() => {
    if (mail_format === '0') {
      // 形式がテキストの時はHTMLの定型文は表示しない
      filterFixedByCategory();
    } else {
      setFilteredFixed(fixed);
    }
    if (mail_format === '0') {
      // 形式がテキストの時はHTMLの定型文は表示しない
      filteredCommentByCategory();
    } else {
      setFilteredComment(comment);
    }
  }, [mail_format, fixed, comment]);

  // 内容詳細の編集
  const noteEdit = (text) => {
    let urlPattern = /(^|\s|<.+?>)(https?:\/\/[^\s<>]+)($|\s|<.+?>)/g;

    let extractedText = text.replace(urlPattern, function(match, p1, p2, p3) {
      if (p1.startsWith("<a") || p1.startsWith("<img") || p1.startsWith("<area")) {
        // URLの文字列がa,img,areaのどれかのタグで挟まれていたら、そのままのソースを返す
        return match;
      } else {
        // URLの文字列がその他のHTMLタグかスペースに挟まれていたら、aタグで挟む
        return p1 + "<a href='" + p2 + "'>" + p2 + "</a>" + p3;
      }
    });

    extractedText = extractedText.split('”').join('"');

    setNote(extractedText);
  }

  const [option, setOption] = useState(false);
  
  useEffect(() => {
    
    if (options) {
      setOption(options);
    }
    
  }, [options])
  
  // 形式を変更した場合は件名と内容を空にする
  const changeMailFormat = (value) => {
    if (mail_format != value) {
      Alert.alert(
        "送信内容の形式を変更しますがよろしいですか？",
        "",
        [
          {
            text: "はい",
            onPress: () => {
              if (note) {
                Alert.alert(
                  "入力されている【件名】と【送信内容】が削除されますがよろしいですか？",
                  "",
                  [
                    {
                      text: "はい",
                      onPress: () => {
                        setMail_Format(value);
                        setNote('');
                        setMail_subject('');
                      }
                    },
                    {
                      text: "いいえ",
                      onPress: () => {
                        return;
                      }
                    },
                  ]
                );
              } else {
                setMail_Format(value);
                setNote('');
                setMail_subject('');
              }
            }
          },
          {
            text: "いいえ",
            onPress: () => {
              return;
            }
          },
        ]
      );
    }
  }
  
  useEffect(() => {

    // 送信元セット
    if (mail_set) {
      
      // 閲覧や返信があった場合、最後に登録された送信元を選択
      if (mail_set.brower_mail) {
        var brower_mail = mail_set.brower_mail.split(',');
        
        brower_mail = brower_mail.map((b) => {
          return b.replace('_s@','@');
        });
        
        setShop_Value(brower_mail[brower_mail.length-1]);
        
      } else {
        
        // 閲覧や返信がない場合、既存のメールアドレス
        setShop_Value(mail_set.mail_select?mail_set.mail_select:shop_mail[0]);
        
        // 送信元メールアドレスをアドレスによってGmailに自動変更
        if(shop_mail[2] && cus_mail.length>0) {
          if (cus_mail[0].indexOf('@yahoo.co.jp') != -1) {
            setShop_Value(shop_mail[2]);
          } else if (cus_mail[0].indexOf('@gmail.com') != -1) {
            setShop_Value(shop_mail[2]);
          } else if (cus_mail[0].indexOf('@au.com') != -1) {
            setShop_Value(shop_mail[2]);
          } else if (cus_mail[0].indexOf('@ezweb.ne.jp') != -1) {
            setShop_Value(shop_mail[2]);
          } else if (cus_mail[0].indexOf('@icloud.com') != -1) {
            setShop_Value(shop_mail[2]);
          } else if (cus_mail[0].indexOf('@hotmail') != -1) {
            setShop_Value(shop_mail[2]);
          } else if (cus_mail[0].indexOf('@outlook') != -1) {
            setShop_Value(shop_mail[2]);
          } else if (cus_mail[0].indexOf('@live.jp') != -1) {
            setShop_Value(shop_mail[2]);
          }
          
        }
        
      }
    }
    
  }, [isVisible])
  
  
  const [auto_gmail,setAuto_gmail] = useState(false);
  
  if (auto_gmail) {
    
    // 送信元メールアドレスをアドレスによってGmailに自動変更
    if(shop_mail[2] && cus_mail.length>0) {
      
      if (cus_value.indexOf('@yahoo.co.jp') != -1) {
        setShop_Value(shop_mail[2]);
      } else if (cus_value.indexOf('@gmail.com') != -1) {
        setShop_Value(shop_mail[2]);
      } else if (cus_value.indexOf('@au.com') != -1) {
        setShop_Value(shop_mail[2]);
      } else if (cus_value.indexOf('@ezweb.ne.jp') != -1) {
        setShop_Value(shop_mail[2]);
      } else if (cus_value.indexOf('@icloud.com') != -1) {
        setShop_Value(shop_mail[2]);
      } else if (cus_value.indexOf('@hotmail') != -1) {
        setShop_Value(shop_mail[2]);
      } else if (cus_value.indexOf('@outlook') != -1) {
        setShop_Value(shop_mail[2]);
      } else if (cus_value.indexOf('@live.jp') != -1) {
        setShop_Value(shop_mail[2]);
      }
      
    }
    
    setAuto_gmail(false);
  }
  
  const [mail_subject, setMail_subject] = useState(subject?subject:'');

  useEffect(() => {
    setMail_subject(subject);
  }, [subject])
  
  const [checked, setCheck] = useState(false); // メール予約
  
  const [reservation_stop_flg, setReservation_stop_flg] = useState(false); // メール予約
  const [reading_return_flg, setReading_return_flg] = useState(false); // メール予約
  
  const [date1, setDate1] = useState(null);
  const [date2, setDate2] = useState(null);
  const [date3, setDate3] = useState(null);

  const [date_view, setDate_view] = useState(1);
  const [date_flg, setDate_flg] = useState(1);
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);

  // オススメ物件
  const [Modal3, setModal3] = useState(false);
  const [Modal3_flg, setModal3_flg] = useState("property");

  const openModal3 = (flg) => {
    setModal3(!Modal3);
    setModal3_flg(flg);
  };
  
  // 定型文or一言コメント
  const [Modal4, setModal4] = useState(false);
  const [Modal4_flg, setModal4_flg] = useState("fixed");

  const openModal4 = (flg) => {
    setModal4(!Modal4);
    setModal4_flg(flg);
  };
  const [c_permission, c_requestPermission] = Camera.useCameraPermissions();

  // HTMLエディタのキーボードを閉じる
  const keyboardClose = () => {
    if (mail_format == '1') {
      editorRef.current.dismissKeyboard();
    }
  };

  const [disabled, setDisabled] = useState(true);

  useEffect(() => {
    // HTMLエディタのキーボードが表示されている時だけTouchableWithoutFeedbackのdisabledをtrueにする
    if (editorRef.current) {
      if (editorRef.current._focus) {
        setDisabled(false);
      } else {
        setDisabled(true);
      }
    } else {
      setDisabled(true);
    }
  }, [keyboardClose])

  // HTMLエディタの文字の色
  const [color, setColor] = useState(false);
  const [textColor, setTextColor] = useState('#000');

  const openTextColor = () => {
    setColor(!color);
  };

  const CameraPermissionsCheck = async() => {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `カメラへのアクセスが無効になっています`,
        "設定画面へ移動しますか？",
        [
          {
            text: "キャンセル",
            style: "cancel",
            onPress:() => {resolve(false);}
          },
          {
            text: "設定する",
            onPress: () => {
              Linking.openSettings();
              resolve(false);
            }
          }
        ]
      );
    });

    const { status } = await c_requestPermission();
    
	  // カメラのアクセス許可を付与
    if (Platform.OS !== 'web') {
      if (status !== 'granted') {
        await AsyncAlert();
        return false;
      } else {
        return true;
      }
    }

  }

  const [a_permissionResponse, a_requestPermission] = Audio.usePermissions();

  const AudioPermissionsCheck = async() => {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `マイクへのアクセスが無効になっています`,
        "設定画面へ移動しますか？",
        [
          {
            text: "キャンセル",
            style: "cancel",
            onPress:() => {resolve(false);}
          },
          {
            text: "設定する",
            onPress: () => {
              Linking.openSettings();
              resolve(false);
            }
          }
        ]
      );
    });

    const { status } = await a_requestPermission();
    
	  // マイクのアクセス許可を付与
    if (Platform.OS !== 'web') {
      if (status !== 'granted') {
        await AsyncAlert();
        return false;
      } else {
        return true;
      }
    }

  }

  // オンライン通話
	const openOnline_call = async (id) => {
    
    if (!await CameraPermissionsCheck()) return;
    if (!await AudioPermissionsCheck()) return;

    Alert.alert(
      "通話画面を開きますか？",
      "",
      [
        {
          text: "はい",
          onPress: () => {
            fetch(domain+"video/?customer_id="+id,
              {
                method: 'POST',
                headers: {
                  Accept: 'application/json',
                  'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: JSON.stringify({
                  id : route.params.account,
                  pass : route.params.password,
                  app_flg : 1,
                })
              })
                .then((response) => response.json())
                .then((json) => {
                  Linking.openURL(json)
                  .catch((err) => {
                    console.log(err);
                    Alert.alert('接続に失敗しました');
                  });
                })
                .catch((error) => {
                  console.log(error);
                  Alert.alert("接続に失敗しました");
                })
          }
        },
        {
          text: "いいえ",
        },
      ]
    );
    
    var url_add = "recording_login_key=tc12"+id+"46ud";
    var row     = domain+"video/?"+url_add;
    
    setNote(note?note+row:row);
    
	}
  
  // ファイル選択
  const [filename,setFilename] = useState('');
  const [filedata,setFiledata] = useState(null);
  const [del_file,setDel_file] = useState('');
  
	const pickDocument = async () => {
    var result = await DocumentPicker.getDocumentAsync({});

    if (result) {

      if(result.size > 7000000) {
        Alert.alert('添付ファイルのサイズは7MBまでにしてください');
      }else{
        setFilename(result.name);
        setFiledata(result);
      }
      
    }
  };
  
  const LibraryPermissionsCheck = async() => {

    const AsyncAlert = async () => new Promise((resolve) => {
      Alert.alert(
        `カメラロールへのアクセスが無効になっています`,
        "設定画面へ移動しますか？",
        [
          {
            text: "キャンセル",
            style: "cancel",
            onPress:() => {resolve(false);}
          },
          {
            text: "設定する",
            onPress: () => {
              Linking.openSettings();
              resolve(false);
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

  // 画像選択
	const pickImage = async () => {
    
    if (!await LibraryPermissionsCheck()) return;
    
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (result) {
      if(result.size > 7000000) {
        Alert.alert('添付ファイルのサイズは7MBまでにしてください');
      }else{
        result.name = result.uri.split('/').pop();
        setFilename(result.name);
        setFiledata(result);
      }
      
    }
  };
  
  const onDraft = () => {
    
    if (!cus_value) {
      Alert.alert('メールアドレスがありません');
      return
    }
    
    const formatDate = (current_datetime) => {
      if (current_datetime == null) return "";
      let formatted_date = Moment(current_datetime).format("YYYY-MM-DD HH:mm:00");
      return formatted_date;
    }
    
    setCon_flg(true);

    const resultSend = [
      cus_value, // 宛先
      shop_value, // 送信元
      mail_subject, // 件名
      checked, // 予約フラグ
      checked?formatDate(date1):'', // 予約時間１
      res_id, // 予約ID
      1, // 下書きフラグ
      filedata, // 添付ファイル
      checked?formatDate(date2):'', // 予約時間２
      checked?formatDate(date3):'', // 予約時間３
      reservation_stop_flg?1:"", // 予約取り消しフラグ
      reading_return_flg?1:"", // 閲覧時に自動送信
    ];

    props.onSend(
      [
        formatDate(new Date()),
        'メール送信',
        note,
        resultSend,
        mail_format
      ],
      'mail'
    );

    props.setModal1(false);
    setNote('');
    setCus_Value(cus_mail[0]);
    setShop_Value(shop_mail[0]);
    setMail_subject('');
    setCheck(false);
    setFilename('');
    setFiledata(null);
    setInputCursorPosition(null);
    setMail_Format('0');
    setDate1(null);
    setDate2(null);
    setDate3(null);
    setReservation_stop_flg(false);
    setReading_return_flg(false);
    setDate_view(1);
  }

  function compare2now(adate) {
    // 現在の日付＆時刻を取得
    var today = new Date();

    if (adate.getTime() < today.getTime()) {
      return -1;
    } else {
      return 1;
    }
  }

  const onSubmit = () => {

    /* ----- エラーチェック ----- */

    var err = "";
    
    if (!cus_value) {
      err += '・メールアドレスがありません\n';
    }

    if (!note) {
      err += '・送信内容が記入されていません。\n';
    }

    // 予約時間チェック
    if (checked && !reading_return_flg) {

      if (date1 == null) {
        err += '・メール予約時間1を指定してください。\n';
      } else if (compare2now(date1) == -1) {
        err += '・メール予約時間1が過去の日付になっています。\n';
      }

      if (date2 != null) {
        if (compare2now(date2) == -1) {
          err += '・メール予約時間2が過去の日付になっています。\n';
        }
      }

      if (date3 != null) {
        if (compare2now(date3) == -1) {
          err += '・メール予約時間3が過去の日付になっています。\n';
        }
      }

    }

    if (err) {
      Alert.alert('エラー',err);
      return
    }

    /* ----- エラーチェック ----- */
    
    setDraft("");
    setCon_flg(true);
    
    const formatDate = (current_datetime) => {
      if (current_datetime == null) return "";
      let formatted_date = Moment(current_datetime).format("YYYY-MM-DD HH:mm:00");
      return formatted_date;
    }

    const SendData = () => {

      const resultSend = [
        cus_value, // 宛先
        shop_value, // 送信元
        mail_subject, // 件名
        checked, // 予約フラグ
        checked?formatDate(date1):'', // 予約時間１
        res_id, // 予約ID
        '', // 下書きフラグ
        filedata, // 添付ファイル
        checked?formatDate(date2):'', // 予約時間２
        checked?formatDate(date3):'', // 予約時間３
        reservation_stop_flg?1:"", // 予約取り消しフラグ
        reading_return_flg?1:"", // 閲覧時に自動送信
      ];

      props.onSend(
        [
          formatDate(new Date()), // 送信日
          'メール送信', // ステータス
          note, // 本文
          resultSend, // メール内容
          mail_format // メール形式
        ],
        'mail'
      );

      props.setModal1(false);
      setNote('');
      setCus_Value(cus_mail[0]);
      setShop_Value(shop_mail[0]);
      setMail_subject('');
      setCheck(false);
      setFilename('');
      setFiledata(null);
      setInputCursorPosition(null);
      setMail_Format('0');
      setDate1(null);
      setDate2(null);
      setDate3(null);
      setReservation_stop_flg(false);
      setReading_return_flg(false);
      setDate_view(1);
    }
    
    if(!mail_subject){
      Alert.alert(
        "件名が入っていませんがよろしいですか？",
        "",
        [
          {
            text: "はい",
            onPress: () => {SendData()}
          },
          {
            text: "いいえ",
            onPress: () => {return}
          },
        ]
      );
    } else {
      SendData();
    }
    
  }
  
  const onDelete = () => {
    Alert.alert(
      "削除してよろしいですか？",
      "",
      [
        {
          text: "はい",
          onPress: () => {
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
                  act:'get_talk',
                  del_reservation:1,
                  customer_id:route.customer,
                  reservation_id:res_id
                })
              })
                .then((response) => response.json())
                .then((json) => {
                  setRes(json['customer_reservation']);
                  Alert.alert('削除しました');
                })
                .catch((error) => {
                  const errorMsg = "削除に失敗しました";
                  Alert.alert(errorMsg);
                })
                
            setNote('');
            setCus_Value(cus_mail[0]);
            setShop_Value(shop_mail[0]);
            setMail_subject('');
            setCheck(false);
            setFilename('');
            setFiledata(null);
            setInputCursorPosition(null);
          }
        },
        {
          text: "いいえ",
        },
      ]
    );
  }
  
  const onClose = () => {
    props.setModal1(false);
  }
  
  const img_Delete = () => {
    setFilename('');
    setFiledata(null);
    setDel_file(1);
  }

  const [op, setOp] = useState(false);
  const [val, setVal] = useState(false);
  
  function rrr(){

    function GetYoyaku(val) {

      if (val.file_path) {
        axios.get(val.file_path)
        .then(res => {
          setFilename(val.file_path?'添付ファイル':'');
          setFiledata({uri:res.config.url});
        })
        .catch((error) => {
          console.log(error);
        })
      }
      
      setNote(val.note);
      setCus_Value(val.receive_mail);
      setShop_Value(val.send_mail);
      setMail_subject(val.title);
      setDraft(val.draft_flg);
      
      if(!val.draft_flg) {
        if (val.time) {
          
          setCheck(true);
          
          const res_time = new Date(
            val.time.substr(0,4),
            val.time.substr(5,2),
            val.time.substr(8,2),
            val.time.substr(11,2),
            val.time.substr(14,2),
            "00"
          )
          res_time.setMonth(res_time.getMonth() - 1);
          setDate1(res_time);
        }
      }
      
      setRes_id(val.reservation_id);
    }
    
    if (res){
      const it = res.filter(Boolean).map((item) => {
        if(item.draft_flg) {
          return ({
            label: '【下書き】'+item.title,
            value: item,
          });
        } else {
          return ({
            label: '【予約】'+item.time+"\n"+item.title,
            value: item,
          });
        }
      });
      
      it.unshift({label:'----------------',value:''});
      
      return(
        <>
          <Text style={styles.label}>予約・下書き</Text>
          <View style={{ zIndex: 102 }}>
            <DropDownPicker
              open={op}
              value={val}
              items={it}
              setOpen={setOp}
              setValue={setVal}
              style={styles.inputInner}
              placeholder = {'----------------'}
              translation={{
                NOTHING_TO_SHOW: "予約・下書きはありません"
              }}
              onOpen={() => {
                setOpen(false);
                setOpen2(false);
              }}
              onSelectItem={(item) => GetYoyaku(item.value)}
            />
          </View>
          
          <TouchableOpacity onPress={onDelete}
            style={[val? '':{display: 'none'},styles.delete]}>
            <Text>削　除</Text>
          </TouchableOpacity>
        </>
      )
    }
  }

  const [fontsize,setFontsize] = useState(3);

  const fontSize = (size) => {
    // 1= 10px, 2 = 13px, 3 = 16px, 4 = 18px, 5 = 24px, 6 = 32px, 7 = 48px;
    const newSize = size ? fontsize + 1 : fontsize - 1;
    
    const clampedSize = Math.min(7, Math.max(1, newSize));
    
    editorRef.current?.setFontSize(clampedSize);
    setFontsize(clampedSize);
  };
  
  useEffect(() => {
    if (textColor) {
      editorRef.current?.setForeColor(textColor);
    }
  }, [textColor])
  
  const [keyboardStatus, setKeyboardStatus] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardStatus(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardStatus(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  // 挿入メニューの横スクロールの通知を一回だけ表示する
  useEffect(() => {
    storage.load({
      key : 'MENU-FLG'
    })
    .then(data => {
      if (!data) {
        setShowPopover(true);
      }
    })
    .catch(err => {
      setShowPopover(true);
      storage.save({
        key: 'MENU-FLG',
        data: false,
      });
    })
  }, []);

  const closePopover = () => {
    setShowPopover(false);
    storage.save({
      key: 'MENU-FLG',
      data: true,
    });
  }

  const [showPopover, setShowPopover] = useState(false);

  const screenWidth = Dimensions.get('window').width;

  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.5}
      animationInTiming={300}
      animationOutTiming={500}
      animationIn={'slideInDown'}
      animationOut={'slideOutUp'}
      onModalHide={() => {setCon_flg(false)}}
      onBackdropPress={()=>{
        keyboardStatus?Keyboard.dismiss():onClose()
      }}
    >
      <MyModal3 
        isVisible={Modal3}
        onSwipeComplete={() => { setModal3(false) }}
        onClose={() => { setModal3(false) }}
        flg={Modal3_flg}
        route={route}
        property={property}
        inquiry={inquiry}
        station_list={station_list}
        address={address}
        c_d={c_d}
        setNote={setNote}
        msgtext={note}
        mail_format={mail_format}
        editorRef={editorRef}
        inputCursorPosition={inputCursorPosition}
      />
      <MyModal4 
        isVisible={Modal4}
        onSwipeComplete={() => { setModal4(false) }}
        onPress={() => { setModal4(false) }}
        flg={Modal4_flg}
        fixed={filteredFixed}
        comment={filteredComment}
        hensu={hensu}
        setMail_subject={setMail_subject}
        subject={mail_subject}
        setNote={setNote}
        msgtext={note}
        setModal4={setModal4}
        mail_format={mail_format}
        editorRef={editorRef}
        inputCursorPosition={inputCursorPosition}
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView style={styles.sydemenu} horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={option?[styles.menucircle,{marginLeft:0}]:{display:"none"}}
            onPress={() => {openOnline_call(route.customer)}}
          >
            <Text style={styles.menucircleText}>オンライン{"\n"}通話</Text>
            <Feather name='video' color='#1f2d53' size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menucircle,!option&&{marginLeft:0}]}
            onPress={()=>openModal3("property")}
          >
            <Text style={styles.menucircleText}>おすすめ{"\n"}物件</Text>
            <Feather name='home' color='#1f2d53' size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menucircle}
            onPress={()=>openModal4("fixed")}
          >
            <Text style={styles.menucircleText}>定型文</Text>
            <Feather name='file-text' color='#1f2d53' size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menucircle}
            onPress={()=>openModal4("comment")}
          >
            <Text style={styles.menucircleText}>一言{"\n"}コメント</Text>
            <MaterialCommunityIcons name='comment-processing-outline' color='#404040' size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.menucircle}
            onPress={()=>openModal3("inquiry")}
          >
            <Text style={styles.menucircleText}>問合せ物件</Text>
            <MaterialCommunityIcons name='home-import-outline' color='#404040' size={20} />
          </TouchableOpacity>
        </ScrollView>
        <Popover from={new Rect(screenWidth/2,110)} isVisible={showPopover} onRequestClose={() => closePopover()}>
          <View style={{width:240,height:60,justifyContent:'center'}}>
            <Text style={{textAlign:'center'}}>挿入できる項目を横スクロールで{"\n"}参照できるようになりました</Text>
          </View>
        </Popover>
        <View style={[{height:"90%",marginTop:20},styles.modalInner]}>
          <TouchableOpacity
            style={styles.close}
            onPress={onClose}
          >
            <Feather name='x-circle' color='gray' size={35} />
          </TouchableOpacity>
          <View style={[styles.form,{height:'100%',paddingTop:50,paddingBottom:20}]}>
            <TouchableWithoutFeedback
              disabled={disabled}
              onPress={keyboardClose}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                {rrr()}
                <Text style={styles.label}>宛先</Text>
                <View style={{ zIndex: 101 }}>
                  <DropDownPicker
                    open={open}
                    value={cus_value}
                    items={items1}
                    setOpen={setOpen}
                    setValue={setCus_Value}
                    style={styles.inputInner}
                    placeholder={'----------------'}
                    translation={{
                      NOTHING_TO_SHOW: "メールアドレスが登録されていません"
                    }}
                    onSelectItem={() => {setAuto_gmail(1)}}
                    onOpen={() => {
                      setOpen2(false);
                      setOp(false);
                    }}
                  />
                </View>
                <Text style={styles.label}>送信元</Text>
                <View style={{ zIndex: 100 }}>
                  <DropDownPicker
                    open={open2}
                    value={shop_value}
                    items={items2}
                    setOpen={setOpen2}
                    setValue={setShop_Value}
                    style={styles.inputInner}
                    placeholder={'----------------'}
                    onOpen={() => {
                      setOpen(false);
                      setOp(false);
                    }}
                  />
                </View>
                {options2 && options2.includes('1') && (
                  <>
                    <Text style={styles.label}>形式</Text>
                    <View style={{ zIndex: 99 }}>
                      <DropDownPicker
                        open={open3}
                        value={mail_format}
                        items={items3}
                        setOpen={setOpen3}
                        // setValue={setMail_Format}
                        style={[styles.inputInner,{width: 200}]}
                        dropDownContainerStyle={{width: 200}}
                        placeholder={'----------------'}
                        onOpen={() => {
                          setOpen3(!open3);
                        }}
                        onSelectItem={(item)=>changeMailFormat(item.value)}
                      />
                    </View>
                  </>
                )}
                <View style={styles.input}>
                  <Text style={styles.label}>件名</Text>
                  <TextInput
                    onChangeText={(text) => setMail_subject(text)}
                    value={mail_subject}
                    style={styles.inputInner}
                  />
                </View>
                <View style={[styles.input,{flexDirection: 'row',alignItems: 'center'}]}>
                  <TouchableOpacity onPress={pickDocument} style={styles.file}>
                    <Text>ファイル添付</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={pickImage} style={styles.file}>
                    <Text>画像添付</Text>
                  </TouchableOpacity>
                </View>
                <View style={filename?{flexDirection: 'row',marginVertical:5}:{display:'none'}}>
                  <TouchableOpacity onPress={img_Delete} style={filename?{marginHorizontal:5}:{display:'none'}}>
                    <Feather name='x-circle' color='gray' size={25} />
                  </TouchableOpacity>
                  <Text>{filename}</Text>
                </View>
                <Text style={styles.inlabel}>※携帯電話に送る際は2MB以下にしてください</Text>
                <View>
                  <CheckBox
                    title='メール予約する'
                    checked={checked}
                    onPress={() => setCheck(!checked)}
                  />
                  {checked&&(
                    <>
                      <CheckBox
                        title='お客様からメールがあった場合は送信しない'
                        checked={reservation_stop_flg}
                        onPress={() => setReservation_stop_flg(!reservation_stop_flg)}
                        containerStyle={styles.checkbox}
                      />
                      <View style={{flexDirection:'row',alignItems:'center'}}>
                        <Text style={{fontSize:12,marginRight:5}}>予約指定1：</Text>
                        <TouchableOpacity
                          style={[styles.inputInner,{width:"30%",flexDirection:'row'},reading_return_flg&&{backgroundColor:"#bfbfbf"}]}
                          onPress={()=>{
                            setShow(true);
                            setMode("date");
                            setDate_flg(1);
                          }}
                          disabled={reading_return_flg}
                        >
                          <Text style={{alignSelf:'center'}}>{date1?Moment(date1).format("YYYY-MM-DD"):""}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.inputInner,{width:"30%",flexDirection:'row',marginLeft:"2%"},reading_return_flg&&{backgroundColor:"#bfbfbf"}]}
                          onPress={()=>{
                            setShow(true);
                            setMode("time");
                            setDate_flg(1);
                          }}
                          disabled={reading_return_flg}
                        >
                          <Text style={{alignSelf:'center'}}>{date1?Moment(date1).format("HH:mm"):""}</Text>
                        </TouchableOpacity>
                        {date1&&(
                          <TouchableOpacity
                            style={{alignSelf:'center',marginLeft:5}}
                            onPress={()=>setDate1(null)}
                          >
                            <Feather name='x-circle' color='#ccc' size={35} />
                          </TouchableOpacity>
                        )}
                      </View>
                      {date_view>1&&(
                        <View style={{flexDirection:'row',alignItems:'center',marginTop:5}}>
                          <Text style={{fontSize:12,marginRight:5}}>予約指定2：</Text>
                          <TouchableOpacity
                            style={[styles.inputInner,{width:"30%",flexDirection:'row'},reading_return_flg&&{backgroundColor:"#bfbfbf"}]}
                            onPress={()=>{
                              setShow(true);
                              setMode("date");
                              setDate_flg(2);
                            }}
                            disabled={reading_return_flg}
                          >
                            <Text style={{alignSelf:'center'}}>{date2?Moment(date2).format("YYYY-MM-DD"):""}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.inputInner,{width:"30%",flexDirection:'row',marginLeft:"2%"},reading_return_flg&&{backgroundColor:"#bfbfbf"}]}
                            onPress={()=>{
                              setShow(true);
                              setMode("time");
                              setDate_flg(2);
                            }}
                            disabled={reading_return_flg}
                          >
                            <Text style={{alignSelf:'center'}}>{date2?Moment(date2).format("HH:mm"):""}</Text>
                          </TouchableOpacity>
                          {date2&&(
                            <TouchableOpacity
                              style={{alignSelf:'center',marginLeft:5}}
                              onPress={()=>setDate2(null)}
                            >
                              <Feather name='x-circle' color='#ccc' size={35} />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                      {date_view>2&&(
                        <View style={{flexDirection:'row',alignItems:'center',marginTop:5}}>
                          <Text style={{fontSize:12,marginRight:5}}>予約指定3：</Text>
                          <TouchableOpacity
                            style={[styles.inputInner,{width:"30%",flexDirection:'row'},reading_return_flg&&{backgroundColor:"#bfbfbf"}]}
                            onPress={()=>{
                              setShow(true);
                              setMode("date");
                              setDate_flg(3);
                            }}
                            disabled={reading_return_flg}
                          >
                            <Text style={{alignSelf:'center'}}>{date3?Moment(date3).format("YYYY-MM-DD"):""}</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.inputInner,{width:"30%",flexDirection:'row',marginLeft:"2%"},reading_return_flg&&{backgroundColor:"#bfbfbf"}]}
                            onPress={()=>{
                              setShow(true);
                              setMode("time");
                              setDate_flg(3);
                            }}
                            disabled={reading_return_flg}
                          >
                            <Text style={{alignSelf:'center'}}>{date3?Moment(date3).format("HH:mm"):""}</Text>
                          </TouchableOpacity>
                          {date3&&(
                            <TouchableOpacity
                              style={{alignSelf:'center',marginLeft:5}}
                              onPress={()=>setDate3(null)}
                            >
                              <Feather name='x-circle' color='#ccc' size={35} />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                      {date_view<3&&(
                        <TouchableOpacity
                          onPress={()=>{
                            if (date_view == 1) {
                              setDate_view(2);
                            } else if (date_view == 2) {
                              setDate_view(3);
                            }
                          }}
                          style={styles.file}
                        >
                          <Text>予約追加</Text>
                        </TouchableOpacity>
                      )}
                      {(show && Platform.OS === 'android') && (
                        <DateTimePicker
                          value={
                            date_flg==1?(date1?date1:new Date()):
                            date_flg==2?(date2?date2:new Date()):
                            date_flg==3?(date3?date3:new Date()):
                            new Date()
                          }
                          mode={mode}
                          display="default"
                          locale={'ja'}
                          onChange={(event, selectedDate) => {
                            if (date_flg == 1) {
                              setDate1(selectedDate);
                            } else if (date_flg == 2) {
                              setDate2(selectedDate);
                            } else if (date_flg == 3) {
                              setDate3(selectedDate);
                            }
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
                                date_flg==1?(date1?date1:new Date()):
                                date_flg==2?(date2?date2:new Date()):
                                date_flg==3?(date3?date3:new Date()):
                                new Date()
                              }
                              mode={mode}
                              is24Hour={true}
                              display="spinner"
                              locale={'ja'}
                              onChange={(event, selectedDate) => {
                                if (date_flg == 1) {
                                  setDate1(selectedDate);
                                } else if (date_flg == 2) {
                                  setDate2(selectedDate);
                                } else if (date_flg == 3) {
                                  setDate3(selectedDate);
                                }
                              }}
                              textColor="#fff"
                            />
                          </View>
                        </Modal>
                      )}
                      <CheckBox
                        title='お客様が閲覧した時'
                        checked={reading_return_flg}
                        onPress={() => {
                          setReading_return_flg(!reading_return_flg);
                          setDate1(null);
                          setDate2(null);
                          setDate3(null);
                        }}
                        containerStyle={styles.checkbox}
                      />
                    </>
                  )}
                </View>
                <View style={styles.input}>
                  {mail_format !== '1' ? (
                    <>
                      <Text style={styles.label}>内容詳細</Text>
                      <TextInput
                        onChangeText={(text) => {setNote(text)}}
                        value={note}
                        style={styles.mail_textarea}
                        multiline={true}
                        disableFullscreenUI={true}
                        numberOfLines={11}
                        onSelectionChange={(event) => {setInputCursorPosition(event.nativeEvent.selection);}}
                        scrollEnabled={false}
                      />
                    </>
                  ) : (
                    <>
                      <MyModal7 
                        isVisible={color}
                        openTextColor={openTextColor}
                        setTextColor={setTextColor}
                        textColor={textColor}
                      />
                      <View style={[{marginBottom: 5,flexDirection: 'row',alignItems: 'center'}]}>
                        <Text style={styles.label}>内容詳細</Text>
                      </View>
                      <RichToolbar
                        editor={editorRef}
                        iconTint={"black"}
                        selectedIconTint={"white"}
                        actions={[
                          actions.keyboard,
                          actions.undo,
                          actions.redo,
                          actions.setBold,
                          actions.setItalic,
                          actions.setUnderline,
                          actions.insertLine,
                          actions.setStrikethrough,
                          'fontSize_add',
                          'fontSize_pull',
                          'ForeColor',
                          actions.indent,
                          actions.outdent,
                          actions.alignLeft,
                          actions.alignCenter,
                          actions.alignRight,
                          actions.alignFull,
                          actions.setSubscript,
                          actions.setSuperscript,
                          actions.checkboxList,
                        ]}
                        iconMap={{
                          fontSize_add: ({ tintColor }) => (
                            <TouchableOpacity onPress={()=>fontSize(true)}>
                              <MaterialCommunityIcons name="format-font-size-increase" size={24} color={tintColor} />
                            </TouchableOpacity>
                          ),
                          fontSize_pull: ({ tintColor }) => (
                            <TouchableOpacity onPress={()=>fontSize(false)}>
                              <MaterialCommunityIcons name="format-font-size-decrease" size={24} color={tintColor} />
                            </TouchableOpacity>
                          ),
                          ForeColor: ({ tintColor }) => (
                            <TouchableOpacity onPress={openTextColor}>
                              <MaterialIcons name="format-color-text" size={24} color={tintColor} />
                            </TouchableOpacity>
                          ),
                        }}
                      />
                      <RichEditor
                        initialContentHTML={note!=''?note:''}
                        ref={editorRef}
                        style={styles.editor}
                        onChange={(text) => noteEdit(text)}
                        initialHeight={220}
                        onMessage={(data)=>{
                          var txt = data.data;
                          var check_txt = '';
                          if (txt.length > 5) {
                            check_txt = txt.slice(-5);
                          } else {
                            check_txt = txt;
                          }
                          setInputCursorPosition(check_txt.trim());
                        }}
                      />
                    </>
                  )}
                </View>
              </ScrollView>
            </TouchableWithoutFeedback>
            <View style={{flexDirection: 'row',alignSelf: 'center'}}>
              <TouchableOpacity onPress={onClose} style={styles.close2}>
                <Text>閉じる</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onDraft} style={styles.draft}>
                <Text style={{fontSize:12}}>下書き保存</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onSubmit} style={styles.submit}>
                <Text style={styles.submitText}>{checked?"予　約":"送　信"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function MyModal2(props){
  
  const { isVisible,onSwipeComplete,onSend } = props;
  
  const [con_flg, setCon_flg] = useState(false);
  
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(null);
  const [items1, setItems1] = useState([
    {label: 'メール送信', value: 'メール送信'},
    {label: 'メール受信', value: 'メール受信'},
    {label: '資料送付', value: '資料送付'},
    {label: '電話連絡(担当→お客様)', value: '電話連絡(担当→お客様)'},
    {label: '電話連絡(お客様→担当)', value: '電話連絡(お客様→担当)'},
    {label: 'その他', value: 'その他'}
  ]);
  
  const [action_text, setAction_text] = useState(null);
  
  const [date, setDate] = useState(new Date());
  const [mode, setMode] = useState('date');
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios');
    setDate(currentDate);
  };

  const showMode = (currentMode) => {
    setShow(true);
    setMode(currentMode);
  };

  const showDatepicker = () => {
    showMode('date');
  };

  const showTimepicker = () => {
    showMode('time');
  };
  
  const [isSelected, setSelection] = useState(false);
  
  const onSubmit = () => {
    
    if(!status) {
      Alert.alert('行動を選択してください');
    } else {
      const formatDate = (current_datetime) => {
        let formatted_date = 
          current_datetime.getFullYear() + "-" + 
          (current_datetime.getMonth() + 1) + "-" + 
          current_datetime.getDate() + " " + 
          current_datetime.getHours() + ":" + 
          current_datetime.getMinutes() + ":" + "0";
        return formatted_date;
      }

      setCon_flg(true);
      props.setModal2(false);
      props.onSend([formatDate(date),status,action_text],'edit');
    }
    
  }
  
  const onClose = () => {
    props.setModal2(false);
  }

  function action_date() {
    if (Platform.OS === 'ios') {
      return (
        <View>
          <View style={styles.input}>
            <Text style={styles.label}>日時</Text>
            <DateTimePicker
              value={date}
              mode={'datetime'}
              is24Hour={true}
              display="default"
              locale={'ja'}
              onChange={onChange}
            />
          </View>
        </View>
      );
    } else if (Platform.OS === 'android') {
      return (
        <View>
          <View style={styles.input}>
            <Text style={styles.label}>日時</Text>
            <View style={{flexDirection: 'row'}}>
              <View>
                <Button onPress={showDatepicker} title={Moment(date).format("YYYY-MM-DD")} />
              </View>
              <View style={{marginLeft:10}}>
                <Button onPress={showTimepicker} title={Moment(date).format("HH:mm")} />
              </View>
              {show && (
                <DateTimePicker
                  testID="dateTimePicker"
                  value={date}
                  mode={mode}
                  is24Hour={true}
                  display="default"
                  onChange={onChange}
                />
              )}
            </View>
          </View>
        </View>
      );
    }
  }
  
  const [keyboardStatus, setKeyboardStatus] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardStatus(true);
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardStatus(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  
  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.5}
      animationInTiming={300}
      animationOutTiming={500}
      animationIn={'slideInDown'}
      animationOut={'slideOutUp'}
      onModalHide={() => {setCon_flg(false)}}
      onBackdropPress={()=>{
        keyboardStatus?Keyboard.dismiss():onClose()
      }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <TouchableWithoutFeedback
          onPress={()=>Keyboard.dismiss()}
        >
          <View style={[{height:500},styles.bottom,styles.modalInner]}>
            <TouchableOpacity
              style={styles.close}
              onPress={onClose}
            >
              <Feather name='x-circle' color='gray' size={35} />
            </TouchableOpacity>
            <View style={styles.form}>
              <View style={styles.input}>{action_date()}</View>
              <View style={{ zIndex: 100 }}>
                <DropDownPicker
                  open={open}
                  value={status}
                  items={items1}
                  setOpen={setOpen}
                  setValue={setStatus}
                  setItems={setItems1}
                  style={styles.inputInner}
                  placeholder = "選択してください"
                  maxHeight={300}
                />
              </View>
              <View style={styles.input}>
                <Text style={styles.label}>内容詳細</Text>
                <TextInput
                  onChangeText={(text) => {setAction_text(text)}}
                  value={action_text}
                  style={styles.textarea}
                  multiline={true}
                  disableFullscreenUI={true}
                  numberOfLines={11}
                />
              </View>
              <TouchableOpacity onPress={onSubmit} style={styles.submit}>
                <Text style={styles.submitText}>登　録</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function MyModal3(props){
  
  const { route,isVisible,onSwipeComplete,onClose,msgtext,property,inquiry,station_list,address,c_d,mail_format,editorRef,inputCursorPosition,flg } = props;
  
  const [isRecommended, setRecommended] = useState(false);

  const recommended = () => {
    setRecommended(!isRecommended);
  };
  
  const [article_name,setArticle_name] = useState(''); // 物件名
  
  const [open_rent_from,setOpen_Rent_from] = useState(false); // 賃料下限
  const [value_rent_from,setValue_Rent_from] = useState(false);
  const [rent_from, setRent_from] = useState([
    {label: '------------', value: ''},
    {label: '1.0万円', value: '10000'},
    {label: '1.5万円', value: '15000'},
    {label: '2.0万円', value: '20000'},
    {label: '2.5万円', value: '25000'},
    {label: '3.0万円', value: '30000'},
    {label: '3.5万円', value: '35000'},
    {label: '4.0万円', value: '40000'},
    {label: '4.5万円', value: '45000'},
    {label: '5.0万円', value: '50000'},
    {label: '5.5万円', value: '55000'},
    {label: '6.0万円', value: '60000'},
    {label: '6.5万円', value: '65000'},
    {label: '7.0万円', value: '70000'},
    {label: '7.5万円', value: '75000'},
    {label: '8.0万円', value: '80000'},
    {label: '8.5万円', value: '85000'},
    {label: '9.0万円', value: '90000'},
    {label: '9.5万円', value: '95000'},
    {label: '10万円', value: '100000'},
    {label: '11万円', value: '110000'},
    {label: '12万円', value: '120000'},
    {label: '13万円', value: '130000'},
    {label: '14万円', value: '140000'},
    {label: '15万円', value: '150000'},
    {label: '16万円', value: '160000'},
    {label: '17万円', value: '170000'},
    {label: '18万円', value: '180000'},
    {label: '19万円', value: '190000'},
    {label: '20万円', value: '200000'},
    {label: '21万円', value: '210000'},
    {label: '22万円', value: '220000'},
    {label: '23万円', value: '230000'},
    {label: '24万円', value: '240000'},
    {label: '25万円', value: '250000'},
    {label: '26万円', value: '260000'},
    {label: '27万円', value: '270000'},
    {label: '28万円', value: '280000'},
    {label: '29万円', value: '290000'},
    {label: '30万円', value: '300000'},
    {label: '31万円', value: '310000'},
    {label: '32万円', value: '320000'},
    {label: '33万円', value: '330000'},
    {label: '34万円', value: '340000'},
    {label: '35万円', value: '350000'},
    {label: '36万円', value: '360000'},
    {label: '37万円', value: '370000'},
    {label: '38万円', value: '380000'},
    {label: '39万円', value: '390000'},
    {label: '40万円', value: '400000'},
    {label: '50万円', value: '500000'},
    {label: '100万円', value: '1000000'}
  ]);
  
  const [open_rent_to,setOpen_Rent_to] = useState(false); // 賃料上限
  const [value_rent_to,setValue_Rent_to] = useState(false);
  const [rent_to, setRent_to] = useState([
    {label: '------------', value: ''},
    {label: '1.5万円', value: '15000'},
    {label: '2.0万円', value: '20000'},
    {label: '2.5万円', value: '25000'},
    {label: '3.0万円', value: '30000'},
    {label: '3.5万円', value: '35000'},
    {label: '4.0万円', value: '40000'},
    {label: '4.5万円', value: '45000'},
    {label: '5.0万円', value: '50000'},
    {label: '5.5万円', value: '55000'},
    {label: '6.0万円', value: '60000'},
    {label: '6.5万円', value: '65000'},
    {label: '7.0万円', value: '70000'},
    {label: '7.5万円', value: '75000'},
    {label: '8.0万円', value: '80000'},
    {label: '8.5万円', value: '85000'},
    {label: '9.0万円', value: '90000'},
    {label: '9.5万円', value: '95000'},
    {label: '10万円', value: '100000'},
    {label: '11万円', value: '110000'},
    {label: '12万円', value: '120000'},
    {label: '13万円', value: '130000'},
    {label: '14万円', value: '140000'},
    {label: '15万円', value: '150000'},
    {label: '16万円', value: '160000'},
    {label: '17万円', value: '170000'},
    {label: '18万円', value: '180000'},
    {label: '19万円', value: '190000'},
    {label: '20万円', value: '200000'},
    {label: '21万円', value: '210000'},
    {label: '22万円', value: '220000'},
    {label: '23万円', value: '230000'},
    {label: '24万円', value: '240000'},
    {label: '25万円', value: '250000'},
    {label: '26万円', value: '260000'},
    {label: '27万円', value: '270000'},
    {label: '28万円', value: '280000'},
    {label: '29万円', value: '290000'},
    {label: '30万円', value: '300000'},
    {label: '31万円', value: '310000'},
    {label: '32万円', value: '320000'},
    {label: '33万円', value: '330000'},
    {label: '34万円', value: '340000'},
    {label: '35万円', value: '350000'},
    {label: '36万円', value: '360000'},
    {label: '37万円', value: '370000'},
    {label: '38万円', value: '380000'},
    {label: '39万円', value: '390000'},
    {label: '40万円', value: '400000'},
    {label: '50万円', value: '500000'},
    {label: '100万円', value: '1000000'}
  ]);
  
  const [general, setGeneral] = useState(false);
  const [deposit, setDeposit] = useState(false);

  const [open_layout, setOpen_layout] = useState(false); // 間取り
  const [value_layout, setValue_layout] = useState(null);
  const [layout, setLayout] = useState([
    {label: '1R', value: '1R'},
    {label: '1K', value: '1K'},
    {label: '1DK', value: '1DK'},
    {label: '1LDK', value: '1LDK'},
    {label: '2K', value: '2K'},
    {label: '2DK', value: '2DK'},
    {label: '2LDK', value: '2LDK'},
    {label: '3K', value: '3K'},
    {label: '3DK', value: '3DK'},
    {label: '3LDK', value: '3LDK'},
    {label: '4K～', value: '4K～'}
  ]);
  
  const [stations,setStations] = useState('');

  if(stations){
    var get_station = stations.map(value => {
      return {id: value.station_code, name: value.station_name+'('+value.line_name+')'}
    })
  }
  
  const [filteredStations, setFilteredStations] = useState([]); // 沿線・駅名
  const [selectedStations, setSelectedStations] = useState([]);
  
  const findStation = (query) => {
    if (query) {
      const regex = new RegExp(`${query.trim()}`, 'i');
      setFilteredStations(
        station_list.filter((station) => station.name.search(regex) >= 0)
      );
    } else {
      setFilteredStations([]);
    }
  };
  
  // 選択した駅を削除
  const station_delete = (props) => {
    setSelectedStations(
      selectedStations.filter((v) => {
        return (v.id !== props.id);
      })
    )
  }
  
  const [station_time,setStation_time] = useState(''); // 徒歩分数
  
  const [area,setArea] = useState('');
  
  if(area){
    var get_area = area.map(value => {
      return {id: value.address_code, name: value.address}
    })
  }
  
  const [filteredAddress, setFilteredAddress] = useState([]); // エリア
  const [selectedAddress, setSelectedAddress] = useState([]);

  const findAddress = (query) => {
    if (query) {
      const regex = new RegExp(`${query.trim()}`, 'i');
      if(address) {
        setFilteredAddress(
          address.filter((area) => area.name.search(regex) >= 0)
        );
      }
    } else {
      setFilteredAddress([]);
    }
  };
  
  // 選択したエリアを削除
  const area_delete = (props) => {
    setSelectedAddress(
      selectedAddress.filter((v) => {
        return (v.id !== props.id);
      })
    )
  }
  
  const [open_exclusive_from, setOpen_Exclusive_from] = useState(false); // 面積下限
  const [value_exclusive_from, setValue_Exclusive_from] = useState(null);
  const [exclusive_from,setExclusive_from] = useState([
    {label: '------------', value: ''},
    {label: '15㎡未満', value: '15'},
    {label: '20㎡', value: '20'},
    {label: '25㎡', value: '25'},
    {label: '30㎡', value: '30'},
    {label: '35㎡', value: '35'},
    {label: '40㎡', value: '40'},
    {label: '45㎡', value: '45'},
    {label: '50㎡', value: '50'},
    {label: '55㎡', value: '55'},
    {label: '60㎡', value: '60'},
    {label: '65㎡', value: '65'},
    {label: '70㎡', value: '70'},
    {label: '75㎡', value: '75'},
    {label: '80㎡', value: '80'},
    {label: '85㎡', value: '85'},
    {label: '90㎡', value: '90'},
    {label: '95㎡', value: '95'},
    {label: '100㎡以上', value: '100'},
  ]);
  
  const [open_exclusive_to, setOpen_Exclusive_to] = useState(false); // 面積上限
  const [value_exclusive_to, setValue_Exclusive_to] = useState(null);
  const [exclusive_to,setExclusive_to] = useState([
    {label: '------------', value: ''},
    {label: '15㎡未満', value: '15'},
    {label: '20㎡', value: '20'},
    {label: '25㎡', value: '25'},
    {label: '30㎡', value: '30'},
    {label: '35㎡', value: '35'},
    {label: '40㎡', value: '40'},
    {label: '45㎡', value: '45'},
    {label: '50㎡', value: '50'},
    {label: '55㎡', value: '55'},
    {label: '60㎡', value: '60'},
    {label: '65㎡', value: '65'},
    {label: '70㎡', value: '70'},
    {label: '75㎡', value: '75'},
    {label: '80㎡', value: '80'},
    {label: '85㎡', value: '85'},
    {label: '90㎡', value: '90'},
    {label: '95㎡', value: '95'},
    {label: '100㎡以上', value: '100'},
  ]);
  
  const [detail, setDetail] = useState(false); // 詳細ボタン
  
  // 以下詳細
  
  const [article_id,setArticle_id] = useState(''); // 物件番号
  
  const [open_category, setOpen_Category] = useState(false); // 物件種別
  const [value_category, setValue_Category] = useState(null);
  const [category, setCategory] = useState([
    {label: 'アパート', value: 'アパート'},
    {label: 'タウンハウス', value: 'タウンハウス'},
    {label: 'テラスハウス', value: 'テラスハウス'},
    {label: 'マンション', value: 'マンション'},
    {label: '一戸建', value: '一戸建'}
  ]);
  
  const [open_constructure, setOpen_Constructure] = useState(false); // 建物構造
  const [value_constructure, setValue_Constructure] = useState(null);
  const [constructure, setConstructure] = useState([
    {label: 'ALC', value: 'ALC'},
    {label: 'HPC', value: 'HPC'},
    {label: 'PC', value: 'PC'},
    {label: 'ブロック', value: 'ブロック'},
    {label: '木造', value: '木造'},
    {label: '軽量鉄骨', value: '軽量鉄骨'},
    {label: '鉄筋コンクリート造', value: '鉄筋コンクリート造'},
    {label: '鉄筋鉄骨コンクリート造', value: '鉄筋鉄骨コンクリート造'},
    {label: '鉄骨造', value: '鉄骨造'}
  ]);
  
  const [open_built, setOpen_Built] = useState(false); // 築年数
  const [value_built, setValue_Built] = useState(null);
  const [built, setBuilt] = useState([
    {label: '新築', value: '1'},
    {label: '～5年', value: '5'},
    {label: '～10年', value: '10'},
    {label: '～15年', value: '15'},
    {label: '～20年', value: '20'},
    {label: '指定なし', value: ''}
  ]);
  
  const [open_setubi, setOpen_Setubi] = useState(false); // 条件・設備
  const [value_setubi, setValue_Setubi] = useState(null);
  const [setubi, setSetubi] = useState([
    {label: '棟条件設備', value: 'building',},
    {label: 'ペット相談', value: 'ペット相談', parent: 'building'},
    {label: 'ガレージ(近隣含まない)', value: 'ガレージ', parent: 'building'},
    {label: 'バイク', value: 'バイク', parent: 'building'},
    {label: '楽器', value: '楽器', parent: 'building'},
    {label: 'エレベータ', value: 'エレベータ', parent: 'building'},
    {label: 'オートロック', value: 'オートロック', parent: 'building'},
    {label: '宅配ボックス', value: '宅配ボックス', parent: 'building'},
    
    {label: '部屋条件設備', value: 'room',},
    {label: '都市ガス', value: '都市ガス', parent: 'room'},
    {label: 'セパレート', value: 'セパレート', parent: 'room'},
    {label: '室内洗濯機', value: '室内洗濯機', parent: 'room'},
    {label: '独立洗面', value: '独立洗面', parent: 'room'},
    {label: 'フローリング', value: 'フローリング', parent: 'room'},
    {label: 'システムキッチン', value: 'システムキッチン', parent: 'room'},
    {label: '追い焚き', value: '追い焚き', parent: 'room'},
    {label: '2階以上', value: '2階以上', parent: 'room'},
    {label: 'エアコン', value: 'エアコン', parent: 'room'},
    {label: 'ロフト', value: 'ロフト', parent: 'room'},
    {label: 'バルコニー', value: 'バルコニー', parent: 'room'},
    {label: '専用庭', value: '専用庭', parent: 'room'},
    {label: '浴室乾燥', value: '浴室乾燥', parent: 'room'},
    {label: 'TVインターフォン', value: 'TVインターフォン', parent: 'room'},
    {label: 'インターネット', value: 'インターネット', parent: 'room'},
    {label: 'インターネット無料', value: 'インターネット無料', parent: 'room'},
    {label: '照明', value: '照明', parent: 'room'},
    {label: '角部屋', value: '角部屋', parent: 'room'},
    {label: '分譲タイプ', value: '分譲タイプ', parent: 'room'},
    {label: '最上階', value: '最上階', parent: 'room'},
    {label: '現況確認日30日以上経過を含む', value: '現況確認日30日', parent: 'room'},
    
    {label: 'コンロ', value: 'stove'},
    {label: '電気', value: '電気', parent: 'stove'},
    {label: 'IH', value: 'IH', parent: 'stove'},
    {label: 'ガス', value: 'ガス', parent: 'stove'}
  ]);
  
  const [open_stove, setOpen_Stove] = useState(false); // コンロ
  const [value_stove, setValue_Stove] = useState(null);
  const [stove, setStove] = useState([
    {label: '------------', value: ''},
    {label: '電気', value: '電気'},
    {label: 'IH', value: 'IH'},
    {label: 'ガス', value: 'ガス'}
  ]);
  
  const [open_direction, setOpen_Direction] = useState(false); // 主要採光面
  const [value_direction, setValue_Direction] = useState(null);
  const [direction, setDirection] = useState([
    {label: '北', value: '北'},
    {label: '北東', value: '北東'},
    {label: '東', value: '東'},
    {label: '南東', value: '南東'},
    {label: '南', value: '南'},
    {label: '南西', value: '南西'},
    {label: '西', value: '西'},
    {label: '北西', value: '北西'}
  ]);
  
  useEffect(() => {
    if(c_d) {
      setArticle_name(c_d.article_name?c_d.article_name:'');
      setValue_Rent_from(c_d.rent_from?c_d.rent_from:false);
      setValue_Rent_to(c_d.rent_to?c_d.rent_to:false);
      setGeneral(c_d.general?true:false);
      setDeposit(c_d.deposit?true:false);
      setValue_layout(c_d.layout?c_d.layout.split(','):null);
      setStations(c_d.station?c_d.station:false);
      setStation_time(c_d.station_time?c_d.station_time:'');
      setArea(c_d.area?c_d.area:false);
      setValue_Exclusive_from(c_d.exclusive_from?c_d.exclusive_from:null);
      setValue_Exclusive_to(c_d.exclusive_to?c_d.exclusive_to:null);
      setArticle_id(c_d.article_id?c_d.article_id:'');
      setValue_Category(c_d.category?c_d.category.split(','):null);
      setValue_Constructure(c_d.constructure?c_d.constructure.split(','):null);
      setValue_Built(c_d.built?c_d.built:null);
      setValue_Setubi(c_d.setubi?c_d.setubi.split(','):null);
      setValue_Stove(c_d.stove?c_d.stove:null);
      setValue_Direction(c_d.direction?c_d.direction.split(','):null);
    }
  }, [c_d])
  
  useEffect(() => {
    setSelectedStations(get_station?get_station:[]);
  }, [stations])
  
  useEffect(() => {
    setSelectedAddress(get_area?get_area:[]);
  }, [area])
  
  const [search,setSearch] = useState(false);
  
  const [save, setSave] = useState(true); // 条件保存
  
  if (selectedStations.length){
    var station = selectedStations.map(sv => sv.id)
  }
  
  if (selectedAddress.length){
    var areas = selectedAddress.map(sv => sv.id)
  }
  
  const onSubmit = () => {
    const search_entry = {
      article_name:article_name,
      rent_from:value_rent_from,
      rent_to:value_rent_to,
      general:general,
      deposit:deposit,
      layout:value_layout?`${value_layout}`:null,
      station:station?`${station}`:null,
      station_time:station_time,
      area:areas?`${areas}`:null,
      exclusive_from:value_exclusive_from,
      exclusive_to:value_exclusive_to,
      article_id:article_id,
      category:value_category?`${value_category}`:null,
      constructure:value_constructure?`${value_constructure}`:null,
      built:value_built,
      setubi:value_setubi?`${value_setubi}`:null,
      stove:value_stove,
      direction:direction===null?`${value_direction}`:null,
    }

    setSearch(search_entry);
    setRecommended(!isRecommended);
  }
  
    useEffect(() => {
      if(search){
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
              act:'get_talk',
              customer_id:route.customer,
              article_search_flg:1,
              save_flg:save?1:false,
              article_name:search.article_name,
              rent_from:search.rent_from,
              rent_to:search.rent_to,
              general:search.general,
              deposit:search.deposit,
              layout:search.layout,
              station:search.station,
              station_time:search.station_time,
              area:search.area,
              exclusive_from:search.exclusive_from,
              exclusive_to:search.exclusive_to,
              article_id:search.article_id,
              category:search.category,
              constructure:search.constructure,
              built:search.built,
              setubi:search.setubi,
              stove:search.stove,
              direction:search.direction,
            })
          })
            .then((response) => response.json())
            .then((json) => {
              setSearch_results(json['article_search_list']);
            })
            .catch((error) => {
              const errorMsg = "検索に失敗しました";
              console.log(error);
              Alert.alert(errorMsg);
            })
      }
    }, [search])
  
  const onDelete = () => {
    setArticle_name('');
    setValue_Rent_from(false);
    setValue_Rent_to(false);
    setGeneral(false);
    setDeposit(false);
    setValue_layout(null);
    setSelectedStations([]);
    setStation_time('');
    setSelectedAddress([]);
    setValue_Exclusive_from(null);
    setValue_Exclusive_to(null);
    setArticle_id('');
    setValue_Category(null);
    setValue_Constructure(null);
    setValue_Built(null);
    setValue_Setubi(null);
    setValue_Direction(null);
  }
  
  const [search_results,setSearch_results] = useState(false);
  
  // HTML形式に変換
  function convertToHTML(text) {
    let urlPattern = /(^|\s|<.+?>)(https?:\/\/[^\s<>]+)($|\s|<.+?>)/g;
    let extractedText;

    if (/(<\/?[^>]+(>|$)|&nbsp;)/gi.test(text)) {
      // 既にHTMLソースの場合
      extractedText = text.split('”').join('"');
    } else {
      // 普通の文字列の場合
      extractedText = text.replace(/\n/g, '<br />\n');
    }

    extractedText = extractedText.replace(urlPattern, function(match, p1, p2, p3) {
      if (p1.startsWith("<a") || p1.startsWith("<img") || p1.startsWith("<area")) {
        // URLの文字列がa,img,areaのどれかのタグで挟まれていたら、そのままのソースを返す
        return match;
      } else {
        // URLの文字列がその他のHTMLタグかスペースに挟まれていたら、aタグで挟む
        return p1 + "<a href='" + p2 + "'>" + p2 + "</a>" + p3;
      }
    });

    return extractedText;
  }

  const [insertMsg,setInsertMsg] = useState(false);
  
  // 物件挿入
  const proInsert = (item) => {
    let proMsg;

    let msg = item.article_name+"／"+item.layout+"／"+item.category+"\n"+
              item.line_name1+"／"+item.station_name1+"駅／徒歩"+item.station_time1+"分／"+
              item.rent/10000+"万円("+item.general+"円)／"+item.exclusive+"㎡"+"\n\n"+
              "https://www.total-cloud.net/show/"+route.customer+"/1/"+item.article_id+"/"+"\n";

    if (mail_format == '1') {
      // HTMLエディタのカーソル位置に挿入
      msg = convertToHTML(msg);
      
      if (inputCursorPosition != null) {
        var index = msgtext.indexOf(inputCursorPosition);
        if (index != -1) {
          msg = '\n' + '<div>' + msg + '</div>';
          proMsg = msgtext.slice(0, index + inputCursorPosition.length) + msg + msgtext.slice(index + inputCursorPosition.length);
        } else {
          proMsg = msgtext + msg;
        }
      } else {
        proMsg = msg + msgtext;
      }
    } else if (mail_format == '0') {
      // TextInputのカーソル位置に挿入
      if (inputCursorPosition != null) {
        proMsg = msgtext.slice(0, inputCursorPosition.start) + msg + msgtext.slice(inputCursorPosition.end);
      } else {
        proMsg = msgtext + msg;
      }
    } else {
      // トーク画面
      proMsg = msgtext + msg;
    }

    setInsertMsg(msgtext?proMsg:msg);
  }
  
  useEffect(() => {
    if (insertMsg) {
      if(props.setMsgtext) {
        props.setMsgtext(insertMsg);
      } else if (props.setNote) {
        props.setNote(insertMsg);
        if (mail_format == '1' && insertMsg) {
          editorRef.current.setContentHTML(insertMsg);
        }
      }
    }
  },[insertMsg])

  const ListData = flg=="property"?(search_results?search_results:property):inquiry;
  
  return (
    <Modal
      isVisible={isVisible}
      swipeDirection={['up']}
      onSwipeComplete={onSwipeComplete}
      backdropOpacity={0.5}
      animationInTiming={300}
      animationOutTiming={500}
      animationIn={'slideInDown'}
      animationOut={'slideOutUp'}
      propagateSwipe={true}
      onBackdropPress={onClose}
    >
      <View style={styles.template}>
        <TouchableOpacity
          style={styles.close}
          onPress={onClose}
        >
          <Feather name='x-circle' color='gray' size={35} />
        </TouchableOpacity>
        {flg=="property"?(
          <>
            <Text style={styles.templateText}>
            指定されている条件でおすすめ物件が表示されます。{"\n"}
            [挿入]ボタンをクリックすると文中に挿入されます。
            </Text>
            <TouchableOpacity style={styles.searchBtn} onPress={recommended}>
              <Text>オススメ物件を探す</Text>
            </TouchableOpacity>
          </>
        ):(
          <Text style={[styles.templateText,{marginBottom:10}]}>
          問合せ物件が表示されます。{"\n"}
          [挿入]ボタンをクリックすると文中に挿入されます。
          </Text>
        )}
        <Modal
          isVisible={isRecommended}
          backdropOpacity={0.5}
          animationInTiming={300}
          animationOutTiming={500}
          animationIn={'slideInDown'}
          animationOut={'slideOutUp'}
          onBackdropPress={recommended}
        >
          <View style={[{height:600},styles.modalInner]}>
            <TouchableOpacity
              style={styles.close}
              onPress={recommended}
            >
              <Feather name='x-circle' color='gray' size={35} />
            </TouchableOpacity>
            <View style={styles.form}>
              <FlatList
                style={{height:400}}
                data={[
                  (<View>
                    <View style={styles.input}>
                      <Text style={styles.label}>物件名</Text>
                      <TextInput
                        onChangeText={(text) => {setArticle_name(text)}}
                        value={article_name}
                        style={styles.inputInner}
                      />
                    </View>
                      <Text style={styles.label}>賃料</Text>
                      <View style={{flexDirection: 'row',zIndex:1000}}>
                        <DropDownPicker
                          placeholder="------------"
                          style={styles.inputInner}
                          containerStyle={{width:'43%'}}
                          open={open_rent_from}
                          value={value_rent_from}
                          items={rent_from}
                          setOpen={setOpen_Rent_from}
                          setValue={setValue_Rent_from}
                          setItems={setRent_from}
                          zIndex={1000}
                          listMode={"SCROLLVIEW"}
                          dropDownContainerStyle={[Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          },{height:100}]}
                        />
                        <Text style={{marginTop:15}}>　～　</Text>
                        <DropDownPicker
                          placeholder="------------"
                          style={styles.inputInner}
                          containerStyle={{width:'43%'}}
                          open={open_rent_to}
                          value={value_rent_to}
                          items={rent_to}
                          setOpen={setOpen_Rent_to}
                          setValue={setValue_Rent_to}
                          setItems={setRent_to}
                          zIndex={999}
                          listMode={"SCROLLVIEW"}
                          dropDownContainerStyle={[Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          },{height:100}]}
                        />
                      </View>
                      <View style={{flexDirection: 'row',marginTop:10}}>
                        <View style={{width:'50%'}}>
                          <CheckBox
                            title='管理費込み'
                            checked={general}
                            onPress={() => setGeneral(!general)}
                            containerStyle={{marginLeft:0}}
                          />
                        </View>
                        <View style={{width:'50%'}}>
                          <CheckBox
                            title='敷金礼金なし'
                            checked={deposit}
                            onPress={() => setDeposit(!deposit)}
                            containerStyle={{marginLeft:0}}
                          />
                        </View>
                      </View>
                      <Text style={styles.label}>間取り
                      <Text style={styles.inlabel}>　※複数選択可</Text></Text>
                      <View style={{zIndex:998}}>
                        <DropDownPicker
                          placeholder="------------"
                          multiple={true}
                          open={open_layout}
                          value={value_layout}
                          items={layout}
                          setOpen={setOpen_layout}
                          setValue={setValue_layout}
                          setItems={setLayout}
                          zIndex={998}
                          listMode={"SCROLLVIEW"}
                          translation={{ SELECTED_ITEMS_COUNT_TEXT:"{count}"}}
                          dropDownContainerStyle={[Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          },{height:150}]}
                        />
                      </View>
                    <View style={[styles.input,{zIndex:997}]}>
                      <Text style={styles.label}>沿線・駅名
                      <Text style={styles.inlabel}>　※検索語句を入力してください</Text></Text>
                      <Autocomplete
                        data={filteredStations}
                        onChangeText={(text) => findStation(text)}
                        style={styles.inputInner}
                        inputContainerStyle={{borderWidth:0}}
                        flatListProps={{
                          keyExtractor: (item) => `${item.id}`,
                          renderItem: ({ item }) =>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedStations((prevArray) => [...prevArray, item]);
                              setFilteredStations([]);
                            }}>
                            <Text style={styles.suggestText}>
                              {item.name}
                            </Text>
                          </TouchableOpacity>,
                        }}
                      />
                    </View>
                    <View style={{flexDirection: 'row'}}>
                      <FlatList 
                        data={selectedStations}
                        renderItem={({ item }) =>
                          (
                            <MaterialChip
                              text={item.name}
                              onPress={() => station_delete(item)}
                              rightIcon={
                                <Feather name='x-circle' color='gray' size={18} />
                              }
                            />
                          )
                        }
                        keyExtractor={(item) => `${item.id}`}
                      />
                    </View>
                    <View style={styles.input}>
                      <Text style={styles.label}>徒歩分数</Text>
                      <TextInput
                        onChangeText={(text) => {setStation_time(text)}}
                        value={station_time}
                        style={styles.inputInner}
                      />
                    </View>
                    <View style={[styles.input,{zIndex:996}]}>
                      <Text style={styles.label}>エリア名
                      <Text style={styles.inlabel}>　※検索語句を入力してください</Text></Text>
                      <Autocomplete
                        data={filteredAddress}
                        onChangeText={(text) => findAddress(text)}
                        style={styles.inputInner}
                        inputContainerStyle={{borderWidth:0}}
                        flatListProps={{
                          keyExtractor: (item) => `${item.id}`,
                          renderItem: ({ item }) =>
                          <TouchableOpacity
                            onPress={() => {
                              setSelectedAddress((prevArray) => [...prevArray, item]);
                              setFilteredAddress([]);
                            }}>
                            <Text style={styles.suggestText}>
                              {item.name}
                            </Text>
                          </TouchableOpacity>,
                        }}
                      />
                    </View>
                    <View style={{flexDirection: 'row'}}>
                      <FlatList 
                        data={selectedAddress}
                        renderItem={({ item }) =>
                          (
                            <MaterialChip
                              text={item.name}
                              onPress={() => area_delete(item)}
                              rightIcon={
                                <Feather name='x-circle' color='gray' size={18} />
                              }
                            />
                          )
                        }
                        keyExtractor={(item) => `${item.id}`}
                      />
                    </View>
                    <View style={[styles.input,{zIndex:995}]}>
                      <Text style={styles.label}>面積</Text>
                      <View style={{flexDirection: 'row',zIndex:997}}>
                        <DropDownPicker
                          placeholder="------------"
                          style={styles.inputInner}
                          containerStyle={{width:'43%'}}
                          open={open_exclusive_from}
                          value={value_exclusive_from}
                          items={exclusive_from}
                          setOpen={setOpen_Exclusive_from}
                          setValue={setValue_Exclusive_from}
                          setItems={setExclusive_from}
                          zIndex={995}
                          listMode={"SCROLLVIEW"}
                          dropDownContainerStyle={[Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          },{height:100}]}
                        />
                        <Text style={{marginTop:15}}>　～　</Text>
                        <DropDownPicker
                          placeholder="------------"
                          style={styles.inputInner}
                          containerStyle={{width:'43%'}}
                          open={open_exclusive_to}
                          value={value_exclusive_to}
                          items={exclusive_to}
                          setOpen={setOpen_Exclusive_to}
                          setValue={setValue_Exclusive_to}
                          setItems={setExclusive_to}
                          zIndex={994}
                          listMode={"SCROLLVIEW"}
                          dropDownContainerStyle={[Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          },{height:100}]}
                        />
                      </View>
                      <CheckBox
                        center
                        title='詳細'
                        containerStyle={[detail === true?'':{marginBottom:35},{marginTop:20}]}
                        checked={detail}
                        onPress={() => setDetail(!detail)}
                      />
                    </View>
                    <View style={detail === true?'':{display:'none'}}>
                      <View style={styles.input}>
                        <Text style={styles.label}>物件番号</Text>
                        <TextInput
                          onChangeText={(text) => {setArticle_id(text)}}
                          value={article_id}
                          style={styles.inputInner}
                        />
                      </View>
                      <View style={[styles.input,{zIndex:993}]}>
                        <Text style={styles.label}>物件種別
                        <Text style={styles.inlabel}>　※複数選択可</Text></Text>
                        <DropDownPicker
                          placeholder="------------"
                          multiple={true}
                          style={styles.inputInner}
                          open={open_category}
                          value={value_category}
                          items={category}
                          setOpen={setOpen_Category}
                          setValue={setValue_Category}
                          setItems={setCategory}
                          listMode={"SCROLLVIEW"}
                          translation={{ SELECTED_ITEMS_COUNT_TEXT:"{count}"}}
                          dropDownContainerStyle={Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          }}
                        />
                      </View>
                      <View style={[styles.input,{zIndex:992}]}>
                        <Text style={styles.label}>建物構造
                        <Text style={styles.inlabel}>　※複数選択可</Text></Text>
                        <DropDownPicker
                          placeholder="------------"
                          multiple={true}
                          style={styles.inputInner}
                          open={open_constructure}
                          value={value_constructure}
                          items={constructure}
                          setOpen={setOpen_Constructure}
                          setValue={setValue_Constructure}
                          setItems={setConstructure}
                          listMode={"SCROLLVIEW"}
                          translation={{ SELECTED_ITEMS_COUNT_TEXT:"{count}"}}
                          dropDownContainerStyle={Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          }}
                        />
                      </View>
                      <View style={[styles.input,{zIndex:991}]}>
                        <Text style={styles.label}>築年数</Text>
                        <DropDownPicker
                          placeholder="------------"
                          style={styles.inputInner}
                          open={open_built}
                          value={value_built}
                          items={built}
                          setOpen={setOpen_Built}
                          setValue={setValue_Built}
                          setItems={setBuilt}
                          listMode={"SCROLLVIEW"}
                          dropDownContainerStyle={Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          }}
                        />
                        <Text style={[styles.inlabel,{marginTop:10}]}>※新築は築1年以内の物件が絞り込まれます</Text>
                      </View>
                      <View style={[styles.input,{zIndex:990}]}>
                        <Text style={styles.label}>条件・設備
                        <Text style={styles.inlabel}>　※複数選択可</Text></Text>
                        <DropDownPicker
                          placeholder="------------"
                          multiple={true}
                          categorySelectable={false}
                          style={styles.inputInner}
                          open={open_setubi}
                          value={value_setubi}
                          items={setubi}
                          setOpen={setOpen_Setubi}
                          setValue={setValue_Setubi}
                          setItems={setSetubi}
                          listMode={"SCROLLVIEW"}
                          translation={{ SELECTED_ITEMS_COUNT_TEXT:"{count}"}}
                          dropDownContainerStyle={Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          }}
                        />
                      </View>
                      <View style={{flexDirection: 'row',alignItems: 'center',zIndex:889,marginTop:10}}>
                        <Text style={[styles.label,{width:'20%'}]}>コンロ：</Text>
                        <DropDownPicker
                          placeholder="------------"
                          style={[styles.inputInner,{width:'78%'}]}
                          open={open_stove}
                          value={value_stove}
                          items={stove}
                          setOpen={setOpen_Stove}
                          setValue={setValue_Stove}
                          setItems={setStove}
                          listMode={"SCROLLVIEW"}
                          dropDownContainerStyle={Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          }}
                        />
                      </View>
                      <View
                        style={[
                          styles.input,
                          (open_direction || open_setubi || open_stove === true)&&Platform.OS === 'ios'?{marginBottom:130}:'',
                          {zIndex:888}
                        ]}>
                        <Text style={styles.label}>主要採光面
                        <Text style={styles.inlabel}>　※複数選択可</Text></Text>
                        <DropDownPicker
                          placeholder="------------"
                          multiple={true}
                          style={styles.inputInner}
                          open={open_direction}
                          value={value_direction}
                          items={direction}
                          setOpen={setOpen_Direction}
                          setValue={setValue_Direction}
                          setItems={setDirection}
                          listMode={"SCROLLVIEW"}
                          translation={{ SELECTED_ITEMS_COUNT_TEXT:"{count}"}}
                          dropDownContainerStyle={[Platform.OS === 'android'&&{
                            position: 'relative',
                            top: 0,
                          },{height:120,zIndex:888}]}
                        />
                      </View>
                    </View>
                  </View>)
                ]}
                renderItem={({ item }) => (
                  <>{item}</>
                )}
              />
              <CheckBox
                center
                title='条件を保存する'
                checked={save}
                onPress={() => setSave(!save)}
              />
              <View style={{flexDirection: 'row',alignSelf: 'center'}}>
                <TouchableOpacity onPress={onDelete} style={[styles.draft,{marginTop:0}]}>
                  <Text>リセット</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onSubmit} style={[styles.submit,{marginTop:0}]}>
                  <Text style={styles.submitText}>検　索</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
        {ListData&&ListData.length>0?(
          <FlatList 
            horizontal
            data={flg=="property"?(search_results?search_results:property):inquiry}
            renderItem={({ item }) =>
              (
                <TouchableOpacity
                  activeOpacity={1}
                  style={styles.property}
                >
                  <View style={styles.propertyInner}>
                    <Text style={styles.propertyTitle}>{item.article_name}{"\n"}
                    <Text style={{fontSize:12}}>{item.floor}階</Text></Text>
                    <View style={styles.propertyInfo}>
                      <Text>沿線：</Text><Text>{item.line_name1}</Text>
                    </View>
                    <View style={styles.propertyInfo}>
                      <Text>駅名：</Text><Text>{item.station_name1}駅</Text>
                    </View>
                    <View style={styles.propertyInfo}>
                      <Image
                        style={styles.propertyPhoto}
                        source={{
                          uri: item.img_gaikan,
                        }}
                      />
                      <View>
                        <Text><Text style={{color:'red'}}>{item.rent/10000}</Text>万({item.general}円)</Text>
                        <Text>徒歩{item.station_time1}分</Text>
                        <Text>{item.layout}/{item.category}</Text>
                        <Text>{item.exclusive}㎡</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.propertyInner}
                      onPress={() => proInsert(item)}
                    >
                      <Image source={require('../../assets/btn_app.png')} />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )
            }
            keyExtractor={(item) => `${item.article_id}`}
          />
        ):(
          <View style={{height:150,justifyContent:'center',alignItems:'center'}}>
            <Text>表示できる物件がありません</Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

export function MyModal4(props){
  
  const { isVisible,onSwipeComplete,onPress,fixed,comment,msgtext,subject,hensu,mail_format,editorRef,flg,inputCursorPosition } = props;
  
  const [category, setCategory] = useState([]);

  useEffect(() => {

    // カテゴリーの重複を検出したものを重複しないでリスト
    var cate = [];
    if (flg == "fixed") {
      cate = fixed.map((c) => c.category);
    } else {
      cate = comment.map((c) => c.category);
    }

    setCategory(Array.from(new Set(cate)));

  }, [fixed,comment,flg]);

  // カテゴリ内をリスト化
  function list(category) {
    
    var l = [];
    if (flg == "fixed") {
      l = fixed.map((f) => {
        if (category == f.category) {
          return (
            <TouchableOpacity onPress={() => tmp_send(f)} key={f.fixed_id}>
              <Text style={styles.CollapseBodyText}>　⇒ {f.title}</Text>
            </TouchableOpacity>
          )
        }
      })
    } else {
      l = comment.map((f) => {
        if (category == f.category) {
          return (
            <TouchableOpacity onPress={() => tmp_send(f)} key={f.comment_id}>
              <Text style={styles.CollapseBodyText}>　⇒ {f.title}</Text>
            </TouchableOpacity>
          )
        }
      })
    }
    
    return l;
  }
  
  // HTML形式に変換
  function convertToHTML(text) {
    let urlPattern = /(^|\s|<.+?>)(https?:\/\/[^\s<>]+)($|\s|<.+?>)/g;
    let extractedText;

    if (/(<\/?[^>]+(>|$)|&nbsp;)/gi.test(text)) {
      // 既にHTMLソースの場合
      extractedText = text.split('”').join('"');
    } else {
      // 普通の文字列の場合
      extractedText = text.replace(/\n/g, '<br />\n');
    }

    extractedText = extractedText.replace(urlPattern, function(match, p1, p2, p3) {
      if (p1.startsWith("<a") || p1.startsWith("<img") || p1.startsWith("<area")) {
        // URLの文字列がa,img,areaのどれかのタグで挟まれていたら、そのままのソースを返す
        return match;
      } else {
        // URLの文字列がその他のHTMLタグかスペースに挟まれていたら、aタグで挟む
        return p1 + "<a href='" + p2 + "'>" + p2 + "</a>" + p3;
      }
    });

    return extractedText;
  }
  
  // 書き換え
  function tmp_send(data){
    
    let date = '';
    if (hensu[10]) {
      let month = new Date(hensu[10].substr(0,10)).getMonth()+1;
      let day   = new Date(hensu[10].substr(0,10)).getDate();
      date  = month+'月'+day+'日';
    }

    let title = "";

    if (flg == "fixed") {
      
      title = data.mail_title;
      
      title = title.split("%お客様名%");
      title = title.join(hensu[0]);
      title = title.split("%会社名%");
      title = title.join(hensu[1]);
      title = title.split("%店舗名%");
      title = title.join(hensu[2]);
      title = title.split("%担当名%");
      title = title.join(hensu[3]);
      title = title.split("%入力者名%");
      title = title.join(hensu[4]);
      title = title.split("%お問い合わせ媒体%");
      title = title.join(hensu[5]);
      
      title = title.split("%お問い合わせ物件%");
      if (hensu[6]) {
        let bukken = '';
        for (let i = 0; i < hensu[6].length; i++) {
          bukken += hensu[6][i];
          bukken += '\n';
        }
        title = title.join(bukken);
      }else{
        title = title.join('');
      }
      
      title = title.split("%電話番号%");
      title = title.join(hensu[7]);
      title = title.split("%FAX番号%");
      title = title.join(hensu[8]);
      title = title.split("%物件名%");
      title = title.join(hensu[9]);
      title = title.split("%問合わせ日付%");

      title = title.join(date);
      
      title = title.split("%お問い合わせ物件（携帯）%");
      if (hensu[6]) {
        let bukken = '';
        for (let i = 0; i < hensu[6].length; i++) {
          bukken += hensu[6][i];
          bukken += '\n';
        }
        title = title.join(bukken);
      }else{
        title = title.join('');
      }
      
      title = title.split("%自動追客物件%");
      title = title.join('');
      title = title.split("%LINE友達追加%");
      title = title.join('');

    }

    let note = data.note;
    
    note = note.split("%お客様名%");
    note = note.join(hensu[0]);
    note = note.split("%会社名%");
    note = note.join(hensu[1]);
    note = note.split("%店舗名%");
    note = note.join(hensu[2]);
    note = note.split("%担当名%");
    note = note.join(hensu[3]);
    note = note.split("%入力者名%");
    note = note.join(hensu[4]);
    note = note.split("%お問い合わせ媒体%");
    note = note.join(hensu[5]);
    note = note.split("%お問い合わせ物件%");
    if (hensu[6]) {
      let bukken = '';
      for (let i = 0; i < hensu[6].length; i++) {
        bukken += hensu[6][i];
        bukken += '\n';
      }
      note = note.join(bukken);
    }else{
      note = note.join('');
    }
    
    note = note.split("%電話番号%");
    note = note.join(hensu[7]);
    note = note.split("%FAX番号%");
    note = note.join(hensu[8]);
    note = note.split("%物件名%");
    note = note.join(hensu[9]);
    note = note.split("%問合わせ日付%");
    note = note.join(date);
    
    note = note.split("%お問い合わせ物件（携帯）%");
    if (hensu[6]) {
      let bukken = '';
      for (let i = 0; i < hensu[6].length; i++) {
        bukken += hensu[6][i];
        bukken += '\n';
      }
      note = note.join(bukken);
    }else{
      note = note.join('');
    }
    
    note = note.split("%自動追客物件%");
    note = note.join('');
    note = note.split("%LINE友達追加%");
    note = note.join('');

    if (mail_format == '1') {
      note = convertToHTML(note);
    }

    if (flg == "fixed") {
      if(msgtext || subject || props.setNote || props.setMail_subject) {
        Alert.alert(
          "入力されている【件名】と【本文】が削除されますがよろしいですか？",
          "",
          [
            {
              text: "はい",
              onPress: () => {
                if(props.setMsgtext && props.setSubject) {
                  props.setMsgtext(note);
                  props.setSubject(title);
                } else if (props.setNote && props.setMail_subject) {
                  props.setNote(note);
                  props.setMail_subject(title);
                  if (mail_format == '1') {
                    editorRef.current.setContentHTML(note);
                  }
                }
                
                if (props.setModal4) {
                  props.setModal4(false);
                }
              }
            },
            {
              text: "いいえ",
            },
          ]
        );
      } else {
        if(props.setMsgtext && props.setSubject) {
          props.setMsgtext(note);
          props.setSubject(title);
        } else if (props.setNote && props.setMail_subject) {
          props.setNote(note);
          props.setMail_subject(title);
        }
        
        if (props.setModal4) {
          props.setModal4(false);
        }
      }
    } else {

      let proMsg;

      if (mail_format == '1') {
        // HTMLエディタのカーソル位置に挿入        
        if (inputCursorPosition != null) {
          var index = msgtext.indexOf(inputCursorPosition);
          if (index != -1) {
            note = '\n' + '<div>' + note + '</div>';
            proMsg = msgtext.slice(0, index + inputCursorPosition.length) + note + msgtext.slice(index + inputCursorPosition.length);
          } else {
            proMsg = msgtext + note;
          }
        } else {
          proMsg = note + msgtext;
        }
      } else if (mail_format == '0') {
        // TextInputのカーソル位置に挿入
        if (inputCursorPosition != null) {
          proMsg = msgtext.slice(0, inputCursorPosition.start) + note + msgtext.slice(inputCursorPosition.end);
        } else {
          proMsg = msgtext + note;
        }
      } else {
        // トーク画面
        proMsg = msgtext + note;
      }

      if(props.setMsgtext && props.setSubject) {
        props.setMsgtext(proMsg);
      } else if (props.setNote && props.setMail_subject) {
        props.setNote(proMsg);
        if (mail_format == '1') {
          editorRef.current.setContentHTML(proMsg);
        }
      }

      if (props.setModal4) {
        props.setModal4(false);
      }
    }
    
  }

  const title_tmp = flg == "fixed" ? "定型文": "一言コメント";
  
  return (
    <Modal
      isVisible={isVisible}
      swipeDirection={['up']}
      onSwipeComplete={onSwipeComplete}
      backdropOpacity={0.5}
      animationInTiming={300}
      animationOutTiming={500}
      animationIn={'slideInDown'}
      animationOut={'slideOutUp'}
      propagateSwipe={true}
      onBackdropPress={onPress}
    >
      <View style={[{height:300},styles.template]}>
        <TouchableOpacity
          style={styles.close}
          onPress={onPress}
        >
          <Feather name='x-circle' color='gray' size={35} />
        </TouchableOpacity>
        <Text style={styles.templateText}>
          {title_tmp}をクリックすると送信内容に反映されます。{"\n"}
          {flg == "fixed"&&'先にテキストを入力している状態で、定型文を選択すると内容が上書きされます。\nご注意ください。'}
        </Text>
          <FlatList 
            data={category}
            renderItem={({ item }) =>
              (
                <Collapse>
                  <CollapseHeader>
                    <View>
                      <Text style={styles.CollapseHeader}>〇 {item}</Text>
                    </View>
                  </CollapseHeader>
                  <CollapseBody>
                    <View>
                      {list(item)}
                    </View>
                  </CollapseBody>
                </Collapse>
              )
            }
          />
      </View>
    </Modal>
  );
}

export function MyModal5(props){
  
  const { isVisible,route,cus,navigation,options,tantou,property,station_list,address,c_d } = props;
  
  const [isLoading, setLoading] = useState(false);

  const [pattern,setPattern] = useState('');
  const [text,setText] = useState('');
  
  const [close,setClose] = useState(false);
  const [open, setOpen] = useState(false);
  const [staff_value, setStaff_Value] = useState(null);
  const [staffs, setStaffs] = useState([]);
  const items = staffs.map((item) => {
    return ({
      label: item.name_1+'　'+(item.name_2?item.name_2:''),
      value: item.account,
      key: item.account
    });
  });
  
  const [name,setName] = useState('');
  const [tel,setTel] = useState('');
  const [suumo,setSuumo] = useState(false);
  const [title,setTitle] = useState('');
  const [note,setNote] = useState('');
  
  const [contact_tel,setContact_tel] = useState(false);
  const [free_radio,setFree_radio] = useState(false);
  const [free_text,setFree_Text] = useState('');
  
  const [condition, setCondition] = useState(false);
  
  // 希望条件
  const [follow_item_num, setFollow_item_num] = useState(null);
  const [follow_item1, setFollow_item1] = useState(null);
  const [follow_item2, setFollow_item2] = useState(null);
  const [follow_item3, setFollow_item3] = useState(null);
  const [follow_item4, setFollow_item4] = useState(null);
  
  const [check_modal,setCheck_modal] = useState(false);
  const [check_text,setCheck_text] = useState('');

  const openCondition = (num) => {
    setCondition(!condition);
    setFollow_item_num(num);
  };
  
  useEffect(() => {
    
    var sql = `select * from staff_list where (account != 'all');`;
    db_select(sql).then(function(staff){
      if (staff != false) {
        setStaffs(staff);
      
        staff.map((s) => {
          if (route.params.account == s.account) {
            setStaff_Value(s.account);
          }
        })
      }
    })

    setClose(isVisible);
    
    if(options && tantou) {
      if (options.includes('11')) {
        if (cus.main.mail1 || cus.main.mail2 || cus.main.mail3) {
          
          if (cus.reverberation.article_id || cus.reverberation.private_id) {
            
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
                  act:'tsuikyaku_check',
                  article_id:cus.reverberation.article_id,
                  private_id:cus.reverberation.private_id,
                })
              })
                .then((response) => response.json())
                .then((json) => {
                  if(!json) {
                    setText('こちらの反響は、問い合わせ物件の情報がTCにないため自動追客できません\n手動対応お願い致します');
                    setPattern(2);
                  } else {
                    setText('自動追客の入力を行ってください');
                    setPattern(1);
                  }
                })
                .catch((error) => {
                  console.log('追客用物件取得失敗');
                })
                
          } else {
            setText('こちらの反響は、問い合わせ物件の情報がTCにないため自動追客できません\n手動対応お願い致します');
            setPattern(2);
          }
          
        } else {
          setText('この反響はメールアドレスがないため\n自動追客は設定できません\n手動対応お願い致します');
          setPattern(2);
        }
      } else {
        setText(`${tantou}`+'担当者が割り振られていません\n担当者を選択してください');
        setPattern(2);
      }
    }  else {
      setText(`${tantou}`+'担当者が割り振られていません\n担当者を選択してください');
      setPattern(2);
    }
    
    if (cus) {
      
      setName(cus.main.name);
      
      if (cus.reverberation.media == 'SUUMO' && !cus.main.tel1 && !cus.main.tel2 && (cus.main.tel3).substring(0,3) == '050') {
        setTel(cus.main.tel3);
        setSuumo(true);
      } else {
        setTel(cus.main.tel1);
      }
      setTitle(cus.beginning_communication.title);
      setNote(cus.beginning_communication.note);
      
    }
    
  }, [isVisible,cus,options])
  
  useEffect(() => {
    
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
        shop_id:route.params.shop_id,
        act:'article_search_senpuki',
        customer_id:route.customer,
      })
    })
      .then((response) => response.json())
      .then((json) => {
        if(json.follow_data_all) {
          
          const f_d = Object.entries(json.follow_data_all).map(([key, value]) => ({key, value}));
          
          f_d.map((fd) => {
            
            if (fd.key == 1) {
              setFollow_item1(fd.value);
            } else if (fd.key == 2) {
              setFollow_item2(fd.value);
            } else if (fd.key == 3) {
              setFollow_item3(fd.value);
            } else if (fd.key == 4) {
              setFollow_item4(fd.value);
            }
            
          })
        }
      })
      .catch((error) => {
        const errorMsg = "失敗aaa";
        Alert.alert(errorMsg);
      })
    
  },[])
  
  function setView(cus,pattern) {
    
    if (pattern == 1) {
      
      const tel_data = [
        {
          label:'TEL電話なし',
          value:'TEL電話なし'
        },
        {
          label:'応答なし',
          value:'応答なし'
        },
        {
          label:'電話で会話した',
          value:'電話で会話した'
        },
      ]
      
      const data = [
        {
          label:'有り',
          value:'有り'
        },
        {
          label:'無し',
          value:'無し'
        },
      ]
      
      return (
        <>
        <ScrollView style={{height:280}}>
          <Text style={styles.cus_label}>【氏名】</Text>
          <Text style={styles.cus_contents}>
            {name}
          </Text>
          <Text style={styles.cus_label}>【TEL】</Text>
          <TouchableOpacity
            onPress={() => {
              const phoneNumber = `tel:${tel}`;
              Linking.openURL(phoneNumber);
            }}
            disabled={tel==""?true:false}
          >
            <Text style={[styles.cus_contents,{color:"blue",textDecorationLine: 'underline'}]}>
              {tel}
            </Text>
          </TouchableOpacity>
          <Text style={suumo?[styles.cus_contents,{color:'red'}]:{display:'none'}}>
            ※こちらは有効期限付きの番号です。{"\n"}お客様の電話番号のご確認をお願いします
          </Text>
          <Text style={styles.cus_label}>【件名】</Text>
          <Text style={styles.cus_contents}>
            {title}
          </Text>
          <Text style={styles.cus_label}>【本文】</Text>
          <Text style={styles.cus_contents}>
            {note}
          </Text>
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.cus_label}>【電話連絡】</Text>
            <Text style={[styles.cus_label,{color:'red'}]}>※必須</Text>
          </View>
          <RadioButtonRN
            data={tel_data}
            value={contact_tel}
            selectedBtn={(e) => {
              setContact_tel(e.value);
            }}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={0}
            style={{marginBottom:10}}
            box={false}
            circleSize={16}
          />
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.cus_label}>【フリー入力の有無】</Text>
            <Text style={contact_tel=='TEL電話なし'||contact_tel=='応答なし'?[styles.cus_label,{color:'red'}]:{display:'none'}}>※必須</Text>
          </View>
          <View pointerEvents={contact_tel=='TEL電話なし'||contact_tel=='応答なし' ? 'auto' : 'none'}>
            <RadioButtonRN
              data={data}
              value={contact_tel}
              selectedBtn={(e) => {
                setFree_radio(e.value);
              }}
              animationTypes={['rotate']}
              activeColor={'#191970'}
              initial={0}
              style={{marginBottom:10}}
              box={false}
              circleSize={16}
            />
          </View>
          <Text style={styles.cus_label}>【フリー入力の内容】</Text>
          <TextInput
            onChangeText={(text) => {setFree_Text(text)}}
            value={free_text}
            style={[styles.textarea,{marginVertical:10}]}
            multiline={true}
            disableFullscreenUI={true}
            numberOfLines={11}
            editable={contact_tel!='電話で会話した' && free_radio != '無し'?true:false}
          />
          <Text style={styles.cus_label}>【希望条件の登録】</Text>
          <View style={styles.follow_item}>
            <Text style={[styles.cus_label,{marginHorizontal:20}]}>希望条件1</Text>
            <TouchableOpacity onPress={() => {openCondition(1)}} style={styles.follow_item_btn}>
              <Text>設定</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {follow_check(follow_item1)}}
              style={follow_item1?styles.follow_item_btn:{display:'none'}}
            >
              <Text>確認</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.follow_item}>
            <Text style={[styles.cus_label,{marginHorizontal:20}]}>希望条件2</Text>
            <TouchableOpacity onPress={() => {openCondition(2)}} style={styles.follow_item_btn}>
              <Text>設定</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {follow_check(follow_item2)}}
              style={follow_item2?styles.follow_item_btn:{display:'none'}}
            >
              <Text>確認</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.follow_item}>
            <Text style={[styles.cus_label,{marginHorizontal:20}]}>希望条件3</Text>
            <TouchableOpacity
              onPress={() => {openCondition(3)}}
              style={styles.follow_item_btn}
            >
              <Text>設定</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {follow_check(follow_item3)}}
              style={follow_item3?styles.follow_item_btn:{display:'none'}}
            >
              <Text>確認</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.follow_item}>
            <Text style={[styles.cus_label,{marginHorizontal:20}]}>希望条件4</Text>
            <TouchableOpacity onPress={() => {openCondition(4)}} style={styles.follow_item_btn}>
              <Text>設定</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {follow_check(follow_item4)}}
              style={follow_item4?styles.follow_item_btn:{display:'none'}}
            >
              <Text>確認</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </>
      )
    } else if (pattern == 2) {
      return (
        <ScrollView style={{height:230}}>
          <Text style={styles.cus_label}>【氏名】</Text>
          <Text style={styles.cus_contents}>
            {name}
          </Text>
          <Text style={styles.cus_label}>【TEL】</Text>
          <TouchableOpacity
            onPress={() => {
              const phoneNumber = `tel:${tel}`;
              Linking.openURL(phoneNumber);
            }}
            disabled={tel==""?true:false}
          >
            <Text style={[styles.cus_contents,{color:"blue",textDecorationLine: 'underline'}]}>
              {tel}
            </Text>
          </TouchableOpacity>
          <Text style={suumo?[styles.cus_contents,{color:'red'}]:{display:'none'}}>
            ※こちらは有効期限付きの番号です。{"\n"}お客様の電話番号のご確認をお願いします
          </Text>
          <Text style={styles.cus_label}>【件名】</Text>
          <Text style={styles.cus_contents}>
            {title}
          </Text>
          <Text style={styles.cus_label}>【本文】</Text>
          <Text style={styles.cus_contents}>
            {note}
          </Text>
        </ScrollView>
      )
    }
  }
  
  
  function onSubmit(){

    setLoading(true);

    var err = '';
    
    if (options.includes('11') && pattern == 1) {
      
      if (!contact_tel) {
        err += '【電話連絡】を選んでください\n';
      }
      
      if (contact_tel != '電話で会話した') {
        
        if (!free_radio){
          err += '【フリー入力の有無】を選んでください。\n';
        }
        
        if (!follow_item1 || !follow_item2 || !follow_item3 || !follow_item4) {
          err += '希望条件１から４をすべて設定してください\n';
        }
        
      }
      
      if (err) {
        Alert.alert('下記エラーが出ています',err);
        setLoading(false);
        return;
      }
    
    }
    
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
        shop_id:route.params.shop_id,
        act:'linker',
        customer_id:route.customer,
        tantou:tantou,
        user_id:staff_value,
      })
    })
      .then((response) => response.json())
      .then((json) => {
        
        if (contact_tel && contact_tel != '電話で会話した') {
          
          let formData = new FormData();

          formData.append('app_flg',1);
          formData.append('customer_id',route.customer);
          formData.append('shop_id',route.params.shop_id);
          formData.append('control','senpuki_transfer_mail');
          
          formData.append('senpuki[contact_tel]',contact_tel);
          formData.append('senpuki[query]',free_radio);
          formData.append('senpuki[reply]',free_text);
          
          fetch(domain+'php/ajax/top.php?',
          {
            method: 'POST',
            body: formData,
            header: {
              'content-type': 'multipart/form-data',
            },
          })
          .then((response) => response.json())
          .then((json) => {
            if (json) {
              console.log('追客登録成功')
            }
            Alert.alert('設定しました');
            setClose(false);
            setLoading(false);
            navigation.reset({
              index: 0,
              routes: [{
                name: 'CommunicationHistory' ,
                params: route.params,
                websocket:route.websocket,
                websocket2:route.websocket2,
                profile: route.profile,
                reload: 1
              }],
            });
          })
          .catch((error) => {
            console.log(error)
            Alert.alert('設定に失敗しました{"\n"}PCから設定してください');
            setClose(false);
            setLoading(false);
            navigation.reset({
              index: 0,
              routes: [{
                name: 'CommunicationHistory' ,
                params: route.params,
                websocket:route.websocket,
                websocket2:route.websocket2,
                profile: route.profile,
                reload: 1
              }],
            });
          })
          
        } else {
          Alert.alert('設定しました');
          setClose(false);
          setLoading(false);
          navigation.reset({
            index: 0,
            routes: [{
              name: 'CommunicationHistory' ,
              params: route.params,
              websocket:route.websocket,
              websocket2:route.websocket2,
              profile: route.profile,
              reload: 1
            }],
          });
        }

      })
      .catch((error) => {
        setClose(false);
        setLoading(false);
        Alert.alert('設定に失敗しました{"\n"}PCから設定してください');
        
        navigation.reset({
          index: 0,
          routes: [{
            name: 'CommunicationHistory' ,
            params: route.params,
            websocket:route.websocket,
            websocket2:route.websocket2,
            profile: route.profile,
            reload: 1
          }],
        });
      })
    
  }
  
  function follow_check(item) {
    
    var text = '';
    if (item.rent_from && item.rent_from != 0 && item.rent_to && item.rent_to != 0) {
      text += '【賃料】'+item.rent_from+'円　～　'+item.rent_to+'円\n';
    } else if (item.rent_from && item.rent_from != 0) {
      text += '【賃料】'+item.rent_from+'円　～\n';
    } else if (item.rent_to && item.rent_to != 0) {
      text += '【賃料】～　'+item.rent_to+'円\n';
    }
    if (item.general) {
      text += '管理費込み\n';
    }
    if (item.deposit) {
      text += '敷金・礼金無し\n';
    }
    if (item.layout) {
      text += '【間取り】'+`${item.layout}`+'\n';
    }
    if (item.station) {
      text += '【沿線・駅名】'+`${item.station}`+'\n';
    }
    if (item.station_time) {
      if (item.station_time == 0) {
        text += '【徒歩分数】こだわらない\n';
      } else {
        text += '【徒歩分数】'+item.station_time+'分以内\n';
      }
    }
    if (item.area) {
      text += '【エリア名】'+`${item.area}`+'\n';
    }
    
    if (item.exclusive_from && item.exclusive_from != 0 && item.exclusive_to && item.exclusive_to != 0) {
      text += '【面積】'+item.exclusive_from+'㎡　～　'+item.exclusive_to+'㎡\n';
    } else if (item.exclusive_from && item.exclusive_from != 0) {
      text += '【面積】'+item.exclusive_from+'㎡　～\n';
    } else if (item.exclusive_to && item.exclusive_to != 0) {
      text += '【面積】～'+item.exclusive_to+'㎡\n';
    }
    
    if (item.category) {
      text += '【物件種別】'+`${item.category}`+'\n';
    }
    if (item.constructure) {
      text += '【建物構造】'+`${item.constructure}`+'\n';
    }
    if (item.built) {
      if (item.built == 1) {
        text += '【築年数】新築\n';
      } else {
        text += '【築年数】～'+item.station_time+'年\n';
      }
    }else{
      text += '【築年数】指定なし\n';
    }
    if (item.setubi) {
      text += '【条件・設備】'+`${item.setubi}`+'\n';
    }
    if (item.pet) {
      text += '【ペット】ペット飼育可\n';
    }
    if (item.order_item) {
      if (item.order_item == 'am.built DESC') {
        text += '【物件の並び順】築年が新しい\n';
      } else if (item.order_item == 'am.rent ASC') {
        text += '【物件の並び順】家賃が安い\n';
      } else if (item.order_item == 'am.rent DESC') {
        text += '【物件の並び順】家賃が高い\n';
      } else if (item.order_item == 'am.exclusive DESC') {
        text += '【物件の並び順】広い\n';
      } else if (item.order_item == 'am.dsp_date DESC') {
        text += '【物件の並び順】新着順\n';
      }
    }
    
    setCheck_text(text);
    setCheck_modal(true);
  }
  
  
  return (
    <Modal
      isVisible={close}
      backdropOpacity={0.5}
      animationInTiming={300}
      animationOutTiming={500}
      animationIn={'slideInDown'}
      animationOut={'slideOutUp'}
    >
      <Loading isLoading={isLoading} />
      <MyModal5_condition 
        isVisible={condition}
        onSwipeComplete={() => { setCondition(false) }}
        onClose={() => { setCondition(false) }}
        route={route}
        station_list={station_list}
        address={address}
        
        follow_item_num={follow_item_num}
        follow_item1={follow_item1}
        setFollow_item1={setFollow_item1}
        follow_item2={follow_item2}
        setFollow_item2={setFollow_item2}
        follow_item3={follow_item3}
        setFollow_item3={setFollow_item3}
        follow_item4={follow_item4}
        setFollow_item4={setFollow_item4}
      />
      
      <Modal
        isVisible={check_modal}
        backdropOpacity={0.5}
        animationInTiming={300}
        animationOutTiming={500}
        animationIn={'slideInDown'}
        animationOut={'slideOutUp'}
      >
        <View style={[{height:300},styles.template]}>
          <TouchableOpacity
            style={styles.close}
            onPress={() => {setCheck_modal(false)}}
          >
            <Feather name='x-circle' color='gray' size={35} />
          </TouchableOpacity>
          <Text style={{marginTop:20}}>{check_text}</Text>
        </View>
      </Modal>
      
      <View style={[{height:530},styles.template]}>
        <TouchableOpacity
          style={styles.close}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{
                name: 'CommunicationHistory' ,
                params: route.params,
                websocket:route.websocket,
                websocket2:route.websocket2,
                profile: route.profile,
              }],
            });
          }}
        >
          <Feather name='x-circle' color='gray' size={35} />
        </TouchableOpacity>
        <Text style={styles.templateText}>{text}</Text>
        <Text style={[styles.cus_label,{marginTop:20}]}>【担当者】</Text>
        <View style={{zIndex:999}}>
          <DropDownPicker
            style={[styles.inputInner,{marginTop:5}]}
            containerStyle={{width:'100%'}}
            open={open}
            value={staff_value}
            items={items}
            setOpen={setOpen}
            setValue={setStaff_Value}
            placeholder = "▼　担当者"
            listMode={"SCROLLVIEW"}
            dropDownContainerStyle={[Platform.OS === 'android'&&{
              position: 'relative',
              top: 0,
            },{height:150}]}
          />
        </View>
        <View style={{marginTop:10}}>
          {setView(cus,pattern)}
        </View>
        <View style={styles.overlap_btnwrap}>
          <TouchableOpacity onPress={() => setClose(false)} style={styles.draft}>
            <Text>戻る</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSubmit} style={[styles.submit]}>
            <Text style={styles.submitText}>確　定</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function MyModal5_condition(props){
  
  const { isVisible,route,staff,cus,navigation,options,tantou,station_list,address,
          follow_item_num,follow_item1,follow_item2,follow_item3,follow_item4} = props;
  
  const [close,setClose] = useState(false);
  const [s_list,setS_list] = useState(false);
  const [a_list,setA_list] = useState(false);
  
  useEffect(() => {
    
    get_article_cnt();
    
    if (isVisible) {
      setClose(isVisible);
    }
    
    if (station_list) {
      setS_list(station_list);
    }
    
    if (address) {
      setA_list(address);
    }
    
  },[isVisible,station_list,address])
  
  
  const [count,setCount] = useState(false); // 検索件数
  const [a,setA] = useState(false);
  
  const [open_rent_from,setOpen_Rent_from] = useState(false); // 賃料下限
  const [value_rent_from,setValue_Rent_from] = useState(false);
  const [rent_from, setRent_from] = useState([
    {label: '------------', value: '0'},
    {label: '1.0万円', value: '10000'},
    {label: '1.5万円', value: '15000'},
    {label: '2.0万円', value: '20000'},
    {label: '2.5万円', value: '25000'},
    {label: '3.0万円', value: '30000'},
    {label: '3.5万円', value: '35000'},
    {label: '4.0万円', value: '40000'},
    {label: '4.5万円', value: '45000'},
    {label: '5.0万円', value: '50000'},
    {label: '5.5万円', value: '55000'},
    {label: '6.0万円', value: '60000'},
    {label: '6.5万円', value: '65000'},
    {label: '7.0万円', value: '70000'},
    {label: '7.5万円', value: '75000'},
    {label: '8.0万円', value: '80000'},
    {label: '8.5万円', value: '85000'},
    {label: '9.0万円', value: '90000'},
    {label: '9.5万円', value: '95000'},
    {label: '10万円', value: '100000'},
    {label: '11万円', value: '110000'},
    {label: '12万円', value: '120000'},
    {label: '13万円', value: '130000'},
    {label: '14万円', value: '140000'},
    {label: '15万円', value: '150000'},
    {label: '16万円', value: '160000'},
    {label: '17万円', value: '170000'},
    {label: '18万円', value: '180000'},
    {label: '19万円', value: '190000'},
    {label: '20万円', value: '200000'},
    {label: '21万円', value: '210000'},
    {label: '22万円', value: '220000'},
    {label: '23万円', value: '230000'},
    {label: '24万円', value: '240000'},
    {label: '25万円', value: '250000'},
    {label: '26万円', value: '260000'},
    {label: '27万円', value: '270000'},
    {label: '28万円', value: '280000'},
    {label: '29万円', value: '290000'},
    {label: '30万円', value: '300000'},
    {label: '31万円', value: '310000'},
    {label: '32万円', value: '320000'},
    {label: '33万円', value: '330000'},
    {label: '34万円', value: '340000'},
    {label: '35万円', value: '350000'},
    {label: '36万円', value: '360000'},
    {label: '37万円', value: '370000'},
    {label: '38万円', value: '380000'},
    {label: '39万円', value: '390000'},
    {label: '40万円', value: '400000'},
    {label: '50万円', value: '500000'},
    {label: '100万円', value: '1000000'}
  ]);
  
  const [open_rent_to,setOpen_Rent_to] = useState(false); // 賃料上限
  const [value_rent_to,setValue_Rent_to] = useState(false);
  const [rent_to, setRent_to] = useState([
    {label: '------------', value: '0'},
    {label: '1.5万円', value: '15000'},
    {label: '2.0万円', value: '20000'},
    {label: '2.5万円', value: '25000'},
    {label: '3.0万円', value: '30000'},
    {label: '3.5万円', value: '35000'},
    {label: '4.0万円', value: '40000'},
    {label: '4.5万円', value: '45000'},
    {label: '5.0万円', value: '50000'},
    {label: '5.5万円', value: '55000'},
    {label: '6.0万円', value: '60000'},
    {label: '6.5万円', value: '65000'},
    {label: '7.0万円', value: '70000'},
    {label: '7.5万円', value: '75000'},
    {label: '8.0万円', value: '80000'},
    {label: '8.5万円', value: '85000'},
    {label: '9.0万円', value: '90000'},
    {label: '9.5万円', value: '95000'},
    {label: '10万円', value: '100000'},
    {label: '11万円', value: '110000'},
    {label: '12万円', value: '120000'},
    {label: '13万円', value: '130000'},
    {label: '14万円', value: '140000'},
    {label: '15万円', value: '150000'},
    {label: '16万円', value: '160000'},
    {label: '17万円', value: '170000'},
    {label: '18万円', value: '180000'},
    {label: '19万円', value: '190000'},
    {label: '20万円', value: '200000'},
    {label: '21万円', value: '210000'},
    {label: '22万円', value: '220000'},
    {label: '23万円', value: '230000'},
    {label: '24万円', value: '240000'},
    {label: '25万円', value: '250000'},
    {label: '26万円', value: '260000'},
    {label: '27万円', value: '270000'},
    {label: '28万円', value: '280000'},
    {label: '29万円', value: '290000'},
    {label: '30万円', value: '300000'},
    {label: '31万円', value: '310000'},
    {label: '32万円', value: '320000'},
    {label: '33万円', value: '330000'},
    {label: '34万円', value: '340000'},
    {label: '35万円', value: '350000'},
    {label: '36万円', value: '360000'},
    {label: '37万円', value: '370000'},
    {label: '38万円', value: '380000'},
    {label: '39万円', value: '390000'},
    {label: '40万円', value: '400000'},
    {label: '50万円', value: '500000'},
    {label: '100万円', value: '1000000'}
  ]);
  
  const [general, setGeneral] = useState(false);
  const [deposit, setDeposit] = useState(false);
  
  const push_general = () => {
    setGeneral(!general);
    setA('a');
  }

  const push_deposit = () => {
    setDeposit(!deposit);
    setA('a');
  }
  
  const [open_layout, setOpen_layout] = useState(false); // 間取り
  const [value_layout, setValue_layout] = useState(null);
  const [layout, setLayout] = useState([
    {label: '1R', value: '1R'},
    {label: '1K', value: '1K'},
    {label: '1DK', value: '1DK'},
    {label: '1LDK', value: '1LDK'},
    {label: '2K', value: '2K'},
    {label: '2DK', value: '2DK'},
    {label: '2LDK', value: '2LDK'},
    {label: '3K', value: '3K'},
    {label: '3DK', value: '3DK'},
    {label: '3LDK', value: '3LDK'},
    {label: '4K～', value: '4K'}
  ]);
  
  const [stations,setStations] = useState('');
  
  const [filteredStations, setFilteredStations] = useState([]); // 沿線・駅名
  const [selectedStations, setSelectedStations] = useState([]);
  
  const findStation = (query) => {
    if (query) {
      const regex = new RegExp(`${query.trim()}`, 'i');
      if (s_list) {
        setFilteredStations(
          s_list.filter((station) => station.name.search(regex) >= 0)
        );
      }
    } else {
      setFilteredStations([]);
    }
  };
  
  // 選択した駅を削除
  const station_delete = (props) => {
    setSelectedStations(
      selectedStations.filter((v) => {
        return (v.id !== props.id);
      })
    )
    setA('a');
  }
  
  const [open_station_time, setOpen_station_time] = useState(false); // 徒歩分数
  const [value_station_time, setValue_station_time] = useState(null);
  const [station_time, setStation_time] = useState([
    {label: '3分以内', value: '3'},
    {label: '5分以内', value: '5'},
    {label: '10分以内', value: '10'},
    {label: '15分以内', value: '15'},
    {label: '20分以内', value: '20'},
    {label: '30分以内', value: '30'},
    {label: 'こだわらない', value: '0'},
  ]);
  
  const [area,setArea] = useState('');
  
  const [filteredAddress, setFilteredAddress] = useState([]); // エリア
  const [selectedAddress, setSelectedAddress] = useState([]);

  const findAddress = (query) => {
    if (query) {
      const regex = new RegExp(`${query.trim()}`, 'i');
      if(a_list) {
        setFilteredAddress(
          a_list.filter((area) => area.name.search(regex) >= 0)
        );
      }
    } else {
      setFilteredAddress([]);
    }
  };
  
  // 選択したエリアを削除
  const area_delete = (props) => {
    setSelectedAddress(
      selectedAddress.filter((v) => {
        return (v.id !== props.id);
      })
    )
    setA('a');
  }
  
  const [open_exclusive_from, setOpen_Exclusive_from] = useState(false); // 面積下限
  const [value_exclusive_from, setValue_Exclusive_from] = useState(null);
  const [exclusive_from,setExclusive_from] = useState([
    {label: '------------', value: '0'},
    {label: '15㎡未満', value: '15'},
    {label: '20㎡', value: '20'},
    {label: '25㎡', value: '25'},
    {label: '30㎡', value: '30'},
    {label: '35㎡', value: '35'},
    {label: '40㎡', value: '40'},
    {label: '45㎡', value: '45'},
    {label: '50㎡', value: '50'},
    {label: '55㎡', value: '55'},
    {label: '60㎡', value: '60'},
    {label: '65㎡', value: '65'},
    {label: '70㎡', value: '70'},
    {label: '75㎡', value: '75'},
    {label: '80㎡', value: '80'},
    {label: '85㎡', value: '85'},
    {label: '90㎡', value: '90'},
    {label: '95㎡', value: '95'},
    {label: '100㎡以上', value: '100'},
  ]);
  
  const [open_exclusive_to, setOpen_Exclusive_to] = useState(false); // 面積上限
  const [value_exclusive_to, setValue_Exclusive_to] = useState(null);
  const [exclusive_to,setExclusive_to] = useState([
    {label: '------------', value: '0'},
    {label: '15㎡未満', value: '15'},
    {label: '20㎡', value: '20'},
    {label: '25㎡', value: '25'},
    {label: '30㎡', value: '30'},
    {label: '35㎡', value: '35'},
    {label: '40㎡', value: '40'},
    {label: '45㎡', value: '45'},
    {label: '50㎡', value: '50'},
    {label: '55㎡', value: '55'},
    {label: '60㎡', value: '60'},
    {label: '65㎡', value: '65'},
    {label: '70㎡', value: '70'},
    {label: '75㎡', value: '75'},
    {label: '80㎡', value: '80'},
    {label: '85㎡', value: '85'},
    {label: '90㎡', value: '90'},
    {label: '95㎡', value: '95'},
    {label: '100㎡以上', value: '100'},
  ]);
  
  const [open_category, setOpen_Category] = useState(false); // 物件種別
  const [value_category, setValue_Category] = useState(null);
  const [category, setCategory] = useState([
    {label: 'マンション', value: 'マンション'},
    {label: 'ハイツ', value: 'ハイツ'},
    {label: 'アパート', value: 'アパート'},
    {label: '貸家,一戸建て', value: '貸家,一戸建て'}
  ]);
  
  const [open_constructure, setOpen_Constructure] = useState(false); // 建物構造
  const [value_constructure, setValue_Constructure] = useState(null);
  const [constructure, setConstructure] = useState([
    {label: '木造', value: '木造'},
    {label: '鉄骨造', value: '鉄骨造'},
    {label: 'RC(鉄筋コンクリート)', value: 'RC(鉄筋コンクリート)'},
    {label: 'SRC(鉄骨鉄筋コンクリート)', value: 'SRC(鉄骨鉄筋コンクリート)'},
    {label: '軽量鉄骨造', value: '軽量鉄骨造'},
    {label: 'ALC造', value: 'ALC造'},
    {label: 'ブロック造', value: 'ブロック造'},
    {label: 'PC(プレキャストコンクリート)', value: 'PC(プレキャストコンクリート)'},
    {label: 'HPC(鉄骨プレキャストコンクリート)', value: 'HPC(鉄骨プレキャストコンクリート)'},
    {label: '鉄筋ブロック造', value: '鉄筋ブロック造'},
  ]);
  
  const [open_built, setOpen_Built] = useState(false); // 築年数
  const [value_built, setValue_Built] = useState('');
  const [built, setBuilt] = useState([
    {label: '新築', value: '1'},
    {label: '～5年', value: '5'},
    {label: '～10年', value: '10'},
    {label: '～15年', value: '15'},
    {label: '～20年', value: '20'},
    {label: '指定なし', value: ''}
  ]);
  
  const [open_setubi, setOpen_Setubi] = useState(false); // 条件・設備
  const [value_setubi, setValue_Setubi] = useState(null);
  const [setubi, setSetubi] = useState([
    {label: '棟条件設備', value: 'building',},
    {label: 'ペット飼育可（相談含む）', value: 'ペット飼育可', parent: 'building'},
    {label: 'バイク置場', value: 'バイク', parent: 'building'},
    {label: 'ガレージ(近隣含まない)', value: 'ガレージ', parent: 'building'},
    {label: '楽器相談', value: '楽器', parent: 'building'},
    {label: 'エレベータ', value: 'エレベータ', parent: 'building'},
    {label: 'オートロック', value: 'オートロック', parent: 'building'},
    {label: '宅配ボックス', value: '宅配ボックス', parent: 'building'},
    {label: '部屋条件設備', value: 'room',},
    {label: 'コンロ2口以上', value: 'コンロ2口以上', parent: 'room'},
    {label: 'セパレート', value: 'セパレート', parent: 'room'},
    {label: '室内洗濯機', value: '室内洗濯機', parent: 'room'},
    {label: '独立洗面', value: '独立洗面', parent: 'room'},
    {label: 'フローリング', value: 'フローリング', parent: 'room'},
    {label: '追い焚き', value: '追い焚き', parent: 'room'},
    {label: 'システムキッチン', value: 'システムキッチン', parent: 'room'},
    {label: '2階以上', value: '2階以上', parent: 'room'},
    {label: '家具家電付', value: '家具家電付', parent: 'room'},
  ]);
  
  const [open_order_item, setOpen_order_item] = useState(false); // 物件の並び順
  const [value_order_item, setValue_order_item] = useState('am.built DESC');
  const [order_item, setOrder_item] = useState([
    {label: '築年が新しい', value: 'am.built DESC'},
    {label: '家賃が安い', value: 'am.rent ASC'},
    {label: '家賃が高い', value: 'am.rent DESC'},
    {label: '広い', value: 'am.exclusive DESC'},
    {label: '新着順', value: 'am.dsp_date DESC'},
  ]);
  
  // 希望条件取得
  useEffect(() => {
    
    if (follow_item_num) {
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
          shop_id:route.params.shop_id,
          act:'article_search_senpuki',
          customer_id:route.customer,
          senpuki_select_number:follow_item_num,
        })
      })
        .then((response) => response.json())
        .then((json) => {
          
          //表示に使用するデータを取得（駅）
          if (json.shop_choice.line_list) {
            fetch(domain+'js/data/reins_'+json.shop_choice.shop_id+'.json')
            .then((response) => response.json())
            .then((json) => {
              setS_list(json);
            })
            .catch((error) => {
              console.log('店舗オリジナル物件検索設定取得失敗（駅）');
            })
          }
          
          //表示に使用するデータを取得（エリア）
          if (json.shop_choice.line_list) {
            fetch(domain+'js/data/address_'+json.shop_choice.shop_id+'.json')
            .then((response) => response.json())
            .then((json) => {
              setA_list(json);
            })
            .catch((error) => {
              console.log('店舗オリジナル物件検索設定取得失敗（エリア）');
            })
          }
          
          if(json.station) {
            setStations(json.station);
          }
          
          if(json.area) {
            setArea(json.area);
          }
          
          if(json.follow_data) {
            
            const fd = json.follow_data;
            // console.log(fd)
            setValue_Rent_from(fd.rent_from);
            setValue_Rent_to(fd.rent_to);
            setGeneral(fd.general?true:false);
            setDeposit(fd.deposit?true:false);
            setValue_layout(fd.layout?fd.layout.split(','):null);
            setValue_station_time(fd.station_time);
            setValue_Exclusive_from(fd.exclusive_from);
            setValue_Exclusive_to(fd.exclusive_to);
            setValue_Category(fd.category?fd.category.split(','):null);
            setValue_Constructure(fd.constructure?fd.constructure.split(','):null);
            setValue_Built(fd.built);
            
            var setsubi = '';
            
            if (fd.pet) {
              setsubi += 'ペット飼育可,'+fd.setubi;
            } else {
              setsubi += fd.setubi;
            }
            
            setValue_Setubi(setsubi?setsubi.split(','):null);
            
            setA('a');
            
          }
          
        })
        .catch((error) => {
          const errorMsg = "失敗aaa";
          Alert.alert(errorMsg);
        })
      
    }
    
  },[follow_item_num])
  
  if(stations){
    var get_station = stations.map(value => {
      return {id: value.station_code, name: value.station_name+'('+value.line_name+')'}
    })
  }
  
  if(area){
    var get_area = area.map(value => {
      return {id: value.address_code, name: value.address}
    })
  }
  
  useEffect(() => {
    setSelectedStations(get_station?get_station:[]);
  }, [stations])
  
  useEffect(() => {
    setSelectedAddress(get_area?get_area:[]);
  }, [area])
  
  
  // 希望条件設定時に動的に検索件数取得
  const get_article_cnt = () => {
    
    if (selectedStations.length){
      var station = selectedStations.map(sv => sv.id)
    }
    
    if (selectedAddress.length){
      var areas = selectedAddress.map(sv => sv.id)
    }
    
    let formData = new FormData();
    
    formData.append('ID',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act','senpuki_article_search_cnt');
    formData.append('formdata_flg',1);
    formData.append('val[id]',route.params.account,);
    formData.append('val[pass]',route.params.password,);
    formData.append('val[shop_id]',route.params.shop_id);
    
    formData.append('val[rent_from]',value_rent_from?`${value_rent_from}`:'');
    formData.append('val[rent_to]',value_rent_to?`${value_rent_to}`:'');
    formData.append('val[general]',general?1:'');
    formData.append('val[deposit]',deposit?1:'');
    formData.append('val[layout]',value_layout?`${value_layout}`:'');
    formData.append('val[station]',station?`${station}`:'');
    formData.append('val[station_time]',value_station_time?`${value_station_time}`:'');
    formData.append('val[area]',areas?`${areas}`:'');
    formData.append('val[exclusive_from]',value_exclusive_from?`${value_exclusive_from}`:'');
    formData.append('val[exclusive_to]',value_exclusive_to?`${value_exclusive_to}`:'');
    formData.append('val[category]',value_category?`${value_category}`:'');
    formData.append('val[constructure]',value_constructure?`${value_constructure}`:'');
    formData.append('val[built]',value_built?`${value_built}`:'');
    formData.append('val[setubi]',value_setubi?`${value_setubi}`:'');
    formData.append('val[pet]',value_setubi&&value_setubi.includes('ペット飼育可')?1:'');
    formData.append('val[order_item]',value_order_item?`${value_order_item}`:'');
    
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
      setCount(json.cnt);
      setA(false);
    })
    .catch((error) => {
      console.log(error)
      Alert.alert('失敗');
    })
  }
  
  const onDelete = () => {
    setValue_Rent_from(false);
    setValue_Rent_to(false);
    setGeneral(false);
    setDeposit(false);
    setValue_layout(null);
    setSelectedStations([]);
    setValue_station_time(null);
    setSelectedAddress([]);
    setValue_Exclusive_from(null);
    setValue_Exclusive_to(null);
    setValue_Category(null);
    setValue_Constructure(null);
    setValue_Built(null);
    setValue_Setubi(null);
  }
  
  if (a) {
    get_article_cnt();
  }
  
  function onSubmit() {
    
    if (selectedStations.length){
      var station = selectedStations.map(sv => sv.name)
    }
    
    if (selectedAddress.length){
      var area = selectedAddress.map(sv => sv.name)
    }
    
    const save = {
      rent_from:value_rent_from,
      rent_to:value_rent_to,
      general:general,
      deposit:deposit,
      layout:value_layout?`${value_layout}`:null,
      station:station?`${station}`:null,
      station_time:value_station_time,
      area:area?`${area}`:null,
      exclusive_from:value_exclusive_from,
      exclusive_to:value_exclusive_to,
      category:value_category?`${value_category}`:null,
      constructure:value_constructure?`${value_constructure}`:null,
      built:value_built,
      setubi:value_setubi?`${value_setubi}`:null,
      pet:value_setubi&&value_setubi.includes('ペット飼育可')?1:null,
      order_item:value_order_item,
    }
    
    if (!follow_item1&&!follow_item2&&!follow_item3&&!follow_item4) {
      
      props.setFollow_item1(save);
      props.setFollow_item2(save);
      props.setFollow_item3(save);
      props.setFollow_item4(save);
      
    } else {
      
      if (follow_item_num == 1) {
        props.setFollow_item1(save);
      } else if (follow_item_num == 2) {
        props.setFollow_item2(save);
      } else if (follow_item_num == 3) {
        props.setFollow_item3(save);
      } else if (follow_item_num == 4) {
        props.setFollow_item4(save);
      }
      
    }
    
    // データベース登録
    let formData = new FormData();
    
    if (selectedStations.length){
      var station = selectedStations.map(sv => sv.id)
    }
    
    if (selectedAddress.length){
      var areas = selectedAddress.map(sv => sv.id)
    }
    
    formData.append('app_flg',1);
    formData.append('act','article_search_senpuki');
    formData.append('val[id]',route.customer);
    formData.append('val[shop_id]',route.params.shop_id);
    formData.append('val[save_flg]',1);
    formData.append('val[save_only]',1);
    formData.append('val[conditions_no]',follow_item_num);
    
    formData.append('val[rent_from]',value_rent_from?`${value_rent_from}`:'');
    formData.append('val[rent_to]',value_rent_to?`${value_rent_to}`:'');
    formData.append('val[general]',general?1:'');
    formData.append('val[deposit]',deposit?1:'');
    formData.append('val[layout]',value_layout?`${value_layout}`:'');
    formData.append('val[station]',station?`${station}`:'');
    formData.append('val[station_time]',value_station_time?`${value_station_time}`:'');
    formData.append('val[area]',areas?`${areas}`:'');
    formData.append('val[exclusive_from]',value_exclusive_from?`${value_exclusive_from}`:'');
    formData.append('val[exclusive_to]',value_exclusive_to?`${value_exclusive_to}`:'');
    formData.append('val[category]',value_category?`${value_category}`:'');
    formData.append('val[constructure]',value_constructure?`${value_constructure}`:'');
    formData.append('val[built]',value_built?`${value_built}`:'');
    formData.append('val[setubi]',value_setubi?`${value_setubi}`:'');
    formData.append('val[pet]',value_setubi&&value_setubi.includes('ペット飼育可')?1:'');
    formData.append('val[order_item]',value_order_item?`${value_order_item}`:'');
    
    fetch(domain+'php/ajax/update.php',
    {
      method: 'POST',
      body: formData,
      header: {
        'content-type': 'multipart/form-data',
      },
    })
    .then((response) => response.json())
    .then((json) => {
      if (json) {
        console.log('希望条件登録OK');
      }
    })
    .catch((error) => {
      console.log(error);
      Alert.alert('失敗');
      console.log(error);
    })
    
    setClose(false);
    
  }
  
  return (
    <Modal
      isVisible={close}
      backdropOpacity={0}
      animationInTiming={300}
      animationOutTiming={500}
      animationIn={'slideInDown'}
      animationOut={'slideOutUp'}
    >
      <View style={[{height:650},styles.modalInner]}>
        
        <TouchableOpacity
          style={styles.close}
          onPress={() => {
            setClose(false);
            onDelete();
          }}
        >
          <Feather name='x-circle' color='gray' size={35} />
        </TouchableOpacity>
        <View style={styles.form}>
          <View style={{marginBottom:10}}>
            <Text style={{color:'red',fontSize:18}}>検索件数：{count}件</Text>
          </View>
          <ScrollView 
            style={{height:480,position: 'relative',bottom: 10}}
          >
            <View>
              <Text style={styles.label}>賃料</Text>
              <View style={{flexDirection: 'row',zIndex:1000}}>
                <DropDownPicker
                  placeholder="------------"
                  style={styles.inputInner}
                  containerStyle={{width:'43%'}}
                  open={open_rent_from}
                  value={value_rent_from}
                  items={rent_from}
                  setOpen={setOpen_Rent_from}
                  setValue={setValue_Rent_from}
                  setItems={setRent_from}
                  listMode={"SCROLLVIEW"}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={[Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  },{height:100}]}
                />
                <Text style={{marginTop:15}}>　～　</Text>
                <DropDownPicker
                  placeholder="------------"
                  style={styles.inputInner}
                  containerStyle={{width:'43%'}}
                  open={open_rent_to}
                  value={value_rent_to}
                  items={rent_to}
                  setOpen={setOpen_Rent_to}
                  setValue={setValue_Rent_to}
                  setItems={setRent_to}
                  listMode={"SCROLLVIEW"}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={[Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  },{height:100}]}
                />
              </View>
              <View style={{flexDirection: 'row',marginTop:10}}>
                <View style={{width:'50%'}}>
                  <CheckBox
                    title='管理費込み'
                    checked={general}
                    onPress={push_general}
                    containerStyle={{marginLeft:0}}
                  />
                </View>
                <View style={{width:'50%'}}>
                  <CheckBox
                    title='敷金礼金なし'
                    checked={deposit}
                    onPress={push_deposit}
                    containerStyle={{marginLeft:0}}
                  />
                </View>
              </View>
              <Text style={styles.label}>間取り
              <Text style={styles.inlabel}>　※複数選択可</Text></Text>
              <View style={{zIndex:998}}>
                <DropDownPicker
                  placeholder="------------"
                  multiple={true}
                  open={open_layout}
                  value={value_layout}
                  items={layout}
                  setOpen={setOpen_layout}
                  setValue={setValue_layout}
                  setItems={setLayout}
                  listMode={"SCROLLVIEW"}
                  translation={{ SELECTED_ITEMS_COUNT_TEXT:"{count}"}}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={[Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  },{height:150}]}
                />
              </View>
              <View style={[styles.input,{zIndex:997}]}>
                <Text style={styles.label}>沿線・駅名
                <Text style={styles.inlabel}>　※検索語句を入力してください</Text></Text>
                <Autocomplete
                  data={filteredStations}
                  onChangeText={(text) => findStation(text)}
                  style={styles.inputInner}
                  inputContainerStyle={{borderWidth:0}}
                  flatListProps={{
                    keyExtractor: (item) => `${item.id}`,
                    renderItem: ({ item }) =>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedStations((prevArray) => [...prevArray, item]);
                        setFilteredStations([]);
                        setA('a');
                      }}>
                      <Text style={styles.suggestText}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>,
                  }}
                />
              </View>
              <View style={{flexDirection: 'row'}}>
                <FlatList 
                  data={selectedStations}
                  renderItem={({ item }) =>
                    (
                      <MaterialChip
                        text={item.name}
                        onPress={() => station_delete(item)}
                        rightIcon={
                          <Feather name='x-circle' color='gray' size={18} />
                        }
                      />
                    )
                  }
                  keyExtractor={(item) => `${item.id}`}
                />
              </View>
              <Text style={styles.label}>徒歩分数</Text>
              <View style={{zIndex:998}}>
                <DropDownPicker
                  placeholder="------------"
                  style={styles.inputInner}
                  open={open_station_time}
                  value={value_station_time}
                  items={station_time}
                  setOpen={setOpen_station_time}
                  setValue={setValue_station_time}
                  setItems={setStation_time}
                  listMode={"SCROLLVIEW"}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  }}
                />
              </View>
              <View style={[styles.input,{zIndex:995}]}>
                <Text style={styles.label}>エリア名
                <Text style={styles.inlabel}>　※検索語句を入力してください</Text></Text>
                <Autocomplete
                  data={filteredAddress}
                  onChangeText={(text) => findAddress(text)}
                  style={styles.inputInner}
                  inputContainerStyle={{borderWidth:0}}
                  flatListProps={{
                    keyExtractor: (item) => `${item.id}`,
                    renderItem: ({ item }) =>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedAddress((prevArray) => [...prevArray, item]);
                        setFilteredAddress([]);
                        setA('a');
                      }}>
                      <Text style={styles.suggestText}>
                        {item.name}
                      </Text>
                    </TouchableOpacity>,
                  }}
                />
              </View>
              <View style={{flexDirection: 'row'}}>
                <FlatList 
                  data={selectedAddress}
                  renderItem={({ item }) =>
                    (
                      <MaterialChip
                        text={item.name}
                        onPress={() => area_delete(item)}
                        rightIcon={
                          <Feather name='x-circle' color='gray' size={18} />
                        }
                      />
                    )
                  }
                  keyExtractor={(item) => `${item.id}`}
                />
              </View>
              <Text style={styles.label}>面積</Text>
              <View style={{flexDirection: 'row',zIndex:994}}>
                <DropDownPicker
                  placeholder="------------"
                  style={styles.inputInner}
                  containerStyle={{width:'43%'}}
                  open={open_exclusive_from}
                  value={value_exclusive_from}
                  items={exclusive_from}
                  setOpen={setOpen_Exclusive_from}
                  setValue={setValue_Exclusive_from}
                  setItems={setExclusive_from}
                  listMode={"SCROLLVIEW"}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={[Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  },{height:100}]}
                />
                <Text style={{marginTop:15}}>　～　</Text>
                <DropDownPicker
                  placeholder="------------"
                  style={styles.inputInner}
                  containerStyle={{width:'43%'}}
                  open={open_exclusive_to}
                  value={value_exclusive_to}
                  items={exclusive_to}
                  setOpen={setOpen_Exclusive_to}
                  setValue={setValue_Exclusive_to}
                  setItems={setExclusive_to}
                  listMode={"SCROLLVIEW"}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={[Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  },{height:100}]}
                />
              </View>
              <View style={[styles.input,{zIndex:992}]}>
                <Text style={styles.label}>物件種別
                <Text style={styles.inlabel}>　※複数選択可</Text></Text>
                <DropDownPicker
                  placeholder="------------"
                  multiple={true}
                  style={styles.inputInner}
                  open={open_category}
                  value={value_category}
                  items={category}
                  setOpen={setOpen_Category}
                  setValue={setValue_Category}
                  setItems={setCategory}
                  listMode={"SCROLLVIEW"}
                  translation={{ SELECTED_ITEMS_COUNT_TEXT:"{count}"}}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  }}
                />
              </View>
              <View style={[styles.input,{zIndex:991}]}>
                <Text style={styles.label}>建物構造
                <Text style={styles.inlabel}>　※複数選択可</Text></Text>
                <DropDownPicker
                  placeholder="------------"
                  multiple={true}
                  style={styles.inputInner}
                  open={open_constructure}
                  value={value_constructure}
                  items={constructure}
                  setOpen={setOpen_Constructure}
                  setValue={setValue_Constructure}
                  setItems={setConstructure}
                  listMode={"SCROLLVIEW"}
                  translation={{ SELECTED_ITEMS_COUNT_TEXT:"{count}"}}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  }}
                />
              </View>
              <View
                style={[
                  styles.input,
                  open_built === true && Platform.OS === 'ios'?{marginBottom:120}:'',
                  {zIndex:990}
                ]}>
                <Text style={styles.label}>築年数</Text>
                <DropDownPicker
                  placeholder="------------"
                  style={styles.inputInner}
                  open={open_built}
                  value={value_built}
                  items={built}
                  setOpen={setOpen_Built}
                  setValue={setValue_Built}
                  setItems={setBuilt}
                  listMode={"SCROLLVIEW"}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  }}
                />
              </View>
              <View
                style={[
                  styles.input,
                  open_setubi === true && Platform.OS === 'ios'?{marginBottom:120}:'',
                  {zIndex:889}
                ]}>
                <Text style={styles.label}>条件・設備
                <Text style={styles.inlabel}>　※複数選択可</Text></Text>
                <DropDownPicker
                  placeholder="------------"
                  multiple={true}
                  categorySelectable={false}
                  style={styles.inputInner}
                  open={open_setubi}
                  value={value_setubi}
                  items={setubi}
                  setOpen={setOpen_Setubi}
                  setValue={setValue_Setubi}
                  setItems={setSetubi}
                  listMode={"SCROLLVIEW"}
                  translation={{ SELECTED_ITEMS_COUNT_TEXT:"{count}"}}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  }}
                />
              </View>
              <View
                style={[
                  styles.input,
                  open_order_item === true && Platform.OS === 'ios'?{marginBottom:210}:'',
                  {zIndex:888}
                ]}>
                <Text style={styles.label}>物件の並び順</Text>
                <DropDownPicker
                  style={styles.inputInner}
                  open={open_order_item}
                  value={value_order_item}
                  items={order_item}
                  setOpen={setOpen_order_item}
                  setValue={setValue_order_item}
                  setItems={setOrder_item}
                  listMode={"SCROLLVIEW"}
                  onClose={() => {setA('a')}}
                  dropDownContainerStyle={Platform.OS === 'android'&&{
                    position: 'relative',
                    top: 0,
                  }}
                  dropDownDirection={"BOTTOM"}
                />
              </View>
            </View>
          </ScrollView>
        </View>
        
        <View style={styles.overlap_btnwrap}>
          <TouchableOpacity onPress={onDelete} style={[styles.draft]}>
            <Text>リセット</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSubmit} style={[styles.submit]}>
            <Text style={styles.submitText}>保　存</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
  
}

export function MyModal6(props){
  
  const { isVisible,overlap,route,navigation,cus,options,tantou,station_list,address } = props;
  
  const [close,setClose] = useState(false);
  const [customer, setCustomer] = useState([]);
  const [name,setName] = useState(false);
  const [title,setTitle] = useState(false);
  const [note,setNote] = useState(false);
  
  const [ol, setOL] = useState(false);
  
  const [id,setID] = useState(false);
  const [customer_id,setCustomer_id] = useState(false);
  const [user_id,setUser_id] = useState(false);
  
  const [text,setText] = useState('');
  const [num,setNum] = useState('');
  
  const [open, setOpen] = useState(false);
  const [staffs, setStaffs] = useState([]);
  
  const [modal5, setModal5] = useState(false);
  
  useEffect(() => {
    
    setClose(isVisible);
    
    if (overlap && overlap.list) {

      setOL(overlap);
      
      // スタッフ名
      const s = Object.entries(overlap.staff);
      
      setName(overlap.main.name);    // スタッフ名
      setTitle(overlap.main.title);    // 件名
      setNote(overlap.main.note);    //本文
      
      setCustomer_id(overlap.main.customer_id);
      
      overlap.list.map((val) => {
        setID(val.customer_id);
        setUser_id(val.user_id);
      })
      
      // 重複パターン振り分け
      setNum(overlap.overlap);
      if (overlap.overlap == '1') {    // 重複【既存あり(1件のみ)】
        setText(`${s[0][1].name_1+'　'+s[0][1].name_2}`+'さんが担当している\nお客様：'+`${overlap.list[0].name}`+'さんと連絡先が同一です。\nこのお客様にまとめますか？');
      } else if (overlap.overlap == '2') {    // 重複【既存あり(1件以上)】
        setText('下記お客様たちと同一の連絡先をもっています。\nどれかのお客様にまとめますか？');
      } else if (overlap.overlap == '3') {    // 重複【新規に既存有り】
        setText('下記反響は同じ連絡先を持っています。\n一人のお客様としてまとめますか？');
        
        let id_list = '';
        let id_list_min = '';
        
        overlap.list.map((cus) => {
          
          // customer_id
          if(id_list){
            id_list += ","+cus.customer_id;
          } else {
            id_list = cus.customer_id;
          }
          
          // customer_id古いもの取得処理
          if(!id_list_min){
            // 初回処理
            id_list_min = cus.customer_id;
          } else if (parseInt(id_list_min) >= parseInt(cus.customer_id)){
            // 登録してるものより古かった場合
            id_list_min = cus.customer_id;
          }
        })
        
        setID(id_list_min);
        setCustomer_id(id_list);
        
        const items = s.map((item) => {
          
          if (route.params.account == item[0]) {
            setUser_id(item[0]);
          }
          
          return ({
            label: item[1].name_1+'　'+item[1].name_2,
            value: item[0],
          });
        });
        
        setStaffs(items);
      }
      
    }
    
  }, [overlap,isVisible])
  
  function setView(num,overlap){
    
    if (!overlap.list) {
      return;
    }
    
    if (num == '1') {

      var tel = "";

      if (overlap.main.tel1) {
        tel = overlap.main.tel1;
      } else if (overlap.main.tel2) {
        tel = overlap.main.tel2;
      } else if (overlap.main.tel3) {
        tel = overlap.main.tel1;
      }

      return (
        <ScrollView style={{height:280}}>
          <Text style={styles.cus_label}>【氏名】</Text>
          <Text style={styles.cus_contents}>
            {overlap.main.name}
          </Text>
          <Text style={styles.cus_label}>【TEL】</Text>
          <TouchableOpacity
            onPress={() => {
              const phoneNumber = `tel:${tel}`;
              Linking.openURL(phoneNumber);
            }}
            disabled={tel==""?true:false}
          >
            <Text style={[styles.cus_contents,{color:"blue",textDecorationLine: 'underline'}]}>
              {tel}
            </Text>
          </TouchableOpacity>
          <Text style={styles.cus_label}>【件名】</Text>
          <Text style={styles.cus_contents}>
            {overlap.main.title}
          </Text>
          <Text style={styles.cus_label}>【メール本文】</Text>
          <Text style={styles.cus_contents}>
            {overlap.main.note}
          </Text>
        </ScrollView>
      )
    } else if (num == '2') {
      
      // スタッフ名
      const s = Object.entries(overlap.staff);
      
      const data = overlap.list.map((cus) => {
        
        return ({
          label: '【担当者】'+s[0][1].name_1+'　'+s[0][1].name_2+'\n【お客様名】'+cus.name+'\n【問い合わせ日】'+(cus.inquiry_day?cus.inquiry_day:'')+'\n【来店日】'+(cus.coming_day1?cus.coming_day1:''),
          value: {
            id:cus.customer_id,
            customer_id:customer_id,
            user_id:cus.user_id
          },
        })
      })
      
      return (
        <ScrollView style={{height:280}}>
          <RadioButtonRN
            data={data}
            value={customer_id}
            selectedBtn={(e) => {
              setID(e.value.id);
              setCustomer_id(e.value.customer_id);
              setUser_id(e.value.user_id);
            }}
            animationTypes={['rotate']}
            activeColor={'#191970'}
            initial={1}
          />
        </ScrollView>
      )
      
    } else if (num == '3') {
      
      return (
        <>
        <DropDownPicker
          style={[styles.DropDown,{marginBottom:5}]}
          dropDownContainerStyle={styles.dropDownContainer}
          open={open}
          value={user_id}
          items={staffs}
          setOpen={setOpen}
          setValue={setUser_id}
          placeholder = "▼　担当者"
          zIndex={999}
        />
        <FlatList
          style={{height:240}}
          data={overlap.list}
          renderItem={({ item }) => {
            
            var tel = "";
      
            if (overlap.main.tel1) {
              tel = overlap.main.tel1;
            } else if (overlap.main.tel2) {
              tel = overlap.main.tel2;
            } else if (overlap.main.tel3) {
              tel = overlap.main.tel1;
            }
      
            return (
              <View style={styles.overlap3}>
                <Text>【氏名】
                  {item.name?(item.name.length < 15
                    ?item.name
                    :item.name.substring(0, 15)+'...'
                  ):''}
                </Text>
                <Text>【件名】
                  {item.title?(item.title.length < 15
                    ?item.title
                    :item.title.substring(0, 15)+'...'
                  ):''}
                </Text>
                <Text>【TEL】
                  <TouchableOpacity
                    onPress={() => {
                      const phoneNumber = `tel:${tel}`;
                      Linking.openURL(phoneNumber);
                    }}
                    disabled={tel==""?true:false}
                  >
                    <Text style={{color:"blue",textDecorationLine: 'underline'}}>
                      {tel}
                    </Text>
                  </TouchableOpacity>
                </Text>
                <Text>【メール本文】{"\n"}
                  {item.note?(item.note.length < 40
                    ?item.note
                    :item.note.substring(0, 40)+'...'
                  ):''}
                </Text>
              </View>
            )
          }}
        />
        </>
      )
    }
    
  }
  
  function onSubmit(){
    
    let formData = new FormData();
    formData.append('ID',route.params.account);
    formData.append('pass',route.params.password);
    formData.append('act','register_all');
    formData.append('val[app_flg]',1);
    formData.append('val[id]',id,);
    formData.append('val[customer_id]',customer_id);
    formData.append('val[shop_id]',route.params.shop_id);
    formData.append('val[user_id]',user_id);
    formData.append('val[flg]',1);
    formData.append('val[user_flg]',num=='2'?'':1);
    formData.append('val[not_teply_flg]',1);
    
    fetch(domain+'php/ajax/update.php',
    {
      method: 'POST',
      body: formData,
      header: {
        'content-type': 'multipart/form-data',
      },
    })
    .then((response) => response.json())
    .then((json) => {
      if (json) {
        
        // ローカルDBから削除
        db.transaction((tx) => {
          tx.executeSql(
            `delete from customer_mst where customer_id in ("`+customer_id+`") and customer_id != "`+user_id+`";`,
            [],
            // 成功時のコールバック関数
            (_, { rows }) => {
              console.log("重複削除成功");
            },
            () => {
              // 失敗時のコールバック関数
              console.log("重複削除失敗");
            }
          )
        })
        
        Alert.alert('反響振分しました。');
        setClose(false);
        
        // お客様一覧に戻る
        navigation.reset({
          index: 0,
          routes: [{
            name: 'CommunicationHistory' ,
            params: route.params,
            websocket:route.websocket,
            websocket2:route.websocket2,
            profile: route.profile,
            reload: 1
          }],
        });
      }
    })
    .catch((error) => {
      console.log(error)
      Alert.alert('失敗');
    })
    
  }
  
  const noSubmit = () => {
    setModal5(!modal5);
  }
  
  return (
    <Modal
      isVisible={close}
      backdropOpacity={0.5}
      animationInTiming={300}
      animationOutTiming={500}
      animationIn={'slideInDown'}
      animationOut={'slideOutUp'}
    >
      
      <MyModal5
        isVisible={modal5}
        route={route}
        cus={cus}
        navigation={navigation}
        options={options}
        tantou={tantou}
        station_list={station_list}
        address={address}
      />
      <View style={styles.template}>
        <TouchableOpacity
          style={styles.close}
          onPress={() => {
            navigation.reset({
              index: 0,
              routes: [{
                name: 'CommunicationHistory' ,
                params: route.params,
                websocket:route.websocket,
                websocket2:route.websocket2,
                profile: route.profile,
              }],
            });
          }}
        >
          <Feather name='x-circle' color='gray' size={35} />
        </TouchableOpacity>
        <Text style={styles.templateText}>{text}</Text>
        <View style={{marginTop:10}}>
          {setView(num,ol)}
        </View>
        <View style={styles.overlap_btnwrap}>
          <TouchableOpacity onPress={noSubmit} style={styles.draft}>
            <Text>まとめない</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSubmit} style={styles.submit}>
            <Text style={styles.submitText}>まとめる</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export function MyModal7(props){
  
  const { isVisible, openTextColor, setTextColor, textColor } = props;
  
  return (
    <Modal
      isVisible={isVisible}
      onBackdropPress={openTextColor}
    >
      <View style={styles.modalInner}>
        <TouchableOpacity
          style={{
            position: 'absolute',
            top:8,
            right:10,
            zIndex:1000
          }}
          onPress={openTextColor}
        >
          <Feather name='x-circle' color='gray' size={35} />
        </TouchableOpacity>
        <ColorPicker
          color={textColor}
          onColorChangeComplete={(color) => {setTextColor(color)}}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalInner: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#ffffff",
    width:'100%',
  },
  form: {
    width: "90%",
  },
  input: {
    marginBottom: 5,
    width:'100%',
  },
  label: {
    marginTop: 10,
    marginBottom:5,
    marginLeft:5,
    fontSize:16,
  },
  inlabel: {
    color:'#bbbbbb',
    fontSize:12,
  },
  inputInner: {
    height:45,
    paddingVertical:10,
    paddingHorizontal:5,
    borderColor: '#1f2d53',
    fontSize:16,
    borderWidth: 1.5,
    borderRadius: 8,
  },
  mail_textarea: {
    minHeight: 200,
    height: 'auto',
    paddingVertical:10,
    paddingHorizontal:5,
    borderColor: '#1f2d53',
    fontSize:16,
    borderWidth: 1.5,
    borderRadius: 8,
    textAlignVertical: 'top'
  },
  textarea: {
    height:200,
    paddingVertical:10,
    paddingHorizontal:5,
    borderColor: '#1f2d53',
    fontSize:16,
    borderWidth: 1.5,
    borderRadius: 8,
    textAlignVertical: 'top'
  },
  file:{
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:5,
    borderRadius: 8,
    width:100,
    height:40,
    borderWidth:1,
    borderColor:'#1f2d53',
    marginRight:10,
  },
  font:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  btn:{
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: "space-between",
    marginBottom: 5,
  },
  btnBox: {
    width:35,
    height:35,
    backgroundColor:'#fafafa',
    borderWidth:1,
    borderColor:'#191970',
    borderRadius:8,
    marginHorizontal:3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  close2:{
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor:"#dbdbdb",
    marginTop:15,
    borderRadius: 8,
    width:75,
    height:40,
    marginRight:10,
  },
  draft:{
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop:15,
    borderRadius: 8,
    width:75,
    height:40,
    borderWidth:1,
    borderColor:'#1f2d53',
    marginRight:10,
  },
  submit:{
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop:15,
    borderRadius: 8,
    width:75,
    height:40,
    backgroundColor:'#47a9ce',
  },
  submitText: {
    fontSize:16,
    color:'#ffffff'
  },
  delete:{
    justifyContent: 'center',
    alignItems: 'center',
    marginTop:10,
    borderRadius: 8,
    width:100,
    height:40,
    borderWidth:1,
    borderColor:'#1f2d53',
  },
  deleteText: {
    fontSize:16,
    color:'#1f2d53'
  },
  searchBtn:{
    justifyContent: 'center',
    alignItems: 'center',
    width:180,
    height:30,
    marginVertical:10,
    borderWidth:1,
    borderColor:'#000000',
    borderRadius: 8,
  },
  property: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth:1,
    borderColor:'#000000',
    width:220,
    marginRight:10,
    flex:1
  },
  propertyInner: {
    padding:10,
  },
  propertyTitle: {
    fontSize:16,
    backgroundColor:'#D9EEF4',
    padding:2,
    marginTop:10,
  },
  propertyInfo:{
    flexDirection: 'row',
    marginTop:5,
  },
  propertyPhoto: {
    width:80,
    height:60,
    marginRight:5,
  },
  suggestText: {
    fontSize: 15,
    paddingTop: 5,
    paddingBottom: 5,
    margin: 2,
  },
  template: {
    backgroundColor: "#ffffff",
    width:'100%',
    padding:15,
  },
  templateText: {
    marginRight:35,
  },
  templateList: {
    marginTop:10,
    flex:1,
  },
  CollapseHeader: {
    fontSize:16,
    marginVertical:5,
  },
  CollapseBodyText: {
    fontSize:16,
    marginVertical:3,
    color:'#191970'
  },
  close: {
    position: 'absolute',
    top:0,
    right:0,
    width:50,
    height:50,
    justifyContent:'center',
    alignItems:'center',
    zIndex:1000
  },
  line: {
    backgroundColor: "#ffffff",
    width:'70%',
    height:150,
    padding:15,
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
  styleBox: {
    width:35,
    height:35,
    backgroundColor:'#fafafa',
    borderWidth:1,
    borderColor:'#1f2d53',
    borderRadius:10,
    marginHorizontal:10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize:12,
    fontWeight:'600',
    color:'#1f2d53',
    marginTop:5,
    textAlign:'center',
  },
  sydemenu: {
    position:'absolute',
    zIndex:900,
    width:250,
    top:-10,
    flexDirection: 'row',
    alignSelf:'center',
  },
  menucircle: {
    width:70,
    height:70,
    backgroundColor:'#edf2ff',
    borderWidth:3,
    borderColor:'#1f2d53',
    borderRadius:100,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft:20,
  },
  menucircleText: {
    fontSize:9,
    fontWeight:'800',
    color:'#404040',
    textAlign:'center',
    marginBottom:3
  },
  cus_label: {
    color: '#7d7d7d',
    fontSize:16,
  },
  cus_contents: {
    fontWeight:'500',
    marginVertical:5,
    marginHorizontal:10,
  },
  overlap_btnwrap: {
    flexDirection: 'row',
    alignSelf: 'center',
    marginBottom:20
  },
  overlap3: {
    borderWidth:1,
    borderColor:'#1f2d53',
    borderRadius:10,
    marginVertical:5,
    padding:5,
  },
  follow_item: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical:5
  },
  follow_item_btn: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: 8,
    width:80,
    height:40,
    borderWidth:1,
    borderColor:'#1f2d53',
    marginHorizontal:10
  },
  editor: {
    borderColor: '#1f2d53',
    borderWidth: 1,
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
    marginTop:10,
  },
  iosdate: {
    width:300,
    height:260,
    backgroundColor:'#333',
    alignItems:'center',
    justifyContent:'center',
    borderRadius:5
  },
})