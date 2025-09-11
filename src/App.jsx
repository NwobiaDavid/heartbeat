import React, { useEffect, useState } from 'react';
import './App.css';

const STORAGE_KEYS = {
  ENABLED: 'autolike_enabled',
  IGNORE_SHORTS: 'autolike_ignore_shorts',
  BLACKLIST: 'autolike_blacklist',
};

function save(key, value) {
  return new Promise((resolve) => {
    const obj = {};
    obj[key] = value;
    chrome.storage.sync.set(obj, () => resolve());
  });
}

function load(keys) {
  return new Promise((resolve) =>
    chrome.storage.sync.get(keys, (res) => resolve(res))
  );
}

function App() {
  const [enabled, setEnabled] = useState(true);
  const [ignoreShorts, setIgnoreShorts] = useState(true);
  const [blacklist, setBlacklist] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    (async () => {
      const res = await load([
        STORAGE_KEYS.ENABLED,
        STORAGE_KEYS.IGNORE_SHORTS,
        STORAGE_KEYS.BLACKLIST,
      ]);
      if (res[STORAGE_KEYS.ENABLED] !== undefined)
        setEnabled(res[STORAGE_KEYS.ENABLED]);
      if (res[STORAGE_KEYS.IGNORE_SHORTS] !== undefined)
        setIgnoreShorts(res[STORAGE_KEYS.IGNORE_SHORTS]);
      if (res[STORAGE_KEYS.BLACKLIST] !== undefined)
        setBlacklist(res[STORAGE_KEYS.BLACKLIST]);
    })();
  }, []);

  const onToggle = async (next) => {
    setEnabled(next);
    await save(STORAGE_KEYS.ENABLED, next);
    setStatus('Saved');
    setTimeout(() => setStatus(''), 900);

    // Broadcast to content scripts in active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0])
        chrome.tabs.sendMessage(tabs[0].id, {
          type: 'SET_ENABLED',
          enabled: next,
        });
    });
  };

  const onIgnoreShorts = async (v) => {
    setIgnoreShorts(v);
    await save(STORAGE_KEYS.IGNORE_SHORTS, v);
    setStatus('Saved');
    setTimeout(() => setStatus(''), 900);
  };

  const onSaveBlacklist = async () => {
    await save(STORAGE_KEYS.BLACKLIST, blacklist);
    setStatus('Saved');
    setTimeout(() => setStatus(''), 900);
  };
  return (
    <>
      <div className="popup heartbeat">
        <header className="hb-header">
          <div className="logo">
            <img src="/heart.webp" alt="logo" />
          </div>
          <div className="title-block">
            <h1>HeartBeat</h1>
            <p className="tagline">
              Auto-like with ❤️ (but only the channels you want)
            </p>
          </div>
        </header>

        <label className="row">
          <span>Enabled</span>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onToggle(e.target.checked)}
          />
        </label>

        <label className="row">
          <span>Ignore Shorts</span>
          <input
            type="checkbox"
            checked={ignoreShorts}
            onChange={(e) => onIgnoreShorts(e.target.checked)}
          />
        </label>

        <label className="field">
          <span>Channel blacklist (comma-separated names or IDs)</span>
          <textarea
            value={blacklist}
            onChange={(e) => setBlacklist(e.target.value)}
            placeholder="e.g. SomeChannel, UCabcd1234 or @SomeHandle"
          />
        </label>

        <div className="row controls">
          <button className="btn primary" onClick={onSaveBlacklist}>
            Save Blacklist
          </button>
          <span className="status">{status}</span>
        </div>

        <footer>
          <small>
            Note: selectors may break if YouTube changes UI. HeartBeat v1.0
          </small>
        </footer>
      </div>
    </>
  );
}

export default App;
