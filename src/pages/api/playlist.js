import ytpl from "@distube/ytpl";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const playlistUrl = req.query.url;
    const playlistData = await ytpl(playlistUrl);

    const playlistName = playlistData.title;
    const newPlaylist = playlistData.items.map((item) => ({
      title: item.title,
      url: item.shortUrl,
      thumbnail: item.thumbnail,
      authorName: item.author.name,
    }));

    return res.status(200).json({ name: playlistName, songs: newPlaylist });
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
