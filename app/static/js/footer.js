function initFooter() {
  const footerContainer = document.createElement("div");
  footerContainer.classList.add("footer-container");

  const themeSwitchContainer = document.createElement("div");
  themeSwitchContainer.classList.add("theme-switch-container");

  // 定義主題按鈕的資料
  const themes = [
    {
      id: "light-mode",
      theme: "light",
      label: "Light Mode",
      svg: `
                <svg class="h-4 w-4 text-current" fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="20">
                    <circle cx="12" cy="12" r="5"></circle>
                    <path d="M12 1v2"></path>
                    <path d="M12 21v2"></path>
                    <path d="M4.22 4.22l1.42 1.42"></path>
                    <path d="M18.36 18.36l1.42 1.42"></path>
                    <path d="M1 12h2"></path>
                    <path d="M21 12h2"></path>
                    <path d="M4.22 19.78l1.42-1.42"></path>
                    <path d="M18.36 5.64l1.42-1.42"></path>
                </svg>`,
    },
    {
      id: "system-mode",
      theme: "system",
      label: "System Mode",
      svg: `
                <svg class="h-4 w-4 text-current" fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="20">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M8 21h8"></path>
                    <path d="M12 17v4"></path>
                </svg>`,
    },
    {
      id: "dark-mode",
      theme: "dark",
      label: "Dark Mode",
      svg: `
                <svg fill="none" height="24" shape-rendering="geometricPrecision" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" viewBox="0 0 24 24" width="20" class="h-4 w-4 text-current">
                    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"></path>
                </svg>`,
    },
  ];

  // 創建按鈕並添加到容器中
  themes.forEach(({ id, theme, label, svg }) => {
    const button = document.createElement("button");
    button.id = id;
    button.setAttribute("data-theme", theme);
    button.setAttribute("aria-label", label);
    button.innerHTML = svg;

    // 為按鈕添加事件監聽器
    button.addEventListener("click", () => setTheme(theme));

    themeSwitchContainer.appendChild(button);
  });

  footerContainer.appendChild(themeSwitchContainer);

  // 將 footer 添加到當前位置的 div 中
  const currentDiv = document.querySelector("div[data-theme]");
  currentDiv.appendChild(footerContainer);
}

// 將 initFooter 函數導出
exports = { initFooter };
