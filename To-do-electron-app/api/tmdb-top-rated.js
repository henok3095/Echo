
module.exports = async (req, res) => {
  try {
    const { type = 'movie', page = 1 } = req.query || {};
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not configured on the server' });
    }
    if (!['movie', 'tv'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type parameter. Must be movie or tv' });
    }

    const endpoint = type === 'movie' ? 'movie/top_rated' : 'tv/top_rated';
    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${encodeURIComponent(apiKey)}&page=${encodeURIComponent(page)}`;

    const axios = require('axios');
    const resp = await axios.get(url);
    const data = resp.data;

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(data);
  } catch (err) {
    const status = err?.response?.status || 500;
    const details = err?.response?.data || null;
    return res.status(status).json({ error: 'Proxy error', message: err?.message || String(err), details });
  }
};
