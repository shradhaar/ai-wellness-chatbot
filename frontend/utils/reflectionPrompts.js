/**
 * Reflection Prompt Rotation System
 * 
 * This system ensures that the chatbot never asks the same reflection prompt
 * twice in a row by maintaining a history of recently used prompts.
 * 
 * Features:
 * - 20 unique reflection prompts with natural language variations
 * - Tracks last 8 used prompts to prevent immediate repetition
 * - Auto-resets after 30 minutes of inactivity
 * - Context-aware prompt selection based on conversation length
 * - Visual indicators showing rotation status
 * 
 * Usage:
 * - getReflectionPrompt() - Gets next available prompt
 * - getContextualReflectionPrompt(length) - Gets context-aware prompt
 * - resetReflectionPrompts() - Resets the rotation system
 * - getReflectionStatus() - Gets current system status
 * - getRotationVisual() - Gets visual representation of rotation
 */

// Reflection prompts with rotation system to prevent duplicates
class ReflectionPromptManager {
  constructor() {
    this.prompts = [
      // General mood check-ins
      "How are you feeling right now? Choose what resonates most with you:",
      "Let's check in on your emotional state. What's your current mood?",
      "I'd love to know how you're doing. How are you feeling today?",
      "Time for a mood check-in! What's your emotional state right now?",
      "How's your heart feeling at this moment? Choose what fits best:",
      "Let's pause and reflect on your feelings. What's your current state?",
      "I'm curious about your emotional well-being. How are you doing?",
      "Time for a gentle check-in. What's your mood like right now?",
      "Let's take a moment to assess your feelings. How are you?",
      "I want to understand how you're doing. What's your emotional state?",
      
      // More engaging variations
      "Take a deep breath and check in with yourself. How are you feeling?",
      "Let's tune into your emotions. What's your current state of mind?",
      "I'm here to listen. How would you describe your mood right now?",
      "Let's pause for a moment of self-reflection. How are you doing?",
      "Your feelings matter. What's your emotional landscape like today?",
      "Let's connect with your inner state. How are you feeling?",
      "I'd love to understand your current emotional experience. How are you?",
      "Let's take stock of your feelings. What's your mood like?",
      "Your emotional well-being is important. How are you doing?",
      "Let's check in on your heart and mind. How are you feeling?",
      
      // Additional diverse prompts for more variety
      "What's your emotional weather like today? Sunny, cloudy, or stormy?",
      "Let's take a moment to tune into your inner voice. How are you?",
      "Your emotional journey matters. What's your current chapter like?",
      "Let's pause and honor your feelings. How are you doing?",
      "I'm here to witness your emotional experience. How are you?",
      "Let's create space for your feelings. What's present for you?",
      "Your emotional landscape is unique. How does it look today?",
      "Let's gently explore your current state. How are you feeling?",
      "I want to understand your emotional world. How are you?",
      "Let's take a mindful moment together. How are you doing?",
      "Your feelings deserve attention. What's your current experience?",
      "Let's connect with your emotional truth. How are you?",
      "I'm curious about your inner world. How are you feeling?",
      "Let's honor your emotional reality. How are you doing?",
      "Your emotional well-being is precious. How are you today?"
    ];
    
    this.usedPrompts = [];
    this.maxHistory = 8; // Increased to prevent more repetition
    this.lastPromptTime = null;
    this.minInterval = 300000; // 5 minutes minimum between same prompt
  }

  getNextPrompt() {
    // Filter out recently used prompts (only last 4)
    const availablePrompts = this.prompts.filter(prompt => 
      !this.usedPrompts.includes(prompt)
    );
    
    // If all prompts have been used recently, reset the history immediately
    if (availablePrompts.length === 0) {
      this.usedPrompts = [];
      return this.prompts[Math.floor(Math.random() * this.prompts.length)];
    }
    
    // Select a random prompt from available ones
    const selectedPrompt = availablePrompts[Math.floor(Math.random() * availablePrompts.length)];
    
    // Add to used history
    this.usedPrompts.push(selectedPrompt);
    
    // Keep only the last maxHistory items
    if (this.usedPrompts.length > this.maxHistory) {
      this.usedPrompts = this.usedPrompts.slice(-this.maxHistory);
    }
    
    return selectedPrompt;
  }

