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

    // المهارة المطلوبة
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
    lastMessage: {
      type: String,
      default: "",
    },
    lastMessageSender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    unreadCount: {
      type: Number,
      default: 0,
    },
  },
  {
    // دي بتهندل createdAt و updatedAt تلقائياً وبكفاءة أعلى
    timestamps: true,
  },
);

module.exports = mongoose.model("SwapRequest", SwapRequestSchema);
