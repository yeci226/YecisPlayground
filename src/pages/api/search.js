import yts from "yt-search";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const query = req.query.keyword;
    const searchResults = await yts(query);
    const videolist = searchResults.videos.slice(0, 20);

    const result = videolist.map((video) => ({
      id: video.videoId,
      title: video.title,
      url: video.url,
      thumbnail: video.image,
      authorName: video.author.name,
    }));

    return res.status(200).json(result);
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
