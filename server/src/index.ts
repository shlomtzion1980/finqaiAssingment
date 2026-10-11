import fs from 'node:fs';
import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { openDatabase } from './db.js';
import { createSqliteProfileRepository } from './profiles/profile.repository.js';
import { ProfileService } from './profiles/profile.service.js';

if (fs.existsSync('.env')) process.loadEnvFile('.env');

const config = loadConfig();
const db = openDatabase(config.dbFile);
const profileService = new ProfileService(createSqliteProfileRepository(db));
const app = createApp({ profileService, corsOrigins: config.corsOrigins });

const server = app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port} (db: ${config.dbFile})`);
});

function shutdown(signal: string) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
