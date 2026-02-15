const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    image: { type: String, default: "uploads/default-avatar.png" }, // الحقل الجديد
    skillsToTeach: [String],
    skillsToLearn: [String],
    bio: { type: String, default: "" }, // <--- ضيف السطر ده هنا
    pushToken: { type: String, default: "" },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [0, 0] },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// --- الربط السحري (Virtual Populate) ---
// دي بتخلي اليوزر "يشوف" المهارات بتاعته اللي في جدول الـ Skill
userSchema.virtual("skills", {
  ref: "Skill", // لازم يكون نفس الاسم اللي في mongoose.model("Skill", ...)
  localField: "_id", // الحقل هنا (ID اليوزر)
  foreignField: "user", // الحقل اللي في موديل الـ Skill اللي شايل الـ ID
});

// عشان نقدر نبحث بالموقع الجغرافي لاحقاً
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("User", userSchema);
