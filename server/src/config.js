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
};
