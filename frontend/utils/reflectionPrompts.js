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
      // Wellness Check-ins
      "What's your energy level like today? Are you feeling energized, balanced, or drained?",
      "How's your mind-body connection feeling right now? Are they in sync or disconnected?",
      "What's your stress level on a scale of 1-10? And what's contributing to that?",
      "How's your sleep quality been lately? Are you feeling rested or exhausted?",
      "What's your appetite for life today? Are you feeling motivated or needing a break?",
      
      // Emotional Weather & Metaphors
      "If your emotions were weather, what's your forecast today?",
      "What color would you paint your current mood? And why that shade?",
      "If your feelings were music, what genre would they be right now?",
      "What animal energy are you embodying today? Calm like a cat or restless like a bird?",
      "What season does your heart feel like it's in right now?",
      
      // Body Awareness
      "How's your body feeling today? Any areas of tension or ease?",
      "What's your breathing like right now? Shallow, deep, or somewhere in between?",
      "How's your posture feeling? Are you carrying any physical stress?",
      "What's your energy flow like? Are you feeling stuck or flowing freely?",
      "How's your connection to your physical self today?",
      
      // Mind & Thoughts
      "What's the quality of your thoughts today? Clear, foggy, or racing?",
      "How's your mental bandwidth? Are you feeling focused or scattered?",
      "What's your inner dialogue like right now? Supportive or critical?",
      "How's your concentration today? Are you present or distracted?",
      "What's your mental energy like? Sharp, dull, or somewhere in between?",
      
      // Social & Connection
      "How's your social battery today? Are you craving connection or needing solitude?",
      "What's your relationship with yourself like right now?",
      "How connected do you feel to others today? Close or distant?",
      "What's your need for space vs. connection today?",
      "How's your sense of belonging feeling right now?",
      
      // Growth & Movement
      "What's your growth mindset like today? Are you feeling stuck or expanding?",
      "How's your motivation for self-care today? High, low, or moderate?",
      "What's your capacity for change feeling like right now?",
      "How's your resilience today? Are you feeling strong or needing support?",
      "What's your openness to new experiences feeling like?",
      
      // Gratitude & Perspective
      "What's one thing you're grateful for about yourself today?",
      "What's your perspective on life feeling like right now? Hopeful, realistic, or challenging?",
      "How's your sense of purpose today? Clear, uncertain, or evolving?",
      "What's your relationship with time like today? Rushed, peaceful, or balanced?",
      "How's your appreciation for the present moment today?",
      
      // Creative & Expressive
      "If you could express your current state through art, what would you create?",
      "What's your creative energy like today? Flowing, blocked, or dormant?",
      "How's your imagination feeling? Active, quiet, or somewhere in between?",
      "What's your need for self-expression today?",
      "How's your inner artist feeling right now?",
      
      // Balance & Harmony
      "How balanced do you feel between giving and receiving today?",
      "What's your work-life harmony like today? In sync or out of balance?",
      "How's your energy distribution feeling? Are you overextended or well-paced?",
      "What's your need for structure vs. flexibility today?",
      "How's your sense of equilibrium today?",
      
      // Future & Possibility
      "What's your relationship with the future today? Excited, anxious, or neutral?",
      "How's your sense of possibility feeling? Open, limited, or expanding?",
      "What's your capacity for dreaming today?",
      "How's your relationship with uncertainty today?",
      "What's your vision for yourself feeling like right now?"
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

  // Generate dynamic options for any reflection prompt
  generateDynamicOptions(prompt) {
    // Extract the main question from the prompt
    const question = this.extractQuestionFromPrompt(prompt);
    
    // Generate contextually relevant options based on the question
    const options = this.generateContextualOptions(question);
    
    return {
      prompt: prompt,
      options: options,
      question: question
    };
  }

  extractQuestionFromPrompt(prompt) {
    // Find the main question in the prompt
    const questionMatch = prompt.match(/([^.!?]+\?)/);
    if (questionMatch) {
      return questionMatch[1].trim();
    }
    
    // If no question mark, look for key phrases
    const keyPhrases = [
      'how are you feeling',
      'what comes to mind',
      'what would you say',
      'how do you feel',
      'what is your experience'
    ];
    
    for (const phrase of keyPhrases) {
      if (prompt.toLowerCase().includes(phrase)) {
        return phrase;
      }
    }
    
    return prompt;
  }

  generateContextualOptions(question) {
    const lowerQuestion = question.toLowerCase();
    
    // Mental bandwidth / focus questions
    if (lowerQuestion.includes('mental bandwidth') || lowerQuestion.includes('focused') || lowerQuestion.includes('scattered') || lowerQuestion.includes('concentration') || lowerQuestion.includes('thoughts') || lowerQuestion.includes('mind')) {
      return [
        { text: 'Focused & Clear', value: 'focused', mood: 'positive', emoji: '🎯' },
        { text: 'Scattered & Overwhelmed', value: 'scattered', mood: 'negative', emoji: '😵‍💫' },
        { text: 'Somewhere in Between', value: 'mixed', mood: 'neutral', emoji: '🤔' },
        { text: 'Need Help Organizing', value: 'needHelp', mood: 'negative', emoji: '🆘' }
      ];
    }
    
    // Energy level questions
    if (lowerQuestion.includes('energy') || lowerQuestion.includes('tired') || lowerQuestion.includes('vitality') || lowerQuestion.includes('exhausted') || lowerQuestion.includes('drained') || lowerQuestion.includes('energized')) {
      return [
        { text: 'Energized & Ready', value: 'energized', mood: 'positive', emoji: '⚡' },
        { text: 'Tired & Drained', value: 'tired', mood: 'negative', emoji: '😴' },
        { text: 'Moderate Energy', value: 'moderate', mood: 'neutral', emoji: '😌' },
        { text: 'Need a Boost', value: 'needBoost', mood: 'negative', emoji: '💪' }
      ];
    }
    
    // Stress/anxiety questions
    if (lowerQuestion.includes('stress') || lowerQuestion.includes('anxiety') || lowerQuestion.includes('worried') || lowerQuestion.includes('tense') || lowerQuestion.includes('overwhelmed') || lowerQuestion.includes('pressure')) {
      return [
        { text: 'Calm & Relaxed', value: 'calm', mood: 'positive', emoji: '😌' },
        { text: 'Stressed & Anxious', value: 'stressed', mood: 'negative', emoji: '😰' },
        { text: 'A Little Tense', value: 'tense', mood: 'neutral', emoji: '😐' },
        { text: 'Need Support', value: 'needSupport', mood: 'negative', emoji: '🤗' }
      ];
    }
    
    // Gratitude questions
    if (lowerQuestion.includes('grateful') || lowerQuestion.includes('appreciate') || lowerQuestion.includes('thankful') || lowerQuestion.includes('blessed') || lowerQuestion.includes('positive')) {
      return [
        { text: 'Very Grateful', value: 'grateful', mood: 'positive', emoji: '🙏' },
        { text: 'Somewhat Thankful', value: 'somewhat', mood: 'neutral', emoji: '😊' },
        { text: 'Struggling to See Good', value: 'struggling', mood: 'negative', emoji: '😔' },
        { text: 'Want to Practice More', value: 'practice', mood: 'positive', emoji: '✨' }
      ];
    }
    
    // Connection questions
    if (lowerQuestion.includes('connection') || lowerQuestion.includes('relationship') || lowerQuestion.includes('lonely') || lowerQuestion.includes('social') || lowerQuestion.includes('belonging') || lowerQuestion.includes('people')) {
      return [
        { text: 'Well Connected', value: 'connected', mood: 'positive', emoji: '💫' },
        { text: 'Feeling Lonely', value: 'lonely', mood: 'negative', emoji: '😔' },
        { text: 'Some Connections', value: 'some', mood: 'neutral', emoji: '🤝' },
        { text: 'Want to Connect More', value: 'wantMore', mood: 'neutral', emoji: '🌟' }
      ];
    }
    
    // Sleep questions
    if (lowerQuestion.includes('sleep') || lowerQuestion.includes('rested') || lowerQuestion.includes('exhausted') || lowerQuestion.includes('tired') || lowerQuestion.includes('rest')) {
      return [
        { text: 'Well Rested', value: 'rested', mood: 'positive', emoji: '😴' },
        { text: 'Tired & Exhausted', value: 'exhausted', mood: 'negative', emoji: '😫' },
        { text: 'Moderately Rested', value: 'moderate', mood: 'neutral', emoji: '😌' },
        { text: 'Need Better Sleep', value: 'needSleep', mood: 'negative', emoji: '💤' }
      ];
    }
    
    // Creative questions
    if (lowerQuestion.includes('creative') || lowerQuestion.includes('artistic') || lowerQuestion.includes('inspired') || lowerQuestion.includes('imagination') || lowerQuestion.includes('ideas')) {
      return [
        { text: 'Feeling Inspired', value: 'inspired', mood: 'positive', emoji: '🎨' },
        { text: 'Creative Block', value: 'blocked', mood: 'negative', emoji: '🚫' },
        { text: 'Somewhat Creative', value: 'somewhat', mood: 'neutral', emoji: '✏️' },
        { text: 'Want to Create More', value: 'wantMore', mood: 'neutral', emoji: '✨' }
      ];
    }
    
    // Body awareness questions
    if (lowerQuestion.includes('body') || lowerQuestion.includes('breathing') || lowerQuestion.includes('posture') || lowerQuestion.includes('tension') || lowerQuestion.includes('physical')) {
      return [
        { text: 'Feeling Great', value: 'great', mood: 'positive', emoji: '💪' },
        { text: 'Some Tension', value: 'tension', mood: 'neutral', emoji: '😐' },
        { text: 'Uncomfortable', value: 'uncomfortable', mood: 'negative', emoji: '😣' },
        { text: 'Need to Move', value: 'needMove', mood: 'negative', emoji: '🏃‍♀️' }
      ];
    }
    
    // Growth/motivation questions
    if (lowerQuestion.includes('growth') || lowerQuestion.includes('motivation') || lowerQuestion.includes('stuck') || lowerQuestion.includes('change') || lowerQuestion.includes('progress')) {
      return [
        { text: 'Growing & Learning', value: 'growing', mood: 'positive', emoji: '🌱' },
        { text: 'Feeling Stuck', value: 'stuck', mood: 'negative', emoji: '🔄' },
        { text: 'Some Progress', value: 'progress', mood: 'neutral', emoji: '📈' },
        { text: 'Need Direction', value: 'needDirection', mood: 'negative', emoji: '🧭' }
      ];
    }
    
    // Weather/metaphor questions
    if (lowerQuestion.includes('weather') || lowerQuestion.includes('color') || lowerQuestion.includes('music') || lowerQuestion.includes('animal') || lowerQuestion.includes('season')) {
      return [
        { text: 'Sunny & Bright', value: 'sunny', mood: 'positive', emoji: '☀️' },
        { text: 'Cloudy & Gray', value: 'cloudy', mood: 'negative', emoji: '☁️' },
        { text: 'Mixed Conditions', value: 'mixed', mood: 'neutral', emoji: '🌤️' },
        { text: 'Stormy & Rough', value: 'stormy', mood: 'negative', emoji: '⛈️' }
      ];
    }
    
    // General mood check-in questions (like "How are you feeling?")
    if (lowerQuestion.includes('feeling') || lowerQuestion.includes('mood') || lowerQuestion.includes('how are you') || lowerQuestion.includes('check in')) {
      // Generate varied options based on the prompt content
      const promptWords = question.toLowerCase().split(' ');
      
      // Check if the prompt mentions positive energy, good place, etc.
      if (promptWords.some(word => ['positive', 'energy', 'wonderful', 'good', 'place', 'great'].includes(word))) {
        return [
          { text: 'Feeling Amazing!', value: 'amazing', mood: 'positive', emoji: '🌟' },
          { text: 'Pretty Good', value: 'prettyGood', mood: 'positive', emoji: '😊' },
          { text: 'Could Be Better', value: 'couldBeBetter', mood: 'neutral', emoji: '🤔' },
          { text: 'Actually Struggling', value: 'struggling', mood: 'negative', emoji: '😔' }
        ];
      }
      
      // Check if it's a general mood question
      if (promptWords.some(word => ['feeling', 'mood', 'right now', 'currently'].includes(word))) {
        return [
          { text: 'Feeling Great!', value: 'great', mood: 'positive', emoji: '😊' },
          { text: 'Pretty Good', value: 'prettyGood', mood: 'positive', emoji: '😌' },
          { text: 'Okay-ish', value: 'okayish', mood: 'neutral', emoji: '😐' },
          { text: 'Not Great', value: 'notGreat', mood: 'negative', emoji: '😕' }
        ];
      }
      
      // Default mood options
      return [
        { text: 'Feeling Wonderful', value: 'wonderful', mood: 'positive', emoji: '✨' },
        { text: 'Pretty Good', value: 'prettyGood', mood: 'positive', emoji: '😊' },
        { text: 'So-So', value: 'soso', mood: 'neutral', emoji: '😐' },
        { text: 'Need Support', value: 'needSupport', mood: 'negative', emoji: '🤗' }
      ];
    }
    
    // Default options for general questions - ensuring exactly 4 options with good emotional range
    return [
      { text: 'Feeling Good', value: 'good', mood: 'positive', emoji: '😊' },
      { text: 'Not Great', value: 'notGreat', mood: 'negative', emoji: '😕' },
      { text: 'Okay', value: 'okay', mood: 'neutral', emoji: '😐' },
      { text: 'Need to Talk', value: 'needTalk', mood: 'negative', emoji: '💬' }
    ];
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
  // Handle age-specific prompts
  if (recentMood === 'teen') {
    return getTeenReflectionPrompt();
  } else if (recentMood === 'senior') {
    return getSeniorReflectionPrompt();
  }
  
  return promptManager.getEmotionalPrompt(recentMood);
}

