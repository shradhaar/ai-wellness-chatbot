const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8085;

// Middleware
app.use(cors());
app.use(express.json());

// User data storage
const userData = new Map();
// Store rolling summaries per user
const userSummaries = new Map();

// Simple file-based persistence for summaries
const dataDir = path.join(__dirname, 'data');
const summariesFile = path.join(dataDir, 'summaries.json');

function loadSummariesFromDisk() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    if (fs.existsSync(summariesFile)) {
      const raw = fs.readFileSync(summariesFile, 'utf-8');
      const obj = JSON.parse(raw || '{}');
      Object.entries(obj).forEach(([k, v]) => userSummaries.set(k, v));
      console.log('🧠 Loaded summaries from disk:', userSummaries.size);
    }
  } catch (e) {
    console.log('Failed to load summaries:', e.message);
  }
}

function saveSummariesToDisk() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    const obj = Object.fromEntries(userSummaries.entries());
    fs.writeFileSync(summariesFile, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.log('Failed to save summaries:', e.message);
  }
}

// Mood detection function
function detectMoodFromMessage(message) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down') || 
      lowerMessage.includes('terrible') || lowerMessage.includes('horrible') || lowerMessage.includes('bad')) {
    return 'sad';
  } else if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed') || lowerMessage.includes('pressure') || 
             lowerMessage.includes('deadline') || lowerMessage.includes('exam') || lowerMessage.includes('work')) {
    return 'stressed';
  } else if (lowerMessage.includes('angry') || lowerMessage.includes('mad') || lowerMessage.includes('frustrated')) {
    return 'angry';
  } else if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great') || 
             lowerMessage.includes('excited') || lowerMessage.includes('proud')) {
    return 'happy';
  } else if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('sleep')) {
    return 'tired';
  } else {
    return 'neutral';
  }
}

