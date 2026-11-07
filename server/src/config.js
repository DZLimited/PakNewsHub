import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/paknewshub',
  // Comma-separated list of allowed browser origins (only needed when the
  // frontend is NOT served through the Vite proxy or by this server).
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === 'production',
  // How often the worker fetches the RSS feeds
  ingestIntervalMinutes: Math.max(1, Number(process.env.INGEST_INTERVAL_MINUTES) || 15),

  // Urdu translation with Claude. OFF unless explicitly enabled, because every
  // translation is a paid API call. Needs ANTHROPIC_API_KEY in server/.env.
  urduTranslation: process.env.URDU_TRANSLATION === 'on',
  urduModel: process.env.URDU_MODEL || 'claude-opus-5-5',
  // Articles translated per worker tick (one tick per minute)
  urduBatchSize: Math.max(1, Number(process.env.URDU_BATCH_SIZE) || 20),
};
