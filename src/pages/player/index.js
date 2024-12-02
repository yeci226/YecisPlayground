import Head from "next/head";
import { useEffect, useState, useRef, useCallback } from "react";
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
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.1);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackId, setCurrentTrackId] = useState(null);
  const [repeatMode, setRepeatMode] = useState("playlist");
  const [userCount, setUserCount] = useState(0);
  const [savedPlaylists, setSavedPlaylists] = useState([]);

  const timePercentage = (currentTime / duration) * 100;
  const volumePercentage = volume * 100;
  const text =
    userCount > 1 ? `在線人數${userCount}人` : "我們一起播放音樂吧！";

  useEffect(() => {
    const handleError = (event) => {
      console.error("未捕獲的錯誤:", event.error);
    };

    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimate((prev) => !prev);
    }, text.length * 150);

    return () => clearInterval(interval);
  }, [text.length]);

  useEffect(() => {
    if (!id) return;

    const syncRoomState = async () => {
      console.log("同步房間狀態");
      try {
        const response = await fetch(`/api/room/${id}`);
        const roomData = await response.json();
        if (!roomData) return;

        const { playlist, currentTrack, repeatMode } = roomData;

        // 同步播放列表
        setPlaylist(playlist);

        // 同步播放進度
        const syncPlaybackProgress = () => {
          const timeDiff = (Date.now() - currentTrack.lastUpdatedAt) / 1000;
          const serverCurrentTime = currentTrack.currentTime + timeDiff;
          const currentPlayerTime = playerRef.current.getCurrentTime();

          if (Math.abs(serverCurrentTime - currentPlayerTime) > 2) {
            playerRef.current.seekTo(serverCurrentTime);
          }
        };

        if (currentTrack.id !== currentTrackId) {
          const track = playlist.find((t) => t.id === currentTrack.id);
          if (track) {
            setAudioSrc(track.url);
            setCurrentTrackId(currentTrack.id);
            setPlaying(currentTrack.playing);
          }
        }

        if (playing) syncPlaybackProgress();

        // 同步循環模式
        setRepeatMode(repeatMode || "none");
      } catch (error) {
        console.error("同步房間狀態失敗:", error);
      }
    };

    // 初始同步
    syncRoomState();

    // 增加同步間隔到10秒
    const intervalId = setInterval(syncRoomState, 10000);

    return () => clearInterval(intervalId);
  }, [id, currentTrackId, playing]);

  useEffect(() => {
    if (!id) return;
    const userId = localStorage.getItem("userId");
    if (!userId) {
      const newUserId = uuidv4();
      localStorage.setItem("userId", newUserId);
    }

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
    if (!data) return;
    setUserCount(data.users?.length);
  };

  useEffect(() => {
    if (!id) return;
    const interval = setInterval(updateUserCount, 5000);
    return () => clearInterval(interval);
  }, [id]);

  const handleProgress = () => {
    if (playerRef.current) {
      const time = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      setCurrentTime(time || 0);
      setDuration(duration || 0);
    }
  };

  const updateCurrentTrack = useCallback(
    async (trackId, playStatus, resetTime = false) => {
      try {
        const currentTime =
          resetTime || !playerRef.current
            ? 0
            : playerRef.current.getCurrentTime();

        const response = await fetch(`/api/room/${id}/currentTrack`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentTrack: {
              id: trackId,
              playing: playStatus,
              currentTime: currentTime,
            },
            repeatMode,
          }),
        });

        if (!response.ok) {
          throw new Error("無法更新當前歌曲");
        }
      } catch (error) {
        console.error("更新當前曲目失敗:", error);
      }
    },
    [id, repeatMode]
  );

  const updatePlaylist = (newPlaylist) => {
    setPlaylist(newPlaylist);
  };

  const Playlist = ({
    playlist,
    currentTrackId,
    selectTrack,
    handleRemoveTrack,
    updatePlaylist,
  }) => {
    const handleDragStart = (event, index) => {
      event.dataTransfer.setData("trackIndex", index);
    };

    const handleDragOver = (event) => {
      event.preventDefault(); // 必須阻止預設行為，否則無法觸發 drop
    };

    const handleDrop = (event, dropIndex) => {
      const draggedIndex = parseInt(
        event.dataTransfer.getData("trackIndex"),
        10
      );

      // 如果拖拽目標和落下目標相同，則不執行任何操作
      if (draggedIndex === dropIndex) return;

      const updatedPlaylist = [...playlist];
      const [draggedTrack] = updatedPlaylist.splice(draggedIndex, 1); // 移除拖動項
      updatedPlaylist.splice(dropIndex, 0, draggedTrack); // 插入到新的位置

      updatePlaylist(updatedPlaylist); // 更新播放清單
    };

    return (
      <ul>
        {playlist.map((track, index) => (
          <li
            key={track.id}
            draggable // 啟用拖放
            onDragStart={(event) => handleDragStart(event, index)}
            onDragOver={handleDragOver}
            onDrop={(event) => handleDrop(event, index)}
            onClick={() => selectTrack(index)}
            className={`${styles.trackElement} ${
              track.id === currentTrackId ? styles.active : styles.inactive
            }`}
            style={{
              position: "relative",
              color: track.id === currentTrackId ? "#86AB89" : "grey",
              cursor: track.id === currentTrackId ? "default" : "pointer",
            }}
          >
            <>
              {track.id === currentTrackId ? (
                <button
                  className={styles.removeButton}
                  style={{ cursor: "default" }}
                >
                  🎵
                </button>
              ) : (
                <button
                  className={styles.removeButton}
                  onClick={(event) => handleRemoveTrack(event, track.id)}
                >
                  ❌
                </button>
              )}
            </>
            {track.thumbnail && (
              <img
                src={track.thumbnail}
                alt={track.title}
                className={styles.thumbnail}
              />
            )}
            <span
              style={{
                marginRight: "5px",
                overflow: "hidden",
              }}
            >
              {track.title}
            </span>
            <span className={styles.addedBy}>Added by: {track.addedBy}</span>
            <span
              className={styles.dragHandle}
              style={{
                cursor: "grab",
                userSelect: "none",
                color: "grey",
                fontSize: "1.2rem",
                marginLeft: "auto",
              }}
            >
              ⋮
            </span>
          </li>
        ))}
      </ul>
    );
  };

  const selectTrack = useCallback(
    (index) => {
      if (index < 0 || index >= playlist.length) {
        console.error("無效的音軌索引:", index);
        return;
      }

      const track = playlist[index];
      if (track) {
        setAudioSrc(track.url);
        setPlaying(true);
        setCurrentTrackId(track.id);
        updateCurrentTrack(track.id, true, true);

        // 如果音軌相同，則重置播放進度
        if (track.url === audioSrc) playerRef.current.seekTo(0);

        console.log(`已切換至音軌: ${track.title}`);
      }
    },
    [playlist, updateCurrentTrack, playerRef]
  );

  const savePlaylist = () => {
    try {
      const playlistName = prompt("請輸入播放清單名稱:");
      if (!playlistName) return;
      if (playlistName.length > 16) {
        alert("播放清單名稱不得超過16個字元");
        return;
      }

      const savedList = {
        id: uuidv4(),
        name: playlistName,
        tracks: playlist,
        createdAt: new Date().toISOString(),
        addedBy:
          localStorage.getItem("userName") ||
          localStorage.getItem("userId").slice(0, 8),
      };

      const existingPlaylists = JSON.parse(
        localStorage.getItem("savedPlaylists") || "[]"
      );
      const updatedPlaylists = [...existingPlaylists, savedList];

      localStorage.setItem("savedPlaylists", JSON.stringify(updatedPlaylists));
      setSavedPlaylists(updatedPlaylists);
      alert(`播放清單 "${playlistName}" 已儲存`);
    } catch (error) {
      console.error("儲存播放清單時發生錯誤:", error);
      alert("儲存播放清單失敗");
    }
  };

  useEffect(() => {
    const storedPlaylists = localStorage.getItem("savedPlaylists");
    if (storedPlaylists) {
      setSavedPlaylists(JSON.parse(storedPlaylists));
    }
  }, []);

  const deleteSavedPlaylist = (playlistId) => {
    try {
      const confirmed = window.confirm("確定要刪除這個播放清單嗎？");
      if (confirmed) {
        const updatedPlaylists = savedPlaylists.filter(
          (pl) => pl.id !== playlistId
        );
        localStorage.setItem(
          "savedPlaylists",
          JSON.stringify(updatedPlaylists)
        );
        setSavedPlaylists(updatedPlaylists);
      }
    } catch (error) {
      console.error("刪除播放清單時發生錯誤:", error);
      alert("刪除播放清單失敗");
    }
  };

  const loadSavedPlaylist = (playlistId) => {
    try {
      const savedPlaylist = savedPlaylists.find((pl) => pl.id === playlistId);
      if (!savedPlaylist) return;

      const initializePlayback = (tracks) => {
        if (!currentTrackId && tracks.length > 0) {
          const firstTrack = tracks[0];
          setAudioSrc(firstTrack.url);
          setCurrentTrackId(firstTrack.id);
          setPlaying(true);
        }
        updateCurrentTrack(tracks[0]?.id, true);
      };

      const handleDuplicateTracks = (newTracks, currentTracks) => {
        return newTracks.map((track) => {
          const isDuplicate = currentTracks.some((t) => t.id === track.id);
          if (isDuplicate) {
            return { ...track, id: uuidv4() };
          }
          return track;
        });
      };

      if (savedPlaylist.tracks.length === 0) {
        setPlaylist(savedPlaylist.tracks);
        initializePlayback(savedPlaylist.tracks);
        return;
      }

      const confirmed = window.confirm(
        "是否要插入這個播放清單到當前播放清單？"
      );

      if (confirmed) {
        const uniqueTracks = handleDuplicateTracks(
          savedPlaylist.tracks,
          playlist
        );
        const newPlaylist = [...playlist, ...uniqueTracks];
        setPlaylist(newPlaylist);
        initializePlayback(newPlaylist);
      }
    } catch (error) {
      console.error("載入播放清單時發生錯誤:", error);
      alert("載入播放清單失敗");
    }
  };

  const toggleRepeatMode = async () => {
    const newMode =
      repeatMode === "none"
        ? "single"
        : repeatMode === "single"
        ? "playlist"
        : "none";

    setRepeatMode(newMode);

    try {
      // 立即更新房間的重複模式
      await fetch(`/api/room/${id}/repeatMode`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repeatMode: newMode }),
      });
    } catch (error) {
      console.error("同步循環模式失敗:", error);
    }
  };

  const playNextTrack = async () => {
    if (playlist.length === 0) return;

    const currentIndex = playlist.findIndex(
      (track) => track.id === currentTrackId
    );

    let nextTrack;
    if (repeatMode === "single") {
      nextTrack = playlist[currentIndex];
    } else if (repeatMode === "playlist") {
      nextTrack = playlist[(currentIndex + 1) % playlist.length];
    } else {
      nextTrack = playlist[currentIndex + 1] || null;
    }

    if (nextTrack) {
      setAudioSrc(nextTrack.url);
      setPlaying(true);
      setCurrentTrackId(nextTrack.id);

      await updateCurrentTrack(nextTrack.id, true, true);
    } else {
      setPlaying(false);
      await updateCurrentTrack(currentTrackId, false);
    }
  };

  const playPreviousTrack = async () => {
    if (playlist.length === 0) return;

    const currentIndex = playlist.findIndex(
      (track) => track.id === currentTrackId
    );

    let prevTrack;
    if (repeatMode === "single") {
      prevTrack = playlist[currentIndex];
    } else if (repeatMode === "playlist") {
      prevTrack =
        currentIndex - 1 >= 0
          ? playlist[currentIndex - 1]
          : playlist[playlist.length - 1];
    } else {
      prevTrack = currentIndex - 1 >= 0 ? playlist[currentIndex - 1] : null;
    }

    if (prevTrack) {
      setAudioSrc(prevTrack.url);
      setPlaying(true);
      setCurrentTrackId(prevTrack.id);

      await updateCurrentTrack(prevTrack.id, true, true);
    }
  };

  const playRandomTrack = async () => {
    if (playlist.length > 0) {
      let randomTrack;
      do {
        randomTrack = playlist[Math.floor(Math.random() * playlist.length)];
      } while (randomTrack.id === currentTrackId);

      setAudioSrc(randomTrack.url);
      setPlaying(true);
      setCurrentTrackId(randomTrack.id);
      await updateCurrentTrack(randomTrack.id, true);
    }
  };

  const togglePlayPause = async () => {
    const newPlayingStatus = !playing;
    setPlaying(newPlayingStatus);
    await updateCurrentTrack(currentTrackId, newPlayingStatus);
  };

  const handleLinkChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleLinkSubmit = useCallback(async () => {
    if (!ReactPlayer.canPlay(inputValue)) {
      alert(`無法播放此連結\n${inputValue}`);
      setInputValue("");
      return;
    }

    if (localStorage.getItem("userName") === null) {
      const userName = prompt("請輸入你的使用者名稱:");
      if (userName) localStorage.setItem("userName", userName);
    }

    try {
      if (id) {
        const roomResponse = await fetch(`/api/room/${id}`);
        const newTrackData = await fetch(
          `https://noembed.com/embed?dataType=json&url=${inputValue}`
        ).then((res) => res.json());
        const newTrackTitle = newTrackData.title || "未知歌曲";
        const newTrackThumbnail = newTrackData.thumbnail_url || null;
        const newTrack = {
          id: uuidv4(),
          url: inputValue,
          title: newTrackTitle,
          thumbnail: newTrackThumbnail,
          addedBy:
            localStorage.getItem("userName") ||
            localStorage.getItem("userId").slice(0, 8),
        };

        if (roomResponse.ok) {
          const newPlaylist = [...playlist, newTrack];
          setPlaylist(newPlaylist);

          await fetch(`/api/room/${id}/playlist`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playlist: newPlaylist }),
          });

          if (playlist.length == 0) {
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
          if (data.roomId) router.replace(`/player?id=${data.roomId}`);
        }
      } else {
        const response = await fetch("/api/createRoom", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        if (data.roomId) router.replace(`/player?id=${data.roomId}`);
      }
    } catch (error) {
      console.error("添加歌曲失敗:", error);
      alert("添加歌曲時發生錯誤");
    }

    setInputValue("");
  }, [id, inputValue, playlist, router, updateCurrentTrack]);

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
          {audioSrc && playlist?.length > 0 && (
            <div className={styles.playlistContainer}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  padding: "0 10px 0 10px",
                }}
              >
                <h1
                  style={{
                    paddingTop: "0",
                    fontSize: "calc(0.8rem + 0.6vw)",
                  }}
                >
                  共用播放列表-{playlist.length}首歌曲
                </h1>
                <button
                  className={styles.button}
                  style={{
                    outlineColor: "#F95454",
                    color: "#F95454",
                    height: "min-content",
                  }}
                  onClick={() => setPlaylist([])}
                >
                  清空歌單
                </button>
              </div>
              <span
                style={{
                  fontSize: "calc(0.5rem + 0.4vw)",
                  margin: "0 10px 0 10px",
                  color: "##868686",
                }}
              >
                可以拖移來更改播放順序
              </span>

              <Playlist
                playlist={playlist}
                currentTrackId={currentTrackId}
                selectTrack={selectTrack}
                handleRemoveTrack={handleRemoveTrack}
                updatePlaylist={updatePlaylist}
              />
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
                  {"正在播放：".split("").map((char, index) => (
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
                  {playlist.find((track) => track.id === currentTrackId)?.title
                    .length > 50
                    ? playlist
                        .find((track) => track.id === currentTrackId)
                        ?.title.slice(0, 50) + "..."
                    : playlist.find((track) => track.id === currentTrackId)
                        ?.title}
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

                {audioSrc && playlist?.length > 0 && (
                  <div className={styles.controlPanel}>
                    <button
                      className={styles.button}
                      onClick={savePlaylist}
                      title="儲存當前播放清單"
                    >
                      儲存清單
                    </button>
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
                      onClick={toggleRepeatMode}
                      title="循環模式"
                    >
                      {repeatMode === "none" && <span>關閉循環</span>}
                      {repeatMode === "single" && <span>單曲循環</span>}
                      {repeatMode === "playlist" && <span>歌單循環</span>}
                    </button>
                  </div>
                )}

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

        {savedPlaylists.length > 0 && (
          <div className={styles.savedPlaylistsContainer}>
            <a>已儲存的播放清單 (點擊以載入)</a>
            {savedPlaylists.map((pl) => (
              <div key={pl.id} className={styles.savedPlaylistItem}>
                <span
                  className={styles.button}
                  onClick={() => loadSavedPlaylist(pl.id)}
                >
                  {pl.name} - {pl.tracks.length}首單曲 (建立於:{" "}
                  {new Date(pl.createdAt).toLocaleString()})
                </span>
                <button
                  className={styles.button}
                  style={{ outlineColor: "#F95454", color: "#F95454" }}
                  onClick={() => deleteSavedPlaylist(pl.id)}
                >
                  刪除
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
