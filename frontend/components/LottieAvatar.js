
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, StyleSheet } from 'react-native';
import './AvatarAnimations.css';
import { analyzeConversationSentiment, getEmojiForEmotion } from '../utils/sentimentAnalyzer';

export default function LottieAvatar({ mood = 'neutral', conversationHistory = [], currentMessage = '' }) {
  const [analyzedMood, setAnalyzedMood] = useState(mood);
  const [sentimentEmoji, setSentimentEmoji] = useState('😐');
  
  // Analyze conversation sentiment when conversation changes
  useEffect(() => {
    if (conversationHistory.length > 0 || currentMessage) {
      const sentiment = analyzeConversationSentiment(conversationHistory, currentMessage);
      setAnalyzedMood(sentiment.emotion);
      setSentimentEmoji(sentiment.emoji);
    } else {
      setAnalyzedMood(mood);
      setSentimentEmoji(getEmojiForEmotion(mood));
    }
  }, [conversationHistory, currentMessage, mood]);
  
  // Use analyzed mood for configuration
  const moodConfig = {
    // Positive emotions
    happy: {
      emoji: sentimentEmoji,
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      borderColor: '#4CAF50',
      animation: 'bounce'
    },
    grateful: {
      emoji: sentimentEmoji,
      color: '#9C27B0',
      bgColor: '#F3E5F5',
      borderColor: '#9C27B0',
      animation: 'pulse'
    },
    confident: {
      emoji: sentimentEmoji,
      color: '#FF9800',
      bgColor: '#FFF3E0',
      borderColor: '#FF9800',
      animation: 'pulse'
    },
    peaceful: {
      emoji: sentimentEmoji,
      color: '#4CAF50',
      bgColor: '#E8F5E8',
      borderColor: '#4CAF50',
      animation: 'fade'
    },
    creative: {
      emoji: sentimentEmoji,
      color: '#00BCD4',
      bgColor: '#E0F2F1',
      borderColor: '#00BCD4',
      animation: 'bounce'
    },
    
    // Negative emotions
    sad: {
      emoji: sentimentEmoji,
      color: '#2196F3',
      bgColor: '#E3F2FD',
      borderColor: '#2196F3',
      animation: 'fade'
    },
    angry: {
      emoji: sentimentEmoji,
      color: '#F44336',
      bgColor: '#FFEBEE',
      borderColor: '#F44336',
      animation: 'shake'
    },
    anxious: {
      emoji: sentimentEmoji,
      color: '#9C27B0',
      bgColor: '#F3E5F5',
      borderColor: '#9C27B0',
      animation: 'shake'
    },
    tired: {
      emoji: sentimentEmoji,
      color: '#607D8B',
      bgColor: '#ECEFF1',
      borderColor: '#607D8B',
      animation: 'fade'
    },
    lonely: {
      emoji: sentimentEmoji,
      color: '#795548',
      bgColor: '#EFEBE9',
      borderColor: '#795548',
      animation: 'fade'
    },
    overwhelmed: {
      emoji: sentimentEmoji,
      color: '#E91E63',
      bgColor: '#FCE4EC',
      borderColor: '#E91E63',
      animation: 'shake'
    },
    
    // Neutral/Complex emotions
    contemplative: {
      emoji: sentimentEmoji,
      color: '#795548',
      bgColor: '#EFEBE9',
      borderColor: '#795548',
      animation: 'pulse'
    },
    uncertain: {
      emoji: sentimentEmoji,
      color: '#FF9800',
      bgColor: '#FFF3E0',
      borderColor: '#FF9800',
      animation: 'pulse'
    },
    neutral: {
      emoji: sentimentEmoji,
      color: '#757575',
      bgColor: '#F5F5F5',
      borderColor: '#757575',
      animation: 'none'
    },
    reflection: {
      emoji: sentimentEmoji,
      color: '#795548',
      bgColor: '#EFEBE9',
      borderColor: '#795548',
      animation: 'pulse'
    }
  };

  const currentMood = moodConfig[analyzedMood] || moodConfig.neutral;

  if (Platform.OS === 'web') {
    // Enhanced web avatar with better styling and mood-based animations
    return (
      <div 
        className={`avatar-${mood}`}
        style={{
          width: 120,
          height: 120,
          borderRadius: 60,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: `3px solid ${currentMood.borderColor}`,
          backgroundColor: currentMood.bgColor,
          position: 'relative',
          boxShadow: '0 2px 4px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{
          width: 100,
          height: 100,
          borderRadius: 50,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          border: `2px solid ${currentMood.color}`,
          backgroundColor: currentMood.color + '20',
        }}>
          <span style={{
            fontSize: 50,
            color: currentMood.color,
            textShadow: '1px 1px 2px rgba(0,0,0,0.1)',
          }}>
            {currentMood.emoji}
          </span>
        </div>
        <div style={{
          position: 'absolute',
          bottom: -5,
          backgroundColor: 'white',
          padding: '4px 8px',
          borderRadius: 12,
          border: '1px solid #e0e0e0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}>
          <span style={{
            fontSize: 12,
            fontWeight: '600',
            color: currentMood.color,
            textTransform: 'capitalize',
          }}>
            {mood.charAt(0).toUpperCase() + mood.slice(1)}
          </span>
        </div>
      </div>
    );
  }

  // Use Lottie for mobile with enhanced mood support
  try {
    const LottieView = require('lottie-react-native').default;
    
    // Map moods to available animations
    let animationSource;
    switch (mood) {
      case 'happy':
        animationSource = require('../assets/animations/happy.json');
        break;
      case 'sad':
        animationSource = require('../assets/animations/sad.json');
        break;
      default:
        // Use happy animation as default for other moods
        animationSource = require('../assets/animations/happy.json');
    }
    
    return (
      <View style={styles.avatarContainer}>
        <LottieView 
          source={animationSource} 
          autoPlay 
          loop 
          style={styles.lottieAvatar}
        />
        <View style={styles.moodIndicator}>
          <Text style={[
            styles.moodText,
            { color: currentMood.color }
          ]}>
            {mood.charAt(0).toUpperCase() + mood.slice(1)}
          </Text>
        </View>
      </View>
    );
  } catch (error) {
    // Fallback to enhanced emoji avatar if Lottie fails
    return (
      <View style={[
        styles.avatarContainer,
        {
          backgroundColor: currentMood.bgColor,
          borderColor: currentMood.borderColor,
        }
      ]}>
        <View style={[
          styles.avatarInner,
          {
            backgroundColor: currentMood.color + '20',
            borderColor: currentMood.color,
          }
        ]}>
          <Text style={[
            styles.emoji,
            { color: currentMood.color }
          ]}>
            {currentMood.emoji}
          </Text>
        </View>
        <View style={styles.moodIndicator}>
          <Text style={[
            styles.moodText,
            { color: currentMood.color }
          ]}>
            {mood.charAt(0).toUpperCase() + mood.slice(1)}
          </Text>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  emoji: {
    fontSize: 50,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  moodIndicator: {
    position: 'absolute',
    bottom: -5,
    backgroundColor: 'white',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  moodText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  lottieAvatar: {
    width: 120,
    height: 120,
  },
});
