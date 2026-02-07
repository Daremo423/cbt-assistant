// src/nlp/reframe-engine.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// Access your API key as an environment variable (preferable for security).
// Make sure to set GEMINI_API_KEY in your environment variables.
const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

if (!API_KEY) {
  console.error("REACT_APP_GEMINI_API_KEY environment variable not set. Reframing suggestions will not be generated.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

async function getReframe(distortionType, originalText) {
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
    return 'Could not generate reframing suggestion at this time. Please try again later.';
  }
}

export { getReframe };