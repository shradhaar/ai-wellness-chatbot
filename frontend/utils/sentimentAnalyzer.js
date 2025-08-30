// Sentiment Analysis Utility for Dynamic Emoji Changes
// Analyzes conversation content to determine emotional state

// Emotional keywords and their sentiment scores
const emotionKeywords = {
  // Positive emotions
  positive: {
    'happy': ['happy', 'joy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic', 'awesome', 'brilliant', 'delighted', 'thrilled', 'ecstatic', 'elated', 'jubilant', 'cheerful', 'merry', 'gleeful', 'sunny', 'bright', 'uplifted'],
    'grateful': ['grateful', 'thankful', 'appreciate', 'blessed', 'fortunate', 'lucky', 'thank you', 'thanks', 'appreciation', 'gratitude', 'blessing'],
    'confident': ['confident', 'strong', 'capable', 'empowered', 'confident', 'assured', 'certain', 'positive', 'optimistic', 'hopeful', 'determined', 'resilient'],
    'peaceful': ['peaceful', 'calm', 'serene', 'tranquil', 'relaxed', 'content', 'satisfied', 'at ease', 'comfortable', 'centered', 'grounded', 'balanced'],
    'creative': ['creative', 'inspired', 'imaginative', 'artistic', 'innovative', 'expressive', 'passionate', 'enthusiastic', 'motivated', 'energized', 'vibrant', 'alive']
  },
  
  // Negative emotions
  negative: {
    'sad': ['sad', 'unhappy', 'depressed', 'down', 'blue', 'melancholy', 'gloomy', 'miserable', 'heartbroken', 'devastated', 'crushed', 'defeated', 'hopeless', 'despair'],
    'angry': ['angry', 'mad', 'furious', 'irritated', 'annoyed', 'frustrated', 'enraged', 'livid', 'outraged', 'fuming', 'seething', 'hostile', 'aggressive'],
    'anxious': ['anxious', 'worried', 'nervous', 'stressed', 'tense', 'overwhelmed', 'panicked', 'fearful', 'scared', 'terrified', 'afraid', 'concerned', 'uneasy'],
    'tired': ['tired', 'exhausted', 'fatigued', 'weary', 'drained', 'burned out', 'overwhelmed', 'stressed', 'overworked', 'drained', 'spent', 'worn out'],
    'lonely': ['lonely', 'isolated', 'alone', 'abandoned', 'rejected', 'unwanted', 'ignored', 'forgotten', 'disconnected', 'separated', 'distant', 'withdrawn']
  },
  
  // Neutral/Complex emotions
  neutral: {
    'contemplative': ['thinking', 'reflecting', 'contemplating', 'pondering', 'considering', 'wondering', 'curious', 'questioning', 'exploring', 'seeking', 'learning'],
    'uncertain': ['unsure', 'uncertain', 'confused', 'puzzled', 'perplexed', 'indecisive', 'doubtful', 'hesitant', 'wavering', 'ambivalent', 'mixed feelings'],
    'neutral': ['okay', 'fine', 'alright', 'neutral', 'indifferent', 'neither here nor there', 'so-so', 'average', 'normal', 'standard', 'regular']
  }
};

// Context-based sentiment analysis
const contextPatterns = {
  // Relationship and connection patterns
  connection: ['friend', 'family', 'love', 'care', 'support', 'together', 'we', 'us', 'our', 'relationship', 'bond', 'connection', 'trust'],
  isolation: ['alone', 'lonely', 'isolated', 'separated', 'distant', 'apart', 'disconnected', 'abandoned', 'rejected'],
  
  // Achievement and progress patterns
  achievement: ['accomplished', 'achieved', 'succeeded', 'won', 'completed', 'finished', 'progress', 'improvement', 'growth', 'development', 'advancement'],
  failure: ['failed', 'lost', 'mistake', 'error', 'wrong', 'failed', 'defeat', 'setback', 'disappointment', 'regret'],
  
  // Health and wellness patterns
  wellness: ['healthy', 'well', 'good', 'better', 'improving', 'healing', 'recovery', 'strength', 'energy', 'vitality', 'well-being'],
  illness: ['sick', 'ill', 'pain', 'hurt', 'suffering', 'struggling', 'difficult', 'hard', 'challenging', 'problem', 'issue']
};

