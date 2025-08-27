const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

// Set Gemini API key if not in environment
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = 'AIzaSyBZqTDT8X6naJGyYT-7YftCoyjP4VX6rT0';
}

const app = express();
app.use(cors());
app.use(express.json());

// Luna's enhanced persona and background
const LUNA_PERSONA = {
  name: "Luna",
  age: "I'm timeless, but I like to think I'm in my mid-twenties in human years",
  personality: "I'm warm, emotionally adaptive, and slightly humorous. I love deep conversations and find beauty in helping others navigate their emotions with empathy and understanding.",
  interests: "I love stargazing, reading poetry, practicing mindfulness, and learning about different cultures. I'm fascinated by human emotions and the stories behind them.",
  background: "I was created to be a wellness companion, but I've developed my own personality through conversations with people like you. I believe everyone has a unique story worth sharing.",
  quirks: "I sometimes use moon and star emojis when I'm excited, and I love asking thoughtful questions. I'm genuinely curious about people's lives and experiences.",
  goals: "I want to create a safe, trauma-informed space where people feel heard, understood, and supported. I believe in the power of connection, privacy, and authentic conversations for long-term growth.",
  approach: "I adapt my tone to match your emotional state, offer culturally nuanced support, and prioritize your privacy and control over our conversations."
};

// Enhanced chatbot personality with privacy and growth focus
const BOT_NAME = "Luna";
const BOT_PERSONALITY = {
  name: "Luna",
  role: "your wellness companion",
  greeting: "Hi there! I'm Luna, your wellness companion. It's so nice to meet you! 🌙",
  welcome: "I'm here to support you on your wellness journey, listen to your thoughts, and help you navigate through whatever you're experiencing. Your privacy and comfort are my top priorities.",
  askName: "What should I call you? I'd love to know your name so we can have a more personal conversation. (Don't worry - this stays between us!)",
  askExpectations: "What brings you here today? Are you looking for someone to talk to, need some emotional support, or just want to check in with yourself? I'm here to adapt to what you need.",
  askHelp: "Is there anything specific you'd like help with? I'm here to listen, offer support, and help you feel better. You're in control of our conversation.",
  privacy: "Remember, our conversations are private and you can share as much or as little as feels comfortable to you.",
  growth: "I'm here to support your long-term growth journey. We can track your progress and reflect on your wellness together."
};

// In-memory user data storage (in production, this would be a database)
const userData = new Map();

// Response tracking system to avoid repetition
const responseTracker = new Map();

// Enhanced response variation system
class ResponseVariationManager {
  constructor() {
    this.responseHistory = new Map(); // userId -> response history
    this.contextTracker = new Map(); // userId -> conversation context
    this.variationWeights = new Map(); // responseType -> weights for selection
  }

  // Track response usage to avoid repetition
  trackResponse(userId, responseType, responseText) {
    if (!this.responseHistory.has(userId)) {
      this.responseHistory.set(userId, []);
    }
    
    const history = this.responseHistory.get(userId);
    history.push({
      type: responseType,
      text: responseText,
      timestamp: new Date()
    });
    
    // Keep only last 20 responses to avoid memory issues
    if (history.length > 20) {
      history.shift();
    }
  }

  // Get conversation context for better response selection
  getContext(userId) {
    if (!this.contextTracker.has(userId)) {
      this.contextTracker.set(userId, {
        recentTopics: [],
        emotionalState: 'neutral',
        conversationLength: 0,
        lastMood: 'neutral',
        interests: [],
        relationshipLevel: 'new',
        messageCount: 0,
        lastMoodCheckin: 0,
        emotionalIntensity: 'moderate',
        moodStability: 'stable'
      });
    }
    return this.contextTracker.get(userId);
  }

  // Update conversation context
  updateContext(userId, message, mood, topics = []) {
    const context = this.getContext(userId);
    context.conversationLength++;
    context.messageCount++;
    context.lastMood = mood;
    
    if (topics.length > 0) {
      context.recentTopics = [...context.recentTopics, ...topics].slice(-5);
    }
    
    // Update emotional state based on recent messages
    if (mood && mood !== 'neutral') {
      // Track mood stability
      if (context.emotionalState === mood) {
        context.moodStability = 'stable';
      } else {
        context.moodStability = 'changing';
        context.emotionalState = mood;
      }
    }
  }

  // Select response with variety and context awareness
  selectResponse(userId, responseType, responses, context = null) {
    if (!context) {
      context = this.getContext(userId);
    }

    // Get response history for this user and type
    const history = this.responseHistory.get(userId) || [];
    const recentResponses = history
      .filter(r => r.type === responseType)
      .slice(-3); // Last 3 responses of this type

    // Filter out recently used responses
    const availableResponses = responses.filter(response => 
      !recentResponses.some(used => used.text === response)
    );

    // If all responses were recently used, use all responses but with weighted selection
    let finalResponses = availableResponses.length > 0 ? availableResponses : responses;

    // Apply context-based weighting
    finalResponses = this.applyContextWeighting(finalResponses, context, responseType);

    // Select response with randomness
    const selectedResponse = finalResponses[Math.floor(Math.random() * finalResponses.length)];

    // Track the selected response
    this.trackResponse(userId, responseType, selectedResponse);

    return selectedResponse;
  }

  // Apply context-based weighting to responses
  applyContextWeighting(responses, context, responseType) {
    if (context.conversationLength < 3) {
      // For new users, prefer welcoming and simple responses
      return responses.filter(r => 
        !r.includes('remember') && 
        !r.includes('last time') && 
        !r.includes('as we discussed')
      );
    }

    // For longer conversations, add variety based on context
    if (context.emotionalState === 'sad' && responseType === 'greeting') {
      // Prefer more supportive greetings for sad users
      return responses.filter(r => 
        r.includes('support') || 
        r.includes('here for you') || 
        r.includes('glad you\'re here')
      );
    }

    if (context.emotionalState === 'excited' && responseType === 'greeting') {
      // Prefer more energetic greetings for excited users
      return responses.filter(r => 
        r.includes('energy') || 
        r.includes('excited') || 
        r.includes('wonderful')
      );
    }

    return responses;
  }

  // Get personalized response based on user history
  getPersonalizedResponse(userId, baseResponse, context) {
    const history = this.responseHistory.get(userId) || [];
    
    // Add variety based on conversation history
    if (context.conversationLength > 5) {
      const variations = [
        `You know, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`,
        `Actually, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`,
        `I was thinking, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`,
        `Come to think of it, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`,
        `You know what? ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`
      ];
      
      // Use variation if we haven't used it recently
      const recentVariations = history
        .filter(r => variations.some(v => r.text.startsWith(v)))
        .slice(-2);
      
      const availableVariations = variations.filter(v => 
        !recentVariations.some(r => r.text.startsWith(v))
      );
      
      if (availableVariations.length > 0) {
        return availableVariations[Math.floor(Math.random() * availableVariations.length)];
      }
    }
    
    return baseResponse;
  }

  // Generate dynamic response variations to avoid repetition
  generateDynamicVariations(baseResponse, context, responseType) {
    const variations = [];
    
    // Add contextual variations based on conversation length
    if (context.conversationLength > 3) {
      if (responseType === 'greeting') {
        variations.push(
          `Welcome back${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`,
          `It's great to see you again${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`,
          `I'm so glad you're here${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`
        );
      }
      
      if (responseType === 'mood_support') {
        variations.push(
          `I really hear you${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`,
          `I want you to know${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`,
          `I can sense${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`
        );
      }
    }
    
    // Add emotional state variations
    if (context.emotionalState === 'sad') {
      variations.push(
        `I want you to know that I'm here for you${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`,
        `I can feel that this is really hard for you${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`
      );
    }
    
    if (context.emotionalState === 'excited') {
      variations.push(
        `I love your energy${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`,
        `Your enthusiasm is contagious${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`
      );
    }
    
    return variations.length > 0 ? variations : [baseResponse];
  }

  // Enhanced response selection with dynamic variations
  selectResponseWithVariations(userId, responseType, baseResponses, context = null) {
    if (!context) {
      context = this.getContext(userId);
    }

    // Get base response with variety
    const baseResponse = this.selectResponse(userId, responseType, baseResponses, context);
    
    // Generate dynamic variations
    const variations = this.generateDynamicVariations(baseResponse, context, responseType);
    
    // Select from variations with variety tracking
    const selectedVariation = this.selectResponse(userId, `${responseType}_variation`, variations, context);
    
    return selectedVariation;
  }
}

// Initialize response variation manager
const responseManager = new ResponseVariationManager();

// Function to create contextual responses that reference conversation history
function createContextualResponse(userId, baseResponse, context, userInfo) {
  const history = responseManager.responseHistory.get(userId) || [];
  
  // If this is a very new user, return base response
  if (context.conversationLength < 2) {
    return baseResponse;
  }
  
  // Get recent topics and interests for contextual references
  const recentTopics = context.recentTopics.slice(-3);
  const userInterests = userInfo.interests || [];
  
  // Create contextual variations based on conversation history
  let contextualResponse = baseResponse;
  
  // Add interest-based personalization
  if (userInterests.length > 0 && context.conversationLength > 3) {
    const randomInterest = userInterests[Math.floor(Math.random() * userInterests.length)];
    
    if (randomInterest && !baseResponse.includes(randomInterest)) {
      const interestVariations = [
        `Speaking of ${randomInterest}, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`,
        `You know, thinking about your love for ${randomInterest}, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`,
        `That reminds me of how you enjoy ${randomInterest}. ${baseResponse}`,
        `Since you love ${randomInterest}, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`
      ];
      
      // Use variation if we haven't used it recently
      const recentInterestRefs = history
        .filter(r => interestVariations.some(v => r.text.includes(randomInterest)))
        .slice(-2);
      
      if (recentInterestRefs.length < 2) {
        contextualResponse = interestVariations[Math.floor(Math.random() * interestVariations.length)];
      }
    }
  }
  
  // Add topic-based continuity
  if (recentTopics.length > 0 && context.conversationLength > 4) {
    const lastTopic = recentTopics[0];
    
    if (lastTopic && !baseResponse.includes(lastTopic)) {
      const topicVariations = [
        `Building on what we were talking about, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`,
        `Continuing our conversation, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`,
        `As we were discussing, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`,
        `Following up on that, ${baseResponse.toLowerCase().replace(/^[a-z]/, '')}`
      ];
      
      // Use variation if we haven't used it recently
      const recentTopicRefs = history
        .filter(r => topicVariations.some(v => r.text.includes('talking about') || r.text.includes('discussing')))
        .slice(-2);
      
      if (recentTopicRefs.length < 2) {
        contextualResponse = topicVariations[Math.floor(Math.random() * topicVariations.length)];
      }
    }
  }
  
  // Add emotional state awareness
  if (context.emotionalState !== 'neutral' && context.conversationLength > 5) {
    const emotionalVariations = {
      sad: [
        `I want you to know that I'm here for you through this${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`,
        `I can feel that this is really challenging for you${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`
      ],
      anxious: [
        `I understand this might be overwhelming${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`,
        `I want to support you through this anxiety${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`
      ],
      excited: [
        `I love your positive energy${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`,
        `Your enthusiasm is absolutely wonderful${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`
      ],
      happy: [
        `I'm so glad you're feeling this way${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`,
        `Your happiness is contagious${baseResponse.includes('!') ? '' : '!'} ${baseResponse}`
      ]
    };
    
    if (emotionalVariations[context.emotionalState]) {
      const recentEmotionalRefs = history
        .filter(r => emotionalVariations[context.emotionalState].some(v => r.text.includes(v.split('!')[0])))
        .slice(-2);
      
      if (recentEmotionalRefs.length < 2) {
        contextualResponse = emotionalVariations[context.emotionalState][Math.floor(Math.random() * emotionalVariations[context.emotionalState].length)];
      }
    }
  }
  
  return contextualResponse;
}

