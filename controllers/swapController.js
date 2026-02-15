const SwapRequest = require("../models/SwapRequest");
const User = require("../models/User");
const { Expo } = require("expo-server-sdk");
let expo = new Expo();

// دالة مساعدة لإرسال النوتيفيكيشن عبر Expo
const sendPush = async (targetUserId, title, body, data = {}) => {
  try {
    const user = await User.findById(targetUserId);
    if (user && user.pushToken && Expo.isExpoPushToken(user.pushToken)) {
      await expo.sendPushNotificationsAsync([
        {
          to: user.pushToken,
          sound: "default",
          title: title,
          body: body,
          data: data,
        },
      ]);
      console.log(`Push sent to user: ${targetUserId}`);
    }
  } catch (error) {
    console.error("Error sending push notification:", error);
  }
};

// 1. إرسال طلب تبادل
exports.sendSwapRequest = async (req, res) => {
  try {
    const { receiverId, skillId } = req.body;
    const senderId = req.user.id;

    if (senderId === receiverId) {
      return res
        .status(400)
        .json({ message: "You cannot request your own skill" });
    }

    const existing = await SwapRequest.findOne({
      sender: senderId,
      receiver: receiverId,
      skill: skillId,
      status: "pending",
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "Request already sent and is pending" });
    }

    const newRequest = new SwapRequest({
      sender: senderId,
      receiver: receiverId,
      skill: skillId,
    });

    await newRequest.save();

    // جلب بيانات الراسل عشان نكتب اسمه في النوتيفيكيشن
    const senderUser = await User.findById(senderId);

    // --- إرسال النوتيفيكيشن ---
    await sendPush(
      receiverId,
      "New Swap Request! 🤝",
      `${senderUser.name} wants to swap skills with you.`,
      { type: "NEW_SWAP", swapRequestId: newRequest._id },
    );

    // --- التحديث اللحظي عبر Socket ---
    const io = req.app.get("socketio");
    if (io) {
      io.to(receiverId.toString()).emit("new_swap_request", newRequest);
    }

    res.status(201).json({ message: "Request sent successfully", newRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. تحديث حالة الطلب (Accepted / Rejected)
exports.updateSwapStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const swapRequest = await SwapRequest.findById(requestId).populate(
      "receiver",
      "name",
    );
    if (!swapRequest)
      return res.status(404).json({ message: "Request not found" });

    // التأكد أن الشخص اللي بيحدث الحالة هو المستلم فعلاً
    if (swapRequest.receiver._id.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    swapRequest.status = status;
    await swapRequest.save();

    // نوتيفيكيشن للمرسل الأصلي لإبلاغه بالنتيجة
    await sendPush(
      swapRequest.sender,
      `Request ${status}! ✨`,
      `${swapRequest.receiver.name} has ${status} your swap request.`,
      { type: "STATUS_UPDATE", requestId, status },
    );

    // تحديث بالـ Socket للمرسل عشان الـ Badge يختفي أو يتحدث
    const io = req.app.get("socketio");
    if (io) {
      io.to(swapRequest.sender.toString()).emit("swap_status_updated", {
        requestId,
        status,
      });
    }

    res
      .status(200)
      .json({ message: `Request ${status} successfully`, swapRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. جلب الطلبات (كما هي)
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const incoming = await SwapRequest.find({ receiver: userId })
      .populate("sender", "name email profilePic")
      .populate("skill", "title")
      .sort({ updatedAt: -1 });

    const outgoing = await SwapRequest.find({ sender: userId })
      .populate("receiver", "name email profilePic")
      .populate("skill", "title")
      .sort({ updatedAt: -1 });

    res.status(200).json({ incoming, outgoing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
