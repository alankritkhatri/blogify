const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name, username } = req.body;

    if (!email || !password || !name || !username) {
      return res.status(400).json({
        message: "Registration failed",
        error: "All fields (email, password, name, username) are required",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Registration failed",
        error: "Invalid email format",
      });
    }

    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({
        message: "Registration failed",
        error:
          "Username can only contain letters, numbers, underscores and hyphens",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Registration failed",
        error: "Password must be at least 6 characters long",
      });
    }

    const existingUserEmail = await User.findOne({ email });
    if (existingUserEmail) {
      console.log(`Registration failed: Email ${email} already exists`);
      return res.status(400).json({
        message: "Registration failed",
        error: "User with this email already exists",
      });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      console.log(`Registration failed: Username ${username} already exists`);
      return res.status(400).json({
        message: "Registration failed",
        error: "Username is already taken",
      });
    }

    const user = new User({ email, password, name, username });

    try {
      await user.save();
      console.log(`User registered successfully: ${email} (${username})`);

      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          username: user.username,
        },
      });
    } catch (saveError) {
      if (saveError.code === 11000) {
        return res.status(400).json({
          message: "Registration failed",
          error: "User with this email or username already exists",
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error("Error in user registration:", error);
    res.status(500).json({
      message: "Error creating user",
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Login failed",
        error: "Email and password are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`Login failed: No user found with email ${email}`);
      return res.status(401).json({
        message: "Login failed",
        error: "Invalid email or password",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Incorrect password for ${email}`);
      return res.status(401).json({
        message: "Login failed",
        error: "Invalid email or password",
      });
    }

    console.log(`User logged in successfully: ${email}`);

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Error in user login:", error);
    res.status(500).json({
      message: "Error logging in",
      error: error.message,
    });
  }
});

router.get("/me", async (req, res) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication failed",
        error: "Invalid or missing token",
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
        error: "User associated with this token no longer exists",
      });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        username: user.username,
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message: "Authentication failed",
        error: error.message,
      });
    }
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

module.exports = router; 