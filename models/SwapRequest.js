const mongoose = require("mongoose");

const SwapRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // المهارة المطلوبة فقط
  skill: { type: mongoose.Schema.Types.ObjectId, ref: "Skill", required: true },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  // --- حقول الشات ---
  lastMessage: { type: String, default: "" },
  lastMessageSender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  unreadCount: { type: Number, default: 0 },
  // -----------------------

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

SwapRequestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("SwapRequest", SwapRequestSchema);