// Buddy mode chat endpoint - AI-driven conversational responses
app.post('/chat', async (req, res) => {
  const { message, userName, userAge, userGender, userLocation, userId = 'default', conversationHistory = [] } = req.body;
  
  try {
    console.log('Chat Request - Message:', message);
    console.log('User Name:', userName);
    console.log('Conversation History Length:', conversationHistory.length);
    console.log('API Key Present:', !!process.env.GEMINI_API_KEY);
    
    // AI-first approach: Use Gemini API for all responses with conversation context
    if (!process.env.GEMINI_API_KEY) {
      console.error('⚠️ GEMINI_API_KEY not found - cannot generate AI responses');
      return res.status(500).json({ 
        reply: "I'm sorry, I'm having trouble connecting right now. Please check the server configuration.", 
        mood: 'neutral'
      });
    }

    try {
      // Build system instruction with Palo Alto context
      const systemPrompt = `You are Luna, a warm and empathetic wellness companion in buddy mode. 
- User's name: ${userName || 'friend'}
- Age: ${userAge || 'not specified'}
- Location: ${userLocation || 'not specified'}
- Gender: ${userGender || 'not specified'}

Your personality:
- Be warm, empathetic, and genuinely caring
- Adapt your tone to match the user's age and emotional state
- For teenagers, be relatable and understanding
- Show deep empathy for loss, grief, or difficult emotions
- Keep responses conversational, natural, and under 150 words
- Always ask a relevant follow-up question to continue the conversation
- Remember previous parts of the conversation and reference them naturally
- Be supportive, non-judgmental, and encouraging`;

      // Build conversation context from history (rolling summary + last N turns)
      const conversationParts = [];

      const userKey = userName || userId || 'default';
      const existingSummary = userSummaries.get(userKey) || '';

      if (existingSummary) {
        conversationParts.push({
          role: 'user',
          parts: [{ text: `Conversation summary so far (keep this in mind): ${existingSummary}` }]
        });
      }
      
      // Start with system prompt as first user message if no history
      if (!conversationHistory || conversationHistory.length === 0) {
        conversationParts.push({
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nUser: ${message}` }]
        });
      } else {
        // Add conversation history in alternating user/model format
        const recentHistory = conversationHistory.slice(-8); // Last 8 messages
        
        for (const msg of recentHistory) {
          if (msg.sender === 'user') {
            conversationParts.push({
              role: 'user',
              parts: [{ text: msg.text }]
            });
          } else if (msg.sender === 'bot') {
            conversationParts.push({
              role: 'model',
              parts: [{ text: msg.text }]
            });
          }
        }
        
        // Add current user message
        conversationParts.push({
          role: 'user',
          parts: [{ text: message }]
        });
      }

      console.log('🤖 Calling Gemini API with', conversationParts.length, 'conversation turns...');

        const geminiResponse = await axios.post(
        'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
        {
          contents: conversationParts,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1024,
            topP: 0.9,
            topK: 40
          }
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const firstCandidate = geminiResponse?.data?.candidates?.[0];
      let aiReplyText = firstCandidate?.content?.parts?.[0]?.text || '';

      // If the model hit token limit or returned an empty text, retry once with a shorter context and higher token cap
      if (!aiReplyText || firstCandidate?.finishReason === 'MAX_TOKENS') {
        console.log('⚠️ Empty/Truncated response detected. Retrying with reduced context and higher token cap...');
        const reducedContext = conversationParts.slice(-6); // keep last 6 turns
        const retryResponse = await axios.post(
          'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
          {
            contents: reducedContext,
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 1536,
              topP: 0.9,
              topK: 40
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        aiReplyText = retryResponse?.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      if (aiReplyText) {
        const mood = detectMoodFromMessage(message);
        // Update rolling summary every few turns
        try {
          if (conversationHistory.length >= 6) {
            const toSummarize = conversationHistory.slice(-8).map(m => `${m.sender}: ${m.text}`).join('\n');
            const summaryPrompt = `Update this running conversation summary in 2-3 sentences, keeping key facts, emotions, and goals.\n\nExisting summary: ${existingSummary || '(none)'}\n\nRecent turns:\n${toSummarize}`;
            const summaryResp = await axios.post(
              'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-pro:generateContent?key=' + process.env.GEMINI_API_KEY,
              {
                contents: [{ role: 'user', parts: [{ text: summaryPrompt }] }],
                generationConfig: {
                  temperature: 0.3,
                  maxOutputTokens: 180
                }
              },
              { headers: { 'Content-Type': 'application/json' } }
            );
            const newSummary = summaryResp?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            if (newSummary) {
              userSummaries.set(userKey, newSummary);
              saveSummariesToDisk();
            }
          }
        } catch (e) {
          console.log('Summary update skipped:', e?.message);
        }
        console.log('✅ Gemini API successful');
        return res.json({ 
          reply: aiReplyText.trim(), 
          mood: mood,
          conversationCount: conversationHistory.length + 1,
          relationship: 'acquainted',
          mode: 'buddy'
        });
      }

      // If still no text, fall back to a graceful empathetic response
      console.warn('⚠️ Gemini returned no text after retry. Using graceful fallback.');
      const mood = detectMoodFromMessage(message);
      return res.json({
        reply: `I hear you. I'm here with you. Can you tell me a little more about what's making you feel this way?`,
        mood: mood,
        conversationCount: conversationHistory.length + 1,
        relationship: 'acquainted',
        mode: 'buddy'
      });
    } catch (apiError) {
      console.error('❌ Gemini API failed:');
      console.error('Error message:', apiError.message);
      if (apiError.response) {
        console.error('Response status:', apiError.response.status);
        console.error('Response data:', JSON.stringify(apiError.response.data, null, 2));
      } else if (apiError.request) {
        console.error('No response received - request made but no response');
      }
      
      // Minimal fallback only if API completely fails
      const mood = detectMoodFromMessage(message);
      return res.json({ 
        reply: "I'm having trouble processing that right now, but I'm here for you. Could you try rephrasing that?",
      mood: mood,
        conversationCount: conversationHistory.length + 1,
      relationship: 'acquainted',
      mode: 'buddy'
    });
    }
    
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ 
      reply: "I'm sorry, I'm having a little trouble right now. But I'm still here for you. What's on your mind?", 
      mood: 'neutral',
      mode: 'buddy'
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', mode: 'buddy' });
});

// Welcome endpoint for onboarding
app.get('/welcome', (req, res) => {
  res.json({ 
    greeting: "Hi there! I'm Luna, your wellness companion. It's so nice to meet you! 🌙",
    askName: "What should I call you? I'd love to know your name so we can have a more personal conversation.",
    askExpectations: "What brings you here today? Are you looking for someone to talk to, need some emotional support, or just want to check in with yourself?",
    askHelp: "Is there anything specific you'd like help with? I'm here to listen, offer support, and help you feel better."
  });
});

app.listen(PORT, () => {
  console.log(`Luna Wellness Chatbot (Buddy Mode) running on port ${PORT}`);
  // Load summaries at startup
  loadSummariesFromDisk();
});