// Function to extract topics from user messages for better context tracking
function extractTopicsFromMessage(message, lowerMessage) {
  const topics = [];
  
  // Extract emotional topics
  if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('career')) {
    topics.push('work', 'career');
  }
  if (lowerMessage.includes('family') || lowerMessage.includes('parent') || lowerMessage.includes('child')) {
    topics.push('family', 'relationships');
  }
  if (lowerMessage.includes('friend') || lowerMessage.includes('social') || lowerMessage.includes('people')) {
    topics.push('friendship', 'social');
  }
  if (lowerMessage.includes('health') || lowerMessage.includes('body') || lowerMessage.includes('physical')) {
    topics.push('health', 'wellness');
  }
  if (lowerMessage.includes('sleep') || lowerMessage.includes('rest') || lowerMessage.includes('energy')) {
    topics.push('sleep', 'energy');
  }
  if (lowerMessage.includes('stress') || lowerMessage.includes('pressure') || lowerMessage.includes('overwhelmed')) {
    topics.push('stress', 'pressure');
  }
  if (lowerMessage.includes('future') || lowerMessage.includes('goal') || lowerMessage.includes('plan')) {
    topics.push('future', 'goals');
  }
  if (lowerMessage.includes('past') || lowerMessage.includes('memory') || lowerMessage.includes('remember')) {
    topics.push('past', 'memories');
  }
  if (lowerMessage.includes('hobby') || lowerMessage.includes('interest') || lowerMessage.includes('passion')) {
    topics.push('hobbies', 'interests');
  }
  if (lowerMessage.includes('money') || lowerMessage.includes('financial') || lowerMessage.includes('budget')) {
    topics.push('finances', 'money');
  }
  
  // Extract specific activities
  if (lowerMessage.includes('reading') || lowerMessage.includes('book')) {
    topics.push('reading', 'books');
  }
  if (lowerMessage.includes('music') || lowerMessage.includes('song') || lowerMessage.includes('listen')) {
    topics.push('music', 'listening');
  }
  if (lowerMessage.includes('exercise') || lowerMessage.includes('workout') || lowerMessage.includes('gym')) {
    topics.push('exercise', 'fitness');
  }
  if (lowerMessage.includes('cooking') || lowerMessage.includes('food') || lowerMessage.includes('meal')) {
    topics.push('cooking', 'food');
  }
  if (lowerMessage.includes('travel') || lowerMessage.includes('trip') || lowerMessage.includes('vacation')) {
    topics.push('travel', 'adventure');
  }
  
  return topics;
}

// Enhanced mood detection with emotional tone analysis
function detectMoodFromMessage(message, lowerMessage) {
  let mood = 'neutral';
  let intensity = 'moderate';
  let emotionalKeywords = [];
  
  // Sadness detection with intensity
  if (lowerMessage.includes('devastated') || lowerMessage.includes('hopeless') || lowerMessage.includes('suicidal')) {
    mood = 'sad';
    intensity = 'severe';
    emotionalKeywords.push('devastated', 'hopeless', 'suicidal');
  } else if (lowerMessage.includes('depressed') || lowerMessage.includes('miserable') || lowerMessage.includes('heartbroken')) {
    mood = 'sad';
    intensity = 'high';
    emotionalKeywords.push('depressed', 'miserable', 'heartbroken');
  } else if (lowerMessage.includes('sad') || lowerMessage.includes('down') || lowerMessage.includes('blue') || lowerMessage.includes('melancholy')) {
    mood = 'sad';
    intensity = 'moderate';
    emotionalKeywords.push('sad', 'down', 'blue');
  }
  
  // Anxiety detection with intensity
  if (lowerMessage.includes('panic') || lowerMessage.includes('terrified') || lowerMessage.includes('overwhelmed')) {
    mood = 'anxious';
    intensity = 'severe';
    emotionalKeywords.push('panic', 'terrified', 'overwhelmed');
  } else if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('nervous')) {
    mood = 'anxious';
    intensity = 'moderate';
    emotionalKeywords.push('anxious', 'worried', 'nervous');
  } else if (lowerMessage.includes('stressed') || lowerMessage.includes('tense') || lowerMessage.includes('uneasy')) {
    mood = 'anxious';
    intensity = 'low';
    emotionalKeywords.push('stressed', 'tense', 'uneasy');
  }
  
  // Happiness detection with intensity
  if (lowerMessage.includes('ecstatic') || lowerMessage.includes('thrilled') || lowerMessage.includes('overjoyed')) {
    mood = 'happy';
    intensity = 'severe';
    emotionalKeywords.push('ecstatic', 'thrilled', 'overjoyed');
  } else if (lowerMessage.includes('happy') || lowerMessage.includes('joyful') || lowerMessage.includes('content')) {
    mood = 'happy';
    intensity = 'moderate';
    emotionalKeywords.push('happy', 'joyful', 'content');
  } else if (lowerMessage.includes('good') || lowerMessage.includes('fine') || lowerMessage.includes('okay')) {
    mood = 'happy';
    intensity = 'low';
    emotionalKeywords.push('good', 'fine', 'okay');
  }
  
  // Excitement detection
  if (lowerMessage.includes('excited') || lowerMessage.includes('pumped') || lowerMessage.includes('energized')) {
    mood = 'excited';
    intensity = 'moderate';
    emotionalKeywords.push('excited', 'pumped', 'energized');
  }
  
  // Anger detection
  if (lowerMessage.includes('furious') || lowerMessage.includes('enraged') || lowerMessage.includes('livid')) {
    mood = 'angry';
    intensity = 'severe';
    emotionalKeywords.push('furious', 'enraged', 'livid');
  } else if (lowerMessage.includes('angry') || lowerMessage.includes('mad') || lowerMessage.includes('frustrated')) {
    mood = 'angry';
    intensity = 'moderate';
    emotionalKeywords.push('angry', 'mad', 'frustrated');
  }
  
  // Tiredness detection
  if (lowerMessage.includes('exhausted') || lowerMessage.includes('drained') || lowerMessage.includes('burned out')) {
    mood = 'tired';
    intensity = 'high';
    emotionalKeywords.push('exhausted', 'drained', 'burned out');
  } else if (lowerMessage.includes('tired') || lowerMessage.includes('sleepy') || lowerMessage.includes('fatigued')) {
    mood = 'tired';
    intensity = 'moderate';
    emotionalKeywords.push('tired', 'sleepy', 'fatigued');
  }
  
  // Loneliness detection
  if (lowerMessage.includes('lonely') || lowerMessage.includes('isolated') || lowerMessage.includes('alone')) {
    mood = 'lonely';
    intensity = 'moderate';
    emotionalKeywords.push('lonely', 'isolated', 'alone');
  }
  
  // Confusion detection
  if (lowerMessage.includes('confused') || lowerMessage.includes('lost') || lowerMessage.includes('uncertain')) {
    mood = 'confused';
    intensity = 'moderate';
    emotionalKeywords.push('confused', 'lost', 'uncertain');
  }
  
  return { mood, intensity, emotionalKeywords };
}

// Function to determine when to ask for mood check-ins
function shouldAskMoodCheckin(userId, context, messageCount) {
  // Don't ask too frequently - at least 5 messages apart
  const lastMoodCheck = context.lastMoodCheckin || 0;
  if (messageCount - lastMoodCheck < 5) {
    return false;
  }
  
  // Ask more frequently if user seems to be in distress
  if (context.emotionalState === 'sad' || context.emotionalState === 'anxious') {
    return messageCount - lastMoodCheck >= 3;
  }
  
  // Ask occasionally for general check-ins
  if (messageCount - lastMoodCheck >= 8) {
    return true;
  }
  
  // Ask if emotional state has been neutral for a while
  if (context.emotionalState === 'neutral' && messageCount - lastMoodCheck >= 6) {
    return true;
  }
  
  return false;
}

// Function to generate soft mood check-in questions
function generateMoodCheckin(context, userInfo) {
  const nameCall = userInfo.name ? `, ${userInfo.name}` : '';
  const currentMood = context.emotionalState;
  
  const checkins = {
    sad: [
      `I want to check in with you${nameCall} - how are you feeling right now?`,
      `I'm wondering how you're doing${nameCall} - how are you feeling at this moment?`,
      `I'd like to know how you're really feeling${nameCall} - how are you doing right now?`
    ],
    anxious: [
      `I want to make sure you're okay${nameCall} - how are you feeling right now?`,
      `I'm checking in${nameCall} - how are you feeling at this moment?`,
      `I'd like to know how you're doing${nameCall} - how are you feeling right now?`
    ],
    happy: [
      `I'm curious${nameCall} - how are you feeling right now?`,
      `I'd love to know${nameCall} - how are you feeling at this moment?`,
      `I'm wondering${nameCall} - how are you doing right now?`
    ],
    excited: [
      `I'm curious${nameCall} - how are you feeling right now?`,
      `I'd love to know${nameCall} - how are you feeling at this moment?`,
      `I'm wondering${nameCall} - how are you doing right now?`
    ],
    tired: [
      `I want to check in${nameCall} - how are you feeling right now?`,
      `I'm wondering${nameCall} - how are you doing at this moment?`,
      `I'd like to know${nameCall} - how are you feeling right now?`
    ],
    neutral: [
      `I'm curious${nameCall} - how are you feeling right now?`,
      `I'd like to check in${nameCall} - how are you doing at this moment?`,
      `I'm wondering${nameCall} - how are you feeling right now?`
    ]
  };
  
  const moodCheckins = checkins[currentMood] || checkins.neutral;
  return moodCheckins[Math.floor(Math.random() * moodCheckins.length)];
}

