import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../public/css/Header.module.css";

const Header = () => {
  const router = useRouter();
  const currentPage = router.pathname;
  const [dropdownOpen, setDropdownOpen] = useState(false); // 控制下拉選單的狀態
  const dropdownRef = useRef(null); // 用於引用下拉選單

  const NavLink = ({ to, children }) => (
    <Link href={to} className={currentPage === to ? styles.active : ""}>
      {children}
    </Link>
  );

  // 監聽點擊事件以關閉下拉選單
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <header className={styles.header}>
      <NavLink to="/">首頁</NavLink>
      <NavLink to="/about">關於</NavLink>
      <div className={styles.dropdown} ref={dropdownRef}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)}>小工具</button>
        <div
          className={`${styles.dropdownContent} ${
            dropdownOpen ? styles.show : ""
          }`}
        >
          <NavLink to="/util/hsr">崩壞：星穹鐵道</NavLink>
          <NavLink to="/util/zzz">絕區零</NavLink>
        </div>
      </div>
      <NavLink to="/player">玩家</NavLink>
    </header>
  );
};

export default Header;
