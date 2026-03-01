const mongoose = require("mongoose");

const petSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    petType: {
      type: String,
      required: true,
      enum: ["dog", "cat", "bird","fish", "other"],
    },
    age: { type: Number, required: true },
    description: { type: String },

    image: { type: String }, // ✅ new field

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pet", petSchema);