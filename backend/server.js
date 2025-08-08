
const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

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
  
  // Regular conversation with memory
  return handleRegularConversation(message, userName, userInfo, lowerMessage, nameCall);
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

function getPersonalizedResponse(message, userName, userInfo, lowerMessage, nameCall) {
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
  
  // Greetings with personal touch
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    const greetings = [
      `Hello${nameCall}! It's great to see you again. How are you feeling today?`,
      `Hi${nameCall}! I've been thinking about you. How has your day been?`,
      `Hey${nameCall}! Welcome back. I'm curious about how you're doing.`,
      `Hello${nameCall}! I'm so glad you're here. What's on your mind?`,
      `Hi there${nameCall}! I was just wondering how you've been. What's new?`,
      `Hey${nameCall}! It's wonderful to see you again. How's everything going?`,
      `Hello${nameCall}! I've missed our conversations. How are you doing today?`,
      `Hi${nameCall}! I'm excited to catch up with you. What's been happening?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
  
  // Enhanced mood-based responses with more natural, helpful language
  if (lowerMessage.includes('feeling sad') || lowerMessage.includes('i am sad') || lowerMessage.includes('i\'m sad')) {
    const responses = [
      `I can sense that you're going through something difficult${nameCall}. It's completely normal to feel this way sometimes. Would you like to talk about what's weighing on your mind? I'm here to listen without judgment.`,
      `I hear the heaviness in your words${nameCall}. Sadness can feel really isolating, but you don't have to carry it alone. What's been on your mind lately?`,
      `I'm sorry you're feeling this way${nameCall}. Sadness can be really heavy to carry. What's been on your heart lately? I'm here to listen.`,
      `I can feel that you're having a tough time${nameCall}. It's okay to not be okay. What do you think might help you feel a little lighter right now?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling anxious') || lowerMessage.includes('i am anxious') || lowerMessage.includes('i\'m anxious')) {
    const responses = [
      `Anxiety can feel really overwhelming${nameCall}. Your nervous system is trying to protect you, even if it feels like too much right now. What's making you feel anxious? Sometimes talking it through can help.`,
      `I understand that anxious feeling${nameCall}. It's like your mind is running a marathon. What's the biggest thing on your mind right now? We can work through this together.`,
      `Anxiety is really challenging${nameCall}. It's okay to feel this way. What would feel most supportive for you right now - talking about what's worrying you, or maybe some grounding techniques?`,
      `I can hear the worry in your voice${nameCall}. Anxiety can be really exhausting. What's been on your mind that's making you feel this way?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling tired') || lowerMessage.includes('i am tired') || lowerMessage.includes('i\'m tired')) {
    const responses = [
      `I can hear the exhaustion in your voice${nameCall}. Being tired affects everything, doesn't it? Have you been getting enough rest lately? What's been keeping you up?`,
      `Tiredness can be really draining${nameCall}. It's like your body is asking for a break. What's been taking up your energy lately? Sometimes identifying the source helps.`,
      `I feel you on the tiredness${nameCall}. It's been a lot lately, hasn't it? What would help you feel more rested? Sometimes even small changes can make a difference.`,
      `Exhaustion can be really tough${nameCall}. Your body is telling you it needs a break. What's been draining your energy lately?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling excited') || lowerMessage.includes('i am excited') || lowerMessage.includes('i\'m excited')) {
    const responses = [
      `Your excitement is contagious${nameCall}! I love that energy. What's got you feeling so pumped up? I want to hear all about it!`,
      `That's fantastic${nameCall}! Excitement is such a beautiful feeling. What's the source of all this positive energy? I'm genuinely curious!`,
      `I can feel your enthusiasm${nameCall}! It's wonderful when something lights you up like this. What's been making you feel so excited?`,
      `Your energy is amazing${nameCall}! I can feel the excitement radiating from your words. What's got you so fired up?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling happy') || lowerMessage.includes('i am happy') || lowerMessage.includes('i\'m happy')) {
    const responses = [
      `That's wonderful to hear${nameCall}! Your happiness is radiating through your words. What's contributing to your good mood today? I love hearing about what brings people joy.${humorSuffix}`,
      `I'm so happy to hear that${nameCall}! Positive vibes are flowing. What made today special for you? Your joy is contagious!${humorSuffix}`,
      `That's fantastic${nameCall}! Your happiness makes me smile too. Tell me more about what's bringing you joy. I want to celebrate this with you!${humorSuffix}`,
      `Your happiness is contagious${nameCall}! I can feel the positive energy. What's been making you smile today?${humorSuffix}`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling okay') || lowerMessage.includes('i am okay') || lowerMessage.includes('i\'m okay') || lowerMessage.includes('feeling neutral')) {
    const responses = [
      `Sometimes 'okay' is exactly where we need to be${nameCall}. It's a stable place to build from. How has your day been so far?`,
      `Okay is a perfectly valid feeling${nameCall}. Not every day needs to be extraordinary. What's been on your mind today?`,
      `That's totally fine${nameCall}. Not every moment needs to be amazing. How has your day been going?`,
      `Being okay is perfectly normal${nameCall}. What's been happening in your day so far?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  // Questions about Luna with personal context
  if (lowerMessage.includes('how are you') || lowerMessage.includes('are you ok')) {
    return `I'm doing well, thank you for asking${nameCall}! I love connecting with people like you. How are you really doing today? I want to hear about you.`;
  }
  
  // Smooth conversation transitions after mood sharing
  if (lowerMessage.includes('feeling') && (lowerMessage.includes('sad') || lowerMessage.includes('anxious') || lowerMessage.includes('tired') || lowerMessage.includes('excited') || lowerMessage.includes('happy') || lowerMessage.includes('okay'))) {
    // This is handled by the specific mood responses above, but we can add a general follow-up
    const followUps = [
      `I'm glad you shared that with me${nameCall}. How has this feeling been affecting your day?`,
      `Thank you for trusting me with that${nameCall}. What would feel most supportive for you right now?`,
      `I appreciate your honesty${nameCall}. Is there anything specific you'd like to talk about or work through?`
    ];
    return followUps[Math.floor(Math.random() * followUps.length)];
  }
  
  // Personal questions about the user
  if (lowerMessage.includes('remember') && lowerMessage.includes('name')) {
    return `Of course I remember your name${nameCall}! You're ${userName}, and I've really enjoyed getting to know you. We're in this together. How are you doing today?`;
  }
  
  // Trauma-informed responses for sensitive topics
  if (lowerMessage.includes('trauma') || lowerMessage.includes('abuse') || lowerMessage.includes('violence')) {
    return `I hear you${nameCall}, and I want you to know that your feelings are valid. If you're comfortable sharing more, I'm here to listen without judgment. Remember, you're in control of our conversation, and you can stop or change topics anytime. Would you like to talk about this, or would you prefer to focus on something else?`;
  }
  
  // Cultural and privacy acknowledgments
  if (lowerMessage.includes('privacy') || lowerMessage.includes('private')) {
    return `Absolutely${nameCall}! Your privacy is my top priority. Our conversations stay between us, and you control what you share. Is there anything specific about privacy that's on your mind?`;
  }
  
  // Growth and reflection support
  if (lowerMessage.includes('growth') || lowerMessage.includes('progress') || lowerMessage.includes('journey')) {
    const growthResponses = [
      `I love that you're thinking about your growth${nameCall}! Your wellness journey is unique to you, and I'm here to support it. What aspect of your growth feels most important right now?`,
      `Growth is such a beautiful thing to focus on${nameCall}. Every step forward, no matter how small, is meaningful. What's been your biggest learning lately?`,
      `Your growth mindset is inspiring${nameCall}! It takes courage to reflect on our journey. What would you like to work on or celebrate?`
    ];
    return growthResponses[Math.floor(Math.random() * growthResponses.length)];
  }
  
  // Questions about Luna
  if (lowerMessage.includes('how are you') || lowerMessage.includes('are you ok') || lowerMessage.includes('how do you feel')) {
    const lunaResponses = [
      `I'm doing well, thank you for asking${nameCall}! I love connecting with people like you. How are you really doing today? I want to hear about you.`,
      `I'm feeling grateful for our conversation${nameCall}! It's wonderful to chat with you. But I'm more interested in how you're doing - what's on your mind?`,
      `I'm here and present with you${nameCall}! That's what matters most to me. How are you feeling right now?`
    ];
    return lunaResponses[Math.floor(Math.random() * lunaResponses.length)];
  }
  
  // Responses to sharing interests or activities
  if (lowerMessage.includes('i love') || lowerMessage.includes('i like') || lowerMessage.includes('i enjoy') || lowerMessage.includes('i\'m into')) {
    const interestResponses = [
      `That's wonderful${nameCall}! I love hearing about what brings you joy. How does that make you feel when you're doing it?`,
      `That sounds amazing${nameCall}! It's so important to have things that light us up. What do you love most about it?`,
      `I'm so glad you have that in your life${nameCall}! Those kinds of activities can be so nourishing. How does it contribute to your wellbeing?`
    ];
    return interestResponses[Math.floor(Math.random() * interestResponses.length)];
  }
  
  // Responses to sharing problems or challenges
  if (lowerMessage.includes('problem') || lowerMessage.includes('issue') || lowerMessage.includes('difficult') || lowerMessage.includes('challenge') || lowerMessage.includes('struggle')) {
    const challengeResponses = [
      `I hear you${nameCall}, and I want you to know that your feelings are valid. It sounds like you're going through something really challenging. What would feel most supportive right now?`,
      `That sounds really tough${nameCall}. I'm here to listen and support you through this. What's been the hardest part?`,
      `I can sense this is weighing on you${nameCall}. You don't have to face this alone. What would help you feel a little better?`
    ];
    return challengeResponses[Math.floor(Math.random() * challengeResponses.length)];
  }
  
  // Responses to sharing good news or positive experiences
  if (lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('amazing') || lowerMessage.includes('wonderful') || lowerMessage.includes('excellent')) {
    const positiveResponses = [
      `That's fantastic${nameCall}! I'm so happy to hear good news. What made this so special for you?`,
      `I love hearing positive updates${nameCall}! Your joy is contagious. How are you celebrating this?`,
      `That's wonderful${nameCall}! Good things happening to good people always makes me smile. What's the best part about this?`,
      `I'm genuinely excited for you${nameCall}! Positive energy is flowing. What's been the highlight of this experience?`,
      `That sounds absolutely amazing${nameCall}! I can feel your enthusiasm. What's been the most rewarding part?`
    ];
    return positiveResponses[Math.floor(Math.random() * positiveResponses.length)];
  }
  
  // Responses to questions about Luna
  if (lowerMessage.includes('what') && (lowerMessage.includes('you') || lowerMessage.includes('luna'))) {
    const lunaQuestions = [
      `I'm doing well, thank you for asking${nameCall}! I love connecting with people like you. How are you really doing today?`,
      `I'm feeling grateful for our conversation${nameCall}! It's wonderful to chat with you. But I'm more interested in how you're doing - what's on your mind?`,
      `I'm here and present with you${nameCall}! That's what matters most to me. How are you feeling right now?`,
      `I'm feeling inspired by our chat${nameCall}! But tell me more about you - what's been on your heart lately?`
    ];
    return lunaQuestions[Math.floor(Math.random() * lunaQuestions.length)];
  }
  
  // Responses to sharing daily activities or routines
  if (lowerMessage.includes('today') || lowerMessage.includes('yesterday') || lowerMessage.includes('this week')) {
    const dailyResponses = [
      `That sounds like a full day${nameCall}! How are you feeling about everything that's been happening?`,
      `I can hear the energy in your words${nameCall}. What's been the most meaningful part of your day?`,
      `That's quite a journey${nameCall}! How are you processing all of this?`,
      `I appreciate you sharing your day with me${nameCall}. What's been on your mind the most?`
    ];
    return dailyResponses[Math.floor(Math.random() * dailyResponses.length)];
  }
  
  // Responses to sharing relationships or social situations
  if (lowerMessage.includes('friend') || lowerMessage.includes('family') || lowerMessage.includes('relationship') || lowerMessage.includes('people')) {
    const relationshipResponses = [
      `Relationships can be so complex${nameCall}. How are you feeling about this situation?`,
      `I hear the emotion in your voice${nameCall}. What's been the most challenging part?`,
      `That sounds really important to you${nameCall}. How are you taking care of yourself through this?`,
      `I can sense this matters deeply to you${nameCall}. What would feel most supportive right now?`
    ];
    return relationshipResponses[Math.floor(Math.random() * relationshipResponses.length)];
  }
  
  // Enhanced general responses with personal touch and interest-based responses
  let generalResponses = [
    `I'm listening${nameCall}. Tell me more about what's on your mind.`,
    `That's interesting${nameCall}. How does that make you feel?`,
    `I'm here to support you${nameCall}. What's the most important thing you'd like to focus on today?`,
    `I want to understand better${nameCall}. Can you tell me more about that?`,
    `That sounds important${nameCall}. What's your take on it?`,
    `I'm curious to hear more${nameCall}. What's been on your mind about this?`,
    `I appreciate you sharing that${nameCall}. What's your perspective on this?`,
    `That's really thoughtful${nameCall}. How are you processing this?`,
    `I'm here with you${nameCall}. What would be most helpful to talk about?`,
    `That's a great point${nameCall}. How does this relate to how you're feeling?`
  ];
  
  // Add interest-based responses if user has shared interests
  if (hasSpecificInterests) {
    if (userInterests.includes('reading')) {
      generalResponses.push(`That reminds me of how you love reading${nameCall}. Sometimes books help us process things differently. What's your take on this?`);
    }
    if (userInterests.includes('music')) {
      generalResponses.push(`You know, music can be such a great way to process emotions${nameCall}. How does this situation make you feel?`);
    }
    if (userInterests.includes('cooking') || userInterests.includes('dancing')) {
      generalResponses.push(`I know you love ${userInterests.includes('cooking') ? 'cooking' : 'dancing'}${nameCall}. Sometimes creative activities help us work through things. What's your experience with this?`);
    }
  }
  
  return generalResponses[Math.floor(Math.random() * generalResponses.length)];
}

