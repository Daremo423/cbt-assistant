const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require('path'); // Import the path module
const rateLimit = require("express-rate-limit");
const { authController, verifyToken, isAdmin } = require("./auth");
const { getReframeSuggestion } = require("./reframe");

const app = express();

const reframeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later."
});

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

app.post("/api/reframe", [verifyToken, reframeLimiter], async (req, res) => {
  const { distortion, text } = req.body;
  if (!distortion || !text) {
    return res.status(400).send({ message: "Distortion and text are required." });
  }
  try {
    const suggestion = await getReframeSuggestion(distortion, text);
    res.json({ suggestion });
  } catch (error) {
    res.status(500).send({ message: error.message });
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
