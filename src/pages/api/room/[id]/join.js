import redis from "../../../../lib/redis";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    const { userId } = req.body;

    // Get current room data
    const roomData = await redis.get(`room:${id}`);

    if (roomData) {
      const room = roomData;

      if (!room.users.includes(userId)) {
        room.users.push(userId);

        // Update room data in Upstash KV
        await redis.set(`room:${id}`, JSON.stringify(room));
        return res
          .status(200)
          .json({ status: "User joined", userCount: room.users.length });
      } else {
        return res.status(200).json({
          status: "User already in room",
          userCount: room.users.length,
        });
      }
    } else {
      return res.status(404).json({ error: "Room not found" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
