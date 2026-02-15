require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();

// --- 1. إعداد المجلدات الثابتة (Static) ---
// التأكد من وجود مجلد uploads
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// إتاحة الوصول للمجلد من خلال الرابط (مهم جداً ترتيبها في البداية)
app.use("/uploads", express.static(uploadsDir));

// --- 2. Middleware ---
app.use(express.json());
app.use(cors({ origin: "*" }));

// --- 3. إنشاء الـ HTTP Server و Socket.io ---
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.set("socketio", io);

// --- 4. توصيل قاعدة البيانات ---
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB ✅"))
  .catch((err) => console.log("MongoDB Connection Error: ", err));

// --- 5. منطق الـ Socket.io ---
io.on("connection", (socket) => {
  console.log(`Connected to socket.io: ${socket.id}`);

  socket.on("setup", (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`User joined personal room: ${userId}`);
      socket.emit("connected");
    }
  });

  socket.on("joinChat", (requestId) => {
    const roomName = requestId.toString();
    socket.join(roomName);
    console.log(`User joined chat room: ${roomName}`);
  });

  socket.on("new message", (newMessageReceived) => {
    const chatRoom = newMessageReceived.swapRequestId;
    if (!chatRoom) return console.log("Chat room not defined");
    socket.in(chatRoom.toString()).emit("message received", newMessageReceived);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected ❌");
  });
});

// --- 6. المسارات (Routes) ---
app.use("/api/auth", require("./routes/auth"));
app.use("/api/skills", require("./routes/skillRoutes"));
app.use("/api/swaps", require("./routes/swapRoutes"));
app.use("/api/chat", require("./routes/chatRoutes"));

// مسار تجريبي للتأكد من أن السيرفر شغال (اختياري)
app.get("/", (req, res) => {
  res.send("Server is running and Static folder is ready! 🚀");
});

// --- 7. تشغيل السيرفر ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(`Server running on port ${PORT} with Socket.io Support ✅`),
);
