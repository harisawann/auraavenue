// Tracks recently viewed product slugs in localStorage. This is a pure
// client-side convenience feature (not account data), so localStorage is
// the right tool here — unlike the in-app "Artifacts" sandbox restriction,
// this is a real deployed app where localStorage works normally.
const STORAGE_KEY = 'aura_avenue_recently_viewed';
const MAX_ITEMS = 10;

export function addRecentlyViewed(slug) {
  if (!slug) return;
  try {
    const current = getRecentlyViewed();
    const next = [slug, ...current.filter((s) => s !== slug)].slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // localStorage can fail in private browsing / storage-full edge cases;
    // recently-viewed is a non-critical feature, so fail silently.
  }
}

export function getRecentlyViewed() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
