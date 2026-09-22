const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Database = require("better-sqlite3");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const db = new Database(process.env.DB_PATH || (process.env.NODE_ENV === "production" ? "/data/chat.sqlite" : "chat.sqlite"));

db.pragma("journal_mode = WAL");
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  room TEXT NOT NULL DEFAULT 'العام',
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room, id);
`);

app.get("/health", (req,res)=>res.json({ok:true,service:"chat-elnsr"}));
app.use(express.static(path.join(__dirname, "public")));
app.get("/api/messages", (req,res)=>{
  const room = String(req.query.room || "العام");
  const rows = db.prepare(
    "SELECT id, username, room, body, created_at FROM messages WHERE room=? ORDER BY id DESC LIMIT 100"
  ).all(room).reverse();
  res.json(rows);
});

const online = new Map();

io.on("connection", socket => {
  socket.on("join", ({username, room="العام"}) => {
    username = String(username || "زائر").trim().slice(0,24) || "زائر";
    room = String(room || "العام").slice(0,40);
    socket.data.username = username;
    socket.data.room = room;
    socket.join(room);
    online.set(socket.id, {username, room});

    db.prepare("INSERT OR IGNORE INTO users(username) VALUES(?)").run(username);
    socket.emit("history", db.prepare(
      "SELECT id, username, room, body, created_at FROM messages WHERE room=? ORDER BY id DESC LIMIT 100"
    ).all(room).reverse());
    io.to(room).emit("presence", presence(room));
    io.to(room).emit("system", `${username} دخل الغرفة`);
  });

  socket.on("message", body => {
    const username = socket.data.username;
    const room = socket.data.room;
    if (!username || !room) return;
    body = String(body || "").trim().slice(0,2000);
    if (!body) return;
    const result = db.prepare(
      "INSERT INTO messages(username,room,body) VALUES(?,?,?)"
    ).run(username, room, body);
    const msg = db.prepare(
      "SELECT id, username, room, body, created_at FROM messages WHERE id=?"
    ).get(result.lastInsertRowid);
    io.to(room).emit("message", msg);
  });

  socket.on("disconnect", () => {
    const info = online.get(socket.id);
    online.delete(socket.id);
    if (info) {
      io.to(info.room).emit("presence", presence(info.room));
      io.to(info.room).emit("system", `${info.username} غادر الغرفة`);
    }
  });
});

function presence(room) {
  return [...online.values()].filter(x=>x.room===room).map(x=>x.username);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, ()=>console.log(`Chat server running on port ${PORT}`));
