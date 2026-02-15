const express = require("express");
const router = express.Router();
const {
  sendSwapRequest,
  getMyRequests,
  updateSwapStatus,
} = require("../controllers/swapController");
const protect = require("../middleware/auth");

router.post("/", protect, sendSwapRequest);
router.get("/my-requests", protect, getMyRequests);
router.put("/update-status", protect, updateSwapStatus);
module.exports = router;
