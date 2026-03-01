const Notification = require("../models/Notification");

// Get notifications for current user
exports.getNotifications = async (req, res) => {
  try {
    const notes = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// mark single notification read
exports.markAsRead = async (req, res) => {
  try {
    const note = await Notification.findById(req.params.id);
    if (!note) return res.status(404).json({ message: "Notification not found" });
    if (note.user.toString() !== req.user.id)
      return res.status(403).json({ message: "Not allowed" });

    note.read = true;
    await note.save();
    res.json({ message: "Marked read" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// helper to create a notification (not exported)
exports._create = async ({ userId, message, type = "general", data = {} }) => {
  try {
    const n = await Notification.create({
      user: userId,
      message,
      type,
      data,
    });
    return n;
  } catch (err) {
    console.error("failed to create notification", err);
  }
};