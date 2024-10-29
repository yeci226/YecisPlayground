import redis from "../../lib/redis";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const keys = await redis.keys("room:*");
    const rooms = await Promise.all(keys.map((key) => redis.get(key)));
    console.log(rooms);

    const roomsData = rooms.map((room, index) => ({
      id: keys[index].split(":")[1],
      data: room,
    }));

    return res.status(200).json(roomsData);
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
