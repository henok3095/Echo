import axios from 'axios';

const apiKey = import.meta.env.VITE_TMDB_API_KEY;

// In development, call TMDB directly with the public V3 key.
// In production (Vercel), call our serverless proxy to avoid client-side blocks and hide the key.
const isProd = import.meta.env.PROD;

export const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: { api_key: apiKey },
});

export async function searchMovies(query) {
  if (isProd) {
    const resp = await fetch(`/api/tmdb-search?type=movie&q=${encodeURIComponent(query)}`);
    if (!resp.ok) throw new Error('TMDB search failed');
    const data = await resp.json();
    return data.results || [];
  } else {
    const { data } = await tmdb.get('/search/movie', { params: { query } });
    return data.results;
  }
}

export async function searchTVShows(query) {
  if (isProd) {
    const resp = await fetch(`/api/tmdb-search?type=tv&q=${encodeURIComponent(query)}`);
    if (!resp.ok) throw new Error('TMDB search failed');
    const data = await resp.json();
    return data.results || [];
  } else {
    const { data } = await tmdb.get('/search/tv', { params: { query } });
    return data.results;
  }
}

export async function searchMulti(query) {
  if (isProd) {
    const resp = await fetch(`/api/tmdb-search?type=multi&q=${encodeURIComponent(query)}`);
    if (!resp.ok) throw new Error('TMDB search failed');
    const data = await resp.json();
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
    if (!resp.ok) throw new Error('TMDB details failed');
    const data = await resp.json();
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
    if (!resp.ok) throw new Error('TMDB details failed');
    const data = await resp.json();
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