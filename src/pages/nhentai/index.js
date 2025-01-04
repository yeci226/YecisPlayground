import { useEffect, useState, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";
import styles from "../../public/css/nhentai.module.css";

export default function Nhentai() {
  const router = useRouter();
  const { id } = router.query;
  const socketRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const [currentManga, setCurrentManga] = useState(null);
  const [currentMangaPage, setCurrentMangaPage] = useState(0);

  const initializeUser = useCallback(() => {
    if (!localStorage.getItem("userId")) {
      localStorage.setItem("userId", uuidv4());
    }

    if (!localStorage.getItem("userName")) {
      let userName = "";
      while (!userName || userName.length > 16) {
        userName = prompt("請輸入你的使用者名稱 (16字以內):");
        if (!userName) alert("使用者名稱不可為空");
        else if (userName.length > 16) alert("使用者名稱長度不可超過16個字元");
      }
      localStorage.setItem("userName", userName);
    }
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!id) {
      const newRoomId = uuidv4();
      router.push(`/nhentai?id=${newRoomId}`);
      return null;
    }

    try {
      const ws = new WebSocket(
        "wss://fa7c-2001-df2-45c1-18-00-1.ngrok-free.app"
      );

      ws.onopen = () => {
        console.log(`Connected to room ${id}`);
        ws.send(
          JSON.stringify({
            type: "njoinRoom",
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

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      default:
        console.error("Unknown WebSocket message type:", data.type);
    }
  }, []);

  useEffect(() => {
    if (!router.isReady) return;

    initializeUser();

    const ws = connectWebSocket();
    socketRef.current = ws;

    return () => {
      if (ws) ws.close();
    };
  }, [router.isReady, connectWebSocket, initializeUser]);

  const handleSearch = async () => {
    setCurrentManga(null);
    setIsSearching(true);
    try {
      const response = inputValue
        ? inputValue.match(/^\d+$/)
          ? await fetch(`/api/nhentai/search?method=id&key=${inputValue}`).then(
              (res) => res.json()
            )
          : await fetch(
              `/api/nhentai/search?method=keyWord&key=${inputValue}`
            ).then((res) => res.json())
        : await fetch("/api/nhentai/search?method=random").then((res) =>
            res.json()
          );

      setCurrentManga(response);
      setCurrentMangaPage(0);
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return <div>正在載入房間資訊...</div>;
  }

  return (
    <div>
      <Head>
        <title>野茨遊樂場 - nHentai</title>
      </Head>

      <div className={styles.contentContainer}>
        <div className={styles.infoContainer}>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <input
              type="text"
              placeholder="輸入ID或關鍵字"
              className={styles.input}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
            <button onClick={handleSearch} className={styles.button}>
              {inputValue ? "搜尋" : "隨機"}
            </button>
            {isSearching && <span className={styles.searching}>搜尋中...</span>}
          </div>
        </div>

        {currentManga && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div className={styles.mangaContainer}>
              <h1 className={styles.mangaTitle}>
                {currentManga.originalTitle}
              </h1>
              <h2 className={styles.mangaId}>#{currentManga.id}</h2>
              <img
                src={
                  currentManga.images.pages[currentMangaPage] ||
                  currentManga.cover
                }
                alt={currentManga.title}
              />
            </div>
            <div className={styles.mangaPageContainer}>
              <button
                onClick={() =>
                  setCurrentMangaPage(
                    (currentMangaPage - 1 + currentManga.images.pages.length) %
                      currentManga.images.pages.length
                  )
                }
                className={styles.button}
              >
                上一頁
              </button>
              <button
                onClick={() =>
                  setCurrentMangaPage(
                    (currentMangaPage + 1) % currentManga.images.pages.length
                  )
                }
                className={styles.button}
              >
                下一頁
              </button>
            </div>

            <div className={styles.mangaPageListContainer}>
              <ul>
                {currentManga.images.pages.map((page, index) => (
                  <li key={index} className={styles.mangaPageItem}>
                    <div className={styles.imageWrapper}>
                      <a onClick={() => setCurrentMangaPage(index)}>
                        <img src={page} alt={`Page ${index + 1}`} />
                        <span
                          className={styles.pageNumber}
                          style={{
                            color:
                              currentMangaPage === index
                                ? "#86ab89"
                                : "#A2A2A2",
                            fontWeight:
                              currentMangaPage === index ? "bold" : "normal",
                          }}
                        >
                          {index + 1}
                        </span>
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

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
