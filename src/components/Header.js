import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../public/css/Header.module.css";

const Header = () => {
  const router = useRouter();
  const currentPage = router.pathname;
  const dropdownRef1 = useRef(null);
  const dropdownRef2 = useRef(null);
  const [dropdownOpen1, setDropdownOpen1] = useState(false);
  const [dropdownOpen2, setDropdownOpen2] = useState(false);

  const NavLink = ({ to, children }) => (
    <Link href={to} className={currentPage === to ? styles.active : ""}>
      {children}
    </Link>
  );

  const handleClickOutside = (event, ref, setDropdownOpen) => {
    if (ref.current && !ref.current.contains(event.target)) {
      setDropdownOpen(false);
    }
  };

  useEffect(() => {
    const handleClickOutsideWrapper = (event) => {
      handleClickOutside(event, dropdownRef1, setDropdownOpen1);
      handleClickOutside(event, dropdownRef2, setDropdownOpen2);
    };

    window.addEventListener("click", handleClickOutsideWrapper);

    return () => {
      window.removeEventListener("click", handleClickOutsideWrapper);
    };
  }, []);

  return (
    <header className={styles.header}>
      <NavLink to="/">首頁</NavLink>
      <NavLink to="/about">關於</NavLink>
      <div className={styles.dropdown} ref={dropdownRef1}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen1(!dropdownOpen1);
          }}
        >
          崩壞：星穹鐵道
        </button>

        <div
          className={`${styles.dropdownContent} ${
            dropdownOpen1 ? styles.show : styles.hide
          }`}
        >
          <NavLink to="/hsr/warp-log">躍遷紀錄</NavLink>
        </div>
      </div>
      <div className={styles.dropdown} ref={dropdownRef2}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen2(!dropdownOpen2);
          }}
        >
          絕區零
        </button>

        <div
          className={`${styles.dropdownContent} ${
            dropdownOpen2 ? styles.show : styles.hide
          }`}
        >
          <NavLink to="/zzz/signal-log">調頻紀錄</NavLink>
        </div>
      </div>
      <NavLink to="/player">播放器</NavLink>
    </header>
  );
};

export default Header;
