
import React from 'react';
import LottieView from 'lottie-react-native';

export default function LottieAvatar({ mood }) {
  const animation = mood === 'happy' ? require('../assets/animations/happy.json') : require('../assets/animations/sad.json');
  return <LottieView source={animation} autoPlay loop style={{ width: 150, height: 150 }} />;
}
