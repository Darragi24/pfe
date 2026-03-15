const mongoose = require("mongoose"); // REQUIRED for ObjectId casting
const Message = require("../models/Message");
const User = require("../models/User");

// 1. Get all conversations (Sidebar List)
exports.getConversations = async (req, res) => {
  try {
    // CRITICAL FIX: Convert string ID from middleware to a MongoDB ObjectId
    const userId = new mongoose.Types.ObjectId(req.user.id); 

    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { recipient: userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", userId] },
              "$recipient",
              "$sender",
            ],
          },
          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", userId] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $sort: { lastMessageTime: -1 },
      },
      {
        $lookup: {
          from: "users", // Ensure your MongoDB collection is named 'users'
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          user: { name: 1, profilePic: 1, _id: 1 },
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1,
        },
      },
    ]);

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text, bookingId } = req.body;
    const senderId = req.user.id;

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      text,
      booking: bookingId || null,
    });

    await message.populate("sender", "name profilePic");

    if (global.io) {
      const ids = [senderId.toString(), recipientId.toString()].sort();
      const roomId = ids.join("-");
      global.io.to(roomId).emit("new-message", message);
      global.io.to(recipientId.toString()).emit("new-message", message);
    }

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 3. Get specific conversation history
exports.getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, recipient: userId },
        { sender: userId, recipient: currentUserId },
      ],
    })
      .populate("sender", "name profilePic")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 4. Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    await Message.updateMany(
      { recipient: currentUserId, sender: userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 5. Get TOTAL unread message count for the navbar badge
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;

    const count = await Message.countDocuments({
      recipient: userId,
      read: false,
    });

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};