import { config } from './config.js';
import { connectDB, disconnectDB } from './db.js';
import { createApp } from './app.js';

try {
  await connectDB(config.mongoUri);
} catch (err) {
  console.error(`\nCould not connect to MongoDB at ${config.mongoUri}`);
  console.error(`→ ${err.message}`);
  console.error('Start MongoDB locally or set MONGODB_URI in server/.env (e.g. a MongoDB Atlas URI).\n');
  process.exit(1);
}

const server = createApp().listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}/api`);
});

// Graceful shutdown (Ctrl+C, container stop)
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
  });
}
