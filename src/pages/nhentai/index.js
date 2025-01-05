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
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchResult, setSearchResult] = useState([]);
  const [searchResultTotalPage, setSearchResultTotalPage] = useState(1);

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

  const openMangaById = async (id) => {
    setCurrentManga(null);
    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/nhentai/search?method=id&key=${id}`
      ).then((res) => res.json());

      console.log(response);

      setCurrentManga(response);
      setCurrentMangaPage(0);
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchPageChange = async (page) => {
    setSearchResult(["Loading..."]);
    const newPage = Math.max(1, Math.min(page, searchResultTotalPage));
    const response = await fetch(
      `/api/nhentai/search?method=keyWord&key=${inputValue}&page=${newPage}`
    ).then((res) => res.json());

    setSearchResult(response.data);
  };

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
              `/api/nhentai/search?method=keyWord&key=${inputValue}&page=1`
            ).then((res) => res.json())
        : await fetch("/api/nhentai/search?method=random").then((res) =>
            res.json()
          );

      if (response.data.length > 1) {
        setSearchResult(response.data);
        setSearchResults(response);
        setCurrentMangaPage(response.pagination.currentPage - 1 || 0);
        setSearchResultTotalPage(response.pagination.totalPages || 1);
      } else {
        setCurrentManga(response);
        setCurrentMangaPage(0);
      }
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  function renderPaginationButtons(currentPage, totalPages, onPageChange) {
    const maxAdjacentPages = 2;

    const createButton = (page, isActive = false) => (
      <button
        key={page}
        className={isActive ? styles.activePage : styles.pageButton}
        onClick={() => onPageChange(page)}
        disabled={isActive}
      >
        {page}
      </button>
    );

    const createEllipsis = (key) => (
      <span key={key} className={styles.ellipsis}>
        ...
      </span>
    );

    const pageButtons = [];

    if (currentPage !== 1) pageButtons.push(createButton(1));
    else pageButtons.push(createButton(1, true));

    if (currentPage > maxAdjacentPages + 2)
      pageButtons.push(createEllipsis("left-ellipsis"));

    for (
      let i = Math.max(2, currentPage - maxAdjacentPages);
      i < currentPage;
      i++
    )
      pageButtons.push(createButton(i));

    if (currentPage !== 1) pageButtons.push(createButton(currentPage, true));

    for (
      let i = currentPage + 1;
      i <= Math.min(totalPages - 1, currentPage + maxAdjacentPages);
      i++
    )
      pageButtons.push(createButton(i));

    if (currentPage < totalPages - maxAdjacentPages - 1)
      pageButtons.push(createEllipsis("right-ellipsis"));

    if (currentPage !== totalPages) pageButtons.push(createButton(totalPages));

    return <div className={styles.paginationContainer}>{pageButtons}</div>;
  }

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
                {currentManga.originalTitle || currentManga.title}
              </h1>
              <h2 className={styles.mangaId}>#{currentManga.id}</h2>
              {isImageLoading && (
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    color: "#A2A2A2",
                    fontSize: "16px",
                  }}
                >
                  圖片載入中...
                </div>
              )}
              <img
                src={
                  currentManga.images.pages[currentMangaPage] ||
                  currentManga.cover
                }
                alt={currentManga.title}
                style={{
                  display: isImageLoading ? "none" : "block",
                  width: "100%",
                  height: "auto",
                }}
                onLoad={() => setIsImageLoading(false)}
                onError={() => {
                  setIsImageLoading(false);
                  console.error("圖片載入失敗");
                }}
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
            <div className={styles.usersContainer}>
              <ul>
                {users.map((user) => (
                  <li key={user.userId}>{user.userName || user.userId}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {searchResults && searchResult.length > 0 && (
          <div className={styles.searchResults}>
            <div className={styles.searchResultsHeader}>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setSearchResults([]);
                  setSearchResult([]);
                }}
              >
                ✖
              </button>
              <a className={styles.searchTitle}>{inputValue} 的搜尋結果</a>
            </div>
            {searchResult[0] != "Loading..." ? (
              <div className={styles.searchResultsList}>
                {searchResult.map((res, index) => (
                  <div key={index} className={styles.searchResultItem}>
                    <a
                      onClick={() => {
                        setSearchResults([]);
                        setSearchResult([]);
                        openMangaById(res.id);
                      }}
                    >
                      <img
                        src={res.cover}
                        alt={res.id}
                        className={styles.thumbnail}
                      />
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        }}
                      >
                        <span className={styles.mangaTitle}>{res.title}</span>
                        <span className={styles.mangaId}>#{res.id}</span>
                      </div>
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className={styles.searchResultsList}
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100%",
                }}
              >
                <h1>載入中...</h1>
              </div>
            )}

            {console.log(currentMangaPage)}
            <div className={styles.searchResultsFooter}>
              {renderPaginationButtons(
                currentMangaPage + 1,
                searchResultTotalPage,
                (page) => {
                  setCurrentMangaPage(page - 1);
                  handleSearchPageChange(page);
                }
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
