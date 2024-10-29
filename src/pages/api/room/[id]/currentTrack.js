import redis from "../../../../lib/redis";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    const { currentTrack } = req.body;

    // 获取当前房间数据
    const roomData = await redis.get(`room:${id}`);

    if (roomData) {
      const room = JSON.parse(roomData);
      room.currentTrack = { ...room.currentTrack, ...currentTrack };

      // 更新房间数据到 Redis
      await redis.set(`room:${id}`, JSON.stringify(room));
      return res.status(200).json({ status: "Current track updated" });
    } else {
      return res.status(404).json({ error: "Room not found" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
