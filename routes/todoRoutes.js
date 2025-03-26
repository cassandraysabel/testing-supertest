const express = require("express");
const Todo = require("../models/Todo");
const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

// 1️⃣ Create a Todo (POST)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const newTodo = new Todo({ title });
    await newTodo.save();
    res.status(201).json(newTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2️⃣ Get all Todos (GET)
router.get("/", authMiddleware, async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3️⃣ Get a single Todo by ID (GET)
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    if (!todo) return res.status(404).json({ message: "Todo not found" });

    res.json(todo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4️⃣ Update a Todo (PUT - Replace entire object)
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, completed } = req.body;
    const updatedTodo = await Todo.findByIdAndUpdate(
      req.params.id,
      { title, completed },
      { new: true }
    );
    if (!updatedTodo)
      return res.status(404).json({ message: "Todo not found" });
    res.json(updatedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5️⃣ Update a Todo partially (PATCH - Modify specific fields)
router.patch("/:id", authMiddleware, async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    if (!updatedTodo)
      return res.status(404).json({ message: "Todo not found" });
    res.json(updatedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6️⃣ Delete a Todo (DELETE)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
    if (!deletedTodo)
      return res.status(404).json({ message: "Todo not found" });

    res.json({ message: "Todo deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
