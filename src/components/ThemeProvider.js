import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("theme") || "light";
      setTheme(savedTheme);

      if (savedTheme === "dark") document.documentElement.classList.add("dark");
    }
  }, []);

  useEffect(() => {
    theme === "dark"
      ? document.documentElement.classList.add("dark")
      : document.documentElement.classList.remove("dark");
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme = theme === "light" ? "dark" : "light";

    if (typeof window !== "undefined") {
      if (document.startViewTransition) {
        await document.startViewTransition(async () => {
          setTheme(newTheme);
          localStorage.setItem("theme", newTheme);
        }).finished;
      } else {
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
      }
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
