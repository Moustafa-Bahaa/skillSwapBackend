const Skill = require("../models/Skill");
const User = require("../models/User"); // تأكد من استدعاء موديل اليوزر
exports.getAllSkills = async (req, res) => {
  try {
    // بنجيب المهارات ومعاها بيانات المستخدم اللي عاملها (اسمه وإيميله)
    const skills = await Skill.find().populate("user", "name email");
    res.status(200).json(skills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createSkill = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    // 1. إنشاء المهارة
    const newSkill = new Skill({
      title,
      description,
      category,
      user: req.user.id,
    });

    await newSkill.save();

    // 2. التعديل الجوهري: إضافة المهارة لليوزر اللي عملها
    await User.findByIdAndUpdate(req.user.id, {
      $push: { skillsToTeach: newSkill._id }, // بيضيف الـ ID الجديد للـ Array
    });

    res.status(201).json(newSkill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
