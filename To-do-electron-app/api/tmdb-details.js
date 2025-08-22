// Vercel Serverless Function: TMDB details proxy
// Usage: /api/tmdb-details?type=movie|tv&id=123

module.exports = async (req, res) => {
  try {
    const { type, id } = req.query || {};
    const apiKey = process.env.TMDB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'TMDB_API_KEY is not configured on the server' });
    }
    if (!type || !id) {
      return res.status(400).json({ error: 'Missing type or id parameter' });
    }

    const endpoint = type === 'tv' ? `tv/${id}` : `movie/${id}`;
    const url = `https://api.themoviedb.org/3/${endpoint}?api_key=${encodeURIComponent(apiKey)}&append_to_response=credits`;

    const resp = await fetch(url);
    const data = await resp.json();
    if (!resp.ok) {
      return res.status(resp.status).json({ error: data?.status_message || 'TMDB error', details: data });
    }

    let director = 'Unknown';
    if (type === 'movie' && data?.credits?.crew) {
      const d = data.credits.crew.find((p) => p.job === 'Director');
      director = d ? d.name : 'Unknown';
    } else if (type === 'tv' && Array.isArray(data?.created_by) && data.created_by.length > 0) {
      director = data.created_by[0].name;
    }

    const payload = { ...data, director };

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');
    return res.status(200).json(payload);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error', message: err?.message || String(err) });
  }
};
