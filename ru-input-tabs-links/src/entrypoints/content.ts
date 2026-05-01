import '@/assets/tailwind.css';

const TRIGGER = '!tabs';
const POPUP_VARIANT: 'floating' | 'dropdown' | 'overlay' | 'autocomplete' =
  'floating';

interface TabInfo {
  id?: number;
  title?: string;
  url?: string;
  favIconUrl?: string;
}

let activePopup: HTMLDivElement | null = null;
let triggerRange: { start: number; end: number } | null = null;

function isEditable(el: EventTarget | null): el is HTMLElement {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = (el as HTMLElement).tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    (el as HTMLElement).isContentEditable
  );
}

function getInputValue(el: HTMLElement): string {
  if (el.isContentEditable) return el.textContent ?? '';
  return (el as HTMLInputElement).value;
}

function getCursorPosition(el: HTMLElement): number {
  if (el.isContentEditable) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return 0;
    const range = sel.getRangeAt(0);
    const pre = range.cloneRange();
    pre.selectNodeContents(el);
    pre.setEnd(range.startContainer, range.startOffset);
    return pre.toString().length;
  }
  return (el as HTMLInputElement).selectionStart ?? 0;
}

function setCursorAfter(el: HTMLElement, pos: number) {
  if (el.isContentEditable) {
    const range = document.createRange();
    const sel = window.getSelection();
    if (!sel) return;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let currentPos = 0;
    let node: Text | null;
    while ((node = walker.nextNode() as Text | null)) {
      if (currentPos + node.length >= pos) {
        range.setStart(node, pos - currentPos);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return;
      }
      currentPos += node.length;
    }
  } else {
    const input = el as HTMLInputElement;
    input.selectionStart = pos;
    input.selectionEnd = pos;
  }
}

function replaceTrigger(el: HTMLElement, url: string) {
  if (!triggerRange) return;
  const { start, end } = triggerRange;

  if (el.isContentEditable) {
    // For contenteditable, just replace text content and re-set cursor
    const text = el.textContent ?? '';
    el.textContent = text.slice(0, start) + url + text.slice(end);
    setCursorAfter(el, start + url.length);
  } else {
    const input = el as HTMLInputElement;
    const val = input.value;
    const urlWithSpace = url + ' ';
    input.value = val.slice(0, start) + urlWithSpace + val.slice(end);
    setCursorAfter(input, start + urlWithSpace.length);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function getPopupPosition(
  el: HTMLElement,
  variant: string,
): { top: number; left: number; width?: number } {
  const rect = el.getBoundingClientRect();

  switch (variant) {
    case 'dropdown':
      return { top: rect.bottom + 4, left: rect.left, width: rect.width };
    case 'autocomplete': {
      // Position near the cursor
      const cursorPos = getCursorPosition(el);
      let caretX = rect.left + 10;
      if (!el.isContentEditable) {
        const mirror = document.createElement('div');
        const style = getComputedStyle(el);
        mirror.style.cssText = `
          position:absolute;visibility:hidden;white-space:pre;overflow:hidden;
          font:${style.font};padding:${style.padding};border:${style.border};
          width:${style.width};letter-spacing:${style.letterSpacing};
        `;
        mirror.textContent = (el as HTMLInputElement).value.slice(0, cursorPos);
        document.body.appendChild(mirror);
        caretX = rect.left + mirror.offsetWidth;
        mirror.remove();
      }
      return { top: rect.bottom + 4, left: Math.max(caretX - 50, 10) };
    }
    case 'overlay':
      return {
        top: window.innerHeight / 2 - 150,
        left: window.innerWidth / 2 - 200,
        width: 400,
      };
    case 'floating':
    default: {
      const sel = window.getSelection();
      let x = rect.left + rect.width / 2 - 150;
      let y = rect.top - 310;
      if (sel && sel.rangeCount) {
        const caretRect = sel.getRangeAt(0).getBoundingClientRect();
        if (caretRect.left > 0) x = caretRect.left - 50;
        y = caretRect.top - 310;
      }
      if (y < 10) y = rect.bottom + 4;
      return { top: y, left: Math.max(x, 10), width: 300 };
    }
  }
}

function buildPopup(tabs: TabInfo[], el: HTMLElement): HTMLDivElement {
  const pos = getPopupPosition(el, POPUP_VARIANT);
  const popup = document.createElement('div');
  popup.className =
    'fixed z-[2147483647] max-h-[300px] overflow-y-auto rounded-lg border border-gray-700 bg-gray-900 shadow-2xl';
  if (pos.width) popup.style.width = `${Math.min(pos.width, 400)}px`;
  popup.style.top = `${pos.top + window.scrollY}px`;
  popup.style.left = `${pos.left + window.scrollX}px`;

  for (const tab of tabs) {
    const row = document.createElement('div');
    row.className =
      'flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-700 text-sm text-gray-200';
    row.title = tab.url ?? '';

    const favicon = document.createElement('img');
    favicon.src = tab.favIconUrl ?? '';
    favicon.className = 'w-4 h-4 shrink-0';
    favicon.onerror = () => favicon.remove();

    const title = document.createElement('span');
    title.className = 'truncate';
    title.textContent = tab.title ?? 'Untitled';

    row.appendChild(favicon);
    row.appendChild(title);

    row.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (tab.url) replaceTrigger(el, tab.url);
      closePopup();
    });

    popup.appendChild(row);
  }

  if (tabs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'px-4 py-3 text-sm text-gray-400';
    empty.textContent = 'No tabs open';
    popup.appendChild(empty);
  }

  return popup;
}

