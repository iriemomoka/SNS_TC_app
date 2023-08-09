import React from 'react';
import { StyleSheet, View, ActivityIndicator, Linking } from 'react-native';
import {WebView} from 'react-native-webview';

export default function Video(props) {
  
  const { url } = props;
  Linking.openURL(url);
  return (
    <WebView
     source={{ uri: url }}
     onShouldStartLoadWithRequest={(event)=>{
        console.log(event.url)
        if (event.url.indexOf('https://w3o1gvqpqg.execute-api.ap-northeast-1.amazonaws.com/Prod/') != -1){
          Linking.openURL(event.url);
          return false;
          
        }else {
          return true;
        }
      }}
   />
  );
}
