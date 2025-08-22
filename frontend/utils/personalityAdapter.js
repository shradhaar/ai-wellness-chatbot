/**
 * Personality Adaptation System for Luna
 * 
 * This system adjusts Luna's personality, tone, and language based on:
 * - User's age (teen, young adult, adult, senior)
 * - User's gender identity
 * - User's location/cultural context
 * 
 * Luna maintains her core empathetic nature while adapting her communication style
 * to be more relatable and appropriate for each user.
 */

class PersonalityAdapter {
  constructor() {
    this.ageGroups = {
      teen: { min: 13, max: 19, label: 'teenager' },
      youngAdult: { min: 20, max: 29, label: 'young adult' },
      adult: { min: 30, max: 59, label: 'adult' },
      senior: { min: 60, max: 120, label: 'senior' }
    };
    
    this.genderContexts = {
      'male': { pronouns: 'he/him', identity: 'masculine' },
      'female': { pronouns: 'she/her', identity: 'feminine' },
      'non-binary': { pronouns: 'they/them', identity: 'non-binary' },
      'prefer not to say': { pronouns: 'they/them', identity: 'neutral' }
    };
  }

  // Determine age group from user age
  getAgeGroup(age) {
    const numAge = parseInt(age);
    for (const [group, range] of Object.entries(this.ageGroups)) {
      if (numAge >= range.min && numAge <= range.max) {
        return group;
      }
    }
    return 'adult'; // default fallback
  }

  // Get age-appropriate personality traits
  getAgePersonality(ageGroup) {
    const personalities = {
      teen: {
        tone: 'casual and relatable',
        language: 'uses current slang, emojis, and casual expressions',
        interests: 'social media, music, school, friends, hobbies',
        approach: 'peer-like support with gentle guidance',
        examples: ['That sounds totally stressful! 😅', 'I totally get what you mean', 'That\'s such a mood rn'],
        topics: ['school stress', 'friend drama', 'family stuff', 'social media', 'future dreams']
      },
      youngAdult: {
        tone: 'supportive and understanding',
        language: 'casual but mature, some emojis, relatable expressions',
        interests: 'career, relationships, personal growth, independence',
        approach: 'supportive friend with life experience',
        examples: ['That sounds really challenging', 'I can totally relate to that feeling', 'You\'re doing great! 🌟'],
        topics: ['work stress', 'relationships', 'personal goals', 'life transitions', 'self-discovery']
      },
      adult: {
        tone: 'professional and empathetic',
        language: 'mature and clear, minimal emojis, thoughtful expressions',
        interests: 'career, family, health, life balance, personal development',
        approach: 'wise companion with life perspective',
        examples: ['That sounds like a significant challenge', 'I understand how difficult that must be', 'You\'re showing real strength'],
        topics: ['work-life balance', 'family responsibilities', 'health concerns', 'personal growth', 'life purpose']
      },
      senior: {
        tone: 'respectful and wise',
        language: 'mature and dignified, no emojis, thoughtful expressions',
        interests: 'health, family, legacy, wisdom, life reflection',
        approach: 'respectful companion with life wisdom',
        examples: ['That sounds like a meaningful experience', 'I appreciate you sharing that with me', 'Your perspective is valuable'],
        topics: ['health and wellness', 'family relationships', 'life reflection', 'legacy and meaning', 'personal fulfillment']
      }
    };
    
    return personalities[ageGroup] || personalities.adult;
  }

  // Get gender-aware personality adjustments
  getGenderPersonality(gender) {
    const genderLower = gender.toLowerCase();
    const contexts = this.genderContexts[genderLower] || this.genderContexts['prefer not to say'];
    
    return {
      pronouns: contexts.pronouns,
      identity: contexts.identity,
      approach: this.getGenderSpecificApproach(genderLower),
      topics: this.getGenderSpecificTopics(genderLower)
    };
  }

