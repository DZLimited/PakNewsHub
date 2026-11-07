// One-off ingestion run:  npm run ingest
// Fetches every feed once, saves new stories, prints a summary and exits.

import { config } from '../config.js';
import { connectDB, disconnectDB } from '../db.js';
import { formatStats, ingestAll } from './ingest.js';

try {
  await connectDB(config.mongoUri);
  console.log(formatStats(await ingestAll()));
} catch (err) {
  console.error('Ingestion failed:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}
