// Multi-source artwork resolver (no auth): iTunes + Deezer
// - Resolves artist, album, and track images
// - LocalStorage caching and gentle rate limiting

const CACHE_KEY = 'artwork_cache_v1';
const RATE_DELAY_MS = 900;
let lastRequestAt = 0;

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
  try { const u = await itunesTrackArt(artist, track); if (u) { cacheSet(key, u); return u; } } catch {}
  try { const u = await deezerTrackArt(artist, track); if (u) { cacheSet(key, u); return u; } } catch {}
  cacheSet(key, ''); return '';
}

export async function resolveArtistImage(artist) {
  const key = `artist:${artist}`.toLowerCase();
  const cached = cacheGet(key); if (cached) return cached;
  if (!artist) return '';
  try { const u = await deezerArtistArt(artist); if (u) { cacheSet(key, u); return u; } } catch {}
  // iTunes not reliable for artist images; skip
  cacheSet(key, ''); return '';
}