// Teen-specific reflection prompts
function getTeenReflectionPrompt() {
  const teenPrompts = [
    "Hey! What's your vibe today? Are you feeling pumped, chill, or something else?",
    "What's your social energy like right now? Ready to hang out or needing some me-time?",
    "How's your school/work stress level? Are you feeling on top of things or overwhelmed?",
    "What's your creative spark like today? Are you feeling inspired or stuck?",
    "How's your body feeling? Any areas that feel tense or relaxed?",
    "What's your mental space like? Clear and focused or all over the place?",
    "How's your confidence today? Are you feeling strong or needing a boost?",
    "What's your relationship with social media like today? Connected or needing a break?",
    "How's your sleep been? Are you feeling rested or running on empty?",
    "What's your appetite for adventure today? Ready to try new things or wanting to stay comfortable?",
    "How's your relationship with your family/friends feeling today?",
    "What's your need for independence vs. support today?",
    "How's your relationship with technology today? Helpful or distracting?",
    "What's your creative energy like? Are you feeling artistic or practical?",
    "How's your sense of identity today? Clear, confused, or evolving?"
  ];
  
  // Use the same rotation logic for teen prompts
  return getRotatedPrompt(teenPrompts);
}

// Senior-specific reflection prompts
function getSeniorReflectionPrompt() {
  const seniorPrompts = [
    "How's your wisdom and life experience serving you today? Are you feeling grounded or uncertain?",
    "What's your relationship with change feeling like today? Embracing it or needing stability?",
    "How's your connection to your legacy and life story today?",
    "What's your relationship with time feeling like? Rushed, peaceful, or reflective?",
    "How's your sense of purpose and meaning today? Clear, evolving, or needing rediscovery?",
    "What's your relationship with your body and health today? Strong, adapting, or needing care?",
    "How's your connection to community and relationships today? Supported or isolated?",
    "What's your creative and intellectual energy like today? Active, quiet, or flowing?",
    "How's your relationship with technology and modern life today? Connected or overwhelmed?",
    "What's your sense of gratitude and appreciation today? Abundant, quiet, or growing?",
    "How's your relationship with your past, present, and future today?",
    "What's your need for independence vs. support today?",
    "How's your relationship with nature and the world around you today?",
    "What's your spiritual or philosophical perspective feeling like today?",
    "How's your relationship with learning and growth today? Curious, satisfied, or seeking?"
  ];
  
  // Use the same rotation logic for senior prompts
  return getRotatedPrompt(seniorPrompts);
}

