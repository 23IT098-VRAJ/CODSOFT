// A small in-memory cache for page data, so returning to a page shows it at
// once instead of flashing skeletons again ("no flash on return").
//
// Pattern (stale-while-revalidate): a page reads the cache for its first
// render, shows that immediately, then fetches fresh data in the background
// and swaps it in. The cache lives for the browser tab's lifetime only and is
// never written to disk.
const store = new Map();

export const readCache = (key) => store.get(key);
export const writeCache = (key, value) => {
  store.set(key, value);
  return value;
};
