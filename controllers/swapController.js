const SwapRequest = require("../models/SwapRequest");

// 1. إرسال طلب تبادل (مهارة مقابل مهارة)
exports.sendSwapRequest = async (req, res) => {
  try {
    const { receiverId, skillWantedId, skillOfferedId } = req.body;

    // التأكد أن المستخدم لا يرسل طلباً لنفسه
    if (req.user.id === receiverId) {
      return res
        .status(400)
        .json({ message: "You cannot request a swap with yourself" });
    }

    // التأكد من وجود معرفات المهارات
    if (!skillWantedId || !skillOfferedId) {
      return res
        .status(400)
        .json({ message: "Both skills are required for a swap" });
    }

    // فحص إذا كان هناك طلب معلق (Pending) لنفس المهارة بين الطرفين لمنع التكرار
    const existing = await SwapRequest.findOne({
      sender: req.user.id,
      receiver: receiverId,
      skillWanted: skillWantedId,
      status: "pending",
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: "A pending request already exists for this skill" });
    }

    const newRequest = new SwapRequest({
      sender: req.user.id,
      receiver: receiverId,
      skillWanted: skillWantedId,
      skillOffered: skillOfferedId,
    });

    await newRequest.save();
    res
      .status(201)
      .json({ message: "Swap request sent successfully", newRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 2. جلب الطلبات الواردة والصادرة مع تفاصيل المهارات
exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // جلب الطلبات الواردة (Incoming) مع بيانات المهارات المتبادلة
    const incoming = await SwapRequest.find({ receiver: userId })
      .populate("sender", "name email profilePic")
      .populate("skillWanted", "title") // المهارة المطلوبة من المستخدم الحالي
      .populate("skillOffered", "title") // المهارة المعروضة من الطرف الآخر
      .sort({ updatedAt: -1 });

    // جلب الطلبات الصادرة (Outgoing)
    const outgoing = await SwapRequest.find({ sender: userId })
      .populate("receiver", "name email profilePic")
      .populate("skillWanted", "title") // المهارة التي يريد المستخدم الحالي تعلمها
      .populate("skillOffered", "title") // المهارة التي يعرضها المستخدم الحالي
      .sort({ updatedAt: -1 });

    // دالة لتنسيق البيانات وتصفير عداد الرسائل غير المقروءة إذا كان المستخدم هو المرسل الأخير
    const formatChat = (chat) => {
      const chatObj = chat.toObject();
      if (
        chatObj.lastMessageSender &&
        chatObj.lastMessageSender.toString() === userId
      ) {
        chatObj.unreadCount = 0;
      }
      // تأمين وجود كائن المهارة لتجنب undefined في الفرونت إند
      chatObj.skill = chatObj.skillWanted;
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

// 3. تحديث حالة الطلب (قبول أو رفض)
exports.updateSwapStatus = async (req, res) => {
  try {
    const { requestId, status } = req.body;

    // التأكد من أن الحالة المرسلة صحيحة
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status update" });
    }

    const swapRequest = await SwapRequest.findById(requestId);

    if (!swapRequest) {
      return res.status(404).json({ message: "Request not found" });
    }

    // التأكد أن الذي يحدث الحالة هو متلقي الطلب فقط
    if (swapRequest.receiver.toString() !== req.user.id) {
      return res
        .status(401)
        .json({ message: "Not authorized to update this request" });
    }

    swapRequest.status = status;
    await swapRequest.save();

    res.status(200).json({
      message: `Request ${status} successfully`,
      swapRequest,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
