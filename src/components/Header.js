import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import styles from "../public/css/Header.module.css";

const Header = () => {
  const router = useRouter();
  const currentPage = router.pathname;

  const NavLink = ({ to, children }) => (
    <Link href={to} className={currentPage === to ? styles.active : ""}>
      {children}
    </Link>
  );

  return (
    <header className={styles.header}>
      <NavLink to="/">首頁</NavLink>
      <NavLink to="/about">關於</NavLink>
      <NavLink to="/util">小工具</NavLink>
      <NavLink to="/player">玩家</NavLink>
    </header>
  );
};

export default Header;
