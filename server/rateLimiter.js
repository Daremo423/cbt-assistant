const rateLimit = require('express-rate-limit');

// General rate limiter: 100 requests per 15 minutes
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    message: "Too many requests from this IP, please try again after 15 minutes"
  }
});

// Stricter rate limiter for authentication routes: 10 requests per hour
// This helps prevent brute-force attacks and spamming of signup/login
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 requests per `window` (here, per 1 hour)
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: "Too many login/signup attempts from this IP, please try again after an hour"
  }
});

module.exports = {
  limiter,
  authLimiter
};
