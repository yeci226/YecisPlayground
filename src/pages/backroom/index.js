import { useEffect, useState, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import styles from "../../public/css/Backroom.module.css";
const websocketHost = "ws://localhost:4400";

// Avatar options
const AVATAR_OPTIONS = [
  { id: "default", name: "無" },
  { id: "blueHat", name: "藍帽", icon: "🧢" },
  { id: "topHat", name: "高禮帽", icon: "🎩" },
  { id: "bachelorHat", name: "學士帽", icon: "🎓" },
  { id: "sunHat", name: "遮陽帽", icon: "👒" },
  { id: "crown", name: "皇冠", icon: "👑" },
  { id: "pin", name: "圖釘", icon: "📌" },
  { id: "ninjaHeadband", name: "忍者頭巾", icon: "🥷" },
  { id: "helmet", name: "頭盔", icon: "⛑️" },
  { id: "manget", name: "磁鐵", icon: "🧲" },
  { id: "fire", name: "火", icon: "🔥" },
  { id: "pirateHat", name: "海盜帽", icon: "🏴‍☠️" },
  { id: "lighting", name: "閃電", icon: "🌩️" },
  { id: "beret", name: "貝雷帽", icon: "🎨" },
  { id: "winterCap", name: "毛線帽", icon: "❄️" },
  { id: "rainbow", name: "彩虹", icon: "🌈" },
  { id: "nurseHat", name: "護士帽", icon: "💉" },
  { id: "constructionHat", name: "安全帽", icon: "🚧" },
  { id: "vikingHelmet", name: "維京頭盔", icon: "⚔️" },
  { id: "flowerCrown", name: "花冠", icon: "🌸" },
  { id: "catEars", name: "貓耳朵", icon: "🐱" },
  { id: "archeryTarget", name: "箭靶", icon: "🎯" },
  { id: "pumpkin", name: "南瓜", icon: "🎃" },
];

// 地圖邊界
const MAP_BOUNDS = {
  x: { min: -2500, max: 2500 },
  y: { min: -2500, max: 2500 },
};

export default function Home() {
  const [players, setPlayers] = useState({});
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // 視角偏移量
  const [ws, setWs] = useState(null);
  const [joinLeaveMessages, setJoinLeaveMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [playerMessages, setPlayerMessages] = useState({});
  const [keysPressed, setKeysPressed] = useState({});
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [selectedColor, setSelectedColor] = useState("#ffffff");
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
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

    const storedAvatar = localStorage.getItem("userAvatar");
    if (!storedAvatar) {
      setAvatarModalOpen(true);
    } else {
      setSelectedAvatar(JSON.parse(storedAvatar));
    }

    const socket = new WebSocket(websocketHost);

    socket.onopen = () => {
      console.log("Connected to WebSocket server");
      setWs(socket);

      // 設定玩家位置
      setOffset({
        x: -position.x * 20 + window.innerWidth / 2,
        y: -position.y * 20 + window.innerHeight / 2,
      });

      // 玩家加入
      socket.send(
        JSON.stringify({
          type: "gameAction",
          action: "playerJoin",
          payload: {
            playerId: localStorage.getItem("userId"),
            playerName: localStorage.getItem("userName"),
            avatar: selectedAvatar || AVATAR_OPTIONS[0],
          },
        })
      );
    };

    socket.onclose = () => {
      console.log("Connection lost. Reconnecting...");
      setTimeout(() => {
        // Attempt to reconnect
        setWs(new WebSocket(websocketHost));
      }, 1000);
    };
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.type === "roomState") {
        setPlayers(
          message.users.reduce((acc, user) => {
            acc[user.userId] = { playerName: user.userName };
            return acc;
          }, {})
        );
      }

      if (message.type === "logAction") {
        const logMessage = message.logs[message.logs.length - 1]?.message;
        if (logMessage) {
          addJoinLeaveMessage(logMessage);
        }
      }

      if (message.type === "updatePlayers") {
        if (message.log) {
          addJoinLeaveMessage(message.log);
        }
        setPlayers(message.players);
      }

      if (message.type === "playerMessage") {
        const { playerId, message: playerMessage } = message;

        setPlayerMessages((prev) => ({
          ...prev,
          [playerId]: playerMessage,
        }));

        // 設置定時器清除訊息
        setTimeout(() => {
          setPlayerMessages((prev) => {
            const updatedMessages = { ...prev };
            delete updatedMessages[playerId];
            return updatedMessages;
          });
        }, 3000); // 3 秒後清除消息
      }
    };

    return () => {
      socket.close();
    };
  }, []);

  useEffect(() => {
    const movePlayer = () => {
      let newX = position.x;
      let newY = position.y;

      if (keysPressed["w"]) newY -= 0.25;
      if (keysPressed["s"]) newY += 0.25;
      if (keysPressed["a"]) newX -= 0.25;
      if (keysPressed["d"]) newX += 0.25;

      // 檢查地圖邊界
      if (newX < MAP_BOUNDS.x.min) newX = MAP_BOUNDS.x.min;
      if (newX > MAP_BOUNDS.x.max) newX = MAP_BOUNDS.x.max;
      if (newY < MAP_BOUNDS.y.min) newY = MAP_BOUNDS.y.min;
      if (newY > MAP_BOUNDS.y.max) newY = MAP_BOUNDS.y.max;

      if (newX !== position.x || newY !== position.y) {
        setPosition({ x: newX, y: newY });

        setOffset({
          x: -newX * 20 + window.innerWidth / 2,
          y: -newY * 20 + window.innerHeight / 2,
        });

        if (ws) {
          ws.send(
            JSON.stringify({
              type: "gameAction",
              action: "move",
              payload: {
                playerId: localStorage.getItem("userId"),
                position: { x: newX, y: newY },
              },
            })
          );
        }
      }
    };

    const interval = setInterval(movePlayer, 16); // 每 16 毫秒更新一次（約 60fps）

    return () => clearInterval(interval);
  }, [keysPressed, position, ws]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        if (inputRef.current) inputRef.current.focus();
      }

      if (isInputFocused) return;

      setKeysPressed((prev) => ({ ...prev, [e.key]: true }));
    };

    const handleKeyUp = (e) => {
      if (isInputFocused) return;

      setKeysPressed((prev) => {
        const updated = { ...prev };
        delete updated[e.key];
        return updated;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isInputFocused]);

  const handleInputFocus = () => {
    setIsInputFocused(true);
  };

  const handleInputBlur = () => {
    setIsInputFocused(false);
  };

  const selectAvatar = (avatar) => {
    const updatedAvatar = { ...avatar, color: selectedColor };
    setSelectedAvatar(updatedAvatar);
    localStorage.setItem("userAvatar", JSON.stringify(updatedAvatar));
    setAvatarModalOpen(false);

    if (ws) {
      ws.send(
        JSON.stringify({
          type: "gameAction",
          action: "updateAvatar",
          payload: {
            playerId: localStorage.getItem("userId"),
            avatar: updatedAvatar,
          },
        })
      );
    }
  };

  const sendMessage = () => {
    if (message.trim() === "" || !ws) return;

    ws.send(
      JSON.stringify({
        type: "gameAction",
        action: "sendMessage",
        payload: {
          playerId: localStorage.getItem("userId"),
          message,
        },
      })
    );

    setMessage(""); // 清空輸入框

    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const addJoinLeaveMessage = (message) => {
    setJoinLeaveMessages((prev) => [...prev, message]);

    setTimeout(() => {
      setJoinLeaveMessages((prev) => prev.slice(1)); // 移除最早的訊息
    }, 3000); // 3 秒後自動移除
  };

  return (
    <>
      <div
        tabIndex={0}
        style={{
          width: "100vw",
          height: "100vh",
          position: "relative",
          outline: "none",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            position: "absolute",
            bottom: "10px",
            left: "10px",
          }}
        >
          <button
            onClick={() => setAvatarModalOpen(true)}
            style={{
              borderRadius: "5px",
              padding: "0",
              margin: "0",
              border: "none",
              backgroundColor: "var(--fallback-bg)",
              color: "var(--fallback-bc)",
              cursor: "pointer",
              boxShadow: "0 0 5px var(--fallback-bg)",
              userSelect: "none",
              fontFamily: '"YinPing", YinPing-JP, sans-serif',
            }}
          >
            角色造型
          </button>
          <span style={{ color: "var(--fallback-bc)", userSelect: "none" }}>
            {position.x.toFixed(2)}, {position.y.toFixed(2)}
          </span>
        </div>
        {avatarModalOpen && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.7)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 1000,
            }}
          >
            <div
              style={{
                backgroundColor: "var(--fallback-bg)",
                padding: "20px",
                borderRadius: "10px",
                textAlign: "center",
                boxShadow: "0 0 10px var(--fallback-bc)",
              }}
            >
              <span
                style={{
                  fontSize: "20px",
                  color: "var(--fallback-bc)",
                  display: "block",
                  marginBottom: "20px",
                  userSelect: "none",
                }}
              >
                你的角色造型
              </span>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  justifyContent: "center",
                  marginTop: "20px",
                  flexWrap: "wrap",
                  margin: "10px -5px",
                }}
              >
                <div style={{ marginTop: "20px" }}>
                  <label
                    style={{
                      fontSize: "16px",
                      color: "var(--fallback-bc)",
                      marginRight: "10px",
                    }}
                  >
                    顏色：
                  </label>
                  <input
                    type="color"
                    value={selectedColor}
                    onChange={(e) => setSelectedColor(e.target.value)}
                    style={{
                      cursor: "pointer",
                      backgroundColor: "transparent",
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: "10px",
                  }}
                >
                  {AVATAR_OPTIONS.map((avatar) => (
                    <button
                      key={avatar.id}
                      onClick={() => selectAvatar(avatar)}
                      style={{
                        boxShadow: "0 0 5px var(--fallback-bc)",
                        backgroundColor: "var(--fallback-bg)",
                        color: "var(--fallback-bc)",
                        border: "none",
                        padding: "10px",
                        borderRadius: "5px",
                        cursor: "pointer",
                        fontFamily: '"YinPing", YinPing-JP, sans-serif',
                      }}
                    >
                      {avatar.icon || avatar.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => {
                    selectAvatar({ ...selectedAvatar, color: selectedColor });
                  }}
                  style={{
                    width: "fit-content",
                    marginTop: "10px",
                    padding: "10px 20px",
                    borderRadius: "5px",
                    border: "none",
                    backgroundColor: "var(--fallback-bg)",
                    boxShadow: "0 0 5px var(--fallback-bc)",
                    color: "#fff",
                    cursor: "pointer",
                    fontFamily: '"YinPing", YinPing-JP, sans-serif',
                  }}
                >
                  確認
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            width: `${MAP_BOUNDS.x.max - MAP_BOUNDS.x.min}px`, // 地圖的寬度
            height: `${MAP_BOUNDS.y.max - MAP_BOUNDS.y.min}px`, // 地圖的高度
            position: "absolute",
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: "transform 0.1s linear",
          }}
        >
          {Object.entries(players).map(
            ([id, { playerName, position, avatar }]) => (
              <div
                key={id}
                style={{
                  position: "absolute",
                  top: `${50 + position.y * 20}px`,
                  left: `${50 + position.x * 20}px`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "column",
                  userSelect: "none",
                }}
              >
                {playerMessages[id] && (
                  <div
                    style={{
                      minWidth: "max-content",
                      overflow: "hidden",
                      marginBottom: "10px",
                      padding: "5px 10px",
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                      borderRadius: "5px",
                      fontSize: "12px",
                      position: "absolute",
                      top: "-30px",
                      zIndex: 999,
                    }}
                  >
                    {playerMessages[id]}
                  </div>
                )}

                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    backgroundColor: avatar?.color || "gray",
                    borderRadius: "50%",
                  }}
                >
                  {avatar?.icon && (
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        position: "absolute",
                        padding: "0",
                        margin: "0 0 0 -4px",
                        top: "-25px",
                        fontSize: "28px",
                        textAlign: "center",
                        width: "100%",
                      }}
                    >
                      {avatar.icon}
                    </div>
                  )}
                </div>
                <span
                  style={{
                    marginTop: "5px",
                    fontSize: "12px",
                    color: "var(--fallback-bc)",
                  }}
                >
                  {playerName}
                </span>
              </div>
            )
          )}
        </div>

        <div
          style={{
            position: "absolute",
            bottom: "10px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "10px",
            userSelect: "none",
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            placeholder="輸入訊息"
            className={styles.messageInput}
          />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: "50px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "300px",
          textAlign: "center",
          userSelect: "none",
          zIndex: "1000",
        }}
      >
        {joinLeaveMessages.map((msg, index) => (
          <div key={index} className={styles.joinLeaveMessage}>
            {msg}
          </div>
        ))}
      </div>
    </>
  );
}
