import ytdl from "ytdl-core";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ message: "Invalid YouTube URL" });
    }

    const info = await ytdl.getInfo(url);
    const formats = info.formats.map((format) => ({
      itag: format.itag,
      mimeType: format.mimeType,
      qualityLabel: format.qualityLabel,
      audioBitrate: format.audioBitrate,
      container: format.container,
    }));

    res.json({ formats });
  } catch (error) {
    console.error("Format fetch error:", error);
    res.status(500).json({ message: "Error fetching video formats" });
  }
}
