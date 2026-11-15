const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

export const formatINR = (amount) => inr.format(amount || 0);

// ₹1.2L / ₹45k — short labels for chart axes.
export const formatCompactINR = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${Math.round(amount / 1000)}k`;
  return `₹${amount}`;
};

export const formatDate = (date, withTime = false) =>
  new Date(date).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  });

export const orderNumber = (id) => `#${String(id).slice(-6).toUpperCase()}`;

// Inline SVG placeholder, so a broken product image never depends on a
// third-party service.
export const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#EDE5D0"/>' +
      '<path d="M60 130l28-34 20 24 14-16 18 26z" fill="#c9bd9e"/><circle cx="78" cy="76" r="10" fill="#c9bd9e"/></svg>'
  );

export const onImgError = (e) => {
  if (e.currentTarget.src !== PLACEHOLDER_IMG) e.currentTarget.src = PLACEHOLDER_IMG;
};

// Must match server/config/constants.js — the server always has the final say.
export const FREE_SHIPPING_THRESHOLD = 999;
export const SHIPPING_FEE = 99;
export const MAX_QTY_PER_ITEM = 10;
export const shippingFeeFor = (itemsTotal) => (itemsTotal > FREE_SHIPPING_THRESHOLD || itemsTotal === 0 ? 0 : SHIPPING_FEE);

export const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];
