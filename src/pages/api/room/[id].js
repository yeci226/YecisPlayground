import redis from "../../../lib/redis";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    const roomData = req.body;

    // 将房间数据存储到 Redis
    await redis.set(`room:${id}`, JSON.stringify(roomData));
    return res.status(200).json({ status: "Room created", roomId: id });
  } else if (req.method === "GET") {
    // 从 Redis 获取房间数据
    const roomData = await redis.get(`room:${id}`);

    if (roomData) {
      return res.status(200).json(JSON.parse(roomData));
    } else {
      return res.status(404).json({ error: "Room not found" });
    }
  } else {
    res.setHeader("Allow", ["POST", "GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
