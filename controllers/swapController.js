const SwapRequest = require("../models/SwapRequest");

// 1. إرسال طلب تبادل (تأكدنا إنه مش لنفسه)
exports.sendSwapRequest = async (req, res) => {
  try {
    const { receiverId, skillId } = req.body;

    if (req.user.id === receiverId) {
      return res
        .status(400)
        .json({ message: "You cannot request your own skill" });
    }

    // فحص لو فيه طلب مبعوت فعلاً لنفس المهارة قبل كده (اختياري بس أحسن)
    const existing = await SwapRequest.findOne({
      sender: req.user.id,
      receiver: receiverId,
      skill: skillId,
    });
    if (existing)
      return res
        .status(400)
        .json({ message: "Request already sent for this skill" });

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

// 2. الجوهرة: جلب كل الطلبات (اللي جاتلك واللي إنت بعتها) منفصلين
// --- تعديل دالة getMyRequests ---

exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // جلب الطلبات الواردة
    const incoming = await SwapRequest.find({ receiver: userId })
      .populate("sender", "name email")
      .populate("skill", "title")
      .sort({ updatedAt: -1 });

    // جلب الطلبات الصادرة
    const outgoing = await SwapRequest.find({ sender: userId })
      .populate("receiver", "name email")
      .populate("skill", "title")
      .sort({ updatedAt: -1 });

    // تعديل البيانات قبل إرسالها:
    // لو أنا اللي باعت آخر رسالة، الـ unreadCount بالنسبة لي لازم يكون 0
    // لأن مش منطقي يظهر لي "1" على رسالة أنا اللي كاتبها
    const formatChat = (chat) => {
      const chatObj = chat.toObject();
      // إذا كان المستخدم الحالي هو نفسه الـ lastMessageSender، إذن لا يوجد رسائل غير مقروءة له
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

    const swapRequest = await SwapRequest.findById(requestId);

    if (!swapRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    // التأكد إن اللي بيقبل أو يرفض هو الـ receiver
    if (swapRequest.receiver.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this request" });
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
