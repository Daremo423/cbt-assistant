const { GoogleGenerativeAI } = require("@google/generative-ai");

const API_KEY = process.env.GEMINI_API_KEY;
let model = null;

if (API_KEY) {
  const genAI = new GoogleGenerativeAI(API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-pro" });
} else {
  console.warn("GEMINI_API_KEY environment variable not set. Reframing suggestions will not be generated.");
}

async function getReframeSuggestion(distortionType, originalText) {
  if (!model) {
    return 'Try to identify and rephrase unhelpful thinking. (AI model not loaded)';
  }

  const prompt = `The user expressed: "${originalText}"
They are exhibiting a "${distortionType}" cognitive distortion.
Please provide a concise and helpful reframing suggestion for this thought.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.trim();
  } catch (error) {
    console.error("Error generating reframing suggestion with Gemini API:", error);
    throw new Error('Could not generate reframing suggestion.');
  }
}

module.exports = {
  getReframeSuggestion
};
