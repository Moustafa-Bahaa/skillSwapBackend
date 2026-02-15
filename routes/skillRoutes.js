const express = require("express");
const router = express.Router();
const { createSkill, getAllSkills } = require("../controllers/skillController");
const protect = require("../middleware/auth");

// مسار جلب كل المهارات (للهوم)
router.get("/", getAllSkills);

// مسار إضافة مهارة جديدة (محمي)
router.post("/", protect, createSkill);

module.exports = router;