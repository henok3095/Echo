// Cover Art fallback via MusicBrainz + Cover Art Archive
// - Adds simple localStorage cache and basic throttling

const CACHE_KEY = "cover_art_cache_v1";
const RATE_DELAY_MS = 1200; // be nice to MusicBrainz
let lastRequestAt = 0;

function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveCache(cache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {}
}

function cacheGet(key) {
  const cache = loadCache();
  return cache[key] || "";
}
function cacheSet(key, value) {
  const cache = loadCache();
  cache[key] = value;
  saveCache(cache);
}

async function rateLimit() {
  const now = Date.now();
  const elapsed = now - lastRequestAt;
  if (elapsed < RATE_DELAY_MS) {
    await new Promise((res) => setTimeout(res, RATE_DELAY_MS - elapsed));
  }
  lastRequestAt = Date.now();
}

async function fetchJSON(url) {
  await rateLimit();
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function getCAAFrontFromRG(mbid) {
  try {
    const data = await fetchJSON(`https://coverartarchive.org/release-group/${mbid}`);
    const front = data?.images?.find(img => img.front);
    return (
      front?.thumbnails?.small ||
      front?.thumbnails?.large ||
      front?.thumbnails?.["250"] ||
      front?.thumbnails?.["500"] ||
      front?.image ||
      ""
    );
  } catch (e) {
    return "";
  }
}

async function getCAAFrontFromRelease(mbid) {
  try {
    const data = await fetchJSON(`https://coverartarchive.org/release/${mbid}`);
    const front = data?.images?.find(img => img.front);
    return (
      front?.thumbnails?.small ||
      front?.thumbnails?.large ||
      front?.thumbnails?.["250"] ||
      front?.thumbnails?.["500"] ||
      front?.image ||
      ""
    );
  } catch (e) {
    return "";
  }
}

export async function resolveAlbumCover(artist, album) {
  const key = `album:${artist}|${album}`.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return cached;
  if (!artist || !album) return "";

  try {
    // Search release-group
    const query = encodeURIComponent(`release:"${album}" AND artist:"${artist}"`);
    const rgUrl = `https://musicbrainz.org/ws/2/release-group/?query=${query}&fmt=json&limit=1`;
    const rg = await fetchJSON(rgUrl);
    const mbid = rg?.["release-groups"]?.[0]?.id;
    if (mbid) {
      // Try RG art
      const url = await getCAAFrontFromRG(mbid);
      if (url) {
        console.log('[CAA] RG hit', { artist, album, mbid, url });
        cacheSet(key, url);
        return url;
      }
      // Try first release
      const rgDetail = await fetchJSON(`https://musicbrainz.org/ws/2/release-group/${mbid}?inc=releases&fmt=json`);
      const releaseId = rgDetail?.releases?.[0]?.id;
      if (releaseId) {
        const relUrl = await getCAAFrontFromRelease(releaseId);
        if (relUrl) {
          console.log('[CAA] Release hit', { artist, album, releaseId, url: relUrl });
          cacheSet(key, relUrl);
          return relUrl;
        }
      }
    }
  } catch {
    // swallow
  }
  console.warn('[CAA] Album miss', { artist, album });
  cacheSet(key, "");
  return "";
}

export async function resolveTrackCover(artist, track) {
  // Attempt via recording -> release -> CAA
  const key = `track:${artist}|${track}`.toLowerCase();
  const cached = cacheGet(key);
  if (cached) return cached;
  if (!artist || !track) return "";

  try {
    const query = encodeURIComponent(`recording:"${track}" AND artist:"${artist}"`);
    const recUrl = `https://musicbrainz.org/ws/2/recording/?query=${query}&fmt=json&limit=1&inc=releases`;
    const rec = await fetchJSON(recUrl);
    const recording = rec?.recordings?.[0];
    const releaseId = recording?.releases?.[0]?.id;
    if (releaseId) {
      const url = await getCAAFrontFromRelease(releaseId);
      if (url) {
        console.log('[CAA] Track release hit', { artist, track, releaseId, url });
        cacheSet(key, url);
        return url;
      }
    }
  } catch {
    // swallow
  }
  console.warn('[CAA] Track miss', { artist, track });
  cacheSet(key, "");
  return "";
}