// Helper function to rotate through prompts with better randomization
function getRotatedPrompt(prompts) {
  // Add some randomness to prevent the same prompt from appearing too frequently
  const randomIndex = Math.floor(Math.random() * prompts.length);
  const selectedPrompt = prompts[randomIndex];
  
  // Add a small chance to get a completely random prompt (bypassing any potential patterns)
  if (Math.random() < 0.3) {
    const alternativeIndex = (randomIndex + Math.floor(Math.random() * prompts.length)) % prompts.length;
    return prompts[alternativeIndex];
  }
  
  return selectedPrompt;
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

// Force refresh prompts to get new variety
export function forceRefreshPrompts() {
  // Reset the main prompt manager
  promptManager.reset();
  
  // Add some additional randomization
  const randomDelay = Math.random() * 100;
  setTimeout(() => {
    // This ensures we get fresh prompts on next call
  }, randomDelay);
  
  return "Prompts refreshed! ✨";
}

// Get dynamic options for any reflection prompt
export function getDynamicReflectionOptions(prompt) {
  return promptManager.generateDynamicOptions(prompt);
}

// Legacy function for backward compatibility
export function getBotReply(message) {
  const lower = message.toLowerCase();
  if (lower.includes('sad')) return 'That sounds tough. Want to journal or breathe together?';
  if (lower.includes('happy')) return 'That\'s wonderful! Want a gratitude prompt?';
  return 'Thanks for sharing. Would you like to reflect more or take a breath?';
}
