import Head from "next/head";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import styles from "../../public/css/Player.module.css";
import { v4 as uuidv4 } from "uuid";
import ReactPlayer from "react-player";

export default function Player() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { id } = router.query;
  const socketRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playbackState, setPlaybackState] = useState({
    playing: false,
    volume: 0.1,
    progress: 0,
    initialSync: false,
  });
  const playerRef = useRef(null);
  const timePercentage = (currentTime / duration) * 100;

  // Memoize socket connection logic
  const connectWebSocket = useCallback(() => {
    if (!id) {
      const newRoomId = uuidv4();
      router.push(`/player/websocket?id=${newRoomId}`);
    }

    try {
      const ws = new WebSocket(
        "ws://eccd-2001-df2-45c1-18-00-1.ngrok-free.app:4400"
      );

      ws.onopen = () => {
        console.log(`Connected to room ${id}`);
        ws.send(JSON.stringify({ type: "joinRoom", roomId: id }));
        setIsLoading(false);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setIsLoading(false);
      };

      ws.onclose = () => {
        console.log(`Disconnected from room ${id}`);
        setIsLoading(false);
      };

      return ws;
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      setIsLoading(false);
      return null;
    }
  }, [id, router]);

  // Handle different WebSocket message types
  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case "roomState":
        setPlaylist(data.playlist || []);
        setCurrentTrack(data.currentTrack || null);
        setPlaybackState((prev) => ({
          ...prev,
          playing: data.playing || false,
          progress: data.currentTrack?.progress || 0,
        }));
        break;
      case "updatePlaylist":
        setPlaylist(data.playlist || []);
        break;
      case "updateTrack":
        setCurrentTrack(data.currentTrack || null);
        setPlaybackState((prev) => ({
          ...prev,
          playing: data.playing || false,
          progress: data.currentTrack?.progress || 0,
        }));
        break;
    }
  }, []);

  // Establish WebSocket connection
  useEffect(() => {
    if (router.isReady) {
      if (!localStorage.getItem("userId")) {
        const userId = uuidv4();
        localStorage.setItem("userId", userId);
      }
      if (!localStorage.getItem("userName")) {
        const userName = prompt("請輸入你的使用者名稱:");
        if (!userName || userName.length > 16)
          return alert("使用者名稱長度不可超過16個字元");
        localStorage.setItem("userName", userName);
      }
      const ws = connectWebSocket();
      socketRef.current = ws;

      return () => {
        if (ws) ws.close();
      };
    }
  }, [router.isReady, connectWebSocket]);

  // Send message to WebSocket server
  const sendMessage = useCallback((type, payload) => {
    if (socketRef.current && socketRef.current.readyState == WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, ...payload }));
    }
  }, []);

  const handleRemoveTrack = useCallback(async (event, trackId) => {
    event.stopPropagation();
    const updatedPlaylist = playlist.filter((track) => track.id !== trackId);
    setPlaylist(updatedPlaylist);
    sendMessage("updatePlaylist", { playlist: updatedPlaylist });
  });

  // Add new track to playlist
  const handleLinkSubmit = useCallback(async () => {
    if (!inputValue) return;

    try {
      const newTrackData = await fetch(
        `https://noembed.com/embed?dataType=json&url=${inputValue}`
      ).then((res) => res.json());

      const newTrack = {
        id: Date.now().toString(),
        url: inputValue,
        title: newTrackData.title || `Track ${playlist.length + 1}`,
        thumbnail: newTrackData.thumbnail_url || null,
        addedBy:
          localStorage.getItem("userName") ||
          localStorage.getItem("userId").slice(0, 8),
      };

      const updatedPlaylist = [...playlist, newTrack];
      setPlaylist(updatedPlaylist);
      sendMessage("updatePlaylist", { playlist: updatedPlaylist });

      if (playlist.length == 0) {
        setCurrentTrack(newTrack);
        setPlaybackState((prev) => ({ ...prev, playing: true }));
        sendMessage("updateTrack", {
          currentTrack: { ...newTrack, progress: 0 },
          playing: true,
        });
      }

      setInputValue("");
    } catch (error) {
      console.error("Failed to add track:", error);
    }
  }, [inputValue, playlist, sendMessage]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Change current track
  const handleTrackChange = useCallback(
    (trackId) => {
      const track = playlist.find((t) => t.id == trackId);
      if (track) {
        setCurrentTrack(track);
        setPlaybackState((prev) => ({ ...prev, playing: true }));
        sendMessage("updateTrack", {
          currentTrack: { ...track, progress: 0 },
          playing: true,
        });
      }
    },
    [playlist, sendMessage]
  );

  // Toggle play/pause
  const togglePlayPause = useCallback(
    ({ played }) => {
      setPlaybackState((prev) => ({ ...prev, progress: played }));
      const newPlayingState = !playbackState.playing;
      sendMessage("updateTrack", {
        currentTrack: {
          ...currentTrack,
          progress: played || 0,
        },
        playing: newPlayingState,
      });
    },
    [currentTrack, sendMessage, playbackState.playing]
  );

  // Handle playback progress
  const handleProgress = useCallback(
    ({ played }) => {
      setPlaybackState((prev) => ({ ...prev, progress: played }));
      if (playerRef) {
        const time = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        setCurrentTime(time || 0);
        setDuration(duration || 0);
      }

      sendMessage("updateCurrentTrack", {
        currentTrack: {
          id: currentTrack?.id,
          progress: played,
        },
        playing: playbackState.playing,
      });
    },
    [currentTrack, sendMessage, playbackState.playing]
  );

  const playNextTrack = useCallback(() => {
    if (!playlist || playlist.length === 0) return;
    const currentTrackIndex = playlist.findIndex(
      (track) => track.id === currentTrack.id
    );

    let nextTrack = playlist[currentTrackIndex + 1] || playlist[0];

    if (nextTrack) {
      setCurrentTrack(nextTrack);
      setPlaybackState((prev) => ({ ...prev, progress: 0 }));
      sendMessage("updateTrack", {
        currentTrack: { ...firstTrack, progress: 0 },
        playing: true,
      });
    }
  });

  // Render loading state
  if (isLoading) {
    return <div>正在載入房間資訊...</div>;
  }

  return (
    <div>
      <Head>
        <title>網路插座播放器 - 房間 {id}</title>
      </Head>

      <div className={styles.contentContainer}>
        <h1>網路插座播放器 - 房間 {id}</h1>

        <div className={styles.audioControls}>
          <input
            type="text"
            placeholder="在這裡輸入連結"
            value={inputValue}
            className={inputValue ? styles.active : ""}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button className={styles.button} onClick={handleLinkSubmit}>
            添加到歌單
          </button>
        </div>

        <div
          className={styles.audioControls}
          style={{ display: "flex", gap: "10vw", flexDirection: "row" }}
        >
          {playlist?.length > 0 && (
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
              <ul>
                {playlist.map((track) => (
                  <li
                    key={track.id}
                    onClick={() => handleTrackChange(track.id)}
                    className={`${styles.trackElement} ${
                      track.id === currentTrack.id
                        ? styles.active
                        : styles.inactive
                    }`}
                    style={{
                      position: "relative",
                      color: track.id === currentTrack.id ? "#86AB89" : "grey",
                      cursor:
                        track.id === currentTrack.id ? "default" : "pointer",
                    }}
                  >
                    <>
                      {track.id === currentTrack.id ? (
                        <button
                          className={styles.removeButton}
                          style={{ cursor: "default" }}
                        >
                          🎵
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
                    <span className={styles.addedBy}>
                      Added by: {track.addedBy}
                    </span>
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
            </div>
          )}

          {currentTrack && playlist.length > 0 && (
            <div className={styles.playerContainer}>
              <ReactPlayer
                ref={playerRef}
                url={currentTrack.url}
                playing={playbackState.playing}
                volume={playbackState.volume}
                onProgress={handleProgress}
                onEnded={playNextTrack}
                controls={false}
                width="100%"
                height="100%"
                progressInterval={500}
              />
              <div className={styles.trackInfo}>
                {playlist.find((track) => track.id == currentTrack.id)?.title}
              </div>

              <div className={styles.progressContainer}>
                <input
                  className={styles.progressBar}
                  type="range"
                  min={0}
                  max={duration || 0}
                  value={currentTime}
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
                  onClick={togglePlayPause}
                  title={playbackState.playing ? "暫停" : "播放"}
                >
                  {playbackState.playing ? "暫停" : "播放"}
                </button>
              </div>

              <div className={styles.volumeControl}>
                <p>音量：{Math.round(playbackState.volume * 100)}%</p>
                <input
                  className={styles.progressBar}
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={playbackState.volume}
                  onChange={(e) => {
                    setPlaybackState((prev) => ({
                      ...prev,
                      volume: parseFloat(e.target.value),
                    }));
                  }}
                  style={{
                    width: "25%",
                    "--value": `${playbackState.volume * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
