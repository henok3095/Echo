import axios from 'axios';

const apiKey = import.meta.env.VITE_TMDB_API_KEY;

export const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: { api_key: apiKey },
});

export async function searchMovies(query) {
  const { data } = await tmdb.get('/search/movie', { params: { query } });
  return data.results;
}

export async function searchTVShows(query) {
  const { data } = await tmdb.get('/search/tv', { params: { query } });
  return data.results;
}

export async function searchMulti(query) {
  const { data } = await tmdb.get('/search/multi', { params: { query } });
  // Filter to only include movies and TV shows
  return data.results.filter(item => item.media_type === 'movie' || item.media_type === 'tv');
}

export async function getMovieDetails(movieId) {
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

export async function getTVDetails(tvId) {
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