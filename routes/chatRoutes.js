const express = require("express");
const router = express.Router();
const { sendMessage, getMessages } = require("../controllers/chatController");
const protect = require("../middleware/auth");

router.post("/", protect, sendMessage);
router.get("/:swapRequestId", protect, getMessages);

module.exports = router;