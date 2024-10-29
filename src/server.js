const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());

let rooms = {}; // 用來存儲每個音樂室的播放清單和當前曲目

app.use(express.json());

// 創建新的音樂室
app.post("/createRoom", (req, res) => {
  const roomId = uuidv4();
  rooms[roomId] = {
    playlist: [],
    currentTrack: { id: null, playing: false },
    repeatMode: "none",
    user: [],
  };
  console.log("Room created:", roomId);
  res.send({ roomId });
});

app.get("/rooms", (req, res) => {
  res.send(Object.keys(rooms));
});

// 獲取音樂室的播放清單
app.get("/room/:id", (req, res) => {
  const roomId = req.params.id;
  if (!rooms[roomId]) {
    res.status(404).send({ error: "Room not found" });
    return;
  }
  res.send(rooms[roomId] || { playlist: [], currentTrack: {} });
});

// 更新播放清單
app.post("/room/:id/playlist", (req, res) => {
  const roomId = req.params.id;
  if (rooms[roomId]) {
    rooms[roomId].playlist = req.body.playlist;
    res.send({ status: "Playlist updated" });
  } else {
    res.status(404).send({ error: "Room not found" });
  }
});

// 更新當前曲目狀態
app.post("/room/:id/currentTrack", (req, res) => {
  const roomId = req.params.id;
  if (rooms[roomId]) {
    rooms[roomId].currentTrack = {
      ...rooms[roomId].currentTrack,
      ...req.body.currentTrack,
    };
    res.send({ status: "Current track updated" });
  } else {
    res.status(404).send({ error: "Room not found" });
  }
});

// 當用戶連接到房間
app.post("/room/:id/join", (req, res) => {
  const roomId = req.params.id;
  const { userId } = req.body;

  if (rooms[roomId]) {
    if (!rooms[roomId].user.includes(userId)) {
      // 確保不重複添加
      rooms[roomId].user.push(userId);
    }
    res.send({ status: "User joined", userCount: rooms[roomId].user.length });
  } else {
    res.status(404).send({ error: "Room not found" });
  }
});

// 當用戶離開房間
app.post("/room/:id/leave", (req, res) => {
  const roomId = req.params.id;
  const { userId } = req.body;

  if (rooms[roomId]) {
    // 移除用戶
    rooms[roomId].user = rooms[roomId].user.filter((user) => user !== userId);
    const userCount = rooms[roomId].user.length;

    // 如果沒有用戶，刪除房間
    if (userCount === 0) {
      delete rooms[roomId];
      res.send({ status: "Room deleted" });
    } else {
      res.send({ status: "User left", userCount });
    }
  } else {
    res.status(404).send({ error: "Room not found" });
  }
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
