const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path'); // Import the path module
const { authController, verifyToken, isAdmin } = require("./auth");
const { GoogleGenerativeAI } = require('@google/generative-ai');

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
app.post("/api/auth/signup", authController.signup);
app.post("/api/auth/signin", authController.signin);

// Protected Routes
app.get("/api/test/user", [verifyToken], (req, res) => {
  res.status(200).send("User Content.");
});

app.get("/api/test/admin", [verifyToken, isAdmin], (req, res) => {
  res.status(200).send("Admin Content.");
});

// Reframing Endpoint (Protected)
app.post("/api/reframe", [verifyToken], async (req, res) => {
  const { distortionType, originalText } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `The user expressed: "${originalText}"
They are exhibiting a "${distortionType}" cognitive distortion.
Please provide a concise and helpful reframing suggestion for this thought.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    res.json({ suggestion: text.trim() });
  } catch (error) {
    console.error("Gemini Error:", error);
    res.status(500).json({ error: 'Failed to generate reframe' });
  }
});

// Serve React App for any other route in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ message: "Welcome to CBT Assistant API." });
  });
}

// Set port, listen for requests
const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

module.exports = app; // Export for testing
