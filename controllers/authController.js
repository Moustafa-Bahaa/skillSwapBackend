const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// 1. تسجيل مستخدم جديد
exports.register = async (req, res) => {
  try {
    const { name, email, password, location, bio } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "Email already registered" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let imagePath = "uploads/default-avatar.png";
    if (req.file) {
      imagePath = req.file.path.replace(/\\/g, "/");
    }

    let userLocation = { type: "Point", coordinates: [0, 0] };
    if (location && typeof location === "string") {
      const coords = location.split(",").map(Number);
      if (coords.length === 2) userLocation.coordinates = coords;
    }

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      image: imagePath,
      location: userLocation,
      bio,
    });

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

// 3. الحصول على بيانات المستخدم الحالي (تم الإصلاح هنا)
exports.getProfile = async (req, res) => {
  try {
    // شيلنا الـ populate مؤقتاً عشان نضمن السرعة
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      // كان مكتوب عندك User found وده غلط، الصح User NOT found
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ error: error.message });
  }
};

// 4. تحديث البروفايل
exports.updateProfile = async (req, res) => {
  try {
    const { name, email, bio, location } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (name) user.name = name;
    if (email) user.email = email;
    if (bio) user.bio = bio;
    if (req.file) {
      user.image = req.file.path.replace(/\\/g, "/");
    }

    const updatedUser = await user.save();
    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. تحديث توكن الإشعارات
exports.updatePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    await User.findByIdAndUpdate(req.user.id, { pushToken });
    res.status(200).json({ message: "Push token updated" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. تسجيل الخروج
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { pushToken: null });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
