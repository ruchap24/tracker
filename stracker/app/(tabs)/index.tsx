import { View, Text } from 'react-native'
import { StyleSheet } from 'react-native'
import React, { useState, useEffect, useRef} from 'react'
import { Accelerometer } from 'expo-sensors'
import { Constants } from 'expo-constants'
import LottieView from 'lottie-react-native'

const index = () => {
  const [ steps,setSteps]=useState(0);
  const [isCounting, setIsCounting]=useState(false);
  const [lastY, setLastY] =useState(0);
  const [lastTimestamp, setLastTimestamp] =useState(0);

  const animationRefRunning =useRef(null);
  const animationRefSitting =useRef(null);

  useEffect(()=>{
    let subscription;
    Accelerometer.isAvailableAsync().then((result)=>{
      if(result){
        subscription=Accelerometer.addListener((AccelerometerData)=>{
          const{y}=AccelerometerData;
          const threshold =0.1;
          const timestamp = new Date().getTime();


          if(
            Math.abs(y -lastY)> threshold && 
            !isCounting && 
            (timestamp - lastTimestamp>800)  
          )
          {
            setIsCounting(true)
            setLastY(y);
            setLastTimestamp(timestamp);

            setSteps((prevSteps)=> prevSteps + 1);

            setTimeout(()=>{
              setIsCounting(false);
            },1200);
          }
        });
      }
      else{
        console.log("Accelerometer not available on this device");
      }
    });

    return()=>{
      if(subscription){
        subscription.remove();
      }
    };
  },[isCounting, lastY, lastTimestamp])
  return (
    <View>
      <Text>index</Text>
    </View>
  )
}

export default index

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
});
