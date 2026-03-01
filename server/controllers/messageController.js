const Message = require("../models/Message");
const User = require("../models/User");

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const { recipientId, text, bookingId } = req.body;
    const senderId = req.user.id;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    // Create message
    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      text,
      booking: bookingId || null,
    });

    // Populate sender info
    await message.populate("sender", "name profilePic");

    // Emit via WebSocket
    if (global.io) {
      // Emit to specific user's chat room
      const roomId = [senderId, recipientId].sort().join("-");
      global.io.to(roomId).emit("new-message", {
        _id: message._id,
        sender: message.sender,
        recipient: recipientId,
        text,
        createdAt: message.createdAt,
      });
    }

    res.json({ message: "Message sent", data: message });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get conversation between two users
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

    // Mark messages as read
    await Message.updateMany(
      { recipient: currentUserId, sender: userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all conversations (list of users we've messaged)
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get unique conversation partners
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
          from: "users",
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

// Mark messages as read
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
