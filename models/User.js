const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // دول ممكن تسيبهم لو عايز تخزن كلمات دلالية سريعة
    skillsToTeach: [String],
    skillsToLearn: [String],
    pushToken: { type: String, default: "" },
    location: {
      type: { type: String, default: "Point" },
      coordinates: { type: [Number], default: [0, 0] }, // [longitude, latitude]
    },
  },
  {
    timestamps: true,
    // مهم جداً عشان الـ Virtuals تظهر لما نبعت البيانات للفرونت إند
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
