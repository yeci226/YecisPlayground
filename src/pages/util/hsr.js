import React, { useEffect, useRef } from "react";
import Head from "next/head";
import styles from "../../public/css/About.module.css";

export default function Hsr() {
  const typingRef = useRef(null);

  useEffect(() => {
    const typingElement = typingRef.current;
    const textLength = typingElement.textContent.length;
    const typingSpeed = 0.1; // 每个字符的时间（秒）
    const totalDuration = textLength * typingSpeed; // 动画总时间

    // 动态添加打字动画
    typingElement.style.animation = `typing ${totalDuration}s steps(${textLength}, end), blink-caret 0.75s step-end infinite`;

    // 动画结束后移除光标
    const timer = setTimeout(() => {
      typingElement.classList.add(styles.finished);
    }, totalDuration * 1000);

    // 清理定时器
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <Head>
        <title>Yeci Playground</title>
      </Head>

      <div className={styles.contentContainer}>
        <span ref={typingRef} className={styles.typing}>
          這裡是崩壞：星穹鐵道小工具頁面
        </span>
      </div>
    </div>
  );
}
