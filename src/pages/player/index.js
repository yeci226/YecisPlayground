import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";
import styles from "../../public/css/Player.module.css";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export default function Player() {
  const text = "Let's play some music";
  const [animate, setAnimate] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [audioSrc, setAudioSrc] = useState("");
  const [videoTitles, setVideoTitles] = useState([]);
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.1);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [repeatMode, setRepeatMode] = useState("none");
  const timePercentage = (currentTime / duration) * 100;
  const volumePercentage = volume * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate((prev) => !prev);
    }, text.length * 150);

    return () => clearInterval(interval);
  }, [text.length]);

  // 更新當前播放時間
  const handleProgress = () => {
    if (playerRef.current) {
      const time = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      setCurrentTime(time || 0);
      setDuration(duration || 0);
    }
  };

  // 播放下一首歌曲
  const playNextTrack = () => {
    if (repeatMode === "single") {
      playerRef.current.seekTo(0); // 單曲循環，重頭播放
      return;
    }

    let nextIndex;
    if (repeatMode === "playlist") {
      nextIndex = (currentTrackIndex + 1) % playlist.length; // 環繞播放
    } else {
      nextIndex =
        currentTrackIndex + 1 < playlist.length
          ? currentTrackIndex + 1
          : currentTrackIndex; // 到達末尾不再增加
    }

    if (nextIndex < playlist.length) {
      setCurrentTrackIndex(nextIndex);
      setAudioSrc(playlist[nextIndex]);
      setPlaying(true);
    } else {
      setPlaying(false); // 如果沒有下一首，則停止播放
    }
  };

  // 播放上一首歌曲
  const playPreviousTrack = () => {
    let prevIndex =
      currentTrackIndex - 1 >= 0 ? currentTrackIndex - 1 : currentTrackIndex;
    if (prevIndex !== currentTrackIndex) {
      setCurrentTrackIndex(prevIndex);
      setAudioSrc(playlist[prevIndex]);
      setPlaying(true);
    }
  };

  // 隨機播放
  const playRandomTrack = () => {
    if (playlist.length > 0) {
      let randomIndex;
      do {
        randomIndex = Math.floor(Math.random() * playlist.length);
      } while (randomIndex === currentTrackIndex);

      setCurrentTrackIndex(randomIndex);
      setAudioSrc(playlist[randomIndex]);
      setPlaying(true);
    }
  };

  // 切換播放狀態
  const togglePlayPause = () => {
    setPlaying((prev) => !prev);
  };

  // 處理連結輸入變化
  const handleLinkChange = (event) => {
    setInputValue(event.target.value);
  };

  // 處理連結提交
  const handleLinkSubmit = async () => {
    if (!ReactPlayer.canPlay(inputValue)) {
      alert(`無法播放此連結\n${inputValue}`);
      setInputValue("");
      return;
    }

    if (inputValue) {
      fetchVideoTitle(inputValue);

      setPlaylist([...playlist, inputValue]);
      if (playlist.length === 0) {
        // 如果是第一首歌，立即開始播放
        setAudioSrc(inputValue);
        setPlaying(true);
        setCurrentTrackIndex(0);
      }
      setInputValue("");
    }
  };

  const fetchVideoTitle = async (url) => {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_API_URL
        }/api/videoTitle?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();

      if (response.ok) {
        if (data.playlist) {
          setVideoTitles((prev) => [
            ...prev,
            {
              title: `播放清單 ${data.songCount} 首歌曲 ${data.title}`,
              url,
              thumbnail: data.thumbnail,
            },
          ]);
        } else {
          setVideoTitles((prev) => [
            ...prev,
            { title: data.title, url, thumbnail: data.thumbnail },
          ]);
        }
      }
    } catch (error) {
      console.error("Network error:", error);
    }
  };
  // 格式化時間為分鐘:秒數
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // 選擇曲目並播放
  const selectTrack = (index) => {
    console.log(videoTitles[index]);
    setCurrentTrackIndex(index);
    setAudioSrc(playlist[index]);
    setPlaying(true);
  };

  const handleRemoveTrack = (event, index) => {
    event.stopPropagation();
    const updatedPlaylist = playlist.filter((_, i) => i !== index);
    setPlaylist(updatedPlaylist);

    // 更新当前曲目索引
    if (index === currentTrackIndex) {
      if (index === playlist.length - 1) {
        setCurrentTrackIndex(index - 1);
      } else {
        setCurrentTrackIndex(index + 1);
      }
      setAudioSrc(updatedPlaylist[index + 1]);
    } else if (index < currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  return (
    <div>
      <Head>
        <title>Yeci Playground</title>
      </Head>

      <div className={styles.contentContainer}>
        <h1 className={!audioSrc && styles.contentLower}>
          {text.split("").map((char, index) => (
            <span
              key={index}
              className={`${styles.jump} ${animate && styles.animate}`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {char === " " ? "\u00A0" : char}
            </span>
          ))}
        </h1>

        <div className={styles.audioControls}>
          <input
            type="text"
            placeholder="在這裡輸入連結"
            style={{ width: "60vw", maxWidth: "400px" }}
            value={inputValue}
            onChange={handleLinkChange}
            className={inputValue && styles.active}
          />
          <button className={styles.button} onClick={handleLinkSubmit}>
            添加到歌單
          </button>
        </div>

        <div
          className={styles.audioControls}
          style={{ display: "flex", gap: "10vw", flexDirection: "row" }}
        >
          {audioSrc && playlist.length > 0 && (
            <div className={styles.playlistContainer}>
              <div
                style={{ display: "flex", flexDirection: "row", gap: "30px" }}
              >
                <h2>播放列表 - {playlist.length} 首歌曲</h2>
                <button
                  className={styles.button}
                  style={{ maxWidth: "20vw", width: "100px" }}
                  onClick={() => setPlaylist([])}
                >
                  清空歌單
                </button>
              </div>

              <ul>
                {playlist.map((track, index) => (
                  <li
                    key={index}
                    onClick={() => selectTrack(index)}
                    className={`${styles.trackElement} ${
                      index === currentTrackIndex
                        ? styles.active
                        : styles.inactive
                    }`}
                    style={{
                      color: index === currentTrackIndex ? "#86AB89" : "grey",
                    }}
                  >
                    <>
                      {videoTitles[index] && videoTitles[index].thumbnail && (
                        <img
                          src={videoTitles[index].thumbnail}
                          alt={videoTitles[index].title}
                          className={styles.thumbnail}
                        />
                      )}
                      {index === currentTrackIndex ? (
                        <button className={styles.removeButton}>💎</button>
                      ) : (
                        <button
                          className={styles.removeButton}
                          onClick={(event) => handleRemoveTrack(event, index)}
                        >
                          ❌
                        </button>
                      )}
                    </>
                    {videoTitles[index]
                      ? videoTitles[index].title.length > 50
                        ? videoTitles[index].title.slice(0, 50) + "..."
                        : videoTitles[index].title
                      : "未知歌曲"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {audioSrc && (
            <div className={styles.playerContainer}>
              <>
                <ReactPlayer
                  ref={playerRef}
                  url={audioSrc}
                  playing={playing}
                  controls={false}
                  volume={volume}
                  width="100%"
                  height="100%"
                  onProgress={handleProgress}
                  onEnded={playNextTrack} // 播放結束後自動播放下一首
                />

                <div className={styles.trackInfo}>
                  {"正在播放".split("").map((char, index) => (
                    <span
                      key={index}
                      className={`${styles.jump} ${animate && styles.animate}`}
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      {char === " " ? "\u00A0" : char}
                    </span>
                  ))}
                  {" - "}
                  {videoTitles[currentTrackIndex]
                    ? videoTitles[currentTrackIndex].title.length > 50
                      ? videoTitles[currentTrackIndex].title.slice(0, 50) +
                        "..."
                      : videoTitles[currentTrackIndex].title
                    : "未知歌曲"}
                </div>

                <div className={styles.progressContainer}>
                  <input
                    className={styles.progressBar}
                    type="range"
                    min={0}
                    max={duration || 0}
                    value={currentTime}
                    onChange={(e) =>
                      playerRef.current.seekTo(parseFloat(e.target.value))
                    }
                    style={{ "--value": `${timePercentage}%` }}
                  />
                  <div className={styles.timeDisplay}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                <div className={styles.controlPanel}>
                  <button className={styles.button} onClick={playRandomTrack}>
                    隨機順序
                  </button>
                  <button className={styles.button} onClick={playPreviousTrack}>
                    上一首
                  </button>
                  <button className={styles.button} onClick={togglePlayPause}>
                    {playing ? "暫停" : "播放"}
                  </button>
                  <button className={styles.button} onClick={playNextTrack}>
                    下一首
                  </button>

                  <button
                    className={styles.button}
                    onClick={() =>
                      setRepeatMode(
                        repeatMode === "none"
                          ? "single"
                          : repeatMode === "single"
                          ? "playlist"
                          : "none"
                      )
                    }
                  >
                    {repeatMode === "none" && <span>關閉循環</span>}
                    {repeatMode === "single" && <span>單曲循環</span>}
                    {repeatMode === "playlist" && <span>歌單循環</span>}
                  </button>
                </div>

                <div className={styles.volumeControl}>
                  <p>音量：{Math.round(volume * 100)}%</p>
                  <input
                    className={styles.progressBar}
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    style={{ width: "25%", "--value": `${volumePercentage}%` }}
                  />
                </div>
              </>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
