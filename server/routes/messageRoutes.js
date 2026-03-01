const express = require("express");
const router = express.Router();
const {
  sendMessage,
  getConversation,
  getConversations,
  markAsRead,
} = require("../controllers/messageController");
const { protect } = require("../middleware/authMiddleware");

// Send a message
router.post("/", protect, sendMessage);

// Get all conversations
router.get("/conversations", protect, getConversations);

// Get conversation with specific user
router.get("/:userId", protect, getConversation);

// Mark messages as read
router.put("/:userId/read", protect, markAsRead);

module.exports = router;
