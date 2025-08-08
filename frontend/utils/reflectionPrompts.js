
export function getBotReply(message) {
  const lower = message.toLowerCase();
  if (lower.includes('sad')) return 'That sounds tough. Want to journal or breathe together?';
  if (lower.includes('happy')) return 'That’s wonderful! Want a gratitude prompt?';
  return 'Thanks for sharing. Would you like to reflect more or take a breath?';
}

export function getReflectionPrompt() {
  const prompts = [
    "Take a moment to reflect: What's one thing you're grateful for today?",
    "How are you really feeling right now? Be honest with yourself.",
    "What's something that made you smile today, no matter how small?",
    "Is there something on your mind that you'd like to talk about?",
    "What would help you feel better in this moment?",
    "Remember: it's okay to not be okay. What do you need right now?",
    "Let's take a deep breath together. How does that feel?",
    "What's one small step you can take to care for yourself today?"
  ];
  return prompts[Math.floor(Math.random() * prompts.length)];
}
