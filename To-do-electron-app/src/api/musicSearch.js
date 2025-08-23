// Simple music search helpers using public APIs (iTunes primary, Deezer fallback)
// Normalized result shape:
// {
//   type: 'track' | 'album',
//   title: string,          // track or album title
//   artist: string,
//   album: string | null,   // for track results
//   year: string | null,
//   cover: string | null,   // artwork url
//   source: 'itunes' | 'deezer'
// }

const ITUNES_BASE = 'https://itunes.apple.com/search';
const DEEZER_BASE = 'https://api.deezer.com/search';

function yearFromDate(dateStr) {
  if (!dateStr) return null;
  try {
    return new Date(dateStr).getFullYear().toString();
  } catch (_) {
    return null;
  }
}

function normalizeItunesTrack(item) {
  return {
    type: 'track',
    title: item.trackName || item.collectionName || item.artistName || 'Unknown',
    artist: item.artistName || '',
    album: item.collectionName || null,
    year: yearFromDate(item.releaseDate),
    cover: item.artworkUrl100?.replace('100x100', '300x300') || null,
    source: 'itunes',
  };
}

function normalizeItunesAlbum(item) {
  return {
    type: 'album',
    title: item.collectionName || item.artistName || 'Unknown',
    artist: item.artistName || '',
    album: item.collectionName || null,
    year: yearFromDate(item.releaseDate),
    cover: item.artworkUrl100?.replace('100x100', '300x300') || null,
    source: 'itunes',
  };
}

function normalizeDeezerTrack(item) {
  return {
    type: 'track',
    title: item.title || 'Unknown',
    artist: item.artist?.name || '',
    album: item.album?.title || null,
    year: null,
    cover: item.album?.cover_medium || item.album?.cover || null,
    source: 'deezer',
  };
}

function normalizeDeezerAlbum(item) {
  return {
    type: 'album',
    title: item.title || 'Unknown',
    artist: item.artist?.name || '',
    album: item.title || null,
    year: null,
    cover: item.cover_medium || item.cover || null,
    source: 'deezer',
  };
}

export async function searchTracks(query, limit = 10) {
  if (!query || !query.trim()) return [];
  const q = encodeURIComponent(query.trim());

  // Try iTunes first
  try {
    const res = await fetch(`${ITUNES_BASE}?term=${q}&entity=musicTrack&limit=${limit}`);
    const data = await res.json();
    if (Array.isArray(data.results) && data.results.length) {
      return data.results.map(normalizeItunesTrack);
    }
  } catch (_) {}

  // Fallback: Deezer
  try {
    const res = await fetch(`${DEEZER_BASE}?q=${q}&limit=${limit}`);
    const data = await res.json();
    if (Array.isArray(data.data) && data.data.length) {
      return data.data.map(normalizeDeezerTrack);
    }
  } catch (_) {}

  return [];
}

export async function searchAlbums(query, limit = 10) {
  if (!query || !query.trim()) return [];
  const q = encodeURIComponent(query.trim());

  // iTunes albums
  try {
    const res = await fetch(`${ITUNES_BASE}?term=${q}&entity=album&limit=${limit}`);
    const data = await res.json();
    if (Array.isArray(data.results) && data.results.length) {
      return data.results.map(normalizeItunesAlbum);
    }
  } catch (_) {}

  // Deezer albums
  try {
    const res = await fetch(`https://api.deezer.com/search/album?q=${q}&limit=${limit}`);
    const data = await res.json();
    if (Array.isArray(data.data) && data.data.length) {
      return data.data.map(normalizeDeezerAlbum);
    }
  } catch (_) {}

  return [];
}

// Combined search helper (tracks first, then albums)
export async function searchMusic(query, limitPerType = 10) {
  const [tracks, albums] = await Promise.all([
    searchTracks(query, limitPerType),
    searchAlbums(query, limitPerType),
  ]);
  return { tracks, albums };
}
