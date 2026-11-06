import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { config } from './config.js';
import { articlesRouter } from './routes/articles.js';
import { metaRouter } from './routes/meta.js';
import { subscribersRouter } from './routes/subscribers.js';
import { errorHandler, notFound } from './middleware/errors.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));

  // ── API ───────────────────────────────────────────────
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });
  app.use('/api/articles', articlesRouter);
  app.use('/api/subscribers', subscribersRouter);
  app.use('/api', metaRouter);
  app.use('/api', notFound);

  // ── Frontend (production) ─────────────────────────────
  // After `npm run build` in the project root, this server can host the
  // React app too: static files from ../dist, and index.html for any other
  // path so client-side routes like /article/12 work on refresh.
  if (config.isProduction) {
    const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dist');
    app.use(express.static(dist));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  app.use(errorHandler);
  return app;
}
