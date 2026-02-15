const mongoose = require("mongoose");

const SwapRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // المهارة التي يريدها المرسل (المهارة المملوكة للمستلم)
  skillWanted: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill",
    required: true,
  },

  // المهارة التي يعرضها المرسل في المقابل (المهارة المملوكة للمرسل)
  skillOffered: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Skill",
    required: true,
  },

  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  // --- حقول الشات الجديدة ---
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
  // -----------------------

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// تحديث تاريخ updatedAt تلقائياً عند كل تغيير
SwapRequestSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("SwapRequest", SwapRequestSchema);
