import { useState, useEffect } from "react";
import styles from "../../public/css/Ytdownloader.module.css";
const websocketHost = "http://localhost:4400";

export default function YTDownloader() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [formats, setFormats] = useState([]);
  const [selectedFormat, setSelectedFormat] = useState("mp4");
  const [selectedQuality, setSelectedQuality] = useState("");
  const [loadingFormats, setLoadingFormats] = useState(false);

  // Fetch available formats when URL changes
  useEffect(() => {
    const fetchFormats = async () => {
      if (!url) {
        setFormats([]);
        setSelectedQuality("");
        return;
      }

      setLoadingFormats(true);
      setError("");

      try {
        const response = await fetch(`${websocketHost}/api/yt-formats`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "ngrok-skip-browser-warning": "true",
          },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error((await response.json()).message);
        }

        const data = await response.json();
        setFormats(data.formats);

        // Set default quality
        if (data.formats.length > 0) {
          setSelectedQuality(data.formats[0].itag);
        }
      } catch (err) {
        setError(err.message);
        setFormats([]);
      } finally {
        setLoadingFormats(false);
      }
    };

    // Debounce URL input
    const timeoutId = setTimeout(() => {
      if (url) fetchFormats();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [url]);

  const getQualityOptions = () => {
    if (selectedFormat === "mp3") {
      return formats
        .filter((f) => f.mimeType?.includes("audio"))
        .map((f) => ({
          itag: f.itag,
          label: `${f.audioBitrate}kbps`,
        }));
    }
    return formats
      .filter((f) => f.mimeType?.includes("video"))
      .map((f) => ({
        itag: f.itag,
        label: `${f.qualityLabel || "Audio"} - ${f.container}`,
      }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${websocketHost}/api/yt-download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          url,
          format: selectedFormat,
          quality: selectedQuality,
        }),
      });

      if (!response.ok) {
        throw new Error((await response.json()).message);
      }

      const blob = await response.blob();

      // Get filename from Content-Disposition
      const contentDisposition = response.headers.get("content-disposition");
      let filename = `download.${selectedFormat}`;

      if (contentDisposition) {
        const filenameStarMatch = contentDisposition.match(
          /filename\*=UTF-8''([^;]+)/i
        );
        if (filenameStarMatch) {
          filename = decodeURIComponent(filenameStarMatch[1]);
        } else {
          const filenameMatch = contentDisposition.match(
            /filename="?([^";]+)"?/i
          );
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
      }

      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.contentContainer}>
      <div className={styles.card}>
        <h1>Youtube 影片下載器</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.input_group}>
            <input
              type="url"
              placeholder="輸入 YouTube 影片網址"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.format_group}>
            <label className={styles.radio_label}>
              <input
                type="radio"
                name="format"
                value="mp4"
                checked={selectedFormat === "mp4"}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className={styles.radio_input}
              />
              MP4
            </label>
            <label className={styles.radio_label}>
              <input
                type="radio"
                name="format"
                value="mp3"
                checked={selectedFormat === "mp3"}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className={styles.radio_input}
              />
              MP3
            </label>
          </div>

          <div className={styles.select_group}>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              disabled={loadingFormats || formats.length === 0}
              className={styles.select}
            >
              {loadingFormats ? (
                <option>載入中...</option>
              ) : formats.length === 0 ? (
                <option>請先輸入網址</option>
              ) : (
                getQualityOptions().map(({ itag, label }) => (
                  <option key={itag} value={itag}>
                    {label}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading || loadingFormats || formats.length === 0}
            className={styles.button}
          >
            {loading ? "下載中..." : "下載"}
          </button>
        </form>

        {error && <div className={styles.alert}>{error}</div>}
      </div>
    </div>
  );
}
