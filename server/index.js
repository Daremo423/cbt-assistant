require('dotenv').config(); // Load environment variables
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path');
const rateLimit = require('express-rate-limit');
const { authController, verifyToken, isAdmin } = require("./auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

// Initialize Gemini API
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let genAIModel = null;

if (GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  genAIModel = genAI.getGenerativeModel({ model: "gemini-pro" });
} else {
  console.warn("GEMINI_API_KEY not found in environment variables. Reframing features will be disabled.");
}

// Rate Limiter configuration
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `windowMs`
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many requests from this IP, please try again later." }
});

// CORS and Body Parsing
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Apply Rate Limiter to all API routes
app.use("/api", apiLimiter);

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'build')));
}

// Public Routes
app.get("/", (req, res) => {
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

// Reframing Endpoint
// Apply rate limiter here to prevent abuse of the AI API
app.post("/api/reframe", [verifyToken], async (req, res) => {
  if (!genAIModel) {
    return res.status(503).send({ message: "Reframing service unavailable (API Key missing)." });
  }

  try {
    const { distortionType, originalText } = req.body;

    if (!distortionType || !originalText) {
      return res.status(400).send({ message: "Missing distortionType or originalText." });
    }

    const prompt = `The user expressed: "${originalText}"
They are exhibiting a "${distortionType}" cognitive distortion.
Please provide a concise and helpful reframing suggestion for this thought.`;

    const result = await genAIModel.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).send({ suggestion: text.trim() });
  } catch (error) {
    console.error("Error generating reframing suggestion:", error);
    res.status(500).send({ message: "Error processing request." });
  }
});

// Set port, listen for requests
const PORT = process.env.PORT || 8080;
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

module.exports = app;
