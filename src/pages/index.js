import { useEffect } from "react";
import Head from "next/head";
import styles from "../public/css/Home.module.css";

export default function Home() {
  useEffect(() => {
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval); // 清理計時器
  }, []);

  function updateTime() {
    const now = new Date();
    const formattedTime = now.toLocaleString("en-US", {
      timeZone: "Asia/Taipei",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
    document.getElementById("time").innerHTML = "Now time is " + formattedTime;
  }

  return (
    <div>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Index Page</title>
      </Head>

      <div className={styles.contentContainer}>
        <h1>Hello, World!</h1>
        <a id="time"></a>
      </div>
    </div>
  );
}
