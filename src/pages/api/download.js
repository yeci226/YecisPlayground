import ytdl from "ytdl-core";

export const config = {
  api: {
    responseLimit: false,
  },
};

function sanitizeFilename(filename) {
  // 移除不合法的檔名字元，但保留中文和其他 Unicode 字元
  return filename
    .replace(/[\\/:*?"<>|]/g, "") // 移除 Windows 不允許的字元
    .replace(/\s+/g, "_") // 空格換成底線
    .trim(); // 移除前後空白
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res
      .status(405)
      .json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const { url, format = "mp4", quality } = req.body;

    if (!url) {
      return res.status(400).json({ message: "URL is required" });
    }

    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ message: "Invalid YouTube URL" });
    }

    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    });

    // 處理檔案名稱
    const title = info.videoDetails.title;
    let filename = sanitizeFilename(title);

    // 根據格式添加副檔名
    filename = `${filename}.${format}`;

    // 選擇影片格式
    const videoFormat = quality
      ? info.formats.find((f) => f.itag === parseInt(quality))
      : ytdl.chooseFormat(info.formats, { quality: "highest" });

    if (!videoFormat) {
      throw new Error("Selected quality format not available");
    }

    // 設定回應標頭
    res.setHeader(
      "Content-Type",
      format === "mp3" ? "audio/mpeg" : "video/mp4"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`
    );

    // 開始下載串流
    const stream = ytdl(url, {
      format: videoFormat,
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    });

    stream.pipe(res);

    stream.on("error", (error) => {
      console.error("Stream error:", error);
      if (error.statusCode === 403) {
        return res.status(403).json({
          message: "無法存取此影片，可能是因為年齡限制或地區限制",
        });
      }
      res.status(500).json({ message: "下載影片時發生錯誤" });
    });
  } catch (error) {
    console.error("Download error:", error);
    const errorMessage = error.message.includes("Video unavailable")
      ? "此影片不存在或無法存取"
      : "處理請求時發生錯誤";

    res.status(500).json({ message: errorMessage });
  }
}
