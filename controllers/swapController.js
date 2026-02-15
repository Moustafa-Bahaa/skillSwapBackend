const SwapRequest = require("../models/SwapRequest");

// 1. إرسال طلب تبادل بسيط (بضغطة زر واحدة)
exports.sendSwapRequest = async (req, res) => {
  try {
    const { receiverId, skillId } = req.body;

    if (req.user.id === receiverId) {
      return res
        .status(400)
        .json({ message: "You cannot request your own skill" });
    }

    // منع تكرار الطلب لنفس المهارة لو لسه Pending
    const existing = await SwapRequest.findOne({
      sender: req.user.id,
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
      sender: req.user.id,
      receiver: receiverId,
      skill: skillId,
    });

    await newRequest.save();
    res.status(201).json({ message: "Request sent successfully", newRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. جلب الطلبات (الواردة والصادرة)
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

    const formatChat = (chat) => {
      const chatObj = chat.toObject();
      if (
        chatObj.lastMessageSender &&
        chatObj.lastMessageSender.toString() === userId
      ) {
        chatObj.unreadCount = 0;
      }
      return chatObj;
    };

    res.status(200).json({
      incoming: incoming.map(formatChat),
      outgoing: outgoing.map(formatChat),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 3. تحديث حالة الطلب
exports.updateSwapStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const swapRequest = await SwapRequest.findById(requestId);

    if (!swapRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (swapRequest.receiver.toString() !== req.user.id) {
      return res.status(401).json({ message: "Not authorized" });
    }

    swapRequest.status = status;
    await swapRequest.save();

    res
      .status(200)
      .json({ message: `Request ${status} successfully`, swapRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
