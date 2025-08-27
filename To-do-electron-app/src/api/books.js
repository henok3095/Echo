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

// Fetch a single Google Books volume and normalize it
export async function getBookDetails(volumeId) {
  if (!volumeId) throw new Error('Missing volumeId');
  const url = `https://www.googleapis.com/books/v1/volumes/${encodeURIComponent(volumeId)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch book details');
  const json = await res.json();
  return normalizeBook(json);
}

// Return counts for pages and chapters (Google Books does not expose chapters)
export async function getPageAndChapters(volumeId) {
  const book = await getBookDetails(volumeId);
  return {
    pageCount: book.pageCount ?? null,
    chapters: null,
  };
}

// Best-effort: search by title and author to get a pageCount when volume ID is unknown
export async function findPageCountByTitleAuthor(title, author) {
  const q = [];
  if (title) q.push(`intitle:${JSON.stringify(title).slice(1, -1)}`);
  if (author) q.push(`inauthor:${JSON.stringify(author).slice(1, -1)}`);
  if (q.length === 0) return null;
  const url = new URL('https://www.googleapis.com/books/v1/volumes');
  url.searchParams.set('q', q.join('+'));
  url.searchParams.set('maxResults', '3');
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const json = await res.json();
  const items = Array.isArray(json.items) ? json.items : [];
  for (const item of items) {
    const v = item?.volumeInfo || {};
    if (typeof v.pageCount === 'number' && v.pageCount > 0) return v.pageCount;
  }
  return null;
}
