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
const conversationsFile = path.join(dataDir, 'conversations.json');

// Store full conversation history per user (optional - for cross-device sync)
const userConversations = new Map();

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

// Load conversation history from disk
function loadConversationsFromDisk() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    if (fs.existsSync(conversationsFile)) {
      const raw = fs.readFileSync(conversationsFile, 'utf-8');
      const obj = JSON.parse(raw || '{}');
      Object.entries(obj).forEach(([k, v]) => userConversations.set(k, v));
      console.log('💬 Loaded conversations from disk:', userConversations.size, 'users');
    }
  } catch (e) {
    console.log('Failed to load conversations:', e.message);
  }
}

// Save conversation history to disk
function saveConversationsToDisk() {
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);
    const obj = Object.fromEntries(userConversations.entries());
    fs.writeFileSync(conversationsFile, JSON.stringify(obj, null, 2), 'utf-8');
  } catch (e) {
    console.log('Failed to save conversations:', e.message);
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
- PRIORITIZE SHORTER, CONCISE RESPONSES (aim for 50-150 words when possible)
- However, if the topic requires more detail (like serious health concerns, complex emotional issues, or important information), you may write longer responses
- CRITICAL: NEVER cut off mid-sentence or mid-thought. Always complete your full response, even if it means writing more
- If you need to provide a longer response, make sure it has a clear beginning, middle, and end
- Always end with proper punctuation (period, question mark, or exclamation)
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

      // Helper function to detect if response is truncated
      const isTruncated = (text, finishReason) => {
        if (!text) return true;
        if (finishReason === 'MAX_TOKENS') return true;
        
        const trimmed = text.trim();
        
        // Check if it ends mid-word (very clear sign of truncation)
        if (trimmed.length > 0) {
          const lastChar = trimmed[trimmed.length - 1];
          const secondLastChar = trimmed.length > 1 ? trimmed[trimmed.length - 2] : '';
          
          // Ends with a letter followed by nothing (mid-word cut)
          if (/[a-zA-Z]/.test(lastChar) && !/[a-zA-Z0-9]/.test(secondLastChar) && trimmed.length > 100) {
            // More likely to be truncated if it's a longer response ending abruptly
            return true;
          }
          
          // Check if it ends with incomplete common phrases (like "It sounds")
          const lastFewWords = trimmed.split(/\s+/).slice(-2).join(' ').toLowerCase();
          const incompletePhrases = ['it sounds', 'it seems', 'i think', 'you might', 'perhaps you', 'maybe you'];
          if (incompletePhrases.some(phrase => lastFewWords === phrase) && trimmed.length > 150) {
            // Likely truncated if it ends with an incomplete phrase and is reasonably long
            return true;
          }
        }
        
        return false;
      };

      // Use faster gemini-2.5-flash model with higher token limit to prevent cutoffs
      const geminiResponse = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
        {
          contents: conversationParts,
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 4096, // Increased to 4096 to allow longer complete responses when needed
            topP: 0.9,
            topK: 40,
            stopSequences: [] // Don't stop early
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
      const finishReason = firstCandidate?.finishReason || 'UNKNOWN';

      console.log(`📝 Response received: ${aiReplyText.length} chars, finishReason: ${finishReason}`);

      // Check if response is truncated and retry with more tokens
      if (!aiReplyText || isTruncated(aiReplyText, finishReason) || finishReason === 'MAX_TOKENS') {
        console.log('⚠️ Truncated response detected. Retrying with reduced context and maximum token cap...');
        const reducedContext = conversationParts.slice(-6); // keep last 6 turns
        
        // Add explicit instruction to complete the response
        const completionInstruction = {
          role: 'user',
          parts: [{ text: 'IMPORTANT: Complete your full response. Do not cut off mid-sentence. Finish your thought completely with proper punctuation.' }]
        };
        const contextWithInstruction = [...reducedContext, completionInstruction];
        
        const retryResponse = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
          {
            contents: contextWithInstruction,
            generationConfig: {
              temperature: 0.6,
              maxOutputTokens: 6144, // Maximum for flash model (8192 is max, but 6144 is safer)
              topP: 0.9,
              topK: 40,
              stopSequences: []
            }
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        const retryCandidate = retryResponse?.data?.candidates?.[0];
        const retryText = retryCandidate?.content?.parts?.[0]?.text || '';
        const retryFinishReason = retryCandidate?.finishReason || 'UNKNOWN';
        
        console.log(`🔄 Retry response: ${retryText.length} chars, finishReason: ${retryFinishReason}`);
        
        // Use retry response if it's better (longer and complete)
        if (retryText && retryText.length > aiReplyText.length) {
          aiReplyText = retryText;
        } else if (retryText && !isTruncated(retryText, retryFinishReason)) {
          aiReplyText = retryText;
        } else if (retryText) {
          // Retry didn't help much, but use it if original was empty
          if (!aiReplyText) {
            aiReplyText = retryText;
          }
        }
      }
      
      // Final check: if response still seems incomplete, add a note
      if (aiReplyText && isTruncated(aiReplyText, finishReason)) {
        console.warn('⚠️ Response may still be incomplete after retry');
        // Don't add anything to the response, just log it
      }

      if (aiReplyText) {
        const mood = detectMoodFromMessage(message);
        
        // Send response immediately, update summary asynchronously (non-blocking)
        const response = { 
          reply: aiReplyText.trim(), 
          mood: mood,
          conversationCount: conversationHistory.length + 1,
          relationship: 'acquainted',
          mode: 'buddy'
        };
        
        // Update rolling summary asynchronously (fire-and-forget) - doesn't block response
        if (conversationHistory.length >= 6) {
          (async () => {
            try {
              const toSummarize = conversationHistory.slice(-8).map(m => `${m.sender}: ${m.text}`).join('\n');
              const summaryPrompt = `Update this running conversation summary in 2-3 sentences, keeping key facts, emotions, and goals.\n\nExisting summary: ${existingSummary || '(none)'}\n\nRecent turns:\n${toSummarize}`;
              const summaryResp = await axios.post(
                'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + process.env.GEMINI_API_KEY,
                {
                  contents: [{ role: 'user', parts: [{ text: summaryPrompt }] }],
                  generationConfig: {
                    temperature: 0.3,
                    maxOutputTokens: 150 // Reduced for faster summary generation
                  }
                },
                { headers: { 'Content-Type': 'application/json' } }
              );
              const newSummary = summaryResp?.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
              if (newSummary) {
                userSummaries.set(userKey, newSummary);
                saveSummariesToDisk();
              }
            } catch (e) {
              console.log('Summary update skipped:', e?.message);
            }
          })();
        }
        
        console.log('✅ Gemini API successful');
        return res.json(response);
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

// Optional: Save conversation history to backend (for cross-device sync)
app.post('/conversations/save', (req, res) => {
  try {
    const { userId, sessionId, conversationHistory } = req.body;
    
    if (!userId || !sessionId) {
      return res.status(400).json({ error: 'userId and sessionId are required' });
    }

    const userKey = userId;
    if (!userConversations.has(userKey)) {
      userConversations.set(userKey, {});
    }

    const userSessions = userConversations.get(userKey);
    userSessions[sessionId] = {
      sessionId,
      history: conversationHistory || [],
      lastUpdated: new Date().toISOString(),
      messageCount: conversationHistory ? conversationHistory.length : 0
    };

    // Save to disk asynchronously
    saveConversationsToDisk();

    res.json({ success: true, message: 'Conversation saved' });
  } catch (error) {
    console.error('Error saving conversation:', error);
    res.status(500).json({ error: 'Failed to save conversation' });
  }
});

// Optional: Load conversation history from backend
app.get('/conversations/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    const userKey = userId;

    if (!userConversations.has(userKey)) {
      return res.json({ sessions: {} });
    }

    const userSessions = userConversations.get(userKey);
    res.json({ sessions: userSessions });
  } catch (error) {
    console.error('Error loading conversations:', error);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
});

// Optional: Load specific session from backend
app.get('/conversations/:userId/:sessionId', (req, res) => {
  try {
    const { userId, sessionId } = req.params;
    const userKey = userId;

    if (!userConversations.has(userKey)) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userSessions = userConversations.get(userKey);
    if (!userSessions[sessionId]) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session: userSessions[sessionId] });
  } catch (error) {
    console.error('Error loading session:', error);
    res.status(500).json({ error: 'Failed to load session' });
  }
});

app.listen(PORT, () => {
  console.log(`Luna Wellness Chatbot (Buddy Mode) running on port ${PORT}`);
  // Load summaries and conversations at startup
  loadSummariesFromDisk();
  loadConversationsFromDisk();
});
