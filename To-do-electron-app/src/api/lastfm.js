// Echo/src/api/lastfm.js
import { resolveArtistImage, resolveTrackImage } from '../utils/artwork';

export const API_KEY = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_LASTFM_API_KEY)
  ? import.meta.env.VITE_LASTFM_API_KEY
  : null; // Remove hardcoded fallback API key
const API_URL = "https://ws.audioscrobbler.com/2.0/";

// pick the largest url from Last.fm image arrays
const pickImage = (arr) => {
  if (!Array.isArray(arr)) return '';
  for (let i = arr.length - 1; i >= 0; i--) {
    const it = arr[i];
    const url = (it && (it['#text'] || it)) || '';
    if (url) return url;
  }
  return '';
};

// simple bounded concurrency
async function mapWithLimit(items, limit, mapper) {
  const results = new Array(items.length);
  let i = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await mapper(items[idx], idx);
      } catch {
        results[idx] = await mapper(items[idx], idx); // best effort
      }
    }
  });
  await Promise.all(workers);
  return results;
}

export async function fetchRecentTracks(username, limit = 10) {
  const res = await fetch(
    `${API_URL}?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=${limit}`
  );
  const data = await res.json();
  return data.recenttracks?.track || [];
}

export async function fetchTopArtists(username, period = "7day", limit = 5) {
  const res = await fetch(
    `${API_URL}?method=user.gettopartists&user=${username}&api_key=${API_KEY}&format=json&period=${period}&limit=${limit}`
  );
  const data = await res.json();
  const artists = data.topartists?.artist || [];
  // hydrate with imageUrl
  const hydrated = await mapWithLimit(artists, 4, async (a) => {
    const existing = pickImage(a?.image);
    if (existing) return { ...a, imageUrl: existing };
    const url = await resolveArtistImage(a?.name);
    return { ...a, imageUrl: url || '' };
  });
  return hydrated;
}

export async function fetchTopAlbums(username, period = "7day", limit = 5) {
  const res = await fetch(
    `${API_URL}?method=user.gettopalbums&user=${username}&api_key=${API_KEY}&format=json&period=${period}&limit=${limit}`
  );
  const data = await res.json();
  return data.topalbums?.album || [];
}

export async function fetchTopTracks(username, period = "7day", limit = 10) {
  const res = await fetch(
    `${API_URL}?method=user.gettoptracks&user=${username}&api_key=${API_KEY}&format=json&period=${period}&limit=${limit}`
  );
  const data = await res.json();
  const tracks = data.toptracks?.track || [];
  const hydrated = await mapWithLimit(tracks, 4, async (t) => {
    const title = t?.name || t?.track;
    const artistName = t?.artist?.name || t?.artist?.['#text'] || t?.artist;
    const existing = pickImage(t?.image);
    if (existing) return { ...t, imageUrl: existing };
    if (artistName && title) {
      const url = await resolveTrackImage(artistName, title);
      return { ...t, imageUrl: url || '' };
    }
    return { ...t, imageUrl: '' };
  });
  return hydrated;
}

export async function fetchTotalListeningMinutes(username, period = "7day") {
  // Fetch top tracks and sum their playcounts * duration
  const res = await fetch(
    `${API_URL}?method=user.gettoptracks&user=${username}&api_key=${API_KEY}&format=json&period=${period}&limit=100`
  );
  const data = await res.json();
  const tracks = data.toptracks?.track || [];
  let totalSeconds = 0;
  for (const track of tracks) {
    const playcount = parseInt(track.playcount, 10) || 0;
    const duration = parseInt(track.duration, 10) || 0;
    totalSeconds += playcount * duration;
  }
  return Math.round(totalSeconds / 60); // minutes
}

export async function fetchNowPlaying(username) {
  try {
    const res = await fetch(
      `${API_URL}?method=user.getrecenttracks&user=${username}&api_key=${API_KEY}&format=json&limit=1`
    );
    const data = await res.json();
    const tracks = data.recenttracks?.track || [];
    
    // Check if the most recent track is currently playing
    if (tracks.length > 0) {
      const track = Array.isArray(tracks) ? tracks[0] : tracks;
      if (track['@attr'] && track['@attr'].nowplaying === 'true') {
        return {
          isPlaying: true,
          track: {
            name: track.name,
            artist: track.artist['#text'] || track.artist,
            album: track.album['#text'] || track.album,
            image: track.image?.[3]?.['#text'] || track.image?.[2]?.['#text'] || track.image?.[1]?.['#text'] || '',
            url: track.url
          }
        };
      }
    }
    
    return { isPlaying: false, track: null };
  } catch (error) {
    console.error('Error fetching now playing:', error);
    return { isPlaying: false, track: null };
  }
}