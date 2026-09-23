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
  cors: { origin: "*" },
  transports: ["websocket", "polling"]
});

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;
const users = new Map();
const messages = [];
const MAX_MESSAGES = 100;

function cleanName(name) {
  return String(name || "زائر").trim().slice(0, 24) || "زائر";
}
function cleanText(text) {
  return String(text || "").trim().slice(0, 500);
}

io.on("connection", (socket) => {
  socket.on("join", ({ name }) => {
    const user = { id: socket.id, name: cleanName(name) };
    users.set(socket.id, user);
    socket.emit("history", messages);
    io.emit("users", [...users.values()]);
    socket.emit("joined", user);
  });

  socket.on("send_message", ({ clientId, text }) => {
    const user = users.get(socket.id);
    const body = cleanText(text);
    if (!user || !body) return;

    const message = {
      id: crypto.randomUUID(),
      clientId: String(clientId || crypto.randomUUID()),
      userId: socket.id,
      name: user.name,
      text: body,
      time: new Date().toISOString()
    };

    messages.push(message);
    if (messages.length > MAX_MESSAGES) messages.shift();

    // Broadcast exactly once. The sender does NOT append a second local copy.
    io.emit("message", message);
  });

  socket.on("disconnect", () => {
    users.delete(socket.id);
    io.emit("users", [...users.values()]);
  });
});

app.get("/health", (_req, res) => res.json({ ok: true }));

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Chat server listening on ${PORT}`);
});