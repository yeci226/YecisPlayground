function setTheme(theme) {
  const themeDiv = document.querySelector("div[data-theme]");
  const themeButtons = document.querySelectorAll(
    ".theme-switch-container button"
  );

  // 清除所有選中的主題樣式
  themeButtons.forEach((button) => button.removeAttribute("selected-theme"));
  const selectedButton = [...themeButtons].find(
    (button) => button.dataset.theme === theme
  );

  // 確定主題
  if (theme === "system") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  // 設置主題
  themeDiv.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);

  // 設置當前選中的主題樣式
  selectedButton && selectedButton.setAttribute("selected-theme", true);
}

function getTheme() {
  const theme = localStorage.getItem("theme") || "dark"; // 默認為dark主題
  const themeDiv = document.querySelector("div[data-theme]");
  themeDiv.setAttribute("data-theme", theme);
}

exports = { setTheme, getTheme };
