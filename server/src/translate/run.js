// Translate a few queued articles now:   npm run translate -- --limit 5
// Useful to try translation (and check the cost) before turning it on in the
// worker. Works even when URDU_TRANSLATION is off — running it is the opt-in.

import { config } from '../config.js';
import { connectDB, disconnectDB } from '../db.js';
import { Article } from '../models/Article.js';
import { createClient, formatTranslateStats, translateBatch } from './translate.js';

const flag = process.argv.indexOf('--limit');
const limit = flag > -1 ? Math.max(1, Number(process.argv[flag + 1]) || 5) : 5;

try {
  await connectDB(config.mongoUri);
  const stats = await translateBatch({ client: createClient(), model: config.urduModel, limit, concurrency: Math.min(4, limit) });
  console.log(formatTranslateStats(stats, config.urduModel));
  const pending = await Article.countDocuments({ origin: 'rss', 'urdu.status': 'pending' });
  console.log(`${pending} articles still waiting for translation`);
  if (stats.stopped) {
    if (/authentication|api.?key/i.test(stats.stopped)) {
      console.log('→ Add your key to server/.env:  ANTHROPIC_API_KEY=sk-ant-...  (see server/.env.example)');
    }
    process.exitCode = 1;
  }
} catch (err) {
  console.error('Translation failed:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
