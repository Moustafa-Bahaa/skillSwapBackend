require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

const app = express();
app.use(express.json());
app.use(cors());

// 1. إنشاء الـ HTTP Server
const server = http.createServer(app);

// 2. إعداد الـ Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// حفظ نسخة من io في app لاستخدامها داخل الـ Controllers
app.set("socketio", io);

// توصيل قاعدة البيانات
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB ✅"))
  .catch((err) => console.log("MongoDB Connection Error: ", err));

// ---------------- [ إعداد منطق الـ Socket.io ] ----------------

io.on("connection", (socket) => {
  console.log(`Connected to socket.io: ${socket.id}`);

  // إعداد اليوزر (الروم الشخصية بتاعته عشان الـ Badge)
  socket.on("setup", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`User joined personal room: ${userId}`);
      socket.emit("connected");
    }
  });

  // الانضمام لغرفة شات معينة
  socket.on("joinChat", (requestId) => {
    const roomName = requestId.toString();
    socket.join(roomName);
    console.log(`User joined chat room: ${roomName}`);
  });

  // استقبال وإرسال الرسائل (Real-time داخل الشات)
  socket.on("new message", (newMessageReceived) => {
    const chatRoom = newMessageReceived.swapRequestId;
    if (!chatRoom) return console.log("Chat room not defined");

    // إرسال الرسالة لكل الموجودين في الروم ما عدا الراسل
    socket.in(chatRoom.toString()).emit("message received", newMessageReceived);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected ❌");
  });
});

// -----------------------------------------------------------

// المسارات (Routes)
app.use("/api/auth", require("./routes/auth"));
app.use("/api/skills", require("./routes/skillRoutes"));
app.use("/api/swaps", require("./routes/swapRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));
app.use("/uploads", express.static("uploads"));
// تشغيل الـ server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT} with Socket.io Support ✅`),
);
