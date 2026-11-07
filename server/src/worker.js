// Background worker:  npm run worker
//
// Two jobs, each on its own timer:
//   • ingest     — fetch the RSS feeds every INGEST_INTERVAL_MINUTES (15)
//   • translate  — translate queued stories to Urdu every minute
//                  (only when URDU_TRANSLATION=on — it costs money)
//
// Runs separately from the API server on purpose: slow feeds or AI calls can
// never make the website slow, and either process can be restarted alone.

import { config } from './config.js';
import { connectDB, disconnectDB } from './db.js';
import { formatStats, ingestAll } from './ingest/ingest.js';
import { createClient, formatTranslateStats, translateBatch } from './translate/translate.js';

const TRANSLATE_EVERY_MS = 60_000;

/** Run `job` on a timer, skipping a tick while the previous run is still going. */
function every(ms, name, job) {
  let running = false;
  const tick = async () => {
    if (running) return console.log(`[${name}] previous run still in progress — skipping`);
    running = true;
    try {
      await job();
    } catch (err) {
      console.error(`[${name}] run failed:`, err.message);
    } finally {
      running = false;
    }
  };
  tick();
  return setInterval(tick, ms);
}

const stamp = () => new Date().toLocaleTimeString();

try {
  await connectDB(config.mongoUri);
} catch (err) {
  console.error(`Could not connect to MongoDB at ${config.mongoUri}: ${err.message}`);
  process.exit(1);
}

const timers = [];
console.log(`Worker started — fetching feeds every ${config.ingestIntervalMinutes} min`);
timers.push(every(config.ingestIntervalMinutes * 60_000, 'ingest', async () => {
  console.log(`[ingest ${stamp()}] ${formatStats(await ingestAll())}`);
}));

if (config.urduTranslation) {
  const client = createClient();
  console.log(`Urdu translation ON — ${config.urduModel}, up to ${config.urduBatchSize} stories/min`);
  timers.push(every(TRANSLATE_EVERY_MS, 'translate', async () => {
    const stats = await translateBatch({ client, model: config.urduModel, limit: config.urduBatchSize });
    // Stay quiet when there was nothing to do
    if (stats.done || stats.failed || stats.retried || stats.stopped) {
      console.log(`[translate ${stamp()}] ${formatTranslateStats(stats, config.urduModel)}`);
    }
  }));
} else {
  console.log('Urdu translation OFF (set URDU_TRANSLATION=on in server/.env to enable)');
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    timers.forEach(clearInterval);
    await disconnectDB();
    process.exit(0);
  });
}
