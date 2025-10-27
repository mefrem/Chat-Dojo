const REFLECTION_PROMPTS = [
  "What did you learn about yourself?",
  "What truth wants to be acted on?",
  "How does your body feel now?",
  "What wants to be said next time?",
  "What fear surfaced in this talk?",
  "What opened up in you?",
  "What are you avoiding saying?",
  "What became clearer to you?",
  "What needs your attention now?",
];

export function getRandomReflectionPrompt(): string {
  const randomIndex = Math.floor(Math.random() * REFLECTION_PROMPTS.length);
  return REFLECTION_PROMPTS[randomIndex];
}
