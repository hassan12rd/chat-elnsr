import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*"
  },
  transports: ["websocket", "polling"],
  maxHttpBufferSize: 1e6
});

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

const users = new Map();
const messages = [];

const MAX_MESSAGES = 100;
const MAX_NAME_LENGTH = 24;
const MAX_AGE = 120;

function cleanName(name) {
  return String(name || "زائر")
    .trim()
    .slice(0, MAX_NAME_LENGTH) || "زائر";
}

function cleanText(text) {
  return String(text || "")
    .trim()
    .slice(0, 500);
}

function cleanAge(age) {
  const number = Number(age);

  if (!Number.isInteger(number)) return null;
  if (number < 13 || number > MAX_AGE) return null;

  return number;
}

function cleanGender(gender) {
  if (gender === "male") return "male";
  if (gender === "female") return "female";
  return "unknown";
}

function cleanAvatar(avatar) {
  if (!avatar) return "";

  const value = String(avatar);

  // السماح فقط بصور Data URL
  if (!value.startsWith("data:image/")) {
    return "";
  }

  // منع البيانات الكبيرة جدًا
  if (value.length > 700000) {
    return "";
  }

  return value;
}

function publicUser(user) {
  return {
    id: user.id,
    name: user.name,
    age: user.age,
    gender: user.gender,
    avatar: user.avatar
  };
}

function broadcastUsers() {
  io.emit(
    "users",
    [...users.values()].map(publicUser)
  );
}

io.on("connection", (socket) => {

  socket.on("join", (data = {}) => {
    const name = cleanName(data.name);
    const age = cleanAge(data.age);
    const gender = cleanGender(data.gender);
    const avatar = cleanAvatar(data.avatar);

    if (!age) {
      socket.emit("join_error", {
        message: "العمر يجب أن يكون بين 13 و120 سنة."
      });
      return;
    }

    const user = {
      id: socket.id,
      name,
      age,
      gender,
      avatar
    };

    users.set(socket.id, user);

    // إرسال الرسائل السابقة للمستخدم الجديد
    socket.emit("history", messages);

    // إرسال بيانات المستخدم الجديد له
    socket.emit("joined", publicUser(user));

    // تحديث قائمة المتصلين للجميع
    broadcastUsers();
  });

  socket.on("send_message", (data = {}) => {
    const user = users.get(socket.id);

    if (!user) return;

    const body = cleanText(data.text);

    if (!body) return;

    const message = {
      id: crypto.randomUUID(),
      clientId: String(
        data.clientId || crypto.randomUUID()
      ),
      userId: socket.id,
      name: user.name,
      age: user.age,
      gender: user.gender,
      avatar: user.avatar,
      text: body,
      time: new Date().toISOString()
    };

    messages.push(message);

    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }

    // إرسال الرسالة مرة واحدة للجميع
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    broadcastUsers();
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    users: users.size,
    messages: messages.length
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Chat server listening on ${PORT}`);
});
