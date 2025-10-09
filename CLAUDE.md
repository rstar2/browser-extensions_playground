# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Browser extensions playground - collection of Chrome/Chromium browser extensions using Manifest V2. Each extension is independent project in its own directory.

## Repository Structure

Each extension follows pattern:
- `manifest.json` - Extension metadata, permissions, background scripts
- `background.js` - Background service worker (event-driven, non-persistent)
- `popup.html/popup.js` - Browser action popup UI (if applicable)
- `options.html/options.js` - Extension options page (if applicable)
- `inject.js` - Content scripts injected into pages (if applicable)
- `images/` - Extension icons and assets

## Extensions

### ru-tab-switch
Keyboard shortcut (Alt+A) for switching to last active tab. Uses `chrome.storage.local` to persist window/tab state across sessions. Tracks active/last-active tab per window using Map serialization.

### ru-yt_downloader
YouTube download extension with AWS backend. Context menu on YouTube videos for MP3/MP4 downloads. Uses `chrome.storage.sync` for auth state. Authorization options page not yet implemented (see TODO.md:3).

### ru-pip
Picture-in-Picture mode for videos. Injects script via `chrome.tabs.executeScript` to trigger PiP API. Browser action with Alt+P shortcut.

### ru-page_action
Demo extension showing page actions with declarative content rules. Shows page action only on developer.chrome.com. Includes storage API and context menu examples.

### ru-copy_url
Creates new tabs and context menus. Demonstrates `chrome.extension.getURL()` for local resources.

## Development Commands

**Linting:**
```bash
# No npm/build scripts configured - manual ESLint usage
eslint <file.js>
```

**Loading extensions:**
1. Navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select individual extension directory (ru-tab-switch/, ru-pip/, etc.)

**Testing:**
No automated tests configured. Manual testing in browser required.

## Architecture Notes

**Event Pages Pattern:**
All extensions use `"persistent": false` background scripts (event pages). Scripts load on events, unload when idle. Avoid global state - persist via chrome.storage APIs.

**Storage APIs:**
- `chrome.storage.sync` - Syncs across user's Chrome instances (ru-yt_downloader auth)
- `chrome.storage.local` - Local-only storage (ru-tab-switch window state)

**Content Scripts vs Background:**
- Background scripts have full extension API access, no DOM access
- Content scripts have DOM access, limited extension APIs
- Communication via `chrome.tabs.executeScript` or messaging APIs

**Manifest V2:**
This codebase uses Manifest V2. Be aware Chrome is migrating to V3 (different background script model, no `chrome.tabs.executeScript`, different permissions).

## Code Style

See `.eslintrc`:
- 4-space indentation
- Single quotes
- Semicolons required
- ES6+ features enabled
- `chrome` global defined
- Console logs allowed
