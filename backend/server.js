const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8085;

// Middleware
app.use(cors());
app.use(express.json());

// Simple, working chat endpoint
app.post('/chat', async (req, res) => {
  const { message, userName, userAge, userGender, userLocation, userId = 'default', mode = 'buddy' } = req.body;
  
  try {
    console.log('Chat Request - Message:', message);
    console.log('User Name:', userName);
    
    // Simple response logic that actually works
    const lowerMessage = message.toLowerCase();
    const nameCall = userName ? `, ${userName}` : '';
    
    let reply;
  let mood = 'neutral';
  
    // Check for specific topics and emotions with more comprehensive patterns
    if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
      reply = `I can see you're feeling sad${nameCall}. I'm here for you. What's making you feel this way?`;
    mood = 'sad';
    } else if (lowerMessage.includes('nothing good') || lowerMessage.includes('terrible') || lowerMessage.includes('horrible')) {
      reply = `I hear that things feel really difficult right now${nameCall}. I'm sorry you're going through this. What's been the hardest part?`;
    mood = 'sad';
    } else if (lowerMessage.includes('bad') || lowerMessage.includes('not okay') || lowerMessage.includes('struggling')) {
      reply = `I can tell you're having a tough time${nameCall}. You don't have to go through this alone. What's weighing on you?`;
    mood = 'sad';
    } else if (lowerMessage.includes('stressed') || lowerMessage.includes('overwhelmed')) {
      reply = `I hear you're feeling stressed${nameCall}. That can be really overwhelming. What's causing you the most stress?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('deadlines') || lowerMessage.includes('deadline') || lowerMessage.includes('due date') || lowerMessage.includes('due dates')) {
      reply = `Deadlines can be so stressful${nameCall}. Are you feeling overwhelmed by how much you need to get done?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('pressure') || lowerMessage.includes('pressured')) {
      reply = `I can feel how much pressure you're under${nameCall}. What's putting the most pressure on you right now?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('exams') || lowerMessage.includes('exam') || lowerMessage.includes('test') || lowerMessage.includes('tests')) {
      reply = `Exams and tests can be really anxiety-provoking${nameCall}. How are you feeling about your upcoming exams?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('boss') || lowerMessage.includes('manager') || lowerMessage.includes('supervisor')) {
      reply = `Dealing with your boss can be challenging${nameCall}. What's happening with your manager?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('colleague') || lowerMessage.includes('coworker') || lowerMessage.includes('team')) {
      reply = `Work relationships can be complicated${nameCall}. What's going on with your colleagues?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('meeting') || lowerMessage.includes('meetings')) {
      reply = `Meetings can be draining${nameCall}. Are you feeling overwhelmed by all the meetings you have to attend?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('work') || lowerMessage.includes('job') || lowerMessage.includes('office')) {
      reply = `Work can be really challenging${nameCall}. What's happening at work that's bothering you?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('homework') || lowerMessage.includes('assignment') || lowerMessage.includes('project')) {
      reply = `Homework and assignments can pile up quickly${nameCall}. What's making your schoolwork difficult?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('school') || lowerMessage.includes('university') || lowerMessage.includes('college') || lowerMessage.includes('study')) {
      reply = `School can be tough${nameCall}. What's making it difficult for you?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('family') || lowerMessage.includes('mom') || lowerMessage.includes('dad') || lowerMessage.includes('parent')) {
      reply = `Family situations can be complicated${nameCall}. What's happening with your family?`;
      mood = 'sad';
    } else if (lowerMessage.includes('friend') || lowerMessage.includes('friends') || lowerMessage.includes('social')) {
      reply = `Friendships can be tricky${nameCall}. What's going on with your friends?`;
      mood = 'sad';
    } else if (lowerMessage.includes('relationship') || lowerMessage.includes('boyfriend') || lowerMessage.includes('girlfriend') || lowerMessage.includes('partner')) {
      reply = `Relationships can be challenging${nameCall}. What's happening in your relationship?`;
      mood = 'sad';
    } else if (lowerMessage.includes('money') || lowerMessage.includes('financial') || lowerMessage.includes('bills') || lowerMessage.includes('expensive')) {
      reply = `Money stress can be really overwhelming${nameCall}. What's causing you financial worry?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('health') || lowerMessage.includes('sick') || lowerMessage.includes('ill') || lowerMessage.includes('pain')) {
      reply = `Health concerns can be really worrying${nameCall}. What's going on with your health?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('sleep') || lowerMessage.includes('tired') || lowerMessage.includes('exhausted') || lowerMessage.includes('insomnia')) {
      reply = `Not getting enough sleep can make everything harder${nameCall}. What's affecting your sleep?`;
      mood = 'tired';
    } else if (lowerMessage.includes('anxiety') || lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('worry')) {
      reply = `Anxiety can be really overwhelming${nameCall}. What's making you feel anxious?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated')) {
      reply = `I hear that you're feeling lonely${nameCall}. That can be really hard. What's making you feel this way?`;
      mood = 'sad';
    } else if (lowerMessage.includes('angry') || lowerMessage.includes('mad') || lowerMessage.includes('frustrated') || lowerMessage.includes('frustration')) {
      reply = `I can see you're feeling angry${nameCall}. Those feelings are valid. What's making you feel this way?`;
      mood = 'angry';
    } else if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great') || lowerMessage.includes('awesome')) {
      reply = `I'm so glad you're feeling good${nameCall}! That's wonderful to hear. What's making you feel this way?`;
    mood = 'happy';
    } else if (lowerMessage.includes('excited') || lowerMessage.includes('thrilled') || lowerMessage.includes('pumped')) {
      reply = `You sound really excited${nameCall}! That's fantastic. What are you excited about?`;
    mood = 'happy';
    } else if (lowerMessage.includes('grateful') || lowerMessage.includes('thankful') || lowerMessage.includes('blessed')) {
      reply = `I love hearing that you're feeling grateful${nameCall}. That's such a beautiful feeling. What are you grateful for?`;
    mood = 'happy';
    } else if (lowerMessage.includes('yes') || lowerMessage.includes('yeah') || lowerMessage.includes('yep')) {
      reply = `I'm glad you're being honest with me${nameCall}. It takes courage to acknowledge how you're feeling. What would help you feel better right now?`;
      mood = 'neutral';
    } else if (lowerMessage.includes('no') || lowerMessage.includes('nope') || lowerMessage.includes('nah')) {
      reply = `That's okay${nameCall}. Sometimes it's hard to put feelings into words. I'm still here to listen whenever you're ready to share.`;
      mood = 'neutral';
    } else if (lowerMessage.includes('maybe') || lowerMessage.includes('perhaps') || lowerMessage.includes('possibly')) {
      reply = `It sounds like you're not quite sure${nameCall}. That's completely normal. What are you thinking about?`;
      mood = 'neutral';
    } else if (lowerMessage.includes('help') || lowerMessage.includes('support')) {
      reply = `I'm here to help you${nameCall}. What kind of support do you need right now?`;
      mood = 'neutral';
    } else if (lowerMessage.includes('advice') || lowerMessage.includes('suggest')) {
      reply = `I'd be happy to share some thoughts${nameCall}. What specific situation are you looking for advice about?`;
      mood = 'neutral';
    } else if (lowerMessage.includes('confused') || lowerMessage.includes('lost') || lowerMessage.includes('unsure')) {
      reply = `Feeling confused can be really frustrating${nameCall}. What's making you feel this way?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('scared') || lowerMessage.includes('afraid') || lowerMessage.includes('fear')) {
      reply = `Fear can be really overwhelming${nameCall}. What are you feeling scared about?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('nervous') || lowerMessage.includes('worried') || lowerMessage.includes('concerned')) {
      reply = `It's natural to feel nervous${nameCall}. What's making you feel this way?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('disappointed') || lowerMessage.includes('let down')) {
      reply = `Disappointment can be really hard to deal with${nameCall}. What happened that made you feel this way?`;
      mood = 'sad';
    } else if (lowerMessage.includes('embarrassed') || lowerMessage.includes('ashamed')) {
      reply = `I understand that feeling embarrassed can be really uncomfortable${nameCall}. What happened?`;
      mood = 'sad';
    } else if (lowerMessage.includes('proud') || lowerMessage.includes('accomplished') || lowerMessage.includes('achieved')) {
      reply = `That's wonderful that you're feeling proud${nameCall}! What did you accomplish?`;
      mood = 'happy';
    } else if (lowerMessage.includes('motivated') || lowerMessage.includes('inspired')) {
      reply = `It's great that you're feeling motivated${nameCall}! What's inspiring you right now?`;
      mood = 'happy';
    } else if (lowerMessage.includes('bored') || lowerMessage.includes('boring')) {
      reply = `Feeling bored can be frustrating${nameCall}. What would make your day more interesting?`;
      mood = 'neutral';
    } else if (lowerMessage.includes('excited') || lowerMessage.includes('thrilled') || lowerMessage.includes('pumped')) {
      reply = `You sound really excited${nameCall}! That's fantastic. What are you excited about?`;
      mood = 'happy';
    } else if (lowerMessage.includes('grateful') || lowerMessage.includes('thankful') || lowerMessage.includes('blessed')) {
      reply = `I love hearing that you're feeling grateful${nameCall}. That's such a beautiful feeling. What are you grateful for?`;
      mood = 'happy';
    } else if (lowerMessage.includes('hopeful') || lowerMessage.includes('optimistic')) {
      reply = `Having hope is so important${nameCall}. What are you feeling hopeful about?`;
      mood = 'happy';
    } else if (lowerMessage.includes('hopeless') || lowerMessage.includes('desperate')) {
      reply = `I can hear how much you're struggling${nameCall}. You're not alone in this. What's making you feel hopeless?`;
      mood = 'sad';
    } else if (lowerMessage.includes('overwhelmed') || lowerMessage.includes('swamped')) {
      reply = `Feeling overwhelmed can make everything seem impossible${nameCall}. What's weighing on you the most?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('relaxed') || lowerMessage.includes('calm') || lowerMessage.includes('peaceful')) {
      reply = `It's wonderful that you're feeling relaxed${nameCall}. What's helping you feel this way?`;
      mood = 'happy';
    } else if (lowerMessage.includes('focused') || lowerMessage.includes('concentrated')) {
      reply = `Being focused can feel really productive${nameCall}. What are you working on?`;
      mood = 'neutral';
    } else if (lowerMessage.includes('distracted') || lowerMessage.includes('unfocused')) {
      reply = `It can be hard to concentrate when you're feeling distracted${nameCall}. What's pulling your attention away?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('productive') || lowerMessage.includes('accomplished')) {
      reply = `That's great that you're feeling productive${nameCall}! What have you been working on?`;
      mood = 'happy';
    } else if (lowerMessage.includes('unproductive') || lowerMessage.includes('lazy')) {
      reply = `We all have days where it's hard to get things done${nameCall}. What's making you feel unproductive?`;
      mood = 'sad';
    } else if (lowerMessage.includes('creative') || lowerMessage.includes('inspired')) {
      reply = `Feeling creative can be so energizing${nameCall}! What's inspiring your creativity?`;
      mood = 'happy';
    } else if (lowerMessage.includes('stuck') || lowerMessage.includes('blocked')) {
      reply = `Feeling stuck can be really frustrating${nameCall}. What's blocking you right now?`;
      mood = 'stressed';
    } else if (lowerMessage.includes('confident') || lowerMessage.includes('sure')) {
      reply = `It's wonderful that you're feeling confident${nameCall}! What's giving you this confidence?`;
      mood = 'happy';
    } else if (lowerMessage.includes('insecure') || lowerMessage.includes('doubt')) {
      reply = `Feeling insecure can be really tough${nameCall}. What's making you doubt yourself?`;
      mood = 'sad';
    } else if (lowerMessage.includes('lonely') || lowerMessage.includes('alone') || lowerMessage.includes('isolated')) {
      reply = `I hear that you're feeling lonely${nameCall}. That can be really hard. What's making you feel this way?`;
      mood = 'sad';
    } else if (lowerMessage.includes('connected') || lowerMessage.includes('close')) {
      reply = `Feeling connected to others is so important${nameCall}. Who are you feeling close to?`;
      mood = 'happy';
    } else if (lowerMessage.includes('misunderstood') || lowerMessage.includes('misinterpreted')) {
      reply = `Being misunderstood can feel really isolating${nameCall}. What happened that made you feel this way?`;
      mood = 'sad';
    } else if (lowerMessage.includes('understood') || lowerMessage.includes('heard')) {
      reply = `It's wonderful when someone truly understands you${nameCall}. Who made you feel heard?`;
      mood = 'happy';
    } else if (lowerMessage.includes('judged') || lowerMessage.includes('criticized')) {
      reply = `Feeling judged can be really painful${nameCall}. What happened that made you feel this way?`;
      mood = 'sad';
    } else if (lowerMessage.includes('accepted') || lowerMessage.includes('welcomed')) {
      reply = `Feeling accepted is such a beautiful feeling${nameCall}. What made you feel this way?`;
      mood = 'happy';
    } else if (lowerMessage.includes('rejected') || lowerMessage.includes('excluded')) {
      reply = `Feeling rejected can be really hurtful${nameCall}. What happened?`;
      mood = 'sad';
    } else if (lowerMessage.includes('included') || lowerMessage.includes('part of')) {
      reply = `Being included can feel really good${nameCall}. What made you feel part of the group?`;
      mood = 'happy';
    } else if (lowerMessage.includes('ignored') || lowerMessage.includes('overlooked')) {
      reply = `Being ignored can feel really hurtful${nameCall}. What's happening that makes you feel overlooked?`;
      mood = 'sad';
    } else if (lowerMessage.includes('noticed') || lowerMessage.includes('seen')) {
      reply = `It feels good to be noticed and seen${nameCall}. What made you feel this way?`;
      mood = 'happy';
    } else if (lowerMessage.includes('appreciated') || lowerMessage.includes('valued')) {
      reply = `Feeling appreciated is so meaningful${nameCall}. What made you feel valued?`;
      mood = 'happy';
    } else if (lowerMessage.includes('unappreciated') || lowerMessage.includes('taken for granted')) {
      reply = `Feeling unappreciated can be really discouraging${nameCall}. What's making you feel this way?`;
      mood = 'sad';
    } else if (lowerMessage.includes('supported') || lowerMessage.includes('backed')) {
      reply = `Having support can make all the difference${nameCall}. Who's supporting you right now?`;
      mood = 'happy';
    } else if (lowerMessage.includes('unsupported') || lowerMessage.includes('abandoned')) {
      reply = `Feeling unsupported can be really isolating${nameCall}. What's making you feel this way?`;
      mood = 'sad';
    } else {
      reply = `I hear you${nameCall}. I'm here to listen. What's on your mind?`;
    }
    
    res.json({ 
      reply: reply, 
      mood: mood,
      conversationCount: 1,
      relationship: 'acquainted',
      mode: mode
    });
    
  } catch (error) {
    console.error('Chat Error:', error);
    
    // Simple error fallback
    const nameCall = userName ? `, ${userName}` : '';
    res.json({ 
      reply: `I'm here for you${nameCall}. What's going on?`, 
      mood: 'neutral',
      conversationCount: 1,
      relationship: 'new',
      mode: 'buddy'
    });
  }
});

// Simple welcome endpoint
app.get('/welcome', (req, res) => {
  res.json({
    botName: 'Luna',
    greeting: 'Hello! I\'m Luna, your wellness companion.',
    welcome: 'Welcome! I\'m here to listen and support you.',
    askName: 'What should I call you?',
    askExpectations: 'How can I help you today?',
    askHelp: 'I\'m here to listen and provide support.'
  });
});

// Simple root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Luna Wellness Chatbot API is running!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Luna Wellness Chatbot running on port ${PORT}`);
});
