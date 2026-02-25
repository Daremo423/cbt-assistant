const { GoogleGenerativeAI } = require('@google/generative-ai');

// Access API key from environment variables
const API_KEY = process.env.GEMINI_API_KEY;

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;
const model = genAI ? genAI.getGenerativeModel({ model: "gemini-pro" }) : null;

const getReframe = async (req, res) => {
  const { distortionType, originalText } = req.body;

  if (!distortionType || !originalText) {
    return res.status(400).send({ message: "Missing distortionType or originalText." });
  }

  if (!model) {
    return res.status(503).send({ message: "AI model not configured (GEMINI_API_KEY missing)." });
  }

  const prompt = `The user expressed: "${originalText}"
They are exhibiting a "${distortionType}" cognitive distortion.
Please provide a concise and helpful reframing suggestion for this thought.`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.send({ suggestion: text.trim() });
  } catch (error) {
    console.error("Error generating reframing suggestion with Gemini API:", error);
    res.status(500).send({ message: "Error generating suggestion." });
  }
};

module.exports = { getReframe };
