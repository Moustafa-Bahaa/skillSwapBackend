const mongoose = require("mongoose");

const SwapRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    skill: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Skill",
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    // --- حقول الشات ---
    lastMessage: { type: String, default: "" },
    lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    unreadCount: { type: Number, default: 0 },
  },
  {
    // دي بتغنينا عن الـ pre-save function وبتضيف التواريخ أوتوماتيك
    timestamps: true,
  },
);

module.exports = mongoose.model("SwapRequest", SwapRequestSchema);
