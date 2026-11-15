import { useEffect, useState } from 'react';

// Returns `value` only after it has stopped changing for `delay` ms —
// used so the search box does not fire a request on every keystroke.
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ShopIndi` : 'ShopIndi — Shop Everything';
  }, [title]);
}
