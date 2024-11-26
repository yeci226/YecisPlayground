import React from "react";
import Head from "next/head";
import styles from "../../public/css/Index.module.css";

export default function Hsr() {
  return (
    <div>
      <Head>
        <title>野茨遊樂場 - 崩壞：星穹鐵道</title>
      </Head>

      <div className={styles.contentContainer}>
        <span className={styles.typing}>這裡是崩壞：星穹鐵道小工具頁面</span>
      </div>
    </div>
  );
}
