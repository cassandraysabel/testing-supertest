const express = require("express");
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");

const router = express.Router();

router.post(
  "/signup",
  [
    body("username").notEmpty().withMessage("Username is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { username, email, password } = req.body;
      // Debugging Logs
      // Check if username is null or empty before proceeding
      if (!username)
        return res.status(400).json({ message: "Username is required" });

      let user = await User.findOne({ email });
      if (user) return res.json({ message: "User Already exist" });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      user = new User({
        username,
        email,
        password: hashedPassword,
      });
      await user.save();

      return res.status(201).json({ message: "User created successfully" });
    } catch (err) {
      console.error("Error:", err);
      res.status(500).json({ error: err.message });
    }
  }
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user)
        return res.status(400).json({ message: "Invalid Credentials" });

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Invalid credentials" });

      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        {
          expiresIn: "1m",
        }
      );
      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );
      // Store refresh token in an HttpOnly cookie
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true, // Prevents client-side JavaScript access
        secure: true, // Ensures cookies are sent over HTTPS
        sameSite: "Strict", // Prevents CSRF attacks
        maxAge: 7 * 24 * 60 * 60 * 1000, // Expires in 7 days
      });

      res.json({ accessToken, refreshToken });
    } catch (err) {
      res.json(500).json({ error: err.message });
    }
  }
);

router.post("/generateNewAccessToken", async (req, res) => {
  // const { refreshToken } = req.body;
  const refreshToken = req.cookies.refreshToken;
  console.log(refreshToken);
  if (!refreshToken) return res.status(400).json({ message: "Invalid Token" });

  try {
    const decode = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const newAccessToken = jwt.sign(
      { userId: decode.userId },
      process.env.JWT_SECRET,
      { expiresIn: "1m" }
    );
    res.json({ newAccessToken });
  } catch (err) {
    return res
      .status(403)
      .json({ message: "Invalid or Refresh Token is expired" });
  }
});

module.exports = router;
