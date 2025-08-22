// Multi-source artwork resolver (no auth): Last.fm + iTunes + Deezer
// - Resolves artist, album, and track images
// - LocalStorage caching and gentle rate limiting

const CACHE_KEY = 'artwork_cache_v1';
const RATE_DELAY_MS = 900;
let lastRequestAt = 0;
// Vite exposes envs via import.meta.env
// Guard in case this file is executed where import.meta isn't defined
const LASTFM_API_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_LASTFM_API_KEY)
  ? import.meta.env.VITE_LASTFM_API_KEY
  : null; // Remove hardcoded fallback API key

function loadCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}'); } catch { return {}; }
}
function saveCache(cache) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)); } catch {}
}
function cacheGet(key) { return loadCache()[key] || ''; }
function cacheSet(key, val) { const c = loadCache(); c[key] = val; saveCache(c); }

async function rateLimit() {
  const now = Date.now();
  const diff = now - lastRequestAt;
  if (diff < RATE_DELAY_MS) await new Promise(r => setTimeout(r, RATE_DELAY_MS - diff));
  lastRequestAt = Date.now();
}

async function fetchJSON(url) {
  await rateLimit();
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function upscaleItunes(url) {
  if (!url) return '';
  return url.replace(/\/(\d+x\d+)(bb)?\.(jpg|png)$/i, '/512x512bb.$3');
}

// iTunes
async function itunesAlbumArt(artist, album) {
  const term = encodeURIComponent(`${artist} ${album}`);
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=album&limit=1`;
  const data = await fetchJSON(url);
  const art = data?.results?.[0]?.artworkUrl100;
  return upscaleItunes(art) || '';
}
async function itunesTrackArt(artist, track) {
  const term = encodeURIComponent(`${artist} ${track}`);
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=song&limit=1`;
  const data = await fetchJSON(url);
  const art = data?.results?.[0]?.artworkUrl100;
  return upscaleItunes(art) || '';
}
async function itunesArtistArt(artist) {
  const term = encodeURIComponent(artist);
  const url = `https://itunes.apple.com/search?term=${term}&media=music&entity=musicArtist&limit=1`;
  const data = await fetchJSON(url);
  // iTunes doesn't return artist images reliably; fallback empty
  return '';
}

// Deezer
async function deezerAlbumArt(artist, album) {
  const q = encodeURIComponent(`artist:"${artist}" album:"${album}"`);
  const url = `https://api.deezer.com/search/album?q=${q}&limit=1`;
  const data = await fetchJSON(url);
  const item = data?.data?.[0];
  return item?.cover_xl || item?.cover_big || item?.cover_medium || '';
}
async function deezerTrackArt(artist, track) {
  const q = encodeURIComponent(`artist:"${artist}" track:"${track}"`);
  const url = `https://api.deezer.com/search/track?q=${q}&limit=1`;
  const data = await fetchJSON(url);
  const item = data?.data?.[0];
  return item?.album?.cover_xl || item?.album?.cover_big || item?.album?.cover_medium || '';
}
async function deezerArtistArt(artist) {
  const q = encodeURIComponent(artist);
  const url = `https://api.deezer.com/search/artist?q=${q}&limit=1`;
  const data = await fetchJSON(url);
  const item = data?.data?.[0];
  return item?.picture_xl || item?.picture_big || item?.picture_medium || '';
}

// Last.fm
function pickLastfmImage(imageArr) {
  if (!Array.isArray(imageArr)) return '';
  for (let i = imageArr.length - 1; i >= 0; i--) {
    const item = imageArr[i];
    const url = (item && (item['#text'] || item)) || '';
    if (url) return url;
  }
  return '';
}

async function lastfmArtistArt(artist, mbid) {
  if (!LASTFM_API_KEY) return '';
  const params = mbid
    ? `mbid=${encodeURIComponent(mbid)}`
    : `artist=${encodeURIComponent(artist)}&autocorrect=1`;
  const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getinfo&${params}&api_key=${LASTFM_API_KEY}&format=json`;
  const data = await fetchJSON(url);
  return pickLastfmImage(data?.artist?.image) || '';
}

async function lastfmTrackArt(artist, track, mbid) {
  if (!LASTFM_API_KEY) return '';
  const qp = [];
  if (mbid) qp.push(`mbid=${encodeURIComponent(mbid)}`);
  if (artist) qp.push(`artist=${encodeURIComponent(artist)}`);
  if (track) qp.push(`track=${encodeURIComponent(track)}`);
  qp.push('autocorrect=1');
  const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&${qp.join('&')}&api_key=${LASTFM_API_KEY}&format=json`;
  const data = await fetchJSON(url);
  // Try album images from track info
  return pickLastfmImage(data?.track?.album?.image) || '';
}

export async function resolveAlbumImage(artist, album) {
  const key = `album:${artist}|${album}`.toLowerCase();
  const cached = cacheGet(key); if (cached) return cached;
  if (!artist || !album) return '';
  // Try iTunes first, then Deezer
  try { const u = await itunesAlbumArt(artist, album); if (u) { cacheSet(key, u); return u; } } catch {}
  try { const u = await deezerAlbumArt(artist, album); if (u) { cacheSet(key, u); return u; } } catch {}
  cacheSet(key, ''); return '';
}

export async function resolveTrackImage(artist, track) {
  const key = `track:${artist}|${track}`.toLowerCase();
  const cached = cacheGet(key); if (cached) return cached;
  if (!artist || !track) return '';
  // Try Last.fm first
  try { const u = await lastfmTrackArt(artist, track); if (u) { cacheSet(key, u); return u; } } catch {}
  try { const u = await itunesTrackArt(artist, track); if (u) { cacheSet(key, u); return u; } } catch {}
  try { const u = await deezerTrackArt(artist, track); if (u) { cacheSet(key, u); return u; } } catch {}
  cacheSet(key, ''); return '';
}

export async function resolveArtistImage(artist) {
  const key = `artist:${artist}`.toLowerCase();
  const cached = cacheGet(key); if (cached) return cached;
  if (!artist) return '';
  // Prefer Last.fm first (uses public API key)
  try { const u = await lastfmArtistArt(artist); if (u) { cacheSet(key, u); return u; } } catch {}
  // Fallback to Deezer
  try { const u = await deezerArtistArt(artist); if (u) { cacheSet(key, u); return u; } } catch {}
  // iTunes not reliable for artist images; skip
  cacheSet(key, ''); return '';
}