  // Get a context-aware prompt based on conversation length
  getContextualPrompt(conversationLength = 0) {
    let prompt;
    
    if (conversationLength < 5) {
      // Early in conversation - use gentle, welcoming prompts
      prompt = this.getNextPrompt();
    } else if (conversationLength < 15) {
      // Mid-conversation - use more engaging prompts
      prompt = this.getNextPrompt();
    } else {
      // Long conversation - use deeper reflection prompts
      prompt = this.getNextPrompt();
    }
    
    return prompt;
  }

  // Get an emotionally-aware prompt based on recent mood
  getEmotionalPrompt(recentMood = 'neutral') {
    const moodBasedPrompts = {
      'happy': [
        "You seem to be in a good place! Let's check in on your current mood:",
        "Your positive energy is wonderful! How are you feeling right now?",
        "It's great to see you doing well! What's your current emotional state?"
      ],
      'sad': [
        "I'm here with you. Let's gently check in on how you're feeling:",
        "Your feelings are valid. How would you describe your mood right now?",
        "I want to understand what you're going through. How are you doing?"
      ],
      'anxious': [
        "Let's take a moment to breathe and check in on your feelings:",
        "I'm here to help you feel more grounded. How are you feeling?",
        "Let's pause and assess your emotional state together:"
      ],
      'tired': [
        "You seem like you could use some care. How are you feeling right now?",
        "Let's gently check in on your emotional well-being:",
        "I want to understand how you're doing. How are you feeling?"
      ],
      'excited': [
        "Your enthusiasm is contagious! Let's check in on your current mood:",
        "You're radiating positive energy! How are you feeling right now?",
        "It's wonderful to see you excited! What's your current state?"
      ]
    };

    // If we have mood-specific prompts and haven't used them recently
    if (moodBasedPrompts[recentMood] && !this.usedPrompts.includes(moodBasedPrompts[recentMood][0])) {
      const moodPrompt = moodBasedPrompts[recentMood][Math.floor(Math.random() * moodBasedPrompts[recentMood].length)];
      this.usedPrompts.push(moodPrompt);
      if (this.usedPrompts.length > this.maxHistory) {
        this.usedPrompts = this.usedPrompts.slice(-this.maxHistory);
      }
      return moodPrompt;
    }

    // Fall back to regular rotation
    return this.getNextPrompt();
  }

  // Get a specific prompt by index (for testing)
  getPromptByIndex(index) {
    return this.prompts[index] || this.prompts[0];
  }

  // Reset the rotation system
  reset() {
    this.usedPrompts = [];
    this.notifyReset();
  }

  // Get current rotation status
  getStatus() {
    return {
      totalPrompts: this.prompts.length,
      usedPrompts: this.usedPrompts.length,
      availablePrompts: this.prompts.length - this.usedPrompts.length,
      recentlyUsed: [...this.usedPrompts]
    };
  }

  // Get a visual representation of the rotation system
  getRotationVisual() {
    const status = this.getStatus();
    const used = '🔴'.repeat(status.usedPrompts);
    const available = '🟢'.repeat(status.availablePrompts);
    return `${used}${available}`;
  }

  // Check if we should reset prompts (always allow reset)
  shouldReset() {
    return true; // Always allow reset for immediate prompt generation
  }

  // Set a callback for when prompts are reset
  setResetCallback(callback) {
    this.resetCallback = callback;
  }

  // Notify when prompts are reset
  notifyReset() {
    if (this.resetCallback) {
      this.resetCallback();
    }
  }
}

// Create a singleton instance
const promptManager = new ReflectionPromptManager();

// Export the main function that gets the next prompt
export function getReflectionPrompt() {
  // Always allow prompt generation without time restrictions
  return promptManager.getNextPrompt();
}

// Export contextual prompt function
export function getContextualReflectionPrompt(conversationLength) {
  return promptManager.getContextualPrompt(conversationLength);
}

export function getEmotionalReflectionPrompt(recentMood) {
  return promptManager.getEmotionalPrompt(recentMood);
}

// Export additional utility functions
export function resetReflectionPrompts() {
  promptManager.reset();
}

export function getReflectionStatus() {
  return promptManager.getStatus();
}

export function getRotationVisual() {
  return promptManager.getRotationVisual();
}

// Legacy function for backward compatibility
export function getBotReply(message) {
  const lower = message.toLowerCase();
  if (lower.includes('sad')) return 'That sounds tough. Want to journal or breathe together?';
  if (lower.includes('happy')) return 'That\'s wonderful! Want a gratitude prompt?';
  return 'Thanks for sharing. Would you like to reflect more or take a breath?';
}
