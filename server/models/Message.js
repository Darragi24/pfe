const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // conversation participants
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // associated booking (optional)
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
    // message content
    text: {
      type: String,
      required: true,
    },
    // read status
    read: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
