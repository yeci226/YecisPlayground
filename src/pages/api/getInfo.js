import ytdl from "ytdl-core";
const maxResults = 1;

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const trackUrl = req.query.url;
      const basicInfo = await ytdl.getBasicInfo(trackUrl);

      const relatedVideos = basicInfo.related_videos
        .slice(0, maxResults)
        .map((video) => ({
          id: video.id,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          title: video.title,
          thumbnail: video.thumbnails[0].url,
          authorName: video.author.name,
        }));

      return res.status(200).json(relatedVideos);
    } catch (error) {
      console.error("獲取推薦視頻失敗：", error);
      return [];
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
