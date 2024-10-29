import redis from "../../../../lib/redis";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "POST") {
    const { userId } = req.body;

    // Get current room data
    const roomData = await redis.get(`room:${id}`);

    if (roomData) {
      const room = roomData;

      // Remove user from the list
      room.users = room.users.filter((user) => user !== userId);

      // Update the Redis store with the modified users list
      await redis.set(`room:${id}`, JSON.stringify(room));

      if (room.users.length === 0) {
        await redis.del(`room:${id}`); // Delete the room if no users left
        return res.status(200).json({ status: "Room deleted" });
      } else {
        return res
          .status(200)
          .json({ status: "User left", userCount: room.users.length });
      }
    } else {
      return res.status(404).json({ error: "Room not found" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
