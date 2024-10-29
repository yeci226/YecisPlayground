import redis from "../../../lib/redis";

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    const roomData = await redis.get(`room:${id}`);

    if (roomData) {
      return res.status(200).json(roomData);
    } else {
      return res.status(404).json({ error: "Room not found" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
