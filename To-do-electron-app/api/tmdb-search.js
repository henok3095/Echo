// Vercel Serverless Function: TMDB search proxy
// Endpoint: /api/tmdb-search?q=QUERY&type=multi|movie|tv

module.exports = async (req, res) => {
  try {
    const { q = '', type = 'multi' } = req.query || {};
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not configured on the server' });
    }
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Missing q parameter' });
    }

    const endpoint = type === 'movie' ? 'search/movie' : type === 'tv' ? 'search/tv' : 'search/multi';
    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${encodeURIComponent(apiKey)}&query=${encodeURIComponent(q)}`;

    const axios = require('axios');
    const resp = await axios.get(url);
    const data = resp.data;

    // Filter only movie/tv for multi to match client expectations
    if (endpoint === 'search/multi' && Array.isArray(data?.results)) {
      data.results = data.results.filter((item) => item.media_type === 'movie' || item.media_type === 'tv');
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    const status = err?.response?.status || 500;
    const details = err?.response?.data || null;
    return res.status(status).json({ error: 'Proxy error', message: err?.message || String(err), details });
  }
};
