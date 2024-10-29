import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../public/css/Header.module.css";

const Header = () => {
  const router = useRouter();
  const currentPage = router.pathname;
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const NavLink = ({ to, children }) => (
    <Link href={to} className={currentPage === to ? styles.active : ""}>
      {children}
    </Link>
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      window.addEventListener("click", handleClickOutside);
    } else {
      window.removeEventListener("click", handleClickOutside);
    }

    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <header className={styles.header}>
      <NavLink to="/">首頁</NavLink>
      <NavLink to="/about">關於</NavLink>
      <div className={styles.dropdown} ref={dropdownRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setDropdownOpen(!dropdownOpen);
          }}
        >
          小工具
        </button>

        <div
          className={`${styles.dropdownContent} ${
            dropdownOpen ? styles.show : styles.hide
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