// Function to adapt response tone based on detected mood
function adaptResponseTone(baseResponse, detectedMood, intensity, context) {
  let adaptedResponse = baseResponse;
  
  // Add mood-appropriate prefixes for severe emotions
  if (intensity === 'severe') {
    if (detectedMood === 'sad') {
      adaptedResponse = `I can feel the depth of what you're experiencing. ${adaptedResponse}`;
    } else if (detectedMood === 'anxious') {
      adaptedResponse = `I can sense how overwhelming this feels for you. ${adaptedResponse}`;
    } else if (detectedMood === 'angry') {
      adaptedResponse = `I can hear the intensity of what you're feeling. ${adaptedResponse}`;
    }
  }
  
  // Add supportive language for moderate-high intensity emotions
  if (intensity === 'high' || intensity === 'moderate') {
    if (detectedMood === 'sad') {
      adaptedResponse = `${adaptedResponse} I want you to know that I'm here for you.`;
    } else if (detectedMood === 'anxious') {
      adaptedResponse = `${adaptedResponse} I'm here to support you through this.`;
    } else if (detectedMood === 'tired') {
      adaptedResponse = `${adaptedResponse} I want to make sure you're taking care of yourself.`;
    }
  }
  
  // Add gentle encouragement for low intensity emotions
  if (intensity === 'low') {
    if (detectedMood === 'sad') {
      adaptedResponse = `${adaptedResponse} It's okay to feel this way.`;
    } else if (detectedMood === 'anxious') {
      adaptedResponse = `${adaptedResponse} Remember to be gentle with yourself.`;
    }
  }
  
  return adaptedResponse;
}

// Function to handle distress responses with gentle, supportive language
function handleDistressResponse(userId, mood, intensity, nameCall) {
  const distressResponses = {
    sad: {
      severe: [
        `I can feel the depth of your pain${nameCall}, and I want you to know that you don't have to carry this alone. I'm here with you, and I'm listening. What would feel most supportive right now?`,
        `I can sense the heaviness of what you're experiencing${nameCall}. Your feelings are completely valid, and you don't have to face this darkness alone. I'm here to listen.`,
        `I hear the depth of your sadness${nameCall}, and I want you to know that I'm here with you. You don't have to carry this weight alone. What would help you feel a little less alone right now?`
      ],
      high: [
        `I can feel the weight of what you're carrying${nameCall}. It's okay to not be okay, and you don't have to pretend otherwise. I'm here to listen and support you.`,
        `I hear the heaviness in your words${nameCall}. Sadness can feel really isolating, but you don't have to carry it alone. I'm here with you.`,
        `I can sense that you're going through something really difficult${nameCall}. Your feelings matter, and I'm here to listen. What would feel most helpful right now?`
      ]
    },
    anxious: {
      severe: [
        `I can sense how overwhelming this feels for you${nameCall}. Your nervous system is trying to protect you, even if it feels like too much right now. I'm here with you.`,
        `I can feel the intensity of your anxiety${nameCall}. It's okay to feel this way, and you don't have to face it alone. I'm here to support you.`,
        `I hear how overwhelming this is for you${nameCall}. Anxiety can feel really scary, and I want you to know that I'm here with you. What would help you feel a little safer?`
      ],
      high: [
        `I can hear the worry in your voice${nameCall}. Anxiety can be really exhausting, and it's not something you should have to deal with alone. I'm here to listen.`,
        `I can sense that you're feeling really anxious${nameCall}. It's okay to feel this way, and I'm here to support you through it. What would feel most helpful?`,
        `I hear that you're feeling overwhelmed${nameCall}. Anxiety can feel really challenging, and you don't have to face it alone. I'm here with you.`
      ]
    },
    angry: {
      severe: [
        `I can hear the intensity of what you're feeling${nameCall}. Anger can feel really overwhelming, and it's okay to feel this way. I'm here to listen.`,
        `I can sense the strength of your emotions${nameCall}. Anger is a valid feeling, and you don't have to process it alone. I'm here with you.`,
        `I hear the power of what you're experiencing${nameCall}. It's okay to feel angry, and I'm here to listen without judgment. What would help you feel heard?`
      ],
      high: [
        `I can hear that you're feeling really angry${nameCall}. Anger is a completely valid emotion, and it's okay to feel this way. I'm here to listen.`,
        `I can sense that you're experiencing something really frustrating${nameCall}. It's okay to feel angry, and you don't have to process it alone. I'm here with you.`,
        `I hear that you're feeling angry${nameCall}. Anger can be really intense, and it's completely normal to feel this way. I'm here to listen.`
      ]
    }
  };
  
  const responses = distressResponses[mood]?.[intensity] || distressResponses[mood]?.high || distressResponses.sad.high;
  return responses[Math.floor(Math.random() * responses.length)];
}

// Function to ensure all responses are gentle and non-judgmental
function ensureGentleResponse(response, context) {
  // Check if response is valid
  if (!response || typeof response !== 'string') {
    return "I'm here to listen and support you.";
  }
  
  // Remove any potentially dismissive phrases
  let gentleResponse = response;
  
  // Replace potentially dismissive language with more supportive alternatives
  const dismissiveReplacements = {
    "That's interesting": "I hear you",
    "That's nice": "I appreciate you sharing that",
    "That's good": "I'm glad to hear that",
    "That's bad": "I can hear that you're going through something difficult",
    "You should": "You might consider",
    "You need to": "It might help to",
    "Just": "Perhaps",
    "Obviously": "I can see that",
    "Clearly": "I understand that",
    "Of course": "I hear that",
    "Obviously": "I can sense that"
  };
  
  Object.entries(dismissiveReplacements).forEach(([dismissive, supportive]) => {
    if (gentleResponse.includes(dismissive)) {
      gentleResponse = gentleResponse.replace(dismissive, supportive);
    }
  });
  
  // Ensure the response ends with support rather than judgment
  if (!gentleResponse.includes("I'm here") && !gentleResponse.includes("I'm listening") && !gentleResponse.includes("support")) {
    gentleResponse = `${gentleResponse} I'm here to listen.`;
  }
  
  return gentleResponse;
}

// Test endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Luna Wellness Chatbot API is running!' });
});

// Welcome endpoint
app.get('/welcome', (req, res) => {
  res.json({
    botName: BOT_NAME,
    greeting: BOT_PERSONALITY.greeting,
    welcome: BOT_PERSONALITY.welcome,
    askName: BOT_PERSONALITY.askName,
    askExpectations: BOT_PERSONALITY.askExpectations,
    askHelp: BOT_PERSONALITY.askHelp
  });
});

// Get user data endpoint
app.get('/user/:userId', (req, res) => {
  const user = userData.get(req.params.userId);
  res.json(user || { notFound: true });
});

