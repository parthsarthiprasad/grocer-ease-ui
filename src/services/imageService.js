// Simple image fetcher using OpenFoodFacts with in-memory cache

const memoryCache = new Map();

function cacheKey(name, barcode) {
  return `img::${(barcode || '').trim()}::${(name || '').toLowerCase().trim()}`;
}

async function fetchByBarcode(barcode) {
  if (!barcode) return null;
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`);
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.product || {};
    return (
      p.image_front_small_url ||
      p.image_small_url ||
      p.image_url ||
      null
    );
  } catch (_) {
    return null;
  }
}

async function fetchByName(name) {
  if (!name) return null;
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(name)}&search_simple=1&action=process&json=1&page_size=1`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const prod = Array.isArray(data?.products) && data.products[0];
    if (!prod) return null;
    return prod.image_small_url || prod.image_url || null;
  } catch (_) {
    return null;
  }
}

export async function getImageForItem({ name, barcode }) {
  const key = cacheKey(name, barcode);
  if (memoryCache.has(key)) return memoryCache.get(key);
  let url = null;
  // Prefer barcode when present
  url = await fetchByBarcode(barcode);
  if (!url) url = await fetchByName(name);
  if (!url) url = 'https://via.placeholder.com/40?text=%F0%9F%8D%8E';
  memoryCache.set(key, url);
  return url;
}

export function primeCache({ name, barcode, image_url }) {
  if (!image_url) return;
  const key = cacheKey(name, barcode);
  if (!memoryCache.has(key)) {
    memoryCache.set(key, image_url);
  }
}

export default { getImageForItem, primeCache };


