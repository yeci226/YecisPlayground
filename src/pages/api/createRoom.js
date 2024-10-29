import redis from "../../../lib/redis";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { roomId, data } = req.body;

    // Store room data in Upstash KV
    await redis.set(`room:${roomId}`, JSON.stringify(data));
    return res.status(200).json({ status: "Room created", roomId });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
