// Simple Google Books search (no API key required for basic usage)
export async function searchBooks(query, maxResults = 10) {
  if (!query || !query.trim()) return [];
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', query.trim());
  url.searchParams.set('maxResults', String(maxResults));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to search books');
  const json = await res.json();
  const items = Array.isArray(json.items) ? json.items : [];
  return items.map((item) => normalizeBook(item));
}

export function normalizeBook(item) {
  const v = item?.volumeInfo || {};
  const pickBestImage = (imageLinks) => {
    if (!imageLinks) return '';
    const order = ['extraLarge', 'large', 'medium', 'small', 'thumbnail', 'smallThumbnail'];
    let url = '';
    for (const key of order) {
      if (imageLinks[key]) { url = imageLinks[key]; break; }
    }
    if (!url) return '';
    // Prefer HTTPS
    if (url.startsWith('http://')) url = url.replace('http://', 'https://');
    // If Google Books content URL with zoom parameter, bump zoom for higher quality
    try {
      const u = new URL(url);
      if (u.hostname.includes('googleusercontent.com') || u.hostname.includes('books.google.com')) {
        if (u.searchParams.has('zoom')) {
          // 0=~1280, 1=~800, 2=~400, 3=~200 depending on source; choose 2 for balance, 1 if you need larger
          u.searchParams.set('zoom', '2');
        }
        // Remove edge=curl (adds fake page curl) if present
        if (u.searchParams.has('edge')) u.searchParams.delete('edge');
        url = u.toString();
      }
    } catch {}
    return url;
  };
  return {
    id: item.id,
    title: v.title || 'Untitled',
    subtitle: v.subtitle || '',
    authors: v.authors || [],
    publishedDate: v.publishedDate || '',
    description: v.description || '',
    pageCount: v.pageCount || null,
    categories: v.categories || [],
    image: pickBestImage(v.imageLinks),
    language: v.language || '',
    previewLink: v.previewLink || '',
    infoLink: v.infoLink || '',
    googleBooksId: item.id,
  };
}