// Emoji mapping for different emotional states
const emotionEmojis = {
  // Positive emotions
  'happy': ['😊', '😄', '😃', '😁', '🤗', '😆', '😅', '😂', '🥰', '😍', '🤩', '😋', '😎', '🤠', '🥳', '🎉', '✨', '🌟', '💫', '💖'],
  'grateful': ['🙏', '💝', '💕', '💗', '💓', '💞', '💟', '💜', '💙', '💚', '💛', '🧡', '❤️', '💖', '💘', '💍', '💎', '🌺', '🌸', '🌷'],
  'confident': ['💪', '🔥', '⚡', '🚀', '💎', '👑', '🏆', '🥇', '💯', '💪', '🦁', '🐯', '🦅', '🦉', '🦊', '🐺', '🐗', '🐻', '🐨', '🐼'],
  'peaceful': ['😌', '🧘', '🧘‍♀️', '🧘‍♂️', '🕉️', '☮️', '☯️', '🕊️', '🕊️', '🕊️', '🕊️', '🕊️', '🕊️', '🕊️', '🕊️', '🕊️', '🕊️', '🕊️', '🕊️', '🕊️'],
  'creative': ['🎨', '🎭', '🎪', '🎟️', '🎫', '🎬', '🎤', '🎧', '🎼', '🎹', '🎸', '🎻', '🎺', '🎷', '🥁', '🎮', '🎲', '🧩', '🎯', '🎪'],
  
  // Negative emotions
  'sad': ['😔', '😢', '😭', '😞', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '😤', '😠', '😡', '🤬', '🤯', '😳', '😱', '😨'],
  'angry': ['😠', '😡', '🤬', '🤯', '😤', '😾', '💢', '💥', '💣', '💨', '🔥', '⚡', '💀', '👹', '👺', '👻', '👽', '🤖', '💩', '👾'],
  'anxious': ['😰', '😨', '😱', '😳', '😵', '😵‍💫', '😶', '😶‍🌫️', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '😇', '🥴', '🥵', '🥶', '😈', '👿'],
  'tired': ['😴', '😪', '😵', '😵‍💫', '🥱', '😮‍💨', '😮', '😯', '😲', '😳', '😱', '😨', '😰', '😥', '😓', '😔', '😞', '😟', '😕', '🙁'],
  'lonely': ['😔', '😢', '😭', '😞', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '😤', '😠', '😡', '🤬', '🤯', '😳', '😱', '😨'],
  
  // Neutral/Complex emotions
  'contemplative': ['🤔', '🧐', '🤓', '😏', '😶', '😐', '😑', '😯', '😮', '😲', '😳', '😱', '😨', '😰', '😥', '😓', '😔', '😞', '😟', '😕'],
  'uncertain': ['🤷', '🤷‍♀️', '🤷‍♂️', '🤔', '🧐', '🤓', '😏', '😶', '😐', '😑', '😯', '😮', '😲', '😳', '😱', '😨', '😰', '😥', '😓', '😔'],
  'neutral': ['😐', '😑', '😶', '😯', '😮', '😲', '😳', '😱', '😨', '😰', '😥', '😓', '😔', '😞', '😟', '😕', '🙁', '☹️', '😣', '😖']
};

