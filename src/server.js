import { v4 as uuidv4 } from "uuid";

let rooms = {}; // 用來存儲每個音樂室的播放清單和當前曲目

export default function handler(req, res) {
  switch (req.method) {
    case "POST":
      if (req.url === "/api/createRoom") {
        const roomId = uuidv4();
        rooms[roomId] = {
          playlist: [],
          currentTrack: { id: null, playing: false },
          repeatMode: "none",
          user: [],
        };
        console.log("Room created:", roomId);
        res.status(200).json({ roomId });
      } else if (
        req.url.startsWith("/api/room/") &&
        req.url.endsWith("/playlist")
      ) {
        const roomId = req.url.split("/")[3];
        if (rooms[roomId]) {
          rooms[roomId].playlist = req.body.playlist;
          res.status(200).json({ status: "Playlist updated" });
        } else {
          res.status(404).json({ error: "Room not found" });
        }
      } else if (
        req.url.startsWith("/api/room/") &&
        req.url.endsWith("/currentTrack")
      ) {
        const roomId = req.url.split("/")[3];
        if (rooms[roomId]) {
          rooms[roomId].currentTrack = {
            ...rooms[roomId].currentTrack,
            ...req.body.currentTrack,
          };
          res.status(200).json({ status: "Current track updated" });
        } else {
          res.status(404).json({ error: "Room not found" });
        }
      } else if (
        req.url.startsWith("/api/room/") &&
        req.url.endsWith("/join")
      ) {
        const roomId = req.url.split("/")[3];
        const { userId } = req.body;
        if (rooms[roomId]) {
          if (!rooms[roomId].user.includes(userId)) {
            rooms[roomId].user.push(userId); // 確保不重複添加
          }
          res
            .status(200)
            .json({
              status: "User joined",
              userCount: rooms[roomId].user.length,
            });
        } else {
          res.status(404).json({ error: "Room not found" });
        }
      } else if (
        req.url.startsWith("/api/room/") &&
        req.url.endsWith("/leave")
      ) {
        const roomId = req.url.split("/")[3];
        const { userId } = req.body;
        if (rooms[roomId]) {
          rooms[roomId].user = rooms[roomId].user.filter(
            (user) => user !== userId
          );
          const userCount = rooms[roomId].user.length;
          if (userCount === 0) {
            delete rooms[roomId]; // 如果沒有用戶，刪除房間
            res.status(200).json({ status: "Room deleted" });
          } else {
            res.status(200).json({ status: "User left", userCount });
          }
        } else {
          res.status(404).json({ error: "Room not found" });
        }
      }
      break;

    case "GET":
      if (req.url === "/api/rooms") {
        res.status(200).json(Object.keys(rooms));
      } else if (req.url.startsWith("/api/room/")) {
        const roomId = req.url.split("/")[3];
        if (!rooms[roomId]) {
          res.status(404).json({ error: "Room not found" });
          return;
        }
        res.status(200).json(rooms[roomId]);
      }
      break;

    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
