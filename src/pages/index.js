import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import Masonry from "react-masonry-css";
import styles from "../public/css/Index.module.css";

import corinAvatar from "../public/assets/index/corin.webp";
import yeciAvatar from "../public/assets/index/yeci.webp";
import hanekoAvatar from "../public/assets/index/haneko.webp";
import hsrAvatar from "../public/assets/index/hsr.webp";
import zqndaAvatar from "../public/assets/index/zqnda.webp";
import outoAvatar from "../public/assets/index/outo.webp";
import unknownAvatar from "../public/assets/index/unknown.webp";

import indexImage from "../public/assets/index/index.png";
import hsrImage1 from "../public/assets/hsr/showcase1.png";
import hsrImage2 from "../public/assets/hsr/showcase2.png";
import aet2023Image from "../public/assets/index/aet2023.png";
import aet20241Image from "../public/assets/index/aet20241.png";
import aet20242Image from "../public/assets/index/aet20242.png";
import aet20243Image from "../public/assets/index/aet20243.png";
import marmot1Image from "../public/assets/index/marmot1.png";
import marmot2Image from "../public/assets/index/marmot2.png";
import ticket1Image from "../public/assets/index/ticket1.png";
import ticket2Image from "../public/assets/index/ticket2.png";
import hsr1Image from "../public/assets/index/hsr1.png";
import hsr2Image from "../public/assets/index/hsr2.png";
import hsr3Image from "../public/assets/index/hsr3.png";
import hsr4Image from "../public/assets/index/hsr4.png";
import hsr5Image from "../public/assets/index/hsr5.png";
import hsr6Image from "../public/assets/index/hsr6.png";
import hanekoImage from "../public/assets/index/haneko.png";
import outo1Image from "../public/assets/index/outo1.png";
import outo2Image from "../public/assets/index/outo2.png";
import yeci1Image from "../public/assets/index/yeci1.png";
import yeci2Image from "../public/assets/index/yeci2.png";
import yeci3Image from "../public/assets/index/yeci3.png";
import yeci4Image from "../public/assets/index/yeci4.png";
import yeci5Image from "../public/assets/index/yeci5.png";
import zqndaIamge from "../public/assets/index/zqnda.png";
import unknown1Image from "../public/assets/index/unknown1.png";
import unknown2Image from "../public/assets/index/unknown2.png";
import unknown3Image from "../public/assets/index/unknown3.png";
import corin1Image from "../public/assets/index/corin1.png";
import corin2Image from "../public/assets/index/corin2.png";
import corin3Image from "../public/assets/index/corin3.png";

