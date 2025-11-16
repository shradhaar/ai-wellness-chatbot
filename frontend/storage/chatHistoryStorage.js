import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAT_HISTORY_KEY = 'chatHistory';
const CURRENT_SESSION_KEY = 'currentSessionId';
const SESSIONS_KEY = 'chatSessions';

/**
 * Save chat history for the current session
 */
export const saveChatHistory = async (chatHistory, sessionId = null) => {
  try {
    // Get or create session ID
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
      if (!currentSessionId) {
        currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(CURRENT_SESSION_KEY, currentSessionId);
      }
    }

    // Get all sessions
    const sessionsData = await AsyncStorage.getItem(SESSIONS_KEY);
    const sessions = sessionsData ? JSON.parse(sessionsData) : {};

    // Update or create session
    if (!sessions[currentSessionId]) {
      sessions[currentSessionId] = {
        id: currentSessionId,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        messageCount: 0,
        title: null // Will be auto-generated from first message
      };
    }

    // Update session metadata
    sessions[currentSessionId].lastUpdated = new Date().toISOString();
    sessions[currentSessionId].messageCount = chatHistory.length;
    
    // Generate title from first user message if not set
    if (!sessions[currentSessionId].title && chatHistory.length > 0) {
      const firstUserMessage = chatHistory.find(msg => msg.sender === 'user');
      if (firstUserMessage) {
        const title = firstUserMessage.text.substring(0, 50);
        sessions[currentSessionId].title = title.length < firstUserMessage.text.length 
          ? title + '...' 
          : title;
      }
    }

    // Save session metadata
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));

    // Save chat history for this session
    const historyKey = `${CHAT_HISTORY_KEY}_${currentSessionId}`;
    await AsyncStorage.setItem(historyKey, JSON.stringify(chatHistory));

    return currentSessionId;
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
};

/**
 * Load chat history for a specific session
 */
export const loadChatHistory = async (sessionId = null) => {
  try {
    let targetSessionId = sessionId;
    
    // If no session ID provided, get current session
    if (!targetSessionId) {
      targetSessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
    }

    if (!targetSessionId) {
      return [];
    }

    const historyKey = `${CHAT_HISTORY_KEY}_${targetSessionId}`;
    const historyData = await AsyncStorage.getItem(historyKey);
    
    if (!historyData) {
      return [];
    }

    const history = JSON.parse(historyData);
    
    // Convert timestamp strings back to Date objects
    return history.map(msg => ({
      ...msg,
      timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
    }));
  } catch (error) {
    console.error('Error loading chat history:', error);
    return [];
  }
};

/**
 * Get all chat sessions
 */
export const getAllSessions = async () => {
  try {
    const sessionsData = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!sessionsData) {
      return [];
    }

    const sessions = JSON.parse(sessionsData);
    
    // Convert to array and sort by lastUpdated (newest first)
    return Object.values(sessions).sort((a, b) => 
      new Date(b.lastUpdated) - new Date(a.lastUpdated)
    );
  } catch (error) {
    console.error('Error loading sessions:', error);
    return [];
  }
};

/**
 * Get current session ID
 */
export const getCurrentSessionId = async () => {
  try {
    return await AsyncStorage.getItem(CURRENT_SESSION_KEY);
  } catch (error) {
    console.error('Error getting current session ID:', error);
    return null;
  }
};

/**
 * Create a new chat session
 */
export const createNewSession = async () => {
  try {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem(CURRENT_SESSION_KEY, newSessionId);
    
    // Initialize empty session
    const sessionsData = await AsyncStorage.getItem(SESSIONS_KEY);
    const sessions = sessionsData ? JSON.parse(sessionsData) : {};
    
    sessions[newSessionId] = {
      id: newSessionId,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      messageCount: 0,
      title: 'New Conversation'
    };
    
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    
    // Initialize empty history
    const historyKey = `${CHAT_HISTORY_KEY}_${newSessionId}`;
    await AsyncStorage.setItem(historyKey, JSON.stringify([]));
    
    return newSessionId;
  } catch (error) {
    console.error('Error creating new session:', error);
    throw error;
  }
};

/**
 * Switch to a different session
 */
export const switchToSession = async (sessionId) => {
  try {
    await AsyncStorage.setItem(CURRENT_SESSION_KEY, sessionId);
    return await loadChatHistory(sessionId);
  } catch (error) {
    console.error('Error switching session:', error);
    throw error;
  }
};

/**
 * Delete a chat session
 */
export const deleteSession = async (sessionId) => {
  try {
    // Remove session from sessions list
    const sessionsData = await AsyncStorage.getItem(SESSIONS_KEY);
    if (sessionsData) {
      const sessions = JSON.parse(sessionsData);
      delete sessions[sessionId];
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }

    // Remove chat history
    const historyKey = `${CHAT_HISTORY_KEY}_${sessionId}`;
    await AsyncStorage.removeItem(historyKey);

    // If this was the current session, clear current session ID
    const currentSessionId = await AsyncStorage.getItem(CURRENT_SESSION_KEY);
    if (currentSessionId === sessionId) {
      await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
    }

    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
};

/**
 * Clear all chat history (use with caution)
 */
export const clearAllChatHistory = async () => {
  try {
    // Get all sessions
    const sessions = await getAllSessions();
    
    // Delete each session's history
    for (const session of sessions) {
      const historyKey = `${CHAT_HISTORY_KEY}_${session.id}`;
      await AsyncStorage.removeItem(historyKey);
    }
    
    // Clear sessions metadata
    await AsyncStorage.removeItem(SESSIONS_KEY);
    await AsyncStorage.removeItem(CURRENT_SESSION_KEY);
    
    return true;
  } catch (error) {
    console.error('Error clearing all chat history:', error);
    throw error;
  }
};

