require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const todoRoutes = require("./routes/todoRoutes");
const authRoutes = require("./routes/authRoutes");

// Environment Variables
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 4000;

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/todos", todoRoutes);
app.use("/api/auth", authRoutes);

// MongoDB Connection
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Todo API is running...");
});

// Export the app (without calling listen)
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
