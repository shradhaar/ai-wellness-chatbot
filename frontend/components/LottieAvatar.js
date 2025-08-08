
import React from 'react';
import { Platform, View, Text } from 'react-native';

export default function LottieAvatar({ mood }) {
  if (Platform.OS === 'web') {
    // Simple emoji fallback for web
    const emoji = mood === 'happy' ? '😊' : '😔';
    return (
      <View style={{
        width: 150,
        height: 150,
        backgroundColor: '#f0f0f0',
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: mood === 'happy' ? '#4CAF50' : '#FF9800'
      }}>
        <Text style={{ fontSize: 60 }}>{emoji}</Text>
      </View>
    );
  }

  // Use Lottie for mobile
  const LottieView = require('lottie-react-native').default;
  const animation = mood === 'happy' ? require('../assets/animations/happy.json') : require('../assets/animations/sad.json');
  return <LottieView source={animation} autoPlay loop style={{ width: 150, height: 150 }} />;
}