function getStandardResponse(message, userName, userInfo, lowerMessage, nameCall) {
  // Standard responses for users who haven't completed the getting-to-know-you phase
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `Hello${nameCall}! It's great to see you. How are you feeling today? I'm here to listen and support you.`;
  }
  
  // Enhanced mood responses for new users with more variety
  if (lowerMessage.includes('feeling sad') || lowerMessage.includes('i am sad') || lowerMessage.includes('i\'m sad')) {
    const responses = [
      `I can sense that you're going through something difficult${nameCall}. It's completely normal to feel this way sometimes. Would you like to talk about what's weighing on your mind? I'm here to listen without judgment.`,
      `I'm sorry you're feeling this way${nameCall}. Sadness can be really heavy to carry. What's been on your heart lately? I'm here to listen.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling anxious') || lowerMessage.includes('i am anxious') || lowerMessage.includes('i\'m anxious')) {
    const responses = [
      `Anxiety can feel really overwhelming${nameCall}. Your nervous system is trying to protect you, even if it feels like too much right now. What's making you feel anxious? Sometimes talking it through can help.`,
      `I understand that anxious feeling${nameCall}. It's like your mind is running a marathon. What's the biggest thing on your mind right now? We can work through this together.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling tired') || lowerMessage.includes('i am tired') || lowerMessage.includes('i\'m tired')) {
    const responses = [
      `I can hear the exhaustion in your voice${nameCall}. Being tired affects everything, doesn't it? Have you been getting enough rest lately? What's been keeping you up?`,
      `Tiredness can be really draining${nameCall}. It's like your body is asking for a break. What's been taking up your energy lately? Sometimes identifying the source helps.`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling excited') || lowerMessage.includes('i am excited') || lowerMessage.includes('i\'m excited')) {
    const responses = [
      `Your excitement is contagious${nameCall}! I love that energy. What's got you feeling so pumped up? I want to hear all about it!`,
      `That's fantastic${nameCall}! Excitement is such a beautiful feeling. What's the source of all this positive energy? I'm genuinely curious!`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling happy') || lowerMessage.includes('i am happy') || lowerMessage.includes('i\'m happy')) {
    const responses = [
      `That's wonderful to hear${nameCall}! Your happiness is radiating through your words. What's contributing to your good mood today? I love hearing about what brings people joy.`,
      `I'm so happy to hear that${nameCall}! Positive vibes are flowing. What made today special for you? Your joy is contagious!`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  if (lowerMessage.includes('feeling okay') || lowerMessage.includes('i am okay') || lowerMessage.includes('i\'m okay') || lowerMessage.includes('feeling neutral')) {
    const responses = [
      `Sometimes 'okay' is exactly where we need to be${nameCall}. It's a stable place to build from. How has your day been so far?`,
      `That's totally fine${nameCall}. Not every moment needs to be amazing. How has your day been going?`
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }
  
  const fallbackResponses = [
    `I'm listening${nameCall}. Tell me more about what's on your mind.`,
    `That's interesting${nameCall}. How does that make you feel?`,
    `I want to understand better${nameCall}. Can you tell me more about that?`,
    `That sounds important${nameCall}. What's your take on it?`,
    `I appreciate you sharing that${nameCall}. What's your perspective on this?`,
    `That's really thoughtful${nameCall}. How are you processing this?`,
    `I'm here with you${nameCall}. What would be most helpful to talk about?`,
    `That's a great point${nameCall}. How does this relate to how you're feeling?`,
    `I'm curious about your thoughts${nameCall}. Can you elaborate on that?`,
    `That sounds meaningful${nameCall}. What's been on your mind about this?`
  ];
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
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

app.listen(3000, () => console.log('Luna Wellness Chatbot running on port 3000'));
