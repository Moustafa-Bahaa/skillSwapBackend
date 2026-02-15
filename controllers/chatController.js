const Message = require("../models/Message");
const User = require("../models/User");
const SwapRequest = require("../models/SwapRequest");
const { Expo } = require("expo-server-sdk");

let expo = new Expo();

exports.sendMessage = async (req, res) => {
  try {
    const { swapRequestId, text } = req.body;
    const senderId = req.user.id;

    // 1. حفظ الرسالة في قاعدة البيانات
    const newMessage = new Message({
      swapRequestId,
      sender: senderId,
      text,
    });
    await newMessage.save();

    const populatedMessage = await Message.findById(newMessage._id).populate(
      "sender",
      "name",
    );

    // 2. البحث عن الـ SwapRequest لتحديد المستلم
    const swap = await SwapRequest.findById(swapRequestId);
    if (!swap) return res.status(404).json({ error: "Swap request not found" });

    const receiverId =
      swap.sender.toString() === senderId ? swap.receiver : swap.sender;

    // 3. تحديث بيانات الـ Swap (آخر رسالة + زيادة العداد)
    await SwapRequest.findByIdAndUpdate(swapRequestId, {
      lastMessage: text,
      lastMessageSender: senderId,
      $inc: { unreadCount: 1 }, // بنزود العداد وتصفيراً بيتم لما المستخدم يفتح الشات
    });

    const io = req.app.get("socketio");

    // 4. إرسال السوكت (تعديل هام لمنع التكرار)
    // نرسل للغرفة فقط. الطرفين (الراسل والمستلم) لو فاتحين الشات هيستلموا نسخة واحدة
    // لو المستلم مش فاتح الشات، هيستلمها عن طريق الـ Listeners العامة في الـ App.js
    io.to(swapRequestId.toString()).emit("message received", populatedMessage);
    io.to(receiverId.toString()).emit("message received", populatedMessage);
    // 5. إرسال نوتيفيكيشن Expo للمستلم
    const receiver = await User.findById(receiverId);
    if (
      receiver &&
      receiver.pushToken &&
      Expo.isExpoPushToken(receiver.pushToken)
    ) {
      try {
        await expo.sendPushNotificationsAsync([
          {
            to: receiver.pushToken,
            sound: "default",
            title: `رسالة من ${populatedMessage.sender.name}`,
            body: text,
            data: {
              swapRequestId: swapRequestId.toString(),
              senderName: populatedMessage.sender.name,
              type: "NEW_MESSAGE", // مفيد للتفرقة بين أنواع الإشعارات في المستقبل
            },
          },
        ]);
      } catch (e) {
        console.error("Push Error:", e);
      }
    }

    // 6. الرد على الراسل ببيانات الرسالة كاملة
    res.status(201).json(populatedMessage);
  } catch (error) {
    console.error("SendMessage Backend Error:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { swapRequestId } = req.params;
    const userId = req.user.id;

    // قبل ما نجيب الرسائل، لازم نصفر العداد للطلب ده
    // ملحوظة: في نظام متطور بنحتاج نتأكد إن اللي بيصفر هو المستلم مش الراسل
    // بس حالياً ده هيصفر العداد أول ما أي طرف يفتح الشات
    await SwapRequest.findByIdAndUpdate(swapRequestId, { unreadCount: 0 });

    const messages = await Message.find({ swapRequestId })
      .populate("sender", "name")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
