const express = require("express");
const router = express.Router();
const User = require("../models/User"); // تأكد من استيراد الموديل لاستخدامه في discover
const {
  register,
  login,
  updateProfile,
  getProfile,
  logout,
  updatePushToken,
} = require("../controllers/authController");
const protect = require("../middleware/auth");

// مسارات المصادقة الأساسية
router.post("/register", register);
router.post("/login", login);

// --- المسار الجديد لاكتشاف المستخدمين ومهاراتهم ---
router.get("/discover", protect, async (req, res) => {
  try {
    // جلب كل المستخدمين ما عدا المستخدم الحالي
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("name email location skillsToTeach") // اختيار الحقول الأساسية
      .populate("skills"); // جلب المهارات المربوطة بكل يوزر من جدول الـ Skills

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "خطأ في جلب بيانات المستخدمين", error: err.message });
  }
});

// مسارات البروفايل (محمية)
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

// مسار تحديث توكن الإشعارات
router.post("/update-push-token", protect, updatePushToken);

// مسار تسجيل الخروج
router.post("/logout", protect, logout);

module.exports = router;