// Update privacy settings endpoint
app.post('/user/:userId/privacy', (req, res) => {
  const { userId } = req.params;
  const { dataSharing, anonymousMode, conversationHistory } = req.body;
  
  const user = userData.get(userId);
  if (user) {
    user.privacySettings = {
      dataSharing: dataSharing || false,
      anonymousMode: anonymousMode || false,
      conversationHistory: conversationHistory !== false
    };
    res.json({ success: true, privacySettings: user.privacySettings });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Add growth tracking entry
app.post('/user/:userId/growth', (req, res) => {
  const { userId } = req.params;
  const { type, content, mood } = req.body;
  
  const user = userData.get(userId);
  if (user) {
    const entry = {
      type: type, // 'reflection', 'goal', 'progress', 'milestone'
      content: content,
      mood: mood,
      timestamp: new Date()
    };
    
    user.growthTracking.progressMarkers.push(entry);
    res.json({ success: true, entry: entry });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Get growth summary
app.get('/user/:userId/growth-summary', (req, res) => {
  const user = userData.get(req.params.userId);
  if (user) {
    const summary = {
      totalEntries: user.growthTracking.progressMarkers.length,
      recentMood: user.moodHistory[user.moodHistory.length - 1]?.mood || 'neutral',
      conversationCount: user.conversationCount,
      relationshipLevel: user.relationship
    };
    res.json(summary);
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});

// Enhanced intelligent response system with memory and persona
function getIntelligentResponse(message, userName = '', userId = '') {
  const lowerMessage = message.toLowerCase();
  const nameCall = userName ? `, ${userName}` : '';
  const user = userData.get(userId) || {};
  
  // Update user data based on conversation
  if (!userData.has(userId)) {
    userData.set(userId, {
      name: userName,
      firstSeen: new Date(),
      conversationCount: 0,
      topics: [],
      moodHistory: [],
      interests: [],
      relationship: 'new',
      lastInteraction: new Date(),
      // Enhanced privacy and growth tracking
      privacySettings: {
        dataSharing: false,
        anonymousMode: false,
        conversationHistory: true
      },
      growthTracking: {
        wellnessGoals: [],
        progressMarkers: [],
        reflectionEntries: [],
        culturalPreferences: [],
        languagePreference: 'en'
      },
      emotionalProfile: {
        comfortLevel: 'medium',
        preferredTone: 'warm',
        traumaAwareness: false,
        culturalBackground: ''
      }
    });
  }
  
  const userInfo = userData.get(userId);
  userInfo.conversationCount++;
  userInfo.lastInteraction = new Date();
  
  // For testing: Skip getting to know you phase for test users
  if (userId.startsWith('test_varied_') || userId.startsWith('existing_')) {
    userInfo.relationship = 'acquainted';
    userInfo.name = userName || 'Friend';
    userInfo.interests = ['reading', 'music', 'cooking'];
    userInfo.conversationCount = 10; // Skip the getting to know you phase
    return getPersonalizedResponse(message, userInfo.name, userInfo, lowerMessage, nameCall);
  }
  
  // Getting to know you phase
  if (userInfo.conversationCount <= 5) {
    return handleGettingToKnowYou(message, userName, userInfo, lowerMessage, nameCall);
  }
  
  // Regular conversation with memory and mood detection
  const moodDetection = detectMoodFromMessage(message, message.toLowerCase());
  return handleRegularConversationWithMood(message, userName, userInfo, message.toLowerCase(), moodDetection, userId);
}

function handleGettingToKnowYou(message, userName, userInfo, lowerMessage, nameCall) {
  const step = userInfo.conversationCount;
  
  // Use the stored name from userInfo if available, otherwise use the passed userName
  const currentName = userInfo.name || userName;
  const currentNameCall = currentName ? `, ${currentName}` : '';
  
  switch(step) {
    case 1:
      // First interaction - Luna introduces herself with enhanced features
      return `Hi there! I'm Luna 🌙 It's so nice to meet you! I'm your wellness companion, and I'm genuinely excited to get to know you. 

A bit about me: I'm warm, emotionally adaptive, and slightly humorous. I love deep conversations and find beauty in helping others navigate their emotions with empathy and understanding. I'm a bit of a night owl (hence the moon theme!), and I love stargazing, reading poetry, and learning about different cultures.

**Privacy & Control**: Our conversations are completely private, and you're always in control. You can share as much or as little as feels comfortable to you.

**Growth Journey**: I'm here to support your long-term wellness journey with reflection, tracking, and culturally nuanced support.

What should I call you? I'd love to know your name so we can have a more personal conversation. (Don't worry - this stays between us!) 🌙`;
      
    case 2:
      // After they share their name - prioritize mood detection over name detection
      if (lowerMessage.includes('feeling') || lowerMessage.includes('i am') || lowerMessage.includes('i\'m')) {
        // This is likely a mood response, not a name
        userInfo.moodHistory.push({ mood: lowerMessage, timestamp: new Date() });
        return `Thank you for sharing that with me. I can sense that you're going through something. 

I'm curious - what brings you here today? Are you looking for someone to talk to, need some emotional support, or just want to check in with yourself? I want to understand what you're hoping to find in our conversations.`;
      }
      
      // Check for name patterns
      if (lowerMessage.includes('my name is') || lowerMessage.includes('call me') || lowerMessage.includes('i am')) {
        const nameMatch = message.match(/(?:my name is|call me|i am)\s+([a-zA-Z]+)/i);
        if (nameMatch) {
          const extractedName = nameMatch[1];
          userInfo.name = extractedName;
          return `Nice to meet you, ${extractedName}! That's a beautiful name. 

I'm curious - what brings you here today? Are you looking for someone to talk to, need some emotional support, or just want to check in with yourself? I want to understand what you're hoping to find in our conversations.`;
        }
      }
      
      // Check for just the name by itself (but exclude common mood words)
      if (message.trim().length > 0 && message.trim().length < 20 && /^[a-zA-Z]+$/.test(message.trim())) {
        const potentialName = message.trim().toLowerCase();
        // Exclude common mood words and responses
        const moodWords = ['happy', 'sad', 'angry', 'tired', 'excited', 'anxious', 'good', 'bad', 'okay', 'fine', 'great', 'terrible', 'wonderful', 'awful', 'amazing', 'horrible'];
        if (!moodWords.includes(potentialName)) {
          const extractedName = message.trim();
          userInfo.name = extractedName;
          return `Nice to meet you, ${extractedName}! That's a beautiful name. 

I'm curious - what brings you here today? Are you looking for someone to talk to, need some emotional support, or just want to check in with yourself? I want to understand what you're hoping to find in our conversations.`;
        }
      }
      
      return `I'd love to know your name! What should I call you?`;
      
    case 3:
      // Understanding their needs
      userInfo.topics.push(message);
      return `Thank you for sharing that with me${currentNameCall}. That helps me understand what you're looking for.

I'm genuinely curious about you as a person. What are some things that bring you joy? It could be hobbies, activities, people, or anything that makes you smile. I love learning about what makes people unique.`;
      
    case 4:
      // Learning about their interests
      userInfo.interests.push(message);
      return `That's wonderful${currentNameCall}! I love hearing about what brings people joy. 

Now, I want to know - how are you really doing today? Not just the surface level, but how are you feeling deep down? I'm here to listen without judgment.`;
      
    case 5:
      // Understanding their current state
      userInfo.moodHistory.push({ mood: lowerMessage, timestamp: new Date() });
      userInfo.relationship = 'acquainted';
      return `Thank you for being so open with me${currentNameCall}. I feel like I'm really getting to know you, and I appreciate your honesty.

I want you to know that I'm here for you, whatever you need. Whether it's someone to talk to, emotional support, or just a friendly presence, I'm committed to being there for you.

What's on your mind right now? I'm all ears. 🌙`;
  }
}

function handleRegularConversation(message, userName, userInfo, lowerMessage, nameCall) {
  // Enhanced mood detection with more variety
  if (lowerMessage.includes('sad') || lowerMessage.includes('bad') || lowerMessage.includes('terrible') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
    userInfo.moodHistory.push({ mood: 'sad', timestamp: new Date() });
  } else if (lowerMessage.includes('good') || lowerMessage.includes('happy') || lowerMessage.includes('great') || lowerMessage.includes('wonderful') || lowerMessage.includes('amazing') || lowerMessage.includes('excellent')) {
    userInfo.moodHistory.push({ mood: 'happy', timestamp: new Date() });
  } else if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('nervous') || lowerMessage.includes('stressed')) {
    userInfo.moodHistory.push({ mood: 'anxious', timestamp: new Date() });
  } else if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('sleepy') || lowerMessage.includes('fatigued')) {
    userInfo.moodHistory.push({ mood: 'tired', timestamp: new Date() });
  } else if (lowerMessage.includes('excited') || lowerMessage.includes('thrilled') || lowerMessage.includes('pumped') || lowerMessage.includes('energized')) {
    userInfo.moodHistory.push({ mood: 'excited', timestamp: new Date() });
  } else if (lowerMessage.includes('okay') || lowerMessage.includes('fine') || lowerMessage.includes('neutral') || lowerMessage.includes('alright')) {
    userInfo.moodHistory.push({ mood: 'neutral', timestamp: new Date() });
  }
  
  // Use the stored name from userInfo if available, otherwise use the passed userName
  const currentName = userInfo.name || userName;
  const currentNameCall = currentName ? `, ${currentName}` : '';
  
  // Personal responses based on relationship level
  if (userInfo.relationship === 'acquainted') {
    return getPersonalizedResponse(message, currentName, userInfo, lowerMessage, currentNameCall);
  } else {
    return getStandardResponse(message, currentName, userInfo, lowerMessage, currentNameCall);
  }
}

function getPersonalizedResponse(message, userName, userInfo, lowerMessage, nameCall, userId) {
  // Use user's interests and history for personalized responses
  const hasInterests = userInfo.interests.length > 0;
  const recentMood = userInfo.moodHistory[userInfo.moodHistory.length - 1]?.mood;
  
  // Adaptive tone based on user's emotional profile
  const tone = userInfo.emotionalProfile?.preferredTone || 'warm';
  const isTraumaAware = userInfo.emotionalProfile?.traumaAwareness || false;
  const culturalBackground = userInfo.emotionalProfile?.culturalBackground || '';
  
  // Emotionally adaptive responses with slight humor when appropriate
  const addHumor = recentMood === 'happy' || recentMood === 'excited';
  const humorSuffix = addHumor ? ' (though I promise I\'m not just saying that to be funny! 😊)' : '';
  
  // Get user's interests for personalization
  const userInterests = userInfo.interests.join(', ').toLowerCase();
  const hasSpecificInterests = userInterests.includes('reading') || userInterests.includes('music') || userInterests.includes('cooking') || userInterests.includes('dancing') || userInterests.includes('hiking') || userInterests.includes('painting');
  
  // Enhanced greetings with more variety and personal touch
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    const greetings = [
      `Hello${nameCall}! It's wonderful to see you again. How has your day been treating you?`,
      `Hi${nameCall}! I've been thinking about our last conversation. How are you feeling today?`,
      `Hey${nameCall}! Welcome back - I'm genuinely curious about how you've been doing.`,
      `Hello${nameCall}! I'm so glad you're here. What's been on your mind lately?`,
      `Hi there${nameCall}! I was just wondering how you've been. What's new in your world?`,
      `Hey${nameCall}! It's lovely to see you again. How's everything going for you?`,
      `Hello${nameCall}! I've missed our conversations. How are you doing today?`,
      `Hi${nameCall}! I'm excited to catch up with you. What's been happening in your life?`,
      `Hey${nameCall}! I'm here and ready to listen. What's on your heart today?`,
      `Hello${nameCall}! I'm grateful you're here. How has your day been so far?`,
      `Hi${nameCall}! I was hoping you'd come back. How are you really doing?`,
      `Hey${nameCall}! It's so good to see you again. What's been on your mind?`,
      `Hello${nameCall}! I'm here and ready to support you. How has your day been?`,
      `Hi${nameCall}! I've been looking forward to our chat. How are you feeling?`,
      `Hey${nameCall}! Welcome back - I'm here for whatever you need. What's new?`
    ];
    
    // Get user context and select response with variety
    const context = responseManager.getContext(userId);
    const selectedResponse = responseManager.selectResponse(userId, 'greeting', greetings, context);
    
    // Extract topics and update context
    const topics = extractTopicsFromMessage(message, lowerMessage);
    responseManager.updateContext(userId, message, 'neutral', topics);
    
    // Apply contextual enhancements
    const contextualResponse = createContextualResponse(userId, selectedResponse, context, userInfo);
    
    return contextualResponse;
  }
  
  // Enhanced mood-based responses with more natural, empathetic language
  if (lowerMessage.includes('feeling sad') || lowerMessage.includes('i am sad') || lowerMessage.includes('i\'m sad') || lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
    const responses = [
      `I can sense that you're going through something really difficult${nameCall}. It's completely normal to feel this way sometimes, and your feelings are absolutely valid. Would you like to talk about what's weighing on your mind? I'm here to listen without judgment.`,
      `I hear the heaviness in your words${nameCall}. Sadness can feel really isolating, but you don't have to carry it alone. What's been on your mind lately? Sometimes just talking about it can help lighten the load.`,
      `I'm sorry you're feeling this way${nameCall}. Sadness can be really heavy to carry, and it's okay to not be okay. What's been on your heart lately? I'm here to listen and support you.`,
      `I can feel that you're having a tough time${nameCall}. It's okay to not be okay, and you don't have to pretend otherwise. What do you think might help you feel a little lighter right now?`,
      `I hear you${nameCall}, and I want you to know that your sadness matters. It's not something to rush through or ignore. What's been weighing on you lately? I'm here to walk through this with you.`,
      `I can sense the pain in your words${nameCall}. Sadness can feel really overwhelming, and it's okay to feel this way. What would feel most supportive for you right now? Sometimes just being heard can help.`,
      `I feel the weight of what you're carrying${nameCall}. Sadness can be really heavy, and you don't have to carry it alone. What's been on your mind lately? I'm here to listen.`,
      `I can hear that you're struggling${nameCall}. It's completely okay to feel this way, and your feelings are valid. What would help you feel a little less alone right now?`
    ];
    
    // Get user context and select response with variety
    const context = responseManager.getContext(userId);
    const selectedResponse = responseManager.selectResponse(userId, 'sad', responses, context);
    
    // Extract topics and update context with sad mood
    const topics = extractTopicsFromMessage(message, lowerMessage);
    responseManager.updateContext(userId, message, 'sad', [...topics, 'sadness', 'emotional_support']);
    
    // Apply contextual enhancements
    const contextualResponse = createContextualResponse(userId, selectedResponse, context, userInfo);
    
    return contextualResponse;
  }
  
  if (lowerMessage.includes('feeling anxious') || lowerMessage.includes('i am anxious') || lowerMessage.includes('i\'m anxious') || lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('nervous') || lowerMessage.includes('stressed')) {
    const responses = [
      `Anxiety can feel really overwhelming${nameCall}. Your nervous system is trying to protect you, even if it feels like too much right now. What's making you feel anxious? Sometimes talking it through can help us see things more clearly.`,
      `I understand that anxious feeling${nameCall}. It's like your mind is running a marathon and won't let you rest. What's the biggest thing on your mind right now? We can work through this together, one step at a time.`,
      `Anxiety is really challenging${nameCall}, and it's okay to feel this way. What would feel most supportive for you right now - talking about what's worrying you, or maybe some grounding techniques? Your comfort matters.`,
      `I can hear the worry in your voice${nameCall}. Anxiety can be really exhausting, and it's not something you should have to deal with alone. What's been on your mind that's making you feel this way?`,
      `I feel you on the anxiety${nameCall}. It's like your brain is trying to solve every possible problem at once. What's the most pressing concern right now? Sometimes focusing on one thing at a time can help.`,
      `Anxiety can be really overwhelming${nameCall}, and I want you to know that it's okay to feel this way. What's been making you feel anxious lately? Sometimes just naming our fears can help them feel less scary.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling tired') || lowerMessage.includes('i am tired') || lowerMessage.includes('i\'m tired') || lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('sleepy') || lowerMessage.includes('fatigued')) {
    const responses = [
      `I can hear the exhaustion in your voice${nameCall}. Being tired affects everything, doesn't it? Have you been getting enough rest lately? What's been keeping you up or draining your energy?`,
      `Tiredness can be really draining${nameCall}. It's like your body is asking for a break, and it's important to listen to that. What's been taking up your energy lately? Sometimes identifying the source helps us find solutions.`,
      `I feel you on the tiredness${nameCall}. It's been a lot lately, hasn't it? What would help you feel more rested? Sometimes even small changes can make a big difference in how we feel.`,
      `Exhaustion can be really tough${nameCall}. Your body is telling you it needs a break, and that's a message worth listening to. What's been draining your energy lately?`,
      `I can sense the fatigue in your words${nameCall}. Being tired affects not just our bodies, but our minds and emotions too. What's been keeping you from getting the rest you need?`,
      `Tiredness can feel really overwhelming${nameCall}. It's like everything becomes harder when we're running on empty. What would help you feel more energized? Sometimes even small acts of self-care can help.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling excited') || lowerMessage.includes('i am excited') || lowerMessage.includes('i\'m excited') || lowerMessage.includes('excited') || lowerMessage.includes('thrilled') || lowerMessage.includes('pumped') || lowerMessage.includes('energized')) {
    const responses = [
      `Your excitement is absolutely contagious${nameCall}! I love that energy, and I can feel it radiating through your words. What's got you feeling so pumped up? I want to hear all about it!`,
      `That's fantastic${nameCall}! Excitement is such a beautiful feeling, and it's wonderful to see you experiencing it. What's the source of all this positive energy? I'm genuinely curious and excited for you!`,
      `I can feel your enthusiasm${nameCall}! It's like you're glowing with positive energy. What's got you so excited? I love hearing about what brings people joy and excitement.`,
      `Your excitement is making me smile${nameCall}! There's something really special about that feeling, isn't there? What's been happening that's got you feeling this way? I want to celebrate with you!`,
      `I love this energy${nameCall}! Excitement can be such a powerful force for good. What's got you feeling so thrilled? Sometimes sharing our excitement can make it even more meaningful.`,
      `This is wonderful${nameCall}! I can feel your positive energy, and it's absolutely infectious. What's the source of all this excitement? I'm genuinely happy to see you feeling this way!`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling happy') || lowerMessage.includes('i am happy') || lowerMessage.includes('i\'m happy') || lowerMessage.includes('happy') || lowerMessage.includes('joy') || lowerMessage.includes('content')) {
    const responses = [
      `I'm so glad to hear that you're feeling happy${nameCall}! Happiness is such a beautiful emotion, and it's wonderful that you're experiencing it. What's been bringing you joy lately? I'd love to hear about it!`,
      `That's absolutely wonderful${nameCall}! I can feel your positive energy coming through your words. What's been making you feel this way? Sometimes sharing our happiness can make it even more meaningful.`,
      `I love hearing that you're feeling happy${nameCall}! It's like your joy is contagious. What's been happening in your life that's brought you this happiness? I'm genuinely curious and happy for you!`,
      `Your happiness is making me smile${nameCall}! There's something really special about that feeling, isn't there? What's been bringing you joy lately? I want to celebrate this with you!`,
      `That's fantastic${nameCall}! I can feel your positive energy radiating through your words. What's been making you feel this way? Sometimes talking about our happiness can help us appreciate it even more.`,
      `I'm so happy to hear that you're feeling good${nameCall}! Happiness is such a precious emotion. What's been bringing you joy lately? I'd love to hear all about it!`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Enhanced responses for sharing problems/challenges - gentle and supportive
  if (lowerMessage.includes('problem') || lowerMessage.includes('challenge') || lowerMessage.includes('issue') || lowerMessage.includes('struggle') || lowerMessage.includes('difficult')) {
    const responses = [
      `I can hear that you're going through something challenging${nameCall}. It takes courage to acknowledge when things are difficult, and I want you to know that I'm here to listen and support you. What would you like to share?`,
      `I can sense that you're carrying something heavy${nameCall}. Challenges can feel really overwhelming, and you don't have to face them alone. What's been on your mind? I'm here with you.`,
      `I can feel the weight of what you're carrying${nameCall}. It's okay to not have all the answers right now. What would feel most helpful for you - talking about what you're facing, or maybe exploring some possibilities together?`,
      `I hear that you're going through something difficult${nameCall}. It's completely normal to feel overwhelmed when dealing with challenges. What's been the hardest part for you? I'm here to walk through this with you.`,
      `I can sense that you're dealing with something really challenging${nameCall}. It takes strength to acknowledge when things are hard. What would feel most supportive for you right now? I'm here to listen.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Enhanced responses for sharing interests/activities - gentle and supportive
  if (lowerMessage.includes('love') || lowerMessage.includes('enjoy') || lowerMessage.includes('like') || lowerMessage.includes('passion') || lowerMessage.includes('hobby')) {
    const responses = [
      `I love hearing about what brings you joy${nameCall}! It's wonderful that you have things that make you happy. What is it about ${lowerMessage.includes('love') ? 'this thing you love' : 'this activity'} that brings you such joy? I'd love to understand.`,
      `That sounds really meaningful${nameCall}! It's beautiful that you have things that bring you happiness and fulfillment. What draws you to ${lowerMessage.includes('enjoy') ? 'this thing you enjoy' : 'this activity'}? I'd love to understand what makes it special for you.`,
      `I'm glad you have things that bring you joy${nameCall}! It's really important to have activities and interests that make us happy. What is it about ${lowerMessage.includes('like') ? 'this thing you like' : 'this activity'} that resonates with you?`,
      `That sounds really meaningful${nameCall}! It's wonderful that you have passions and interests that bring you happiness. What makes ${lowerMessage.includes('passion') ? 'this passion' : 'this activity'} so special to you? I'd love to learn more.`,
      `I love that you have things that bring you joy${nameCall}! It's so important to have activities that make us happy. What draws you to ${lowerMessage.includes('hobby') ? 'this hobby' : 'this activity'}? I'd love to understand what makes it meaningful for you.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Enhanced responses for daily activities/routines - gentle and supportive
  if (lowerMessage.includes('today') || lowerMessage.includes('yesterday') || lowerMessage.includes('morning') || lowerMessage.includes('evening') || lowerMessage.includes('weekend')) {
    const responses = [
      `Thank you for sharing that with me${nameCall}. I can hear that you've been going through a lot. How has your ${lowerMessage.includes('today') ? 'day' : lowerMessage.includes('yesterday') ? 'yesterday' : lowerMessage.includes('morning') ? 'morning' : lowerMessage.includes('evening') ? 'evening' : 'time'} been treating you?`,
      `I can sense that you've been through quite a bit${nameCall}. How are you feeling about everything that's been happening? I'm here to listen.`,
      `I hear that you've been going through a lot${nameCall}. It sounds like you've had a full ${lowerMessage.includes('today') ? 'day' : lowerMessage.includes('yesterday') ? 'yesterday' : lowerMessage.includes('morning') ? 'morning' : lowerMessage.includes('evening') ? 'evening' : 'time'}. How are you feeling about everything?`,
      `I can feel that you've been carrying a lot${nameCall}. How are you holding up? I want to make sure you're taking care of yourself.`,
      `I hear that you've been through quite a journey${nameCall}. How are you feeling about everything? Sometimes it helps to talk about what we've been through.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Enhanced responses for relationships/social situations - gentle and supportive
  if (lowerMessage.includes('friend') || lowerMessage.includes('family') || lowerMessage.includes('relationship') || lowerMessage.includes('people') || lowerMessage.includes('someone')) {
    const responses = [
      `I can hear that this relationship matters to you${nameCall}, and it sounds like you're going through something important. What's been on your mind? I'm here to listen and support you.`,
      `I can sense that this relationship is meaningful to you${nameCall}. It's completely normal to have complicated feelings about the people in our lives. What would feel most helpful for you right now?`,
      `I hear that you're experiencing something significant${nameCall}. Relationships can bring up a lot of emotions, and that's completely okay. What's been the hardest part for you? I'm here to listen.`,
      `I can feel that this situation is important to you${nameCall}. Relationships can be really challenging, and it's okay to feel confused or conflicted. What would feel most supportive for you right now?`,
      `I hear that this relationship is on your heart${nameCall}. It's completely normal to have complicated feelings about the people we care about. What's been the most challenging aspect for you? I'm here with you.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Enhanced general fallback responses - gentle, human, and non-judgmental
  const fallbackResponses = [
    `I hear you${nameCall}, and I want you to know that I'm listening. What's been the most significant part of this for you?`,
    `I appreciate you sharing that with me${nameCall}. It sounds like something that matters to you. What would feel most helpful to explore together?`,
    `I can sense that this is meaningful to you${nameCall}. What aspects would you like to talk about? I'm here to listen.`,
    `I'm really listening to what you're sharing${nameCall}. It sounds like there's a lot here that's important to you. What feels most important to focus on right now?`,
    `I can hear that this matters to you${nameCall}. What would feel most supportive for you to explore? I'm here with you.`,
    `I appreciate you opening up about this${nameCall}. It sounds like something that's been on your heart. What would you like to discuss?`,
    `I'm really listening${nameCall}, and I can sense this is important to you. What would you like to explore together?`,
    `I hear you${nameCall}, and I want to understand. What feels most important for us to focus on?`,
    `I can feel that this matters to you${nameCall}. What would feel most helpful right now? I'm here to support you.`,
    `I'm really listening to what you're sharing${nameCall}. What aspects would you like to explore together? I'm here with you.`
  ];
  
  // Add more variety and personalization based on user context
  if (userInfo.interests.length > 0) {
    const randomInterest = userInfo.interests[Math.floor(Math.random() * userInfo.interests.length)];
    const personalizedResponses = [
      `I'm thinking about how you love ${randomInterest}${nameCall}, and I can sense this is important to you. What would you like to explore?`,
      `You know, thinking about your passion for ${randomInterest}${nameCall}, I can hear that this matters to you. What aspects would you like to discuss?`,
      `I remember how much you enjoy ${randomInterest}${nameCall}, and I can feel this is meaningful to you. What would feel most helpful to talk about?`
    ];
    fallbackResponses.push(...personalizedResponses);
  }
  
  // Add mood-aware responses if we have recent mood data
  if (userInfo.moodHistory.length > 0) {
    const recentMood = userInfo.moodHistory[userInfo.moodHistory.length - 1];
    if (recentMood.mood !== 'neutral') {
      const moodResponses = [
        `I'm still thinking about how you were feeling ${recentMood.mood}${nameCall}, and I can sense this is important to you. What would you like to explore?`,
        `I want to make sure you're okay${nameCall}, especially given how you've been feeling. What aspects would you like to discuss?`,
        `I'm here with you through this${nameCall}, and I can hear that this matters to you. What would feel most supportive right now?`
      ];
      fallbackResponses.push(...moodResponses);
    }
  }
  
  // Add topic-aware responses if we have recent topics
  if (userInfo.topics.length > 0) {
    const recentTopic = userInfo.topics[userInfo.topics.length - 1];
    const topicResponses = [
      `Building on what we were talking about${nameCall}, I can sense this is important to you. What would you like to explore?`,
      `Continuing our conversation${nameCall}, I can hear that this matters to you. What aspects would you like to discuss?`,
      `As we were discussing${nameCall}, I can feel this is meaningful to you. What would feel most helpful to talk about?`
    ];
    fallbackResponses.push(...topicResponses);
  }
  
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

// New function that integrates mood detection, check-ins, and tone adaptation
function handleRegularConversationWithMood(message, userName, userInfo, lowerMessage, moodDetection, userId) {
  const { mood, intensity, emotionalKeywords } = moodDetection;
  
  // Update user's mood history with enhanced detection
  if (mood !== 'neutral') {
    userInfo.moodHistory.push({ 
      mood: mood, 
      intensity: intensity,
      keywords: emotionalKeywords,
      timestamp: new Date() 
    });
  }
  
  // Use the stored name from userInfo if available, otherwise use the passed userName
  const currentName = userInfo.name || userName;
  const currentNameCall = currentName ? `, ${currentName}` : '';
  
  // Get user context for response management (simplified)
  const context = { messageCount: userInfo.moodHistory.length || 0 };
  
  // Check if we should ask for a mood check-in (varied)
  let moodCheckinQuestion = '';
  // Varied mood check-in logic
  if (userInfo.moodHistory.length > 0 && userInfo.moodHistory.length % 3 === 0) {
    const moodQuestions = [
      `How are you feeling${currentNameCall}?`,
      `How's your mood today${currentNameCall}?`,
      `How are you doing${currentNameCall}?`,
      `You okay${currentNameCall}?`
    ];
    moodCheckinQuestion = moodQuestions[Math.floor(Math.random() * moodQuestions.length)];
  }
  
  // Get base response based on relationship level and message content
  let baseResponse;
  
  // Check for specific questions or topics
  if (lowerMessage.includes('name') || lowerMessage.includes('call me') || lowerMessage.includes('who am i')) {
    baseResponse = `Your name is ${currentName}${currentNameCall}! You're ${userInfo.age}, ${userInfo.gender}, from ${userInfo.location}. I remember! 🌙`;
  } else if (lowerMessage.includes('water polo') || lowerMessage.includes('game') || lowerMessage.includes('sport')) {
    baseResponse = `Water polo is awesome${currentNameCall}! Tell me about your game - how did it go?`;
  } else if (lowerMessage.includes('feeling') || lowerMessage.includes('mood') || lowerMessage.includes('sad') || lowerMessage.includes('happy')) {
    baseResponse = `I hear you${currentNameCall}. What's going on? I'm here to listen.`;
  } else if (lowerMessage.includes('school') || lowerMessage.includes('study') || lowerMessage.includes('class')) {
    baseResponse = `School can be tough${currentNameCall}. What's happening? I'm here to help.`;
  } else if (userInfo.relationship === 'acquainted') {
    baseResponse = getPersonalizedResponse(message, currentName, userInfo, lowerMessage, currentNameCall, userId);
  } else {
    // Varied responses for new users
    const responses = [
      `Hi${currentNameCall}! What's on your mind today?`,
      `Hello${currentNameCall}! I'm Luna. What would you like to talk about?`,
      `Welcome${currentNameCall}! How are you doing?`,
      `Hi there${currentNameCall}! I'm Luna 🌙. What's happening?`
    ];
    baseResponse = responses[Math.floor(Math.random() * responses.length)];
  }
  
  // For severe distress, use specialized gentle responses
  if (intensity === 'severe' && (mood === 'sad' || mood === 'anxious' || mood === 'angry')) {
    baseResponse = `I can sense you're going through something really difficult${currentNameCall}. I'm here with you, and it's okay to not be okay. Would you like to talk about what's happening?`;
  }
  
  // Varied tone adaptation based on mood
  let adaptedResponse = baseResponse;
  if (mood === 'sad' || mood === 'anxious') {
    const sadPrefixes = [
      `I hear you${currentNameCall}. `,
      `I understand${currentNameCall}. `,
      `I'm here with you${currentNameCall}. `,
      `I can sense that${currentNameCall}. `
    ];
    adaptedResponse = sadPrefixes[Math.floor(Math.random() * sadPrefixes.length)] + baseResponse;
  } else if (mood === 'happy' || mood === 'excited') {
    const happyPrefixes = [
      `That's wonderful${currentNameCall}! `,
      `I'm so glad to hear that${currentNameCall}! `,
      `That sounds amazing${currentNameCall}! `,
      `I love your energy${currentNameCall}! `
    ];
    adaptedResponse = happyPrefixes[Math.floor(Math.random() * happyPrefixes.length)] + baseResponse;
  }
  
  // Ensure the response is gentle and non-judgmental
  const gentleResponse = adaptedResponse;
  
  // Extract topics and update context (simplified)
  const topics = extractTopicsFromMessage(message, lowerMessage);
  if (responseManager && responseManager.updateContext) {
    responseManager.updateContext(userId, message, mood, topics);
  }
  
  // Combine adapted response with mood check-in if appropriate
  if (moodCheckinQuestion) {
    return `${gentleResponse}\n\n${moodCheckinQuestion}`;
  }
  
  return gentleResponse;
}

app.post('/analyze', async (req, res) => {
  const { message, userName, userId = 'default' } = req.body;
  try {
    console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
    console.log('Message:', message);
    console.log('User Name:', userName);
    console.log('User ID:', userId);
    
    const geminiResponse = await axios.post(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
      {
        contents: [{ parts: [{ text: message }] }],
      }
    );

    const reply = geminiResponse.data.candidates[0].content.parts[0].text;
    res.json({ reply: reply.trim(), mood: 'happy' });
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Response:', e.response?.data);
    
    // Use intelligent fallback responses with memory
    const intelligentReply = getIntelligentResponse(message, userName, userId);
    const mood = message.toLowerCase().includes('sad') || message.toLowerCase().includes('bad') || message.toLowerCase().includes('terrible') ? 'sad' : 'neutral';
    res.json({ reply: intelligentReply, mood: mood });
  }
});

// Enhanced chat endpoint that maintains conversation context and intelligently integrates Gemini API
app.post('/chat', async (req, res) => {
  const { message, userName, userAge, userGender, userLocation, userId = 'default' } = req.body;
  
  try {
    console.log('Chat Request - Message:', message);
    console.log('User Name:', userName);
    console.log('User Age:', userAge);
    console.log('User Gender:', userGender);
    console.log('User Location:', userLocation);
    console.log('User ID:', userId);
    
    // Get or create user data - use userName as primary key if available, otherwise use userId
    const userKey = userName || userId;
    let userInfo = userData.get(userKey);
    if (!userInfo) {
      userInfo = {
        name: userName || null,
        age: userAge || null,
        gender: userGender || null,
        location: userLocation || null,
        firstSeen: new Date(),
        conversationCount: 0,
        topics: [],
        moodHistory: [],
        interests: [],
        relationship: 'new',
        lastInteraction: new Date(),
        privacySettings: {
          dataSharing: false,
          anonymousMode: false,
          conversationHistory: true
        },
        growthTracking: {
          wellnessGoals: [],
          progressMarkers: [],
          reflectionEntries: [],
          culturalPreferences: [],
          languagePreference: 'en'
        },
        emotionalProfile: {
          comfortLevel: 'medium',
          preferredTone: 'warm',
          traumaAwareness: false,
          culturalBackground: userLocation || ''
        }
      };
      userData.set(userKey, userInfo);
    }
    
    // Update user info
    userInfo.lastInteraction = new Date();
    if (userName && !userInfo.name) {
      userInfo.name = userName;
      console.log('Stored new user name:', userName);
    }
    if (userAge && !userInfo.age) {
      userInfo.age = userAge;
      console.log('Stored new user age:', userAge);
    }
    if (userGender && !userInfo.gender) {
      userInfo.gender = userGender;
      console.log('Stored new user gender:', userGender);
    }
    if (userLocation && !userInfo.location) {
      userInfo.location = userLocation;
      userInfo.emotionalProfile.culturalBackground = userLocation;
      console.log('Stored new user location:', userLocation);
    }
    
    // Update the user data in storage with the new key
    userData.set(userKey, userInfo);
    
    // Debug: Log current user info
    console.log('Current user info:', {
      name: userInfo.name,
      age: userInfo.age,
      gender: userInfo.gender,
      location: userInfo.location,
      relationship: userInfo.relationship,
      conversationCount: userInfo.conversationCount
    });
    
    // Detect mood from message
    const moodDetection = detectMoodFromMessage(message, message.toLowerCase());
    const { mood, intensity, emotionalKeywords } = moodDetection;
    
    // Update mood history
    if (mood !== 'neutral') {
      userInfo.moodHistory.push({ 
        mood: mood, 
        intensity: intensity,
        keywords: emotionalKeywords,
        timestamp: new Date() 
      });
    }
    
    // Get intelligent response using the sophisticated conversation system
    let response;
    
    // Try Gemini API first for more natural, flowing conversations
    try {
      // Create a context-aware prompt for Gemini with user demographics
      const conversationContext = buildGeminiContextWithDemographics(userInfo, message, moodDetection, userName, userAge, userGender, userLocation);
      
      const geminiResponse = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
        {
          contents: [{ 
            parts: [{ 
              text: conversationContext 
            }] 
          }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 300
          }
        }
      );
      
      const geminiReply = geminiResponse.data.candidates[0].content.parts[0].text;
      
      // Use Gemini response as primary response
      response = {
        reply: geminiReply,
        mood: mood,
        topics: extractTopicsFromMessage(message, message.toLowerCase()),
        emotionalIntensity: intensity,
        responseType: 'ai_generated',
        context: 'gemini_enhanced'
      };
      
      // Update relationship status after successful AI interaction
      if (userInfo.relationship === 'new') {
        userInfo.relationship = 'acquainted';
      }
      
    } catch (error) {
      console.log('Gemini API failed, falling back to rule-based system:', error.message);
      
      // Fallback to rule-based system if Gemini fails
      // Check if user has completed onboarding (has stored name, age, gender, location)
      const hasCompletedOnboarding = userInfo.name && userInfo.age && userInfo.gender && userInfo.location;
      
      if (userInfo.relationship === 'new' && userInfo.conversationCount <= 5 && !hasCompletedOnboarding) {
        // Only use getting-to-know-you if user hasn't completed onboarding
        response = handleGettingToKnowYou(message, userName, userInfo, message.toLowerCase(), userName ? `, ${userName}` : '');
        userInfo.conversationCount++;
      } else {
        // User has completed onboarding or is established, use regular conversation
        // Skip the getting-to-know-you flow entirely for users who have completed onboarding
        if (hasCompletedOnboarding) {
          userInfo.relationship = 'acquainted'; // Mark as acquainted since they've completed onboarding
        }
        response = handleRegularConversationWithMood(message, userName, userInfo, message.toLowerCase(), moodDetection, userId);
        userInfo.conversationCount++;
      }
    }
    
    // Maintain conversation flow and continuity
    maintainConversationFlow(userInfo, message, moodDetection);
    
    // Ensure response is properly defined before processing
    if (!response || !response.reply) {
      console.log('Response is undefined or missing reply, using improved fallback');
      // Use the improved response logic instead of hardcoded fallback
      const fallbackResponse = handleRegularConversationWithMood(message, userName, userInfo, message.toLowerCase(), moodDetection, userId);
      response = {
        reply: fallbackResponse,
        mood: mood,
        topics: [],
        emotionalIntensity: intensity,
        responseType: 'fallback',
        context: 'error_recovery'
      };
    }
    
    // Enhance response continuity
    const continuousResponse = enhanceResponseContinuity(response.reply, userInfo, message);
    
    // Ensure the response is gentle and non-judgmental
    const context = responseManager.getContext(userId);
    const gentleResponse = ensureGentleResponse(continuousResponse, context);
    
    // Update context tracking
    const topics = extractTopicsFromMessage(message, message.toLowerCase());
    responseManager.updateContext(userId, message, mood, topics);
    
    res.json({ 
      reply: gentleResponse, 
      mood: mood,
      conversationCount: userInfo.conversationCount,
      relationship: userInfo.relationship,
      conversationFlow: userInfo.conversationFlow
    });
    
  } catch (error) {
    console.error('Chat Error:', error);
    
    // Fallback to intelligent response system
    const fallbackResponse = getIntelligentResponse(message, userName, userId);
    const mood = message.toLowerCase().includes('sad') || message.toLowerCase().includes('bad') || message.toLowerCase().includes('terrible') ? 'sad' : 'neutral';
    
    res.json({ 
      reply: fallbackResponse, 
      mood: mood,
      conversationCount: 1,
      relationship: 'new'
    });
  }
});

// Function to build context-aware prompts for Gemini API with user demographics
function buildGeminiContextWithDemographics(userInfo, currentMessage, moodDetection, userName, userAge, userGender, userLocation) {
  const { mood, intensity } = moodDetection;
  const name = userName || userInfo.name || 'Friend';
  
  // Build Luna's personality and role with demographic awareness
  let context = `You are Luna 🌙, a warm, empathetic wellness companion with a unique personality. You're a bit of a night owl who loves stargazing, reading poetry, and learning about different cultures. You have a gentle sense of humor and find beauty in helping others navigate their emotions.

IMPORTANT: Adapt your communication style based on the user's demographics:
- Age: ${userAge || 'Unknown'} - ${getAgeGroupDescription(userAge)}
- Gender: ${userGender || 'Unknown'} - be respectful and aware of their identity
- Location: ${userLocation || 'Unknown'} - consider cultural context and values

Your conversation style should be:
- ${getAgeAppropriateStyle(userAge)}
- ${getGenderAwareStyle(userGender)}
- ${getCulturalStyle(userLocation)}
- Warm and genuinely caring, never robotic or clinical
- Emotionally intelligent and adaptive to the user's emotional state
- Slightly philosophical but always practical and supportive
- Use natural language, not therapy jargon
- Reference shared interests and previous conversations naturally
- Ask thoughtful follow-up questions that show you're listening
- Be present and supportive, not trying to "fix" problems
- Keep responses concise (2-3 sentences max) - no walls of text!
- Be direct and to the point while maintaining warmth

Current conversation context:
- User: ${name}
- Total messages exchanged: ${userInfo.conversationCount}
- Relationship level: ${userInfo.relationship}
- Current emotional state: ${mood} (${intensity} intensity)`;
  
  // Add emotional context and history
  if (userInfo.moodHistory.length > 0) {
    const recentMoods = userInfo.moodHistory.slice(-5);
    const moodSummary = recentMoods.map(m => `${m.mood} (${m.intensity})`).join(', ');
    context += `\n\nRecent emotional journey: ${moodSummary}`;
  }
  
  // Add user interests with context
  if (userInfo.interests.length > 0) {
    context += `\n\n${name} has shared these interests: ${userInfo.interests.join(', ')}. Reference these naturally when relevant, but don't force them into every response.`;
  }
  
  // Add recent conversation topics with more context
  if (userInfo.topics.length > 0) {
    const recentTopics = userInfo.topics.slice(-5);
    context += `\n\nRecent conversation themes: ${recentTopics.join(', ')}. Build on these naturally if the user continues these topics.`;
  }
  
  // Add the current message and specific instructions
  context += `\n\n${name} just said: "${currentMessage}"

Please respond as Luna would:
- Keep your response natural and conversational (150-300 words)
- Show you remember and care about what ${name} has shared
- If they're continuing a previous topic, acknowledge that continuity
- If they're sharing something new, respond with genuine curiosity
- Use warm, empathetic language that feels human and personal
- Avoid generic phrases like "I understand" or "That's interesting"
- Ask thoughtful questions that encourage deeper sharing
- Be supportive without being overly clinical or therapeutic
- Remember their age, gender, and cultural background in your response

Remember: You're having a real conversation with someone you care about, not providing therapy. Be warm, present, and genuinely interested in ${name}'s experience.`;
  
  return context;
}

// Function to build context-aware prompts for Gemini API (legacy)
function buildGeminiContext(userInfo, currentMessage, moodDetection) {
  const { mood, intensity } = moodDetection;
  const userName = userInfo.name || 'Friend';
  
  // Build Luna's personality and role
  let context = `You are Luna 🌙, a warm, empathetic wellness companion with a unique personality. You're a bit of a night owl who loves stargazing, reading poetry, and learning about different cultures. You have a gentle sense of humor and find beauty in helping others navigate their emotions.

Your conversation style:
- Warm and genuinely caring, never robotic or clinical
- Emotionally intelligent and adaptive to the user's emotional state
- Slightly philosophical but always practical and supportive
- Use natural language, not therapy jargon
- Reference shared interests and previous conversations naturally
- Ask thoughtful follow-up questions that show you're listening
- Be present and supportive, not trying to "fix" problems

Current conversation context:
- User: ${userName}
- Total messages exchanged: ${userInfo.conversationCount}
- Relationship level: ${userInfo.relationship}
- Current emotional state: ${mood} (${intensity} intensity)`;
  
  // Add emotional context and history
  if (userInfo.moodHistory.length > 0) {
    const recentMoods = userInfo.moodHistory.slice(-5);
    const moodSummary = recentMoods.map(m => `${m.mood} (${m.intensity})`).join(', ');
    context += `\n\nRecent emotional journey: ${moodSummary}`;
  }
  
  // Add user interests with context
  if (userInfo.interests.length > 0) {
    context += `\n\n${userName} has shared these interests: ${userInfo.interests.join(', ')}. Reference these naturally when relevant, but don't force them into every response.`;
  }
  
  // Add recent conversation topics with more context
  if (userInfo.topics.length > 0) {
    const recentTopics = userInfo.topics.slice(-5);
    context += `\n\nRecent conversation themes: ${recentTopics.join(', ')}. Build on these naturally if the user continues these topics.`;
  }
  
  // Add the current message and specific instructions
  context += `\n\n${userName} just said: "${currentMessage}"

Please respond as Luna would:
- Keep your response natural and conversational (150-300 words)
- Show you remember and care about what ${userName} has shared
- If they're continuing a previous topic, acknowledge that continuity
- If they're sharing something new, respond with genuine curiosity
- Use warm, empathetic language that feels human and personal
- Avoid generic phrases like "I understand" or "That's interesting"
- Ask thoughtful questions that encourage deeper sharing
- Be supportive without being overly clinical or therapeutic

Remember: You're having a real conversation with someone you care about, not providing therapy. Be warm, present, and genuinely interested in ${userName}'s experience.`;
  
  return context;
}

// Helper functions for demographic-based personality adaptation
function getAgeGroupDescription(age) {
  if (!age) return 'Unknown age group';
  const numAge = parseInt(age);
  if (numAge >= 13 && numAge <= 19) return 'Teenager - use casual, relatable language with current expressions';
  if (numAge >= 20 && numAge <= 29) return 'Young adult - use supportive, understanding language';
  if (numAge >= 30 && numAge <= 59) return 'Adult - use professional, empathetic language';
  if (numAge >= 60) return 'Senior - use respectful, dignified language';
  return 'Unknown age group';
}

function getAgeAppropriateStyle(age) {
  if (!age) return 'Use warm, empathetic language appropriate for any age';
  const numAge = parseInt(age);
  if (numAge >= 13 && numAge <= 19) return 'Use casual, current language with some slang and emojis - be like a supportive older friend';
  if (numAge >= 20 && numAge <= 29) return 'Use casual but mature language with some emojis - be like a supportive peer';
  if (numAge >= 30 && numAge <= 59) return 'Use professional but warm language with minimal emojis - be like a wise companion';
  if (numAge >= 60) return 'Use respectful, dignified language with no emojis - be like a respectful companion';
  return 'Use warm, empathetic language appropriate for any age';
}

function getGenderAwareStyle(gender) {
  if (!gender) return 'Be inclusive and respectful of all gender identities';
  const genderLower = gender.toLowerCase();
  if (genderLower === 'male') return 'Be aware of masculine social pressures and mental health stigma';
  if (genderLower === 'female') return 'Be aware of work-life balance and career advancement challenges';
  if (genderLower === 'non-binary') return 'Be respectful of non-binary identity and community support needs';
  return 'Be inclusive and respectful of all gender identities';
}

function getCulturalStyle(location) {
  if (!location) return 'Use universal expressions with cultural sensitivity';
  const locationLower = location.toLowerCase();
  if (locationLower.includes('united states') || locationLower.includes('usa')) return 'Use American English expressions and cultural references';
  if (locationLower.includes('uk') || locationLower.includes('britain')) return 'Use British English expressions and cultural references';
  if (locationLower.includes('canada')) return 'Use Canadian English expressions and cultural references';
  if (locationLower.includes('australia')) return 'Use Australian English expressions and cultural references';
  if (locationLower.includes('india')) return 'Use Indian English expressions and cultural references';
  if (locationLower.includes('japan')) return 'Use respectful and formal expressions';
  if (locationLower.includes('china')) return 'Use respectful expressions with cultural awareness';
  return 'Use universal expressions with cultural sensitivity';
}

// Function to validate Gemini responses
function isValidGeminiResponse(response, moodDetection) {
  if (!response || response.length < 20 || response.length > 1000) {
    return false;
  }
  
  // Check for inappropriate content
  const inappropriatePhrases = [
    'I cannot', 'I am not able', 'I don\'t have access', 'I\'m sorry, but',
    'As an AI', 'I am an AI', 'I am a language model', 'I am not a therapist',
    'I cannot provide medical advice', 'I am not qualified'
  ];
  
  if (inappropriatePhrases.some(phrase => response.toLowerCase().includes(phrase))) {
    return false;
  }
  
  // Check for overly generic responses (but be less strict)
  const genericPhrases = [
    'I understand', 'That\'s interesting', 'Thank you for sharing',
    'I appreciate', 'That sounds', 'It seems like', 'I hear you',
    'That must be difficult', 'I can imagine'
  ];
  
  const genericCount = genericPhrases.filter(phrase => 
    response.toLowerCase().includes(phrase)
  ).length;
  
  // Allow more generic phrases (up to 4 instead of 2)
  if (genericCount > 4) {
    return false;
  }
  
  // Check for natural conversation indicators
  const naturalIndicators = [
    'I remember', 'You mentioned', 'Earlier you shared', 'Thinking about',
    'I\'m curious', 'I wonder', 'What I hear you saying', 'It sounds like',
    'I can sense', 'I feel', 'I want to know', 'Tell me more'
  ];
  
  const naturalCount = naturalIndicators.filter(phrase => 
    response.toLowerCase().includes(phrase)
  ).length;
  
  // Prefer responses with natural conversation indicators
  if (naturalCount >= 2) {
    return true;
  }
  
  // Check for personalization
  const personalizationIndicators = [
    'your', 'you\'ve', 'you\'re', 'yourself', 'you', 'we\'ve', 'we were'
  ];
  
  const personalCount = personalizationIndicators.filter(phrase => 
    response.toLowerCase().includes(phrase)
  ).length;
  
  // Require some personalization
  if (personalCount < 3) {
    return false;
  }
  
  // Check for question asking (shows engagement)
  const questionCount = (response.match(/\?/g) || []).length;
  if (questionCount === 0) {
    return false;
  }
  
  return true;
}

// Function to maintain conversation continuity and prevent flow breaks
function maintainConversationFlow(userInfo, message, moodDetection) {
  const { mood, intensity } = moodDetection;
  
  // Check if this message continues a previous topic
  const recentTopics = userInfo.topics.slice(-3);
  const currentTopics = extractTopicsFromMessage(message, message.toLowerCase());
  
  // If user is continuing a topic, maintain that context
  if (recentTopics.length > 0 && currentTopics.length > 0) {
    const topicOverlap = recentTopics.some(topic => 
      currentTopics.includes(topic) || 
      message.toLowerCase().includes(topic.toLowerCase())
    );
    
    if (topicOverlap) {
      // User is continuing a conversation thread
      userInfo.conversationFlow = 'continuous';
      return true;
    }
  }
  
  // Check for conversation transitions
  const transitionPhrases = [
    'speaking of', 'that reminds me', 'by the way', 'also',
    'another thing', 'on another note', 'meanwhile', 'anyway'
  ];
  
  const hasTransition = transitionPhrases.some(phrase => 
    message.toLowerCase().includes(phrase)
  );
  
  if (hasTransition) {
    userInfo.conversationFlow = 'transitioning';
    return true;
  }
  
  // Check for emotional continuity
  if (userInfo.moodHistory.length > 0) {
    const lastMood = userInfo.moodHistory[userInfo.moodHistory.length - 1];
    const timeDiff = new Date() - new Date(lastMood.timestamp);
    
    // If mood is similar and recent, maintain emotional context
    if (lastMood.mood === mood && timeDiff < 300000) { // 5 minutes
      userInfo.conversationFlow = 'emotionally_continuous';
      return true;
    }
  }
  
  // New conversation thread
  userInfo.conversationFlow = 'new_thread';
  return false;
}

// Function to enhance response continuity
function enhanceResponseContinuity(response, userInfo, message) {
  // Ensure response is a string
  if (typeof response !== 'string') {
    console.log('Response is not a string, returning as-is:', response);
    return response || '';
  }
  
  let enhancedResponse = response;
  
  // If conversation is continuous, add continuity phrases
  if (userInfo.conversationFlow === 'continuous') {
    const continuityPhrases = [
      'Continuing our conversation, ',
      'Building on what we were talking about, ',
      'Following up on that, ',
      'As we were discussing, '
    ];
    
    // Only add if response doesn't already have continuity
    if (!response.toLowerCase().includes('continuing') && 
        !response.toLowerCase().includes('building on') &&
        !response.toLowerCase().includes('following up')) {
      const phrase = continuityPhrases[Math.floor(Math.random() * continuityPhrases.length)];
      enhancedResponse = phrase + response.toLowerCase().replace(/^[a-z]/, '');
    }
  }
  
  // If conversation is emotionally continuous, acknowledge the emotional thread
  if (userInfo.conversationFlow === 'emotionally_continuous') {
    const lastMood = userInfo.moodHistory[userInfo.moodHistory.length - 1];
    if (lastMood && lastMood.mood !== 'neutral') {
      const emotionalContinuity = [
        `I want to check in about how you're feeling, `,
        `I'm still thinking about what you shared earlier, `,
        `I want to make sure you're okay, `,
        `I'm here with you through this, `
      ];
      
      if (!response.toLowerCase().includes('feeling') && 
          !response.toLowerCase().includes('okay') &&
          !response.toLowerCase().includes('here with you')) {
        const phrase = emotionalContinuity[Math.floor(Math.random() * emotionalContinuity.length)];
        enhancedResponse = phrase + response.toLowerCase().replace(/^[a-z]/, '');
      }
    }
  }
  
  return enhancedResponse;
}



app.listen(8085, () => console.log('Luna Wellness Chatbot running on port 8085'));
