
export function getBotReply(message) {
  const lower = message.toLowerCase();
  if (lower.includes('sad')) return 'That sounds tough. Want to journal or breathe together?';
  if (lower.includes('happy')) return 'That’s wonderful! Want a gratitude prompt?';
  return 'Thanks for sharing. Would you like to reflect more or take a breath?';
}