function closePopup() {
  if (activePopup) {
    activePopup.remove();
    activePopup = null;
  }
  triggerRange = null;
}

async function showPopup(el: HTMLElement, start: number, end: number) {
  closePopup();
  triggerRange = { start, end };

  const tabs: TabInfo[] = await browser.runtime.sendMessage({
    type: 'getAllTabs',
  });

  // Create inside a shadow root for style isolation
  const host = document.createElement('div');
  host.id = 'ru-input-tabs-links-host';
  host.style.cssText = 'all:initial;position:absolute;top:0;left:0;';
  document.body.appendChild(host);
  const shadow = host.attachShadow({ mode: 'open' });

  // Inject tailwind styles into shadow root
  const style = document.createElement('style');
  style.textContent = await fetchTailwindCSS();
  shadow.appendChild(style);

  const popup = buildPopup(tabs, el);
  shadow.appendChild(popup);
  activePopup = host;
}

async function fetchTailwindCSS(): Promise<string> {
  try {
    const url = browser.runtime.getURL(
      'content-scripts/content.css' as any,
    );
    const res = await fetch(url);
    return await res.text();
  } catch {
    return '';
  }
}

function handleInput(e: Event) {
  const el = e.target as HTMLElement;
  if (!isEditable(el)) return;

  const text = getInputValue(el);
  const cursor = getCursorPosition(el);

  // Check if text before cursor ends with "!tabs "
  const beforeCursor = text.slice(0, cursor);
  const triggerIdx = beforeCursor.lastIndexOf(TRIGGER);

  if (
    triggerIdx !== -1 &&
    triggerIdx + TRIGGER.length < beforeCursor.length &&
    beforeCursor[triggerIdx + TRIGGER.length] === ' '
  ) {
    // Verify word boundary before !tabs
    if (triggerIdx === 0 || /\s/.test(beforeCursor[triggerIdx - 1])) {
      showPopup(el, triggerIdx, triggerIdx + TRIGGER.length);
      return;
    }
  }

  closePopup();
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && activePopup) {
    e.preventDefault();
    e.stopPropagation();
    closePopup();
  }
}

function handleFocusOut(e: FocusEvent) {
  if (activePopup && !activePopup.contains(e.relatedTarget as Node)) {
    closePopup();
  }
}

export default defineContentScript({
  matches: ['<all_urls>'],
  cssInjectionMode: 'ui',

  main() {
    document.addEventListener('input', handleInput, true);
    document.addEventListener('keydown', handleKeydown, true);
    document.addEventListener('focusout', handleFocusOut, true);
  },
});
