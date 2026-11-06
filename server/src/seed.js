// Loads the demo data (shared with the frontend's mock mode) into MongoDB.
//   npm run seed          (from /server)   or   npm run seed  (from project root)
//
// Articles, sources and categories are replaced; subscribers are untouched.
// Article dates are shifted so the newest story is ~10 minutes old, which
// keeps the "Last hour / Last 24h" filters meaningful.

import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { connectDB, disconnectDB } from './db.js';
import { Article } from './models/Article.js';
import { Source } from './models/Source.js';
import { Category } from './models/Category.js';
import { articles, rebaseToNow } from '../../src/data/articles.js';
import { sources } from '../../src/data/sources.js';
import { categories } from '../../src/data/categories.js';

export async function seedDatabase() {
  await Promise.all([Article.deleteMany({}), Source.deleteMany({}), Category.deleteMany({})]);
  await Category.insertMany(categories);
  await Source.insertMany(sources);
  await Article.insertMany(rebaseToNow(articles));
  await Article.syncIndexes();
  return { articles: articles.length, sources: sources.length, categories: categories.length };
}

// Run only when executed directly (not when imported by tests)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await connectDB(config.mongoUri);
    const counts = await seedDatabase();
    console.log(`Seeded ${counts.articles} articles, ${counts.sources} sources, ${counts.categories} categories.`);
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}