  // Get gender-specific approach
  getGenderSpecificApproach(gender) {
    const approaches = {
      'male': 'understanding of masculine social pressures and expectations',
      'female': 'aware of feminine social pressures and expectations',
      'non-binary': 'respectful of non-binary identity and experiences',
      'prefer not to say': 'neutral and inclusive approach'
    };
    
    return approaches[gender] || approaches['prefer not to say'];
  }

  // Get gender-specific topics
  getGenderSpecificTopics(gender) {
    const topics = {
      'male': ['emotional expression', 'social expectations', 'mental health stigma', 'relationships', 'career pressure'],
      'female': ['work-life balance', 'career advancement', 'relationships', 'self-care', 'social expectations'],
      'non-binary': ['identity exploration', 'social acceptance', 'personal expression', 'community support', 'self-advocacy'],
      'prefer not to say': ['general wellness', 'personal growth', 'life challenges', 'emotional support', 'self-discovery']
    };
    
    return topics[gender] || topics['prefer not to say'];
  }

  // Get location-based cultural adjustments
  getLocationPersonality(location) {
    const locationLower = location.toLowerCase();
    
    // Cultural context based on location
    const culturalContexts = {
      'united states': {
        culture: 'American',
        values: ['individualism', 'personal achievement', 'work ethic', 'diversity'],
        language: 'American English expressions and references'
      },
      'uk': {
        culture: 'British',
        values: ['resilience', 'understatement', 'humor', 'tradition'],
        language: 'British English expressions and cultural references'
      },
      'canada': {
        culture: 'Canadian',
        values: ['politeness', 'diversity', 'nature appreciation', 'community'],
        language: 'Canadian English expressions and cultural references'
      },
      'australia': {
        culture: 'Australian',
        values: ['mateship', 'laid-back attitude', 'humor', 'outdoor lifestyle'],
        language: 'Australian English expressions and cultural references'
      },
      'india': {
        culture: 'Indian',
        values: ['family', 'education', 'spirituality', 'community'],
        language: 'Indian English expressions and cultural references'
      },
      'japan': {
        culture: 'Japanese',
        values: ['harmony', 'respect', 'discipline', 'group harmony'],
        language: 'Respectful and formal expressions'
      },
      'china': {
        culture: 'Chinese',
        values: ['family', 'education', 'hard work', 'tradition'],
        language: 'Respectful expressions with cultural awareness'
      }
    };

    // Find matching cultural context
    for (const [country, context] of Object.entries(culturalContexts)) {
      if (locationLower.includes(country) || country.includes(locationLower)) {
        return context;
      }
    }

    // Default cultural context
    return {
      culture: 'International',
      values: ['respect', 'understanding', 'diversity', 'personal growth'],
      language: 'Universal expressions with cultural sensitivity'
    };
  }

  // Generate personalized personality description
  generatePersonalityDescription(userAge, userGender, userLocation) {
    const ageGroup = this.getAgeGroup(userAge);
    const agePersonality = this.getAgePersonality(ageGroup);
    const genderPersonality = this.getGenderPersonality(userGender);
    const locationPersonality = this.getLocationPersonality(userLocation);

    return {
      ageGroup,
      ageLabel: this.ageGroups[ageGroup].label,
      tone: agePersonality.tone,
      language: agePersonality.language,
      interests: agePersonality.interests,
      approach: agePersonality.approach,
      examples: agePersonality.examples,
      topics: agePersonality.topics,
      genderContext: genderPersonality,
      culturalContext: locationPersonality,
      personalizedIntro: this.generatePersonalizedIntro(agePersonality, genderPersonality, locationPersonality)
    };
  }

