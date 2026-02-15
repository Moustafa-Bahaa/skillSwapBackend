const express = require("express");
const router = express.Router();
const User = require("../models/User");
const multer = require("multer");
const path = require("path");
const {
  register,
  login,
  updateProfile,
  getProfile,
  logout,
  updatePushToken,
} = require("../controllers/authController");
const protect = require("../middleware/auth");

// --- إعداد Multer لتخزين الصور على السيرفر ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // تأكد من إنشاء مجلد باسم uploads في جذر المشروع
  },
  filename: (req, file, cb) => {
    // اسم الصورة = الوقت الحالي + الامتداد الأصلي (مثلاً: 1712345678.jpg)
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // حد أقصى 5 ميجا للصورة
});

// --- مسارات المصادقة ---

// تعديل الـ register لاستقبال صورة واحدة باسم "image"
router.post("/register", upload.single("image"), register);

router.post("/login", login);

// --- المسار الجديد لاكتشاف المستخدمين ---
router.get("/discover", protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } })
      .select("name email location skillsToTeach image") // أضفت image هنا عشان تظهر في الهوم
      .populate("skills");

    res.json(users);
  } catch (err) {
    res
      .status(500)
      .json({ message: "خطأ في جلب بيانات المستخدمين", error: err.message });
  }
});

// مسارات البروفايل (محمية)
router.get("/profile", protect, getProfile);

// تعديل الـ updateProfile برضه عشان لو اليوزر حب يغير صورته بعدين
router.put("/profile", protect, upload.single("image"), updateProfile);

router.post("/update-push-token", protect, updatePushToken);
router.post("/logout", protect, logout);

module.exports = router;
