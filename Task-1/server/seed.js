const mongoose = require('mongoose');
const dotenv = require('dotenv');
const axios = require('axios');
const Product = require('./models/Product');

dotenv.config();

const categoryMap = {
  'smartphones': 'Electronics', 'laptops': 'Electronics', 'tablets': 'Electronics',
  'mobile-accessories': 'Electronics', 'mens-watches': 'Electronics',
  'tops': 'Clothing', 'womens-dresses': 'Clothing', 'mens-shirts': 'Clothing',
  'mens-shoes': 'Clothing', 'womens-shoes': 'Clothing', 'womens-bags': 'Clothing',
  'womens-jewellery': 'Clothing', 'sunglasses': 'Clothing', 'womens-watches': 'Clothing',
  'home-decoration': 'Home', 'furniture': 'Home', 'lighting': 'Home',
  'kitchen-accessories': 'Home', 'groceries': 'Home', 'fragrances': 'Home',
  'skincare': 'Home', 'beauty': 'Home',
  'sports-accessories': 'Sports', 'motorcycle': 'Sports', 'automotive': 'Sports', 'vehicle': 'Sports',
};

const manualBooks = [
  { name: 'Atomic Habits', description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. James Clear distills the most fundamental information about habit formation.', price: 41700, category: 'Books', brand: 'Penguin Random House', images: ['https://covers.openlibrary.org/b/isbn/0735211299-L.jpg'], stock: 60, rating: { average: 4.8, count: 15234 } },
  { name: 'The Psychology of Money', description: 'Timeless lessons on wealth, greed, and happiness. Morgan Housel shares 19 short stories exploring the strange ways people think about money.', price: 37400, category: 'Books', brand: 'Harriman House', images: ['https://covers.openlibrary.org/b/isbn/0857197681-L.jpg'], stock: 45, rating: { average: 4.7, count: 9823 } },
  { name: 'Rich Dad Poor Dad', description: 'What the Rich Teach Their Kids About Money That the Poor and Middle Class Do Not! Robert Kiyosaki\'s #1 bestselling personal finance book.', price: 33200, category: 'Books', brand: 'Plata Publishing', images: ['https://covers.openlibrary.org/b/isbn/1612680194-L.jpg'], stock: 70, rating: { average: 4.5, count: 20431 } },
  { name: 'Sapiens: A Brief History of Humankind', description: 'Yuval Noah Harari spans the whole of human history, from the very first humans to the radical breakthroughs of the Cognitive, Agricultural and Scientific Revolutions.', price: 58300, category: 'Books', brand: 'Harper Collins', images: ['https://covers.openlibrary.org/b/isbn/0062316117-L.jpg'], stock: 35, rating: { average: 4.6, count: 12341 } },
  { name: 'The Alchemist', description: 'Paulo Coelho\'s masterpiece tells the story of Santiago, an Andalusian shepherd boy who yearns to travel in search of worldly treasure.', price: 29900, category: 'Books', brand: 'Harper One', images: ['https://covers.openlibrary.org/b/isbn/0062315005-L.jpg'], stock: 80, rating: { average: 4.7, count: 34120 } },
  { name: '1984', description: 'George Orwell\'s dystopian novel about a totalitarian society controlled by "Big Brother" remains one of the most influential works of the 20th century.', price: 24900, category: 'Books', brand: 'Signet Classic', images: ['https://covers.openlibrary.org/b/isbn/0451524934-L.jpg'], stock: 55, rating: { average: 4.8, count: 28765 } },
  { name: 'Harry Potter and the Philosopher\'s Stone', description: 'Harry Potter has never even heard of Hogwarts when the letters start dropping on the doormat at number four, Privet Drive.', price: 53200, category: 'Books', brand: 'Bloomsbury', images: ['https://covers.openlibrary.org/b/isbn/0439708184-L.jpg'], stock: 90, rating: { average: 4.9, count: 45890 } },
  { name: 'Deep Work', description: 'Rules for Focused Success in a Distracted World. Cal Newport demonstrates that the ability to perform deep work is becoming increasingly rare at exactly the same time it is becoming increasingly valuable.', price: 36600, category: 'Books', brand: 'Grand Central Publishing', images: ['https://covers.openlibrary.org/b/isbn/1455586692-L.jpg'], stock: 42, rating: { average: 4.6, count: 7654 } },
  { name: 'The Lean Startup', description: 'How Today\'s Entrepreneurs Use Continuous Innovation to Create Radically Successful Businesses by Eric Ries.', price: 45800, category: 'Books', brand: 'Crown Business', images: ['https://covers.openlibrary.org/b/isbn/0307887898-L.jpg'], stock: 38, rating: { average: 4.4, count: 6234 } },
  { name: 'To Kill a Mockingbird', description: 'Harper Lee\'s Pulitzer Prize-winning masterwork of honor and injustice in the deep South—and the heroism of one man in the face of blind and violent hatred.', price: 27500, category: 'Books', brand: 'Harper Perennial', images: ['https://covers.openlibrary.org/b/isbn/0061935462-L.jpg'], stock: 50, rating: { average: 4.8, count: 19876 } },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Fetch ALL products from DummyJSON (limit=0 returns all ~194)
    const { data } = await axios.get('https://dummyjson.com/products?limit=0');
    const raw = data.products;

    const apiProducts = raw.map((p) => ({
      name: p.title,
      description: p.description,
      price: Math.round(p.price * 83),
      category: categoryMap[p.category] || 'Electronics',
      brand: p.brand || 'Generic',
      images: p.images && p.images.length > 0 ? p.images.slice(0, 3) : [p.thumbnail],
      stock: p.stock || Math.floor(Math.random() * 80) + 10,
      rating: {
        average: parseFloat((p.rating || (Math.random() * 1.5 + 3.5)).toFixed(1)),
        count: Math.floor(Math.random() * 190) + 20,
      },
    }));

    const allProducts = [...apiProducts, ...manualBooks];

    await Product.deleteMany({});
    await Product.insertMany(allProducts);
    console.log(`✅ Seeded ${allProducts.length} products (${apiProducts.length} from DummyJSON + ${manualBooks.length} books)`);

    // Summary by category
    const summary = {};
    allProducts.forEach((p) => { summary[p.category] = (summary[p.category] || 0) + 1; });
    console.log('📊 By category:', summary);
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
