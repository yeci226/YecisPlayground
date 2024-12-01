import redis from "../../../../lib/redis";

function isJson(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    const { currentTrack, repeatMode } = req.body;

    try {
      // 獲取當前房間數據
      const roomDataStr = await redis.get(`room:${id}`);

      if (roomDataStr) {
        const room = isJson(roomDataStr)
          ? JSON.parse(roomDataStr)
          : roomDataStr;

        // 更新當前歌曲狀態，並加入時間戳
        room.currentTrack = {
          ...room.currentTrack,
          ...currentTrack,
          lastUpdatedAt: Date.now(), // 加入伺服器端時間戳
        };

        // 如果有 repeatMode，也一併更新
        if (repeatMode) {
          room.repeatMode = repeatMode;
        }

        // 更新房間數據到 Upstash KV
        await redis.set(`room:${id}`, JSON.stringify(room));

        return res.status(200).json({
          status: "Current track updated",
          serverTime: Date.now(),
        });
      } else {
        return res.status(404).json({ error: "Room not found" });
      }
    } catch (error) {
      console.error("更新當前歌曲時發生錯誤:", error);
      return res.status(500).json({ error: "更新失敗" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
