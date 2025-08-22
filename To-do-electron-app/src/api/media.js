import axios from 'axios';

export const tmdb = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  params: { api_key: process.env.REACT_APP_TMDB_API_KEY },
});

export const spotify = axios.create({
  baseURL: 'https://api.spotify.com/v1',
  headers: { Authorization: `Bearer ${process.env.REACT_APP_SPOTIFY_TOKEN}` },
});

export const lastfm = axios.create({
  baseURL: 'https://ws.audioscrobbler.com/2.0/',
  params: { api_key: process.env.REACT_APP_LASTFM_API_KEY, format: 'json' },
});
