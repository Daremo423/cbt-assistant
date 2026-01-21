const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { OAuth2Client } = require('google-auth-library');
const config = require("./config");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Simple in-memory user store
const users = [];

const authController = {
  signup: (req, res) => {
    const user = {
      id: users.length + 1,
      username: req.body.username,
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 8),
      roles: req.body.roles || ['user']
    };

    const existingUser = users.find(u => u.username === user.username || u.email === user.email);
    if (existingUser) {
      return res.status(400).send({ message: "Failed! Username or Email is already in use!" });
    }

    users.push(user);
    res.send({ message: "User registered successfully!" });
  },

  signin: (req, res) => {
    const user = users.find(u => u.username === req.body.username);

    if (!user) {
      return res.status(404).send({ message: "User Not found." });
    }

    // Check if user has a password (might be a Google-only user)
    if (!user.password) {
      return res.status(401).send({
        accessToken: null,
        message: "Please login with Google."
      });
    }

    const passwordIsValid = bcrypt.compareSync(
      req.body.password,
      user.password
    );

    if (!passwordIsValid) {
      return res.status(401).send({
        accessToken: null,
        message: "Invalid Password!"
      });
    }

    const token = jwt.sign({ id: user.id, roles: user.roles }, config.secret, {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).send({
      id: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles,
      accessToken: token
    });
  },

  googleSignin: async (req, res) => {
    const { token } = req.body;
    try {
      const ticket = await client.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      const { email, name } = payload;

      let user = users.find(u => u.email === email);
      if (!user) {
        user = {
          id: users.length + 1,
          username: name || email,
          email: email,
          password: null, // Google users don't have a password
          roles: ['user']
        };
        users.push(user);
      }

      const accessToken = jwt.sign({ id: user.id, roles: user.roles }, config.secret, {
        expiresIn: 86400 // 24 hours
      });

      res.status(200).send({
        id: user.id,
        username: user.username,
        email: user.email,
        roles: user.roles,
        accessToken: accessToken
      });
    } catch (error) {
      console.error("Google Auth Error:", error);
      res.status(401).send({ message: "Google Authentication Failed" });
    }
  }
};

const verifyToken = (req, res, next) => {
  let token = req.headers["x-access-token"];

  if (!token) {
    return res.status(403).send({ message: "No token provided!" });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: "Unauthorized!" });
    }
    req.userId = decoded.id;
    req.userRoles = decoded.roles;
    next();
  });
};

const isAdmin = (req, res, next) => {
  if (req.userRoles && req.userRoles.includes("admin")) {
    next();
    return;
  }
  res.status(403).send({ message: "Require Admin Role!" });
};

module.exports = {
  authController,
  verifyToken,
  isAdmin,
  users // Exported for testing
};
