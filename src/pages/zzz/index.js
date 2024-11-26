import React from "react";
import Head from "next/head";
import styles from "../../public/css/Index.module.css";

export default function Zzz() {
  return (
    <div>
      <Head>
        <title>野茨遊樂場 - 絕區零</title>
      </Head>

      <div className={styles.contentContainer}>
        <span className={styles.typing}>這裡是絕區零小工具頁面</span>
      </div>
    </div>
  );
}
