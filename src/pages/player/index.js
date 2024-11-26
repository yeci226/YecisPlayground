import Head from "next/head";
import { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";
import styles from "../../public/css/Player.module.css";
import { v4 as uuidv4 } from "uuid";
import { useRouter } from "next/router";
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

export default function Player() {
  const router = useRouter();
  const { id } = router.query;
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
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [repeatMode, setRepeatMode] = useState("none");
  const [userCount, setUserCount] = useState(0);
  const timePercentage = (currentTime / duration) * 100;
  const volumePercentage = volume * 100;
  const text =
    userCount > 1 ? `在線人數 ${userCount} 人` : "Let's play some music";

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate((prev) => !prev);
    }, text.length * 150);

    return () => clearInterval(interval);
  }, [text.length]);

  useEffect(() => {
    if (id) {
      const fetchRoomData = async () => {
        const response = await fetch(`/api/room/${id}`);
        const data = await response.json();
        setPlaylist(data.playlist);
        if (data.currentTrack.id) {
          setCurrentTrackId(data.currentTrack.id);
          setAudioSrc(
            data.playlist.find((track) => track.id === data.currentTrack.id)
              ?.url
          );
          setPlaying(data.currentTrack.playing);
        }
        setRepeatMode(data.repeatMode);
      };
      fetchRoomData();
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const userId = localStorage.getItem("userId") || uuidv4();
    localStorage.setItem("userId", userId);

    const joinRoom = async () => {
      await fetch(`/api/room/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
    };

    joinRoom();

    return () => {
      const leaveRoom = async () => {
        await fetch(`/api/room/${id}/leave`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
      };
      leaveRoom();
    };
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const fetchPlaylistAndCurrentTrack = async () => {
      try {
        const response = await fetch(`/api/room/${id}`);
        const { playlist, currentTrack } = await response.json();

        setPlaylist(playlist);

        if (
          currentTrack.id !== currentTrackId ||
          currentTrack.playing !== playing
        ) {
          setCurrentTrackId(currentTrack.id);
          setPlaying(currentTrack.playing);
          const track = playlist.find((t) => t.id === currentTrack.id);
          if (track) {
            setAudioSrc(track.url);
          }
        }
      } catch (error) {
        console.error("Error fetching playlist or current track:", error);
      }
    };

    fetchPlaylistAndCurrentTrack();
    const intervalId = setInterval(fetchPlaylistAndCurrentTrack, 3000);
    return () => clearInterval(intervalId);
  }, [currentTrackId, playing]);

  const updateUserCount = async () => {
    const response = await fetch(`/api/room/${id}`);
    const data = await response.json();
    setUserCount(data.users.length);
  };

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(updateUserCount, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const selectTrack = (index) => {
    if (index < 0 || index >= playlist.length) {
      console.error("Invalid track index:", index);
      return;
    }

    const track = playlist[index];
    if (track) {
      setAudioSrc(track.url);
      setPlaying(true);
      setCurrentTrackId(track.id);
      updateCurrentTrack(track.id, true);
    }
  };

  const handleProgress = () => {
    if (playerRef.current) {
      const time = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      setCurrentTime(time || 0);
      setDuration(duration || 0);
    }
  };

  const updateCurrentTrack = async (trackId, playStatus) => {
    await fetch(`/api/room/${router.query.id}/currentTrack`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentTrack: { id: trackId, playing: playStatus },
        repeatMode,
      }),
    });
  };

  const playNextTrack = async () => {
    let nextTrack;
    const currentIndex = playlist.findIndex(
      (track) => track.id === currentTrackId
    );

    if (repeatMode === "playlist") {
      nextTrack = playlist[(currentIndex + 1) % playlist.length];
    } else {
      nextTrack = playlist[currentIndex + 1] || playlist[0];
    }

    if (nextTrack) {
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

    if (id) {
      const roomResponse = await fetch(`/api/room/${id}`);
      if (roomResponse.ok) {
        const newTrack = { id: uuidv4(), url: inputValue };
        const newPlaylist = [...playlist, newTrack];
        setPlaylist(newPlaylist);

        await fetch(`/api/room/${id}/playlist`, {
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
      } else {
        const response = await fetch("/api/createRoom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        router.replace(`/player?id=${data.roomId}`);
      }
    } else {
      const response = await fetch("/api/createRoom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // 如果 API 需要主體，可以傳遞一個空對象
      });
      const data = await response.json();
      router.replace(`/player?id=${data.roomId}`);
    }

    setInputValue("");
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

    await fetch(`/api/room/${id}/playlist`, {
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
        <title>野茨遊樂場 - 播放器</title>
        <link rel="icon" href={favicon.src} />
        <meta property="og:title" content="野茨遊樂場 - 播放器" />
        <meta property="og:site_name" content="野茨遊樂場 - 播放器" />
        <meta
          property="og:description"
          content="加入房間，與朋友共享音樂播放列表🎶"
        />
      </Head>

      <div className={styles.contentContainer}>
        <h1 className={!audioSrc ? styles.contentLower : ""}>
          {text.split("").map((char, index) => (
            <span
              key={index}
              className={`${styles.jump} ${animate ? styles.animate : ""}`}
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
            className={inputValue ? styles.active : ""}
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
                    onClick={() => selectTrack(playlist.indexOf(track))}
                    className={`${styles.trackElement} ${
                      track.id === currentTrackId
                        ? styles.active
                        : styles.inactive
                    }`}
                    style={{
                      color: track.id === currentTrackId ? "#86AB89" : "grey",
                      cursor:
                        track.id === currentTrackId ? "default" : "pointer",
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
                      {track.id === currentTrackId ? (
                        <button
                          className={styles.removeButton}
                          style={{ cursor: "default" }}
                        >
                          💎
                        </button>
                      ) : (
                        <button
                          className={styles.removeButton}
                          onClick={(event) =>
                            handleRemoveTrack(event, track.id)
                          }
                        >
                          ❌
                        </button>
                      )}
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
                  onEnded={playNextTrack}
                  progressInterval={500}
                />

                <div className={styles.trackInfo}>
                  {"正在播放".split("").map((char, index) => (
                    <span
                      key={index}
                      className={`${styles.jump} ${
                        animate ? styles.animate : ""
                      }`}
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

                <div className={styles.controlPanel}>
                  <button
                    className={styles.button}
                    onClick={playRandomTrack}
                    title="隨機播放"
                  >
                    隨機播放
                  </button>
                  <button
                    className={styles.button}
                    onClick={playPreviousTrack}
                    title="播放上一首"
                  >
                    上一首
                  </button>
                  <button
                    className={styles.button}
                    onClick={togglePlayPause}
                    title={playing ? "暫停" : "播放"}
                  >
                    {playing ? "暫停" : "播放"}
                  </button>
                  <button
                    className={styles.button}
                    onClick={playNextTrack}
                    title="播放下一首"
                  >
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
                    title="循環模式"
                  >
                    {(repeatMode === "none" || !repeatMode) && (
                      <span>關閉循環</span>
                    )}
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