export default function About() {
  const typingRefH1 = useRef(null);
  const typingRefH2 = useRef(null);
  const [showSocialMedia, setShowSocialMedia] = useState(false);

  useEffect(() => {
    if (
      typingRefH1.current.textContent === "" &&
      typingRefH2.current.textContent === ""
    ) {
      const typeText = (element, text, delay, callback) => {
        let index = 0;

        const typeCharacter = () => {
          if (index < text.length) {
            if (element) {
              element.textContent += text[index];
              index++;
              setTimeout(typeCharacter, delay);
            }
          } else {
            if (callback) callback();
          }
        };

        typeCharacter();
      };

      const h1Text = "你好！我是 Yeci";
      const h2Text = "一名大學生兼 JavaScript 開發者";

      typeText(typingRefH1.current, h1Text, 100, () => {
        typeText(typingRefH2.current, h2Text, 100, () => {
          setShowSocialMedia(true);
        });
      });
    }
  }, []);

  const projectImages = {
    playground: [indexImage.src, hsrImage1.src, hsrImage2.src],
    aet2023: [aet2023Image.src],
    aet2024: [aet20241Image.src, aet20242Image.src, aet20243Image.src],
    marmot: [marmot1Image.src, marmot2Image.src],
    ticket: [ticket1Image.src, ticket2Image.src],
    hsr: [
      hsr1Image.src,
      hsr2Image.src,
      hsr3Image.src,
      hsr4Image.src,
      hsr5Image.src,
      hsr6Image.src,
    ],
    corin: [corin1Image.src, corin2Image.src, corin3Image.src],
    haneko: [hanekoImage.src],
    outo: [outo1Image.src, outo2Image.src],
    yeci: [
      yeci1Image.src,
      yeci2Image.src,
      yeci3Image.src,
      yeci4Image.src,
      yeci5Image.src,
    ],
    zqnda: [zqndaIamge.src],
    unknown: [unknown1Image.src, unknown2Image.src, unknown3Image.src],
  };

  function AutoSwitchImage({ images, interval = 5000 }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [fade, setFade] = useState(true);

    useEffect(() => {
      const timer = setInterval(() => {
        setFade(false);
        setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
          setFade(true);
        }, 500);
      }, interval);

      return () => clearInterval(timer);
    }, [images, interval]);

    return (
      <img
        src={images[currentIndex]}
        className={styles.projectImage}
        alt="Project Image"
        loading="lazy"
        style={{
          opacity: images.length > 1 ? (fade ? 1 : 0) : 1,
        }}
      />
    );
  }

  // 定義瀑布流的斷點設置
  const breakpointColumns = {
    default: 3, // 預設 3 列
    1100: 2, // 當螢幕寬度 <= 1100px 時2 列
    700: 1, // 當螢幕寬度 <= 700px 時1 列
  };

  return (
    <div>
      <Head>
        <title>野茨遊樂場 - 主頁</title>
      </Head>

      <div className={styles.contentContainer}>
        <div className={styles.profileContainer}>
          <div className={styles.profileText}>
            <h1 ref={typingRefH1} className={styles.typing}></h1>
            <h2 ref={typingRefH2} className={styles.typing}></h2>
            <div
              className={`${styles.socialMedia} ${
                showSocialMedia && styles.fadeIn
              }`}
            >
              {/* GitHub */}
              <a
                href="https://github.com/yeci226"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.githubIcon}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <g fill="none">
                    <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                    <path
                      fill="currentColor"
                      d="M6.315 6.176c-.25-.638-.24-1.367-.129-2.034a6.8 6.8 0 0 1 2.12 1.07c.28.214.647.283.989.18A9.3 9.3 0 0 1 12 5c.961 0 1.874.14 2.703.391c.342.104.709.034.988-.18a6.8 6.8 0 0 1 2.119-1.07c.111.667.12 1.396-.128 2.033c-.15.384-.075.826.208 1.14C18.614 8.117 19 9.04 19 10c0 2.114-1.97 4.187-5.134 4.818c-.792.158-1.101 1.155-.495 1.726c.389.366.629.882.629 1.456v3a1 1 0 0 0 2 0v-3c0-.57-.12-1.112-.334-1.603C18.683 15.35 21 12.993 21 10c0-1.347-.484-2.585-1.287-3.622c.21-.82.191-1.646.111-2.28c-.071-.568-.17-1.312-.57-1.756c-.595-.659-1.58-.271-2.28-.032a9 9 0 0 0-2.125 1.045A11.4 11.4 0 0 0 12 3c-.994 0-1.953.125-2.851.356a9 9 0 0 0-2.125-1.045c-.7-.24-1.686-.628-2.281.031c-.408.452-.493 1.137-.566 1.719l-.005.038c-.08.635-.098 1.462.112 2.283C3.484 7.418 3 8.654 3 10c0 2.992 2.317 5.35 5.334 6.397A4 4 0 0 0 8 17.98l-.168.034c-.717.099-1.176.01-1.488-.122c-.76-.322-1.152-1.133-1.63-1.753c-.298-.385-.732-.866-1.398-1.088a1 1 0 0 0-.632 1.898c.558.186.944 1.142 1.298 1.566c.373.448.869.916 1.58 1.218c.682.29 1.483.393 2.438.276V21a1 1 0 0 0 2 0v-3c0-.574.24-1.09.629-1.456c.607-.572.297-1.568-.495-1.726C6.969 14.187 5 12.114 5 10c0-.958.385-1.881 1.108-2.684c.283-.314.357-.756.207-1.14"
                    />
                  </g>
                </svg>
              </a>

              {/* Discord */}
              <a
                href="https://discord.gg/mPCEATJDve"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.discordIcon}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                >
                  <g fill="none" fill-rule="evenodd">
                    <path d="m12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035q-.016-.005-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427q-.004-.016-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093q.019.005.029-.008l.004-.014l-.034-.614q-.005-.018-.02-.022m-.715.002a.02.02 0 0 0-.027.006l-.006.014l-.034.614q.001.018.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z" />
                    <path
                      fill="currentColor"
                      d="M15.003 4c.744 0 1.53.26 2.25.547l.527.216c1.26.528 1.968 1.636 2.517 2.853c.891 1.975 1.51 4.608 1.724 6.61c.102.95.127 1.906-.056 2.549c-.197.687-.867 1.173-1.518 1.555l-.322.183l-.334.186q-.26.144-.525.284l-.522.27l-.717.357l-.577.284a1 1 0 1 1-.894-1.788l.79-.39l-.58-.609c-1.39.57-3.027.893-4.766.893s-3.376-.322-4.766-.893l-.58.608l.793.39a1 1 0 1 1-.894 1.79l-.544-.27c-.402-.2-.805-.398-1.203-.607l-.928-.505l-.321-.183c-.651-.382-1.322-.868-1.518-1.555c-.184-.643-.158-1.598-.057-2.55c.214-2.001.833-4.634 1.724-6.609c.549-1.217 1.257-2.325 2.517-2.853C7.059 4.413 8.072 4 9 4c.603 0 1.077.555.99 1.147A14 14 0 0 1 12 5c.691 0 1.366.05 2.014.148A1.012 1.012 0 0 1 15.004 4ZM8.75 10.5a1.75 1.75 0 1 0 0 3.5a1.75 1.75 0 0 0 0-3.5m6.5 0a1.75 1.75 0 1 0 0 3.5a1.75 1.75 0 0 0 0-3.5"
                    />
                  </g>
                </svg>
              </a>
            </div>
          </div>
          <a href="https://github.com/yeci226" target="_blank">
            <img
              src="https://avatars.githubusercontent.com/u/88837499?v=4"
              alt="Profile"
              className={styles.profileImage}
            />
          </a>
        </div>
        <div className={styles.repoListContainer}>
          <span>開發及參與的專案</span>
          <Masonry
            breakpointCols={breakpointColumns}
            className={styles.masonryGrid}
            columnClassName={styles.masonryColumn}
          >
            {/* Repositories Web */}
            <div className={styles.repoCard}>
              <a href="/">Yeci's Playground (此網站)</a>
              <p>包含了我的介紹和一些小工具的網站</p>
              <p className={styles.small}>主要開發者 / 網站 / Next.js 開發</p>
              <AutoSwitchImage
                images={projectImages.playground}
                interval={5000}
              />
            </div>
            <div className={styles.repoCard}>
              <a href="/">AET2023</a>
              <p>亞洲最大非官方Brawl Stars賽事 AET2023 官方網站</p>
              <p className={styles.small}>主要開發者 / 網站 / Next.js 開發</p>
              <AutoSwitchImage images={projectImages.aet2023} interval={5000} />
              <p className={styles.date}></p>
            </div>
            <div className={styles.repoCard}>
              <a href="/">AET2024</a>
              <p>亞洲最大非官方Brawl Stars賽事 AET2024 官方網站</p>
              <p className={styles.small}>
                主要開發者 / 網站 / Express.js 開發
              </p>
              <AutoSwitchImage images={projectImages.aet2024} interval={5000} />
            </div>
            <div className={styles.repoCard}>
              <a href="/">土撥鼠圖書館</a>
              <p>土撥鼠與登入借還書網站</p>
              <p className={styles.small}>主要開發者 / 網站 / Next.js 開發</p>
              <AutoSwitchImage images={projectImages.marmot} interval={5000} />
            </div>
            <div className={styles.repoCard}>
              <a href="/">客服單系統</a>
              <p>Discord伺服器客服單網站</p>
              <p className={styles.small}>
                主要開發者 / 網站 / Express.js 開發
              </p>
              <AutoSwitchImage images={projectImages.ticket} interval={5000} />
            </div>
            {/* Repositories Discord Bots */}
            {/* HSR */}
            <div className={styles.repoCard}>
              <div className={styles.repoProfile}>
                <img src={hsrAvatar.src} className={styles.repoAvatar} />
                <a
                  href="https://forum.gamer.com.tw/C.php?bsn=72822&snA=3548&subbsn=0&page=1&s_author=&gothis=29007#29007"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  星鐵小助手
                </a>
              </div>
              <p>崩壞：星穹鐵道 Discord 機器人</p>
              <p className={styles.small}>
                主要開發者 / Discord 機器人 / Node.js 開發
              </p>
              <AutoSwitchImage images={projectImages.hsr} interval={5000} />
            </div>
            {/* Corin */}
            <div className={styles.repoCard}>
              <div className={styles.repoProfile}>
                <img src={corinAvatar.src} className={styles.repoAvatar} />
                <a
                  href="https://forum.gamer.com.tw/C.php?bsn=74860&snA=1087&subbsn=0&page=1&s_author=&gothis=4854#4854"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Corin
                </a>
              </div>
              <p>絕區零 Discord 機器人</p>
              <p className={styles.small}>
                主要開發者 / Discord 機器人 / Node.js 開發
              </p>
              <AutoSwitchImage images={projectImages.corin} interval={5000} />
            </div>
            {/* Haneko */}
            <div className={styles.repoCard}>
              <div className={styles.repoProfile}>
                <img src={hanekoAvatar.src} className={styles.repoAvatar} />
                <a
                  href="https://discordservers.tw/bots/998934498274181132"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Haneko
                </a>
              </div>
              <p>能夠在 Discord 上和朋友一起看 nHentai 的機器人</p>
              <p className={styles.small}>
                主要開發者 / Discord 機器人 / Node.js 開發
              </p>
              <div className={styles.blurTip}>
                <span className={styles.textCenter}>移動到這裡以顯示圖片</span>
                <div className={styles.blur}>
                  <AutoSwitchImage
                    images={projectImages.haneko}
                    interval={5000}
                  />
                </div>
              </div>
            </div>
            {/* Outo */}
            <div className={styles.repoCard}>
              <div className={styles.repoProfile}>
                <img src={outoAvatar.src} className={styles.repoAvatar} />
                <a
                  href="https://discordservers.tw/bots/998462106250784888"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Outo
                </a>
              </div>
              <p>在 Discord 伺服器中添加自訂詞彙並自動回覆的小幫手</p>
              <p className={styles.small}>
                主要開發者 / Discord 機器人 / Node.js 開發
              </p>
              <AutoSwitchImage images={projectImages.outo} interval={5000} />
            </div>
            {/* イェチ */}
            <div className={styles.repoCard}>
              <div className={styles.repoProfile}>
                <img src={yeciAvatar.src} className={styles.repoAvatar} />
                <a href="/">イェチ</a>
              </div>
              <p>
                Discord 多功能機器人
                <br />
                包含動態語音頻道、音樂播放、AI繪圖和其他小功能
              </p>
              <p className={styles.small}>
                主要開發者 / Discord 機器人 / Node.js 開發
              </p>
              <AutoSwitchImage images={projectImages.yeci} interval={5000} />
            </div>
            {/* Zqnda */}
            <div className={styles.repoCard}>
              <div className={styles.repoProfile}>
                <img src={zqndaAvatar.src} className={styles.repoAvatar} />
                <a href="/">Zqnda</a>
              </div>
              <p>Discord 音樂機器人</p>
              <p className={styles.small}>
                中文翻譯 / Discord 機器人 / Node.js 開發
              </p>
              <AutoSwitchImage images={projectImages.zqnda} interval={5000} />
            </div>
            {/* Unknown */}
            <div className={styles.repoCard}>
              <div className={styles.repoProfile}>
                <img src={unknownAvatar.src} className={styles.repoAvatar} />
                <a href="/">就此離開，沒人會受傷😡👊</a>
              </div>
              <p>
                包含了許多小功能
                <br />
                如訊息/語音紀錄、每周遊玩時數統計、抽獎小遊戲
              </p>
              <p className={styles.small}>
                主要開發者 / Discord 機器人 / Node.js 開發
              </p>
              <AutoSwitchImage images={projectImages.unknown} interval={5000} />
            </div>
          </Masonry>
        </div>
      </div>
    </div>
  );
}
