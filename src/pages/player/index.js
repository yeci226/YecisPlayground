import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";
import styles from "../../public/css/Player.module.css";
import { v4 as uuidv4 } from "uuid";
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
  const [currentTrackId, setCurrentTrackId] = useState(null); // Track ID to uniquely identify the current track
  const [repeatMode, setRepeatMode] = useState("none");
  const timePercentage = (currentTime / duration) * 100;
  const volumePercentage = volume * 100;

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate((prev) => !prev);
    }, text.length * 150);

    return () => clearInterval(interval);
  }, [text.length]);

  useEffect(() => {
    const fetchPlaylistAndCurrentTrack = async () => {
      try {
        const playlistRes = await fetch("http://localhost:3001/playlist");
        const currentTrackRes = await fetch(
          "http://localhost:3001/currentTrack"
        );
        const playlistData = await playlistRes.json();
        const currentTrackData = await currentTrackRes.json();

        setPlaylist(playlistData);

        // Update current track if server's data differs
        if (
          currentTrackData.id !== currentTrackId ||
          currentTrackData.playing !== playing
        ) {
          setCurrentTrackId(currentTrackData.id);
          setPlaying(currentTrackData.playing);
          const track = playlistData.find((t) => t.id === currentTrackData.id);
          if (track) {
            setAudioSrc(track.url);
          }
        }
      } catch (error) {
        console.error("Error fetching playlist or current track:", error);
      }
    };

    fetchPlaylistAndCurrentTrack();
    const intervalId = setInterval(fetchPlaylistAndCurrentTrack, 5000);
    return () => clearInterval(intervalId);
  }, [currentTrackId, playing]);

  const handleProgress = () => {
    if (playerRef.current) {
      const time = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      setCurrentTime(time || 0);
      setDuration(duration || 0);
    }
  };

  const updateCurrentTrack = async (trackId, playStatus) => {
    try {
      await fetch("http://localhost:3001/currentTrack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentTrack: { id: trackId, playing: playStatus },
        }),
      });
    } catch (error) {
      console.error("Error updating current track:", error);
    }
  };

  const playNextTrack = async () => {
    let nextTrack;
    if (repeatMode === "playlist") {
      const currentIndex = playlist.findIndex(
        (track) => track.id === currentTrackId
      );
      nextTrack = playlist[(currentIndex + 1) % playlist.length];
    } else {
      const currentIndex = playlist.findIndex(
        (track) => track.id === currentTrackId
      );
      nextTrack = playlist[currentIndex + 1] || playlist[0];
    }

    if (nextTrack) {
      handleRemoveTrack({ stopPropagation: () => {} }, currentTrackId);
      setAudioSrc(nextTrack.url);
      setPlaying(true);
      setCurrentTrackId(nextTrack.id);
      updateCurrentTrack(nextTrack.id, true);
    } else {
      setPlaying(false);
      updateCurrentTrack(currentTrackId, false);
    }
  };

  const playPreviousTrack = () => {
    const currentIndex = playlist.findIndex(
      (track) => track.id === currentTrackId
    );
    const prevTrack =
      playlist[currentIndex - 1] || playlist[playlist.length - 1];
    if (prevTrack) {
      setAudioSrc(prevTrack.url);
      setPlaying(true);
      setCurrentTrackId(prevTrack.id);
      updateCurrentTrack(prevTrack.id, true);
    }
  };

  const playRandomTrack = () => {
    if (playlist.length > 0) {
      let randomTrack;
      do {
        randomTrack = playlist[Math.floor(Math.random() * playlist.length)];
      } while (randomTrack.id === currentTrackId);

      setAudioSrc(randomTrack.url);
      setPlaying(true);
      setCurrentTrackId(randomTrack.id);
      updateCurrentTrack(randomTrack.id, true);
    }
  };

  const togglePlayPause = () => {
    setPlaying((prev) => !prev);
    updateCurrentTrack(currentTrackId, !playing);
  };

  const handleLinkChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleLinkSubmit = async () => {
    if (!ReactPlayer.canPlay(inputValue)) {
      alert(`無法播放此連結\n${inputValue}`);
      setInputValue("");
      return;
    }

    if (inputValue) {
      const newTrack = { id: uuidv4(), url: inputValue }; // Assign UUID to each new track
      const newPlaylist = [...playlist, newTrack];
      setPlaylist(newPlaylist);

      await fetch("http://localhost:3001/playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playlist: newPlaylist }),
      });

      if (playlist.length === 0) {
        setAudioSrc(newTrack.url);
        setPlaying(true);
        setCurrentTrackId(newTrack.id);
        updateCurrentTrack(newTrack.id, true);
      }
      setInputValue("");
    }
  };

  const handleRemoveTrack = async (event, trackId) => {
    event.stopPropagation();

    const updatedPlaylist = playlist.filter((track) => track.id !== trackId);
    setPlaylist(updatedPlaylist);

    if (trackId === currentTrackId) {
      const newCurrentTrack = updatedPlaylist[0] || {};
      setAudioSrc(newCurrentTrack.url || "");
      setCurrentTrackId(newCurrentTrack.id || null);
      updateCurrentTrack(newCurrentTrack.id || null, false);
    }

    await fetch("http://localhost:3001/playlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playlist: updatedPlaylist }),
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div>
      <Head>
        <title>Yeci Playground</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
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
                <h2>共用播放列表 - {playlist.length} 首歌曲</h2>
                {/* <button
                  className={styles.button}
                  style={{ maxWidth: "20vw", width: "100px" }}
                  onClick={() => setPlaylist([])}
                >
                  清空歌單
                </button> */}
              </div>

              <ul>
                {playlist.map((track) => (
                  <li
                    key={track.id}
                    // onClick={() => selectTrack(index)}
                    className={`${styles.trackElement} ${
                      track.id === currentTrackId
                        ? styles.active
                        : styles.inactive
                    }`}
                    style={{
                      color: track.id === currentTrackId ? "#86AB89" : "grey",
                    }}
                  >
                    <>
                      {videoTitles[track.id] &&
                        videoTitles[track.id].thumbnail && (
                          <img
                            src={videoTitles[track.id].thumbnail}
                            alt={videoTitles[track.id].title}
                            className={styles.thumbnail}
                          />
                        )}
                      {track.id === currentTrackId && (
                        <button className={styles.removeButton}>💎</button>
                      )}
                      {/* {track.id === currentTrackId ? (
                        <button className={styles.removeButton}>💎</button>
                      ) : (
                        <button
                          className={styles.removeButton}
                          onClick={(event) => handleRemoveTrack(event, track.id)}
                        >
                          ❌
                        </button>
                      )} */}
                    </>
                    {videoTitles[track.id]
                      ? videoTitles[track.id].title.length > 50
                        ? videoTitles[track.id].title.slice(0, 50) + "..."
                        : videoTitles[track.id].title
                      : "未知歌曲"}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {playing && audioSrc && (
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
                  progressInterval={500} // 每 500 毫秒更新進度
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
                  {videoTitles[currentTrackId]
                    ? videoTitles[currentTrackId].title.length > 50
                      ? videoTitles[currentTrackId].title.slice(0, 50) + "..."
                      : videoTitles[currentTrackId].title
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
                    disabled={true}
                    style={{ "--value": `${timePercentage}%` }}
                  />
                  <div className={styles.timeDisplay}>
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* <div className={styles.controlPanel}>
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
                </div> */}

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
