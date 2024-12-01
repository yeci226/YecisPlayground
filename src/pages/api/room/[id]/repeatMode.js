import redis from "../../../../lib/redis";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { repeatMode } = req.body;

  if (typeof repeatMode === "undefined") {
    return res
      .status(400)
      .json({ error: "Missing required field: repeatMode" });
  }

  try {
    const roomDataStr = await redis.get(`room:${id}`);

    if (!roomDataStr) {
      return res.status(404).json({ error: "Room not found" });
    }

    const room = JSON.parse(roomDataStr);

    // 更新 repeatMode
    room.repeatMode = repeatMode;

    await redis.set(`room:${id}`, JSON.stringify(room));

    return res.status(200).json({
      status: "Repeat mode updated",
      repeatMode,
      serverTime: Date.now(),
    });
  } catch (error) {
    console.error("更新重複模式時發生錯誤:", error);
    return res.status(500).json({ error: "更新失敗" });
  }
}
