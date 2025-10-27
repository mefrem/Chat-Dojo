// Truth prompts for Talk Dojo
// These prompts help users connect with what's real and unsaid

export const truthPrompts = [
  "What truth are you avoiding?",
  "What feels unsaid right now?",
  "If you weren't afraid of losing approval, what would you say?",
  "What does your body want to express?",
  "What's the fear beneath your words?",
  "What would you say if no one could judge you?",
  "What's alive in you that hasn't been spoken?",
  "What are you holding back out of politeness?",
  "If this were your last conversation, what would you say?",
  "What does your heart know that your mind refuses?",
];

export const getRandomTruthPrompt = (): string => {
  return truthPrompts[Math.floor(Math.random() * truthPrompts.length)];
};
