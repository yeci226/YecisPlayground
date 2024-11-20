import React from "react";
import Head from "next/head";
import styles from "../../public/css/About.module.css";

export default function Zzz() {
  return (
    <div>
      <Head>
        <title>Yeci Playground</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>

      <div className={styles.contentContainer}>
        <span className={styles.typing}>這裡是絕區零小工具頁面</span>
      </div>
    </div>
  );
}
