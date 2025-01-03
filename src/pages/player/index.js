import Head from "next/head";
import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import styles from "../../public/css/Player.module.css";
import { v4 as uuidv4 } from "uuid";
import ReactPlayer from "react-player";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

export default function Player() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { id } = router.query;
  const socketRef = useRef(null);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playlist, setPlaylist] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [savedPlaylists, setSavedPlaylists] = useState([]);
  const [immersiveMode, setImmersiveMode] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [playbackState, setPlaybackState] = useState({
    playing: false,
    volume: 0.1,
    progress: 0,
    initialSync: false,
  });
  const playerRef = useRef(null);
  const timePercentage = (currentTime / duration) * 100;

  const getRecommendedTracks = async (trackUrl) => {
    try {
      const response = await fetch(`/api/getInfo?url=${trackUrl}`);
      const recommendation = await response.json();

      // 過濾重複的歌曲
      const uniqueRecommendations = recommendation.filter(
        (track) => !playlist.some((plTrack) => plTrack.id === track.id)
      );

      return uniqueRecommendations;
    } catch (error) {
      console.error("獲取推薦歌曲失敗：", error);
      return [];
    }
  };

  const handleSetAutoPlay = () => {
    const newAutoPlayState = !autoPlay;
    setAutoPlay(newAutoPlayState);
    sendMessage("updateTrack", {
      messageType: "setAutoPlay",
      currentTrack: {
        ...currentTrack,
        progress: currentTrack.progress,
      },
      playing: playbackState.playing,
      autoPlay: newAutoPlayState,
    });
  };

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

  // Memoize socket connection logic
  const connectWebSocket = useCallback(() => {
    if (!id) {
      const newRoomId = uuidv4();
      router.push(`/player?id=${newRoomId}`);
    }

    try {
      const ws = new WebSocket(
        "wss://fa7c-2001-df2-45c1-18-00-1.ngrok-free.app"
      );

      ws.onopen = () => {
        console.log(`Connected to room ${id}`);
        ws.send(
          JSON.stringify({
            type: "joinRoom",
            roomId: id,
            timestamp: new Date().toLocaleTimeString(),
            userName: localStorage.getItem("userName"),
            userId: localStorage.getItem("userId"),
          })
        );
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

  const toggleImmersiveMode = () => {
    setImmersiveMode(!immersiveMode);
  };

  // Send message to WebSocket server
  const sendMessage = useCallback((type, payload) => {
    if (socketRef.current && socketRef.current.readyState == WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type,
          timestamp: new Date().toLocaleTimeString(),
          ...payload,
        })
      );
    }
  }, []);

  // Handle different WebSocket message types
  const handleWebSocketMessage = useCallback(
    (data) => {
      switch (data.type) {
        case "roomState":
          setPlaylist(data.playlist || []);
          setCurrentTrack(data.currentTrack || null);
          setPlaybackState((prev) => ({
            ...prev,
            playing: data.playing || false,
            progress: data.currentTrack?.progress || 0,
          }));
          setUsers(data.users || []);

          // if (
          //   data.playing &&
          //   data.currentTrack &&
          //   data.currentTrack.progress > 0
          // ) {
          //   console.log("Resuming playback...");
          //   const currentTrack = data.currentTrack;
          //   const newProgress = data.currentTrack.progress;
          //   console.log("New progress:", newProgress);
          //   setCurrentTrack(currentTrack);
          //   setPlaybackState((prev) => ({ ...prev, progress: newProgress }));
          //   if (playerRef.current) {
          //     playerRef.current.seekTo(newProgress, "fraction");
          //   }
          // }
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

        case "userJoined":
          setUsers(data.users || []);
          if (data.autoPlay && playlist.length > 0) {
            setPlaybackState((prev) => ({ ...prev, playing: true }));
            sendMessage("updateTrack", { playing: true });
          }
          break;

        case "userLeft":
          setUsers(data.users || []);
          break;

        case "logAction":
          setLogs(data.logs || []);
          break;

        default:
          console.error("Unknown WebSocket message type:", data.type);
      }
    },
    [playlist, sendMessage]
  );

  // 更新播放順序的函數
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    if (result.source.index === result.destination.index) return;

    const reorderedPlaylist = Array.from(playlist);
    const [movedItem] = reorderedPlaylist.splice(result.source.index, 1);
    reorderedPlaylist.splice(result.destination.index, 0, movedItem);

    setPlaylist(reorderedPlaylist);
    sendMessage("updatePlaylist", {
      messageType: "changeTrack",
      movedItem: movedItem.title,
      moveTo: result.destination.index + 1,
      playlist: reorderedPlaylist,
    });
  };

  // 儲存歌單
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

  const handleRemoveTrack = useCallback(async (event, trackId) => {
    event.stopPropagation();
    const trackName = playlist.find((track) => track.id === trackId)?.title;
    const updatedPlaylist = playlist.filter((track) => track.id !== trackId);
    setPlaylist(updatedPlaylist);
    sendMessage("updatePlaylist", {
      messageType: "",
      trackName,
      playlist: updatedPlaylist,
    });
  });

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      let message = messageInput.trim();
      if (message.length > 200) message = message.slice(0, 200);

      sendMessage("messageAction", {
        timestamp: new Date().toLocaleTimeString(),
        message,
      });
      setMessageInput("");
    }
  };

  // 監聽 Enter 鍵
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault(); // 防止換行
      handleSendMessage(); // 發送訊息
    }
  };

  function generateUniqueId(baseId, playlist) {
    let uniqueId = baseId;
    let counter = 1;

    // 检查是否存在相同 ID，如果有则尝试新的 ID
    while (playlist.some((item) => item.id === uniqueId)) {
      uniqueId = `${baseId}${counter}`;
      counter++;
    }

    return uniqueId;
  }

  // Add new track to playlist
  const handleLinkSubmit = useCallback(
    async (trackUrl = inputValue.trim()) => {
      if (!trackUrl) return;
      if (!ReactPlayer.canPlay(trackUrl)) {
        alert(`無法播放此連結\n${trackUrl}`);
        setInputValue("");
        return;
      }

      try {
        if (trackUrl.includes("playlist?")) {
          const response = await fetch(`/api/playlist?url=${trackUrl}`);
          const playlistData = await response.json();

          const newTracks = playlistData.songs.map((item) => {
            const uniqueId = generateUniqueId(item.id, playlist);

            return {
              id: uniqueId,
              url: item.url,
              title: item.title,
              thumbnail: item.thumbnail,
              authorName: item.authorName,
              addedBy:
                localStorage.getItem("userName") ||
                localStorage.getItem("userId").slice(0, 8),
            };
          });

          const updatedPlaylist = [...playlist, ...newTracks];
          setPlaylist(updatedPlaylist);

          sendMessage("updatePlaylist", {
            messageType: "addPlaylist",
            playlistName: playlistData.name,
            playlistLength: playlistData.songs.length,
            playlist: updatedPlaylist,
          });

          if (playlist.length == 0) {
            const firstTrack = newTracks[0];
            setCurrentTrack(firstTrack);
            setPlaybackState((prev) => ({ ...prev, playing: true }));
            sendMessage("updateTrack", {
              messageType: "addTrack",
              currentTrack: { ...firstTrack, progress: 0 },
              playing: true,
            });
          }
        } else {
          const newTrackData = await fetch(
            `https://noembed.com/embed?dataType=json&url=${trackUrl}`
          ).then((res) => res.json());

          const videoId = new URL(trackUrl).searchParams.get("v");

          const newTrack = {
            id: generateUniqueId(videoId, playlist),
            url: trackUrl,
            title: newTrackData.title || `未知曲目 ${playlist.length + 1}`,
            thumbnail: newTrackData.thumbnail_url || null,
            authorName: newTrackData.author_name || null,
            addedBy:
              localStorage.getItem("userName") ||
              localStorage.getItem("userId").slice(0, 8),
          };

          const updatedPlaylist = [...playlist, newTrack];
          setPlaylist(updatedPlaylist);
          sendMessage("updatePlaylist", {
            messageType: "addTrack",
            trackName: newTrack.title,
            playlist: updatedPlaylist,
          });

          if (playlist.length == 0) {
            setCurrentTrack(newTrack);
            setPlaybackState((prev) => ({ ...prev, playing: true }));
            sendMessage("updateTrack", {
              currentTrack: { ...newTrack, progress: 0 },
              playing: true,
            });
          }
        }

        setInputValue("");
      } catch (error) {
        console.error("Failed to add track:", error);
      }
    },
    [inputValue, playlist, sendMessage]
  );

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours > 0 ? `${hours}:` : ""}${
      minutes < 10 && hours > 0 ? `0${minutes}` : minutes
    }:${secs < 10 ? `0${secs}` : secs}`;
  };

  // Change current track
  const handleTrackChange = useCallback(
    (trackId) => {
      const track = playlist.find((t) => t.id == trackId);
      if (track) {
        if (currentTrack && currentTrack.url == track.url)
          playerRef.current.seekTo(0);

        setCurrentTrack(track);
        setPlaybackState((prev) => ({ ...prev, playing: true }));
        sendMessage("updateTrack", {
          messageType: "changeTrack",
          currentTrack: { ...track, progress: 0 },
          playing: true,
        });
      }
    },
    [playlist, sendMessage]
  );

  // Toggle play/pause
  const togglePlayPause = () => {
    const newPlayingState = !playbackState.playing;
    sendMessage("updateTrack", {
      messageType: "pauseTrack",
      currentTrack: {
        ...currentTrack,
        progress: currentTrack.progress,
      },
      playing: newPlayingState,
    });
  };

  // Handle playback progress
  const handleProgress = () => {
    if (playerRef.current) {
      const time = playerRef.current.getCurrentTime();
      const duration = playerRef.current.getDuration();
      setCurrentTime(time || 0);
      setDuration(duration || 0);
    }

    if (playbackState.playing && currentTrack) {
      const newProgress = currentTime;
      setPlaybackState((prev) => ({ ...prev, progress: newProgress }));

      // sendMessage("updateCurrentTrack", {
      //   currentTrack: { ...currentTrack, progress: newProgress },
      //   playing: true,
      // });
    }
  };

  const playNextTrack = useCallback(async () => {
    if (!playlist || playlist.length === 0) return;

    const currentTrackIndex = playlist.findIndex(
      (track) => track.id === currentTrack.id
    );

    if (currentTrackIndex === playlist.length - 1 && autoPlay) {
      const recommendedTracks = await getRecommendedTracks(currentTrack.url);
      if (recommendedTracks.length > 0) {
        const newTracks = recommendedTracks.map((track) => ({
          ...track,
          addedBy: "系統推薦",
        }));
        const updatedPlaylist = [...playlist, ...newTracks];
        setPlaylist(updatedPlaylist);

        sendMessage("updatePlaylist", {
          messageType: "addPlaylist",
          playlistName: "推薦歌曲",
          playlistLength: newTracks.length,
          playlist: updatedPlaylist,
        });

        const nextTrack = newTracks[0];
        setCurrentTrack(nextTrack);
        setPlaybackState((prev) => ({ ...prev, progress: 0 }));
        sendMessage("updateTrack", {
          currentTrack: { ...nextTrack, progress: 0 },
          playing: true,
        });
      } else {
        console.error("無法獲取推薦歌曲");
      }
    } else {
      const nextTrack = playlist[(currentTrackIndex + 1) % playlist.length];
      if (nextTrack) {
        if (currentTrack && currentTrack.url == nextTrack.url)
          playerRef.current.seekTo(0);

        setCurrentTrack(nextTrack);
        setPlaybackState((prev) => ({ ...prev, progress: 0 }));
        sendMessage("updateTrack", {
          currentTrack: { ...nextTrack, progress: 0 },
          playing: true,
        });
      }
    }
  }, [playlist, currentTrack, autoPlay, getRecommendedTracks, sendMessage]);

  const shufflePlaylist = () => {
    const shuffledPlaylist = [...playlist].sort(() => Math.random() - 0.5);
    setPlaylist(shuffledPlaylist);
    sendMessage("updatePlaylist", {
      messageType: "shufflePlaylist",
      playlist: shuffledPlaylist,
    });
  };

  const loadSavedPlaylist = (playlistId) => {
    try {
      // 取得保存的播放清單
      const savedPlaylists = JSON.parse(
        localStorage.getItem("savedPlaylists") || "[]"
      );
      const selectedPlaylist = savedPlaylists.find(
        (pl) => pl.id === playlistId
      );

      if (!selectedPlaylist) {
        alert(`播放清單 ID: ${playlistId} 未找到！`);
        return;
      }

      if (!selectedPlaylist.tracks || selectedPlaylist.tracks.length === 0) {
        alert(`播放清單 "${selectedPlaylist.name}" 沒有歌曲！`);
        return;
      }

      const handleInsertPlaylist = (newTracks) => {
        const updatedPlaylist = [...playlist, ...newTracks];
        setPlaylist(updatedPlaylist);
        sendMessage("updatePlaylist", {
          messageType: "addPlaylist",
          playlistName: selectedPlaylist.name,
          playlistLength: selectedPlaylist.tracks.length,
          playlist: updatedPlaylist,
        });
      };

      if (playlist.length == 0) {
        // 當前播放清單為空，直接載入
        const firstTrack = selectedPlaylist.tracks[0];
        setCurrentTrack(firstTrack);
        setPlaybackState((prev) => ({ ...prev, playing: true }));
        setPlaylist(selectedPlaylist.tracks);
        sendMessage("updateTrack", {
          messageType: "addTrack",
          currentTrack: { ...firstTrack, progress: 0 },
          playing: true,
        });
        sendMessage("updatePlaylist", {
          messageType: "addPlaylist",
          playlistName: selectedPlaylist.name,
          playlistLength: selectedPlaylist.tracks.length,
          playlist: selectedPlaylist.tracks,
        });
      } else {
        // 當前播放清單非空，要求確認插入
        const confirmed = confirm("當前播放清單將新增此播放清單，是否繼續？");
        if (confirmed) handleInsertPlaylist(selectedPlaylist.tracks);
      }
    } catch (error) {
      console.error("載入播放清單時發生錯誤:", error);
      alert("載入播放清單失敗，請稍後重試！");
    }
  };

  const handleSearch = async () => {
    if (!inputValue.trim() || isSearching || cooldown > 0) return;

    // if input is a URL, use handleLinkSubmit
    if (ReactPlayer.canPlay(inputValue)) {
      handleLinkSubmit();
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/search?keyword=${encodeURIComponent(inputValue)}`
      );
      const data = await response.json();
      setSearchResults(data || []);
    } catch (error) {
      console.error("搜尋失敗：", error);
      alert("搜尋失敗，請稍後再試！");
    } finally {
      setIsSearching(false);
      startCooldown(2);
    }
  };

  const startCooldown = (seconds) => {
    setCooldown(seconds);
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearPlaylist = () => {
    const confirmed = window.confirm("確定要清空播放清單嗎？");
    if (confirmed) {
      setPlaylist([]);
      setCurrentTrack(null);
      setPlaybackState((prev) => ({ ...prev, playing: false }));
      sendMessage("updatePlaylist", {
        messageType: "clearPlaylist",
        playlist: [],
      });
    }
  };

  // Render loading state
  if (isLoading) {
    return <div>正在載入房間資訊...</div>;
  }

  return (
    <div>
      <Head>
        <title>網路插座播放器</title>
      </Head>

      <div
        className={`${styles.contentContainer} ${
          immersiveMode ? styles.immersive : ""
        }`}
      >
        {!immersiveMode && (
          <>
            <h1 />
            <div
              className={styles.audioControls}
              style={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                marginBottom: "1rem",
              }}
            >
              <input
                type="text"
                placeholder="在這裡輸入名字或連結"
                value={inputValue}
                className={inputValue ? styles.active : ""}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !(cooldown > 0 || isSearching)) {
                    handleSearch();
                  }
                }}
              />
              <button
                className={styles.button}
                onClick={handleSearch}
                disabled={cooldown > 0 || isSearching}
              >
                {isSearching ? (
                  <span className={styles.searching}>搜尋中...</span>
                ) : cooldown > 0 ? (
                  `冷卻中 (${cooldown})`
                ) : (
                  "搜尋"
                )}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                <div className={styles.searchResultsHeader}>
                  <button
                    className={styles.closeButton}
                    onClick={() => setSearchResults([])}
                  >
                    ✖
                  </button>
                </div>
                <div className={styles.searchResultsList}>
                  {searchResults.map((track, index) => (
                    <div key={index} className={styles.searchResultItem}>
                      <img
                        src={track.thumbnail}
                        alt={track.title}
                        className={styles.thumbnail}
                      />
                      <span className={styles.trackTitle}>{track.title}</span>
                      <div className={styles.trackActions}>
                        <button
                          onClick={() => handleLinkSubmit(track.url)}
                          className={styles.button}
                          style={{
                            outlineColor: "#86AB89",
                            color: "#86AB89",
                          }}
                        >
                          添加
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* 中間部分 */}
        <div
          className={styles.audioControls}
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            width: "90vw",
            height: "75vh",
          }}
        >
          {!immersiveMode && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                minWidth: 400 /* 固定寬度 */,
                maxWidth: "30vw" /* 固定寬度 */,
              }}
            >
              {/* 歌單 */}
              {playlist?.length > 0 && !immersiveMode && (
                <div className={styles.playlistContainer}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <h1
                      style={{
                        paddingTop: "0",
                      }}
                    >
                      共用播放列表-{playlist.length}首歌曲
                    </h1>
                    <button
                      className={styles.button}
                      onClick={savePlaylist}
                      title="儲存當前播放清單"
                      style={{
                        outlineColor: "#89A8B2",
                        color: "#89A8B2",
                      }}
                    >
                      儲存清單
                    </button>
                    <button
                      className={styles.button}
                      style={{
                        outlineColor: "#F95454",
                        color: "#F95454",
                        height: "min-content",
                      }}
                      onClick={clearPlaylist}
                    >
                      清空歌單
                    </button>
                  </div>
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="playlist">
                      {(provided) => (
                        <ul
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          style={{ listStyleType: "none", padding: 0 }}
                        >
                          {playlist.map((track, index) => (
                            <Draggable
                              key={track.id}
                              draggableId={track.id}
                              index={index}
                            >
                              {(provided) => (
                                <li
                                  key={track.id}
                                  onClick={() => handleTrackChange(track.id)}
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`${styles.trackElement} ${
                                    track.id === currentTrack.id
                                      ? styles.active
                                      : styles.inactive
                                  }`}
                                  style={{
                                    ...provided.draggableProps.style,
                                    position: "relative",
                                    color:
                                      track.id === currentTrack.id
                                        ? "#86AB89"
                                        : "grey",
                                    cursor:
                                      track.id === currentTrack.id
                                        ? "default"
                                        : "pointer",
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
                                  <span>{track.title}</span>

                                  <span className={styles.addedBy}>
                                    <span
                                      style={{
                                        fontSize: "0.8rem",
                                        color: "grey",
                                      }}
                                    >
                                      {track.authorName
                                        ? `${track.authorName}`
                                        : ""}
                                    </span>{" "}
                                    ▪︎ {track.addedBy}
                                  </span>
                                </li>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </ul>
                      )}
                    </Droppable>
                  </DragDropContext>
                </div>
              )}

              {/* 日誌 */}
              {logs.length > 0 && !immersiveMode && (
                <div className={styles.loggerContainer}>
                  <a>房間日誌</a>
                  <ul
                    style={{
                      listStyleType: "none",
                      padding: 0,
                      flex: 1,
                      overflowY: "hidden",
                    }}
                  >
                    {logs
                      .slice(0)
                      .reverse()
                      // .filter((_, index) => index < 5)
                      .map((log, index) => (
                        <li key={index}>
                          <span className={styles.logTime}>
                            {log.timestamp}
                          </span>{" "}
                          <span className={styles.logMessage}>
                            {log.message}
                          </span>
                        </li>
                      ))}
                  </ul>
                  <input
                    type="text"
                    placeholder="在這裡輸入訊息"
                    className={styles.messageInput}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                </div>
              )}
            </div>
          )}

          {((currentTrack && playlist.length > 0) ||
            savedPlaylists.length > 0) && (
            <div
              style={
                immersiveMode
                  ? {
                      display: "flex",
                      flexDirection: "column",
                      width: "100vw",
                    }
                  : {
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 600,
                    }
              }
            >
              {/* 播放器 */}
              {currentTrack && playlist.length > 0 && (
                <div
                  className={`${styles.playerContainer} ${
                    immersiveMode ? styles.huge : ""
                  }`}
                  style={immersiveMode ? { display: "block" } : {}}
                >
                  <div
                    style={{
                      flex: 1,
                      position: "relative",
                      height: immersiveMode ? "100%" : "auto",
                      width: !immersiveMode && "100%",
                      maxWidth: !immersiveMode && "1000px",
                      paddingTop: !immersiveMode && "12%", // 16:9
                      aspectRatio: !immersiveMode && "16 / 9",
                    }}
                  >
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
                  </div>

                  <div className={styles.trackInfo}>
                    {immersiveMode &&
                      `#${
                        playlist.findIndex(
                          (track) => track.id == currentTrack?.id
                        ) + 1
                      } - `}
                    {
                      playlist.find((track) => track.id == currentTrack?.id)
                        ?.title
                    }
                  </div>

                  <div className={styles.progressContainer}>
                    <div className={styles.timeDisplay}>
                      {immersiveMode ? (
                        <span>
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                      ) : (
                        <>
                          <span>{formatTime(currentTime)}</span>
                          <span>{formatTime(duration)}</span>
                        </>
                      )}
                    </div>
                    <input
                      className={styles.progressBar}
                      type="range"
                      min={0}
                      max={duration || 0}
                      value={currentTime}
                      disabled={true}
                      style={{ "--value": `${timePercentage}%` }}
                    />
                  </div>

                  <div className={styles.controlPanel}>
                    <button
                      className={styles.button}
                      onClick={toggleImmersiveMode}
                      style={{
                        outlineColor: "#89A8B2",
                        color: "#89A8B2",
                      }}
                    >
                      {immersiveMode ? "返回" : "放大"}
                    </button>
                    {!immersiveMode && (
                      <>
                        <button
                          className={styles.button}
                          onClick={handleSetAutoPlay}
                          title="自動播放"
                          style={
                            autoPlay
                              ? {
                                  color: "#86AB89",
                                }
                              : {
                                  outlineColor: "grey",
                                  color: "grey",
                                }
                          }
                        >
                          自動播放
                        </button>
                        <button
                          className={styles.button}
                          onClick={shufflePlaylist}
                          title="隨機播放清單"
                        >
                          隨機播放清單
                        </button>

                        <button
                          className={styles.button}
                          onClick={togglePlayPause}
                          title={playbackState.playing ? "暫停" : "播放"}
                        >
                          {playbackState.playing ? "暫停" : "播放"}
                        </button>
                        <button
                          className={styles.button}
                          onClick={playNextTrack}
                          title="播放下一首"
                        >
                          下一首
                        </button>
                      </>
                    )}
                  </div>

                  <div className={styles.volumeControl}>
                    <p>
                      {!immersiveMode ? "音量：" : ""}
                      {Math.round(playbackState.volume * 100)}%
                    </p>
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

              {/* 儲存的播放清單 */}
              {savedPlaylists.length > 0 && !immersiveMode && (
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
          )}
        </div>

        <div className={styles.infoContainer}>
          {users.length > 0 && (
            <>
              <div className={styles.usersContainer}>
                <ul>
                  {users.map((user) => (
                    <li key={user.userId}>{user.userName || user.userId}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
