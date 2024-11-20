import React, { useState } from "react";
import Head from "next/head";
import styles from "../../public/css/Hsr.module.css";
import { Copy } from "lucide-react";

export default function Hsr() {
  const [response, setResponse] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [selectedType, setSelectedType] = useState("character");
  const [selectedRecords, setSelectedRecords] = useState(null);
  const [selectedRecordsData, setSelectedRecordsData] = useState(null);
  const [selectedRecordsIndex, setSelectedRecordsIndex] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        `Start-Process powershell -Verb runAs -ArgumentList '-NoExit -Command "Invoke-Expression  (New-Object Net.WebClient).DownloadString(\\"https://raw.githubusercontent.com/yeci226/HSR/main/getwarps.ps1\\")"'`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // 2秒後重置
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const importLog = async () => {
    const logUrl = document.getElementById("logUrl").value;
    if (!logUrl) return setMessage("請輸入連結！");
    setMessage(null);
    setLoading(true);
    setResponse(null);
    setSelectedRecords(null);
    setSelectedRecordsData(null);
    setSelectedRecordsIndex(null);

    try {
      const res = await fetch(`https://36.50.249.18:6600/api/hsr/warp-log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ logUrl }),
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setResponse(data); // 將完整響應數據設置為狀態
      setShowTitle(false); // 匯入完成後隱藏標題
    } catch (error) {
      setResponse(null);
      setMessage(`發生錯誤！${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTypeChange = (event) => {
    setSelectedType(event.target.value);
  };

  // 處理顯示角色的抽卡紀錄
  const handleShowRecords = (groupIndex) => {
    const records = response[selectedType];
    setSelectedRecordsIndex(groupIndex);
    setSelectedRecords(records);
    setSelectedRecordsData(records.data[groupIndex]);
  };

  const getColorGradient = (length) => {
    if (length <= 50) {
      // 綠到黃
      const greenPercentage = ((50 - length) / 50) * 100;
      const yellowPercentage = 100 - greenPercentage;
      return `linear-gradient(120deg, hsl(120, 100%, 50%) ${greenPercentage}%, hsl(60, 100%, 50%) ${yellowPercentage}%)`;
    } else if (length <= 70) {
      // 黃到橘
      const yellowPercentage = ((70 - length) / 20) * 100;
      const orangePercentage = 100 - yellowPercentage;
      return `linear-gradient(120deg, hsl(60, 100%, 50%) ${yellowPercentage}%, hsl(30, 100%, 50%) ${orangePercentage}%)`;
    } else if (length <= 80) {
      // 橘到紅
      const orangePercentage = ((80 - length) / 10) * 100;
      const redPercentage = 100 - orangePercentage;
      return `linear-gradient(120deg, hsl(30, 100%, 50%) ${orangePercentage}%, hsl(0, 100%, 50%) ${redPercentage}%)`;
    } else {
      // 超過80顯示紅色
      return `linear-gradient(120deg, hsl(0, 100%, 50%) 100%, hsl(0, 100%, 50%) 0%)`;
    }
  };

  return (
    <div>
      <Head>
        <title>Yeci Playground</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>

      <div className={styles.background}>
        <div className={styles.contentContainer}>
          <div
            className={styles.inputContainer}
            style={response ? { marginTop: "5rem" } : undefined}
          >
            {showTitle && (
              <span className={styles.title}>在這裡匯入你的抽卡記錄連結</span>
            )}
            <div className={styles.logInput}>
              <input id="logUrl" type="text" placeholder="請輸入連結" />
              <button onClick={importLog} disabled={loading}>
                {loading ? "正在匯入中..." : "匯入"}
              </button>

              {!selectedRecords && response && (
                <>
                  <select value={selectedType} onChange={handleTypeChange}>
                    <option value="character">限定角色</option>
                    <option value="light_cone">限定光錐</option>
                    <option value="regular">常駐</option>
                  </select>
                </>
              )}
              {selectedRecords && (
                <button
                  onClick={() => setSelectedRecords(null)}
                  style={{ backgroundColor: "#FF6969", borderColor: "#FF6969" }}
                >
                  返回
                </button>
              )}
            </div>
            {!response && (
              <>
                <div className={styles.tipContainer}>
                  <span className={styles.tipTitle}>如何取得連結？</span>
                  <span className={styles.tipContent}>
                    1. 在 PC 上打開崩壞：星穹鐵道
                    <br />
                    2. 打開遷躍的歷史紀錄
                    <br />
                    3. 打開 Windows PowerShell 並貼上以下指令
                  </span>
                  <div className={styles.tipCode}>
                    <button className={styles.copyButton} onClick={handleCopy}>
                      <Copy size={16} />
                      {copied ? "已複製" : "複製"}
                    </button>
                    <code>
                      {`Start-Process powershell -Verb runAs -ArgumentList '-NoExit -Command "Invoke-Expression  (New-Object Net.WebClient).DownloadString(\\"https://raw.githubusercontent.com/yeci226/HSR/main/getwarps.ps1\\")"'`}
                    </code>
                  </div>
                  <span className={styles.tipContent}>
                    4. 將 PowerShell 輸出的連結貼上到上方的輸入框
                  </span>
                </div>
              </>
            )}

            {message && (
              <div className={styles.response} style={{ color: "#FF4545" }}>
                {message}
              </div>
            )}
          </div>

          {!selectedRecords && response && response[selectedType]?.data && (
            <>
              <div className={styles.dataTitleContainer}>
                <span className={styles.dataTitle}>
                  {`共 ${response[selectedType].data
                    .map((group) => group.length)
                    .reduce((a, b) => a + b, 0)} 抽`}
                </span>
                {selectedRecordsIndex != 0 && (
                  <>
                    <span className={styles.dataTitle}>
                      {`平均 ${response[selectedType].average} 抽一個五星`}
                    </span>
                    <span className={styles.dataTitle}>
                      {`已墊 ${response[selectedType].pity} 抽`}
                    </span>
                  </>
                )}
              </div>
              <div className={styles.iconChangeContainer}></div>
              <div className={styles.dataColumnContainer}>
                {response[selectedType].data.map((group, groupIndex) => (
                  <>
                    {group.map(
                      (item, index) =>
                        ((groupIndex == 0 && index == 0) || item.rank == 5) && (
                          <div key={index} className={styles.dataColumnItem}>
                            <img
                              src={item.icon}
                              alt={item.name}
                              className={
                                item.type === "character"
                                  ? styles.characterImg
                                  : ""
                              }
                            />
                            <div
                              className={styles.dataColumnItemCount}
                              onClick={() => handleShowRecords(groupIndex)} // 點擊事件以顯示紀錄
                              style={{
                                borderRadius: "5px",
                                width: `${group.length * 5}px`,
                                backgroundColor:
                                  group.length <= 50
                                    ? "#7ED4AD"
                                    : group.length <= 70
                                    ? "#FFBB5C"
                                    : "#FF6969",
                              }}
                            >
                              {groupIndex == 0 && "已墊池"}
                              {group.length}抽
                            </div>
                          </div>
                        )
                    )}
                  </>
                ))}
              </div>
            </>
          )}

          {selectedRecords && (
            <>
              <div className={styles.dataTitleContainer}>
                <span
                  className={styles.dataTitle}
                  style={{
                    background: getColorGradient(selectedRecordsData.length),
                    WebkitBackgroundClip: "text",
                    color: "transparent",
                  }}
                >
                  {selectedRecordsIndex == 0
                    ? `已墊 ${selectedRecordsData.length} 抽`
                    : `共 ${selectedRecordsData.length} 抽`}
                </span>
                {selectedRecordsIndex != 0 && (
                  <>
                    <span className={styles.dataTitle}>
                      {`平均 ${selectedRecords.average} 抽一個五星`}
                    </span>
                    <span className={styles.dataTitle}>
                      {`已墊 ${selectedRecords.pity} 抽`}
                    </span>
                  </>
                )}
              </div>
              <div className={styles.dataContainer}>
                {selectedRecordsData.map((item) => (
                  <>
                    <div
                      key={item.id}
                      className={styles.dataItem}
                      style={{
                        backgroundColor:
                          item.rank === "5"
                            ? "transparent"
                            : item.rank === "4"
                            ? "#A37EBA"
                            : "#61677A",
                        backgroundImage:
                          item.rank === "5"
                            ? "linear-gradient(120deg, #FCF596 0%, #FBD288 50%, #FF9C73 100%)"
                            : undefined,
                        backgroundSize:
                          item.rank === "5" ? "100% 100%" : undefined,
                      }}
                    >
                      <img
                        src={item.icon}
                        alt={item.name}
                        className={
                          item.type === "character" ? styles.characterImg : ""
                        }
                      />
                      <p className={styles.count}>#{item.count}</p>
                    </div>
                  </>
                ))}
              </div>
              <div className={styles.dataListItemContainer}>
                {[
                  ...new Map(
                    selectedRecordsData.map((item) => [item.name, item])
                  ).values(),
                ]
                  .map((item) => ({
                    ...item,
                    count: selectedRecordsData.filter(
                      (data) => data.name === item.name
                    ).length,
                  }))
                  .sort((a, b) => {
                    if (a.type !== b.type) {
                      return a.type.localeCompare(b.type);
                    }
                    return b.rank - a.rank || b.count - a.count;
                  })
                  .map((item) => (
                    <div key={item.name} className={styles.dataListItem}>
                      <img
                        src={item.icon}
                        alt={item.name}
                        className={
                          item.type === "character" ? styles.characterImg : ""
                        }
                      />
                      <p
                        className={styles.count}
                        style={{
                          backgroundColor: `var(--rank-${item.rank}-color)`,
                          backgroundSize:
                            item.rank === "5" ? "100% 100%" : undefined,
                        }}
                      >
                        x{item.count}
                      </p>
                    </div>
                  ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
