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

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (name) user.name = name;
    if (email) user.email = email;

    const updatedUser = await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. الحصول على بيانات المستخدم الحالي
// 4. الحصول على بيانات المستخدم الحالي
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("skillsToTeach") // هيحول الـ IDs لبيانات مهارات كاملة
      .populate("skillsToLearn");

    if (!user) {
      return res.status(404).json({ message: "User found" });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. تحديث توكن الإشعارات (Push Token)
exports.updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    await User.findByIdAndUpdate(req.user.id, { pushToken });

    console.log(`✅ Push Token updated for user: ${req.user.id}`);
    res.status(200).json({ message: "Push token updated successfully" });
  } catch (error) {
    console.error("Error updating push token:", error);
    res.status(500).json({ error: "Failed to update push token" });
  }
};

// 6. تسجيل الخروج ومسح التوكن
exports.logout = async (req, res) => {
  try {
    // نبحث عن المستخدم ونمسح الـ pushToken لضمان توقف الإشعارات فوراً
    const user = await User.findById(req.user.id);
    if (user) {
      user.pushToken = null;
      await user.save();
    }

    console.log(`👋 User ${req.user.id} logged out, push token cleared.`);
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({ error: error.message });
  }
};