// Analyze sentiment from conversation text
export function analyzeConversationSentiment(conversationHistory, currentMessage = '') {
  if (!conversationHistory || conversationHistory.length === 0) {
    return { emotion: 'neutral', emoji: '😐', confidence: 0.5 };
  }
  
  // Combine all conversation text for analysis
  const allText = conversationHistory
    .map(msg => msg.text || '')
    .join(' ')
    .toLowerCase();
  
  const currentText = (currentMessage || '').toLowerCase();
  const fullText = allText + ' ' + currentText;
  
  // Calculate emotion scores with enhanced weighting
  const emotionScores = {};
  
  // Analyze positive emotions with recent message emphasis
  Object.keys(emotionKeywords.positive).forEach(emotion => {
    const keywords = emotionKeywords.positive[emotion];
    let score = 0;
    
    // Base score from all conversation
    score += keywords.reduce((total, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (allText.match(regex) || []).length;
      return total + matches;
    }, 0);
    
    // Bonus score for current message (more recent = more important)
    if (currentText) {
      score += keywords.reduce((total, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = (currentText.match(regex) || []).length;
        return total + (matches * 2); // Double weight for current message
      }, 0);
    }
    
    emotionScores[emotion] = score;
  });
  
  // Analyze negative emotions with recent message emphasis
  Object.keys(emotionKeywords.negative).forEach(emotion => {
    const keywords = emotionKeywords.negative[emotion];
    let score = 0;
    
    // Base score from all conversation
    score += keywords.reduce((total, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (allText.match(regex) || []).length;
      return total + matches;
    }, 0);
    
    // Bonus score for current message (more recent = more important)
    if (currentText) {
      score += keywords.reduce((total, keyword) => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = (currentText.match(regex) || []).length;
        return total + (matches * 2); // Double weight for current message
      }, 0);
    }
    
    emotionScores[emotion] = score;
  });
  
  // Analyze neutral emotions
  Object.keys(emotionKeywords.neutral).forEach(emotion => {
    const keywords = emotionKeywords.neutral[emotion];
    const score = keywords.reduce((total, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = (fullText.match(regex) || []).length;
      return total + matches;
    }, 0);
    emotionScores[emotion] = score;
  });
  
  // Analyze context patterns
  const contextScores = {};
  Object.keys(contextPatterns).forEach(context => {
    const patterns = contextPatterns[context];
    const score = patterns.reduce((total, pattern) => {
      const regex = new RegExp(`\\b${pattern}\\b`, 'gi');
      const matches = (fullText.match(regex) || []).length;
      return total + matches;
    }, 0);
    contextScores[context] = score;
  });
  
  // Determine dominant emotion
  let dominantEmotion = 'neutral';
  let highestScore = 0;
  
  Object.keys(emotionScores).forEach(emotion => {
    if (emotionScores[emotion] > highestScore) {
      highestScore = emotionScores[emotion];
      dominantEmotion = emotion;
    }
  });
  
  // Apply context modifiers
  if (contextScores.connection > 0) {
    if (dominantEmotion === 'neutral') dominantEmotion = 'peaceful';
    if (dominantEmotion === 'sad') dominantEmotion = 'contemplative';
  }
  
  if (contextScores.isolation > 0) {
    if (dominantEmotion === 'neutral') dominantEmotion = 'lonely';
    if (dominantEmotion === 'happy') dominantEmotion = 'contemplative';
  }
  
  if (contextScores.achievement > 0) {
    if (dominantEmotion === 'neutral') dominantEmotion = 'confident';
    if (dominantEmotion === 'sad') dominantEmotion = 'contemplative';
  }
  
  if (contextScores.failure > 0) {
    if (dominantEmotion === 'neutral') dominantEmotion = 'sad';
    if (dominantEmotion === 'happy') dominantEmotion = 'contemplative';
  }
  
  // Get random emoji for the emotion
  const emojis = emotionEmojis[dominantEmotion] || emotionEmojis.neutral;
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  
  // Calculate confidence based on score strength
  const confidence = Math.min(highestScore / 3, 1.0);
  
  return {
    emotion: dominantEmotion,
    emoji: randomEmoji,
    confidence: confidence,
    scores: emotionScores,
    context: contextScores
  };
}

// Get emoji for specific emotion
export function getEmojiForEmotion(emotion) {
  const emojis = emotionEmojis[emotion] || emotionEmojis.neutral;
  return emojis[Math.floor(Math.random() * emojis.length)];
}

// Get all available emotions
export function getAvailableEmotions() {
  return Object.keys(emotionEmojis);
}

// Get emoji variety for an emotion
export function getEmojiVariety(emotion, count = 5) {
  const emojis = emotionEmojis[emotion] || emotionEmojis.neutral;
  const shuffled = [...emojis].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
} 