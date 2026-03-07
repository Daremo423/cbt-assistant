const { GoogleGenerativeAI } = require('@google/generative-ai');

// Access your API key as an environment variable (preferable for security).
// Make sure to set GEMINI_API_KEY in your environment variables.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY environment variable not set. Reframing suggestions will not be generated.");
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

async function getReframe(req, res) {
  const { distortionType, originalText } = req.body;

  if (!distortionType || !originalText) {
    return res.status(400).json({ message: "Missing distortionType or originalText in request body" });
  }

  if (!model) {
    return res.status(503).json({ suggestion: 'Try to identify and rephrase unhelpful thinking. (AI model not loaded)' });
  }

  const prompt = `The user expressed: "${originalText}"
They are exhibiting a "${distortionType}" cognitive distortion.
Please provide a concise and helpful reframing suggestion for this thought.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return res.status(200).json({ suggestion: text.trim() });
  } catch (error) {
    console.error("Error generating reframing suggestion with Gemini API:", error);
    return res.status(500).json({ suggestion: 'Could not generate reframing suggestion at this time. Please try again later.' });
  }
}

module.exports = {
  getReframe
};