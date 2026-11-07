// Loads sources, categories and (optionally) the demo articles into MongoDB.
//
//   npm run seed              sources + categories + 34 demo articles
//   npm run seed:real-only    sources + categories, and REMOVES demo articles
//                             (use this once real news is flowing in)
//
// Real articles fetched by the ingester (origin: 'rss') and subscribers are
// never touched. Demo dates are shifted so the newest story is ~10 minutes old,
// which keeps the "Last hour / Last 24h" filters meaningful.

import { pathToFileURL } from 'node:url';
import { config } from './config.js';
import { connectDB, disconnectDB } from './db.js';
import { Article } from './models/Article.js';
import { Source } from './models/Source.js';
import { Category } from './models/Category.js';
import { articles, rebaseToNow } from '../../src/data/articles.js';
import { sources } from '../../src/data/sources.js';
import { categories } from '../../src/data/categories.js';

// Demo articles were inserted before the `origin` field existed, so "not rss"
// (rather than "origin: demo") is what identifies them.
const DEMO = { origin: { $ne: 'rss' } };

export async function seedDatabase({ demo = true } = {}) {
  await Promise.all([Article.deleteMany(DEMO), Source.deleteMany({}), Category.deleteMany({})]);
  await Category.insertMany(categories);
  await Source.insertMany(sources);
  if (demo) await Article.insertMany(rebaseToNow(articles).map(a => ({ ...a, origin: 'demo' })));
  await Article.syncIndexes();
  return {
    demoArticles: demo ? articles.length : 0,
    realArticles: await Article.countDocuments({ origin: 'rss' }),
    sources: sources.length,
    categories: categories.length,
  };
}

// Run only when executed directly (not when imported by tests)
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    await connectDB(config.mongoUri);
    const counts = await seedDatabase({ demo: !process.argv.includes('--no-demo') });
    console.log(
      `Seeded ${counts.sources} sources, ${counts.categories} categories, ${counts.demoArticles} demo articles` +
      ` (kept ${counts.realArticles} real articles).`
    );
  } catch (err) {
    console.error('Seeding failed:', err.message);
    process.exitCode = 1;
  } finally {
    await disconnectDB();
  }
}
