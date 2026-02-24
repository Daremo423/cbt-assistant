const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const config = require("./config");

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
