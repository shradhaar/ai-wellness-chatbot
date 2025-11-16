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
  Alert,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieAvatar from './components/LottieAvatar';
import { saveMood, getMoodHistory } from './storage/moodStorage';
import { saveChatHistory, loadChatHistory, getCurrentSessionId, createNewSession, getAllSessions, switchToSession, deleteSession, clearAllChatHistory } from './storage/chatHistoryStorage';
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
  const [selectedMode, setSelectedMode] = useState(null);
  const [showModeSelection, setShowModeSelection] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);

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
      // Close sessions list if open
      setShowSessionsList(false);
      
      // Clear all user data from AsyncStorage
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('userAge');
      await AsyncStorage.removeItem('userGender');
      await AsyncStorage.removeItem('userLocation');
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('selectedMode');
      
      // Clear all chat history and sessions
      await clearAllChatHistory();
      
      // Reset all state
      setUserName('');
      setUserAge('');
      setUserGender('');
      setUserLocation('');
      setUserPersonality(null);
      setUserId('');
      setSelectedMode(null);
      setShowModeSelection(false);
      setChatHistory([]);
      setChatSessions([]);
      setCurrentSessionId(null);
      setCurrentMood('neutral');
      
      // Show welcome screen - MUST be set last to ensure it's visible
      setWelcomeStep(0);
      setShowWelcome(true);
      
      // Reset reflection prompts for fresh conversation
      resetReflectionPrompts();
      
      console.log('✅ User data cleared - returned to onboarding screen');
    } catch (error) {
      console.error('Error clearing user data:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to reset. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to reset. Please try again.');
      }
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      await loadMoodHistory();
      await loadWelcomeInfo();
      await generateUserId();
      await loadSavedUserData();
      await loadChatHistoryFromStorage();
      await loadSessionsList();
    };
    
    initializeApp();
  }, []);

  // Load chat history from storage on app startup (only if user is already set up)
  const loadChatHistoryFromStorage = async () => {
    try {
      // Only load history if user has completed onboarding
      const savedData = await loadUserData();
      if (!savedData.name) {
        // User hasn't completed onboarding yet, don't load history
        console.log('⏭️ Skipping chat history load - user not onboarded yet');
        return;
      }

      const sessionId = await getCurrentSessionId();
      if (sessionId) {
        setCurrentSessionId(sessionId);
        const history = await loadChatHistory(sessionId);
        if (history && history.length > 0) {
          // Convert timestamp strings back to Date objects if needed
          const processedHistory = history.map(msg => ({
            ...msg,
            timestamp: msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp)
          }));
          setChatHistory(processedHistory);
          console.log('✅ Loaded chat history on page reload:', processedHistory.length, 'messages');
        } else {
          console.log('ℹ️ No chat history found for current session');
        }
      } else {
        // Create a new session if none exists
        const newSessionId = await createNewSession();
        setCurrentSessionId(newSessionId);
        console.log('✅ Created new chat session:', newSessionId);
      }
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
    }
  };

  // Load list of all sessions
  const loadSessionsList = async () => {
    try {
      const sessions = await getAllSessions();
      setChatSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions list:', error);
    }
  };

  // Save chat history to storage whenever it changes
  useEffect(() => {
    const saveHistory = async () => {
      if (chatHistory.length > 0 && currentSessionId) {
        try {
          await saveChatHistory(chatHistory, currentSessionId);
          // Refresh sessions list to update metadata
          await loadSessionsList();
          console.log('💾 Auto-saved chat history:', chatHistory.length, 'messages');
        } catch (error) {
          console.error('❌ Error saving chat history:', error);
        }
      }
    };

    // Debounce saves to avoid too frequent writes (but save immediately on page unload)
    const timeoutId = setTimeout(saveHistory, 500);
    
    // Also save immediately when page is about to unload (for reliability)
    const handleBeforeUnload = () => {
      if (chatHistory.length > 0 && currentSessionId) {
        saveChatHistory(chatHistory, currentSessionId).catch(err => 
          console.error('Error saving on unload:', err)
        );
      }
    };
    
    // For web: use beforeunload event
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }
    
    return () => {
      clearTimeout(timeoutId);
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    };
  }, [chatHistory, currentSessionId]);

  const loadSavedUserData = async () => {
    const savedData = await loadUserData();
    if (savedData.name) {
      setUserName(savedData.name);
      setUserAge(savedData.age || '');
      setUserGender(savedData.gender || '');
      setUserLocation(savedData.location || '');
      
          // Load saved mode
      try {
        const savedMode = await AsyncStorage.getItem('selectedMode');
        if (savedMode) {
          setSelectedMode(savedMode);
          // Generate personality profile from saved data
          if (savedData.age && savedData.gender && savedData.location) {
            const personality = generateUserPersonality(savedData.age, savedData.gender, savedData.location);
            setUserPersonality(personality);
          }
          // Skip onboarding if we have all the data
          setShowWelcome(false);
        }
      } catch (error) {
        console.error('Error loading saved mode:', error);
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
    if (welcomeStep < 5) {
      setWelcomeStep(welcomeStep + 1);
    } else if (welcomeStep === 5) {
      // Skip mode selection, go straight to buddy mode
      handleModeSelection('buddy');
    }
  };

  const handleModeSelection = async (mode) => {
    console.log('Mode selection triggered:', mode);
    setSelectedMode(mode);
    setShowModeSelection(false);
    
    // Save mode to storage
    try {
      await AsyncStorage.setItem('selectedMode', mode);
      console.log('Mode saved to storage:', mode);
    } catch (error) {
      console.error('Error saving mode:', error);
    }
    
    // Save all user data to storage before completing onboarding
    if (userName.trim() && userAge.trim() && userGender.trim() && userLocation.trim()) {
      console.log('User data is complete, saving...');
      saveUserData(userName.trim(), userAge.trim(), userGender.trim(), userLocation.trim());
      
      console.log('Setting up Buddy Mode...');
      // Generate personalized personality profile for Buddy Mode
      const personality = generateUserPersonality(userAge.trim(), userGender.trim(), userLocation.trim());
      setUserPersonality(personality);
      
      // Generate personalized welcome message based on user's personality
      const conversationStarters = getConversationStarters(personality);
      const randomStarter = conversationStarters[Math.floor(Math.random() * conversationStarters.length)];
      
      const welcomeMessages = [
        {
          text: `${personality.personalizedIntro} I'm here to be your ${personality.approach}. ${randomStarter}`,
          sender: 'bot',
          timestamp: new Date(),
          mood: 'happy'
        }
      ];
      setChatHistory(welcomeMessages);
    } else {
      console.log('User data incomplete:', { userName, userAge, userGender, userLocation });
    }
    
    console.log('Setting showWelcome to false');
      setShowWelcome(false);
      // Reset reflection prompts for new conversation
      resetReflectionPrompts();
      
      // Create a new chat session for this conversation
      const newSessionId = await createNewSession();
      setCurrentSessionId(newSessionId);
      setChatHistory([]);
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    const currentMessage = message;
    const userMessage = { text: message, sender: 'user', timestamp: new Date() };
    
    // Store current message and clear input
    setMessage('');
    setIsLoading(true);

    try {
      // Send history BEFORE adding current message to avoid duplicates
      const response = await fetch('http://localhost:8085/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: currentMessage, 
          userName: userName,
          userAge: userAge,
          userGender: userGender,
          userLocation: userLocation,
          userId: userId,
          mode: selectedMode,
          conversationHistory: chatHistory // Send existing history only
        }),
      });

      const data = await response.json();
      
      // Add user message and bot response together
      const botMessage = {
        text: data.reply,
        sender: 'bot',
        timestamp: new Date(),
        mood: data.mood
      };
      
      const updatedHistory = [...chatHistory, userMessage, botMessage];
      setChatHistory(updatedHistory);
      setCurrentMood(data.mood);
      await saveMood(data.mood, currentMessage, data.reply);
      
      // Ensure session exists before saving
      if (!currentSessionId) {
        const newSessionId = await createNewSession();
        setCurrentSessionId(newSessionId);
      }
      
      // Save chat history (will be auto-saved by useEffect, but save immediately for reliability)
      await saveChatHistory(updatedHistory, currentSessionId);
      
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
          userId: userId,
          mode: selectedMode,
          conversationHistory: chatHistory
        })
      });
      const data = await response.json();
      const botMessage = { 
        text: data.reply, 
        sender: 'bot', 
        timestamp: new Date(), 
        mood: data.mood 
      };
      const updatedHistory = [...chatHistory, botMessage];
      setChatHistory(updatedHistory);
      setCurrentMood(data.mood);
      await saveMood(data.mood, `I'm feeling ${mood}`, data.reply);
      
      // Ensure session exists before saving
      if (!currentSessionId) {
        const newSessionId = await createNewSession();
        setCurrentSessionId(newSessionId);
      }
      
      // Save chat history
      await saveChatHistory(updatedHistory, currentSessionId);
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

  // Real-time sentiment analysis for dynamic emoji changes (INTERNAL ONLY - doesn't affect conversation flow)
  const [conversationSentiment, setConversationSentiment] = useState({ emotion: 'neutral', emoji: '😐', confidence: 0.5 });
  
  // Actively analyze conversation sentiment whenever chat history or message changes
  useEffect(() => {
    if (chatHistory.length > 0) {
      try {
        const { analyzeConversationSentiment: analyzeSentiment } = require('./utils/sentimentAnalyzer');
        const sentiment = analyzeSentiment(chatHistory, message);
        setConversationSentiment(sentiment);
        
        // Log sentiment analysis for debugging (internal only)
        console.log('🎭 Internal Sentiment Analysis:', {
          emotion: sentiment.emotion,
          emoji: sentiment.emoji,
          confidence: sentiment.confidence,
          messageCount: chatHistory.length,
          currentMessage: message
        });
      } catch (error) {
        console.log('Sentiment analysis error:', error);
        setConversationSentiment({ emotion: 'neutral', emoji: '😐', confidence: 0.5 });
      }
    }
  }, [chatHistory, message]);
  
  // Session management functions
  const handleNewSession = async () => {
    try {
      // Save current session before switching
      if (chatHistory.length > 0 && currentSessionId) {
        await saveChatHistory(chatHistory, currentSessionId);
      }
      
      // Create new session
      const newSessionId = await createNewSession();
      setCurrentSessionId(newSessionId);
      setChatHistory([]);
      await loadSessionsList();
      setShowSessionsList(false);
    } catch (error) {
      console.error('Error creating new session:', error);
    }
  };

  const handleSwitchSession = async (sessionId) => {
    try {
      // Save current session before switching
      if (chatHistory.length > 0 && currentSessionId) {
        await saveChatHistory(chatHistory, currentSessionId);
      }
      
      // Load the selected session
      const history = await switchToSession(sessionId);
      setCurrentSessionId(sessionId);
      setChatHistory(history);
      setShowSessionsList(false);
    } catch (error) {
      console.error('Error switching session:', error);
    }
  };

  const handleDeleteSession = async (sessionId) => {
    try {
      console.log('🗑️ handleDeleteSession called with sessionId:', sessionId);
      
      // For web, use window.confirm as fallback if Alert doesn't work
      if (Platform.OS === 'web') {
        const confirmed = window.confirm('Are you sure you want to delete this conversation? This cannot be undone.');
        if (!confirmed) {
          console.log('❌ Delete cancelled by user');
          return;
        }
        
        try {
          console.log('🗑️ Deleting session:', sessionId);
          await deleteSession(sessionId);
          await loadSessionsList();
          
          // If we deleted the current session, create a new one
          if (sessionId === currentSessionId) {
            const newSessionId = await createNewSession();
            setCurrentSessionId(newSessionId);
            setChatHistory([]);
          }
          
          console.log('✅ Session deleted successfully:', sessionId);
        } catch (error) {
          console.error('❌ Error deleting session:', error);
          window.alert('Failed to delete session. Please try again.');
        }
      } else {
        // For native, use Alert
        Alert.alert(
          'Delete Conversation',
          'Are you sure you want to delete this conversation? This cannot be undone.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => console.log('❌ Delete cancelled')
            },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: async () => {
                try {
                  console.log('🗑️ Deleting session:', sessionId);
                  await deleteSession(sessionId);
                  await loadSessionsList();
                  
                  // If we deleted the current session, create a new one
                  if (sessionId === currentSessionId) {
                    const newSessionId = await createNewSession();
                    setCurrentSessionId(newSessionId);
                    setChatHistory([]);
                  }
                  
                  console.log('✅ Session deleted successfully:', sessionId);
                } catch (error) {
                  console.error('❌ Error deleting session:', error);
                  Alert.alert('Error', 'Failed to delete session. Please try again.');
                }
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('❌ Error showing delete confirmation:', error);
      if (Platform.OS === 'web') {
        window.alert('Failed to show delete confirmation. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to show delete confirmation. Please try again.');
      }
    }
  };

  // Get the most appropriate emoji based on conversation sentiment (INTERNAL ONLY)
  const getActiveEmoji = () => {
    // If we have a strong sentiment signal, use it for emoji only
    if (conversationSentiment.confidence > 0.3) {
      return conversationSentiment.emoji;
    }
    
    // Fallback to current mood if sentiment is weak
    return currentMood === 'happy' ? '😊' : 
           currentMood === 'sad' ? '😔' : 
           currentMood === 'excited' ? '😄' : 
           currentMood === 'peaceful' ? '😌' : 
           currentMood === 'overwhelmed' ? '😵‍💫' : 
           currentMood === 'grateful' ? '🙏' : 
           currentMood === 'creative' ? '🎨' : 
           currentMood === 'uncertain' ? '🤔' : 
           currentMood === 'connected' ? '💫' : 
           currentMood === 'needingSupport' ? '🆘' : '😐';
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
      button: "Let's get started"
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
                welcomeStep === 5 ? "excited" : "happy"
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

  if (showModeSelection) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.modeSelectionContainer}>
          <View style={styles.welcomeAvatarWrapper}>
            <LottieAvatar 
              mood="excited"
              conversationHistory={[]}
              currentMessage=""
            />
          </View>
          
          <Text style={styles.welcomeTitle}>Choose Your Companion</Text>
          <Text style={styles.welcomeMessage}>
            Pick the mode that feels right for you! You can always change this later.
          </Text>
          
          <View style={styles.modeOptionsContainer}>
            <TouchableOpacity 
              style={styles.modeOption} 
              onPress={() => handleModeSelection('buddy')}
            >
              <Text style={styles.modeEmoji}>🌟</Text>
              <Text style={styles.modeTitle}>Buddy Mode</Text>
              <Text style={styles.modeDescription}>
                Your adaptive wellness companion who grows with you, understands your age, location, and provides personalized support.
              </Text>
            </TouchableOpacity>
          </View>
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
            
            {/* Real-time sentiment indicator */}
            {conversationSentiment.confidence > 0.3 && (
              <View style={styles.sentimentIndicator}>
                <Text style={styles.sentimentText}>
                  🎭 {conversationSentiment.emoji} {conversationSentiment.emotion.charAt(0).toUpperCase() + conversationSentiment.emotion.slice(1)}
                </Text>
                <Text style={styles.confidenceText}>
                  Confidence: {Math.round(conversationSentiment.confidence * 100)}%
                </Text>
              </View>
            )}
            {userName && (
              <TouchableOpacity 
                onPress={clearSavedUserData}
                onLongPress={() => {
                  if (userPersonality) {
                    const profile = `Your Luna Profile:\n\n` +
                      `Age Group: ${userPersonality.ageLabel || 'Wellness'}\n` +
                      `Tone: ${userPersonality.tone || 'Adaptive'}\n` +
                      `Language: ${userPersonality.language || 'English'}\n` +
                      `Approach: ${userPersonality.approach || 'Supportive'}\n` +
                      `Cultural Context: ${userPersonality.culturalContext?.culture || 'Wellness'}\n` +
                      `Values: ${userPersonality.culturalContext?.values?.join(', ') || 'Support, Growth, Wellness'}\n\n` +
                      `Luna is adapting her personality to match your ${userPersonality.ageLabel || 'Wellness'} experience and ${userPersonality.culturalContext?.culture || 'Wellness'} cultural background.`;
                    alert(profile);
                  }
                }}
              >
                <Text style={styles.userNameDisplay}>
                  Hello, {userName}! ({userAge}, {userGender}, {userLocation})
                </Text>
                {userPersonality && (
                  <Text style={styles.userNameSubtext}>
                    {userPersonality.ageLabel ? `${userPersonality.ageLabel} • ${userPersonality.culturalContext?.culture || 'Wellness'} • (tap to reset, long-press for profile)` :
                     'Wellness Mode • (tap to reset, long-press for profile)'}
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
              activeEmoji={getActiveEmoji()}
              sentimentConfidence={conversationSentiment.confidence}
            />
            
            {/* Session and Reset Buttons */}
            <View style={styles.headerButtonsContainer}>
              <TouchableOpacity 
                style={[styles.headerButton, styles.sessionsButton]}
                onPress={() => setShowSessionsList(!showSessionsList)}
              >
                <Text style={styles.headerButtonText}>💬 Sessions ({chatSessions.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerButton, styles.newSessionButton]}
                onPress={handleNewSession}
              >
                <Text style={styles.headerButtonText}>➕ New</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.headerButton, styles.resetButton]}
                onPress={() => {
                  // Show confirmation dialog before resetting
                  if (Platform.OS === 'web') {
                    const confirmed = window.confirm('Are you sure you want to reset everything? This will clear all your data and take you back to the onboarding process.');
                    if (confirmed) {
                      clearSavedUserData();
                    }
                  } else {
                    Alert.alert(
                      'Reset Everything',
                      'Are you sure you want to reset everything? This will clear all your data and take you back to the onboarding process.',
                      [
                        {
                          text: 'Cancel',
                          style: 'cancel'
                        },
                        {
                          text: 'Reset',
                          style: 'destructive',
                          onPress: clearSavedUserData
                        }
                      ]
                    );
                  }
                }}
              >
                <Text style={styles.headerButtonText}>🔄 Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Sessions List Overlay */}
        {showSessionsList && (
          <View style={styles.sessionsOverlay}>
            <View style={styles.sessionsContainer}>
              <View style={styles.sessionsHeader}>
                <Text style={styles.sessionsTitle}>Chat Sessions</Text>
                <TouchableOpacity 
                  onPress={() => setShowSessionsList(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView style={styles.sessionsList}>
                {chatSessions.length === 0 ? (
                  <Text style={styles.noSessionsText}>No previous conversations</Text>
                ) : (
                  chatSessions.map((session) => (
                    <View 
                      key={session.id} 
                      style={[
                        styles.sessionItem,
                        session.id === currentSessionId && styles.sessionItemActive
                      ]}
                    >
                      <TouchableOpacity 
                        style={styles.sessionItemContent}
                        onPress={() => handleSwitchSession(session.id)}
                        activeOpacity={0.7}
                        pointerEvents="box-none"
                      >
                        <Text style={styles.sessionTitle} numberOfLines={1}>
                          {session.title || 'New Conversation'}
                        </Text>
                        <Text style={styles.sessionMeta}>
                          {session.messageCount} messages • {new Date(session.lastUpdated).toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                      <View style={styles.deleteButtonContainer}>
                        <Pressable 
                          style={({ pressed }) => [
                            styles.deleteSessionButton,
                            pressed && styles.deleteSessionButtonPressed
                          ]}
                          onPress={() => {
                            console.log('🗑️ Delete button pressed:', session.id);
                            handleDeleteSession(session.id);
                          }}
                          onPressIn={() => {
                            console.log('🗑️ Delete button press started');
                          }}
                          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                        >
                          <Text style={styles.deleteSessionButtonText}>🗑️</Text>
                        </Pressable>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
              <TouchableOpacity 
                style={styles.newSessionButtonLarge}
                onPress={handleNewSession}
              >
                <Text style={styles.newSessionButtonText}>➕ Start New Conversation</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
          {chatHistory.length === 0 && (
            <View style={styles.welcomeMessageContainer}>
              <Text style={styles.welcomeMessageText}>
                Welcome to Luna! 🌙 How are you feeling today?
              </Text>
            </View>
          )}
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
  modeSelectionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  modeOptionsContainer: {
    width: '100%',
    marginTop: 30,
  },
  modeOption: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 15,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modeEmoji: {
    fontSize: 48,
    marginBottom: 15,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modeDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  sentimentIndicator: {
    backgroundColor: '#F0F8FF',
    borderWidth: 1,
    borderColor: '#87CEEB',
    borderRadius: 8,
    padding: 6,
    marginTop: 4,
    marginBottom: 5,
  },
  sentimentText: {
    fontSize: 11,
    color: '#4682B4',
    fontWeight: '600',
    textAlign: 'center',
  },
  confidenceText: {
    fontSize: 9,
    color: '#87CEEB',
    textAlign: 'center',
    marginTop: 2,
    fontStyle: 'italic',
  },
  welcomeMessageContainer: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignSelf: 'center',
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  welcomeMessageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  headerButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#0056CC',
    minWidth: 60,
  },
  sessionsButton: {
    backgroundColor: '#34C759',
    borderColor: '#28A745',
  },
  newSessionButton: {
    backgroundColor: '#FF9500',
    borderColor: '#E68900',
  },
  resetButton: {
    backgroundColor: '#FF3B30',
    borderColor: '#CC2E25',
  },
  headerButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  sessionsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 1000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sessionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sessionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#666',
  },
  sessionsList: {
    maxHeight: 400,
    marginBottom: 15,
  },
  sessionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sessionItemActive: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  sessionItemContent: {
    flex: 1,
  },
  sessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  sessionMeta: {
    fontSize: 12,
    color: '#666',
  },
  deleteButtonContainer: {
    marginLeft: 10,
    zIndex: 10,
    elevation: 3,
  },
  deleteSessionButton: {
    padding: 12,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#FFEBEE',
  },
  deleteSessionButtonPressed: {
    backgroundColor: '#FFCDD2',
    transform: [{ scale: 0.95 }],
  },
  deleteSessionButtonText: {
    fontSize: 20,
  },
  noSessionsText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    padding: 20,
  },
  newSessionButtonLarge: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  newSessionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 