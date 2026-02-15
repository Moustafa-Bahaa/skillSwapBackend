const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 1. تسجيل مستخدم جديد
exports.register = async (req, res) => {
  try {
    const { name, email, password, location, bio } = req.body;

    // تشفير الباسورد (مهم جداً عشان اللوجين يشتغل)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // استلام مسار الصورة
    let imagePath = "uploads/default-avatar.png";
    if (req.file) {
      imagePath = req.file.path.replace(/\\/g, "/"); // تحويل الـ backslashes لـ forward slashes عشان الويندوز
    }

    // معالجة اللوكيشن
    let userLocation = { type: "Point", coordinates: [0, 0] };
    if (location) {
      try {
        // لو باعتها من الموبايل كـ string "lon,lat"
        const coords = location.split(",").map(Number);
        if (coords.length === 2) userLocation.coordinates = coords;
      } catch (e) {
        console.log("Location format error");
      }
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      image: imagePath,
      location: userLocation,
      bio,
    });

    // عمل Token فوراً بعد التسجيل
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(201).json({ success: true, token, user });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// 2. تسجيل الدخول
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        image: user.image,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// باقي الدوال (getProfile, updateProfile, etc.) سيبها زي ما هي عندك بس تأكد إنها متصدرة بـ exports
exports.getProfile = async (req, res) => {
  /* كودك القديم */
};
exports.updateProfile = async (req, res) => {
  /* كودك القديم */
};
exports.updatePushToken = async (req, res) => {
  /* كودك القديم */
};
exports.logout = async (req, res) => {
  /* كودك القديم */
};
