import React,{useState,useEffect} from 'react';
import { View, LogBox, Image,ImageBackground,StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, CardStyleInterpolators } from '@react-navigation/stack';
import Feather from 'react-native-vector-icons/Feather';
import { RootSiblingParent } from 'react-native-root-siblings';
import { StatusBar } from 'expo-status-bar';

import LogInScreen from './src/screens/LogInScreen';
import CommunicationHistoryScreen from './src/screens/CommunicationHistoryScreen';
import TalkScreen from './src/screens/TalkScreen';
import Setting from './src/screens/Setting';
import BellScreen from './src/screens/BellScreen';
import Ranking from './src/screens/Ranking';
import Schedule from './src/screens/Schedule';
import Company from './src/screens/Company';
import Staffs from './src/screens/Staffs';
import ChatTalk from './src/screens/ChatTalk';
import ContractRegister from './src/screens/ContractRegister';
import CustomerEdit from './src/screens/CustomerEdit';
import ErcMoveIn from './src/screens/ErcMoveIn';
import TimeLine from './src/screens/TimeLine';
import Post from './src/screens/Post';
import Thanks from './src/screens/Thanks';
import Follow from './src/screens/Follow';
import SurveyList from './src/screens/SurveyList';
import SurveyAnswer from './src/screens/SurveyAnswer';
import ThanksPost from './src/screens/ThanksPost';

import { Context1 } from './src/components/ExportContext';

const Stack = createStackNavigator();
LogBox.ignoreLogs(['Setting a timer']);

export default function App() {

  const [chatbell, setChatbell] = useState(0);

  return (

    <Context1.Provider value={{chatbell, setChatbell}}>
      <RootSiblingParent>
        <StatusBar translucent={true} hidden={false} />
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="LogIn"
            screenOptions={({route: {withAnimation,withAnimation2}}) => ({
              headerTitleAlign: 'left',
              gestureEnabled: true,
              gestureDirection: !withAnimation2?'horizontal':'horizontal-inverted',
              cardStyleInterpolator: !withAnimation
              ? CardStyleInterpolators.forHorizontalIOS
              : CardStyleInterpolators.forNoAnimation,
            })}
          >
            <Stack.Screen
              name="LogIn"
              component={LogInScreen}
            />
            <Stack.Screen
              name="CommunicationHistory"
              component={CommunicationHistoryScreen}
              options={{
                gestureDirection: "horizontal-inverted",
              }}
            />
            <Stack.Screen
              name="Setting"
              component={Setting}
            />
            <Stack.Screen
              name="TalkScreen"
              component={TalkScreen}
            />
            <Stack.Screen
              name="BellScreen"
              component={BellScreen}
            />
            <Stack.Screen
              name="Ranking"
              component={Ranking}
            />
            <Stack.Screen
              name="Schedule"
              component={Schedule}
              options={{
                gestureDirection: "horizontal-inverted",
              }}
            />
            <Stack.Screen
              name="Company"
              component={Company}
              options={{
                gestureDirection: "horizontal-inverted",
              }}
            />
            <Stack.Screen
              name="Staffs"
              component={Staffs}
            />
            <Stack.Screen
              name="ChatTalk"
              component={ChatTalk}
            />
            <Stack.Screen
              name="ContractRegister"
              component={ContractRegister}
            />
            <Stack.Screen
              name="CustomerEdit"
              component={CustomerEdit}
            />
            <Stack.Screen
              name="ErcMoveIn"
              component={ErcMoveIn}
            />
            <Stack.Screen
              name="TimeLine"
              component={TimeLine}
              options={{
                gestureDirection: "horizontal-inverted",
              }}
            />
            <Stack.Screen
              name="Post"
              component={Post}
            />
            <Stack.Screen
              name="Thanks"
              component={Thanks}
            />
            <Stack.Screen
              name="Follow"
              component={Follow}
            />
            <Stack.Screen
              name="SurveyList"
              component={SurveyList}
            />
            <Stack.Screen
              name="SurveyAnswer"
              component={SurveyAnswer}
            />
            <Stack.Screen
              name="ThanksPost"
              component={ThanksPost}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </RootSiblingParent>
    </Context1.Provider>
  );
}

const styles = StyleSheet.create({
  
})