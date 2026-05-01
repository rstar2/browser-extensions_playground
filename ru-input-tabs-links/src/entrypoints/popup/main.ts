import "@/assets/tailwind.css";

const app = document.querySelector<HTMLDivElement>("#app")!;

const copyIcon =
  '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
async function loadTabs() {
  const tabs = await browser.tabs.query({});

  if (tabs.length === 0) {
    app.innerHTML = '<p class="text-sm text-gray-400 p-2">No tabs open</p>';
    return;
  }

  const list = document.createElement("div");
  list.className = "flex flex-col gap-0.5";

  for (const tab of tabs) {
    const row = document.createElement("div");
    row.className =
      "group flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-gray-700 text-sm";
    row.title = tab.url ?? "";

    const favicon = document.createElement("img");
    favicon.src = tab.favIconUrl ?? "";
    favicon.className = "w-4 h-4 shrink-0";
    favicon.onerror = () => favicon.remove();

    const title = document.createElement("span");
    title.className = "truncate flex-1 min-w-0";
    title.textContent = tab.title ?? "Untitled";

    const copy = document.createElement("span");
    copy.innerHTML = copyIcon;
    copy.className =
      "shrink-0 w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity";

    row.appendChild(favicon);
    row.appendChild(title);
    row.appendChild(copy);

    row.addEventListener("click", async () => {
      if (tab.url) {
        await navigator.clipboard.writeText(tab.url);
        title.textContent = "Copied!";
        setTimeout(() => {
          title.textContent = tab.title ?? "Untitled";
        }, 800);
      }
    });

    list.appendChild(row);
  }

  app.replaceChildren(list);
}

loadTabs();
