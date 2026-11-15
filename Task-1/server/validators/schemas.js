const { z } = require('zod');
const { CATEGORIES, ORDER_STATUSES, MAX_QTY_PER_ITEM } = require('../config/constants');

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const page = z.coerce.number().int().min(1).default(1);
const limit = (def, max = 100) => z.coerce.number().int().min(1).max(max).default(def);

const idParam = z.object({ id: objectId });
const productIdParam = z.object({ productId: objectId });

// ── Auth ──────────────────────────────────────────────────────────────
const name = z.string().trim().min(2, 'Name must be at least 2 characters').max(60);
const email = z.string().trim().toLowerCase().email('Enter a valid email address');
const newPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password is too long')
  .regex(/[A-Za-z]/, 'Password must contain a letter')
  .regex(/\d/, 'Password must contain a number');

const register = z.object({ name, email, password: newPassword });
const login = z.object({ email, password: z.string().min(1, 'Password is required') });
const updateProfile = z.object({ name });
const changePassword = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword,
});

// ── Products ──────────────────────────────────────────────────────────
const productQuery = z.object({
  q: z.string().trim().max(100).optional(),
  category: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => (v === undefined ? undefined : [].concat(v).filter(Boolean))),
  brand: z.string().trim().max(60).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(['true', 'false']).optional(),
  sort: z.enum(['newest', 'price_asc', 'price_desc', 'top_rated', 'name']).default('newest'),
  page,
  limit: limit(12),
});

// Only http(s) links — z.url() alone would also accept javascript: URLs.
const imageUrl = z.string().trim().regex(/^https?:\/\/\S+$/i, 'Image must be an http(s) URL').max(500);

const productBody = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  description: z.string().trim().max(2000).default(''),
  price: z.coerce.number().min(1, 'Price must be at least ₹1').max(10000000),
  category: z.enum(CATEGORIES, { message: 'Choose a valid category' }),
  brand: z.string().trim().max(60).default('Generic'),
  images: z
    .array(imageUrl)
    .max(5, 'At most 5 images')
    .default([]),
  stock: z.coerce.number().int('Stock must be a whole number').min(0, 'Stock cannot be negative').max(100000),
});

// For updates every field is optional, and defaults must not overwrite
// stored values — so the schema is rebuilt without them.
const productUpdateBody = productBody
  .extend({
    description: z.string().trim().max(2000),
    brand: z.string().trim().max(60),
    images: z.array(imageUrl).max(5, 'At most 5 images'),
  })
  .partial();

// ── Orders ────────────────────────────────────────────────────────────
const orderBody = z.object({
  items: z
    .array(
      z.object({
        productId: objectId,
        quantity: z.coerce.number().int().min(1).max(MAX_QTY_PER_ITEM, `At most ${MAX_QTY_PER_ITEM} per item`),
      })
    )
    .min(1, 'Your cart is empty')
    .max(50),
  shippingAddress: z.object({
    name: z.string().trim().min(2, 'Enter the recipient name').max(60),
    phone: z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    address: z.string().trim().min(5, 'Enter the full street address').max(200),
    city: z.string().trim().min(2, 'Enter the city').max(60),
    state: z.string().trim().min(2, 'Enter the state').max(60),
    pincode: z.string().trim().regex(/^[1-9]\d{5}$/, 'Enter a valid 6-digit pincode'),
  }),
  paymentMethod: z.enum(['COD', 'CARD']).default('COD'),
});

const orderStatusBody = z.object({
  status: z.enum(ORDER_STATUSES, { message: 'Invalid status' }),
  note: z.string().trim().max(200).optional(),
});

const orderQuery = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  page,
  limit: limit(10),
});

// ── Reviews ───────────────────────────────────────────────────────────
const reviewBody = z.object({
  rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
  comment: z.string().trim().max(1000).default(''),
});

// ── Admin ─────────────────────────────────────────────────────────────
const userQuery = z.object({ q: z.string().trim().max(100).optional(), page, limit: limit(10) });
const roleBody = z.object({ role: z.enum(['user', 'admin']) });

module.exports = {
  idParam,
  productIdParam,
  register,
  login,
  updateProfile,
  changePassword,
  productQuery,
  productBody,
  productUpdateBody,
  orderBody,
  orderStatusBody,
  orderQuery,
  reviewBody,
  userQuery,
  roleBody,
};
