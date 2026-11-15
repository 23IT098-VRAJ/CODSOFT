// Fills the catalogue with ~200 products (DummyJSON + a curated Books shelf)
// together with the customer reviews that come with them.
//
//   npm run seed        → wipes and re-creates the products and reviews collections
//
// The functions are exported so the zero-setup demo (scripts/demo.js) can
// reuse them against an in-memory database.
require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Product = require('./models/Product');
const Review = require('./models/Review');

const USD_TO_INR = 83;

const categoryMap = {
  smartphones: 'Electronics', laptops: 'Electronics', tablets: 'Electronics',
  'mobile-accessories': 'Electronics', 'mens-watches': 'Electronics',
  tops: 'Clothing', 'womens-dresses': 'Clothing', 'mens-shirts': 'Clothing',
  'mens-shoes': 'Clothing', 'womens-shoes': 'Clothing', 'womens-bags': 'Clothing',
  'womens-jewellery': 'Clothing', sunglasses: 'Clothing', 'womens-watches': 'Clothing',
  'home-decoration': 'Home', furniture: 'Home', lighting: 'Home',
  'kitchen-accessories': 'Home', groceries: 'Home', fragrances: 'Home',
  skincare: 'Home', beauty: 'Home',
  'sports-accessories': 'Sports', motorcycle: 'Sports', automotive: 'Sports', vehicle: 'Sports',
};

const cover = (isbn) => `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;

// Prices are in rupees.
const books = [
  { name: 'Atomic Habits', brand: 'Penguin Random House', price: 417, stock: 60, isbn: '0735211299', description: 'An easy and proven way to build good habits and break bad ones. James Clear distills the most fundamental information about habit formation.' },
  { name: 'The Psychology of Money', brand: 'Harriman House', price: 374, stock: 45, isbn: '0857197681', description: 'Timeless lessons on wealth, greed, and happiness. Morgan Housel shares 19 short stories exploring the strange ways people think about money.' },
  { name: 'Rich Dad Poor Dad', brand: 'Plata Publishing', price: 332, stock: 70, isbn: '1612680194', description: "What the rich teach their kids about money that the poor and middle class do not. Robert Kiyosaki's bestselling personal finance book." },
  { name: 'Sapiens: A Brief History of Humankind', brand: 'Harper Collins', price: 583, stock: 35, isbn: '0062316117', description: 'Yuval Noah Harari spans the whole of human history, from the very first humans to the breakthroughs of the Cognitive, Agricultural and Scientific Revolutions.' },
  { name: 'The Alchemist', brand: 'Harper One', price: 299, stock: 80, isbn: '0062315005', description: "Paulo Coelho's masterpiece tells the story of Santiago, an Andalusian shepherd boy who yearns to travel in search of worldly treasure." },
  { name: '1984', brand: 'Signet Classic', price: 249, stock: 55, isbn: '0451524934', description: "George Orwell's dystopian novel about a totalitarian society remains one of the most influential works of the 20th century." },
  { name: "Harry Potter and the Philosopher's Stone", brand: 'Bloomsbury', price: 532, stock: 90, isbn: '0439708184', description: 'Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive.' },
  { name: 'Deep Work', brand: 'Grand Central Publishing', price: 366, stock: 8, isbn: '1455586692', description: 'Rules for focused success in a distracted world. Cal Newport shows why the ability to do deep work is becoming both rare and valuable.' },
  { name: 'The Lean Startup', brand: 'Crown Business', price: 458, stock: 38, isbn: '0307887898', description: "How today's entrepreneurs use continuous innovation to create radically successful businesses, by Eric Ries." },
  { name: 'To Kill a Mockingbird', brand: 'Harper Perennial', price: 275, stock: 0, isbn: '0061120081', description: "Harper Lee's Pulitzer Prize-winning masterwork of honour and injustice in the deep South." },
].map(({ isbn, ...b }) => ({ ...b, category: 'Books', images: [cover(isbn)], reviews: [] }));

// Returns plain product objects, each with a `reviews` array attached.
async function buildCatalogue() {
  const { data } = await axios.get('https://dummyjson.com/products?limit=0', { timeout: 20000 });

  const apiProducts = data.products.map((p) => ({
    name: p.title,
    description: p.description,
    price: Math.round(p.price * USD_TO_INR),
    category: categoryMap[p.category] || 'Electronics',
    brand: p.brand || 'Generic',
    images: p.images?.length ? p.images.slice(0, 4) : [p.thumbnail],
    stock: p.stock ?? 25,
    reviews: (p.reviews || []).map((r) => ({
      userName: r.reviewerName,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.date,
    })),
  }));

  return [...apiProducts, ...books];
}

// Replaces the products and reviews collections with the given catalogue.
async function seedCatalogue(catalogue) {
  await Promise.all([Product.deleteMany({}), Review.deleteMany({})]);

  const products = await Product.insertMany(
    catalogue.map(({ reviews, ...p }) => {
      const count = reviews.length;
      const average = count ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / count) * 10) / 10 : 0;
      return { ...p, rating: { average, count } };
    })
  );

  const reviews = catalogue.flatMap((p, i) => p.reviews.map((r) => ({ ...r, productId: products[i]._id })));
  if (reviews.length) await Review.insertMany(reviews);

  return { products, reviewCount: reviews.length };
}

async function run() {
  try {
    if (!process.env.MONGO_URI) throw new Error('MONGO_URI is not set — copy .env.example to .env first');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const { products, reviewCount } = await seedCatalogue(await buildCatalogue());

    const summary = {};
    products.forEach((p) => { summary[p.category] = (summary[p.category] || 0) + 1; });
    console.log(`Seeded ${products.length} products and ${reviewCount} reviews`);
    console.table(summary);
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}

if (require.main === module) run();

module.exports = { buildCatalogue, seedCatalogue };
