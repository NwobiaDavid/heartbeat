# AutoLike for YouTube ⭐

A lightweight Chrome extension that **automatically likes YouTube videos** from your favorite channels — while letting you blacklist channels you don’t want to auto-like. Works for **normal videos and Shorts**.

---

## Features

* 👍 Auto-like videos as you watch
* 🎯 Works with YouTube Shorts too
* 📝 Blacklist specific channels to skip auto-liking
* ⚡ Lightweight and fast (runs only when needed)
* 🔒 Settings stored in Chrome sync storage

---

## 🚀 Installation (Developer Mode)

1. Clone this repo:

   ```bash
   git clone https://github.com/NwobiaDavid/heartbeat.git
   ```
2. Open **Chrome** → go to `chrome://extensions/`
3. Enable **Developer Mode** (top-right toggle)
4. Click **Load unpacked** and select the repo folder
5. The extension icon should now appear in your browser 🎉

---

## ⚙️ Usage

* By default, the extension auto-likes videos.
* Open the popup to:

  * ✅ Enable/disable auto-like
  * 🚫 Add/remove channels from the blacklist
* When watching a video:

  * If the channel is **not blacklisted**, the like button is clicked automatically.
  * If the channel **is blacklisted**, nothing happens.

---

## 📸 Screenshot
![Popup Screenshot](src/assets/popup.PNG)

---

## 🛠️ Tech Notes

* Built with **React** for popup UI
* Uses `chrome.storage.sync` to save settings
* Content script detects the like button and interacts with it
* Handles YouTube’s single-page app navigation so it works even when switching videos without reload

---

## 🐞 Known Issues

* If auto-like happens on a blacklisted channel, check your stored blacklist for formatting (IDs must match exactly).

---

## 📜 License

MIT License — free to use, modify, and share.


