const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path'); // Import the path module
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const { authController, verifyToken, isAdmin } = require("./auth");

const app = express();

// CORS and Body Parsing
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'build')));
}

// Public Routes
app.get("/", (req, res) => {
  // If serving static files from React build, this root route might not be needed or should be handled by the static serving middleware
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
  } else {
    res.json({ message: "Welcome to CBT Assistant API." });
  }
});

app.post("/api/auth/signup", authController.signup);
app.post("/api/auth/signin", authController.signin);

// Protected Routes
app.get("/api/test/user", [verifyToken], (req, res) => {
  res.status(200).send("User Content.");
});

app.get("/api/test/admin", [verifyToken, isAdmin], (req, res) => {
  res.status(200).send("Admin Content.");
});

// Gemini Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

app.post("/api/reframe", [verifyToken], async (req, res) => {
  if (!genAI) {
    return res.status(500).send({ message: "Gemini API key not configured on server." });
  }

  const { distortionType, originalText } = req.body;

  if (!distortionType || !originalText) {
    return res.status(400).send({ message: "Missing distortionType or originalText." });
  }

  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
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
});

// Set port, listen for requests
const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

module.exports = app; // Export for testing
