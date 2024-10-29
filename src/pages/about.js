import React, { useEffect, useRef } from "react";
import Head from "next/head";
import styles from "../public/css/About.module.css";
import profileImage from "../public/assets/profile.webp";

export default function About() {
  const typingRefH1 = useRef(null);
  const typingRefH2 = useRef(null);

  useEffect(() => {
    const typeText = (element, text, delay, callback) => {
      let index = 0;

      const typeCharacter = () => {
        if (index < text.length) {
          element.textContent += text[index];
          index++;
          setTimeout(typeCharacter, delay);
        } else {
          if (callback) callback();
        }
      };

      typeCharacter();
    };

    const h1Text = "你好！我是 Yeci";
    const h2Text = "一名大學生兼 JavaScript 開發者";

    typeText(typingRefH1.current, h1Text, 100, () => {
      typeText(typingRefH2.current, h2Text, 100);
    });
  }, []);

  return (
    <div>
      <Head>
        <title>Yeci Playground</title>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </Head>

      <div className={styles.contentContainer}>
        <div className={styles.profileContainer}>
          <div className={styles.profileText}>
            <h1 ref={typingRefH1} className={styles.typing}></h1>
            <h2 ref={typingRefH2} className={styles.typing}></h2>
          </div>
          <img
            src={profileImage.src}
            alt="Profile"
            className={styles.profileImage}
          />
        </div>
      </div>
    </div>
  );
}