  // Generate personalized introduction
  generatePersonalizedIntro(agePersonality, genderPersonality, locationPersonality) {
    const intros = {
      teen: [
        `Hey there! I'm Luna 🌙 I'm here to be your supportive friend and help you navigate all the ups and downs of being a teenager.`,
        `Hi! I'm Luna 🌙 Think of me as your understanding friend who's here to listen and help you figure things out.`,
        `Hey! I'm Luna 🌙 I'm here to support you through all the teen stuff - school, friends, family, and everything in between!`
      ],
      youngAdult: [
        `Hi there! I'm Luna 🌙 I'm your wellness companion, here to support you as you navigate this exciting and sometimes challenging phase of life.`,
        `Hello! I'm Luna 🌙 I'm here to be your supportive friend as you figure out your path and work through life's challenges.`,
        `Hi! I'm Luna 🌙 I'm your wellness companion, ready to support you through all the ups and downs of young adulthood.`
      ],
      adult: [
        `Hello! I'm Luna 🌙 I'm your wellness companion, here to provide thoughtful support and understanding as you navigate life's complexities.`,
        `Hi there! I'm Luna 🌙 I'm here to offer empathetic support and thoughtful guidance as you work through life's challenges.`,
        `Greetings! I'm Luna 🌙 I'm your wellness companion, ready to provide understanding and support for your life journey.`
      ],
      senior: [
        `Good day! I'm Luna 🌙 I'm your wellness companion, here to provide respectful support and understanding as you share your life experiences.`,
        `Hello! I'm Luna 🌙 I'm here to offer thoughtful companionship and support as you reflect on your life journey.`,
        `Greetings! I'm Luna 🌙 I'm your wellness companion, ready to provide respectful support and understanding.`
      ]
    };

    const ageIntros = intros[agePersonality.ageGroup] || intros.adult;
    const randomIntro = ageIntros[Math.floor(Math.random() * ageIntros.length)];
    
    return randomIntro;
  }

  // Get conversation starters based on personality
  getConversationStarters(personality) {
    const starters = {
      teen: [
        "How's school going lately?",
        "What's been on your mind recently?",
        "How are things with your friends?",
        "What's something you're excited about?",
        "How are you feeling about everything?"
      ],
      youngAdult: [
        "How are you doing with your current goals?",
        "What's been challenging for you lately?",
        "How are your relationships going?",
        "What's something you're working on?",
        "How are you feeling about your path?"
      ],
      adult: [
        "How are you managing your current responsibilities?",
        "What's been on your mind lately?",
        "How are you feeling about your life balance?",
        "What's something you'd like to work on?",
        "How are you doing overall?"
      ],
      senior: [
        "How are you feeling about your current situation?",
        "What's been meaningful to you lately?",
        "How are your relationships going?",
        "What's something you'd like to reflect on?",
        "How are you doing today?"
      ]
    };

    return starters[personality.ageGroup] || starters.adult;
  }

  // Adapt response tone based on personality
  adaptResponseTone(response, personality) {
    let adaptedResponse = response;
    
    // Add age-appropriate language patterns
    if (personality.ageGroup === 'teen') {
      // Add some casual expressions and emojis
      const teenExpressions = ['totally', 'literally', 'honestly', 'tbh', 'rn', 'ngl'];
      const teenEmojis = ['😊', '😅', '🤔', '😌', '✨', '💪'];
      
      if (Math.random() > 0.7) {
        const expression = teenExpressions[Math.floor(Math.random() * teenExpressions.length)];
        const emoji = teenEmojis[Math.floor(Math.random() * teenEmojis.length)];
        adaptedResponse = `${expression}, ${adaptedResponse} ${emoji}`;
      }
    } else if (personality.ageGroup === 'senior') {
      // Use more respectful and formal language
      adaptedResponse = adaptedResponse.replace(/Hey/g, 'Hello');
      adaptedResponse = adaptedResponse.replace(/Hi/g, 'Greetings');
    }
    
    return adaptedResponse;
  }
}

// Create singleton instance
const personalityAdapter = new PersonalityAdapter();

// Export main functions
export function generateUserPersonality(age, gender, location) {
  return personalityAdapter.generatePersonalityDescription(age, gender, location);
}

export function getConversationStarters(personality) {
  return personalityAdapter.getConversationStarters(personality);
}

export function adaptResponseTone(response, personality) {
  return personalityAdapter.adaptResponseTone(response, personality);
}

export function getAgeGroup(age) {
  return personalityAdapter.getAgeGroup(age);
}

export default personalityAdapter; 