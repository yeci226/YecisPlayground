const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

let playlist = []; // 播放清單
let currentTrack = { index: 0, playing: false }; // 當前曲目狀態，包含播放進度

app.use(express.json());

// 更新播放清單
app.post("/playlist", (req, res) => {
  playlist = req.body.playlist;
  res.send({ status: "Playlist updated" });
});

// 獲取播放清單
app.get("/playlist", (req, res) => {
  res.send(playlist);
});

// 更新當前曲目狀態（包括播放進度）
app.post("/currentTrack", (req, res) => {
  currentTrack = { ...currentTrack, ...req.body.currentTrack }; // 更新 currentTrack 狀態
  res.send({ status: "Current track updated" });
});

// 獲取當前曲目狀態
app.get("/currentTrack", (req, res) => {
  res.send(currentTrack);
});

app.listen(3001, () => {
  console.log("Server running on port 3001");
});
