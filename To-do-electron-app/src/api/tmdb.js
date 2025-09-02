import axios from 'axios';

const apiKey = import.meta.env.VITE_TMDB_API_KEY;

// Always use TMDB API directly for now to avoid Vercel serverless function issues
const isProd = false;

export const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: { api_key: apiKey },
});

export async function searchMovies(query) {
  if (isProd) {
    const resp = await fetch(`/api/tmdb-search?type=movie&q=${encodeURIComponent(query)}`);
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = data?.error || data?.message || `TMDB search failed (${resp.status})`;
      throw new Error(msg);
    }
    return data.results || [];
  } else {
    const { data } = await tmdb.get('/search/movie', { params: { query } });
    return data.results;
  }
}

// Fetch TV season details including episode list
export async function getSeasonDetails(tvId, seasonNumber) {
  if (isProd) {
    const resp = await fetch(`/api/tmdb-details?type=tv_season&id=${encodeURIComponent(tvId)}&season=${encodeURIComponent(seasonNumber)}`);
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = data?.error || data?.message || `TMDB season details failed (${resp.status})`;
      throw new Error(msg);
    }
    return data;
  } else {
    const { data } = await tmdb.get(`/tv/${tvId}/season/${seasonNumber}`);
    return data;
  }
}

export async function searchTVShows(query) {
  if (isProd) {
    const resp = await fetch(`/api/tmdb-search?type=tv&q=${encodeURIComponent(query)}`);
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = data?.error || data?.message || `TMDB search failed (${resp.status})`;
      throw new Error(msg);
    }
    return data.results || [];
  } else {
    const { data } = await tmdb.get('/search/tv', { params: { query } });
    return data.results;
  }
}

export async function searchMulti(query) {
  if (isProd) {
    const resp = await fetch(`/api/tmdb-search?type=multi&q=${encodeURIComponent(query)}`);
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = data?.error || data?.message || `TMDB search failed (${resp.status})`;
      throw new Error(msg);
    }
    return (data.results || []).filter(item => item.media_type === 'movie' || item.media_type === 'tv');
  } else {
    const { data } = await tmdb.get('/search/multi', { params: { query } });
    // Filter to only include movies and TV shows
    return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
  }
}

export async function getMovieDetails(movieId) {
  if (isProd) {
    const resp = await fetch(`/api/tmdb-details?type=movie&id=${encodeURIComponent(movieId)}`);
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = data?.error || data?.message || `TMDB details failed (${resp.status})`;
      throw new Error(msg);
    }
    return data;
  } else {
    const { data } = await tmdb.get(`/movie/${movieId}`, {
      params: {
        append_to_response: 'credits'
      }
    });
    
    // Find director from crew
    const director = data.credits.crew.find(person => person.job === 'Director');
    
    return {
      ...data,
      director: director ? director.name : 'Unknown'
    };
  }
}

export async function getTVDetails(tvId) {
  if (isProd) {
    const resp = await fetch(`/api/tmdb-details?type=tv&id=${encodeURIComponent(tvId)}`);
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = data?.error || data?.message || `TMDB details failed (${resp.status})`;
      throw new Error(msg);
    }
    return data;
  } else {
    const { data } = await tmdb.get(`/tv/${tvId}`, {
      params: {
        append_to_response: 'credits'
      }
    });
    
    // For TV shows, get creator instead of director
    const creator = data.created_by && data.created_by.length > 0 ? data.created_by[0].name : 'Unknown';
    
    return {
      ...data,
      director: creator // Using director field for consistency
    };
  }
}

export async function getTopRatedTVShows(page = 1) {
  if (isProd) {
    const resp = await fetch(`/api/tmdb-top-rated?type=tv&page=${encodeURIComponent(page)}`);
    const data = await resp.json().catch(() => null);
    if (!resp.ok) {
      const msg = data?.error || data?.message || `TMDB top rated failed (${resp.status})`;
      throw new Error(msg);
    }
    return data.results || [];
  } else {
    const { data } = await tmdb.get('/tv/top_rated', { params: { page } });
    return data.results;
  }
}