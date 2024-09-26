import React, { useState, useEffect } from "react";

const themes = [
  {
    id: "light-mode",
    theme: "light",
    label: "Light Mode",
    textColor: "#000000",
    svg: `<svg class="h-4 w-4" fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="20"><circle cx="12" cy="12" r="5" fill="currentColor"></circle><path d="M12 1v2"></path><path d="M12 21v2"></path><path d="M4.22 4.22l1.42 1.42"></path><path d="M18.36 18.36l1.42 1.42"></path><path d="M1 12h2"></path><path d="M21 12h2"></path><path d="M4.22 19.78l1.42-1.42"></path><path d="M18.36 5.64l1.42-1.42"></path></svg>`,
  },
  {
    id: "dark-mode",
    theme: "dark",
    label: "Dark Mode",
    textColor: "#FFFFFF",
    svg: `<svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="20"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path></svg>`,
  },
];

const Footer = () => {
  const [currentTheme, setCurrentTheme] = useState(themes[0]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        const themeFromStorage = themes.find(
          (theme) => theme.theme === savedTheme
        );
        if (themeFromStorage) setCurrentTheme(themeFromStorage);
      }
    }
  }, []);

  useEffect(() => {
    document.body.setAttribute("data-theme", currentTheme.theme);
    localStorage.setItem("theme", currentTheme.theme);
  }, [currentTheme]);

  const toggleTheme = () => {
    const nextThemeIndex = (themes.indexOf(currentTheme) + 1) % themes.length;
    setCurrentTheme(themes[nextThemeIndex]);
  };

  return (
    <footer
      style={{
        position: "fixed",
        display: "flex",
        flexDirection: "row",
        right: 15,
        bottom: 15,
        color: currentTheme.textColor,
      }}
    >
      <button
        onClick={toggleTheme}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          color: currentTheme.textColor,
        }}
      >
        <span dangerouslySetInnerHTML={{ __html: currentTheme.svg }} />
      </button>
    </footer>
  );
};

export default Footer;
