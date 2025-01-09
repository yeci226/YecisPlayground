import { useEffect, useState, useRef, useCallback } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { v4 as uuidv4 } from "uuid";
import styles from "../../public/css/nhentai.module.css";
const websocketHost = "wss://fa7c-2001-df2-45c1-18-00-1.ngrok-free.app";

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
  const [watchHistory, setWatchHistory] = useState([]);
  const [mousePositions, setMousePositions] = useState({});

  useEffect(() => {
    if (currentManga) {
      const existingHistory = watchHistory || [];

      const isAlreadyInHistory = existingHistory.some(
        (item) => item.id === currentManga.id
      );

      if (!isAlreadyInHistory) {
        const updatedHistory = [
          {
            id: currentManga.id,
            title: currentManga.title,
            cover: currentManga.cover,
            date: new Date().toISOString(),
          },
          ...existingHistory,
        ];

        if (updatedHistory.length > 20) updatedHistory.pop();

        setWatchHistory(updatedHistory);
        updateWatchHistory(updatedHistory); // 使用新的方法同步
      }
    }
  }, [currentManga]);

  function timeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = [
      { label: "年", seconds: 31536000 },
      { label: "月", seconds: 2592000 },
      { label: "週", seconds: 604800 },
      { label: "天", seconds: 86400 },
      { label: "小時", seconds: 3600 },
      { label: "分鐘", seconds: 60 },
      { label: "秒", seconds: 1 },
    ];

    for (const interval of intervals) {
      const count = Math.floor(seconds / interval.seconds);
      if (count > 0) {
        return `${count} ${interval.label}前`;
      }
    }
    return "剛剛";
  }

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

    const watchHistory = JSON.parse(localStorage.getItem("watchHistory")) || [];
    setWatchHistory(watchHistory);
  }, []);

  useEffect(() => {
    const handleMouseMove = (event) => {
      const mouseData = {
        type: "mouseMove",
        userId: localStorage.getItem("userId"),
        x: (event.clientX / window.innerWidth) * 100,
        y: (event.clientY / window.innerHeight) * 100,
      };

      sendMessage("mouseMove", mouseData);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const connectWebSocket = useCallback(() => {
    if (!id) {
      const newRoomId = uuidv4();
      router.push(`/nhentai?id=${newRoomId}`);
      return null;
    }

    try {
      const ws = new WebSocket(websocketHost);

      ws.onopen = () => {
        console.log(`Connected to room ${id}`);
        ws.send(
          JSON.stringify({
            type: "njoinRoom",
            roomId: id,
            userName: localStorage.getItem("userName"),
            userId: localStorage.getItem("userId"),
          })
        );
        setIsLoading(false);
      };

      socket.onclose = () => {
        console.log("Connection lost. Reconnecting...");
        setTimeout(() => {
          // Attempt to reconnect
          connectWebSocket();
        }, 1000);
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

      socketRef.current = ws;

      return ws;
    } catch (error) {
      console.error("WebSocket connection failed:", error);
      setIsLoading(false);
      return null;
    }
  }, [id, router]);

  const updateWatchHistory = (newHistory) => {
    setWatchHistory(newHistory);

    sendMessage("updateWatchHistory", {
      watchHistory: newHistory,
    });
  };

  const sendMessage = useCallback((type, payload) => {
    if (socketRef.current && socketRef.current.readyState == WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type,
          ...payload,
        })
      );
    }
  }, []);

  const handleWebSocketMessage = useCallback((data) => {
    switch (data.type) {
      case "updateWatchHistory":
        setWatchHistory(data.watchHistory);
        break;

      case "updateCurrentManga":
        if (data.manga && currentManga?.id !== data.manga.id) {
          const updatedManga = replaceMangaImage(data.manga);
          setCurrentManga(updatedManga);
          setCurrentMangaPage(data.page || 0);
        }
        break;

      case "updateMousePosition":
        const { userId, userName, x, y } = data;

        const pixelX = (x / 100) * window.innerWidth;
        const pixelY = (y / 100) * window.innerHeight;

        if (userId !== localStorage.getItem("userId"))
          setMousePositions((prev) => ({
            ...prev,
            [userId]: { userName, x: pixelX, y: pixelY },
          }));
        break;
      case "roomState":
        setUsers(data.users);
        setMousePositions(data.mousePositions);

        if (data.manga && currentManga?.id !== data.manga.id) {
          const updatedManga = replaceMangaImage(data.manga);
          setCurrentManga(updatedManga);
          setCurrentMangaPage(data.page || 0);
        }

        if (data.watchHistory) setWatchHistory(data.watchHistory);

        break;
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

      const updatedManga = replaceMangaImage(response);
      setCurrentManga(updatedManga);
      setCurrentMangaPage(0);

      sendMessage("updateCurrentManga", {
        manga: updatedManga,
      });
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const removeHistoryItem = (id) => {
    const updatedHistory = watchHistory.filter((item) => item.id !== id);
    setWatchHistory(updatedHistory);
    localStorage.setItem("watchHistory", JSON.stringify(updatedHistory));
    updateWatchHistory(updatedHistory);
  };

  const handleSearchPageChange = async (page) => {
    setSearchResult(["Loading..."]);
    const newPage = Math.max(1, Math.min(page, searchResultTotalPage));
    const response = await fetch(
      `/api/nhentai/search?method=keyWord&key=${inputValue}&page=${newPage}`
    ).then((res) => res.json());

    setSearchResult(response.data);
  };

  const handleSearchByKeyword = async (keyword) => {
    setInputValue(keyword);
    await handleSearch(keyword);
  };

  const handleSearch = async (keyword) => {
    setCurrentManga(null);
    setIsSearching(true);

    try {
      const searchKeyword = keyword || inputValue;
      console.log(keyword, inputValue);
      console.log(searchKeyword);

      let response;
      if (searchKeyword) {
        if (/^\d+$/.test(searchKeyword)) {
          response = await fetch(
            `/api/nhentai/search?method=id&key=${searchKeyword}`
          ).then((res) => res.json());
        } else {
          response = await fetch(
            `/api/nhentai/search?method=keyWord&key=${searchKeyword}&page=1`
          ).then((res) => res.json());
        }
      } else {
        response = await fetch("/api/nhentai/search?method=random").then(
          (res) => res.json()
        );
      }

      if (response?.data?.length > 1) {
        setSearchResult(response.data);
        setSearchResults(response);
        setCurrentMangaPage(response.pagination?.currentPage - 1 || 0);
        setSearchResultTotalPage(response.pagination?.totalPages || 1);
      } else {
        const updatedManga = replaceMangaImage(response);
        setCurrentManga(updatedManga);
        setCurrentMangaPage(0);

        sendMessage("updateCurrentManga", {
          manga: updatedManga,
        });
      }
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const replaceMangaImage = (manga) => {
    if (!manga || !manga.images || !manga.images.pages) {
      console.error("Invalid manga data.");
      return manga;
    }

    const regex =
      /https:\/\/i\.nhentai\.net\/galleries\/(\d+)\/(\d+)\.(jpg|png|webp)/;

    const replacedPages = manga.images.pages.map((url) => {
      const match = url.match(regex);
      if (!match) return url;

      const galleryId = match[1];
      const imageNumber = match[2];
      const extension = match[3];

      return extension === "jpg"
        ? `https://i2.nhentai.net/galleries/${galleryId}/${imageNumber}.jpg`
        : `https://i4.nhentai.net/galleries/${galleryId}/${imageNumber}.webp`;
    });

    return {
      ...manga,
      images: {
        ...manga.images,
        pages: replacedPages,
      },
    };
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

      <div
        className={styles.contentContainer}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <div className="mouseContainer">
          {Object.entries(mousePositions || []).map(
            ([userId, { userName, x, y }]) => (
              <div
                key={userId}
                className="mousePointer"
                style={{
                  position: "absolute",
                  left: `${x}px`,
                  top: `${y}px`,
                  pointerEvents: "none",
                  transform: "translate(-50%, -50%)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  zIndex: 9999,
                }}
              >
                🖱️ {/* 鼠标图标 */}
                <span
                  className="userName"
                  style={{ color: "#fff", fontSize: "12px" }}
                >
                  {userName}
                </span>
              </div>
            )
          )}
        </div>

        <div className={styles.parentContainer}>
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
              <button
                onClick={() => handleSearch(inputValue)}
                className={styles.button}
              >
                {inputValue ? "搜尋" : "隨機"}
              </button>
              {isSearching && (
                <span className={styles.searching}>搜尋中...</span>
              )}
            </div>

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                flexDirection: "column",
                flexWrap: "wrap",
              }}
            >
              {currentManga && (
                <>
                  <a
                    href={currentManga.url}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      textDecoration: "none",
                      display: "flex",
                    }}
                  >
                    <span className={styles.mangaId}>
                      #{currentManga.id} {currentManga.images.pages.length}頁
                    </span>
                  </a>
                  <div className={styles.tagsContainer}>
                    作者{" "}
                    {currentManga.artists.map((artist, index) => (
                      <span
                        onClick={() => handleSearchByKeyword(`${artist}`)}
                        key={index}
                        className={styles.tags}
                      >
                        {artist}
                      </span>
                    ))}
                  </div>
                  <div className={styles.tagsContainer}>
                    作品{" "}
                    {currentManga.parodies.map((parody, index) => (
                      <span
                        onClick={() => handleSearchByKeyword(`${parody}`)}
                        key={index}
                        className={styles.tags}
                      >
                        {parody}
                      </span>
                    ))}
                  </div>
                  <div className={styles.tagsContainer}>
                    角色{" "}
                    {currentManga.characters.map((character, index) => (
                      <span
                        onClick={() => handleSearchByKeyword(`${character}`)}
                        key={index}
                        className={styles.tags}
                      >
                        {character}
                      </span>
                    ))}
                  </div>
                  <div className={styles.tagsContainer}>
                    標籤{" "}
                    {currentManga.tags.map((tag, index) => (
                      <span
                        onClick={() => handleSearchByKeyword(`${tag}`)}
                        key={index}
                        className={styles.tags}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <div className={styles.tagsContainer}>
                    群組{" "}
                    {currentManga.groups.map((group, index) => (
                      <span
                        onClick={() => handleSearchByKeyword(`${group}`)}
                        key={index}
                        className={styles.tags}
                      >
                        {group}
                      </span>
                    ))}
                  </div>
                  <div className={styles.tagsContainer}>
                    語言{" "}
                    {currentManga.languages.map((language, index) => (
                      <span
                        onClick={() => handleSearchByKeyword(`${language}`)}
                        key={index}
                        className={styles.tags}
                      >
                        {language}
                      </span>
                    ))}
                  </div>
                </>
              )}
              <div className={styles.watchHistoryContainer}>
                <ul>
                  {watchHistory.map((item) => (
                    <li
                      key={item.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "0.5rem",
                        borderTop: "1px solid #A2A2A2",
                      }}
                    >
                      <span
                        onClick={() => openMangaById(item.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                        }}
                      >
                        <img
                          src={item.cover}
                          alt={item.title}
                          style={{
                            maxWidth: "4rem",
                            height: "auto",
                            marginRight: "0.5rem",
                            borderRadius: "5px",
                          }}
                        />
                        <span className={styles.mangaTitle}>{item.title}</span>
                        <span
                          style={{
                            color: "#A2A2A2",
                            flexShrink: 0,
                            whiteSpace: "nowarp",
                            fontSize: "12px",
                          }}
                        >
                          {timeAgo(new Date(item.date))}
                        </span>
                      </span>
                      <button
                        onClick={() => removeHistoryItem(item.id)}
                        className={styles.closeButton}
                      >
                        ✖
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {currentManga && (
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
                  currentManga.images.pages[currentMangaPage].replace(
                    /https:\/\/i\.nhentai\.net\/galleries\/(\d+)\/(\d+)\.(jpg|png|webp)/,
                    "https://i4.nhentai.net/galleries/$1/$2.webp"
                  ) || currentManga.cover
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
          )}
        </div>

        {currentManga && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div className={styles.mangaPageContainer}>
              <button
                onClick={() => {
                  setCurrentMangaPage(
                    (currentMangaPage - 1 + currentManga.images.pages.length) %
                      currentManga.images.pages.length
                  );

                  sendMessage("updateCurrentManga", {
                    manga: currentManga,
                    page:
                      (currentMangaPage -
                        1 +
                        currentManga.images.pages.length) %
                      currentManga.images,
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowLeft") {
                    setCurrentMangaPage(
                      (currentMangaPage -
                        1 +
                        currentManga.images.pages.length) %
                        currentManga.images.pages.length
                    );

                    sendMessage("updateCurrentManga", {
                      manga: currentManga,
                      page:
                        (currentMangaPage -
                          1 +
                          currentManga.images.pages.length) %
                        currentManga.images,
                    });
                  }
                }}
                tabIndex={0}
                className={styles.button}
              >
                上一頁
              </button>
              <button
                onClick={() => {
                  setCurrentMangaPage(
                    (currentMangaPage + 1) % currentManga.images.pages.length
                  );

                  sendMessage("updateCurrentManga", {
                    manga: currentManga,
                    page:
                      (currentMangaPage + 1) % currentManga.images.pages.length,
                  });
                }}
                onKeyDown={(event) => {
                  if (event.key === "ArrowRight") {
                    setCurrentMangaPage(
                      (currentMangaPage + 1) % currentManga.images.pages.length
                    );

                    sendMessage("updateCurrentManga", {
                      manga: currentManga,
                      page:
                        (currentMangaPage + 1) %
                        currentManga.images.pages.length,
                    });
                  }
                }}
                tabIndex={0}
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
                      <a
                        onClick={() => {
                          setCurrentMangaPage(index);
                          sendMessage("updateCurrentManga", {
                            manga: currentManga,
                            page: index,
                          });
                        }}
                      >
                        <img
                          src={page.replace(
                            /https:\/\/i\.nhentai\.net\/galleries\/(\d+)\/(\d+)\.(jpg|png|webp)/,
                            "https://i4.nhentai.net/galleries/$1/$2.webp"
                          )}
                          alt={`Page ${index + 1}`}
                        />
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
