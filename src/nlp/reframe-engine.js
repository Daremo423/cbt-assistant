// src/nlp/reframe-engine.js
// Naive templated reframing for MVP phase

const reframeTemplates = {
  'All-or-Nothing': 'Try to find the gray area. Life is rarely all one way or another.',
  'Should Statements': 'Consider what you want or prefer, not just what you "should" do.',
  'Labeling': 'Describe the behavior, not your whole self.',
  'Catastrophizing': 'Focus on most likely outcomes, not just the worst-case.',
};

function getReframe(distortionType) {
  return reframeTemplates[distortionType] || 'Try to identify and rephrase unhelpful thinking.';
}

export { getReframe };