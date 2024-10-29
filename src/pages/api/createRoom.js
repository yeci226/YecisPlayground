import redis from "../../lib/redis";
import { v4 as uuidv4 } from "uuid";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const roomId = uuidv4();
    const data = {
      playlist: [],
      currentTrack: { id: null, playing: false },
      repeatMode: "none",
      users: [], // Changed from user to users for consistency
    };

    // Store room data in Upstash KV
    await redis.set(`room:${roomId}`, JSON.stringify(data));
    console.log("Room created:", roomId);
    return res.status(200).json({ status: "Room created", roomId });
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
