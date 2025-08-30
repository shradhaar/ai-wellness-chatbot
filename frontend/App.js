import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieAvatar from './components/LottieAvatar';
import { saveMood, getMoodHistory } from './storage/moodStorage';
import { getContextualReflectionPrompt, resetReflectionPrompts, getReflectionStatus, getRotationVisual, getEmotionalReflectionPrompt, forceRefreshPrompts, getDynamicReflectionOptions } from './utils/reflectionPrompts';
import { generateUserPersonality, getConversationStarters } from './utils/personalityAdapter';

export default function App() {
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentMood, setCurrentMood] = useState('neutral');
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAge, setUserAge] = useState('');
  const [userGender, setUserGender] = useState('');
  const [userLocation, setUserLocation] = useState('');
  const [userPersonality, setUserPersonality] = useState(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [welcomeStep, setWelcomeStep] = useState(0);
  const [botInfo, setBotInfo] = useState(null);
  const [userId, setUserId] = useState('');
  const [showMoodSelection, setShowMoodSelection] = useState(false);

  // Function to save user data to storage
  const saveUserData = async (name, age, gender, location) => {
    try {
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userAge', age);
      await AsyncStorage.setItem('userGender', gender);
      await AsyncStorage.setItem('userLocation', location);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  };

  // Function to load user data from storage
  const loadUserData = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const age = await AsyncStorage.getItem('userAge');
      const gender = await AsyncStorage.getItem('userGender');
      const location = await AsyncStorage.getItem('userLocation');
      return { name, age, gender, location };
    } catch (error) {
      console.error('Error loading user data:', error);
      return { name: null, age: null, gender: null, location: null };
    }
  };

  // Function to clear saved user data (for testing)
  const clearSavedUserData = async () => {
    try {
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('userAge');
      await AsyncStorage.removeItem('userGender');
      await AsyncStorage.removeItem('userLocation');
      await AsyncStorage.removeItem('userId');
      setUserName('');
      setUserAge('');
      setUserGender('');
      setUserLocation('');
      setUserPersonality(null);
      setUserId('');
      setShowWelcome(true);
      setWelcomeStep(0);
      setChatHistory([]);
      // Reset reflection prompts for fresh conversation
      resetReflectionPrompts();
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      await loadMoodHistory();
      await loadWelcomeInfo();
      await generateUserId();
      await loadSavedUserData();
    };
    
    initializeApp();
  }, []);

  const loadSavedUserData = async () => {
    const savedData = await loadUserData();
    if (savedData.name) {
      setUserName(savedData.name);
      setUserAge(savedData.age || '');
      setUserGender(savedData.gender || '');
      setUserLocation(savedData.location || '');
      
      // Generate personality profile from saved data
      if (savedData.age && savedData.gender && savedData.location) {
        const personality = generateUserPersonality(savedData.age, savedData.gender, savedData.location);
        setUserPersonality(personality);
      }
      
      // For now, let's always show onboarding to test the flow
      // setShowWelcome(false); // Skip onboarding if name is already saved
    }
  };

  const generateUserId = async () => {
    try {
      // Try to load existing user ID from storage
      const existingUserId = await AsyncStorage.getItem('userId');
      if (existingUserId) {
        setUserId(existingUserId);
      } else {
        // Generate new user ID only if none exists
        const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        setUserId(newUserId);
        // Save the new user ID to storage
        await AsyncStorage.setItem('userId', newUserId);
      }
    } catch (error) {
      console.error('Error handling user ID:', error);
      // Fallback to generating new ID
      const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      setUserId(newUserId);
    }
  };

  const loadMoodHistory = async () => {
    try {
      const history = await getMoodHistory();
      if (history.length > 0) {
        setCurrentMood(history[history.length - 1].mood);
      }
    } catch (error) {
      console.log('Error loading mood history:', error);
    }
  };

  const loadWelcomeInfo = async () => {
    try {
      const response = await fetch('http://localhost:8085/welcome');
      const data = await response.json();
      setBotInfo(data);
    } catch (error) {
      console.log('Error loading welcome info:', error);
    }
  };

  const handleWelcomeStep = () => {
    if (welcomeStep < 6) {
      setWelcomeStep(welcomeStep + 1);
    } else {
      // Save all user data to storage before completing onboarding
      if (userName.trim() && userAge.trim() && userGender.trim() && userLocation.trim()) {
        saveUserData(userName.trim(), userAge.trim(), userGender.trim(), userLocation.trim());
        
        // Generate personalized personality profile
        const personality = generateUserPersonality(userAge.trim(), userGender.trim(), userLocation.trim());
        setUserPersonality(personality);
      }
      
      setShowWelcome(false);
      // Reset reflection prompts for new conversation
      resetReflectionPrompts();
      
      // Generate personalized welcome message based on user's personality
      const personality = generateUserPersonality(userAge.trim(), userGender.trim(), userLocation.trim());
      const conversationStarters = getConversationStarters(personality);
      const randomStarter = conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
      
      const welcomeMessages = [
        {
          text: `${personality.personalizedIntro}\n\nI see you're ${userAge} years old, identify as ${userGender}, and you're from ${userLocation}. This helps me provide more personalized and culturally relevant support that matches your ${personality.ageLabel} experience.\n\nI'm here to be your ${personality.approach}, and I'm genuinely excited to get to know you better. I love deep conversations and find beauty in helping others navigate their emotions.\n\n${randomStarter}`,
          sender: 'bot',
          timestamp: new Date(),
          mood: 'happy'
        }
      ];
      setChatHistory(welcomeMessages);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const userMessage = { text: message, sender: 'user', timestamp: new Date() };
    setChatHistory(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('http://localhost:8085/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: message, 
          userName: userName,
          userAge: userAge,
          userGender: userGender,
          userLocation: userLocation,
          userId: userId 
        }),
      });

      const data = await response.json();
      
      const botMessage = {
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
        mood: data.mood
      };

      setChatHistory(prev => [...prev, botMessage]);
      setCurrentMood(data.mood);
      await saveMood(data.mood, message, data.reply);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        text: 'Sorry, I\'m having trouble connecting right now. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
        mood: 'neutral'
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const getReflection = () => {
    if (!userName.trim() || chatHistory.length < 3) {
      const reminderMessage = {
        text: "I'd love to get to know you a bit better first! Let's finish our introduction and then I can help you reflect on your feelings.",
        sender: 'bot',
        timestamp: new Date(),
        mood: 'neutral'
      };
      setChatHistory(prev => [...prev, reminderMessage]);
      return;
    }
    
    setShowMoodSelection(true);
    
    // Force refresh prompts to ensure variety
    forceRefreshPrompts();
    
    // Get a fresh reflection prompt from the rotation system
    let reflectionText = getEmotionalReflectionPrompt(currentMood);
    
    // Adapt the prompt based on user's personality if available, but still use rotation
    if (userPersonality) {
      if (userPersonality.ageGroup === 'teen') {
        // Get a teen-appropriate prompt from the rotation system
        reflectionText = getEmotionalReflectionPrompt('teen');
      } else if (userPersonality.ageGroup === 'senior') {
        // Get a senior-appropriate prompt from the rotation system
        reflectionText = getEmotionalReflectionPrompt('senior');
      }
    }
    
    // Generate dynamic options for this specific prompt
    const dynamicOptions = getDynamicReflectionOptions(reflectionText);
    
    // Add some debugging to see what prompt we're getting
    console.log('Reflection prompt generated:', reflectionText);
    console.log('Dynamic options:', dynamicOptions);
    console.log('User personality:', userPersonality?.ageGroup);
    
    const reflectionMessage = {
      text: reflectionText,
      sender: 'bot',
      timestamp: new Date(),
      mood: 'reflection',
      showMoodButtons: true,
      dynamicOptions: dynamicOptions.options
    };
    setChatHistory(prev => [...prev, reflectionMessage]);
  };

  const handleMoodSelection = async (mood, moodData = null) => {
    setShowMoodSelection(false);
    
    let messageText = `I'm feeling ${mood}`;
    if (moodData) {
      messageText = `${moodData.text} (${moodData.value})`;
    }
    
    const userMoodMessage = {
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
      mood: mood
    };
    setChatHistory(prev => [...prev, userMoodMessage]);
    
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8085/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: `I'm feeling ${mood}`, 
          userName: userName,
          userAge: userAge,
          userGender: userGender,
          userLocation: userLocation,
          userId: userId 
        })
      });
      const data = await response.json();
      const botMessage = { 
        text: data.reply, 
        sender: 'bot', 
        timestamp: new Date(), 
        mood: data.mood 
      };
      setChatHistory(prev => [...prev, botMessage]);
      setCurrentMood(data.mood);
      await saveMood(data.mood, `I'm feeling ${mood}`, data.reply);
    } catch (error) {
      console.error('Error sending mood message:', error);
      const errorMessage = { 
        text: 'Sorry, I\'m having trouble connecting right now. Please try again later.', 
        sender: 'bot', 
        timestamp: new Date(), 
        mood: 'neutral' 
      };
      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Real-time sentiment analysis for dynamic emoji changes
  const analyzeConversationSentiment = () => {
    if (chatHistory.length === 0) return 'neutral';
    
    // Import the sentiment analyzer
    const { analyzeConversationSentiment: analyzeSentiment } = require('./utils/sentimentAnalyzer');
    
    try {
      const sentiment = analyzeSentiment(chatHistory, message);
      return sentiment.emotion;
    } catch (error) {
      console.log('Sentiment analysis error:', error);
      return 'neutral';
    }
  };

  const welcomeSteps = [
    {
      title: "Welcome to Luna",
      message: botInfo?.greeting || "Hi there! I'm Luna, your wellness companion. It's so nice to meet you! 🌙",
      button: "Nice to meet you too!"
    },
    {
      title: "What should I call you?",
      message: botInfo?.askName || "What should I call you? I'd love to know your name so we can have a more personal conversation.",
      input: true,
      inputType: "name",
      placeholder: "Enter your name...",
      button: "Continue"
    },
    {
      title: "How old are you?",
      message: "This helps me provide age-appropriate support and understand your life stage better.",
      input: true,
      inputType: "age",
      placeholder: "Enter your age...",
      button: "Continue"
    },
    {
      title: "What's your gender?",
      message: "This helps me understand your identity and provide more personalized support.",
      input: true,
      inputType: "gender",
      placeholder: "Enter your gender...",
      button: "Continue"
    },
    {
      title: "Where are you located?",
      message: "This helps me understand your cultural context and provide more relevant support.",
      input: true,
      inputType: "location",
      placeholder: "Enter your location...",
      button: "Continue"
    },
    {
      title: "What brings you here?",
      message: botInfo?.askExpectations || "What brings you here today? Are you looking for someone to talk to, need some emotional support, or just want to check in with yourself?",
      button: "Let's talk"
    },
    {
      title: "How can I help?",
      message: botInfo?.askHelp || "Is there anything specific you'd like help with? I'm here to listen, offer support, and help you feel better.",
      button: "Start chatting"
    }
  ];

  if (showWelcome) {
    const currentStep = welcomeSteps[welcomeStep];
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeAvatarWrapper}>
            <LottieAvatar 
              mood={
                welcomeStep === 0 ? "happy" : 
                welcomeStep === 1 ? "reflection" : 
                welcomeStep === 2 ? "neutral" :
                welcomeStep === 3 ? "reflection" :
                welcomeStep === 4 ? "neutral" :
                welcomeStep === 5 ? "excited" :
                welcomeStep === 6 ? "excited" : "happy"
              }
              conversationHistory={[]}
              currentMessage=""
            />
          </View>
          
          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            {welcomeSteps.map((_, index) => (
              <View 
                key={index} 
                style={[
                  styles.progressDot, 
                  index <= welcomeStep ? styles.progressDotActive : styles.progressDotInactive
                ]} 
              />
            ))}
          </View>
          
          <Text style={styles.welcomeTitle}>{currentStep.title}</Text>
          <Text style={styles.welcomeMessage}>{currentStep.message}</Text>
          
          {currentStep.input && (
            <>
              <TextInput
                style={styles.welcomeInput}
                value={
                  currentStep.inputType === "name" ? userName :
                  currentStep.inputType === "age" ? userAge :
                  currentStep.inputType === "gender" ? userGender :
                  currentStep.inputType === "location" ? userLocation : ""
                }
                onChangeText={
                  currentStep.inputType === "name" ? setUserName :
                  currentStep.inputType === "age" ? setUserAge :
                  currentStep.inputType === "gender" ? setUserGender :
                  currentStep.inputType === "location" ? setUserLocation : () => {}
                }
                placeholder={currentStep.placeholder}
                placeholderTextColor="#999"
                keyboardType={currentStep.inputType === "age" ? "numeric" : "default"}
              />
              
              {/* Helpful hints for each field */}
              {currentStep.inputType === "age" && (
                <Text style={styles.helpText}>
                  Please enter a number between 1 and 120
                </Text>
              )}
              {currentStep.inputType === "gender" && (
                <Text style={styles.helpText}>
                  Examples: male, female, non-binary, prefer not to say
                </Text>
              )}
              {currentStep.inputType === "location" && (
                <Text style={styles.helpText}>
                  Examples: New York, London, Tokyo, or your country
                </Text>
              )}
            </>
          )}
          
          <TouchableOpacity 
            style={styles.welcomeButton} 
            onPress={handleWelcomeStep}
            disabled={
              currentStep.input && (
                (currentStep.inputType === "name" && !userName.trim()) ||
                (currentStep.inputType === "age" && (!userAge.trim() || isNaN(userAge) || parseInt(userAge) < 1 || parseInt(userAge) > 120)) ||
                (currentStep.inputType === "gender" && !userGender.trim()) ||
                (currentStep.inputType === "location" && !userLocation.trim())
              )
            }
          >
            <Text style={styles.welcomeButtonText}>{currentStep.button}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.title}>Luna 🌙</Text>
            {userPersonality && (
              <Text style={styles.personalityMode}>
                {userPersonality.ageGroup === 'teen' ? '😊 Teen Mode' :
                 userPersonality.ageGroup === 'youngAdult' ? '🌟 Young Adult Mode' :
                 userPersonality.ageGroup === 'adult' ? '💼 Adult Mode' :
                 userPersonality.ageGroup === 'senior' ? '👴 Senior Mode' : '💫 Wellness Mode'}
              </Text>
            )}
            {userName && (
              <TouchableOpacity 
                onPress={clearSavedUserData}
                onLongPress={() => {
                  if (userPersonality) {
                    const profile = `Your Luna Profile:\n\n` +
                      `Age Group: ${userPersonality.ageLabel}\n` +
                      `Tone: ${userPersonality.tone}\n` +
                      `Language: ${userPersonality.language}\n` +
                      `Approach: ${userPersonality.approach}\n` +
                      `Cultural Context: ${userPersonality.culturalContext.culture}\n` +
                      `Values: ${userPersonality.culturalContext.values.join(', ')}\n\n` +
                      `Luna is adapting her personality to match your ${userPersonality.ageLabel} experience and ${userPersonality.culturalContext.culture} cultural background.`;
                    
                    alert(profile);
                  }
                }}
              >
                <Text style={styles.userNameDisplay}>
                  Hello, {userName}! ({userAge}, {userGender}, {userLocation})
                </Text>
                {userPersonality && (
                  <Text style={styles.userNameSubtext}>
                    {userPersonality.ageLabel} • {userPersonality.culturalContext.culture} • (tap to reset, long-press for profile)
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.avatarWrapper}>
            <LottieAvatar 
              mood={currentMood} 
              conversationHistory={chatHistory}
              currentMessage={message}
            />
          </View>
        </View>

        <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
          {chatHistory.map((msg, index) => (
            <View key={index}>
              <View
                style={[
                  styles.messageContainer,
                  msg.sender === 'user' ? styles.userMessage : styles.botMessage
                ]}
              >
                <Text style={[
                  styles.messageText,
                  msg.sender === 'user' ? styles.userMessageText : styles.botMessageText
                ]}>
                  {msg.text}
                </Text>
                <Text style={styles.timestamp}>
                  {msg.timestamp.toLocaleTimeString()}
                </Text>
              </View>
              
              {msg.showMoodButtons && (
                <View style={styles.moodButtonsContainer}>
                  {msg.dynamicOptions ? (
                    // Dynamic options based on the reflection prompt - exactly 4 options
                    msg.dynamicOptions.map((option, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={[
                          styles.moodButton, 
                          option.mood === 'positive' ? styles.positiveButton :
                          option.mood === 'negative' ? styles.negativeButton :
                          styles.neutralButton
                        ]} 
                        onPress={() => handleMoodSelection(option.value, option)}
                      >
                        <Text style={styles.moodButtonText}>
                          {option.emoji} {option.text}
                        </Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    // Fallback to static mood buttons only when no dynamic options
                    <>
                      <TouchableOpacity 
                        style={[styles.moodButton, styles.energizedButton]} 
                        onPress={() => handleMoodSelection('energized')}
                      >
                        <Text style={styles.moodButtonText}>
                          {userPersonality?.ageGroup === 'teen' ? '⚡ Energized!' : 
                           userPersonality?.ageGroup === 'senior' ? '⚡ Vital' : '⚡ Energized'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.moodButton, styles.peacefulButton]} 
                        onPress={() => handleMoodSelection('peaceful')}
                      >
                        <Text style={styles.moodButtonText}>
                          {userPersonality?.ageGroup === 'teen' ? '😌 Chill' : 
                           userPersonality?.ageGroup === 'senior' ? '😌 Serene' : '😌 Peaceful'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.moodButton, styles.overwhelmedButton]} 
                        onPress={() => handleMoodSelection('overwhelmed')}
                      >
                        <Text style={styles.moodButtonText}>
                          {userPersonality?.ageGroup === 'teen' ? '😵‍💫 Overwhelmed' : 
                           userPersonality?.ageGroup === 'senior' ? '😵‍💫 Pressured' : '😵‍💫 Overwhelmed'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.moodButton, styles.gratefulButton]} 
                        onPress={() => handleMoodSelection('grateful')}
                      >
                        <Text style={styles.moodButtonText}>
                          {userPersonality?.ageGroup === 'teen' ? '🙏 Grateful' : 
                           userPersonality?.ageGroup === 'senior' ? '🙏 Appreciative' : '🙏 Grateful'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.moodButton, styles.creativeButton]} 
                        onPress={() => handleMoodSelection('creative')}
                      >
                        <Text style={styles.moodButtonText}>
                          {userPersonality?.ageGroup === 'teen' ? '🎨 Creative' : 
                           userPersonality?.ageGroup === 'senior' ? '🎨 Inspired' : '🎨 Creative'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.moodButton, styles.uncertainButton]} 
                        onPress={() => handleMoodSelection('uncertain')}
                      >
                        <Text style={styles.moodButtonText}>
                          {userPersonality?.ageGroup === 'teen' ? '🤔 Uncertain' : 
                           userPersonality?.ageGroup === 'senior' ? '🤔 Contemplative' : '🤔 Uncertain'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.moodButton, styles.connectedButton]} 
                        onPress={() => handleMoodSelection('connected')}
                      >
                        <Text style={styles.moodButtonText}>
                          {userPersonality?.ageGroup === 'teen' ? '💫 Connected' : 
                           userPersonality?.ageGroup === 'senior' ? '💫 Bonded' : '💫 Connected'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.moodButton, styles.needingSupportButton]} 
                        onPress={() => handleMoodSelection('needingSupport')}
                      >
                        <Text style={styles.moodButtonText}>
                          {userPersonality?.ageGroup === 'teen' ? '🆘 Need Support' : 
                           userPersonality?.ageGroup === 'senior' ? '🆘 Seeking Help' : '🆘 Need Support'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </View>
          ))}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Luna is thinking...</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.reflectionButton} 
              onPress={getReflection}
              onLongPress={() => {
                const status = getReflectionStatus();
                console.log('Reflection Prompt Status:', status);
                // You could show this in an alert or modal
                alert(`Reflection Prompts: ${status.availablePrompts}/${status.totalPrompts} available\nRecently used: ${status.usedPrompts.length} prompts`);
              }}
            >
              <Text style={styles.reflectionButtonText}>Reflection</Text>
            </TouchableOpacity>
            <Text style={styles.promptInfo}>✨ {getRotationVisual()} Fresh prompts</Text>
            <TouchableOpacity 
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]} 
              onPress={sendMessage}
              disabled={!message.trim()}
            >
              <Text style={styles.sendButtonText}>Send</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            multiline
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  welcomeAvatarWrapper: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  welcomeMessage: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  welcomeInput: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 30,
  },
  welcomeButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 25,
  },
  welcomeButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerLeft: {
    flex: 1,
  },
  avatarWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameDisplay: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
    fontStyle: 'italic',
  },
  userNameSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  chatContainer: {
    flex: 1,
    padding: 15,
  },
  messageContainer: {
    marginVertical: 5,
    maxWidth: '80%',
    padding: 12,
    borderRadius: 15,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007AFF',
  },
  botMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#fff',
  },
  botMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
  },
  loadingContainer: {
    alignSelf: 'flex-start',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loadingText: {
    color: '#666',
    fontStyle: 'italic',
  },
  inputContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    padding: 12,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#f9f9f9',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  reflectionButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 0.48,
  },
  reflectionButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flex: 0.48,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  moodButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  moodButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginVertical: 3,
    minWidth: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  moodButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  energizedButton: {
    backgroundColor: '#FFF8E1',
    borderColor: '#FFD54F',
  },
  peacefulButton: {
    backgroundColor: '#E8F5E8',
    borderColor: '#81C784',
  },
  overwhelmedButton: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E57373',
  },
  gratefulButton: {
    backgroundColor: '#F3E5F5',
    borderColor: '#BA68C8',
  },
  creativeButton: {
    backgroundColor: '#E0F2F1',
    borderColor: '#4DB6AC',
  },
  uncertainButton: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FFB74D',
  },
  connectedButton: {
    backgroundColor: '#E1F5FE',
    borderColor: '#4FC3F7',
  },
  needingSupportButton: {
    backgroundColor: '#FCE4EC',
    borderColor: '#F06292',
  },
  positiveButton: {
    backgroundColor: '#E8F5E8',
    borderColor: '#81C784',
  },
  negativeButton: {
    backgroundColor: '#FFEBEE',
    borderColor: '#E57373',
  },
  neutralButton: {
    backgroundColor: '#F5F5F5',
    borderColor: '#BDBDBD',
  },
  promptInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: '#007AFF',
  },
  progressDotInactive: {
    backgroundColor: '#e0e0e0',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    fontStyle: 'italic',
    paddingHorizontal: 20,
  },
  personalityMode: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 5,
  },
}); 