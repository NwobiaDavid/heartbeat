
const DEFAULTS = {
  enabled: true,
  ignoreShorts: true,
  blacklist: ''
}

let settings = { ...DEFAULTS }
let observer = null
let lastVideoId = null

function debug(...args) {
  console.log('[AutoLike]', ...args)
}

// --- Settings management ---

function loadSettings() {
  return new Promise((resolve) => {
    try {
      chrome.storage.sync.get(
        ['autolike_enabled', 'autolike_ignore_shorts', 'autolike_blacklist'],
        (res) => {
          if (chrome.runtime.lastError) {
            console.warn("[AutoLike] storage error:", chrome.runtime.lastError.message)
            resolve(DEFAULTS)
            return
          }
          settings.enabled = res.autolike_enabled ?? DEFAULTS.enabled
          settings.ignoreShorts = res.autolike_ignore_shorts ?? DEFAULTS.ignoreShorts
          settings.blacklist = res.autolike_blacklist ?? DEFAULTS.blacklist
          resolve(settings)
        }
      )
    } catch (e) {
      console.warn("[AutoLike] context invalidated (caught)", e)
      resolve(DEFAULTS)
    }
  })
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    if (changes.autolike_enabled)
      settings.enabled = changes.autolike_enabled.newValue
    if (changes.autolike_ignore_shorts)
      settings.ignoreShorts = changes.autolike_ignore_shorts.newValue
    if (changes.autolike_blacklist)
      settings.blacklist = changes.autolike_blacklist.newValue
    debug('settings updated', settings)
  }
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message && message.type === 'SET_ENABLED') {
    settings.enabled = !!message.enabled
    if (settings.enabled) tryLikeIfNeeded()
    sendResponse({ ok: true })
  }
})

// --- Helpers ---
function isShortsUrl() {
  return window.location.pathname.startsWith('/shorts/')
}

function getVideoId() {
  const url = new URL(window.location.href)
  if (url.searchParams.has('v')) return url.searchParams.get('v')
  if (isShortsUrl()) return url.pathname.split('/shorts/')[1]
  return null
}

function getChannelName() {
  const candidates = [
    '#text-container ytd-channel-name',
    'ytd-channel-name a',
    '#channel-name a',
    'ytd-video-owner-renderer a',
    'yt-core-attributed-string__link',
    'a.yt-simple-endpoint'
  ]
  for (const sel of candidates) {
    const el = document.querySelector(sel)
    if (el) {
      if (el.textContent && el.textContent.trim()) {
        return el.textContent.trim()
      }

      if (el.getAttribute('href')?.startsWith('/@')) {
        return el.getAttribute('href').slice(2)
      }
    }
  }
  return ''
}

function normalizeChannel(str) {
  return str.replace(/^@/, '').trim().toLowerCase()
}

function isBlacklisted() {
  if (!settings.blacklist) return false

  const channel = normalizeChannel(getChannelName())
  const parts = settings.blacklist
    .split(',')
    .map(normalizeChannel)
    .filter(Boolean)

  return parts.includes(channel)
}

// --- Core action ---
function clickLikeButton() {
  let btn =
   // normal video like button
    document.querySelector('button[aria-label*="like this video"]') ||
    // shorts like button
    document.querySelector('ytd-reel-video-renderer ytd-toggle-button-renderer button[aria-pressed]')

    
    // ||
    // document.querySelector(
    //   'ytd-toggle-button-renderer:nth-of-type(1) yt-button-shape button'
    // )

  if (!btn) {
    const candidates = Array.from(document.querySelectorAll('button'))
    btn = candidates.find((b) =>
      (b.getAttribute('aria-label') || '')
        .toLowerCase()
        .includes('like')
    )
  }

  if (!btn) {
    debug('Like button not found yet')
    return false
  }

  const pressed = btn.getAttribute('aria-pressed') === 'true'
  if (pressed) {
    debug('Already liked — skipping')
    return true
  }

  btn.click()
  debug('Clicked like button!')
  return true
}

function tryLikeIfNeeded() {
  if (!settings.enabled) return
  if (settings.ignoreShorts && isShortsUrl()) {
    debug('Ignoring shorts')
    return
  }

  const vid = getVideoId()
  if (!vid) {
    debug('No video id found')
    return
  }
  if (vid === lastVideoId) {
    debug('Same video as before — skipping')
    return
  }

  lastVideoId = vid
  debug(vid)

  setTimeout(() => {
    if (isBlacklisted()) {
      debug('Channel is blacklisted — skipping')
      return
    }
    let attempts = 0
    const interval = setInterval(() => {
      attempts++
      const ok = clickLikeButton()
      if (ok || attempts >= 6) clearInterval(interval)
    }, 700)
  }, 800)
}

function ensureObserver() {
  if (observer) return
  observer = new MutationObserver(() => {
    tryLikeIfNeeded()
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

// --- Start ---
async function start() {
  await loadSettings()
  debug('settings loaded', settings)
  ensureObserver()
  tryLikeIfNeeded()
}

start()
