const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Please authenticate",
        error: "Invalid Authorization header",
      });
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({
        message: "Please authenticate",
        error: "Empty token provided",
      });
    }

    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    const user = await User.findOne(
      { _id: decoded.userId },
      { _id: 1, email: 1, name: 1, username: 1 }
    );

    if (!user || !user.username) {
      return res.status(401).json({
        message: "Authentication error",
        error: "User account is incomplete (missing username)",
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res
      .status(500)
      .json({ message: "Authentication error", error: error.message });
  }
};

module.exports = auth; 